import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    PiniaBasicsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/pinia-basics";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 6 sections, 6 cards.
const WHY_TEXT = [
    {
        title: "What a reactive module cannot do",
        href: "#what-a-reactive-module-cannot-do",
        text: (
            <>
                Tooling, per-request instances, hooks and resets;{" "}
                <Mono>defineStore</Mono> returns a composable.
            </>
        ),
    },
    {
        title: "Using a store",
        href: "#using-a-store",
        text: (
            <>
                Read state, getters and actions off the store object; no{" "}
                <Mono>.value</Mono>, no mutations.
            </>
        ),
    },
];

const OPTION_STORES_TEXT = [
    {
        title: "state, getters and actions",
        href: "#state-getters-and-actions",
        text: (
            <>
                <Mono>data</Mono>/<Mono>computed</Mono>/<Mono>methods</Mono> as store
                options; <Mono>$reset</Mono> for free.
            </>
        ),
    },
    {
        title: "Typing a store",
        href: "#typing-a-store",
        text: (
            <>
                Annotate <Mono>null</Mono> and empty state; <Mono>this</Mono>-getters
                need a return type.
            </>
        ),
    },
];

const OUTSIDE_TEXT = [
    {
        title: "Stores in guards and modules",
        href: "#stores-in-guards-and-modules",
        text: (
            <>
                Call <Mono>useStore()</Mono> inside the function, never at module
                load.
            </>
        ),
    },
];

const VS_VUEX_TEXT = [
    {
        title: "Pinia vs Vuex",
        href: "#pinia-vs-vuex",
        text: (
            <>
                No mutations, no <Mono>commit</Mono>/<Mono>dispatch</Mono>, no
                namespaced modules; typed by default.
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

const WHY: SummaryArticle[] = WHY_TEXT.map(withSeverities);
const OPTION_STORES: SummaryArticle[] = OPTION_STORES_TEXT.map(withSeverities);
const OUTSIDE: SummaryArticle[] = OUTSIDE_TEXT.map(withSeverities);
const VS_VUEX: SummaryArticle[] = VS_VUEX_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("pinia-basics");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Why a store library", items: WHY },
                        { label: "Option stores", items: OPTION_STORES },
                        { label: "Stores outside components", items: OUTSIDE },
                        { label: "Pinia vs Vuex", items: VS_VUEX },
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
                        Vue · State
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <PiniaBasicsDocs />
            </article>
        </PageShell>
    );
}
