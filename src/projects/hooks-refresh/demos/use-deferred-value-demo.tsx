"use client";

import { useDeferredValue, useState } from "react";

const ITEMS = Array.from({ length: 15000 }, (_, i) => `row-${i.toString().padStart(5, "0")}`);

function SlowRow({ text }: { text: string }) {
    // artificial CPU work per row — makes the deferred behavior visible
    let x = 0;
    for (let i = 0; i < 500; i++) x += Math.sqrt(i);
    return (
        <li className="font-mono text-xs text-[var(--muted)]" data-x={x}>
            {text}
        </li>
    );
}

export default function UseDeferredValueDemo() {
    // We own the urgent state — the input keystroke.
    const [query, setQuery] = useState("");
    // React gives us a "lagging" copy that catches up when it can.
    const deferredQuery = useDeferredValue(query);
    const isStale = query !== deferredQuery;

    const results = ITEMS.filter((s) => s.includes(deferredQuery)).slice(0, 40);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="filter 15000 rows — try `042`"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <span
                    className={`font-mono text-xs ${isStale ? "text-[var(--amber)]" : "text-[var(--muted)]"
                        }`}
                >
                    {isStale ? "stale…" : "fresh"}
                </span>
            </div>

            <ul
                className={`rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2 transition-opacity ${isStale ? "opacity-50" : ""
                    }`}
            >
                {results.length === 0 ? (
                    <li className="font-mono text-xs text-[var(--muted)]">—</li>
                ) : (
                    results.map((s) => <SlowRow key={s} text={s} />)
                )}
            </ul>

            <p className="text-xs text-[var(--muted)]">
                No <span className="font-mono">startTransition</span> here — we
                only own the input state and can&apos;t wrap the derived update.
                We defer a <span className="font-mono">value</span> instead: the
                list keeps rendering the previous query until React catches up.
            </p>
        </div>
    );
}
