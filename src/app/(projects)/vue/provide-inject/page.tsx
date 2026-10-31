import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ProvideInjectDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/provide-inject";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all six without exception: 6 sections, 6 cards.
const BASICS_TEXT = [
    {
        title: "Passing values down the tree",
        href: "#passing-values-down-the-tree",
        text: (
            <>Ancestor provides, any descendant injects; the nearest provider wins.</>
        ),
    },
];

const REACTIVE_TEXT = [
    {
        title: "Providing a ref",
        href: "#providing-a-ref",
        text: (
            <>
                <Mono>provide()</Mono> runs once; provide{" "}
                <Mono>{"computed(() => this.x)"}</Mono>, not <Mono>this.x</Mono>.
            </>
        ),
    },
    {
        title: "Changing provided state",
        href: "#changing-provided-state",
        text: <>Provide a function; the provider stays the owner.</>,
    },
];

const TYPING_TEXT = [
    {
        title: "Typing with a string key",
        href: "#typing-with-a-string-key",
        text: (
            <>
                The <Mono>inject</Mono> option is untyped;{" "}
                <Mono>{"inject<T>('key')"}</Mono> in setup is an unchecked claim.
            </>
        ),
    },
    {
        title: "InjectionKey",
        href: "#injectionkey",
        text: (
            <>A typed symbol shared by both sides; typos and wrong types are errors.</>
        ),
    },
    {
        title: "Defaults and required injections",
        href: "#defaults-and-required-injections",
        text: (
            <>
                A default removes <Mono>undefined</Mono>; throw when the provider is
                required.
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

const BASICS: SummaryArticle[] = BASICS_TEXT.map(withSeverities);
const REACTIVE: SummaryArticle[] = REACTIVE_TEXT.map(withSeverities);
const TYPING: SummaryArticle[] = TYPING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("provide-inject");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Provide and inject", items: BASICS },
                        { label: "Reactive provided values", items: REACTIVE },
                        { label: "Typing injections", items: TYPING },
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

                <ProvideInjectDocs />
            </article>
        </PageShell>
    );
}
