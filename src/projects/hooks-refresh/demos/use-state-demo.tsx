"use client";

import { useState } from "react";

// Lazy initializer: runs once on mount, not on every render.
function readInitial(): number {
    return 0; // pretend this is expensive (parse storage, decode, etc.)
}

export default function UseStateDemo() {
    const [count, setCount] = useState(readInitial);
    const [log, setLog] = useState<string[]>([]);

    const note = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 4));

    // STALE: captures `count` at click time -> 3 fast clicks settle at +1.
    const staleAsyncInc = () => {
        note("stale: queued setCount(count + 1)");
        setTimeout(() => setCount(count + 1), 800);
    };

    // CORRECT: updater gets latest state -> 3 fast clicks settle at +3.
    const functionalAsyncInc = () => {
        note("functional: queued setCount(c => c + 1)");
        setTimeout(() => setCount((c) => c + 1), 800);
    };

    return (
        <div className="space-y-4">
            <div className="font-mono text-5xl text-[var(--accent)]">{count}</div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={staleAsyncInc}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    async +1 (stale)
                </button>
                <button
                    onClick={functionalAsyncInc}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    async +1 (functional)
                </button>
                <button
                    onClick={() => setCount(readInitial)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    reset
                </button>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Spam each button 3× fast. Stale settles at +1; functional at +3.
            </p>

            <ul className="font-mono text-xs text-[var(--muted)]">
                {log.map((l, i) => (
                    <li key={i}>{l}</li>
                ))}
            </ul>
        </div>
    );
}