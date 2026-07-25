import DemoFrame from "@/components/ui/demo-frame";
import UseContextDemo from "@/projects/hooks-refresh/demos/use-context-demo";
import { UseContextDocs } from "@/projects/hooks-refresh/content/use-context-content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { createContext, useContext, useMemo, useState } from "react";

type User = { name: string; role: "admin" | "guest" };
const UserContext = createContext<User | null>(null);

function useUser() {
  const u = useContext(UserContext);
  if (!u) throw new Error("useUser must be used inside <UserContext>");
  return u;
}

export default function Shell() {
  const [i, setI] = useState(0);
  // memoize the value so identity stays stable across unrelated re-renders
  const user = useMemo<User>(
    () => (i === 0 ? { name: "amina", role: "admin" } : { name: "guest-01", role: "guest" }),
    [i],
  );

  return (
    <UserContext value={user}>
      <Header />
      <Sidebar />
    </UserContext>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useContext"
            source="react"
            code={CODE}
            docs={<UseContextDocs />}
            description={
                <>
                    Deliver a value <Term>through the tree without prop drilling</Term>.
                    Consumers re-render when the provider&apos;s value changes by
                    <Code>Object.is</Code>, so keep the value&apos;s identity stable
                    with <Code>useMemo</Code> or you&apos;ll defeat any downstream
                    memoization.
                </>
            }
        >
            <UseContextDemo />
        </DemoFrame>
    );
}
