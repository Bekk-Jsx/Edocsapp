import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    QueriesStructureDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/queries-structure";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// "say it right — english" footer: it is a structural reference, so there is no
// narrative to rehearse in english at the end of it.
const REQUEST_BODY_TEXT = [
    {
        title: "The request skeleton",
        href: "#level-1-the-request-skeleton",
        text: (
            <>
                Slots sit side by side: <Mono>query</Mono> decides who matches, the
                rest shape what comes back.
            </>
        ),
    },
];

const INSIDE_QUERY_TEXT = [
    {
        title: "bool: the combiner",
        href: "#level-2-bool-the-combiner",
        text: (
            <>
                Four slots, arrays throughout, and a clause can be another{" "}
                <Mono>bool</Mono> — recursion is how logic composes.
            </>
        ),
    },
    {
        title: "match & multi_match",
        href: "#level-3-match-and-multi-match",
        text: (
            <>
                Options live in the object form only; <Mono>multi_match</Mono> is
                the same parameters plus <Mono>fields</Mono> and <Mono>type</Mono>.
            </>
        ),
    },
    {
        title: "Term-level clauses",
        href: "#level-3-the-term-level-clauses",
        text: (
            <>
                Four clauses, four shapes — and <Mono>exists</Mono> takes the field
                name as a value, not as a key.
            </>
        ),
    },
];

const BEYOND_QUERY_TEXT = [
    {
        title: "aggs & suggest",
        href: "#level-1-again-the-shape-of-aggs-and-suggest",
        text: (
            <>
                A label you invent, a type from Elasticsearch, its parameters — and{" "}
                <Mono>aggs</Mono> nests inside itself.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof REQUEST_BODY_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const REQUEST_BODY: SummaryArticle[] = REQUEST_BODY_TEXT.map(withSeverities);
const INSIDE_QUERY: SummaryArticle[] = INSIDE_QUERY_TEXT.map(withSeverities);
const BEYOND_QUERY: SummaryArticle[] = BEYOND_QUERY_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("queries-structure");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The Request Body", items: REQUEST_BODY },
                        { label: "Inside query", items: INSIDE_QUERY },
                        { label: "Beyond query", items: BEYOND_QUERY },
                    ]}
                />
            }
        >
            {/* No DemoFrame: Elasticsearch runs on a server, so this page has no live
                demo to frame and no client boundary. The header DemoFrame would
                otherwise supply is inlined with the same markup, so the page keeps
                the rhythm of the other elasticsearch pages — every fragment is
                introduced and explained by its own DocSection instead of a
                whole-module source panel. Heading and subtitle come from the
                registry, so this page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        elasticsearch · searching
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <QueriesStructureDocs />
            </article>
        </PageShell>
    );
}
