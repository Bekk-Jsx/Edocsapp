import DemoFrame from "@/components/ui/demo-frame";
import UseOptimisticDemo from "@/projects/hooks-refresh/demos/use-optimistic-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseOptimisticDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-optimistic-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const IDEA_TEXT = [
    {
        title: "Instant UI before the server",
        href: "#instant-ui-before-the-server-responds",
        text: (
            <>
                <Mono>updateFn(current, value)</Mono> builds the temporary view;
                render what comes back, not the real state.
            </>
        ),
    },
    {
        title: "Full example",
        href: "#full-example",
        text: (
            <>
                <Mono>addOptimistic</Mono> shows the row instantly, the real{" "}
                <Mono>setMessages</Mono> replaces it. No cleanup step.
            </>
        ),
    },
    {
        title: "Why not just useState",
        href: "#why-not-just-usestate",
        text: (
            <>
                The manual version owns rollback, mixed real+pending state, and
                concurrency. This hook owns all three.
            </>
        ),
    },
];

const RULES_TEXT = [
    {
        title: "Failure auto-rolls-back",
        href: "#failure-auto-rolls-back",
        text: (
            <>
                A throw means <Mono>actualState</Mono> never updates, so the layer is
                discarded — zero rollback code.
            </>
        ),
    },
    {
        title: "Must run inside an action",
        href: "#must-run-inside-an-action",
        text: (
            <>
                A <Mono>&lt;form action&gt;</Mono> or{" "}
                <Mono>startTransition</Mono>. In a plain handler there is no pending
                action to attach to.
            </>
        ),
    },
    {
        title: "Render the optimistic state",
        href: "#render-the-optimistic-state",
        text: (
            <>
                Mapping <Mono>messages</Mono> is a silent no-op — no instant UI, and
                nothing tells you why.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof IDEA_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const IDEA: SummaryArticle[] = IDEA_TEXT.map(withSeverities);
const RULES: SummaryArticle[] = RULES_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The idea", items: IDEA },
                        { label: "Failure & rules", items: RULES },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useOptimistic"
                source="react"
                docs={<UseOptimisticDocs />}
                description={
                    <>
                        A <Term>temporary layer</Term> on top of real state, shown while an
                        action is in flight. Give it the confirmed state and an{" "}
                        <Code>updateFn</Code>, call <Code>addOptimistic</Code> inside the
                        action, and render what comes back: the user sees the result
                        instantly, and if the action fails the layer{" "}
                        <Term>rolls back on its own</Term>.
                    </>
                }
            >
                <UseOptimisticDemo />
            </DemoFrame>
        </PageShell>
    );
}
