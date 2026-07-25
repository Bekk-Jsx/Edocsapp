"use client";

import { useActionState } from "react";

type State = {
    status: "idle" | "ok" | "err";
    message: string;
    savedName: string;
};

const initial: State = { status: "idle", message: "", savedName: "" };

// Simulated server action. In real Next.js this file would be a
// `"use server"` module and the reducer would run on the server.
async function submitName(_prev: State, formData: FormData): Promise<State> {
    const name = (formData.get("name") ?? "").toString().trim();
    // fake network latency
    await new Promise((r) => setTimeout(r, 800));
    if (name.length < 2) {
        return {
            status: "err",
            message: "name must be at least 2 characters",
            savedName: _prev.savedName,
        };
    }
    return { status: "ok", message: `saved as “${name}”`, savedName: name };
}

export default function UseActionStateDemo() {
    const [state, formAction, isPending] = useActionState(submitName, initial);

    return (
        <form action={formAction} className="space-y-3">
            <div className="flex gap-2">
                <input
                    name="name"
                    defaultValue={state.savedName}
                    placeholder="your name"
                    disabled={isPending}
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)] disabled:opacity-60"
                >
                    {isPending ? "saving…" : "save"}
                </button>
            </div>

            {state.status !== "idle" && (
                <p
                    className={`font-mono text-xs ${state.status === "ok"
                            ? "text-[var(--mint)]"
                            : "text-[var(--amber)]"
                        }`}
                >
                    {state.message}
                </p>
            )}

            <p className="text-xs text-[var(--muted)]">
                The reducer receives{" "}
                <span className="font-mono">(prev, formData)</span> and returns
                the next state — React wires the form up as its dispatcher.
                Submissions are transitions, so <span className="font-mono">isPending</span>{" "}
                comes for free.
            </p>
        </form>
    );
}
