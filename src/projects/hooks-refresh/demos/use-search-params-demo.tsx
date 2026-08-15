"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

// The full copy -> modify -> navigate cycle, on this page's own URL. Every
// control rebuilds the query from a MUTABLE copy of the current params and
// replaces the URL — replace, not push, so filtering doesn't stack history.
// The page wraps this component in <Suspense>: useSearchParams is request-time,
// and the boundary is what keeps the rest of the route static.
const PAGES = ["1", "2", "3"];

export default function UseSearchParamsDemo() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const page = searchParams.get("page");
    const sort = searchParams.get("sort");
    const query = searchParams.toString();

    function update(key: string, value: string | null) {
        const params = new URLSearchParams(searchParams); // mutable copy
        if (value === null) params.delete(key);
        else params.set(key, value);
        const next = params.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }

    const btn =
        "rounded-md border px-3 py-1.5 font-mono text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";
    const off =
        "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)]";
    const on =
        "border-[var(--mint)] bg-[color-mix(in_srgb,var(--mint)_12%,var(--surface))] text-[var(--mint)]";

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                    page
                </span>
                {PAGES.map((value) => (
                    <button
                        key={value}
                        onClick={() => update("page", value)}
                        className={`${btn} ${page === value ? on : off}`}
                    >
                        ?page={value}
                    </button>
                ))}
                <button
                    onClick={() => update("sort", sort === "asc" ? "desc" : "asc")}
                    className={`${btn} ${sort ? on : off}`}
                >
                    sort={sort ?? "—"}
                </button>
                <button
                    onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.delete("page");
                        params.delete("sort");
                        const next = params.toString();
                        router.replace(next ? `${pathname}?${next}` : pathname, {
                            scroll: false,
                        });
                    }}
                    className={`${btn} ${off}`}
                >
                    clear
                </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                        searchParams.toString()
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-[var(--accent)]">
                        {query ? `?${query}` : "(empty)"}
                    </p>
                </div>

                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                        .get(key)
                    </p>
                    <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                        page ·{" "}
                        <span className="text-[var(--mint)]">
                            {JSON.stringify(page)}
                        </span>
                        {"  "}sort ·{" "}
                        <span className="text-[var(--mint)]">
                            {JSON.stringify(sort)}
                        </span>
                    </p>
                </div>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Every button does the same three steps:{" "}
                <span className="font-mono text-[var(--text)]">
                    new URLSearchParams(searchParams)
                </span>{" "}
                → <span className="font-mono text-[var(--text)]">.set()</span> /{" "}
                <span className="font-mono text-[var(--text)]">.delete()</span> →{" "}
                <span className="font-mono text-[var(--text)]">router.replace()</span>.
                The hook itself is read-only.
            </p>
        </div>
    );
}
