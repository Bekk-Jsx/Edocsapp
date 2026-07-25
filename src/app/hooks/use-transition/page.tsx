import DemoFrame from "@/components/ui/demo-frame";
import UseTransitionDemo from "@/components/demos/use-transition-demo";
import { UseTransitionDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useState, useTransition } from "react";

export default function Filter() {
  const [query, setQuery] = useState("");        // urgent
  const [committed, setCommitted] = useState(""); // non-urgent
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <input
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);                              // urgent — outside
          startTransition(() => setCommitted(next));   // non-urgent — inside
        }}
      />
      {isPending && <span>updating…</span>}
      <List query={committed} />
    </>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useTransition"
            source="react"
            code={CODE}
            docs={<UseTransitionDocs />}
            description={
                <>
                    Mark a state update as <Term>non-urgent</Term> so React can
                    interrupt it to keep urgent updates (keystrokes, clicks)
                    responsive. Keep the input&apos;s own state{" "}
                    <em>outside</em> <Code>startTransition</Code>; wrap only the
                    derived state that drives the heavy re-render.
                </>
            }
        >
            <UseTransitionDemo />
        </DemoFrame>
    );
}
