"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";

// The contract the parent gets. Not the input element — just these two calls.
export type FancyInputHandle = {
    focus: () => void;
    clear: () => void;
};

// React 19: `ref` is a normal prop. No forwardRef wrapper.
function FancyInput({
    ref,
    placeholder,
}: {
    ref?: Ref<FancyInputHandle>;
    placeholder?: string;
}) {
    // The real node stays private — it never leaves this component.
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
        clear: () => {
            if (inputRef.current) inputRef.current.value = "";
        },
    }));

    return (
        <input
            ref={inputRef}
            placeholder={placeholder}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
    );
}

export default function UseImperativeHandleDemo() {
    // Typed to the HANDLE, not to HTMLInputElement — that's the whole point.
    const inputRef = useRef<FancyInputHandle>(null);
    const [lastCall, setLastCall] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <FancyInput ref={inputRef} placeholder="type something…" />

            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => {
                        inputRef.current?.focus();
                        setLastCall("focus()");
                    }}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                    focus
                </button>
                <button
                    onClick={() => {
                        inputRef.current?.clear();
                        setLastCall("clear()");
                    }}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 font-mono text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                    clear
                </button>
                <span className="ml-auto font-mono text-xs text-[var(--muted)]">
                    {lastCall ? (
                        <>
                            inputRef.current?.
                            <span className="text-[var(--mint)]">{lastCall}</span>
                        </>
                    ) : (
                        "no call yet"
                    )}
                </span>
            </div>

            <p className="text-xs text-[var(--muted)]">
                The parent holds a ref to{" "}
                <span className="font-mono">
                    &#123; focus, clear &#125;
                </span>
                , not to the <span className="font-mono">&lt;input&gt;</span>. It can
                focus and clear — it cannot read{" "}
                <span className="font-mono">.value</span>, restyle the node or remove
                it.
            </p>
        </div>
    );
}
