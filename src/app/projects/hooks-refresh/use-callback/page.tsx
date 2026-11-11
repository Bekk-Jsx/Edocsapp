import DemoFrame from "@/components/ui/demo-frame";
import UseCallbackDemo from "@/projects/hooks-refresh/demos/use-callback-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseCallbackDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-callback-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const WHAT_IT_IS_TEXT = [
    {
        title: "Memoized function",
        href: "#memoized-function",
        text: (
            <>
                <Mono>useCallback(fn, deps)</Mono> hands back the SAME function
                reference until a dep changes — it stabilizes identity, not speed.
            </>
        ),
    },
    {
        title: "When it matters",
        href: "#when-it-matters",
        text: (
            <>
                Only a <Mono>React.memo</Mono> child or an effect/hook dep compares
                the reference. Nothing comparing it? Pure overhead.
            </>
        ),
    },
];

const GETTING_IT_RIGHT_TEXT = [
    {
        title: "Stale closure",
        href: "#stale-closure",
        text: (
            <>
                A missing dep freezes what the function closed over — and being
                cached is what makes the stale version stick.
            </>
        ),
    },
    {
        title: "React Compiler",
        href: "#react-compiler",
        text: (
            <>
                Opt-in <Mono>reactCompiler: true</Mono> auto-memoizes at build time,
                making manual <Mono>useCallback</Mono> largely redundant.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof WHAT_IT_IS_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const WHAT_IT_IS: SummaryArticle[] = WHAT_IT_IS_TEXT.map(withSeverities);
const GETTING_IT_RIGHT: SummaryArticle[] =
    GETTING_IT_RIGHT_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "What it is", items: WHAT_IT_IS },
                        { label: "Getting it right", items: GETTING_IT_RIGHT },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useCallback"
                source="react"
                docs={<UseCallbackDocs />}
                description={
                    <>
                        Cache a function&apos;s <Term>identity</Term> between renders:{" "}
                        <code>useCallback(fn, deps)</code> returns the same function
                        reference until a dependency changes. It is{" "}
                        <code>useMemo</code> specialized for functions, and it pays off
                        in exactly two places — a <Code>React.memo</Code> child, or a
                        dependency array — because those are the only things that
                        compare the reference.
                    </>
                }
            >
                <UseCallbackDemo />
            </DemoFrame>
        </PageShell>
    );
}
