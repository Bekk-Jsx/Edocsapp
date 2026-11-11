import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    PiniaDevtoolsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/pinia-devtools";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 4 sections, 4 cards.
const INSPECTOR_TEXT = [
    {
        title: "Reading store state",
        href: "#reading-store-state",
        text: (
            <>
                Stores by id with live state and getters; components list the stores
                they use.
            </>
        ),
    },
    {
        title: "Editing state live",
        href: "#editing-state-live",
        text: <>Edit values to reach edge cases; edits stay on the client.</>,
    },
];

const TIMELINE_TEXT = [
    {
        title: "The action timeline",
        href: "#the-action-timeline",
        text: (
            <>
                Actions with arguments and state changes in order; direct assignments
                are unnamed.
            </>
        ),
    },
    {
        title: "Time travel",
        href: "#time-travel",
        text: <>Restore an earlier state; only tracked state comes back.</>,
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
const TIMELINE: SummaryArticle[] = TIMELINE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("pinia-devtools");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The store inspector", items: INSPECTOR },
                        { label: "Timeline and time travel", items: TIMELINE },
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
                        Vue · State
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <PiniaDevtoolsDocs />
            </article>
        </PageShell>
    );
}
