"use client";

import { useParams } from "next/navigation";

// This route is static (/hooks-refresh/use-params — no [bracket] folders), so
// the live value is `{}`. That IS the lesson: params come from the route's
// dynamic segments, not from the URL string. The example beside it shows what
// the same call returns one folder deeper on a real [slug] route.
const EXAMPLE = `// app/blog/[slug]/page.tsx   URL: /blog/hello-world
useParams();   // { slug: "hello-world" }`;

export default function UseParamsDemo() {
    const params = useParams();
    const isEmpty = Object.keys(params).length === 0;

    return (
        <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                        useParams() · this route
                    </p>
                    <pre className="mt-1 font-mono text-xs text-[var(--accent)]">
                        {JSON.stringify(params, null, 2)}
                    </pre>
                    {isEmpty ? (
                        <p className="mt-1 font-mono text-[0.65rem] text-[var(--muted)]">
                            empty — no <span className="text-[var(--amber)]">[…]</span>{" "}
                            segments in this path
                        </p>
                    ) : null}
                </div>

                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                        on a dynamic route
                    </p>
                    <pre className="mt-1 overflow-x-auto font-mono text-xs text-[var(--mint)]">
                        {EXAMPLE}
                    </pre>
                </div>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Param names come from{" "}
                <span className="font-mono text-[var(--text)]">[bracket]</span> FOLDER
                names and their values from the URL — so a static route like this one
                simply has none. Query strings (
                <span className="font-mono text-[var(--text)]">?page=2</span>) are a
                different thing entirely.
            </p>
        </div>
    );
}
