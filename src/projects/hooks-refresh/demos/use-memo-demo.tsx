"use client";

import { useMemo, useRef, useState } from "react";

const ITEMS = Array.from({ length: 5000 }, (_, i) =>
    `item-${i.toString().padStart(4, "0")}`,
);

// A deliberately slow filter — enough work per keystroke to make memoization visible.
function filterAndSort(query: string) {
    return ITEMS.filter((s) => s.includes(query))
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 6);
}

export default function UseMemoDemo() {
    const [query, setQuery] = useState("");
    const [ticks, setTicks] = useState(0);
    const computes = useRef(0);

    const results = useMemo(() => {
        computes.current += 1;
        return filterAndSort(query);
    }, [query]);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="filter 5000 items — try `007`"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                    onClick={() => setTicks((t) => t + 1)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    unrelated tick ({ticks})
                </button>
            </div>

            <p className="font-mono text-xs text-[var(--muted)]">
                filter ran{" "}
                <span className="text-[var(--accent)]">{computes.current}</span>{" "}
                times · clicking the tick button re-renders without recomputing
            </p>

            <ul className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2 font-mono text-xs text-[var(--muted)]">
                {results.length === 0 ? (
                    <li>—</li>
                ) : (
                    results.map((s) => <li key={s}>{s}</li>)
                )}
            </ul>
        </div>
    );
}
