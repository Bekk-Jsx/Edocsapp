"use client";

import { useSyncExternalStore } from "react";

// ===================================================================
// The store — plain module scope, ZERO React. This is the same
// counterStore the page builds piece by piece: data, subscribe, emit,
// getSnapshot, and the methods that change it.
// ===================================================================

let state = 0;
const listeners = new Set<() => void>();

// "something changed, re-check" — every listener, every change.
function emit() {
    listeners.forEach((cb) => cb());
}

const counterStore = {
    subscribe(callback: () => void) {
        listeners.add(callback);
        return () => listeners.delete(callback); // unsubscribe (cleanup)
    },
    // A primitive, so repeated reads are Object.is-equal and React settles.
    getSnapshot() {
        return state;
    },
    // No client store on the server — see the page's "ssr snapshot" section.
    getServerSnapshot() {
        return 0;
    },
    increment() {
        state = state + 1;
        emit(); // change, THEN notify
    },
    decrement() {
        state = state - 1;
        emit();
    },
    reset() {
        state = 0;
        emit();
    },
};

// ===================================================================
// Two readers of the SAME store. Neither owns the count and neither
// talks to the other — clicking in one re-renders both, because both
// subscribed to the one module-level Set.
// ===================================================================

function Counter({ label }: { label: string }) {
    const count = useSyncExternalStore(
        counterStore.subscribe,
        counterStore.getSnapshot,
        counterStore.getServerSnapshot,
    );

    return (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                {label}
            </p>
            <p className="font-mono text-2xl text-[var(--accent)]">{count}</p>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={() => counterStore.increment()}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)]"
                >
                    +1
                </button>
                <button
                    onClick={() => counterStore.decrement()}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface)]"
                >
                    −1
                </button>
            </div>
        </div>
    );
}

export default function UseCustomStoreDemo() {
    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <Counter label="counter A" />
                <Counter label="counter B" />
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={() => counterStore.reset()}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    reset
                </button>
                <p className="text-xs text-[var(--muted)]">
                    Click <span className="font-mono">+1</span> in either counter —{" "}
                    <span className="font-mono">both</span> numbers move. The state
                    lives in the module, not in a component, so neither counter owns
                    it and no props pass between them.
                </p>
            </div>
        </div>
    );
}
