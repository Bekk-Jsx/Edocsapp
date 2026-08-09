import DemoFrame from "@/components/ui/demo-frame";
import UseImperativeHandleDemo from "@/projects/hooks-refresh/demos/use-imperative-handle-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseImperativeHandleDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-imperative-handle-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const THE_BASICS_TEXT = [
    {
        title: "What it does",
        href: "#what-it-does",
        text: (
            <>
                Replaces the raw DOM node on the parent&apos;s ref with a custom
                object of methods. React 19: <Mono>ref</Mono> is a normal prop.
            </>
        ),
    },
    {
        title: "Imperative vs declarative",
        href: "#imperative-vs-declarative",
        text: (
            <>
                Declarative describes the UI from state; imperative commands an action
                now. This hook is the imperative escape hatch.
            </>
        ),
    },
];

const WHEN_AND_WHY_NOT_TEXT = [
    {
        title: "Forward vs customize",
        href: "#forward-the-ref-vs-customize-it",
        text: (
            <>
                Forwarding a ref already works and gives the raw node. The hook exists
                to restrict what the parent gets.
            </>
        ),
    },
    {
        title: "Encapsulation",
        href: "#why-hide-the-dom-encapsulation",
        text: (
            <>
                Hiding the node keeps your state in sync, frees your internals, and
                stops misuse — but try props first.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof THE_BASICS_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const THE_BASICS: SummaryArticle[] = THE_BASICS_TEXT.map(withSeverities);
const WHEN_AND_WHY_NOT: SummaryArticle[] =
    WHEN_AND_WHY_NOT_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The basics", items: THE_BASICS },
                        { label: "When (and why not)", items: WHEN_AND_WHY_NOT },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useImperativeHandle"
                source="react"
                docs={<UseImperativeHandleDocs />}
                description={
                    <>
                        Customize what a component&apos;s <Term>ref</Term> exposes to its
                        parent: instead of the raw DOM node, the parent receives a
                        curated object of methods — <Code>&#123; focus, clear &#125;</Code>{" "}
                        and nothing more. It is React&apos;s{" "}
                        <Term>imperative escape hatch</Term>, used to encapsulate a
                        child&apos;s internals rather than to pass a ref (forwarding
                        already does that). In React 19, <Code>ref</Code> is a normal prop
                        — no <Code>forwardRef</Code>.
                    </>
                }
            >
                <UseImperativeHandleDemo />
            </DemoFrame>
        </PageShell>
    );
}
