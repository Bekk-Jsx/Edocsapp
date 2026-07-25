import DemoFrame from "@/components/ui/demo-frame";
import UseRefDemo from "@/components/demos/use-ref-demo";
import { UseRefDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useRef, useState } from "react";

export default function Example() {
  // (a) DOM ref — React fills .current after mount.
  const inputRef = useRef<HTMLInputElement>(null);

  // (b) Mutable box — survives renders, never triggers one.
  const clicksRef = useRef(0);
  const [revealed, setRevealed] = useState<number | null>(null);

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>focus</button>

      <button onClick={() => { clicksRef.current += 1; }}>silent click</button>
      <button onClick={() => setRevealed(clicksRef.current)}>reveal</button>
    </>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useRef"
            source="react"
            code={CODE}
            docs={<UseRefDocs />}
            description={
                <>
                    Hold a value across renders without triggering one. Attach it to
                    a DOM node via <Code>ref</Code>, or use{" "}
                    <Code>.current</Code> as a <Term>mutable box</Term> React
                    won&apos;t watch — perfect for DOM handles, timer IDs, previous
                    values.
                </>
            }
        >
            <UseRefDemo />
        </DemoFrame>
    );
}
