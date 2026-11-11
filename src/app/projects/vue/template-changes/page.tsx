import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    TemplateChangesDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/template-changes";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all four without exception: 4 sections, 4 cards.
const PRIORITY_TEXT = [
    {
        title: "v-if before v-for",
        href: "#v-if-before-v-for",
        text: (
            <>
                <Mono>v-if</Mono> now runs first; filter with a computed or a{" "}
                <Mono>{"<template>"}</Mono> wrapper.
            </>
        ),
    },
];

const FILTERS_TEXT = [
    {
        title: "Filters replaced by functions",
        href: "#filters-replaced-by-functions",
        text: (
            <>
                <Mono>{"{{ x | f }}"}</Mono> → <Mono>{"{{ f(x) }}"}</Mono>; typed,
                imported functions.
            </>
        ),
    },
];

const KEYS_TEXT = [
    {
        title: "key on <template v-for>",
        href: "#key-on-template-v-for",
        text: (
            <>
                One key on the <Mono>{"<template>"}</Mono> tag, not on each child.
            </>
        ),
    },
    {
        title: "Keys on v-if branches",
        href: "#keys-on-v-if-branches",
        text: <>Branches get unique keys automatically; no forced reuse.</>,
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

const PRIORITY: SummaryArticle[] = PRIORITY_TEXT.map(withSeverities);
const FILTERS: SummaryArticle[] = FILTERS_TEXT.map(withSeverities);
const KEYS: SummaryArticle[] = KEYS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("template-changes");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "v-if and v-for", items: PRIORITY },
                        { label: "Filters", items: FILTERS },
                        { label: "Key rules", items: KEYS },
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
                        Vue · Templates &amp; Rendering
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <TemplateChangesDocs />
            </article>
        </PageShell>
    );
}
