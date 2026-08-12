"use client";

import { useActionState } from "react";

type FormState = { error?: string; success?: boolean };

// The action. In a real Next.js app this would live in a `"use server"` module
// and run on the server — the client half of the hook is identical either way.
async function subscribeAction(
    _prev: FormState,
    formData: FormData,
): Promise<FormState> {
    const email = (formData.get("email") ?? "").toString().trim();
    // validation returns state, it doesn't throw
    if (!email || !email.includes("@")) {
        return { error: "Enter a valid email." };
    }
    await new Promise((r) => setTimeout(r, 800)); // simulate the API call
    return { success: true };
}

export default function UseActionStateDemo() {
    const [state, formAction, isPending] = useActionState(subscribeAction, {});

    return (
        // noValidate: the browser's own `type="email"` check would block the
        // submit before the action ever ran, hiding the error state this demo
        // exists to show. The action is the validator here.
        <form action={formAction} noValidate className="space-y-3">
            <div className="flex gap-2">
                <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    disabled={isPending}
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)] disabled:opacity-60"
                >
                    {isPending ? (
                        <span className="inline-flex items-center gap-1.5">
                            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-[var(--amber)]" />
                            Submitting…
                        </span>
                    ) : (
                        "Subscribe"
                    )}
                </button>
            </div>

            {/* both messages come out of `state` — no useState anywhere */}
            {state.error && (
                <p className="font-mono text-xs text-[var(--amber)]">
                    {state.error}
                </p>
            )}
            {state.success && (
                <p className="font-mono text-xs text-[var(--mint)]">
                    Subscribed ✅
                </p>
            )}

            <p className="text-xs text-[var(--muted)]">
                Submit an address without an{" "}
                <span className="font-mono">@</span> to see the error state; a
                valid one takes ~800ms, and{" "}
                <span className="font-mono">isPending</span> disables the form
                for the duration. The action runs on the client here — in real
                Next.js it would be a <span className="font-mono">
                    &quot;use server&quot;
                </span>{" "}
                Server Action.
            </p>
        </form>
    );
}
