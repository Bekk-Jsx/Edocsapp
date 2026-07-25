import DemoFrame from "@/components/ui/demo-frame";
import UseActionStateDemo from "@/components/demos/use-action-state-demo";
import { UseActionStateDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `// app/save-name/actions.ts
"use server";

type State = { status: "idle" | "ok" | "err"; message: string; savedName: string };

export async function submitName(prev: State, formData: FormData): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { status: "err", message: "name must be at least 2 characters", savedName: prev.savedName };
  }
  await db.saveName(name);              // runs on the server
  return { status: "ok", message: \`saved as "\${name}"\`, savedName: name };
}

// app/save-name/page.tsx
"use client";
import { useActionState } from "react";
import { submitName } from "./actions";

const initial = { status: "idle" as const, message: "", savedName: "" };

export default function Page() {
  const [state, formAction, isPending] = useActionState(submitName, initial);
  return (
    <form action={formAction}>
      <input name="name" defaultValue={state.savedName} disabled={isPending} />
      <button type="submit" disabled={isPending}>{isPending ? "saving…" : "save"}</button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useActionState"
            source="react"
            code={CODE}
            docs={<UseActionStateDocs />}
            description={
                <>
                    Reducer-shaped state where the &quot;dispatch&quot; is a{" "}
                    <Term>form action</Term>. Wire the returned{" "}
                    <Code>formAction</Code> to{" "}
                    <Code>&lt;form action&gt;</Code>, read{" "}
                    <Code>state</Code> for the result, and{" "}
                    <Code>isPending</Code> for the transition — built to pair with
                    Server Actions.
                </>
            }
        >
            <UseActionStateDemo />
        </DemoFrame>
    );
}
