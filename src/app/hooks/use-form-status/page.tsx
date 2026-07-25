import DemoFrame from "@/components/ui/demo-frame";
import UseFormStatusDemo from "@/components/demos/use-form-status-demo";
import { UseFormStatusDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `// app/post/actions.ts
"use server";
export async function postMessage(_prev: State, formData: FormData): Promise<State> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { message: "empty message ignored" };
  await db.insert("posts", { text });
  return { message: \`posted: "\${text}"\` };
}

// app/post/submit-button.tsx  — a reusable child
"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();       // reads the ancestor <form>
  return (
    <button type="submit" disabled={pending}>
      {pending ? "posting…" : "post"}
    </button>
  );
}

// app/post/page.tsx
"use client";
import { useActionState } from "react";
import { postMessage } from "./actions";
import { SubmitButton } from "./submit-button";

export default function Page() {
  const [state, action] = useActionState(postMessage, { message: "" });
  return (
    <form action={action}>
      <input name="text" />
      <SubmitButton />          {/* rendered INSIDE the form → sees pending */}
      {state.message && <p>{state.message}</p>}
    </form>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useFormStatus"
            source="react"
            code={CODE}
            docs={<UseFormStatusDocs />}
            description={
                <>
                    Read the <Term>nearest ancestor form&apos;s</Term> submission
                    state from a nested widget — no prop drilling. Import from{" "}
                    <Code>react-dom</Code>, and remember the hook only works from
                    a component rendered <em>inside</em> the form, not from the
                    one that owns it.
                </>
            }
        >
            <UseFormStatusDemo />
        </DemoFrame>
    );
}
