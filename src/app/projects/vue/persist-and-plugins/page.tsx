import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    PersistAndPluginsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/persist-and-plugins";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 4 sections, 4 cards.
const PERSISTING_TEXT = [
    {
        title: "Surviving a reload",
        href: "#surviving-a-reload",
        text: (
            <>
                Load in the state, write in a watcher; JSON limits and no{" "}
                <Mono>localStorage</Mono> on the server.
            </>
        ),
    },
];

const OBSERVING_TEXT = [
    {
        title: "$patch and $subscribe",
        href: "#patch-and-subscribe",
        text: (
            <>
                One change instead of many; subscribe to state,{" "}
                <Mono>$onAction</Mono> to actions.
            </>
        ),
    },
    {
        title: "Resetting state",
        href: "#resetting-state",
        text: (
            <>
                <Mono>$reset</Mono> in option stores, hand-written in setup stores;{" "}
                <Mono>$state</Mono> replaces everything.
            </>
        ),
    },
];

const PLUGINS_TEXT = [
    {
        title: "Extending every store",
        href: "#extending-every-store",
        text: (
            <>
                One function per store adds behavior and properties; opt in with a
                custom option.
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

const PERSISTING: SummaryArticle[] = PERSISTING_TEXT.map(withSeverities);
const OBSERVING: SummaryArticle[] = OBSERVING_TEXT.map(withSeverities);
const PLUGINS: SummaryArticle[] = PLUGINS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("persist-and-plugins");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Persisting state", items: PERSISTING },
                        {
                            label: "Patching, subscribing, resetting",
                            items: OBSERVING,
                        },
                        { label: "Plugins", items: PLUGINS },
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

                <PersistAndPluginsDocs />
            </article>
        </PageShell>
    );
}
