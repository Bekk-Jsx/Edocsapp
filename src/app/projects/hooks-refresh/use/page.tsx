import DemoFrame from "@/components/ui/demo-frame";
import UseHookDemo from "@/projects/hooks-refresh/demos/use-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const PROMISES_TEXT = [
    {
        title: "What use does",
        href: "#what-use-does",
        text: (
            <>
                Reads a promise or a context DURING render. For a promise: unwrap the
                value, suspend while pending.
            </>
        ),
    },
    {
        title: "Suspense & errors",
        href: "#suspense-errors",
        text: (
            <>
                The boundary owns the fallback, an error boundary owns rejections. The
                child just reads the value.
            </>
        ),
    },
    {
        title: "The promise must be stable",
        href: "#the-promise-must-be-stable",
        text: (
            <>
                Inline <Mono>use(fetchUser())</Mono> makes a new promise every render —
                perpetual suspend. Create it once.
            </>
        ),
    },
];

const RULES_TEXT = [
    {
        title: "use for context",
        href: "#use-for-context",
        text: (
            <>
                Same job as <Mono>useContext</Mono>, and it does NOT suspend —
                suspending is a promise thing, not a <Mono>use</Mono> thing.
            </>
        ),
    },
    {
        title: "Callable conditionally",
        href: "#callable-conditionally",
        text: (
            <>
                The one hook-like API allowed inside <Mono>if</Mono>/loops — it is not
                tracked by call order.
            </>
        ),
    },
    {
        title: "Next.js flow",
        href: "#next-js-flow",
        text: (
            <>
                Create the promise in a Server Component, <Mono>use()</Mono> it in a
                client child. No waterfall, stable by construction.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof PROMISES_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const PROMISES: SummaryArticle[] = PROMISES_TEXT.map(withSeverities);
const RULES: SummaryArticle[] = RULES_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Reading promises", items: PROMISES },
                        { label: "Context & the rules", items: RULES },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="use"
                source="react"
                docs={<UseDocs />}
                description={
                    <>
                        React 19&apos;s way to read a <Term>promise or a context</Term>{" "}
                        during render. Give it a pending promise and the component{" "}
                        <Term>suspends</Term> — the nearest{" "}
                        <Code>&lt;Suspense&gt;</Code> shows the fallback, and on resolve{" "}
                        <Code>use</Code> hands back the value. No{" "}
                        <Code>useEffect</Code>, no loading branch. It is also the one
                        hook-like API you may call inside an <Code>if</Code>.
                    </>
                }
            >
                <UseHookDemo />
            </DemoFrame>
        </PageShell>
    );
}
