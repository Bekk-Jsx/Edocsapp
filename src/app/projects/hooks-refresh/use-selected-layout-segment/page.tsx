import DemoFrame from "@/components/ui/demo-frame";
import UseSelectedLayoutSegmentDemo from "@/projects/hooks-refresh/demos/use-selected-layout-segment-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseSelectedLayoutSegmentDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-selected-layout-segment-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const IDEA_TEXT = [
    {
        title: "What a segment is",
        href: "#what-a-segment-is",
        text: (
            <>
                One slice of the path between slashes — <Mono>user/address</Mono> and{" "}
                <Mono>user/[id]</Mono> both count.
            </>
        ),
    },
    {
        title: "The active child segment",
        href: "#the-active-child-segment",
        text: (
            <>
                The segment directly below the calling layout, or <Mono>null</Mono>{" "}on
                that layout&apos;s index.
            </>
        ),
    },
    {
        title: "Relative to the calling layout",
        href: "#relative-to-the-calling-layout",
        text: (
            <>
                One step down, never deeper — so each nested layout gets its own active
                segment for free.
            </>
        ),
    },
];

const PLURAL_TEXT = [
    {
        title: "The plural version",
        href: "#useselectedlayoutsegments-plural",
        text: (
            <>
                <Mono>useSelectedLayoutSegments()</Mono> returns every segment below, as
                an array — breadcrumbs.
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
const PLURAL: SummaryArticle[] = PLURAL_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The idea", items: IDEA },
                        { label: "Singular vs plural", items: PLURAL },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useSelectedLayoutSegment"
                source="next/navigation"
                docs={<UseSelectedLayoutSegmentDocs />}
                description={
                    <>
                        The active route segment{" "}
                        <Term>directly below the layout that calls it</Term> — one
                        string, or <Code>null</Code>{" "}on that layout&apos;s own index.
                        Always relative to the caller, which is what makes it cleaner
                        than slicing <Code>usePathname</Code> by hand for active-link
                        state. The plural{" "}
                        <Code>useSelectedLayoutSegments</Code> returns the whole path
                        below instead. Next-only —{" "}
                        <Term>routing isn&apos;t a React feature</Term>.
                    </>
                }
            >
                <UseSelectedLayoutSegmentDemo />
            </DemoFrame>
        </PageShell>
    );
}
