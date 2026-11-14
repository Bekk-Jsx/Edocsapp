import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    VueDevtoolsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/vue-devtools";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 4 sections, 4 cards.
//
// The page is written in two parts; each one is a *_TEXT array here and one
// group in the rail, in the same order as the parts in the content file.
const INSPECTOR_TEXT = [
    {
        title: "Tree, props and setup state",
        href: "#tree-props-and-setup-state",
        text: (
            <>
                Vue&apos;s instance tree with live props, refs and computed
                results; <Mono>$vm</Mono> in the Console.
            </>
        ),
    },
    {
        title: "Editing state live",
        href: "#editing-state-live",
        text: (
            <>
                Reach edge cases by writing state; edits are client-only and
                props get overwritten.
            </>
        ),
    },
];

const CHOOSING_TEXT = [
    {
        title: "Which panel answers which question",
        href: "#which-panel-answers-which-question",
        text: (
            <>
                Inspector for state, breakpoint for a moment, Network for the
                wire, Pinia for stores.
            </>
        ),
    },
    {
        title: "Timelines and performance",
        href: "#timelines-and-performance",
        text: (
            <>
                Timeline scope varies by version; the Performance panel plus{" "}
                <Mono>app.config.performance</Mono> is the stable route.
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

const INSPECTOR: SummaryArticle[] = INSPECTOR_TEXT.map(withSeverities);
const CHOOSING: SummaryArticle[] = CHOOSING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("vue-devtools");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The component inspector", items: INSPECTOR },
                        { label: "Choosing a tool", items: CHOOSING },
                    ]}
                />
            }
        >
            {/* Same arrangement as the breakpoints-and-stepping page: no
                DemoFrame and no "use client", header inlined, heading and
                summary from the registry so the page, its sidebar row and its
                landing card can never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · Debugging
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <VueDevtoolsDocs />
            </article>
        </PageShell>
    );
}
