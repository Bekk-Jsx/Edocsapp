"use client";

import { usePractice } from "./practice-provider";

// The practice controls in the page header: the switch, the running count, the
// "Hide known" filter (only once practice is on) and any write error.
//
// Off on every load by design — practice is something you opt into for a
// session, not a setting that follows you around.

export default function PracticeToggle() {
    const { on, setOn, hideKnown, setHideKnown, known, total, error } =
        usePractice();

    return (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* A switch, not a checkbox: it turns a mode on, it does not pick
                a value. aria-pressed carries the state. */}
            <button
                type="button"
                onClick={() => setOn(!on)}
                aria-pressed={on}
                className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                    on
                        ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-[0.65rem] w-[1.3rem] shrink-0 rounded-full border transition-colors ${
                        on
                            ? "border-[var(--accent)] bg-[var(--accent)]"
                            : "border-[var(--border)]"
                    }`}
                />
                Practice
            </button>

            {on ? (
                <>
                    <span className="font-mono text-[0.8rem] text-[var(--muted)]">
                        Known{" "}
                        <span className="text-[var(--text)]">{known}</span> /{" "}
                        {total}
                    </span>

                    <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[0.7rem] text-[var(--muted)] hover:text-[var(--text)]">
                        <input
                            type="checkbox"
                            checked={hideKnown}
                            onChange={(e) => setHideKnown(e.target.checked)}
                            className="h-3 w-3 accent-[var(--accent)]"
                        />
                        Hide known
                    </label>
                </>
            ) : null}

            {error ? (
                <span
                    role="status"
                    className="font-mono text-[0.7rem] text-[var(--amber)]"
                >
                    {error}
                </span>
            ) : null}
        </div>
    );
}
