import DemoFrame from "@/components/ui/demo-frame";
import UseRefDemo from "@/projects/hooks-refresh/demos/use-ref-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseRefDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-ref-content";
import { Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const MUTABLE_BOX_TEXT = [
    {
        title: "What it is",
        href: "#what-it-is",
        text: (
            <>
                A mutable <Mono>{"{ current }"}</Mono> box that survives renders —
                writing to it never triggers one. The argument is the initial{" "}
                <Mono>.current</Mono>.
            </>
        ),
    },
    {
        title: "Ref vs state",
        href: "#ref-vs-state",
        text: (
            <>
                State change → re-render; ref change → nothing. Use a ref to REMEMBER,
                state for what the UI must REACT to.
            </>
        ),
    },
    {
        title: "Don't touch during render",
        href: "#don-t-touch-during-render",
        text: (
            <>
                Reading or writing <Mono>.current</Mono> in the component body is
                impure and can be stale — do it in effects and event handlers.
            </>
        ),
    },
];

const DOM_REFS_TEXT = [
    {
        title: "Attaching + timing",
        href: "#attaching-timing",
        text: (
            <>
                React fills <Mono>.current</Mono> AFTER commit: <Mono>null</Mono>{" "}
                during render, the node in an effect, <Mono>null</Mono> again on
                unmount.
            </>
        ),
    },
    {
        title: "Passing a ref to your component",
        href: "#passing-a-ref-to-your-component-react-19",
        text: (
            <>
                React 19 makes <Mono>ref</Mono> a normal prop — no{" "}
                <Mono>forwardRef</Mono>. The parent is unchanged; only the child got
                simpler.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof MUTABLE_BOX_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

// The two groups mirror the part dividers in the content file.
const MUTABLE_BOX: SummaryArticle[] = MUTABLE_BOX_TEXT.map(withSeverities);
const DOM_REFS: SummaryArticle[] = DOM_REFS_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The mutable box", items: MUTABLE_BOX },
                        { label: "DOM refs", items: DOM_REFS },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useRef"
                source="react"
                docs={<UseRefDocs />}
                description={
                    <>
                        A <Term>mutable box</Term> that survives renders and never
                        causes one: <code>{"{ current }"}</code>, yours to write. Two
                        jobs — remembering a value the UI doesn&apos;t react to, and
                        holding the real DOM node React hands you after commit.
                    </>
                }
            >
                <UseRefDemo />
            </DemoFrame>
        </PageShell>
    );
}
