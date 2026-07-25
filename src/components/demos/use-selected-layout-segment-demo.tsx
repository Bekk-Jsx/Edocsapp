"use client";

import {
    useSelectedLayoutSegment,
    useSelectedLayoutSegments,
} from "next/navigation";

export default function UseSelectedLayoutSegmentDemo() {
    const segment = useSelectedLayoutSegment();
    const segments = useSelectedLayoutSegments();

    return (
        <div className="space-y-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                    useSelectedLayoutSegment()
                </p>
                <p className="mt-1 font-mono text-xs">
                    <span className="text-[var(--accent)]">
                        {segment ? `"${segment}"` : "null"}
                    </span>
                </p>
            </div>

            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                    useSelectedLayoutSegments() · all levels below
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--accent)]">
                    [{segments.map((s) => `"${s}"`).join(", ") || "—"}]
                </p>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Both hooks read segments <span className="text-[var(--mint)]">
                    relative to the nearest layout</span> above the component.
                From this demo the layout above is the root layout, so{" "}
                <span className="font-mono">segment</span> shows{" "}
                <span className="font-mono">&quot;hooks&quot;</span> — the first
                segment below root. The real payoff is calling these in a{" "}
                <span className="font-mono">layout.tsx</span> to highlight the
                active child in a shared nav.
            </p>
        </div>
    );
}
