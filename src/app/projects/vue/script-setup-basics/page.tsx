import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ScriptSetupBasicsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/script-setup-basics";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all four without exception: 4 sections, 4 cards.
const SYNTAX_TEXT = [
    {
        title: "Top-level bindings without a return",
        href: "#top-level-bindings-without-a-return",
        text: (
            <>
                The block is the <Mono>setup()</Mono> body; every top-level binding
                reaches the template.
            </>
        ),
    },
];

const COMPONENTS_TEXT = [
    {
        title: "Imported components",
        href: "#imported-components",
        text: (
            <>
                No <Mono>components</Mono> option; typos are compile errors; name from
                the file name.
            </>
        ),
    },
    {
        title: "Dynamic components",
        href: "#dynamic-components",
        text: (
            <>
                <Mono>:is</Mono> takes the component variable; hold it in a{" "}
                <Mono>shallowRef</Mono>.
            </>
        ),
    },
];

const PUBLIC_API_TEXT = [
    {
        title: "Closed by default",
        href: "#closed-by-default",
        text: (
            <>
                Parent refs see nothing; open members with <Mono>defineExpose</Mono>.
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

const SYNTAX: SummaryArticle[] = SYNTAX_TEXT.map(withSeverities);
const COMPONENTS: SummaryArticle[] = COMPONENTS_TEXT.map(withSeverities);
const PUBLIC_API: SummaryArticle[] = PUBLIC_API_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("script-setup-basics");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The <script setup> syntax", items: SYNTAX },
                        { label: "Using components", items: COMPONENTS },
                        { label: "Closed by default", items: PUBLIC_API },
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

                <ScriptSetupBasicsDocs />
            </article>
        </PageShell>
    );
}
