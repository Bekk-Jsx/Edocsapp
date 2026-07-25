"use client";

import { useSyncExternalStore } from "react";

// --- online-status store ---
function subscribeOnline(notify: () => void) {
    window.addEventListener("online", notify);
    window.addEventListener("offline", notify);
    return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
    };
}
const getOnlineSnapshot = () => navigator.onLine;
// Runs on the server (and during initial client render before hydration).
// Assume online — matches the most common initial state and avoids a mismatch.
const getOnlineServerSnapshot = () => true;

// --- window-width store ---
function subscribeWidth(notify: () => void) {
    window.addEventListener("resize", notify);
    return () => window.removeEventListener("resize", notify);
}
const getWidthSnapshot = () => window.innerWidth;
// No width on the server — return a sentinel and render "detecting…" until mount.
const getWidthServerSnapshot = () => 0;

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
        <div className="space-y-2">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                <span className="text-[var(--muted)]">network · </span>
                <span
                    className={
                        online ? "text-[var(--mint)]" : "text-[var(--amber)]"
                    }
                >
                    {online ? "online" : "offline"}
                </span>
            </div>

            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                <span className="text-[var(--muted)]">viewport width · </span>
                <span className="text-[var(--accent)]">
                    {width === 0 ? "detecting…" : `${width}px`}
                </span>
            </div>

            <p className="text-xs text-[var(--muted)]">
                Resize the window to watch the width update; toggle{" "}
                <span className="font-mono">DevTools → Network → Offline</span>{" "}
                to flip the online flag. Both values are pulled from{" "}
                <span className="font-mono">window</span> — non-React state —
                via <span className="font-mono">subscribe</span> +{" "}
                <span className="font-mono">getSnapshot</span>.
            </p>
        </div>
    );
}
