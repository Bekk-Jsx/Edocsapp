"use client";

import { memo, useCallback, useRef, useState } from "react";

type ChildProps = { label: string; onPress: () => void };

// Only re-renders when props change by reference (React.memo shallow-compares).
const MemoChild = memo(function MemoChild({ label, onPress }: ChildProps) {
    const renders = useRef(0);
    renders.current += 1;
    return (
        <div className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
            <div>
                <span className="text-[var(--muted)]">{label} · </span>
                renders: <span className="text-[var(--accent)]">{renders.current}</span>
            </div>
            <button
                onClick={onPress}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--surface)]"
            >
                press
            </button>
        </div>
    );
});

export default function UseCallbackDemo() {
    const [ticks, setTicks] = useState(0);
    const [pressed, setPressed] = useState(0);

    // Stable identity: unchanged across parent re-renders → memoized child skips render.
    const stableOnPress = useCallback(() => setPressed((p) => p + 1), []);

    // Fresh function every render → memoized child sees a "new" prop → re-renders.
    const unstableOnPress = () => setPressed((p) => p + 1);

    return (
        <div className="space-y-3">
            <button
                onClick={() => setTicks((t) => t + 1)}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
            >
                unrelated tick ({ticks})
            </button>

            <MemoChild label="stable (useCallback)" onPress={stableOnPress} />
            <MemoChild label="unstable (plain fn)" onPress={unstableOnPress} />

            <p className="text-xs text-[var(--muted)]">
                Click the tick button repeatedly — the{" "}
                <span className="text-[var(--mint)]">stable</span> child stays
                frozen; the <span className="text-[var(--amber)]">unstable</span>{" "}
                one climbs. Both children still work when you press them
                (pressed: <span className="text-[var(--accent)]">{pressed}</span>).
            </p>
        </div>
    );
}
