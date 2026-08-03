import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    StringsAndCountersDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/strings-and-counters";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "the same commands in Node", which always renders last and is
// deliberately NOT in the rail: it restates the CLI above rather than adding an idea.
const SET_TEXT = [
    {
        title: "NX and XX",
        href: "#nx-and-xx",
        text: (
            <>
                Plain <Mono>SET</Mono> always writes; <Mono>NX</Mono> is conditional on
                absence, <Mono>XX</Mono> on presence, and <Mono>(nil)</Mono> reports a
                no-op.
            </>
        ),
    },
    {
        title: "Why NX matters: atomicity",
        href: "#why-nx-matters-atomicity",
        text: (
            <>
                <Mono>EXISTS</Mono> then <Mono>SET</Mono> leaves a gap two clients can both
                walk through — one command means exactly one <Mono>OK</Mono>.
            </>
        ),
    },
    {
        title: "The one-line lock",
        href: "#the-one-line-lock",
        text: (
            <>
                <Mono>SET k v NX EX 30</Mono> acquires and sets the deadline at once; as two
                commands, a crash between them leaves the lock permanent.
            </>
        ),
    },
    {
        title: "EXPIRE versus DEL",
        href: "#expire-versus-del",
        text: (
            <>
                <Mono>DEL</Mono> is an action taken now; <Mono>EXPIRE</Mono> is a deadline
                Redis enforces later, reversible with <Mono>PERSIST</Mono>.
            </>
        ),
    },
    {
        title: "The GET option",
        href: "#the-get-option",
        text: (
            <>
                <Mono>SET k v GET</Mono> returns the old value while writing the new one —
                one round trip, no gap for another client.
            </>
        ),
    },
    {
        title: "KEEPTTL",
        href: "#keepttl",
        text: (
            <>
                A plain <Mono>SET</Mono> silently drops the expiry; <Mono>KEEPTTL</Mono>{" "}
                replaces the value and leaves the countdown running.
            </>
        ),
    },
];

const COUNTERS_TEXT = [
    {
        title: "INCR",
        href: "#incr",
        text: (
            <>
                Returns the new value, so you increment and read at once — and a missing key
                counts as <Mono>0</Mono>, so there is nothing to create first.
            </>
        ),
    },
    {
        title: "The family",
        href: "#the-family",
        text: (
            <>
                <Mono>INCRBY</Mono>, <Mono>DECR</Mono>, <Mono>DECRBY</Mono>,{" "}
                <Mono>INCRBYFLOAT</Mono> — all atomic, and there is no{" "}
                <Mono>DECRBYFLOAT</Mono>.
            </>
        ),
    },
    {
        title: "The parsing trap",
        href: "#the-parsing-trap",
        text: (
            <>
                The type stays <Mono>string</Mono> and the content is parsed per call, so{" "}
                <Mono>&quot;abc&quot;</Mono> and even <Mono>&quot;10.5&quot;</Mono> error.
            </>
        ),
    },
];

const MULTI_TEXT = [
    {
        title: "MSET and MGET",
        href: "#mset-and-mget",
        text: (
            <>
                One round trip for several keys, and missing keys come back as nil{" "}
                <em>in position</em> so the reply zips back by index.
            </>
        ),
    },
    {
        title: "GETDEL",
        href: "#getdel",
        text: (
            <>
                Reads and consumes in one atomic command — <Mono>GET</Mono> then{" "}
                <Mono>DEL</Mono> would let two clients read the same one-time token.
            </>
        ),
    },
];

const APPEND_TEXT = [
    {
        title: "APPEND",
        href: "#append",
        text: (
            <>
                Adds to the end instead of replacing, returns the new length, and behaves
                like <Mono>SET</Mono> on a missing key — so no branch is needed.
            </>
        ),
    },
];

const BLOB_TEXT = [
    {
        title: "The blob",
        href: "#the-blob",
        text: (
            <>
                Changing one field is a four-step read-modify-write in your application,
                which is exactly how two clients produce a lost update.
            </>
        ),
    },
    {
        title: "The rule",
        href: "#the-rule",
        text: (
            <>
                JSON in a string when the whole document is the unit of access; a structured
                type when you touch fields individually.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof SET_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const SET: SummaryArticle[] = SET_TEXT.map(withSeverities);
const COUNTERS: SummaryArticle[] = COUNTERS_TEXT.map(withSeverities);
const MULTI: SummaryArticle[] = MULTI_TEXT.map(withSeverities);
const APPEND: SummaryArticle[] = APPEND_TEXT.map(withSeverities);
const BLOB: SummaryArticle[] = BLOB_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("strings-and-counters");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "SET and its Options", items: SET },
                        { label: "Counters", items: COUNTERS },
                        { label: "Multi-key and One-shot Reads", items: MULTI },
                        { label: "Append and Length", items: APPEND },
                        { label: "When a JSON Blob is the Wrong Call", items: BLOB },
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
                        redis · strings
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <StringsAndCountersDocs />
            </article>
        </PageShell>
    );
}
