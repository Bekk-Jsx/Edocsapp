"use client";

import { useLayoutEffect, useRef, useState } from "react";

export default function UseLayoutEffectDemo() {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);
    const labelRef = useRef<HTMLSpanElement | null>(null);

    // Read layout, then WRITE layout — all synchronously before the browser paints.
    // No setState: we mutate the tip's style directly through its ref.
    useLayoutEffect(() => {
        if (!open) return;
        const trigger = triggerRef.current;
        const tip = tipRef.current;
        const label = labelRef.current;
        if (!trigger || !tip) return;

        const rect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const above = spaceBelow < tip.offsetHeight + 8;

        tip.style.top = above ? "auto" : "calc(100% + 6px)";
        tip.style.bottom = above ? "calc(100% + 6px)" : "auto";
        if (label) label.textContent = above ? "above" : "below";
    }, [open]);

    return (
        <div className="space-y-3">
            <div className="relative inline-block">
                <button
                    ref={triggerRef}
                    onClick={() => setOpen((o) => !o)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    {open ? "hide tooltip" : "show tooltip"}
                </button>

                {open && (
                    <div
                        ref={tipRef}
                        role="tooltip"
                        className="absolute left-0 z-10 w-64 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2 text-xs text-[var(--muted)]"
                    >
                        Measured before paint — flipped{" "}
                        <span ref={labelRef} className="text-[var(--accent)]">
                            below
                        </span>{" "}
                        the trigger. Scroll so the button sits near the viewport
                        bottom, then reopen to see the flip.
                    </div>
                )}
            </div>

            <p className="text-xs text-[var(--muted)]">
                Measurement happens synchronously after DOM mutation and{" "}
                <span className="text-[var(--mint)]">before paint</span> — the tip
                is repositioned via its ref, so no extra render, no flicker.
            </p>
        </div>
    );
}
