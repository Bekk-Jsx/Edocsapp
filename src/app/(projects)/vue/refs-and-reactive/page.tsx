import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    RefsAndReactiveDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/refs-and-reactive";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all eight without exception: 8 sections, 8 cards.
const OUTSIDE_TEXT = [
    {
        title: "Reactive state outside components",
        href: "#reactive-state-outside-components",
        text: (
            <>
                <Mono>reactive()</Mono> makes module state reactive and shared;
                replaces <Mono>Vue.observable</Mono>.
            </>
        ),
    },
];

const REF_TEXT = [
    {
        title: "ref and .value",
        href: "#ref-and-value",
        text: (
            <>
                A box for any value, read and written through <Mono>.value</Mono>;
                keep it <Mono>const</Mono>.
            </>
        ),
    },
    {
        title: "Unwrapping in templates",
        href: "#unwrapping-in-templates",
        text: (
            <>
                Templates unwrap top-level refs; script code always uses{" "}
                <Mono>.value</Mono>.
            </>
        ),
    },
];

const REACTIVE_TEXT = [
    {
        title: "Always go through the proxy",
        href: "#always-go-through-the-proxy",
        text: (
            <>Writes to the raw object are not tracked; nested objects are reactive.</>
        ),
    },
    {
        title: "Change it, never replace it",
        href: "#change-it-never-replace-it",
        text: (
            <>
                Vue tracks the proxy, not the variable; use{" "}
                <Mono>Object.assign</Mono> or a ref.
            </>
        ),
    },
];

const TYPING_TEXT = [
    {
        title: "Typing ref",
        href: "#typing-ref",
        text: (
            <>
                <Mono>{"ref<T>(…)"}</Mono> for narrow initial values;{" "}
                <Mono>{"Ref<T>"}</Mono> for parameters.
            </>
        ),
    },
    {
        title: "Typing reactive",
        href: "#typing-reactive",
        text: <>Annotate the variable with an interface, not the generic.</>,
    },
];

const CHOOSING_TEXT = [
    {
        title: "ref or reactive",
        href: "#ref-or-reactive",
        text: (
            <>
                <Mono>ref</Mono> by default; <Mono>reactive</Mono> for grouped fields
                that are never replaced.
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

const OUTSIDE: SummaryArticle[] = OUTSIDE_TEXT.map(withSeverities);
const REF: SummaryArticle[] = REF_TEXT.map(withSeverities);
const REACTIVE: SummaryArticle[] = REACTIVE_TEXT.map(withSeverities);
const TYPING: SummaryArticle[] = TYPING_TEXT.map(withSeverities);
const CHOOSING: SummaryArticle[] = CHOOSING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("refs-and-reactive");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Reactive state outside components", items: OUTSIDE },
                        { label: "ref", items: REF },
                        { label: "reactive", items: REACTIVE },
                        { label: "Typing refs and reactive", items: TYPING },
                        { label: "ref or reactive", items: CHOOSING },
                    ]}
                />
            }
        >
            {/* Same arrangement as the single-file-components page: no DemoFrame
                and no "use client", header inlined, heading and summary from the
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

                <RefsAndReactiveDocs />
            </article>
        </PageShell>
    );
}
