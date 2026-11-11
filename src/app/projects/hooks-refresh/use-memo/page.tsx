import DemoFrame from "@/components/ui/demo-frame";
import UseMemoDemo from "@/projects/hooks-refresh/demos/use-memo-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseMemoDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-memo-content";
import { Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const USING_IT_TEXT = [
    {
        title: "What it memoizes",
        href: "#what-it-memoizes",
        text: (
            <>
                <Mono>useMemo(fn, deps)</Mono> caches the RESULT and reruns{" "}
                <Mono>fn</Mono> only when a dep changes by reference — how often you
                compute, not what.
            </>
        ),
    },
    {
        title: "Use 1 · skip expensive work",
        href: "#use-1-skip-expensive-work",
        text: (
            <>
                Heavy <Mono>reduce</Mono>/<Mono>sort</Mono>/<Mono>filter</Mono> pays
                its cost only when the source REFERENCE changes — and only if that
                source is stable.
            </>
        ),
    },
    {
        title: "Use 2 · stabilize a reference",
        href: "#use-2-stabilize-a-reference",
        text: (
            <>
                An inline object is new every render; <Mono>useMemo</Mono> keeps one
                identity for a <Mono>React.memo</Mono> child or an effect dep to
                compare.
            </>
        ),
    },
    {
        title: "When it's pointless",
        href: "#when-it-s-pointless",
        text: (
            <>
                Cheap value, nothing comparing its identity — <Mono>useMemo</Mono>{" "}
                only adds storage and comparisons. Don&apos;t wrap everything.
            </>
        ),
    },
];

const GETTING_IT_RIGHT_TEXT = [
    {
        title: "The dependency array",
        href: "#the-dependency-array",
        text: (
            <>
                Deps compare by reference: a missing one returns a STALE result, an
                inline object as a dep means the cache never hits.
            </>
        ),
    },
    {
        title: "React Compiler",
        href: "#react-compiler",
        text: (
            <>
                Opt-in <Mono>reactCompiler: true</Mono> auto-memoizes at build time —
                but it assumes your components are pure.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof USING_IT_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const USING_IT: SummaryArticle[] = USING_IT_TEXT.map(withSeverities);
const GETTING_IT_RIGHT: SummaryArticle[] =
    GETTING_IT_RIGHT_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Using it", items: USING_IT },
                        { label: "Getting it right", items: GETTING_IT_RIGHT },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useMemo"
                source="react"
                docs={<UseMemoDocs />}
                description={
                    <>
                        Cache a <Term>computed value</Term> between renders:{" "}
                        <code>useMemo(fn, deps)</code> reruns <code>fn</code> only
                        when a dependency changes by reference. Two things it is
                        for — skipping work that is genuinely expensive, and holding
                        an object&apos;s identity steady so a memoized child or an
                        effect dependency can compare it.
                    </>
                }
            >
                <UseMemoDemo />
            </DemoFrame>
        </PageShell>
    );
}
