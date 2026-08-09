import DemoFrame from "@/components/ui/demo-frame";
import UseLayoutEffectDemo from "@/projects/hooks-refresh/demos/use-layout-effect-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseLayoutEffectDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-layout-effect-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const TIMING_TEXT = [
    {
        title: "Before paint",
        href: "#useeffect-vs-uselayouteffect",
        text: (
            <>
                Same API as <Mono>useEffect</Mono>, different timing: it runs after
                the DOM update and BEFORE the browser paints.
            </>
        ),
    },
    {
        title: "The flicker fix",
        href: "#the-flicker-fix",
        text: (
            <>
                Measure or change the DOM before the user sees it — the correction
                lands in the same frame, so nothing flashes.
            </>
        ),
    },
];

const LIMITS_TEXT = [
    {
        title: "Sync only",
        href: "#sync-only",
        text: (
            <>
                It holds paint for synchronous work only. An <Mono>await</Mono> or{" "}
                <Mono>.then()</Mono> resolves after paint — you flash anyway.
            </>
        ),
    },
    {
        title: "Cost + SSR",
        href: "#cost-ssr",
        text: (
            <>
                Blocking paint costs a frame, so keep it quick — and it never runs
                on the server, only after hydration.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof TIMING_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const TIMING: SummaryArticle[] = TIMING_TEXT.map(withSeverities);
const LIMITS: SummaryArticle[] = LIMITS_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Timing", items: TIMING },
                        { label: "Limits", items: LIMITS },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useLayoutEffect"
                source="react"
                docs={<UseLayoutEffectDocs />}
                description={
                    <>
                        <Code>useEffect</Code> with one difference: <Term>timing</Term>.
                        It runs after React updates the DOM but{" "}
                        <Term>before the browser paints</Term>, synchronously — so it can
                        measure the DOM and adjust it without the user ever seeing the
                        intermediate frame. That buys you exactly one thing: no flicker on
                        synchronous layout work. Everything else stays{" "}
                        <Code>useEffect</Code>.
                    </>
                }
            >
                <UseLayoutEffectDemo />
            </DemoFrame>
        </PageShell>
    );
}
