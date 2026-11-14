import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SourceMapsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/source-maps";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 4 sections, 4 cards.
//
// The page is written in two parts; each one is a *_TEXT array here and one
// group in the rail, in the same order as the parts in the content file.
const WHAT_TEXT = [
    {
        title: "Mapping generated code back",
        href: "#mapping-generated-code-back",
        text: (
            <>
                A side file maps generated positions to original files and names.
            </>
        ),
    },
    {
        title: "Maps in development",
        href: "#maps-in-development",
        text: (
            <>
                Breakpoints in the original; the compiled file shows the render
                function.
            </>
        ),
    },
];

const PRODUCTION_TEXT = [
    {
        title: "The four options",
        href: "#the-four-options",
        text: (
            <>
                <Mono>false</Mono>, <Mono>true</Mono>, <Mono>hidden</Mono>,{" "}
                <Mono>inline</Mono> — and what each exposes.
            </>
        ),
    },
    {
        title: "Hidden maps and error tracking",
        href: "#hidden-maps-and-error-tracking",
        text: (
            <>
                Upload maps, don&apos;t deploy them; releases must match.
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

const WHAT: SummaryArticle[] = WHAT_TEXT.map(withSeverities);
const PRODUCTION: SummaryArticle[] = PRODUCTION_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("source-maps");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "What a source map is", items: WHAT },
                        { label: "Production builds", items: PRODUCTION },
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

                <SourceMapsDocs />
            </article>
        </PageShell>
    );
}
