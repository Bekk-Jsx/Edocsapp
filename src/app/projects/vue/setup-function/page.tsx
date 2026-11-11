import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SetupFunctionDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/setup-function";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all five without exception: 5 sections, 5 cards.
const WHY_TEXT = [
    {
        title: "Grouping code by feature",
        href: "#grouping-code-by-feature",
        text: (
            <>
                Options split features by type; <Mono>setup()</Mono> keeps each
                feature together.
            </>
        ),
    },
];

const BASICS_TEXT = [
    {
        title: "Returned bindings",
        href: "#returned-bindings",
        text: (
            <>
                Runs once; return what the template uses; refs unwrap; no{" "}
                <Mono>this</Mono>.
            </>
        ),
    },
];

const LIFECYCLE_TEXT = [
    {
        title: "Lifecycle hook functions",
        href: "#lifecycle-hook-functions",
        text: (
            <>
                <Mono>onMounted</Mono> &amp; co. next to the feature; register before
                any <Mono>await</Mono>.
            </>
        ),
    },
];

const ARGUMENTS_TEXT = [
    {
        title: "The props argument",
        href: "#the-props-argument",
        text: (
            <>
                Reactive props object; read <Mono>props.x</Mono>, never destructure.
            </>
        ),
    },
    {
        title: "The context argument",
        href: "#the-context-argument",
        text: (
            <>
                <Mono>emit</Mono>, <Mono>attrs</Mono>, <Mono>slots</Mono> and{" "}
                <Mono>expose</Mono> instead of <Mono>this.$…</Mono>
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

const WHY: SummaryArticle[] = WHY_TEXT.map(withSeverities);
const BASICS: SummaryArticle[] = BASICS_TEXT.map(withSeverities);
const LIFECYCLE: SummaryArticle[] = LIFECYCLE_TEXT.map(withSeverities);
const ARGUMENTS: SummaryArticle[] = ARGUMENTS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("setup-function");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Why setup()", items: WHY },
                        { label: "setup() basics", items: BASICS },
                        { label: "Lifecycle hooks in setup()", items: LIFECYCLE },
                        { label: "props and context", items: ARGUMENTS },
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
                        Vue · Script Setup
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <SetupFunctionDocs />
            </article>
        </PageShell>
    );
}
