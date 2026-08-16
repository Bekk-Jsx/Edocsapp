import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    IntroductionDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/introduction";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "say it right — english", which always renders last and is
// deliberately NOT in the rail: it rehearses the page above rather than adding
// an idea to it.
const HOW_IT_WORKS_TEXT = [
    {
        title: "What Elasticsearch is",
        href: "#what-elasticsearch-is",
        text: (
            <>
                A search engine built on Lucene and spoken to over HTTP — the client
                call and the <Mono>curl</Mono> are the same request.
            </>
        ),
    },
    {
        title: "The inverted index",
        href: "#the-inverted-index",
        text: (
            <>
                Text is tokenized at write time into{" "}
                <Mono>term → [doc ids]</Mono>, so a search is a lookup and an
                intersection, never a scan.
            </>
        ),
    },
    {
        title: "Terminology map",
        href: "#terminology-map",
        text: (
            <>
                index ~ table, document ~ row, field ~ column, mapping ~ schema —
                how everyone speaks, and rough on purpose.
            </>
        ),
    },
];

const WHAT_ITS_FOR_TEXT = [
    {
        title: "Near real-time",
        href: "#near-real-time",
        text: (
            <>
                A document is searchable at the next refresh, not on write — about a
                second, traded for write throughput.
            </>
        ),
    },
    {
        title: "Good at / bad at",
        href: "#what-it-s-good-at-bad-at",
        text: (
            <>
                Relevance, aggregations and read scale; no transactions, and an
                update rewrites the whole document.
            </>
        ),
    },
    {
        title: "Where it sits",
        href: "#where-it-sits-in-this-stack",
        text: (
            <>
                CouchDB is the source of truth and the changes feed drives the index
                — which stays disposable by design.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof HOW_IT_WORKS_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const HOW_IT_WORKS: SummaryArticle[] = HOW_IT_WORKS_TEXT.map(withSeverities);
const WHAT_ITS_FOR: SummaryArticle[] = WHAT_ITS_FOR_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("introduction");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "How It Works", items: HOW_IT_WORKS },
                        { label: "What It's For", items: WHAT_ITS_FOR },
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

                <IntroductionDocs />
            </article>
        </PageShell>
    );
}
