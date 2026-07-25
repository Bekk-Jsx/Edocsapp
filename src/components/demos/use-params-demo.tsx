"use client";

import { useParams } from "next/navigation";

export default function UseParamsDemo() {
    const params = useParams();
    const keys = Object.keys(params);

    return (
        <div className="space-y-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                    useParams() on this page
                </p>
                <pre className="font-mono text-xs text-[var(--accent)]">
                    {JSON.stringify(params, null, 2)}
                </pre>
                {keys.length === 0 && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                        Empty — this route (
                        <span className="font-mono">/hooks/use-params</span>) has
                        no dynamic segments. On a route like{" "}
                        <span className="font-mono">/blog/[slug]</span>,{" "}
                        <span className="font-mono">useParams()</span> would
                        return <span className="font-mono">{`{ slug: "..." }`}</span>.
                    </p>
                )}
            </div>

            <p className="text-xs text-[var(--muted)]">
                Params are the <span className="text-[var(--mint)]">dynamic
                    route segments</span> React resolved from the URL path — not
                the query string. See the CODE panel for a real{" "}
                <span className="font-mono">[slug]</span> route.
            </p>
        </div>
    );
}
