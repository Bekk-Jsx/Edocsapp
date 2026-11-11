import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SearchUxDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/search-ux";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "say it right — english", which always renders last and is
// deliberately NOT in the rail: it rehearses the page above rather than adding
// an idea to it.
const AUTOCOMPLETE_TEXT = [
    {
        title: "Why match isn't enough",
        href: "#autocomplete-why-match-isn-t-enough",
        text: (
            <>
                The index holds complete words, so <Mono>dar</Mono> is no term —
                fuzziness measures edits, not prefixes.
            </>
        ),
    },
    {
        title: "search_as_you_type",
        href: "#search-as-you-type",
        text: (
            <>
                The type builds <Mono>._2gram</Mono>/<Mono>._3gram</Mono> and prefix
                views; <Mono>bool_prefix</Mono> reads them.
            </>
        ),
    },
];

const SUGGEST_TEXT = [
    {
        title: "Suggesters: did you mean",
        href: "#suggesters-did-you-mean",
        text: (
            <>
                The <Mono>phrase</Mono> suggester returns the correction itself —
                and needs a field the mapping actually created.
            </>
        ),
    },
];

const SYNONYM_TEXT = [
    {
        title: "The problem",
        href: "#synonyms-the-problem",
        text: (
            <>
                <Mono>movie</Mono> vs <Mono>film</Mono>: both correct, no shared term
                — the index has to be told.
            </>
        ),
    },
    {
        title: "The two syntaxes",
        href: "#the-two-syntaxes",
        text: (
            <>
                Commas are symmetric equivalence; <Mono>=&gt;</Mono> rewrites left to
                right and never back.
            </>
        ),
    },
];

const WIRING_TEXT = [
    {
        title: "The list lives in settings",
        href: "#where-the-list-lives-settings",
        text: (
            <>
                <Mono>settings.analysis.filter</Mono> holds the pieces — defined is
                not yet active.
            </>
        ),
    },
    {
        title: "Filter into an analyzer",
        href: "#connection-1-filter-into-an-analyzer",
        text: (
            <>
                The <Mono>filter</Mono> array is a pipeline in order —{" "}
                <Mono>lowercase</Mono> before the synonyms.
            </>
        ),
    },
    {
        title: "Field points at it",
        href: "#connection-2-field-points-at-the-analyzer",
        text: (
            <>
                <Mono>analyzer</Mono> for documents, <Mono>search_analyzer</Mono> for
                queries — two moments, two pointers.
            </>
        ),
    },
    {
        title: "Why search_analyzer",
        href: "#why-search-analyzer",
        text: (
            <>
                Same matches either way; only search-time keeps the list editable
                without a reindex.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof AUTOCOMPLETE_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const AUTOCOMPLETE: SummaryArticle[] = AUTOCOMPLETE_TEXT.map(withSeverities);
const SUGGEST: SummaryArticle[] = SUGGEST_TEXT.map(withSeverities);
const SYNONYMS: SummaryArticle[] = SYNONYM_TEXT.map(withSeverities);
const WIRING: SummaryArticle[] = WIRING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("search-ux");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Autocomplete", items: AUTOCOMPLETE },
                        { label: "Did You Mean", items: SUGGEST },
                        { label: "Synonyms", items: SYNONYMS },
                        { label: "Wiring It Up", items: WIRING },
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

                <SearchUxDocs />
            </article>
        </PageShell>
    );
}
