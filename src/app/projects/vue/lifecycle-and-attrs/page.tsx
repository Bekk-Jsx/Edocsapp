import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    LifecycleAndAttrsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/lifecycle-and-attrs";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all seven without exception: 7 sections, 7 cards.
const LIFECYCLE_TEXT = [
    {
        title: "Renamed hooks",
        href: "#renamed-hooks",
        text: (
            <>
                <Mono>beforeDestroy</Mono> → <Mono>beforeUnmount</Mono>,{" "}
                <Mono>destroyed</Mono> → <Mono>unmounted</Mono>; old names never run.
            </>
        ),
    },
    {
        title: "updated",
        href: "#updated",
        text: <>After a re-render with the new DOM; never change state in it.</>,
    },
    {
        title: "activated and deactivated",
        href: "#activated-and-deactivated",
        text: (
            <>
                <Mono>KeepAlive</Mono> caches views; these hooks report show and
                hide.
            </>
        ),
    },
    {
        title: "errorCaptured",
        href: "#errorcaptured",
        text: (
            <>
                Catches descendants&apos; errors; return <Mono>false</Mono> to stop
                propagation.
            </>
        ),
    },
];

const FALLTHROUGH_TEXT = [
    {
        title: "inheritAttrs and $attrs",
        // "$" slugs to "-", merged with the surrounding spaces.
        href: "#inheritattrs-and-attrs",
        text: (
            <>
                Undeclared attributes, class, style and listeners fall through; move
                them with <Mono>inheritAttrs: false</Mono> + <Mono>v-bind</Mono>.
            </>
        ),
    },
];

const MULTI_ROOT_TEXT = [
    {
        title: "Multiple root nodes",
        href: "#multiple-root-nodes",
        text: (
            <>
                Fragments keep siblings in the parent&apos;s layout; bind{" "}
                <Mono>$attrs</Mono> explicitly.
            </>
        ),
    },
    {
        title: "Choosing v-bind and inheritAttrs",
        href: "#choosing-v-bind-and-inheritattrs",
        text: <>Three child shapes, when each tool is needed.</>,
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

const LIFECYCLE: SummaryArticle[] = LIFECYCLE_TEXT.map(withSeverities);
const FALLTHROUGH: SummaryArticle[] = FALLTHROUGH_TEXT.map(withSeverities);
const MULTI_ROOT: SummaryArticle[] = MULTI_ROOT_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("lifecycle-and-attrs");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Lifecycle hooks", items: LIFECYCLE },
                        { label: "Fallthrough attributes", items: FALLTHROUGH },
                        { label: "Multi-root components", items: MULTI_ROOT },
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
                        Vue · Components
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <LifecycleAndAttrsDocs />
            </article>
        </PageShell>
    );
}
