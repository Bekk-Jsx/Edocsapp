import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    TemplateRefsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/template-refs";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all four without exception: 4 sections, 4 cards.
const DOM_TEXT = [
    {
        title: "useTemplateRef",
        href: "#usetemplateref",
        text: (
            <>
                <Mono>ref=&quot;name&quot;</Mono> +{" "}
                <Mono>{"useTemplateRef<El>('name')"}</Mono>; replaces{" "}
                <Mono>this.$refs</Mono>.
            </>
        ),
    },
    {
        title: "When a ref is filled",
        href: "#when-a-ref-is-filled",
        text: (
            <>
                <Mono>null</Mono> during setup and when hidden; use after mount.
            </>
        ),
    },
];

const COMPONENT_TEXT = [
    {
        title: "Refs on child components",
        href: "#refs-on-child-components",
        text: (
            <>
                Public instance typed with <Mono>InstanceType</Mono>; only exposed
                members.
            </>
        ),
    },
    {
        title: "Refs inside v-for",
        href: "#refs-inside-v-for",
        text: <>An array of elements, order not guaranteed.</>,
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

const DOM: SummaryArticle[] = DOM_TEXT.map(withSeverities);
const COMPONENT: SummaryArticle[] = COMPONENT_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("template-refs");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "DOM refs", items: DOM },
                        { label: "Component refs", items: COMPONENT },
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

                <TemplateRefsDocs />
            </article>
        </PageShell>
    );
}
