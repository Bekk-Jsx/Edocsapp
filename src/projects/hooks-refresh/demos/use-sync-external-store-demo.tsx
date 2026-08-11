"use client";

import { useSyncExternalStore } from "react";

// ===================================================================
// Two external stores, both of them the BROWSER. Each is the same three
// pieces: subscribe (how React listens), getSnapshot (how React reads),
// getServerSnapshot (what SSR sees instead).
// ===================================================================

// --- online status: the online/offline events ---
function subscribeOnline(notify: () => void) {
    window.addEventListener("online", notify);
    window.addEventListener("offline", notify);
    return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
    };
}
const getOnlineSnapshot = () => navigator.onLine;
// A boolean, so repeated reads are Object.is-equal. Assume online: it is the
// common case and keeps the server HTML closest to what hydration will find.
const getOnlineServerSnapshot = () => true;

// --- viewport width: the resize event ---
function subscribeWidth(notify: () => void) {
    window.addEventListener("resize", notify);
    return () => window.removeEventListener("resize", notify);
}
const getWidthSnapshot = () => window.innerWidth;
// There is no window on the server — 0 is a sentinel the UI renders as
// "detecting…" until the first client read replaces it.
const getWidthServerSnapshot = () => 0;

function Readout({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: string;
}) {
    return (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                {label}
            </p>
            <p className="font-mono text-2xl" style={{ color: tone }}>
                {value}
            </p>
        </div>
    );
}

export default function UseSyncExternalStoreDemo() {
    const online = useSyncExternalStore(
        subscribeOnline,
        getOnlineSnapshot,
        getOnlineServerSnapshot,
    );
    const width = useSyncExternalStore(
        subscribeWidth,
        getWidthSnapshot,
        getWidthServerSnapshot,
    );

    return (
        <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <Readout
                    label="navigator.onLine"
                    value={online ? "online" : "offline"}
                    tone={online ? "var(--mint)" : "var(--amber)"}
                />
                <Readout
                    label="window.innerWidth"
                    value={width === 0 ? "detecting…" : `${width}px`}
                    tone="var(--accent)"
                />
            </div>

            <p className="text-xs text-[var(--muted)]">
                Resize the window to watch the width update; toggle{" "}
                <span className="font-mono">DevTools → Network → Offline</span> to
                flip the online flag. Neither value is React state — both are read
                off <span className="font-mono">window</span> through{" "}
                <span className="font-mono">subscribe</span> +{" "}
                <span className="font-mono">getSnapshot</span>, and both fall back to
                a server snapshot during SSR.
            </p>
        </div>
    );
}
