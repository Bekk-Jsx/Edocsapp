import DemoFrame from "@/components/ui/demo-frame";
import UseInsertionEffectDemo from "@/projects/hooks-refresh/demos/use-insertion-effect-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseInsertionEffectDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-insertion-effect-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const WHAT_IT_IS_TEXT = [
    {
        title: "Earliest effect",
        href: "#the-earliest-effect",
        text: (
            <>
                Runs before React mutates the DOM and before layout — the slot for
                getting <Mono>&lt;style&gt;</Mono> tags in first.
            </>
        ),
    },
    {
        title: "Restrictions",
        href: "#restrictions",
        text: (
            <>
                No layout reads, no <Mono>setState</Mono>, refs still null. Injecting
                styles is its only legitimate job.
            </>
        ),
    },
];

const DO_YOU_NEED_IT_TEXT = [
    {
        title: "Static vs runtime",
        href: "#static-css-vs-runtime-css-in-js",
        text: (
            <>
                Static styles belong in CSS Modules or Tailwind. This is for
                runtime-generated CSS — and libraries call it, not you.
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
const DO_YOU_NEED_IT: SummaryArticle[] =
    DO_YOU_NEED_IT_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "What it is", items: WHAT_IT_IS },
                        { label: "Do you need it", items: DO_YOU_NEED_IT },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useInsertionEffect"
                source="react"
                docs={<UseInsertionEffectDocs />}
                description={
                    <>
                        The <Term>earliest</Term> of the three effect timings: it runs
                        before React mutates the DOM and before layout is calculated. It
                        exists for one job — injecting{" "}
                        <Code>&lt;style&gt;</Code> tags ahead of any measurement — which
                        is why CSS-in-JS libraries call it and application code almost
                        never does.
                    </>
                }
            >
                <UseInsertionEffectDemo />
            </DemoFrame>
        </PageShell>
    );
}
