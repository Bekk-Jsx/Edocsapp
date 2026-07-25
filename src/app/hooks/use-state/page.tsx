import DemoFrame from "@/components/ui/demo-frame";
import UseStateDemo from "@/components/demos/use-state-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, { Mono } from "@/components/ui/summary-articles";
import { UseStateDocs } from "./content";

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
const SUMMARY = [
    {
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
        href: "#state-is-a-snapshot",
        text: (
            <>
                State is a fixed, read-only snapshot for the whole render — it never
                changes mid-render.
            </>
        ),
    },
    {
        href: "#scheduling-bail-out",
        text: (
            <>
                A setter requests a re-render, it doesn&apos;t guarantee one — React
                bails out when the value is unchanged.
            </>
        ),
    },
    {
        href: "#batching",
        text: (
            <>
                Several <Mono>setState</Mono> calls in one tick are batched — they
                collapse into a single re-render.
            </>
        ),
    },
    {
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
        href: "#lazy-initializer",
        text: (
            <>
                Pass the initializer function, don&apos;t call it — it runs once on
                mount, not on every render.
            </>
        ),
    },
    {
        href: "#react-vs-next-js",
        text: (
            <>
                <Mono>useState</Mono> is identical in Next.js; the only wrinkle is{" "}
                <Mono>&quot;use client&quot;</Mono> — a Server Component can&apos;t hold
                state.
            </>
        ),
    },
];

export default function Page() {
    return (
        <PageShell alerts={<SummaryArticles items={SUMMARY} />}>
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