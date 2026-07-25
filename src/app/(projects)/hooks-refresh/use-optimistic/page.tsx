import DemoFrame from "@/components/ui/demo-frame";
import UseOptimisticDemo from "@/projects/hooks-refresh/demos/use-optimistic-demo";
import { UseOptimisticDocs } from "@/projects/hooks-refresh/content/use-optimistic-content";
import { Term } from "@/components/ui/doc-section";

const CODE = `// app/messages/actions.ts
"use server";
export async function sendMessage(text: string): Promise<Message> {
  const saved = await db.insert("messages", { text });
  return saved;
}

// app/messages/page.tsx
"use client";
import { useOptimistic, useState } from "react";
import { sendMessage } from "./actions";

type Message = { id: string; text: string; pending?: boolean };

export default function Chat({ initial }: { initial: Message[] }) {
  const [messages, setMessages] = useState(initial);

  const [optimistic, addOptimistic] = useOptimistic<Message[], string>(
    messages,
    (state, text) => [...state, { id: "temp", text, pending: true }],
  );

  async function submit(formData: FormData) {
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return;
    addOptimistic(text);                       // instant UI overlay
    const saved = await sendMessage(text);     // server round-trip
    setMessages((prev) => [...prev, saved]);   // commit the real value
  }

  return (
    <form action={submit}>
      <input name="text" />
      <button type="submit">send</button>
      <ul>
        {optimistic.map((m) => (
          <li key={m.id}>{m.text}{m.pending && " (sending…)"}</li>
        ))}
      </ul>
    </form>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useOptimistic"
            source="react"
            code={CODE}
            docs={<UseOptimisticDocs />}
            description={
                <>
                    Show an <Term>optimistic overlay</Term> on top of real state
                    while an action is in flight. Instant UI, automatic revert on
                    error — the overlay is a derived view, not stored state.
                    Pair it with Server Actions to erase perceived latency
                    without lying about what&apos;s actually committed.
                </>
            }
        >
            <UseOptimisticDemo />
        </DemoFrame>
    );
}
