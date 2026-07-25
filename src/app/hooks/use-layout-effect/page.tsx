import DemoFrame from "@/components/ui/demo-frame";
import UseLayoutEffectDemo from "@/components/demos/use-layout-effect-demo";
import { UseLayoutEffectDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useLayoutEffect, useRef, useState } from "react";

export default function Tooltip({ show }: { show: boolean }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  // Read layout, then write layout — synchronously, BEFORE paint.
  // No setState in the effect body: mutate the tip through its ref.
  useLayoutEffect(() => {
    if (!show) return;
    const rect = triggerRef.current!.getBoundingClientRect();
    const tip = tipRef.current!;
    const above = window.innerHeight - rect.bottom < tip.offsetHeight + 8;
    tip.style.top = above ? "auto" : "calc(100% + 6px)";
    tip.style.bottom = above ? "calc(100% + 6px)" : "auto";
  }, [show]);

  // ...render trigger + absolutely-positioned tip
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useLayoutEffect"
            source="react"
            code={CODE}
            docs={<UseLayoutEffectDocs />}
            description={
                <>
                    Run an effect <Term>synchronously after DOM mutation and before
                        the browser paints</Term>. Use it when you need to{" "}
                    <Code>measure</Code> the DOM and adjust layout without a visible
                    flicker — otherwise stay on <Code>useEffect</Code>.
                </>
            }
        >
            <UseLayoutEffectDemo />
        </DemoFrame>
    );
}
