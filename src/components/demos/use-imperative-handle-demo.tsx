"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";

// The minimal API we expose to the parent — not the raw <input>.
type FancyInputHandle = {
    focus: () => void;
    clear: () => void;
};

// React 19: ref is a normal prop, no forwardRef needed.
function FancyInput({
    ref,
    placeholder,
}: {
    ref?: Ref<FancyInputHandle>;
    placeholder?: string;
}) {
    const domRef = useRef<HTMLInputElement | null>(null);
    const [value, setValue] = useState("");

    useImperativeHandle(
        ref,
        () => ({
            focus: () => domRef.current?.focus(),
            clear: () => setValue(""),
        }),
        [],
    );

    return (
        <input
            ref={domRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
        />
    );
}

export default function UseImperativeHandleDemo() {
    const inputRef = useRef<FancyInputHandle | null>(null);

    return (
        <div className="space-y-3">
            <FancyInput ref={inputRef} placeholder="a controlled input inside a component" />

            <div className="flex gap-2">
                <button
                    onClick={() => inputRef.current?.focus()}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    focus
                </button>
                <button
                    onClick={() => inputRef.current?.clear()}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    clear
                </button>
            </div>

            <p className="text-xs text-[var(--muted)]">
                The parent never touches the underlying{" "}
                <span className="font-mono">&lt;input&gt;</span>. It only sees the{" "}
                <span className="text-[var(--mint)]">focus / clear</span> API the
                child chose to expose.
            </p>
        </div>
    );
}
