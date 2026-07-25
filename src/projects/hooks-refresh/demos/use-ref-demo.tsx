"use client";

import { useRef, useState } from "react";

export default function UseRefDemo() {
    // (a) DOM ref — the ref points at the underlying <input>.
    const inputRef = useRef<HTMLInputElement | null>(null);

    // (b) Mutable box — the ref survives re-renders but writing to it
    // never triggers one. We increment it inside an event handler.
    const silentClicksRef = useRef(0);
    const [revealed, setRevealed] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    ref={inputRef}
                    placeholder="type here..."
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                    onClick={() => inputRef.current?.focus()}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    focus input
                </button>
            </div>

            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="text-[var(--muted)]">
                    silent counter (mutates a ref, no re-render):
                </p>
                <div className="mt-2 flex gap-2">
                    <button
                        onClick={() => {
                            silentClicksRef.current += 1;
                        }}
                        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)]"
                    >
                        silent click
                    </button>
                    <button
                        onClick={() => setRevealed(silentClicksRef.current)}
                        className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)]"
                    >
                        reveal
                    </button>
                </div>
                <p className="mt-2 font-mono text-xs text-[var(--muted)]">
                    revealed:{" "}
                    <span className="text-[var(--accent)]">
                        {revealed === null ? "—" : revealed}
                    </span>
                </p>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Spam <span className="text-[var(--mint)]">silent click</span> — the
                UI never updates. The counter&apos;s value is still there; hit{" "}
                <span className="text-[var(--mint)]">reveal</span> to render it.
            </p>
        </div>
    );
}
