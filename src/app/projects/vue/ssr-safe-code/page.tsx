import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SsrSafeCodeDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/ssr-safe-code";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 6 sections, 6 cards.
//
// The page is written in three parts; each one is a *_TEXT array here and one
// group in the rail, in the same order as the parts in the content file.
const BROWSER_APIS_TEXT = [
    {
        title: "Where they are allowed",
        href: "#where-they-are-allowed",
        text: (
            <>
                Not in <Mono>setup</Mono>, computed or templates; yes in{" "}
                <Mono>onMounted</Mono> and handlers.
            </>
        ),
    },
    {
        title: "The three guards",
        href: "#the-three-guards",
        text: (
            <>
                <Mono>onMounted</Mono>, <Mono>typeof window</Mono>,{" "}
                <Mono>import.meta.env.SSR</Mono> — and when each fits.
            </>
        ),
    },
];

const LIFECYCLE_TEXT = [
    {
        title: "What runs and what does not",
        href: "#what-runs-and-what-does-not",
        text: (
            <>
                <Mono>setup</Mono> and <Mono>onServerPrefetch</Mono> run; mount,
                update and unmount hooks never do.
            </>
        ),
    },
    {
        title: "What leaks without unmount",
        href: "#what-leaks-without-unmount",
        text: (
            <>
                Timers, listeners and sockets started in <Mono>setup</Mono> leak
                once per request.
            </>
        ),
    },
];

const LIBRARIES_TEXT = [
    {
        title: "Libraries that expect a browser",
        href: "#libraries-that-expect-a-browser",
        text: (
            <>
                Dynamic import in <Mono>onMounted</Mono>, or gate the subtree
                behind a mounted flag.
            </>
        ),
    },
    {
        title: "A review checklist",
        href: "#a-review-checklist",
        text: (
            <>
                Six recurring mistakes, and the one question that catches them.
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

const BROWSER_APIS: SummaryArticle[] = BROWSER_APIS_TEXT.map(withSeverities);
const LIFECYCLE: SummaryArticle[] = LIFECYCLE_TEXT.map(withSeverities);
const LIBRARIES: SummaryArticle[] = LIBRARIES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("ssr-safe-code");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Browser-only APIs", items: BROWSER_APIS },
                        { label: "Lifecycle on the server", items: LIFECYCLE },
                        { label: "Libraries and review", items: LIBRARIES },
                    ]}
                />
            }
        >
            {/* Same arrangement as the hydration page: no DemoFrame and no
                "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · SSR
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <SsrSafeCodeDocs />
            </article>
        </PageShell>
    );
}
