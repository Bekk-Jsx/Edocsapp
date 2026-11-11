import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    AsyncComposablesDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/async-composables";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 2 sections, 2 cards.
const ASYNC_STATE_TEXT = [
    {
        title: "data, loading, error and refresh",
        href: "#data-loading-error-and-refresh",
        text: (
            <>
                One composable owns the whole async lifecycle; loader as parameter.
            </>
        ),
    },
];

const REACTIVE_SOURCE_TEXT = [
    {
        title: "Re-fetch on change, abort stale runs",
        href: "#re-fetch-on-change-abort-stale-runs",
        text: (
            <>
                <Mono>watch</Mono> + <Mono>toValue</Mono> +{" "}
                <Mono>AbortController</Mono>; only the latest request writes.
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

const ASYNC_STATE: SummaryArticle[] = ASYNC_STATE_TEXT.map(withSeverities);
const REACTIVE_SOURCE: SummaryArticle[] = REACTIVE_SOURCE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("async-composables");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The async state pattern", items: ASYNC_STATE },
                        { label: "Reactive sources", items: REACTIVE_SOURCE },
                    ]}
                />
            }
        >
            {/* Same arrangement as the app-instance page: no DemoFrame and no
                "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · Composables
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <AsyncComposablesDocs />
            </article>
        </PageShell>
    );
}
