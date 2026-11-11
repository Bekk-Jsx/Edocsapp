import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    DocumentsIndicesDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/documents-indices";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "say it right — english", which always renders last and is
// deliberately NOT in the rail: it rehearses the page above rather than adding
// an idea to it.
const DOCUMENTS_TEXT = [
    {
        title: "Document CRUD",
        href: "#document-crud",
        text: (
            <>
                Indexing a used id is a full replace, <Mono>update</Mono> merges but
                still rewrites, and a get by id skips search entirely.
            </>
        ),
    },
    {
        title: "Bulk: the wire format",
        href: "#bulk-the-wire-format",
        text: (
            <>
                NDJSON, not JSON: an action line and a source line per document, and
                a body that must end with a newline.
            </>
        ),
    },
    {
        title: "Bulk: 200 but failed",
        href: "#bulk-200-but-failed",
        text: (
            <>
                The request succeeds while documents inside it fail —{" "}
                <Mono>result.errors</Mono> is the only signal you get.
            </>
        ),
    },
    {
        title: "helpers.bulk",
        href: "#helpers-bulk-the-production-way",
        text: (
            <>
                Give it raw documents and an <Mono>onDocument</Mono>; it batches,
                retries the 429s, and reports drops.
            </>
        ),
    },
    {
        title: "Batch sizing & 429",
        href: "#batch-sizing-429",
        text: (
            <>
                Size by payload — 5 to 15MB — and treat{" "}
                <Mono>429</Mono> as backpressure to back off from, not a queue to
                enlarge.
            </>
        ),
    },
];

const INDICES_TEXT = [
    {
        title: "Refresh, explained",
        href: "#refresh-explained",
        text: (
            <>
                Writes land in a buffer that a refresh turns into a searchable
                segment — every second, or on demand in tests.
            </>
        ),
    },
    {
        title: "Imports: refresh off",
        href: "#imports-switch-refresh-off",
        text: (
            <>
                <Mono>refresh_interval: -1</Mono> for the import, restore it after,
                and refresh once by hand — or search stays stale.
            </>
        ),
    },
    {
        title: "Index lifecycle",
        href: "#index-lifecycle",
        text: (
            <>
                Create explicitly with mappings instead of letting a first document
                guess them; deleting is instant, and here it is routine.
            </>
        ),
    },
    {
        title: "Aliases",
        href: "#aliases",
        text: (
            <>
                The app talks to a pointer, so a new index can take over in one
                atomic swap — a mapping change with no downtime.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof DOCUMENTS_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const DOCUMENTS: SummaryArticle[] = DOCUMENTS_TEXT.map(withSeverities);
const INDICES: SummaryArticle[] = INDICES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("documents-indices");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Documents", items: DOCUMENTS },
                        { label: "Indices", items: INDICES },
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

                <DocumentsIndicesDocs />
            </article>
        </PageShell>
    );
}
