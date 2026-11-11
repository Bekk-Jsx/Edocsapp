import DemoFrame from "@/components/ui/demo-frame";
import UseContextDemo from "@/projects/hooks-refresh/demos/use-context-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseContextDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-context-content";
import { Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const CREATION_TEXT = [
    {
        title: "createContext",
        href: "#createcontext",
        text: (
            <>
                <Mono>createContext</Mono> returns a channel with a Provider and a
                readable context; the default value is only a fallback for consumers
                that have no provider above them.
            </>
        ),
    },
    {
        title: "The provider",
        href: "#the-provider",
        text: (
            <>
                The Provider owns the state and actions; keep <Mono>useState</Mono> in
                the module, not the route file.
            </>
        ),
    },
    {
        title: "Stable value",
        href: "#stable-value",
        text: (
            <>
                An inline <Mono>value</Mono> object is a new reference every render, so
                all consumers re-render — stabilize it (<Mono>useMemo</Mono>).
            </>
        ),
    },
    {
        title: "Client boundary",
        href: "#client-boundary",
        text: (
            <>
                The context module is client-only: only client components can provide or
                consume; give Server Components their data via props.
            </>
        ),
    },
];

const USAGE_TEXT = [
    {
        title: "Consuming the value",
        href: "#consuming-the-value",
        text: (
            <>
                <Mono>useContext(AuthContext)</Mono> reads the nearest provider above;
                where you mount the provider sets the scope, and a nested same-context
                provider overrides it for its subtree.
            </>
        ),
    },
    {
        title: "Missing provider",
        href: "#missing-provider",
        text: (
            <>
                No provider above returns the <Mono>createContext</Mono> default (
                <Mono>null</Mono>), not an error — it crashes later; guard consumers so a
                forgotten provider fails clearly.
            </>
        ),
    },
    {
        title: "All consumers re-render",
        href: "#all-consumers-re-render",
        text: (
            <>
                Context has no partial subscription: any value change re-renders every
                consumer — keep <Mono>value</Mono> stable and split differently-paced
                state into separate contexts.
            </>
        ),
    },
    {
        title: "Server components can't consume",
        href: "#server-components-can-t-consume",
        text: (
            <>
                <Mono>useContext</Mono> is client-only; Server Components fetch on the
                server and pass data as props rather than routing it through context.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof CREATION_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const CREATION: SummaryArticle[] = CREATION_TEXT.map(withSeverities);
const USAGE: SummaryArticle[] = USAGE_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Creation", items: CREATION },
                        { label: "Usage", items: USAGE },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useContext"
                source="react"
                docs={<UseContextDocs />}
                description={
                    <>
                        Reads a value from the{" "}
                        <Term>nearest Provider above it</Term>, removing prop drilling.
                        The value is created once and provided to a subtree; any
                        descendant consumes it.
                    </>
                }
            >
                <UseContextDemo />
            </DemoFrame>
        </PageShell>
    );
}
