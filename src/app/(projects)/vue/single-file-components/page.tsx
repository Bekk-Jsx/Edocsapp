import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SingleFileComponentsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/single-file-components";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all eleven without exception: 11 sections, 11 cards.
const TYPING_TEXT = [
    {
        title: "defineComponent",
        href: "#definecomponent",
        text: (
            <>
                Types <Mono>this</Mono> for the Options API; a no-op at runtime;
                replaces <Mono>Vue.extend</Mono>.
            </>
        ),
    },
    {
        title: "Plain object or defineComponent",
        href: "#plain-object-or-definecomponent",
        text: (
            <>
                Same runtime result; only <Mono>defineComponent</Mono> is typed
                everywhere.
            </>
        ),
    },
    {
        title: "Typing data, computed and methods",
        href: "#typing-data-computed-and-methods",
        text: (
            <>
                Cast <Mono>null</Mono> starts, annotate computed returns, type
                method params.
            </>
        ),
    },
];

const TYPE_CHECKING_TEXT = [
    {
        title: "Who checks types",
        href: "#who-checks-types",
        text: (
            <>
                Vite strips types; the editor and <Mono>vue-tsc</Mono> check them;
                build runs <Mono>vue-tsc</Mono>.
            </>
        ),
    },
    {
        title: "Cannot find module './App.vue'",
        // The quotes, "./" and "." all slug to "-", trimmed at the end.
        href: "#cannot-find-module-app-vue",
        text: (
            <>
                Install Vue (Official), disable Vetur; never add a{" "}
                <Mono>*.vue</Mono> shim.
            </>
        ),
    },
];

const SCOPED_TEXT = [
    {
        title: "Scoped styles",
        href: "#scoped-styles",
        text: (
            <>A hash attribute limits styles to the component&apos;s own elements.</>
        ),
    },
    {
        title: "Styling inside a child: :deep()",
        href: "#styling-inside-a-child-deep",
        text: (
            <>
                Reach elements inside a child; replaces <Mono>::v-deep</Mono>.
            </>
        ),
    },
    {
        title: "Styling slot content: :slotted()",
        href: "#styling-slot-content-slotted",
        text: (
            <>
                Slot content belongs to the parent; style it with{" "}
                <Mono>:slotted()</Mono>.
            </>
        ),
    },
    {
        title: "One global rule: :global()",
        href: "#one-global-rule-global",
        text: <>Opt a single rule out of scoping.</>,
    },
];

const STATE_IN_CSS_TEXT = [
    {
        title: "v-bind() in CSS",
        href: "#v-bind-in-css",
        text: (
            <>
                State becomes hashed CSS variables on the root; works in{" "}
                <Mono>:hover</Mono> and media queries.
            </>
        ),
    },
    {
        title: "Expressions and units",
        href: "#expressions-and-units",
        text: <>Quote expressions; bind strings with units.</>,
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

const TYPING: SummaryArticle[] = TYPING_TEXT.map(withSeverities);
const TYPE_CHECKING: SummaryArticle[] = TYPE_CHECKING_TEXT.map(withSeverities);
const SCOPED: SummaryArticle[] = SCOPED_TEXT.map(withSeverities);
const STATE_IN_CSS: SummaryArticle[] = STATE_IN_CSS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("single-file-components");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Typing components", items: TYPING },
                        { label: "Type-checking .vue files", items: TYPE_CHECKING },
                        { label: "Scoped styles", items: SCOPED },
                        { label: "Component state in CSS", items: STATE_IN_CSS },
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
                        Vue · Getting Started
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <SingleFileComponentsDocs />
            </article>
        </PageShell>
    );
}
