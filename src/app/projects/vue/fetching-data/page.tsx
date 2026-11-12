import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    FetchingDataDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/fetching-data";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 6 sections, 6 cards.
const TRAPS_TEXT = [
    {
        title: "fetch resolves on 404",
        href: "#fetch-resolves-on-404",
        text: (
            <>
                Only network failures reject; check <Mono>res.ok</Mono> and throw.
            </>
        ),
    },
    {
        title: "json() returns any",
        href: "#json-returns-any",
        text: (
            <>
                An annotated response is an unchecked claim; the crash lands far from
                the fetch.
            </>
        ),
    },
    {
        title: "Typing the boundary",
        href: "#typing-the-boundary",
        text: (
            <>
                <Mono>res.ok</Mono>, then one claim site, then schema validation or a
                type guard.
            </>
        ),
    },
];

const HELPER_TEXT = [
    {
        title: "A typed helper with a typed error",
        href: "#a-typed-helper-with-a-typed-error",
        text: (
            <>
                <Mono>request&lt;T&gt;</Mono> owns the protocol; <Mono>HttpError</Mono>{" "}
                carries the status for branching.
            </>
        ),
    },
    {
        title: "Endpoint modules",
        href: "#endpoint-modules",
        text: <>One typed module per resource; components know no URLs.</>,
    },
];

const PLACEMENT_TEXT = [
    {
        title: "Component, composable or store",
        href: "#component-composable-or-store",
        text: (
            <>
                Shared or cached data goes in a store; detail data stays in the view.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: {
    title: string;
    href: string;
    text: React.ReactNode;
}): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const TRAPS: SummaryArticle[] = TRAPS_TEXT.map(withSeverities);
const HELPER: SummaryArticle[] = HELPER_TEXT.map(withSeverities);
const PLACEMENT: SummaryArticle[] = PLACEMENT_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("fetching-data");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Two silent traps", items: TRAPS },
                        { label: "One request helper", items: HELPER },
                        { label: "Where the fetch belongs", items: PLACEMENT },
                    ]}
                />
            }
        >
            {/* Same arrangement as the pinia-basics page: no DemoFrame and no
                "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · Networking
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <FetchingDataDocs />
            </article>
        </PageShell>
    );
}
