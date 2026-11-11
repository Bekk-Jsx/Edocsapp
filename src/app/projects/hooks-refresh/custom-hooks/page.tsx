import DemoFrame from "@/components/ui/demo-frame";
import CustomHooksDemo from "@/projects/hooks-refresh/demos/custom-hooks-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    CustomHooksDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/custom-hooks-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const BASICS_TEXT = [
    {
        title: "The definition",
        href: "#the-definition",
        text: (
            <>
                A function with a <Mono>use*</Mono> name that calls other hooks. No
                special syntax.
            </>
        ),
    },
    {
        title: "Shares logic, not state",
        href: "#shares-logic-not-state",
        text: (
            <>
                Two callers, two separate states. Sharing state needs a Context or
                store underneath.
            </>
        ),
    },
    {
        title: "Args, return, composition, rules",
        href: "#args-return-composition-rules",
        text: (
            <>
                Any arguments, any return; hooks call hooks; top-level only — the{" "}
                <Mono>use*</Mono> prefix is what the linter reads.
            </>
        ),
    },
];

const EXAMPLES_TEXT = [
    {
        title: "useFetch",
        href: "#usefetch-data-fetching",
        text: (
            <>
                data / loading / error in one hook — plus the <Mono>cancelled</Mono>{" "}
                flag and the <Mono>res.ok</Mono> check.
            </>
        ),
    },
    {
        title: "useLocalStorage",
        href: "#uselocalstorage-persistent-state",
        text: (
            <>
                <Mono>useState</Mono>&apos;s API, persisted. Needs the{" "}
                <Mono>typeof window</Mono> guard for SSR.
            </>
        ),
    },
    {
        title: "useAuth",
        href: "#useauth-wrapping-a-context",
        text: (
            <>
                Wraps a context + a null check — the one example here that DOES share
                state across callers.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof BASICS_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const BASICS: SummaryArticle[] = BASICS_TEXT.map(withSeverities);
const EXAMPLES: SummaryArticle[] = EXAMPLES_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "What a custom hook is", items: BASICS },
                        { label: "Real examples", items: EXAMPLES },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="Custom Hooks"
                source="react"
                docs={<CustomHooksDocs />}
                description={
                    <>
                        A custom hook is just a function whose name starts with{" "}
                        <Code>use</Code> and that calls other hooks — the way you{" "}
                        <Term>extract and reuse stateful logic</Term>. Every caller gets
                        its own state, so a hook shares the logic and not the values;
                        sharing values takes a Context underneath. Three worth writing:{" "}
                        <Code>useFetch</Code>, <Code>useLocalStorage</Code>,{" "}
                        <Code>useAuth</Code>.
                    </>
                }
            >
                <CustomHooksDemo />
            </DemoFrame>
        </PageShell>
    );
}
