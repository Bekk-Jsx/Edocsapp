import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    RenderingUnderTheHoodDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/rendering-under-the-hood";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 2 sections, 2 cards.
const BATCHING_TEXT = [
    {
        title: "Batched updates and nextTick",
        href: "#batched-updates-and-nexttick",
        text: (
            <>
                Changes render once at the end of the tick;{" "}
                <Mono>await nextTick()</Mono> before DOM access.
            </>
        ),
    },
];

const PIPELINE_TEXT = [
    {
        title: "Render function, virtual DOM and patch",
        href: "#render-function-virtual-dom-and-patch",
        text: (
            <>
                Compiled render function → virtual DOM → minimal patch; static parts
                and patch flags skip work.
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

const BATCHING: SummaryArticle[] = BATCHING_TEXT.map(withSeverities);
const PIPELINE: SummaryArticle[] = PIPELINE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("rendering-under-the-hood");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Batched updates", items: BATCHING },
                        { label: "From template to DOM", items: PIPELINE },
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

                <RenderingUnderTheHoodDocs />
            </article>
        </PageShell>
    );
}
