import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    AggregationsDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/aggregations";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "say it right — english", which always renders last and is
// deliberately NOT in the rail: it rehearses the page above rather than adding
// an idea to it.
//
// A section appended to a part gets one more card at the end of that part's
// array here, and nothing else changes.
const IDEA_TEXT = [
    {
        title: "What aggregations are",
        href: "#what-aggregations-are",
        text: (
            <>
                Group by value, count per group — what returns is{" "}
                <Mono>buckets</Mono>, not documents.
            </>
        ),
    },
];

const FAMILIES_TEXT = [
    {
        title: "terms: the facet agg",
        href: "#terms-the-facet-agg",
        text: (
            <>
                The <Mono>buckets</Mono> array IS the facet UI — top-N only, and{" "}
                <Mono>keyword</Mono> fields only.
            </>
        ),
    },
    {
        title: "metrics: compute a number",
        href: "#metrics-compute-a-number",
        text: (
            <>
                <Mono>avg</Mono>/<Mono>min</Mono>/<Mono>max</Mono>/<Mono>sum</Mono>{" "}
                return <Mono>value</Mono>, not buckets; <Mono>stats</Mono> does all
                at once.
            </>
        ),
    },
    {
        title: "Intervals: histogram & range",
        href: "#intervals-histogram-and-range",
        text: (
            <>
                Regular steps → <Mono>histogram</Mono>; hand-picked bands →{" "}
                <Mono>range</Mono>. Both half-open.
            </>
        ),
    },
];

const COMPOSING_TEXT = [
    {
        title: "Sub-aggregations",
        href: "#sub-aggregations-a-metric-per-bucket",
        text: (
            <>
                The bucket agg is the <Mono>GROUP BY</Mono>, the sub-agg is what to
                compute per group — and it recurses.
            </>
        ),
    },
    {
        title: "Aggregating nested fields",
        href: "#aggregating-nested-fields",
        text: (
            <>
                Without a <Mono>nested</Mono> agg the facet is silently empty — and
                its counts are genre entries, not movies.
            </>
        ),
    },
];

const IN_APP_TEXT = [
    {
        title: "Faceted search: one request",
        href: "#faceted-search-one-request",
        text: (
            <>
                Aggs run over the query&apos;s matching set, so hits and sidebar
                counts always agree — one pass.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof IDEA_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const IDEA: SummaryArticle[] = IDEA_TEXT.map(withSeverities);
const FAMILIES: SummaryArticle[] = FAMILIES_TEXT.map(withSeverities);
const COMPOSING: SummaryArticle[] = COMPOSING_TEXT.map(withSeverities);
const IN_APP: SummaryArticle[] = IN_APP_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("aggregations");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The Idea", items: IDEA },
                        { label: "The Two Families", items: FAMILIES },
                        { label: "Composing", items: COMPOSING },
                        { label: "In the App", items: IN_APP },
                    ]}
                />
            }
        >
            {/* No DemoFrame: Elasticsearch runs on a server, so this page has no live
                demo to frame and no client boundary. The header DemoFrame would
                otherwise supply is inlined with the same markup, so the page keeps
                the rhythm of the redis pages — every fragment is introduced and
                explained by its own DocSection instead of a whole-module source panel.
                Heading and subtitle come from the registry, so this page, its
                sidebar row and its landing card can never drift. */}
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

                <AggregationsDocs />
            </article>
        </PageShell>
    );
}
