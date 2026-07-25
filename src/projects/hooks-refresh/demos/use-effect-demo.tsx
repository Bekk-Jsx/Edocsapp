"use client";

import { useEffect, useState, useRef } from "react";

export default function UseEffectDemo() {
    const [room, setRoom] = useState("general");
    const [log, setLog] = useState<string[]>([]);
    const logRef = useRef<string[]>([]);

    // Helper writes to a ref first, then schedules the state update on a
    // microtask — so we never call setState synchronously inside the effect body.
    const append = (line: string) => {
        logRef.current = [line, ...logRef.current].slice(0, 6);
        queueMicrotask(() => setLog([...logRef.current]));
    };

    useEffect(() => {
        append(`✅ connected to "${room}"`);
        return () => append(`❌ disconnected from "${room}"`);
    }, [room]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)]">room:</span>
                {["general", "random", "dev"].map((r) => (
                    <button
                        key={r}
                        onClick={() => setRoom(r)}
                        className={`rounded-md border px-3 py-1.5 text-sm ${room === r
                                ? "border-[var(--accent)] text-[var(--accent)]"
                                : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                            }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            <ul className="font-mono text-xs text-[var(--muted)]">
                {log.map((l, i) => (
                    <li key={i}>{l}</li>
                ))}
            </ul>

            <p className="text-xs text-[var(--muted)]">
                Switch rooms: you disconnect from the old before connecting to the new.
                In dev you&apos;ll see connect→disconnect→connect once on mount — that&apos;s
                Strict Mode, not a bug.
            </p>
        </div>
    );
}