import DemoFrame from "@/components/ui/demo-frame";
import UseDeferredValueDemo from "@/projects/hooks-refresh/demos/use-deferred-value-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseDeferredValueDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-deferred-value-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const THE_IDEA_TEXT = [
    {
        title: "A lagging copy of a value",
        href: "#a-lagging-copy-of-a-value",
        text: (
            <>
                <Mono>useDeferredValue(value)</Mono> returns the same value at LOW
                priority, free to fall a step behind.
            </>
        ),
    },
    {
        title: "Why not use the value directly",
        href: "#why-not-use-the-value-directly",
        text: (
            <>
                Reading the heavy work off the urgent value makes it urgent too — one
                value, two priorities.
            </>
        ),
    },
];

const HOW_IT_RENDERS_TEXT = [
    {
        title: "Two renders per keystroke",
        href: "#two-renders-per-keystroke",
        text: (
            <>
                Urgent pass first, where <Mono>deferredQuery</Mono> is still its last
                committed value; the deferred pass follows.
            </>
        ),
    },
    {
        title: "Interrupted and abandoned",
        href: "#interrupted-and-abandoned",
        text: (
            <>
                Keep typing and React throws the low-priority render away — the work
                completes only for a value you pause on.
            </>
        ),
    },
];

const USING_IT_RIGHT_TEXT = [
    {
        title: "Pair it with memoization",
        href: "#pair-it-with-memoization",
        text: (
            <>
                <Mono>useMemo</Mono> or <Mono>React.memo</Mono> is what skips the work
                on the urgent render. The hook alone saves nothing.
            </>
        ),
    },
    {
        title: "Stale flag and when to skip it",
        href: "#stale-flag-and-when-to-skip-it",
        text: (
            <>
                Derive <Mono>isStale</Mono> yourself; never defer trivial work or a
                freshly-built object.
            </>
        ),
    },
    {
        title: "vs useTransition",
        href: "#vs-usetransition",
        text: (
            <>
                Own the <Mono>setState</Mono> → wrap the update. Only have the value →
                defer the value.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof THE_IDEA_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const THE_IDEA: SummaryArticle[] = THE_IDEA_TEXT.map(withSeverities);
const HOW_IT_RENDERS: SummaryArticle[] =
    HOW_IT_RENDERS_TEXT.map(withSeverities);
const USING_IT_RIGHT: SummaryArticle[] =
    USING_IT_RIGHT_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The idea", items: THE_IDEA },
                        { label: "How it renders", items: HOW_IT_RENDERS },
                        { label: "Using it right", items: USING_IT_RIGHT },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useDeferredValue"
                source="react"
                docs={<UseDeferredValueDocs />}
                description={
                    <>
                        Get a <Term>second copy of a value</Term> that updates at low
                        priority, so it can lag one step behind while React is busy.
                        Drive the urgent UI off the original and the expensive render
                        off the deferred copy — then let <Code>useMemo</Code> or{" "}
                        <Code>React.memo</Code> skip that work while the deferred copy
                        hasn&apos;t moved. It is the <Term>value-side</Term> counterpart
                        to <Code>useTransition</Code>, for when there is no setter of
                        yours to wrap.
                    </>
                }
            >
                <UseDeferredValueDemo />
            </DemoFrame>
        </PageShell>
    );
}
