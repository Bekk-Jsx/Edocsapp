"use client";

import { useId } from "react";

// One useId call → derive as many related IDs as the widget needs.
// Never call useId in a loop for list keys — use the item's own identity.
function EmailField() {
    const id = useId();
    const descId = `${id}-desc`;
    const errId = `${id}-err`;

    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm text-[var(--text)]">
                email
            </label>
            <input
                id={id}
                type="email"
                placeholder="you@example.com"
                aria-describedby={`${descId} ${errId}`}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
            />
            <p id={descId} className="text-xs text-[var(--muted)]">
                we&apos;ll never share your email.
            </p>
            <p id={errId} className="hidden text-xs text-[var(--amber)]">
                {/* placeholder for a real validation message */}
            </p>

            <p className="pt-2 font-mono text-xs text-[var(--muted)]">
                generated id:{" "}
                <span className="text-[var(--accent)]">{id}</span> · derived:{" "}
                <span className="text-[var(--accent)]">{descId}</span>,{" "}
                <span className="text-[var(--accent)]">{errId}</span>
            </p>
        </div>
    );
}

export default function UseIdDemo() {
    return (
        <div className="space-y-4">
            <EmailField />
            <EmailField />
            <p className="text-xs text-[var(--muted)]">
                Each instance of the field gets its own base ID — the label,
                description, and error slot all stay linked without collisions,
                and the values match between server and client render.
            </p>
        </div>
    );
}
