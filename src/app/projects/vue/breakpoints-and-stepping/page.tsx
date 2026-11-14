import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    BreakpointsAndSteppingDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/breakpoints-and-stepping";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 7 sections, 7 cards.
//
// The page is written in three parts; each one is a *_TEXT array here and one
// group in the rail, in the same order as the parts in the content file.
const BREAKPOINTS_TEXT = [
    {
        title: "Three ways to pause",
        href: "#three-ways-to-pause",
        text: (
            <>
                <Mono>debugger</Mono>, a line number, or a condition for loops.
            </>
        ),
    },
    {
        title: "Logpoints",
        href: "#logpoints",
        text: <>Printing without pausing and without touching the source.</>,
    },
];

const STEPPING_TEXT = [
    {
        title: "The four controls",
        href: "#the-four-controls",
        text: <>Step over until it breaks, then step into the cause.</>,
    },
    {
        title: "Scope, Call stack and Watch",
        href: "#scope-call-stack-and-watch",
        text: <>Refs live under Closure; the Console runs in the paused frame.</>,
    },
];

const VUE_SPECIFICS_TEXT = [
    {
        title: "Templates are not steppable",
        href: "#templates-are-not-steppable",
        text: <>Break in the computed or the handler instead.</>,
    },
    {
        title: "Why did it re-render?",
        href: "#why-did-it-re-render",
        text: (
            <>
                <Mono>onRenderTriggered</Mono> names the cause;{" "}
                <Mono>onRenderTracked</Mono> lists dependencies.
            </>
        ),
    },
    {
        title: "Async code and the call stack",
        href: "#async-code-and-the-call-stack",
        text: (
            <>
                The stack unwinds at <Mono>await</Mono>; never leave a promise
                un-awaited.
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

const BREAKPOINTS: SummaryArticle[] = BREAKPOINTS_TEXT.map(withSeverities);
const STEPPING: SummaryArticle[] = STEPPING_TEXT.map(withSeverities);
const VUE_SPECIFICS: SummaryArticle[] = VUE_SPECIFICS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("breakpoints-and-stepping");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Setting breakpoints", items: BREAKPOINTS },
                        { label: "Stepping through code", items: STEPPING },
                        { label: "Debugging a Vue app", items: VUE_SPECIFICS },
                    ]}
                />
            }
        >
            {/* Same arrangement as the cors-and-caching page: no DemoFrame and
                no "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
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

                <BreakpointsAndSteppingDocs />
            </article>
        </PageShell>
    );
}
