"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UseRouterDemo() {
    const router = useRouter();
    const [log, setLog] = useState<string[]>([]);

    const note = (line: string) =>
        setLog((prev) => [line, ...prev].slice(0, 5));

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => {
                        note("router.push('/hooks-refresh/use-pathname')");
                        router.push("/hooks-refresh/use-pathname");
                    }}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    push /use-pathname
                </button>
                <button
                    onClick={() => {
                        note("router.replace('/hooks-refresh/use-params')");
                        router.replace("/hooks-refresh/use-params");
                    }}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    replace /use-params
                </button>
                <button
                    onClick={() => {
                        note("router.back()");
                        router.back();
                    }}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    back
                </button>
                <button
                    onClick={() => {
                        note("router.refresh()");
                        router.refresh();
                    }}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    refresh
                </button>
            </div>

            <ul className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2 font-mono text-xs text-[var(--muted)]">
                {log.length === 0 ? (
                    <li>call log · click a button</li>
                ) : (
                    log.map((l, i) => (
                        <li key={i}>
                            <span className="text-[var(--accent)]">→</span> {l}
                        </li>
                    ))
                )}
            </ul>

            <p className="text-xs text-[var(--muted)]">
                Prefer <span className="font-mono">&lt;Link&gt;</span> for
                declarative nav. Use <span className="font-mono">useRouter</span>{" "}
                when navigation is programmatic — after a mutation, in an event
                handler, or conditional on some state.
            </p>
        </div>
    );
}
