import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    BuiltInComponentsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/built-in-components";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all four without exception: 4 sections, 4 cards.
const TELEPORT_TEXT = [
    {
        title: "Rendering outside the component",
        href: "#rendering-outside-the-component",
        text: (
            <>
                Logically in place, physically under the target; escapes{" "}
                <Mono>overflow</Mono>, <Mono>transform</Mono>, <Mono>z-index</Mono>.
            </>
        ),
    },
];

const KEEP_ALIVE_TEXT = [
    {
        title: "Caching hidden views",
        href: "#caching-hidden-views",
        text: (
            <>
                Cached instances keep their state; <Mono>include</Mono>,{" "}
                <Mono>exclude</Mono> and <Mono>max</Mono> control the cache.
            </>
        ),
    },
];

const ASYNC_TEXT = [
    {
        title: "Loading components on demand",
        href: "#loading-components-on-demand",
        text: (
            <>
                <Mono>defineAsyncComponent</Mono> + <Mono>import()</Mono> → separate
                chunk loaded on first render.
            </>
        ),
    },
];

const TRANSITION_TEXT = [
    {
        title: "Renamed transition classes",
        href: "#renamed-transition-classes",
        text: (
            <>
                <Mono>v-enter</Mono> → <Mono>v-enter-from</Mono>,{" "}
                <Mono>v-leave</Mono> → <Mono>v-leave-from</Mono>;{" "}
                <Mono>TransitionGroup</Mono> has no wrapper.
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

const TELEPORT: SummaryArticle[] = TELEPORT_TEXT.map(withSeverities);
const KEEP_ALIVE: SummaryArticle[] = KEEP_ALIVE_TEXT.map(withSeverities);
const ASYNC: SummaryArticle[] = ASYNC_TEXT.map(withSeverities);
const TRANSITION: SummaryArticle[] = TRANSITION_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("built-in-components");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Teleport", items: TELEPORT },
                        { label: "KeepAlive", items: KEEP_ALIVE },
                        { label: "Async components", items: ASYNC },
                        { label: "Transition", items: TRANSITION },
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

                <BuiltInComponentsDocs />
            </article>
        </PageShell>
    );
}
