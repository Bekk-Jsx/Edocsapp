import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ReadingRepliesDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/reading-replies";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// footer sections, so the rule holds for all nine without exception.
//
// A flat rail, not the grouped one the tutorial pages use: this is a lookup page,
// so the sections are nine independent entries with no parts to divide them into.
const ARTICLES_TEXT = [
    {
        title: "The five reply shapes",
        href: "#the-five-reply-shapes",
        text: (
            <>
                Status, integer, string, nil, array — and the{" "}
                <Mono>(integer)</Mono> marker, the quotes and the numbering are the CLI
                talking, not the data.
            </>
        ),
    },
    {
        title: "When an integer is a count",
        href: "#when-an-integer-is-a-count",
        text: (
            <>
                Usually how many things the command affected — but{" "}
                <Mono>RPUSH</Mono> and <Mono>APPEND</Mono> return the resulting size, and{" "}
                <Mono>0</Mono> is not an error.
            </>
        ),
    },
    {
        title: "When an integer is a yes/no",
        href: "#when-an-integer-is-a-yes-no",
        text: (
            <>
                <Mono>EXISTS</Mono>, <Mono>HEXISTS</Mono>, <Mono>SISMEMBER</Mono>,{" "}
                <Mono>EXPIRE</Mono>, <Mono>PERSIST</Mono>, <Mono>RENAMENX</Mono> report
                what the command did, not what exists.
            </>
        ),
    },
    {
        title: "The TTL integers",
        href: "#the-ttl-integers",
        text: (
            <>
                <Mono>-1</Mono> means the key exists with no expiry, <Mono>-2</Mono> means
                no key — the one distinction a <Mono>(nil)</Mono> from{" "}
                <Mono>GET</Mono> cannot make.
            </>
        ),
    },
    {
        title: "Nil and empty",
        href: "#nil-and-empty",
        text: (
            <>
                A missing single value is <Mono>(nil)</Mono>, a missing collection is
                empty — so an empty reply never tells you whether the key exists.
            </>
        ),
    },
    {
        title: "Status and error replies",
        href: "#status-and-error-replies",
        text: (
            <>
                <Mono>OK</Mono>, <Mono>PONG</Mono>, <Mono>QUEUED</Mono>, and the five
                errors worth recognising on sight — <Mono>WRONGTYPE</Mono> is about the
                key, &quot;not an integer&quot; about its content.
            </>
        ),
    },
    {
        title: "TYPE and encoding replies",
        href: "#type-and-encoding-replies",
        text: (
            <>
                A sorted set reports as <Mono>zset</Mono> and a missing key as{" "}
                <Mono>none</Mono>; <Mono>OBJECT ENCODING</Mono> answers a different
                question.
            </>
        ),
    },
    {
        title: "What node-redis turns these into",
        href: "#what-node-redis-turns-these-into",
        text: (
            <>
                <Mono>null</Mono> for a nil, <Mono>[]</Mono> and <Mono>{"{}"}</Mono> for
                empty, booleans for 1/0 — and <Mono>if (!user)</Mono> never fires for{" "}
                <Mono>hGetAll</Mono>.
            </>
        ),
    },
    {
        title: "Terminology",
        href: "#terminology",
        text: (
            <>
                Redis sends a reply: status, integer, array, null or error. A command that
                did nothing was a no-op.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const ARTICLES: SummaryArticle[] = ARTICLES_TEXT.map((item) => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
}));

export default function Page() {
    const topic = topicBySlug("reading-replies");
    if (!topic) notFound();

    return (
        <PageShell alerts={<SummaryArticles items={ARTICLES} />}>
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
                        redis · replies
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <ReadingRepliesDocs />
            </article>
        </PageShell>
    );
}
