import DemoFrame from "@/components/ui/demo-frame";
import UseReduxDemo from "@/projects/hooks-refresh/demos/use-redux-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ReduxDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-redux-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const WHY_REDUX_TEXT = [
    {
        title: "What Redux is",
        href: "#what-redux-is",
        text: (
            <>
                One global store, split into <Mono>slices</Mono> by domain. Modern
                Redux is Redux Toolkit — the old boilerplate is gone.
            </>
        ),
    },
    {
        title: "The problem it solves",
        href: "#the-problem-it-solves",
        text: (
            <>
                Distant components share state without prop drilling — the layers in
                between stop carrying props they never read.
            </>
        ),
    },
    {
        title: "Context vs Redux",
        href: "#context-vs-redux",
        text: (
            <>
                Context re-renders every consumer on any change;{" "}
                <Mono>useSelector</Mono> subscribes to one slice only.
            </>
        ),
    },
];

const SETUP_TEXT = [
    {
        title: "The store",
        href: "#the-store",
        text: (
            <>
                <Mono>configureStore</Mono> maps slice name → reducer, and{" "}
                <Mono>RootState</Mono>/<Mono>AppDispatch</Mono> are inferred from it.
            </>
        ),
    },
    {
        title: "The provider",
        href: "#the-provider",
        text: (
            <>
                A <Mono>&quot;use client&quot;</Mono> StoreProvider inside a server
                layout — and a store built PER REQUEST, never a singleton.
            </>
        ),
    },
];

const SLICES_TEXT = [
    {
        title: "createSlice",
        href: "#createslice",
        text: (
            <>
                name + initialState + reducers, with actions auto-generated. Immer
                makes the &quot;mutations&quot; safe here only.
            </>
        ),
    },
];

const USING_IT_TEXT = [
    {
        title: "useSelector & useDispatch",
        href: "#useselector-usedispatch-typed-hooks",
        text: (
            <>
                Select the piece you need, dispatch an action to change it. Define
                typed hooks once and use those everywhere.
            </>
        ),
    },
    {
        title: "Selector references",
        href: "#selector-references",
        text: (
            <>
                A selector returning a new object each call re-renders on EVERY
                dispatch — select narrow, or <Mono>createSelector</Mono>.
            </>
        ),
    },
];

const ASYNC_TEXT = [
    {
        title: "createAsyncThunk",
        href: "#createasyncthunk",
        text: (
            <>
                Reducers stay pure; a thunk auto-dispatches pending/fulfilled/rejected
                into <Mono>extraReducers</Mono>.
            </>
        ),
    },
    {
        title: "Async in Next.js",
        href: "#async-in-next-js",
        text: (
            <>
                Fetch initial data in a Server Component and pass props; keep thunks
                for client-triggered async.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof WHY_REDUX_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const WHY_REDUX: SummaryArticle[] = WHY_REDUX_TEXT.map(withSeverities);
const SETUP: SummaryArticle[] = SETUP_TEXT.map(withSeverities);
const SLICES: SummaryArticle[] = SLICES_TEXT.map(withSeverities);
const USING_IT: SummaryArticle[] = USING_IT_TEXT.map(withSeverities);
const ASYNC: SummaryArticle[] = ASYNC_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Why Redux", items: WHY_REDUX },
                        { label: "Setup (Next.js)", items: SETUP },
                        { label: "Slices", items: SLICES },
                        { label: "Using it", items: USING_IT },
                        { label: "Async", items: ASYNC },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="Redux"
                source="@reduxjs/toolkit"
                docs={<ReduxDocs />}
                description={
                    <>
                        One <Term>global store</Term> any component can read from and
                        dispatch to, split into <code>slices</code> by domain.{" "}
                        <Code>useSelector</Code> subscribes to just the piece a
                        component needs — the partial subscription Context cannot do —
                        while Redux Toolkit removes the boilerplate the library was
                        once known for. In the App Router the store is client-only and
                        must be created per request.
                    </>
                }
            >
                <UseReduxDemo />
            </DemoFrame>
        </PageShell>
    );
}
