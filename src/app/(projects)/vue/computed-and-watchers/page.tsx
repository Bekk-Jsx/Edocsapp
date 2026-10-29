import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ComputedAndWatchersDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/computed-and-watchers";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all fourteen without exception: 14 sections, 14 cards.
const COMPUTED_TEXT = [
    {
        title: "computed() outside components",
        href: "#computed-outside-components",
        text: (
            <>
                Define derived state once next to the state; cached, lazy, readonly
                ref.
            </>
        ),
    },
];

const WATCH_OPTION_TEXT = [
    {
        title: "Watching arrays",
        href: "#watching-arrays",
        text: (
            <>
                Array watchers fire only on replacement; add <Mono>deep: true</Mono>{" "}
                for mutations.
            </>
        ),
    },
];

const WATCH_FUNCTION_TEXT = [
    {
        title: "watch() outside components",
        href: "#watch-outside-components",
        text: <>React to shared state in any module.</>,
    },
    {
        title: "Watch sources",
        href: "#watch-sources",
        text: (
            <>ref, getter, reactive or an array; wrap properties in a getter.</>
        ),
    },
    {
        title: "Stopping a watcher",
        href: "#stopping-a-watcher",
        text: (
            <>
                <Mono>watch()</Mono> returns <Mono>stop</Mono>; setup watchers stop
                on unmount.
            </>
        ),
    },
    {
        title: "Options or functions",
        href: "#options-or-functions",
        text: <>Options exist only in components; functions work everywhere.</>,
    },
];

const WATCHER_OPTIONS_TEXT = [
    {
        title: "deep",
        href: "#deep",
        text: (
            <>
                Track nested changes of a getter&apos;s object; reactive sources are
                deep already.
            </>
        ),
    },
    {
        title: "immediate",
        href: "#immediate",
        text: <>Run once at the start; the old value is undefined then.</>,
    },
    {
        title: "once",
        href: "#once",
        text: <>Stop after the first run; new in Vue 3.4.</>,
    },
];

const WATCH_EFFECT_TEXT = [
    {
        title: "watchEffect",
        href: "#watcheffect",
        text: (
            <>Tracks whatever it reads; runs immediately; no source list to forget.</>
        ),
    },
    {
        title: "Async effects",
        href: "#async-effects",
        text: (
            <>
                Only reads before the first <Mono>await</Mono> are tracked.
            </>
        ),
    },
    {
        title: "watch or watchEffect",
        href: "#watch-or-watcheffect",
        text: (
            <>
                <Mono>watchEffect</Mono> ≈ <Mono>watch</Mono> with automatic sources
                + <Mono>immediate</Mono>; empty array never fires.
            </>
        ),
    },
];

const CLEANUP_TEXT = [
    {
        title: "Watcher cleanup",
        href: "#watcher-cleanup",
        text: (
            <>
                <Mono>onCleanup</Mono> runs before the next run; register before any{" "}
                <Mono>await</Mono>.
            </>
        ),
    },
    {
        title: "Cancelling stale requests",
        href: "#cancelling-stale-requests",
        text: (
            <>
                One <Mono>AbortController</Mono> per run; abort in cleanup so only
                the latest request wins.
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

const COMPUTED: SummaryArticle[] = COMPUTED_TEXT.map(withSeverities);
const WATCH_OPTION: SummaryArticle[] = WATCH_OPTION_TEXT.map(withSeverities);
const WATCH_FUNCTION: SummaryArticle[] = WATCH_FUNCTION_TEXT.map(withSeverities);
const WATCHER_OPTIONS: SummaryArticle[] =
    WATCHER_OPTIONS_TEXT.map(withSeverities);
const WATCH_EFFECT: SummaryArticle[] = WATCH_EFFECT_TEXT.map(withSeverities);
const CLEANUP: SummaryArticle[] = CLEANUP_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("computed-and-watchers");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "computed()", items: COMPUTED },
                        { label: "The watch option", items: WATCH_OPTION },
                        { label: "The watch() function", items: WATCH_FUNCTION },
                        { label: "deep, immediate and once", items: WATCHER_OPTIONS },
                        { label: "watchEffect", items: WATCH_EFFECT },
                        { label: "Cleanup", items: CLEANUP },
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
                        Vue · Reactivity
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <ComputedAndWatchersDocs />
            </article>
        </PageShell>
    );
}
