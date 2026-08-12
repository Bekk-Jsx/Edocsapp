"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

type FormState = { error?: string; success?: boolean };

// Rendered INSIDE the <form>, so useFormStatus finds it by walking up. Note what
// this component does NOT take: no `pending` prop, nothing from the parent. Drop
// it into any form and it reflects that form's submission.
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
                    Submitting…
                </span>
            ) : (
                "Subscribe"
            )}
        </button>
    );
}

async function subscribeAction(
    _prev: FormState,
    formData: FormData,
): Promise<FormState> {
    const email = (formData.get("email") ?? "").toString().trim();
    if (!email.includes("@")) return { error: "Enter a valid email." };
    await new Promise((r) => setTimeout(r, 1000)); // simulate the API call
    return { success: true };
}

export default function UseFormStatusDemo() {
    const [state, formAction] = useActionState<FormState, FormData>(
        subscribeAction,
        {},
    );

    return (
        // noValidate: the browser's own `type="email"` check would block the
        // submit before the action ran, so the error state would never show.
        <form action={formAction} noValidate className="space-y-3">
            <div className="flex gap-2">
                <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                {/* the only child that knows about `pending` */}
                <SubmitButton />
            </div>

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
                <span className="font-mono">SubmitButton</span> lives inside the
                form and reads its own status — this component never passes it{" "}
                <span className="font-mono">pending</span>. Submit an address
                without an <span className="font-mono">@</span> for the error
                path; a valid one takes ~1s.
            </p>
        </form>
    );
}
