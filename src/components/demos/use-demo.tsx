"use client";

import { createContext, Suspense, use, useState } from "react";

const ThemeContext = createContext<"dark" | "light">("dark");

// use() is legal inside a conditional — useContext isn't.
function ConditionalThemeReader({ show }: { show: boolean }) {
    if (!show) {
        return (
            <p className="font-mono text-xs text-[var(--muted)]">
                theme reader is hidden
            </p>
        );
    }
    const theme = use(ThemeContext);
    return (
        <p className="font-mono text-xs text-[var(--muted)]">
            theme: <span className="text-[var(--accent)]">{theme}</span>
        </p>
    );
}

// A tiny promise producer. In real Next.js code the promise is created in a
// server component and passed down; here we stash one in client state so the
// demo runs without any server round-trip.
function fetchQuote(): Promise<string> {
    return new Promise((resolve) =>
        setTimeout(
            () =>
                resolve(
                    "The only way out is through — Robert Frost.",
                ),
            1200,
        ),
    );
}

function Quote({ promise }: { promise: Promise<string> }) {
    // use(promise) suspends the component until the promise resolves.
    // React shows the nearest <Suspense> fallback while it's pending.
    const text = use(promise);
    return (
        <blockquote className="border-l-2 border-[var(--accent)] pl-3 text-sm text-[var(--text)]">
            “{text}”
        </blockquote>
    );
}

export default function UseHookDemo() {
    const [show, setShow] = useState(true);
    const [promise, setPromise] = useState<Promise<string> | null>(null);

    return (
        <ThemeContext value="dark">
            <div className="space-y-4">
                <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShow((s) => !s)}
                            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--surface)]"
                        >
                            toggle reader
                        </button>
                        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                            conditional context read
                        </span>
                    </div>
                    <ConditionalThemeReader show={show} />
                </div>

                <div className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPromise(fetchQuote())}
                            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--surface)]"
                        >
                            fetch quote
                        </button>
                        <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                            promise + &lt;Suspense&gt;
                        </span>
                    </div>

                    {promise ? (
                        <Suspense
                            fallback={
                                <p className="font-mono text-xs text-[var(--muted)]">
                                    loading…
                                </p>
                            }
                        >
                            <Quote promise={promise} />
                        </Suspense>
                    ) : (
                        <p className="font-mono text-xs text-[var(--muted)]">
                            no quote yet
                        </p>
                    )}
                </div>
            </div>
        </ThemeContext>
    );
}
