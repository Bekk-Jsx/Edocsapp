"use client";

import { useEffect, useRef, useState } from "react";

const PANEL =
    "rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 space-y-2";
const EYEBROW =
    "font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]";
const BUTTON =
    "rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)]";
const INPUT =
    "flex-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]";

export default function UseRefDemo() {
    // (1) DOM ref — null until React commits the <input>, so it is only ever
    // read from an event handler here.
    const inputRef = useRef<HTMLInputElement>(null);

    // (2) Value ref — counts commits. Written in an effect (after render, never
    // during it) and read in a handler, so render itself stays pure.
    const renders = useRef(0);
    useEffect(() => {
        renders.current += 1;
    });
    const [shownRenders, setShownRenders] = useState<number | null>(null);

    // (3) Value ref as memory — holds the text from the previous change. The
    // pair on screen is state because the UI has to REACT to it; the ref is
    // what carries the old value across renders.
    const prevRef = useRef("");
    const [pair, setPair] = useState({ now: "", prev: "" });

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value;
        setPair({ now: next, prev: prevRef.current });
        prevRef.current = next;
    };

    return (
        <div className="space-y-4">
            <div className={PANEL}>
                <p className={EYEBROW}>1 · dom ref</p>
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        placeholder="an input React hands you a node for"
                        className={INPUT}
                    />
                    <button
                        onClick={() => inputRef.current?.focus()}
                        className={BUTTON}
                    >
                        focus
                    </button>
                </div>
                <p className="text-xs text-[var(--muted)]">
                    <span className="font-mono">inputRef.current</span> is the real
                    DOM node — the button calls{" "}
                    <span className="font-mono">.focus()</span> on it directly.
                </p>
            </div>

            <div className={PANEL}>
                <p className={EYEBROW}>2 · value ref · render counter</p>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setShownRenders(renders.current)}
                        className={BUTTON}
                    >
                        read render count
                    </button>
                    <span className="font-mono text-xs text-[var(--muted)]">
                        renders so far:{" "}
                        <span className="text-[var(--accent)]">
                            {shownRenders === null ? "—" : shownRenders}
                        </span>
                    </span>
                </div>
                <p className="text-xs text-[var(--muted)]">
                    An effect bumps the ref after every commit. It never schedules a
                    render of its own — type below, then read it again and watch the
                    number have climbed on its own.
                </p>
            </div>

            <div className={PANEL}>
                <p className={EYEBROW}>3 · value ref · previous value</p>
                <input
                    value={pair.now}
                    onChange={onChange}
                    placeholder="type — the ref remembers the last value"
                    className={`${INPUT} w-full`}
                />
                <p className="font-mono text-xs text-[var(--muted)]">
                    now: <span className="text-[var(--text)]">{pair.now || "—"}</span>{" "}
                    · previous:{" "}
                    <span className="text-[var(--accent)]">{pair.prev || "—"}</span>
                </p>
            </div>

            <p className="text-xs leading-relaxed text-[var(--muted)]">
                Both jobs, one hook. The DOM ref is a{" "}
                <span className="text-[var(--mint)]">handle to a node</span>; the value
                refs are a <span className="text-[var(--mint)]">box that survives
                renders</span> without causing any. Note where{" "}
                <span className="font-mono">.current</span> is touched here — in
                effects and handlers, never in the render body.
            </p>
        </div>
    );
}
