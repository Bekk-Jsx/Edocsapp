"use client";

import { memo, useState, useTransition } from "react";

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
const LIST = Array.from(
    { length: 10_000 },
    (_, i) => `${WORDS[i % WORDS.length]}-${String(i).padStart(5, "0")}`,
);

const VISIBLE = 100;

// The filter itself is cheap; the RENDER is the bottleneck, which is the case
// useTransition is for. Each row burns a little CPU to stand in for what makes
// a real row expensive — deep trees, formatting, charts.
const ROW_COST_MS = 0.6;

function SlowRow({ label }: { label: string }) {
    const start = performance.now();
    while (performance.now() - start < ROW_COST_MS) {
        /* simulated expensive row */
    }
    return (
        <li className="border-b border-[var(--border)] px-3 py-1 last:border-0">
            {label}
        </li>
    );
}

// memo is what makes the split work: on an URGENT render (a keystroke) `items`
// is still the same array, so React skips this subtree entirely and the input
// paints immediately. Only the transition's render passes a new array and pays
// the ~60ms. Without memo, every keystroke would re-render all 100 rows anyway.
const ResultList = memo(function ResultList({ items }: { items: string[] }) {
    return (
        <ul className="font-mono text-xs text-[var(--muted)]">
            {items.slice(0, VISIBLE).map((item) => (
                <SlowRow key={item} label={item} />
            ))}
        </ul>
    );
});

const matches = (q: string) =>
    q ? LIST.filter((item) => item.includes(q.toLowerCase())) : LIST;

type Mode = "transition" | "plain";

export default function UseTransitionDemo() {
    const [mode, setMode] = useState<Mode>("transition");
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<string[]>(LIST);
    const [isPending, startTransition] = useTransition();

    const onChange = (value: string) => {
        // URGENT — always outside the transition, so the character appears now.
        setQuery(value);

        if (mode === "transition") {
            // NON-URGENT — interruptible, abandoned when the next keystroke lands.
            startTransition(() => setResults(matches(value)));
        } else {
            setResults(matches(value));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                {(
                    [
                        ["transition", "with useTransition"],
                        ["plain", "without"],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        onClick={() => setMode(value)}
                        className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                            mode === value
                                ? "border-[var(--accent)] text-[var(--accent)]"
                                : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                        }`}
                    >
                        {label}
                    </button>
                ))}
                <span className="ml-auto font-mono text-xs text-[var(--muted)]">
                    {isPending ? (
                        <span className="text-[var(--amber)]">isPending = true</span>
                    ) : (
                        "isPending = false"
                    )}
                </span>
            </div>

            <input
                value={query}
                onChange={(e) => onChange(e.target.value)}
                placeholder="type fast — try “avatar”"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
            />

            <p className="font-mono text-xs text-[var(--muted)]">
                {results.length.toLocaleString()} matches · showing{" "}
                {Math.min(results.length, VISIBLE)}
            </p>

            {/* The dimming lives on the WRAPPER, not inside ResultList — passing
                isPending down would re-render the memoized list on every keystroke
                and undo the whole optimization. */}
            <div
                className="max-h-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] transition-opacity duration-150"
                style={{ opacity: isPending ? 0.5 : 1 }}
            >
                <ResultList items={results} />
            </div>

            <p className="text-xs text-[var(--muted)]">
                Each row deliberately burns ~{ROW_COST_MS}ms to stand in for an
                expensive render, so 100 rows cost ~60ms.{" "}
                <span className="text-[var(--mint)]">With useTransition</span> the
                characters appear instantly and the list dims while it catches up.{" "}
                <span className="text-[var(--amber)]">Without</span>, every keystroke
                waits for the full re-render and typing stutters.
            </p>
        </div>
    );
}
