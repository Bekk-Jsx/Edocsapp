import DemoFrame from "@/components/ui/demo-frame";
import UseReducerDemo from "@/projects/hooks-refresh/demos/use-reducer-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseReducerDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-reducer-content";
import { Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const INLINE_TEXT = [
    {
        title: "Step 1 · state shape",
        href: "#step-1-state-shape",
        text: (
            <>
                <Mono>{"{ todos, nextId }"}</Mono> — decide the shape first; keeping the
                id counter IN state is what lets the reducer stay pure.
            </>
        ),
    },
    {
        title: "Step 2 · actions",
        href: "#step-2-actions",
        text: (
            <>
                An action says what HAPPENED, not what to set. <Mono>type</Mono> is
                required, extra fields are the payload, and the union narrows each case.
            </>
        ),
    },
    {
        title: "Step 3 · the reducer",
        href: "#step-3-the-reducer",
        text: (
            <>
                <Mono>(state, action) =&gt; newState</Mono>, pure, returning a NEW object
                every case — React compares by reference to decide the re-render.
            </>
        ),
    },
    {
        title: "Step 4 · wiring useReducer",
        href: "#step-4-wiring-usereducer",
        text: (
            <>
                <Mono>useReducer(reducer, initialState)</Mono> gives you the current
                value and <Mono>dispatch</Mono>; dispatching is the only way in.
            </>
        ),
    },
    {
        title: "Step 5 · dispatching from the UI",
        href: "#step-5-dispatching-from-the-ui",
        text: (
            <>
                The UI only dispatches; the reducer owns the transitions.{" "}
                <Mono>dispatch</Mono> is stable — no <Mono>useCallback</Mono> to pass it
                down.
            </>
        ),
    },
];

const MODULE_TEXT = [
    {
        title: "types.ts",
        href: "#types-ts",
        text: (
            <>
                <Mono>State</Mono>, <Mono>Todo</Mono> and <Mono>Action</Mono> in a module
                that imports nothing, so nothing downstream can cycle.
            </>
        ),
    },
    {
        title: "reducer.ts",
        href: "#reducer-ts",
        text: (
            <>
                <Mono>import type {"{"} State, Action {"}"}</Mono> and export the pure
                function — importing shares the LOGIC, never the state.
            </>
        ),
    },
    {
        title: "initial-state.ts + lazy init",
        href: "#initial-state-ts-lazy-init",
        text: (
            <>
                With a 3rd arg the 2nd becomes the SEED:{" "}
                <Mono>useReducer(reducer, seed, init)</Mono> calls{" "}
                <Mono>init(seed)</Mono> once, on mount.
            </>
        ),
    },
    {
        title: "Using it in a component",
        href: "#using-it-in-a-component",
        text: (
            <>
                Import the reducer and the initial state; the state is created fresh here
                and is LOCAL to this component instance.
            </>
        ),
    },
    {
        title: "Sharing across components",
        href: "#sharing-across-components",
        text: (
            <>
                Call the hook once in a provider and pass{" "}
                <Mono>{"{ state, dispatch }"}</Mono> via context — the reducer manages,
                context distributes.
            </>
        ),
    },
    {
        title: "useReducer + context vs useContext alone",
        href: "#usereducer-context-vs-usecontext-alone",
        text: (
            <>
                Centralized transitions versus scattered handlers — worth the indirection
                when transitions are many or interdependent, not for two values.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof INLINE_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const INLINE: SummaryArticle[] = INLINE_TEXT.map(withSeverities);
const MODULE: SummaryArticle[] = MODULE_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Inline", items: INLINE },
                        { label: "As a module", items: MODULE },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useReducer"
                source="react"
                docs={<UseReducerDocs />}
                description={
                    <>
                        State whose every transition is centralized in one{" "}
                        <Term>pure reducer</Term>: <code>(state, action)</code> in, the
                        next state out. Components stop setting values and start
                        dispatching typed actions — built here step by step on a todo
                        list, then extracted into its own modules.
                    </>
                }
            >
                <UseReducerDemo />
            </DemoFrame>
        </PageShell>
    );
}
