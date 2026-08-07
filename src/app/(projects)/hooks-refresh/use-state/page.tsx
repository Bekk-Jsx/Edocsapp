import DemoFrame from "@/components/ui/demo-frame";
import UseStateDemo from "@/projects/hooks-refresh/demos/use-state-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import { UseStateDocs, SECTION_SEVERITIES } from "@/projects/hooks-refresh/content/use-state-content";

const CODE = `"use client";
import { useState } from "react";

function readInitial(): number {
  return 0; // lazy: runs once on mount, not every render
}

export default function Counter() {
  const [count, setCount] = useState(readInitial); // pass the fn, don't call it

  // Stale: captures \`count\` at click time -> 3 fast clicks = +1
  const staleInc = () => setTimeout(() => setCount(count + 1), 800);

  // Functional: updater gets latest state -> 3 fast clicks = +3
  const funcInc = () => setTimeout(() => setCount((c) => c + 1), 800);

  return <button onClick={funcInc}>{count}</button>;
}`;

// Glanceable chapter takeaways — reading only these gives the whole chapter.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const SUMMARY_TEXT = [
    {
        title: "Render & persistence",
        href: "#render-persistence",
        text: (
            <>
                Plain <Mono>let</Mono>/<Mono>const</Mono> can&apos;t survive a render —{" "}
                <Mono>useState</Mono> is what persists a value: React stores it outside
                the function and hands it back on the next render.
            </>
        ),
    },
    {
        title: "State is a snapshot",
        href: "#state-is-a-snapshot",
        text: (
            <>
                State is a fixed, read-only snapshot for the whole render — it never
                changes mid-render.
            </>
        ),
    },
    {
        title: "Scheduling & bail-out",
        href: "#scheduling-bail-out",
        text: (
            <>
                A setter requests a re-render, it doesn&apos;t guarantee one — React
                bails out when the value is unchanged.
            </>
        ),
    },
    {
        title: "Batching",
        href: "#batching",
        text: (
            <>
                Several <Mono>setState</Mono> calls in one tick are batched — they
                collapse into a single re-render.
            </>
        ),
    },
    {
        title: "Value vs function form",
        href: "#value-form-vs-function-form",
        text: (
            <>
                <Mono>setCount(count + 1)</Mono> ×3 all read the same stale snapshot and
                settle at <Mono>1</Mono>; <Mono>setCount(c =&gt; c + 1)</Mono> ×3 thread
                through the queue (<Mono>0→1→2→3</Mono>) and settle at <Mono>3</Mono>.
            </>
        ),
    },
    {
        title: "Lazy initializer",
        href: "#lazy-initializer",
        text: (
            <>
                Pass the initializer function, don&apos;t call it — it runs once on
                mount, not on every render.
            </>
        ),
    },
];

// Part 2 of the page — the reference rule that only bites once state stops being
// a primitive. Same ordering contract as above: page order, one article each.
const OBJECTS_TEXT = [
    {
        title: "Never mutate, replace",
        href: "#never-mutate-replace",
        text: (
            <>
                Object/array state needs a NEW reference — mutating the existing one
                won&apos;t re-render; spread to copy and override.
            </>
        ),
    },
    {
        title: "Nested objects",
        href: "#nested-objects",
        text: (
            <>
                Spread is shallow: to change a nested field, spread at every level
                down to it — a new object at each level along the path.
            </>
        ),
    },
    {
        title: "Arrays",
        href: "#arrays",
        text: (
            <>
                Return a new array with <Mono>[...arr, x]</Mono> / <Mono>map</Mono> /{" "}
                <Mono>filter</Mono>; avoid <Mono>push</Mono>/<Mono>splice</Mono>/
                <Mono>sort</Mono>/<Mono>reverse</Mono>, which mutate in place and skip
                the render.
            </>
        ),
    },
    {
        title: "Functional updater for objects & arrays",
        href: "#functional-updater-for-objects-arrays",
        text: (
            <>
                Build updates from <Mono>prev</Mono> with{" "}
                <Mono>setX(prev =&gt; ...)</Mono> so batched/async updates don&apos;t
                spread a stale collection; wrap object returns in{" "}
                <Mono>( )</Mono>.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof SUMMARY_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

// The two groups mirror the part dividers in the content file.
const SUMMARY_GROUPS = [
    { label: "Basics", items: SUMMARY_TEXT.map(withSeverities) },
    { label: "Objects & arrays", items: OBJECTS_TEXT.map(withSeverities) },
];

export default function Page() {
    return (
        <PageShell alerts={<SummaryArticles groups={SUMMARY_GROUPS} />}>
            <DemoFrame
                name="useState"
                source="react"
                code={CODE}
                docs={<UseStateDocs />}
                description={
                    <>
                        Local, component-scoped state that React stores across renders — a{" "}
                        <strong className="text-[var(--text)]">read-only snapshot</strong> for
                        the current render, where setting it{" "}
                        <strong className="text-[var(--text)]">schedules</strong> the next
                        render rather than mutating the value now.
                    </>
                }
            >
                <UseStateDemo />
            </DemoFrame>
        </PageShell>
    );
}