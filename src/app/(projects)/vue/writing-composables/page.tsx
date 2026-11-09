import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    WritingComposablesDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/writing-composables";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 5 sections, 5 cards.
const MIXINS_TEXT = [
    {
        title: "From mixins to composables",
        href: "#from-mixins-to-composables",
        text: (
            <>
                A plain function returning refs; visible origin, no clashes, real
                parameters.
            </>
        ),
    },
];

const CONVENTIONS_TEXT = [
    {
        title: "The conventions",
        href: "#the-conventions",
        text: (
            <>
                <Mono>use</Mono>-prefix, top-level call, return refs, clean up after
                yourself.
            </>
        ),
    },
    {
        title: "Arguments: value, ref or getter",
        href: "#arguments-value-ref-or-getter",
        text: (
            <>
                <Mono>MaybeRefOrGetter</Mono> + <Mono>toValue</Mono> inside the
                tracked function.
            </>
        ),
    },
];

const SCOPE_TEXT = [
    {
        title: "When a composable is the wrong tool",
        href: "#when-a-composable-is-the-wrong-tool",
        text: (
            <>
                Utils for pure functions, stores for shared state, inline for
                one-offs.
            </>
        ),
    },
    {
        title: "Composable or module file",
        href: "#composable-or-module-file",
        text: (
            <>
                Module refs are one shared state; composable refs are created per
                call.
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

const MIXINS: SummaryArticle[] = MIXINS_TEXT.map(withSeverities);
const CONVENTIONS: SummaryArticle[] = CONVENTIONS_TEXT.map(withSeverities);
const SCOPE: SummaryArticle[] = SCOPE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("writing-composables");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "From mixins to composables", items: MIXINS },
                        { label: "Conventions", items: CONVENTIONS },
                        { label: "When not to write one", items: SCOPE },
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

                <WritingComposablesDocs />
            </article>
        </PageShell>
    );
}
