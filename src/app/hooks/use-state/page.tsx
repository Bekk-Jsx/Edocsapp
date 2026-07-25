import DemoFrame from "@/components/ui/demo-frame";
import UseStateDemo from "@/components/demos/use-state-demo";
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

export default function Page() {
    return (
        <DemoFrame
            name="useState"
            source="react"
            code={CODE}
            docs={<UseStateDocs />}
            description={
                <>
                    Local, component-scoped state. The refresh-worthy parts: the{" "}
                    <strong className="text-[var(--text)]">functional updater</strong>{" "}
                    (avoids stale closures) and the{" "}
                    <strong className="text-[var(--text)]">lazy initializer</strong>{" "}
                    (compute the initial value once).
                </>
            }
        >
            <UseStateDemo />
        </DemoFrame>
    );
}