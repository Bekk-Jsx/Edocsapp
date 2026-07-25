import DemoFrame from "@/components/ui/demo-frame";
import UseIdDemo from "@/components/demos/use-id-demo";
import { UseIdDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useId } from "react";

function EmailField() {
  const id = useId();
  const descId = \`\${id}-desc\`;

  return (
    <>
      <label htmlFor={id}>email</label>
      <input id={id} type="email" aria-describedby={descId} />
      <p id={descId}>we&apos;ll never share your email.</p>
    </>
  );
}

// Two instances → two independent base IDs. Server and client agree on both,
// so hydration is mismatch-free.`;

export default function Page() {
    return (
        <DemoFrame
            name="useId"
            source="react"
            code={CODE}
            docs={<UseIdDocs />}
            description={
                <>
                    Generate a <Term>hydration-safe unique string</Term> per
                    component instance. Use one call as a base and derive related
                    IDs by concatenation for <Code>htmlFor</Code>,{" "}
                    <Code>aria-describedby</Code>, and friends — never for list
                    keys.
                </>
            }
        >
            <UseIdDemo />
        </DemoFrame>
    );
}
