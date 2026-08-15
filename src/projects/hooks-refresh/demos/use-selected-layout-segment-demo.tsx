"use client";

import {
    useSelectedLayoutSegment,
    useSelectedLayoutSegments,
} from "next/navigation";

// This page isn't a nested layout, so the live value below is only half the
// story: it is read relative to the closest layout ABOVE this component. The
// table is the other half — the same two hooks called from two different depths
// of one route tree, which is the whole point of "relative to the caller".
const ROWS = [
    {
        url: "/dashboard",
        dashboard: ["null", "[]"],
        settings: ["—", "—"],
    },
    {
        url: "/dashboard/settings",
        dashboard: ['"settings"', '["settings"]'],
        settings: ["null", "[]"],
    },
    {
        url: "/dashboard/settings/profile",
        dashboard: ['"settings"', '["settings", "profile"]'],
        settings: ['"profile"', '["profile"]'],
    },
];

export default function UseSelectedLayoutSegmentDemo() {
    const segment = useSelectedLayoutSegment();
    const segments = useSelectedLayoutSegments();

    const cell = "border-t border-[var(--border)] px-3 py-2 align-top";

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                    live · called from inside this page
                </p>
                <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                    useSelectedLayoutSegment() ·{" "}
                    <span className="text-[var(--accent)]">
                        {JSON.stringify(segment)}
                    </span>
                </p>
                <p className="font-mono text-xs text-[var(--muted)]">
                    useSelectedLayoutSegments() ·{" "}
                    <span className="text-[var(--accent)]">
                        {JSON.stringify(segments)}
                    </span>
                </p>
                <p className="mt-1 font-mono text-[0.65rem] text-[var(--muted)]">
                    empty because nothing is nested BELOW this page — the hook only
                    ever reports what sits under the caller.
                </p>
            </div>

            <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-2)]">
                <table className="w-full border-collapse font-mono text-xs">
                    <thead>
                        <tr className="text-left text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                            <th className="px-3 py-2 font-normal">URL</th>
                            <th className="px-3 py-2 font-normal">
                                dashboard layout
                            </th>
                            <th className="px-3 py-2 font-normal">
                                settings layout
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {ROWS.map((row) => (
                            <tr key={row.url}>
                                <td className={`${cell} text-[var(--text)]`}>
                                    {row.url}
                                </td>
                                {[row.dashboard, row.settings].map(
                                    ([single, plural], i) => (
                                        <td key={i} className={cell}>
                                            <span className="text-[var(--mint)]">
                                                {single}
                                            </span>
                                            <br />
                                            <span className="text-[var(--muted)]">
                                                {plural}
                                            </span>
                                        </td>
                                    ),
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Each cell: the{" "}
                <span className="font-mono text-[var(--mint)]">singular</span> value
                on top, the{" "}
                <span className="font-mono text-[var(--text)]">plural</span> array
                below. Same URL, different answers — because each layout only sees
                what is beneath ITSELF.
            </p>
        </div>
    );
}
