"use client";

import { memo, useCallback, useState } from "react";

type ChildProps = { label: string; onPress: () => void };

// React.memo: re-renders only when a prop changes BY REFERENCE. `label` is a
// string literal that never moves, so `onPress` is the only prop that CAN
// differ — which turns this child into a direct readout of one handler's
// identity. The console line is the ground truth; the counters below are a
// convenience mirror.
const Child = memo(function Child({ label, onPress }: ChildProps) {
    console.log(`Child rendered: ${label}`);

    return (
        <div className="flex items-center justify-between gap-4 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-[var(--muted)]">
                {label}
            </p>
            <button
                onClick={onPress}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--surface)]"
            >
                press
            </button>
        </div>
    );
});

// The memoized child renders once, on mount, and never again: both of its props
// keep the same reference forever, so React.memo's shallow compare passes on
// every parent render. Nothing in this component can bump it — that is the
// entire demonstration, so it is a constant rather than state.
const MEMO_CHILD_RENDERS = 1;

export default function UseCallbackDemo() {
    const [count, setCount] = useState(0); // unrelated state — the whole point
    const [pressed, setPressed] = useState(0);

    // On-screen mirror of the console markers, starting at the mount pass. Every
    // parent render re-renders the plain child, so this is bumped by each action
    // that renders the parent. Counting from the handlers keeps render pure — no
    // ref writes during render, which Strict Mode would double anyway.
    const [plainRenders, setPlainRenders] = useState(1);

    // Rebuilt on every render — a brand-new reference each time, so the memo on
    // its Child never matches and that child re-renders along with the parent.
    const plainOnPress = () => {
        setPressed((p) => p + 1);
        setPlainRenders((r) => r + 1);
    };

    // Cached with an empty dep list: the SAME reference for the life of the
    // component. Both updaters are functional, so this closes over nothing and
    // there is nothing to list — the setters themselves are stable.
    const memoOnPress = useCallback(() => {
        setPressed((p) => p + 1);
        setPlainRenders((r) => r + 1);
    }, []);

    const bumpCount = () => {
        setCount((c) => c + 1);
        setPlainRenders((r) => r + 1);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={bumpCount}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    re-render ({count})
                </button>
            </div>

            <p className="font-mono text-xs text-[var(--muted)]">
                pressed <span className="text-[var(--text)]">{pressed}</span>× ·
                plain child rendered{" "}
                <span className="text-[var(--amber)]">{plainRenders}</span>× ·
                memoized child rendered{" "}
                <span className="text-[var(--mint)]">{MEMO_CHILD_RENDERS}</span>×
            </p>

            <Child label="plain fn — new reference" onPress={plainOnPress} />
            <Child label="useCallback — stable" onPress={memoOnPress} />

            <p className="text-xs leading-relaxed text-[var(--muted)]">
                Open the console and hit{" "}
                <span className="text-[var(--accent)]">re-render</span> a few
                times. It only moves <span className="font-mono">count</span>,
                which neither child reads — yet{" "}
                <span className="text-[var(--amber)]">plain fn</span> logs{" "}
                <span className="font-mono">Child rendered</span> every time,
                because its handler is a fresh reference on each parent render.{" "}
                <span className="text-[var(--mint)]">useCallback</span> stays
                silent after mount: same reference, so{" "}
                <span className="font-mono">React.memo</span> skips it entirely.
                Both still work when pressed. (Strict Mode logs each render twice
                in development.)
            </p>
        </div>
    );
}
