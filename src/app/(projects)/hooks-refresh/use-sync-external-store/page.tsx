import DemoFrame from "@/components/ui/demo-frame";
import UseSyncExternalStoreDemo from "@/projects/hooks-refresh/demos/use-sync-external-store-demo";
import { UseSyncExternalStoreDocs } from "@/projects/hooks-refresh/content/use-sync-external-store-content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useSyncExternalStore } from "react";

// 1. subscribe: attach a listener, return an unsubscribe.
function subscribe(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

// 2. getSnapshot: read the current value synchronously.
const getSnapshot = () => navigator.onLine;

// 3. getServerSnapshot: safe default for SSR + first client render.
//    Omit this and React throws during server rendering.
const getServerSnapshot = () => true;

export default function OnlineBadge() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <span>{online ? "online" : "offline"}</span>;
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useSyncExternalStore"
            source="react"
            code={CODE}
            docs={<UseSyncExternalStoreDocs />}
            description={
                <>
                    Subscribe a component to a <Term>non-React source</Term> —
                    browser APIs, external stores — with tear-free reads across
                    concurrent renders. In SSR contexts you must supply{" "}
                    <Code>getServerSnapshot</Code>; without it, React throws during
                    the server pass or you hit a hydration mismatch.
                </>
            }
        >
            <UseSyncExternalStoreDemo />
        </DemoFrame>
    );
}
