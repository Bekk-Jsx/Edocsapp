import DemoFrame from "@/components/ui/demo-frame";
import UseTransitionDemo from "@/projects/hooks-refresh/demos/use-transition-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseTransitionDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-transition-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const THE_IDEA_TEXT = [
    {
        title: "Urgent vs non-urgent",
        href: "#urgent-vs-non-urgent",
        text: (
            <>
                <Mono>startTransition</Mono> marks an update low-priority;{" "}
                <Mono>isPending</Mono> is true while it runs.
            </>
        ),
    },
    {
        title: "The problem it solves",
        href: "#the-problem-it-solves",
        text: (
            <>
                Typing stays instant while the heavy list lags behind — started
                immediately and interrupted, not debounced.
            </>
        ),
    },
];

const USING_IT_RIGHT_TEXT = [
    {
        title: "isPending feedback",
        href: "#ispending-feedback",
        text: (
            <>
                Dim the stale list or show a spinner while the transition catches up —
                feedback that blocks nothing.
            </>
        ),
    },
    {
        title: "Keep the urgent update outside",
        href: "#keep-the-urgent-update-outside",
        text: (
            <>
                Wrapping <Mono>setQuery</Mono> makes typing low-priority too, bringing
                back the exact lag you removed.
            </>
        ),
    },
    {
        title: "Rendering, not fetching",
        href: "#it-prioritizes-rendering-not-fetching",
        text: (
            <>
                It prioritizes render work. An <Mono>await</Mono> inside escapes the
                transition — use Suspense for slow network.
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
const USING_IT_RIGHT: SummaryArticle[] =
    USING_IT_RIGHT_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The idea", items: THE_IDEA },
                        { label: "Using it right", items: USING_IT_RIGHT },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useTransition"
                source="react"
                docs={<UseTransitionDocs />}
                description={
                    <>
                        Mark a state update as <Term>non-urgent</Term> so it stops
                        blocking the ones that must feel instant.{" "}
                        <Code>startTransition</Code> tells React the wrapped update can
                        lag — and can be ABANDONED when newer input arrives — while{" "}
                        <Code>isPending</Code> lets you show that it&apos;s catching up.
                        It is for heavy <Term>synchronous re-renders</Term>, not slow
                        networks, and it is not a debounce.
                    </>
                }
            >
                <UseTransitionDemo />
            </DemoFrame>
        </PageShell>
    );
}
