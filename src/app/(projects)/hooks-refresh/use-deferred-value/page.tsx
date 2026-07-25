import DemoFrame from "@/components/ui/demo-frame";
import UseDeferredValueDemo from "@/projects/hooks-refresh/demos/use-deferred-value-demo";
import { UseDeferredValueDocs } from "@/projects/hooks-refresh/content/use-deferred-value-content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useDeferredValue, useState } from "react";

export default function Filter() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const stale = query !== deferred;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {stale && <span>stale…</span>}
      <List query={deferred} />
    </>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useDeferredValue"
            source="react"
            code={CODE}
            docs={<UseDeferredValueDocs />}
            description={
                <>
                    Take a value React lets you <Term>read a beat late</Term>. When
                    the source updates faster than the render can keep up, the
                    deferred copy sticks around until React catches up — so the
                    expensive UI trails, but the source stays crisp. Use when you{" "}
                    <em>don&apos;t</em> own the setter (that&apos;s what{" "}
                    <Code>useTransition</Code> is for).
                </>
            }
        >
            <UseDeferredValueDemo />
        </DemoFrame>
    );
}
