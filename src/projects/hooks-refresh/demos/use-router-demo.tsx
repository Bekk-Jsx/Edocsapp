"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

// Every button here stays on THIS page: push/replace only change the query
// string, so the demo can show a real history stack without navigating the
// reader away. The counter exists to prove the other half of the story —
// router.refresh() re-runs the server render but does NOT reset client state.
export default function UseRouterDemo() {
    const router = useRouter();
    const pathname = usePathname();

    const [log, setLog] = useState<string[]>([]);
    const [count, setCount] = useState(0);
    const [step, setStep] = useState(1);

    const note = (line: string) => setLog((prev) => [line, ...prev].slice(0, 5));

    const btn =
        "rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text)] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <button
                    className={btn}
                    onClick={() => {
                        const next = step + 1;
                        setStep(next);
                        note(`router.push("?nav=${next}")  — adds a history entry`);
                        router.push(`${pathname}?nav=${next}`, { scroll: false });
                    }}
                >
                    router.push()
                </button>
                <button
                    className={btn}
                    onClick={() => {
                        const next = step + 1;
                        setStep(next);
                        note(
                            `router.replace("?nav=${next}")  — replaces the entry`,
                        );
                        router.replace(`${pathname}?nav=${next}`, {
                            scroll: false,
                        });
                    }}
                >
                    router.replace()
                </button>
                <button
                    className={btn}
                    onClick={() => {
                        note("router.back()  — history stack");
                        router.back();
                    }}
                >
                    router.back()
                </button>
                <button
                    className={btn}
                    onClick={() => {
                        note("router.forward()  — history stack");
                        router.forward();
                    }}
                >
                    router.forward()
                </button>
                <button
                    className={btn}
                    onClick={() => {
                        note("router.refresh()  — re-runs Server Components");
                        router.refresh();
                    }}
                >
                    router.refresh()
                </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                        usePathname()
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-[var(--text)]">
                        {pathname}
                    </p>
                    <p className="mt-1 font-mono text-[0.65rem] text-[var(--muted)]">
                        push/replace here only change{" "}
                        <span className="text-[var(--accent)]">?nav</span>, so the
                        path never moves.
                    </p>
                </div>

                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                        client state
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                        <button
                            className={btn}
                            onClick={() => setCount((c) => c + 1)}
                        >
                            count++
                        </button>
                        <span className="font-mono text-sm text-[var(--mint)]">
                            {count}
                        </span>
                    </div>
                    <p className="mt-1 font-mono text-[0.65rem] text-[var(--muted)]">
                        raise it, then hit refresh() — it survives.
                    </p>
                </div>
            </div>

            <ul className="space-y-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 font-mono text-xs text-[var(--muted)]">
                {log.length === 0 ? (
                    <li>call log · click a button</li>
                ) : (
                    log.map((line, i) => (
                        <li key={`${line}-${i}`}>
                            <span className="text-[var(--accent)]">→</span> {line}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
