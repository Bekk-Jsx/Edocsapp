import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SearchQueriesDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/search-queries";
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
const FULL_TEXT_TEXT = [
    {
        title: "match",
        href: "#match-the-full-text-workhorse",
        text: (
            <>
                Your input is analyzed with the field&apos;s own analyzer, then any
                term is a hit — more terms only score higher.
            </>
        ),
    },
    {
        title: "multi_match",
        href: "#multi-match-searching-several-fields",
        text: (
            <>
                One text across several fields with{" "}
                <Mono>title^3</Mono> boosts — the text written once instead of per
                field.
            </>
        ),
    },
    {
        title: "Merging scores: type",
        href: "#merging-field-scores-type",
        text: (
            <>
                <Mono>best_fields</Mono> keeps the highest field score,{" "}
                <Mono>most_fields</Mono> sums them — same data, different winner.
            </>
        ),
    },
    {
        title: "Fuzziness",
        href: "#fuzziness-surviving-typos",
        text: (
            <>
                <Mono>AUTO</Mono> allows edits that scale with term length, so a
                typo finds the film — and costs some precision.
            </>
        ),
    },
];

const TERM_LEVEL_TEXT = [
    {
        title: "term & terms",
        href: "#term-terms-exact-lookup",
        text: (
            <>
                Nothing is analyzed, so both sides stay raw — right for{" "}
                <Mono>keyword</Mono>, zero hits on <Mono>text</Mono>.
            </>
        ),
    },
    {
        title: "range",
        href: "#range-numbers-and-dates",
        text: (
            <>
                <Mono>gte</Mono>/<Mono>lte</Mono> on numbers and dates, with{" "}
                <Mono>now-30d</Mono> date math instead of computed dates.
            </>
        ),
    },
    {
        title: "exists",
        href: "#exists-presence-not-value",
        text: (
            <>
                Asks only whether a value was indexed: <Mono>null</Mono>,{" "}
                <Mono>[]</Mono> and absent all fail, <Mono>&quot;&quot;</Mono>{" "}
                passes.
            </>
        ),
    },
];

const COMBINING_TEXT = [
    {
        title: "bool: composing a query",
        href: "#bool-composing-a-real-query",
        text: (
            <>
                <Mono>must</Mono>, <Mono>filter</Mono> and <Mono>must_not</Mono>{" "}
                decide who is in the results; <Mono>should</Mono> only reorders.
            </>
        ),
    },
    {
        title: "Query vs filter context",
        href: "#query-context-vs-filter-context",
        text: (
            <>
                Same movies either way — but filter context skips scoring and
                caches, so binary conditions belong there.
            </>
        ),
    },
];

const PAGING_TEXT = [
    {
        title: "from/size and 10k",
        href: "#pagination-from-size-and-the-10k-wall",
        text: (
            <>
                Offset paging sorts everything up to <Mono>from</Mono> and
                discards it, and stops at <Mono>from + size &gt; 10000</Mono>.
            </>
        ),
    },
    {
        title: "search_after",
        href: "#search-after-cursor-pagination",
        text: (
            <>
                A cursor of sort values — constant cost per page, forward only, and
                it needs a unique tiebreaker.
            </>
        ),
    },
    {
        title: "Sorting",
        href: "#sorting",
        text: (
            <>
                A <Mono>sort</Mono> replaces <Mono>_score</Mono> silently, and
                sorting on <Mono>text</Mono> is a <Mono>400</Mono>.
            </>
        ),
    },
];

const RELEVANCE_TEXT = [
    {
        title: "What _score is",
        href: "#what-score-is-bm25",
        text: (
            <>
                BM25 from term frequency, rarity and field length — read it with{" "}
                <Mono>_explain</Mono>, never compare it across queries.
            </>
        ),
    },
    {
        title: "Highlighting",
        href: "#highlighting",
        text: (
            <>
                Each hit gains fragments with the matched terms marked — and it
                marks what actually matched, which a regex cannot.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof FULL_TEXT_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const FULL_TEXT: SummaryArticle[] = FULL_TEXT_TEXT.map(withSeverities);
const TERM_LEVEL: SummaryArticle[] = TERM_LEVEL_TEXT.map(withSeverities);
const COMBINING: SummaryArticle[] = COMBINING_TEXT.map(withSeverities);
const PAGING: SummaryArticle[] = PAGING_TEXT.map(withSeverities);
const RELEVANCE: SummaryArticle[] = RELEVANCE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("search-queries");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Full-Text Queries", items: FULL_TEXT },
                        { label: "Term-Level Queries", items: TERM_LEVEL },
                        { label: "Combining", items: COMBINING },
                        { label: "Paging & Ordering", items: PAGING },
                        { label: "Relevance", items: RELEVANCE },
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

                <SearchQueriesDocs />
            </article>
        </PageShell>
    );
}
