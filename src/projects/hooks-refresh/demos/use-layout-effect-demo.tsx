"use client";

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

// A tooltip that FLIPS above its trigger when there is no room below it.
//
// The measurement is identical on both paths — the only difference is WHEN
// React runs it, which is the whole point of the hook:
//
//   layout mode  commit -> useLayoutEffect (flip) -> paint      one frame, correct
//   effect mode  commit -> paint (wrong side) -> useEffect (flip) -> paint
//
// The 150ms transform transition exists to make that second paint visible. In
// layout mode it never runs: the tip is inserted and repositioned inside the
// same frame, so the browser has no previous computed style to animate from.
type Mode = "layout" | "effect";
type Placement = "bottom" | "top";

const GAP = 8;

export default function UseLayoutEffectDemo() {
    const [mode, setMode] = useState<Mode>("layout");
    const [open, setOpen] = useState(false);
    const [placement, setPlacement] = useState<Placement>("bottom");
    const [offset, setOffset] = useState(0);

    const boxRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);

    // Read layout, decide the side. Synchronous and cheap — two rects and an
    // offsetHeight — which is the only kind of work that belongs before paint.
    const place = useCallback(() => {
        const box = boxRef.current;
        const trigger = triggerRef.current;
        const tip = tipRef.current;
        if (!box || !trigger || !tip) return;

        const boxRect = box.getBoundingClientRect();
        const rect = trigger.getBoundingClientRect();
        const fitsBelow = boxRect.bottom - rect.bottom >= tip.offsetHeight + GAP;

        setPlacement(fitsBelow ? "bottom" : "top");
        setOffset(
            fitsBelow ? 0 : -(tip.offsetHeight + trigger.offsetHeight + 2 * GAP),
        );
    }, []);

    // BEFORE paint — the tip's first painted frame is already on the right side.
    useLayoutEffect(() => {
        if (!open || mode !== "layout") return;
        place();
    }, [open, mode, place]);

    // AFTER paint — the browser shows the default side first, then corrects.
    useEffect(() => {
        if (!open || mode !== "effect") return;
        place();
    }, [open, mode, place]);

    // Keep the side honest while the trigger moves under the tip.
    useEffect(() => {
        const box = boxRef.current;
        if (!open || !box) return;
        box.addEventListener("scroll", place, { passive: true });
        return () => box.removeEventListener("scroll", place);
    }, [open, place]);

    // Every open starts from the default side, so the correction is the thing
    // you are actually watching.
    const toggle = () => {
        setOpen((o) => !o);
        setPlacement("bottom");
        setOffset(0);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--muted)]">measure with:</span>
                {(
                    [
                        ["layout", "useLayoutEffect"],
                        ["effect", "useEffect"],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        onClick={() => {
                            setMode(value);
                            setOpen(false);
                        }}
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
                    placement ={" "}
                    <span className="text-[var(--mint)]">
                        &quot;{placement}&quot;
                    </span>
                </span>
            </div>

            {/* A scrollable box stands in for the viewport, so the flip is one
                scroll away instead of a page away. */}
            <div
                ref={boxRef}
                className="relative h-56 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4"
            >
                <div className="h-28" aria-hidden="true" />

                <div className="relative inline-block">
                    <button
                        ref={triggerRef}
                        onClick={toggle}
                        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--accent)]"
                    >
                        {open ? "hide tooltip" : "show tooltip"}
                    </button>

                    {open && (
                        <div
                            ref={tipRef}
                            role="tooltip"
                            style={{
                                marginTop: GAP,
                                transform: `translateY(${offset}px)`,
                                transition: "transform 150ms ease",
                            }}
                            className="absolute left-0 top-full z-10 w-60 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-xs text-[var(--muted)]"
                        >
                            Measured against the box, then flipped{" "}
                            <span className="text-[var(--accent)]">{placement}</span>{" "}
                            — before paint on the{" "}
                            <span className="font-mono">useLayoutEffect</span> path.
                        </div>
                    )}
                </div>

                <div className="h-40" aria-hidden="true" />
            </div>

            <p className="text-xs text-[var(--muted)]">
                Scroll the box so the button sits near its bottom edge, then open the
                tooltip. On{" "}
                <span className="font-mono text-[var(--mint)]">useLayoutEffect</span>{" "}
                it appears above the trigger immediately. Switch to{" "}
                <span className="font-mono text-[var(--amber)]">useEffect</span> and
                the same measurement lands one frame late — you see it painted below
                first, then slide.
            </p>
        </div>
    );
}
