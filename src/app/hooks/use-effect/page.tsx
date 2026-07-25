import DemoFrame from "@/components/ui/demo-frame";
import UseEffectDemo from "@/components/demos/use-effect-demo";
import { UseEffectDocs } from "./content";
import { Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useEffect, useState } from "react";

export default function ChatRoom({ room }: { room: string }) {
  useEffect(() => {
    const conn = createConnection(room); // set up
    conn.connect();

    return () => conn.disconnect();       // cleanup: before re-sync + on unmount
  }, [room]);                             // re-sync only when \`room\` changes

  return <h1>Room: {room}</h1>;
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useEffect"
            source="react"
            code={CODE}
            docs={<UseEffectDocs />}
            description={
                <>
                    Synchronize a component with an{" "}
                    <Term>external system</Term> after render — subscriptions, the DOM,
                    timers, network. Not for deriving state from props: the dependency
                    array controls re-syncing, and the returned cleanup keeps every setup
                    paired with a teardown.
                </>
            }
        >
            <UseEffectDemo />
        </DemoFrame>
    );
}