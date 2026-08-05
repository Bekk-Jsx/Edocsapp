import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ListsDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/lists";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "the same commands in Node", which always renders last and is
// deliberately NOT in the rail: it restates the CLI above rather than adding an idea.
const SHAPE_TEXT = [
    {
        title: "Ordered, and open at both ends",
        href: "#ordered-and-open-at-both-ends",
        text: (
            <>
                An ordered sequence of strings, pushed and popped at either end —{" "}
                <Mono>LPUSH</Mono> works on the head, so it reverses what you type.
            </>
        ),
    },
    {
        title: "Array or linked list?",
        href: "#array-or-linked-list",
        text: (
            <>
                Ordered and indexed like an array, but stored as a linked list: the ends
                are O(1) and the middle is walked.
            </>
        ),
    },
    {
        title: "There is no create, and no empty list",
        href: "#there-is-no-create-and-no-empty-list",
        text: (
            <>
                <Mono>RPUSH</Mono> creates the key and the last pop deletes it — an empty
                list and a missing key are the same state.
            </>
        ),
    },
    {
        title: "LRANGE",
        href: "#lrange",
        text: (
            <>
                <Mono>0 -1</Mono> is the whole list, <Mono>-1</Mono> is the last element,
                and an out-of-range window returns what exists.
            </>
        ),
    },
];

const POP_TEXT = [
    {
        title: "LPOP and RPOP",
        href: "#lpop-and-rpop",
        text: (
            <>
                A pop removes <em>and</em> returns, so the element is yours — and{" "}
                <Mono>(nil)</Mono> covers both empty and missing.
            </>
        ),
    },
    {
        title: "Queue versus stack",
        href: "#queue-versus-stack",
        text: (
            <>
                <Mono>RPUSH</Mono> + <Mono>LPOP</Mono> is FIFO, <Mono>RPUSH</Mono> +{" "}
                <Mono>RPOP</Mono> is LIFO — the commands decide, not the list.
            </>
        ),
    },
    {
        title: "Popping in batches",
        href: "#popping-in-batches",
        text: (
            <>
                <Mono>LPOP q 2</Mono> takes a count, so a worker grabs a batch of jobs in
                one round trip.
            </>
        ),
    },
    {
        title: "LLEN",
        href: "#llen",
        text: (
            <>
                O(1) at any length because Redis stores the count — cheap enough to be your
                queue-depth metric.
            </>
        ),
    },
];

const CAPPED_TEXT = [
    {
        title: "LTRIM",
        href: "#ltrim",
        text: (
            <>
                <Mono>LRANGE</Mono> reads a window; <Mono>LTRIM</Mono> makes the list{" "}
                <em>become</em> it. There is no <Mono>RTRIM</Mono> — the range covers both
                ends.
            </>
        ),
    },
    {
        title: "The capped-list pattern",
        href: "#the-capped-list-pattern",
        text: (
            <>
                <Mono>LPUSH</Mono> then <Mono>LTRIM 0 99</Mono> keeps the last 100 with the
                newest at index 0 — and an untrimmed list only grows.
            </>
        ),
    },
];

const BLOCKING_TEXT = [
    {
        title: "BRPOP",
        href: "#brpop",
        text: (
            <>
                Returns immediately if there is an element, otherwise waits; the reply names
                the key as well as the value, and the last argument is a timeout.
            </>
        ),
    },
    {
        title: "What it replaces",
        href: "#what-it-replaces",
        text: (
            <>
                Polling costs a request per second and up to a second of delay; blocking
                costs one request and wakes on the push.
            </>
        ),
    },
    {
        title: "Blocking blocks the client, not the server",
        href: "#blocking-blocks-the-client-not-the-server",
        text: (
            <>
                A blocked client is idle, not busy — but it can send nothing else, so a
                worker needs its own <Mono>duplicate()</Mono> connection.
            </>
        ),
    },
];

const LIMITS_TEXT = [
    {
        title: "Random access is O(N)",
        href: "#random-access-is-o-n",
        text: (
            <>
                <Mono>LINDEX q 5000</Mono> walks there from the nearest end — lists are
                queues and capped feeds, not row 5000 of your data.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof SHAPE_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const SHAPE: SummaryArticle[] = SHAPE_TEXT.map(withSeverities);
const POP: SummaryArticle[] = POP_TEXT.map(withSeverities);
const CAPPED: SummaryArticle[] = CAPPED_TEXT.map(withSeverities);
const BLOCKING: SummaryArticle[] = BLOCKING_TEXT.map(withSeverities);
const LIMITS: SummaryArticle[] = LIMITS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("lists");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Shape and Creation", items: SHAPE },
                        { label: "Popping, Queues and Stacks", items: POP },
                        { label: "Capped Lists", items: CAPPED },
                        { label: "Blocking Pops", items: BLOCKING },
                        { label: "Limits", items: LIMITS },
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
                        redis · lists
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <ListsDocs />
            </article>
        </PageShell>
    );
}
