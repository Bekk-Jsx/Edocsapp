"use client";

import { useDeferredValue, useMemo, useState } from "react";

// 10,000 items, built once at module load.
const WORDS = [
    "avatar",
    "account",
    "archive",
    "banner",
    "button",
    "cache",
    "config",
    "dialog",
    "export",
    "filter",
];
const ITEMS = Array.from(
    { length: 10_000 },
    (_, i) => `${WORDS[i % WORDS.length]}-${String(i).padStart(5, "0")}`,
);

const VISIBLE = 40;

// Real filters get expensive through fuzzy scoring, normalisation or sorting —
// not through 10k `includes` calls. This burns a fixed budget instead so the
// deferral is actually observable on a fast machine.
const SCAN_COST_MS = 110;

function search(query: string) {
    const start = performance.now();
    while (performance.now() - start < SCAN_COST_MS) {
        /* stand-in for expensive scoring / sorting */
    }
    const q = query.trim().toLowerCase();
    return q ? ITEMS.filter((item) => item.includes(q)) : ITEMS;
}

export default function UseDeferredValueDemo() {
    // URGENT — drives the input, so the character appears immediately.
    const [query, setQuery] = useState("");
    // LOW PRIORITY — the same string, allowed to fall one step behind.
    const deferredQuery = useDeferredValue(query);
    const isStale = query !== deferredQuery;

    // The saving lives HERE, not in useDeferredValue. On an urgent render
    // `deferredQuery` still holds its last committed value, so the deps are
    // unchanged and the ~110ms scan is skipped entirely.
    const results = useMemo(() => search(deferredQuery), [deferredQuery]);

    return (
        <div className="space-y-4">
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="type fast — try “avatar”"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />

            {/* The two values side by side: `query` jumps, `deferredQuery` trails
                it while a low-priority render is still in flight. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
                <span className="text-[var(--muted)]">
                    query ={" "}
                    <span className="text-[var(--text)]">
                        &quot;{query}&quot;
                    </span>
                </span>
                <span className="text-[var(--muted)]">
                    deferredQuery ={" "}
                    <span className="text-[var(--text)]">
                        &quot;{deferredQuery}&quot;
                    </span>
                </span>
                <span
                    className={`ml-auto ${
                        isStale ? "text-[var(--amber)]" : "text-[var(--muted)]"
                    }`}
                >
                    isStale = {String(isStale)}
                </span>
            </div>

            <p className="font-mono text-xs text-[var(--muted)]">
                {results.length.toLocaleString()} matches · showing{" "}
                {Math.min(results.length, VISIBLE)}
            </p>

            {/* Dimming sits on the WRAPPER — feeding isStale into the list would
                make it re-render on every keystroke and undo the deferral. */}
            <div
                className="max-h-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] transition-opacity duration-150"
                style={{ opacity: isStale ? 0.5 : 1 }}
            >
                <ul className="font-mono text-xs text-[var(--muted)]">
                    {results.length === 0 ? (
                        <li className="px-3 py-1">no matches</li>
                    ) : (
                        results.slice(0, VISIBLE).map((item) => (
                            <li
                                key={item}
                                className="border-b border-[var(--border)] px-3 py-1 last:border-0"
                            >
                                {item}
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <p className="text-xs text-[var(--muted)]">
                The filter deliberately costs ~{SCAN_COST_MS}ms. Typing stays
                instant because the urgent render reuses the{" "}
                <span className="text-[var(--mint)]">memoized</span> result for the
                last committed <span className="font-mono">deferredQuery</span>;
                the list <span className="text-[var(--amber)]">dims</span> until a
                low-priority render catches it up. Type fast and only the value you
                pause on ever finishes.
            </p>
        </div>
    );
}
