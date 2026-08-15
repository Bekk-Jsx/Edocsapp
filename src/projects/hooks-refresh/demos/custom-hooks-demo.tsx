"use client";

import { useState, useSyncExternalStore } from "react";

// Two hand-written hooks, live. `useCounter` is called TWICE below — same logic,
// two independent counts, which is the point of the "shares logic, not state"
// section.
function useCounter(initial = 0, step = 1) {
    const [count, setCount] = useState(initial);
    return {
        count,
        increment: () => setCount((c) => c + step),
        reset: () => setCount(initial),
    };
}

// Storage is an external system, so this reads it through useSyncExternalStore
// rather than the useState + useEffect version taught below. Both persist; this
// one also survives hydration cleanly, because the server snapshot (null) is
// what the client renders first too — exactly the flash the `next` callout
// describes, made explicit instead of mismatching. `storage` fires for other
// tabs; the local event covers this one.
const LOCAL_WRITE = "hooks-refresh:local-write";

function subscribe(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener(LOCAL_WRITE, onStoreChange);
    return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(LOCAL_WRITE, onStoreChange);
    };
}

function useLocalStorage(key: string, initialValue: number) {
    // A string snapshot, so repeated reads compare equal and never loop.
    const stored = useSyncExternalStore(
        subscribe,
        () => window.localStorage.getItem(key),
        () => null, // server + first client render
    );

    let value = initialValue;
    try {
        if (stored !== null) value = JSON.parse(stored) as number;
    } catch {
        // corrupt JSON — fall back to the initial value
    }

    const setValue = (next: number) => {
        try {
            window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
            // storage full or blocked — persistence is best-effort
        }
        window.dispatchEvent(new Event(LOCAL_WRITE));
    };

    return [value, setValue] as const;
}

const btn =
    "rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text)] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";
const card =
    "rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3";
const eyebrow =
    "font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]";

function CounterCard({ label }: { label: string }) {
    const { count, increment, reset } = useCounter();
    return (
        <div className={card}>
            <p className={eyebrow}>{label} · useCounter()</p>
            <div className="mt-1 flex items-center gap-2">
                <button className={btn} onClick={increment}>
                    count++
                </button>
                <button className={btn} onClick={reset}>
                    reset
                </button>
                <span className="font-mono text-sm text-[var(--mint)]">{count}</span>
            </div>
        </div>
    );
}

export default function CustomHooksDemo() {
    const [saved, setSaved] = useLocalStorage("hooks-refresh:clicks", 0);

    return (
        <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
                <CounterCard label="component A" />
                <CounterCard label="component B" />
            </div>

            <div className={card}>
                <p className={eyebrow}>
                    useLocalStorage(&quot;hooks-refresh:clicks&quot;, 0)
                </p>
                <div className="mt-1 flex items-center gap-2">
                    <button className={btn} onClick={() => setSaved(saved + 1)}>
                        click++
                    </button>
                    <button className={btn} onClick={() => setSaved(0)}>
                        clear
                    </button>
                    <span className="font-mono text-sm text-[var(--accent)]">
                        {saved}
                    </span>
                </div>
                <p className="mt-1 font-mono text-[0.65rem] text-[var(--muted)]">
                    survives a reload — the value lives in localStorage
                </p>
            </div>

            <p className="text-xs text-[var(--muted)]">
                A and B call the SAME <span className="font-mono text-[var(--text)]">useCounter</span>{" "}
                and still count separately: a custom hook shares the logic, never the
                state.
            </p>
        </div>
    );
}
