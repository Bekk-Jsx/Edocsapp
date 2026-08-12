import DemoFrame from "@/components/ui/demo-frame";
import UseActionStateDemo from "@/projects/hooks-refresh/demos/use-action-state-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseActionStateDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-action-state-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const HOOK_TEXT = [
    {
        title: "What it is",
        href: "#what-it-is",
        text: (
            <>
                <Mono>(prevState, formData) =&gt; newState</Mono>, and back come{" "}
                <Mono>state</Mono>, <Mono>formAction</Mono>, <Mono>isPending</Mono>.
            </>
        ),
    },
    {
        title: "Full form example",
        href: "#full-form-example",
        text: (
            <>
                No <Mono>useState</Mono> for error/success/loading, and{" "}
                <Mono>FormData</Mono> instead of controlled inputs.
            </>
        ),
    },
    {
        title: "For submits, not fetches",
        href: "#it-s-for-submits-not-fetches",
        text: (
            <>
                The action fires only when triggered — never on mount. Mutations,
                not data loading.
            </>
        ),
    },
    {
        title: "Reducer connection",
        href: "#reducer-connection",
        text: (
            <>
                An async reducer whose dispatch is a form submit — and{" "}
                <Mono>isPending</Mono> comes free.
            </>
        ),
    },
];

const SERVER_TEXT = [
    {
        title: "Server Actions",
        href: "#server-actions",
        text: (
            <>
                Mark the action <Mono>&quot;use server&quot;</Mono> and the form
                calls it directly — no API route.
            </>
        ),
    },
    {
        title: "Progressive enhancement",
        href: "#progressive-enhancement",
        text: (
            <>
                A native <Mono>action</Mono> attribute submits before JS loads, then
                React enhances it.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof HOOK_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const HOOK: SummaryArticle[] = HOOK_TEXT.map(withSeverities);
const SERVER: SummaryArticle[] = SERVER_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The hook", items: HOOK },
                        { label: "Server Actions (Next.js)", items: SERVER },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useActionState"
                source="react"
                docs={<UseActionStateDocs />}
                description={
                    <>
                        Form state produced by an <Term>action</Term>. Give it a{" "}
                        <Code>(prevState, formData) =&gt; newState</Code> function and
                        hand the returned <Code>formAction</Code> to{" "}
                        <Code>&lt;form action&gt;</Code>: the result becomes{" "}
                        <Code>state</Code> and <Code>isPending</Code> tracks the
                        submission. The dispatch is the submit — which is what lets the
                        action be a <Term>Server Action</Term>.
                    </>
                }
            >
                <UseActionStateDemo />
            </DemoFrame>
        </PageShell>
    );
}
