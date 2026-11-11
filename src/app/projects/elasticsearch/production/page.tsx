import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ProductionDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/production";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "say it right — english", which always renders last and is
// deliberately NOT in the rail: it rehearses the page above rather than adding
// an idea to it.
const SIZING_TEXT = [
    {
        title: "Shard sizing",
        href: "#shard-sizing-the-two-failure-directions",
        text: (
            <>
                10–50 GB per shard at mature size; under that, one shard —
                oversharding buys coordination, not speed.
            </>
        ),
    },
    {
        title: "Nodes",
        href: "#nodes-what-one-is-how-it-dies",
        text: (
            <>
                A node is one running process. One server is a cluster of one,
                and heap is what usually kills it.
            </>
        ),
    },
    {
        title: "Replicas",
        href: "#replicas-surviving-node-loss",
        text: (
            <>
                A copy is promoted automatically; with{" "}
                <Mono>replicas: 0</Mono> the shard is simply gone.
            </>
        ),
    },
];

const DIAGNOSIS_TEXT = [
    {
        title: "Cluster health",
        href: "#cluster-health-the-colors-and-the-why",
        text: (
            <>
                The colour is a shard allocation summary —{" "}
                <Mono>allocation/explain</Mono> gives the reason behind it.
            </>
        ),
    },
    {
        title: "The slowlog",
        href: "#finding-slow-queries-the-slowlog",
        text: (
            <>
                Off by default, dynamic per index — and it logs the full query
                body, not just a duration.
            </>
        ),
    },
    {
        title: "profile: true",
        href: "#profile-from-total-to-guilty-clause",
        text: (
            <>
                Times every clause separately; read proportions, and a tiny tree
                means the fetch phase is to blame.
            </>
        ),
    },
];

const CHECKLIST_TEXT = [
    {
        title: "The mistakes checklist",
        href: "#the-mistakes-checklist",
        text: (
            <>
                Every trap in the project, grouped by when it is made — mapping,
                query, write, sync.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof SIZING_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const SIZING: SummaryArticle[] = SIZING_TEXT.map(withSeverities);
const DIAGNOSIS: SummaryArticle[] = DIAGNOSIS_TEXT.map(withSeverities);
const CHECKLIST: SummaryArticle[] = CHECKLIST_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("production");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Sizing & Survival", items: SIZING },
                        { label: "Diagnosis", items: DIAGNOSIS },
                        { label: "The Checklist", items: CHECKLIST },
                    ]}
                />
            }
        >
            {/* No DemoFrame and no PlanPage: Elasticsearch runs on a server, so this
                page has no live demo to frame and no client boundary. The header is
                inlined with the same markup its siblings use, so the page keeps the
                rhythm of the other elasticsearch pages — every fragment is
                introduced and explained by its own DocSection instead of a
                whole-module source panel. Heading and subtitle come from the
                registry, so this page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        elasticsearch · in an app
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <ProductionDocs />
            </article>
        </PageShell>
    );
}
