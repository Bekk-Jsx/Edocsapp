import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    LuaScriptsDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/lua-scripts";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// "the same commands in Node" footer — the Node side is already inline, in the
// script module and the EVALSHA fallback helper, so there is nothing to restate.
const EVAL_TEXT = [
    {
        title: "A script is one command",
        href: "#a-script-is-one-command",
        text: (
            <>
                One thread, nothing interleaves — so read-then-decide is safe with no
                retry. Lua removes the conflict <Mono>WATCH</Mono> detects.
            </>
        ),
    },
    {
        title: "EVAL and numkeys",
        href: "#eval-and-numkeys",
        text: (
            <>
                <Mono>EVAL &lt;script&gt; &lt;numkeys&gt; [keys...] [args...]</Mono> — the
                trailing number is HOW MANY KEYS, not a flag.
            </>
        ),
    },
    {
        title: "KEYS and ARGV",
        href: "#keys-and-argv",
        text: (
            <>
                Keys first, values after, both 1-INDEXED. The split is what lets a
                cluster client route the script.
            </>
        ),
    },
];

const LOCK_TEXT = [
    {
        title: "What a lock is",
        href: "#what-a-lock-is",
        text: (
            <>
                <Mono>SET lock:job1 &quot;worker-a&quot; NX EX 30</Mono> — one winner runs
                the job. Nothing in Redis enforces it; it is a convention.
            </>
        ),
    },
    {
        title: "The bug DEL creates",
        href: "#the-bug-del-creates",
        text: (
            <>
                A&apos;s lock expires, B takes it, A&apos;s <Mono>DEL</Mono> deletes
                B&apos;s. Two workers now run the job the lock existed to protect.
            </>
        ),
    },
    {
        title: "The fix",
        href: "#the-fix",
        text: (
            <>
                Compare the value and delete in one step. The release half of the
                Strings &amp; Counters deadlock and the stampede lock.
            </>
        ),
    },
    {
        title: "The same thing with WATCH, and what it costs",
        href: "#the-same-thing-with-watch-and-what-it-costs",
        text: (
            <>
                Four round trips and a retry loop instead of one hop.{" "}
                <Mono>WATCH</Mono> when the decision must live in your app.
            </>
        ),
    },
];

const CACHE_TEXT = [
    {
        title: "Sending the text every time",
        href: "#sending-the-text-every-time",
        text: (
            <>
                <Mono>SCRIPT LOAD</Mono> returns a SHA and <Mono>EVALSHA</Mono> invokes by
                it — same arguments, no script text on the wire.
            </>
        ),
    },
    {
        title: "NOSCRIPT",
        href: "#noscript",
        text: (
            <>
                The script cache is NOT persistent. A restart or a failover loses the
                hash, and every <Mono>EVALSHA</Mono> fails until you reload.
            </>
        ),
    },
    {
        title: "Managing several scripts",
        href: "#managing-several-scripts",
        text: (
            <>
                Source and hash together in one module, loaded at startup. One helper
                catches <Mono>NOSCRIPT</Mono> and self-heals.
            </>
        ),
    },
];

const LIMITER_TEXT = [
    {
        title: "The whole script",
        href: "#the-whole-script",
        text: (
            <>
                The sliding window from Sorted Sets, which as three commands was broken
                under concurrency. Trim, count, decide, record.
            </>
        ),
    },
    {
        title: "The arguments",
        href: "#the-arguments",
        text: (
            <>
                <Mono>ARGV</Mono> arrives as strings, so <Mono>tonumber</Mono> at the top;{" "}
                <Mono>local</Mono> or Lua makes a global and Redis refuses.
            </>
        ),
    },
    {
        title: "The body",
        href: "#the-body",
        text: (
            <>
                <Mono>ZREMRANGEBYSCORE</Mono>, <Mono>ZCARD</Mono>, then the{" "}
                <Mono>if</Mono> — the one line <Mono>MULTI</Mono> cannot express.
            </>
        ),
    },
];

const RULES_TEXT = [
    {
        title: "Scripts block the server",
        href: "#scripts-block-the-server",
        text: (
            <>
                One command on the single thread: a slow script is a server-wide STALL,
                not a slow request. Keep them short.
            </>
        ),
    },
    {
        title: "Scripts must be deterministic",
        href: "#scripts-must-be-deterministic",
        text: (
            <>
                Never read the clock or roll a value you store. <Mono>now</Mono> is
                passed in as <Mono>ARGV[1]</Mono> for exactly this reason.
            </>
        ),
    },
    {
        title: "All keys must be declared in KEYS",
        href: "#all-keys-must-be-declared-in-keys",
        text: (
            <>
                Declaring keys is ROUTING, not bookkeeping. A hardcoded key name works
                until the day you run a cluster.
            </>
        ),
    },
    {
        title: "A script has no rollback either",
        href: "#a-script-has-no-rollback-either",
        text: (
            <>
                An error mid-script leaves the earlier writes. Atomic means
                UNINTERRUPTED — validate before writing anything.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof EVAL_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const EVAL: SummaryArticle[] = EVAL_TEXT.map(withSeverities);
const LOCK: SummaryArticle[] = LOCK_TEXT.map(withSeverities);
const CACHE: SummaryArticle[] = CACHE_TEXT.map(withSeverities);
const LIMITER: SummaryArticle[] = LIMITER_TEXT.map(withSeverities);
const RULES: SummaryArticle[] = RULES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("lua-scripts");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "EVAL", items: EVAL },
                        { label: "Why: The Safe Lock Release", items: LOCK },
                        { label: "SCRIPT LOAD and EVALSHA", items: CACHE },
                        { label: "The Rate Limiter, Line by Line", items: LIMITER },
                        { label: "Rules and Traps", items: RULES },
                    ]}
                />
            }
        >
            {/* No DemoFrame: Redis runs on a server, so this page has no live demo to
                frame and no client boundary. The header DemoFrame would otherwise
                supply is inlined with the same markup, so the page keeps the rhythm
                of the hooks pages — every fragment is introduced and explained by
                its own DocSection instead of a whole-module source panel.
                Heading and subtitle come from the registry, so this page, its
                sidebar row and its landing card can never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        redis · lua
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <LuaScriptsDocs />
            </article>
        </PageShell>
    );
}
