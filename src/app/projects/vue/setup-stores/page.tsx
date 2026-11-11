import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SetupStoresDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/setup-stores";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 4 sections, 4 cards.
const SETUP_FUNCTIONS_TEXT = [
    {
        title: "Stores written like <script setup>",
        href: "#stores-written-like-script-setup",
        text: (
            <>
                refs, computed, functions and watchers in one function; unreturned
                members stay private.
            </>
        ),
    },
    {
        title: "Option or setup store",
        href: "#option-or-setup-store",
        text: (
            <>
                Same capabilities; setup stores allow watchers, composables and
                privacy.
            </>
        ),
    },
];

const STORE_TO_REFS_TEXT = [
    {
        title: "Destructuring a store",
        href: "#destructuring-a-store",
        text: (
            <>
                <Mono>storeToRefs</Mono> keeps state and getters reactive; actions
                come from the store.
            </>
        ),
    },
];

const COMPOSING_TEXT = [
    {
        title: "Stores using stores",
        href: "#stores-using-stores",
        text: (
            <>
                Call the other store&apos;s composable; no <Mono>rootState</Mono>, no
                namespaces.
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

const SETUP_FUNCTIONS: SummaryArticle[] =
    SETUP_FUNCTIONS_TEXT.map(withSeverities);
const STORE_TO_REFS: SummaryArticle[] = STORE_TO_REFS_TEXT.map(withSeverities);
const COMPOSING: SummaryArticle[] = COMPOSING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("setup-stores");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Stores as setup functions", items: SETUP_FUNCTIONS },
                        { label: "storeToRefs", items: STORE_TO_REFS },
                        { label: "Stores using stores", items: COMPOSING },
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

                <SetupStoresDocs />
            </article>
        </PageShell>
    );
}
