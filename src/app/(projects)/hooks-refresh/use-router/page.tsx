import DemoFrame from "@/components/ui/demo-frame";
import UseRouterDemo from "@/projects/hooks-refresh/demos/use-router-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseRouterDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-router-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const NAV_TEXT = [
    {
        title: "What it is",
        href: "#what-it-is",
        text: (
            <>
                The router object: <Mono>push</Mono> / <Mono>replace</Mono> /{" "}
                <Mono>back</Mono> / <Mono>refresh</Mono>. Navigation from code, not
                from a click.
            </>
        ),
    },
    {
        title: "useRouter vs <Link>",
        href: "#userouter-vs-link",
        text: (
            <>
                <Mono>&lt;Link&gt;</Mono>{" "}for anything the user clicks — it&apos;s
                prefetched. <Mono>push</Mono> only when LOGIC navigates.
            </>
        ),
    },
];

const REFRESH_TEXT = [
    {
        title: "refresh() — re-render server data",
        href: "#router-refresh-re-render-server-data",
        text: (
            <>
                Re-runs the route&apos;s Server Components and merges the new markup
                in. No reload, client state kept.
            </>
        ),
    },
    {
        title: "Server data only",
        href: "#refresh-only-re-runs-server-data",
        text: (
            <>
                Data fetched in a client <Mono>useEffect</Mono> stays stale —
                re-fetch and <Mono>setState</Mono> yourself.
            </>
        ),
    },
    {
        title: "Import & scope traps",
        href: "#import-scope-traps",
        text: (
            <>
                <Mono>next/navigation</Mono>, never <Mono>next/router</Mono>. From
                the server it&apos;s <Mono>redirect()</Mono>.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof NAV_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const NAV: SummaryArticle[] = NAV_TEXT.map(withSeverities);
const REFRESH: SummaryArticle[] = REFRESH_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Navigating from code", items: NAV },
                        { label: "refresh() & traps", items: REFRESH },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useRouter"
                source="next/navigation"
                docs={<UseRouterDocs />}
                description={
                    <>
                        The App Router&apos;s hook for{" "}
                        <Term>navigating from code</Term> —{" "}
                        <Code>push</Code>, <Code>replace</Code>, <Code>back</Code>,
                        and <Code>refresh</Code>, which re-runs the current route&apos;s
                        Server Components without losing client state. Reach for it
                        when navigation follows LOGIC; for anything the user clicks,
                        keep <Code>&lt;Link&gt;</Code>. Next-only —{" "}
                        <Term>routing isn&apos;t a React feature</Term>, so there is no
                        core-React counterpart.
                    </>
                }
            >
                <UseRouterDemo />
            </DemoFrame>
        </PageShell>
    );
}
