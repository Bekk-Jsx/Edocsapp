import DemoFrame from "@/components/ui/demo-frame";
import UsePathnameDemo from "@/projects/hooks-refresh/demos/use-pathname-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UsePathnameDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-pathname-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const HOOK_TEXT = [
    {
        title: "Current path",
        href: "#current-path",
        text: (
            <>
                A string like <Mono>&quot;/dashboard/settings&quot;</Mono>, re-read on
                every navigation.
            </>
        ),
    },
    {
        title: "Active links",
        href: "#active-links",
        text: (
            <>
                Compare <Mono>pathname</Mono> to each <Mono>href</Mono> — the
                highlight follows the route by itself.
            </>
        ),
    },
    {
        title: "Path only, no query",
        href: "#path-only-no-query",
        text: (
            <>
                <Mono>/search?q=react</Mono> → <Mono>&quot;/search&quot;</Mono>. The
                query lives in <Mono>useSearchParams</Mono>.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const HOOK: SummaryArticle[] = HOOK_TEXT.map((item) => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
}));

export default function Page() {
    return (
        <PageShell
            alerts={<SummaryArticles groups={[{ label: "The hook", items: HOOK }]} />}
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="usePathname"
                source="next/navigation"
                docs={<UsePathnameDocs />}
                description={
                    <>
                        The current URL <Term>path, as a string</Term> — re-rendered on
                        every navigation, which makes{" "}
                        <Term>active-link highlighting</Term>{" "}a one-line comparison. It
                        never carries the query string; that&apos;s{" "}
                        <Code>useSearchParams</Code>. Next-only —{" "}
                        <Term>routing isn&apos;t a React feature</Term>.
                    </>
                }
            >
                <UsePathnameDemo />
            </DemoFrame>
        </PageShell>
    );
}
