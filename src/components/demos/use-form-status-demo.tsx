"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type State = { message: string };
const initial: State = { message: "" };

async function postMessage(_prev: State, formData: FormData): Promise<State> {
    const text = (formData.get("text") ?? "").toString().trim();
    await new Promise((r) => setTimeout(r, 1200));
    if (!text) return { message: "empty message ignored" };
    return { message: `posted: “${text}”` };
}

// Rendered INSIDE the <form>. useFormStatus reads the nearest ancestor form.
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)] disabled:opacity-60"
        >
            {pending ? (
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[var(--amber)]" />
                    posting…
                </span>
            ) : (
                "post"
            )}
        </button>
    );
}

export default function UseFormStatusDemo() {
    const [state, action] = useActionState(postMessage, initial);

    return (
        <form action={action} className="space-y-3">
            <div className="flex gap-2">
                <input
                    name="text"
                    placeholder="say something"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <SubmitButton />
            </div>

            {state.message && (
                <p className="font-mono text-xs text-[var(--muted)]">
                    {state.message}
                </p>
            )}

            <p className="text-xs text-[var(--muted)]">
                The <span className="font-mono">SubmitButton</span> lives inside
                the form and reads its own status — the parent doesn&apos;t need
                to pass <span className="font-mono">isPending</span> down as a
                prop.
            </p>
        </form>
    );
}
