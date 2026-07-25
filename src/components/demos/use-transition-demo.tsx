"use client";

import { useState, useTransition } from "react";

// Large enough that rendering all matches is noticeable work.
const ITEMS = Array.from({ length: 15000 }, (_, i) => `row-${i.toString().padStart(5, "0")}`);

// Slow render per item — makes the transition visible without a huge DOM.
function SlowRow({ text }: { text: string }) {
    // artificial CPU work to make the list re-render feel heavy
    let x = 0;
    for (let i = 0; i < 500; i++) x += Math.sqrt(i);
    return (
        <li className="font-mono text-xs text-[var(--muted)]" data-x={x}>
            {text}
        </li>
    );
}

export default function UseTransitionDemo() {
    // Urgent — the input value must update on every keystroke.
    const [query, setQuery] = useState("");
    // Non-urgent — the derived query the list actually filters on.
    const [committed, setCommitted] = useState("");
    const [isPending, startTransition] = useTransition();

    const results = ITEMS.filter((s) => s.includes(committed)).slice(0, 40);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <input
                    value={query}
                    onChange={(e) => {
                        const next = e.target.value;
                        setQuery(next); // urgent — stays outside the transition
                        startTransition(() => setCommitted(next)); // non-urgent
                    }}
                    placeholder="filter 15000 rows — try `042`"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <span
                    className={`font-mono text-xs ${isPending ? "text-[var(--amber)]" : "text-[var(--muted)]"
                        }`}
                >
                    {isPending ? "pending…" : "idle"}
                </span>
            </div>

            <ul
                className={`rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2 transition-opacity ${isPending ? "opacity-50" : ""
                    }`}
            >
                {results.length === 0 ? (
                    <li className="font-mono text-xs text-[var(--muted)]">—</li>
                ) : (
                    results.map((s) => <SlowRow key={s} text={s} />)
                )}
            </ul>

            <p className="text-xs text-[var(--muted)]">
                Type fast — the input stays snappy because its update is urgent;
                the list update is wrapped in{" "}
                <span className="font-mono">startTransition</span>, so React can
                interrupt it to keep the keystrokes fluid.
            </p>
        </div>
    );
}
