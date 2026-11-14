import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    HydrationDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/hydration";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 6 sections, 6 cards.
//
// The page is written in three parts; each one is a *_TEXT array here and one
// group in the rail, in the same order as the parts in the content file.
const TAKING_OVER_TEXT = [
    {
        title: "Adopting instead of rebuilding",
        href: "#adopting-instead-of-rebuilding",
        text: (
            <>
                <Mono>createSSRApp</Mono> walks the server DOM and attaches
                behaviour; it does not verify it.
            </>
        ),
    },
];

const MISMATCHES_TEXT = [
    {
        title: "What a mismatch costs",
        href: "#what-a-mismatch-costs",
        text: (
            <>
                A warning in dev, silence in production, and the subtree rendered
                twice.
            </>
        ),
    },
    {
        title: "What causes one",
        href: "#what-causes-one",
        text: (
            <>
                Different inputs on the two sides; invalid nesting is rewritten by
                the parser.
            </>
        ),
    },
];

const WORKING_TEXT = [
    {
        title: "Finding the cause",
        href: "#finding-the-cause",
        text: (
            <>
                Compare view-source with Elements; disable JavaScript to see the
                server render.
            </>
        ),
    },
    {
        title: "Delaying hydration",
        href: "#delaying-hydration",
        text: (
            <>
                <Mono>hydrateOnVisible</Mono>, <Mono>OnIdle</Mono>,{" "}
                <Mono>OnInteraction</Mono>, <Mono>OnMediaQuery</Mono> for async
                components.
            </>
        ),
    },
    {
        title: "Keeping both renders equal",
        href: "#keeping-both-renders-equal",
        text: <>One rule and four habits that prevent mismatches.</>,
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

const TAKING_OVER: SummaryArticle[] = TAKING_OVER_TEXT.map(withSeverities);
const MISMATCHES: SummaryArticle[] = MISMATCHES_TEXT.map(withSeverities);
const WORKING: SummaryArticle[] = WORKING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("hydration");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Taking over the DOM", items: TAKING_OVER },
                        { label: "Mismatches", items: MISMATCHES },
                        { label: "Debugging and delaying", items: WORKING },
                    ]}
                />
            }
        >
            {/* Same arrangement as the how-ssr-works page: no DemoFrame and no
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

                <HydrationDocs />
            </article>
        </PageShell>
    );
}
