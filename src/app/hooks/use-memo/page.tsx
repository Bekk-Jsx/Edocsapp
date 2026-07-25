import DemoFrame from "@/components/ui/demo-frame";
import UseMemoDemo from "@/components/demos/use-memo-demo";
import { UseMemoDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useMemo, useState } from "react";

const ITEMS = /* ...5000 strings */;

export default function Filter() {
  const [query, setQuery] = useState("");
  const [ticks, setTicks] = useState(0);

  // Cached until \`query\` changes — ticking the counter never recomputes.
  const results = useMemo(
    () => ITEMS.filter((s) => s.includes(query)).sort().slice(0, 6),
    [query],
  );

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={() => setTicks((t) => t + 1)}>tick ({ticks})</button>
      <ul>{results.map((s) => <li key={s}>{s}</li>)}</ul>
    </>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useMemo"
            source="react"
            code={CODE}
            docs={<UseMemoDocs />}
            description={
                <>
                    Cache a <Term>computed value</Term> between renders. Skip
                    expensive work when inputs haven&apos;t changed, or hold an
                    object&apos;s identity steady so downstream memoization
                    survives. Treat the cache as a <Code>hint</Code> — never as a
                    correctness guarantee.
                </>
            }
        >
            <UseMemoDemo />
        </DemoFrame>
    );
}
