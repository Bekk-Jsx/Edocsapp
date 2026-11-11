import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    MappingsAnalysisDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/mappings-analysis";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "say it right — english", which always renders last and is
// deliberately NOT in the rail: it rehearses the page above rather than adding
// an idea to it.
const FIELD_TYPES_TEXT = [
    {
        title: "text vs keyword",
        href: "#text-vs-keyword",
        text: (
            <>
                <Mono>text</Mono> is analyzed into terms and matched inside;{" "}
                <Mono>keyword</Mono> is one exact term you filter, sort and
                aggregate on.
            </>
        ),
    },
    {
        title: "The .keyword sub-field",
        href: "#the-keyword-sub-field",
        text: (
            <>
                Dynamic mapping indexes a string twice, so the suffix is a{" "}
                <Mono>path</Mono> in the mapping — never a property of a type.
            </>
        ),
    },
];

const ANALYSIS_TEXT = [
    {
        title: "Analyzers and _analyze",
        href: "#analyzers-and-analyze",
        text: (
            <>
                Char filters, one tokenizer, then token filters — and{" "}
                <Mono>_analyze</Mono> shows the terms instead of guessing them.
            </>
        ),
    },
    {
        title: "The english analyzer",
        href: "#the-english-analyzer",
        text: (
            <>
                Stopwords out, words stemmed to a root — and the query is stemmed
                the same way, so both sides meet on one term.
            </>
        ),
    },
    {
        title: "Custom analyzers",
        href: "#custom-analyzers",
        text: (
            <>
                Composed in the index <Mono>settings</Mono> and named from the
                mapping; verify with <Mono>_analyze</Mono> before indexing.
            </>
        ),
    },
];

const OBJECTS_TEXT = [
    {
        title: "The flattening problem",
        href: "#object-arrays-the-flattening-problem",
        text: (
            <>
                A default object array becomes parallel leaf arrays, so a query for
                a pair that never existed still matches.
            </>
        ),
    },
    {
        title: "Nested objects",
        href: "#nested-separate-hidden-documents",
        text: (
            <>
                <Mono>type: nested</Mono> indexes each object as a hidden document —
                pairing kept, at the cost of a wrapper on every query.
            </>
        ),
    },
    {
        title: "When NOT to nest",
        href: "#when-not-to-use-nested",
        text: (
            <>
                One movie can become 21 Lucene documents; if you never query two
                fields of one object together, flat arrays are cheaper.
            </>
        ),
    },
];

const CHANGING_TEXT = [
    {
        title: "Mappings can't change",
        href: "#mappings-can-t-change",
        text: (
            <>
                A type change is a <Mono>400</Mono> — the values are already in the
                segments. <Mono>PUT /_mapping</Mono> is additive only.
            </>
        ),
    },
    {
        title: "_reindex + alias swap",
        href: "#reindex-alias-swap",
        text: (
            <>
                Copy into the new mapping, check <Mono>failures</Mono> like a bulk,
                then move the alias in one atomic request.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof FIELD_TYPES_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const FIELD_TYPES: SummaryArticle[] = FIELD_TYPES_TEXT.map(withSeverities);
const ANALYSIS: SummaryArticle[] = ANALYSIS_TEXT.map(withSeverities);
const OBJECTS: SummaryArticle[] = OBJECTS_TEXT.map(withSeverities);
const CHANGING: SummaryArticle[] = CHANGING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("mappings-analysis");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Field Types", items: FIELD_TYPES },
                        { label: "Analysis", items: ANALYSIS },
                        { label: "Objects & Nested", items: OBJECTS },
                        { label: "Changing a Mapping", items: CHANGING },
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
                        elasticsearch · foundations
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <MappingsAnalysisDocs />
            </article>
        </PageShell>
    );
}
