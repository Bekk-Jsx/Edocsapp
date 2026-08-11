"use client";

import { useId } from "react";

// One useId() call per instance, used as a BASE: every id the field needs is
// that base plus a suffix, so a single hook call links label, input and hint.
// The generated strings are printed under the field so the reader can SEE them.
function EmailField({ instance }: { instance: string }) {
    const id = useId();
    const inputId = `${id}-email`;
    const hintId = `${id}-email-hint`;

    return (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                instance {instance}
            </p>

            <label htmlFor={inputId} className="block text-sm text-[var(--text)]">
                Email
            </label>
            <input
                id={inputId}
                type="email"
                placeholder="you@example.com"
                aria-describedby={hintId}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <p id={hintId} className="mt-1 text-xs text-[var(--muted)]">
                We&apos;ll never share it.
            </p>

            <div className="mt-3 space-y-0.5 border-t border-[var(--border)] pt-2 font-mono text-[0.7rem] text-[var(--muted)]">
                <p>
                    useId() → <span className="text-[var(--accent)]">{id}</span>
                </p>
                <p>
                    htmlFor / id →{" "}
                    <span className="text-[var(--accent)]">{inputId}</span>
                </p>
                <p>
                    aria-describedby →{" "}
                    <span className="text-[var(--accent)]">{hintId}</span>
                </p>
            </div>
        </div>
    );
}

export default function UseIdDemo() {
    return (
        <div className="space-y-3">
            {/* Two instances of the SAME component — the point of the demo is that
                their base ids differ, so neither label can point at the other's
                input. Stacked rather than side by side: the generated ids are the
                thing to read here, and a half-width column wraps them mid-token. */}
            <div className="grid gap-3">
                <EmailField instance="A" />
                <EmailField instance="B" />
            </div>
            <p className="text-xs text-[var(--muted)]">
                Same component twice: the two base ids differ, so the labels stay
                bound to their own input and the hints to their own field. Every
                value above is identical between the server render and hydration —
                that is the guarantee <span className="font-mono">useId</span>{" "}
                exists to provide.
            </p>
        </div>
    );
}
