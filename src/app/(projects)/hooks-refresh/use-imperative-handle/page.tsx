import DemoFrame from "@/components/ui/demo-frame";
import UseImperativeHandleDemo from "@/projects/hooks-refresh/demos/use-imperative-handle-demo";
import { UseImperativeHandleDocs } from "@/projects/hooks-refresh/content/use-imperative-handle-content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useImperativeHandle, useRef, useState, type Ref } from "react";

type FancyInputHandle = { focus: () => void; clear: () => void };

// React 19: ref is a normal prop — no forwardRef.
function FancyInput({ ref }: { ref?: Ref<FancyInputHandle> }) {
  const domRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useImperativeHandle(ref, () => ({
    focus: () => domRef.current?.focus(),
    clear: () => setValue(""),
  }), []);

  return <input ref={domRef} value={value} onChange={(e) => setValue(e.target.value)} />;
}

export default function Parent() {
  const inputRef = useRef<FancyInputHandle>(null);
  return (
    <>
      <FancyInput ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>focus</button>
      <button onClick={() => inputRef.current?.clear()}>clear</button>
    </>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useImperativeHandle"
            source="react"
            code={CODE}
            docs={<UseImperativeHandleDocs />}
            description={
                <>
                    Choose the API a parent gets through <Code>ref</Code>. Expose a
                    small named surface — <Term>focus, clear, scrollTo</Term> —
                    instead of leaking the DOM node. In React 19,{" "}
                    <Code>ref</Code> is a normal prop and{" "}
                    <Code>forwardRef</Code> is no longer needed.
                </>
            }
        >
            <UseImperativeHandleDemo />
        </DemoFrame>
    );
}
