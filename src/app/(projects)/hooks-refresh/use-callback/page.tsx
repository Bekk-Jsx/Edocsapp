import DemoFrame from "@/components/ui/demo-frame";
import UseCallbackDemo from "@/projects/hooks-refresh/demos/use-callback-demo";
import { UseCallbackDocs } from "@/projects/hooks-refresh/content/use-callback-content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { memo, useCallback, useState } from "react";

const MemoChild = memo(function MemoChild({ onPress }: { onPress: () => void }) {
  // Only re-renders when onPress identity changes.
  return <button onClick={onPress}>press</button>;
});

export default function Parent() {
  const [ticks, setTicks] = useState(0);
  const [pressed, setPressed] = useState(0);

  // Stable across parent renders → memo child stays put on unrelated ticks.
  const stable = useCallback(() => setPressed((p) => p + 1), []);

  // Fresh every render → memo child re-renders on every parent update.
  const unstable = () => setPressed((p) => p + 1);

  return (
    <>
      <button onClick={() => setTicks((t) => t + 1)}>tick ({ticks})</button>
      <MemoChild onPress={stable} />
      <MemoChild onPress={unstable} />
    </>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useCallback"
            source="react"
            code={CODE}
            docs={<UseCallbackDocs />}
            description={
                <>
                    Cache a function&apos;s <Term>identity</Term> between renders.
                    Useful only when a consumer compares by identity — a{" "}
                    <Code>React.memo</Code> child, or a dependency in{" "}
                    <Code>useEffect</Code> / <Code>useMemo</Code>. Anywhere else
                    it&apos;s noise the compiler will soon handle for you.
                </>
            }
        >
            <UseCallbackDemo />
        </DemoFrame>
    );
}
