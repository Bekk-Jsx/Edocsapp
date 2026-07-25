"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function SearchBox() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const q = searchParams.get("q") ?? "";

    function setQ(next: string) {
        // Read-only URLSearchParams — clone it, mutate the copy, replace the URL.
        const params = new URLSearchParams(searchParams);
        if (next) params.set("q", next);
        else params.delete("q");
        router.replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="space-y-3">
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="type to set ?q=…"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
            />

            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                    live search params
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                    q ={" "}
                    <span className="text-[var(--accent)]">
                        {q ? `"${q}"` : "(unset)"}
                    </span>
                </p>
                <p className="mt-2 font-mono text-xs text-[var(--muted)]">
                    all keys:{" "}
                    <span className="text-[var(--accent)]">
                        [{Array.from(searchParams.keys()).map((k) => `"${k}"`).join(", ") || "—"}]
                    </span>
                </p>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Typing updates the URL via{" "}
                <span className="font-mono">router.replace</span>. Reload to
                confirm the state is really in the URL — the input rehydrates
                from <span className="font-mono">?q=</span>.
            </p>
        </div>
    );
}

export default function UseSearchParamsDemo() {
    // useSearchParams opts the containing tree out of static rendering.
    // Wrapping in <Suspense> keeps the boundary tight so the rest of the
    // route can still be prerendered.
    return (
        <Suspense
            fallback={
                <p className="font-mono text-xs text-[var(--muted)]">
                    loading search…
                </p>
            }
        >
            <SearchBox />
        </Suspense>
    );
}
