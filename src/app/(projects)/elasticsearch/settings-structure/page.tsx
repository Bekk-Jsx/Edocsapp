import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SettingsStructureDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/settings-structure";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// "say it right — english" footer: it is a structural reference, like its sibling
// Queries Structure, so there is no narrative to rehearse in english at the end.
const TWO_HALVES_TEXT = [
    {
        title: "The two halves",
        href: "#the-two-halves-of-an-index",
        text: (
            <>
                Describes a field → <Mono>mappings</Mono>; describes machinery →{" "}
                <Mono>settings</Mono>. An analyzer needs both.
            </>
        ),
    },
];

const FLAT_KNOBS_TEXT = [
    {
        title: "number_of_shards",
        href: "#flat-knob-number-of-shards",
        text: (
            <>
                A day-one capacity bet: <Mono>hash(_id) % N</Mono> is baked into
                every document, so N can never change.
            </>
        ),
    },
    {
        title: "number_of_replicas",
        href: "#flat-knob-number-of-replicas",
        text: (
            <>
                Copies buy reads and cost writes and disk — and a replica can
                answer a search from the older document.
            </>
        ),
    },
    {
        title: "refresh_interval & max_result_window",
        href: "#flat-knobs-refresh-interval-and-max-result-window",
        text: (
            <>
                The searchable cadence and the <Mono>from + size</Mono> ceiling;
                the <Mono>index.</Mono> prefix has three spellings.
            </>
        ),
    },
];

const LIFECYCLE_TEXT = [
    {
        title: "Static vs dynamic",
        href: "#static-vs-dynamic",
        text: (
            <>
                Static settings shaped how data was written, dynamic ones shape
                behaviour from now on — hence <Mono>not updateable</Mono>.
            </>
        ),
    },
    {
        title: "The close/open exception",
        href: "#the-close-open-exception",
        text: (
            <>
                Analysis is editable on a closed index — safe for search-time
                pieces only, and <Mono>_close</Mono> is index-wide.
            </>
        ),
    },
];

const ANALYSIS_TEXT = [
    {
        title: "The shelf system",
        href: "#the-analysis-box-the-shelf-system",
        text: (
            <>
                Four shelves of definitions you name; only an{" "}
                <Mono>analyzer</Mono> label ever crosses into mappings.
            </>
        ),
    },
    {
        title: "char_filter",
        href: "#shelf-char-filter",
        text: (
            <>
                Runs on the raw string before any splitting — the only stage that
                can join <Mono>Spider-Man</Mono> into one word.
            </>
        ),
    },
    {
        title: "tokenizer",
        href: "#shelf-tokenizer",
        text: (
            <>
                Required, and a single name rather than an array —{" "}
                <Mono>standard</Mono> covers nearly everything.
            </>
        ),
    },
    {
        title: "filter",
        href: "#shelf-filter",
        text: (
            <>
                Terms changed, multiplied or deleted; the array is an execution
                order, and it is not <Mono>bool.filter</Mono>.
            </>
        ),
    },
    {
        title: "analyzer",
        href: "#shelf-analyzer",
        text: (
            <>
                Char filters, one tokenizer, filters — an assembly of the other
                shelves, and the same pipeline runs on both sides.
            </>
        ),
    },
];

const IN_PRACTICE_TEXT = [
    {
        title: "Reading & changing",
        href: "#reading-changing-in-practice",
        text: (
            <>
                Defaults are invisible until{" "}
                <Mono>?include_defaults=true</Mono> — the four moves, read, reveal,
                change, create.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof TWO_HALVES_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const TWO_HALVES: SummaryArticle[] = TWO_HALVES_TEXT.map(withSeverities);
const FLAT_KNOBS: SummaryArticle[] = FLAT_KNOBS_TEXT.map(withSeverities);
const LIFECYCLE: SummaryArticle[] = LIFECYCLE_TEXT.map(withSeverities);
const ANALYSIS: SummaryArticle[] = ANALYSIS_TEXT.map(withSeverities);
const IN_PRACTICE: SummaryArticle[] = IN_PRACTICE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("settings-structure");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The Two Halves", items: TWO_HALVES },
                        { label: "The Flat Knobs", items: FLAT_KNOBS },
                        { label: "What Can Change", items: LIFECYCLE },
                        { label: "The Analysis Box", items: ANALYSIS },
                        { label: "In Practice", items: IN_PRACTICE },
                    ]}
                />
            }
        >
            {/* No DemoFrame and no PlanPage: Elasticsearch runs on a server, so this
                page has no live demo to frame and no client boundary. The header is
                inlined with the same markup its sibling Queries Structure uses, so
                the page keeps the rhythm of the other elasticsearch pages — every
                fragment is introduced and explained by its own DocSection instead
                of a whole-module source panel. Heading and subtitle come from the
                registry, so this page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        elasticsearch · structure
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <SettingsStructureDocs />
            </article>
        </PageShell>
    );
}
