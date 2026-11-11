import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    AtomicityDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/atomicity";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "the same commands in Node", which always renders last and is
// deliberately NOT in the rail: it restates the CLI above rather than adding an idea.
const MECHANISM_TEXT = [
    {
        title: "Single commands need no protection",
        href: "#single-commands-need-no-protection",
        text: (
            <>
                One thread, so nothing interleaves inside a command — <Mono>INCR</Mono>{" "}
                and <Mono>ZINCRBY</Mono> are already safe. <Mono>MULTI</Mono> is for
                GROUPS.
            </>
        ),
    },
    {
        title: "QUEUED, then EXEC",
        href: "#queued-then-exec",
        text: (
            <>
                Nothing runs until <Mono>EXEC</Mono>, which returns one ordinary reply per
                queued command — an array, not a single status.
            </>
        ),
    },
    {
        title: "DISCARD",
        href: "#discard",
        text: (
            <>
                Throws the queue away, and only works before <Mono>EXEC</Mono>. After{" "}
                <Mono>EXEC</Mono> there is nothing to discard.
            </>
        ),
    },
];

const ROLLBACK_TEXT = [
    {
        title: "A failed command does not undo the others",
        href: "#a-failed-command-does-not-undo-the-others",
        text: (
            <>
                The <Mono>INCR</Mono> errors and the <Mono>SET</Mono> stands. Isolation,
                not all-or-nothing — SQL expectations write a bug here.
            </>
        ),
    },
    {
        title: "The one case where nothing runs",
        href: "#the-one-case-where-nothing-runs",
        text: (
            <>
                A queue-time syntax error aborts the block with <Mono>EXECABORT</Mono>; a
                wrong-type error at <Mono>EXEC</Mono> time does not.
            </>
        ),
    },
];

const WATCH_TEXT = [
    {
        title: "Why MULTI alone is not enough",
        href: "#why-multi-alone-is-not-enough",
        text: (
            <>
                <Mono>GET</Mono> inside <Mono>MULTI</Mono> answers <Mono>QUEUED</Mono>, so
                read-then-decide cannot be a plain transaction.
            </>
        ),
    },
    {
        title: "WATCH",
        href: "#watch",
        text: (
            <>
                Marks a key: if anyone changes it before your <Mono>EXEC</Mono>, the{" "}
                <Mono>EXEC</Mono> fails. The <Mono>GET</Mono> runs outside the block.
            </>
        ),
    },
    {
        title: "The failure path",
        href: "#the-failure-path",
        text: (
            <>
                <Mono>EXEC</Mono> answers <Mono>(nil)</Mono> — cancelled, nothing ran. Two
                terminals to see it, and a signal to retry rather than an error.
            </>
        ),
    },
    {
        title: "The retry loop",
        href: "#the-retry-loop",
        text: (
            <>
                Watch, read, decide, <Mono>EXEC</Mono>; <Mono>null</Mono> means go round
                again. Optimistic locking, with <Mono>UNWATCH</Mono> on the early return.
            </>
        ),
    },
    {
        title: "WATCH is per connection",
        href: "#watch-is-per-connection",
        text: (
            <>
                A pooled connection can lose the guarantee silently — the{" "}
                <Mono>EXEC</Mono> succeeds and the check it depended on never applied.
            </>
        ),
    },
];

const PIPELINE_TEXT = [
    {
        title: "Two different problems",
        href: "#two-different-problems",
        text: (
            <>
                Pipelining saves round trips; a transaction prevents interleaving. In
                node-redis both are the same chained builder.
            </>
        ),
    },
    {
        title: "Choosing",
        href: "#choosing",
        text: (
            <>
                Pipeline for independent commands, <Mono>MULTI</Mono> when the group must
                not split, Lua to read and branch inside the server.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof MECHANISM_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const MECHANISM: SummaryArticle[] = MECHANISM_TEXT.map(withSeverities);
const ROLLBACK: SummaryArticle[] = ROLLBACK_TEXT.map(withSeverities);
const WATCH: SummaryArticle[] = WATCH_TEXT.map(withSeverities);
const PIPELINE: SummaryArticle[] = PIPELINE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("atomicity");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "What MULTI Actually Does", items: MECHANISM },
                        { label: "No Rollback", items: ROLLBACK },
                        { label: "WATCH and Optimistic Locking", items: WATCH },
                        { label: "Pipelining is Not a Transaction", items: PIPELINE },
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
                        redis · atomicity
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <AtomicityDocs />
            </article>
        </PageShell>
    );
}
