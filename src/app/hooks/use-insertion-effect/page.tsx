import DemoFrame from "@/components/ui/demo-frame";
import UseInsertionEffectDemo from "@/components/demos/use-insertion-effect-demo";
import { UseInsertionEffectDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useInsertionEffect } from "react";

// Toy version of what a CSS-in-JS library does internally.
function useInjectedRule(className: string, css: string) {
  useInsertionEffect(() => {
    const el = document.createElement("style");
    el.textContent = \`.\${className} { \${css} }\`;
    document.head.appendChild(el);
    return () => el.remove();
  }, [className, css]);
}

// Rules of the hook (React enforces these):
// - runs BEFORE useLayoutEffect, before refs are attached
// - do NOT read layout (getBoundingClientRect, offsetHeight)
// - do NOT call setState
// - do ONE thing: append or remove a stylesheet`;

export default function Page() {
    return (
        <DemoFrame
            name="useInsertionEffect"
            source="react"
            code={CODE}
            docs={<UseInsertionEffectDocs />}
            description={
                <>
                    Inject a <Code>&lt;style&gt;</Code> tag <Term>before layout runs</Term>.
                    It exists for CSS-in-JS libraries — application code almost
                    never calls it directly. You cannot read layout or call{" "}
                    <Code>setState</Code> inside it.
                </>
            }
        >
            <UseInsertionEffectDemo />
        </DemoFrame>
    );
}
