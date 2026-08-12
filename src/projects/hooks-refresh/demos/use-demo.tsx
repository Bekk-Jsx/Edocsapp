"use client";

import { Suspense, use, useState } from "react";

type User = { name: string; role: string; loadedAt: string };

// Stands in for a real fetch. In the App Router this promise would be created in
// a Server Component and passed down; here it is made once in client state so the
// demo runs with no round trip.
function fetchUser(attempt: number): Promise<User> {
    return new Promise((resolve) =>
        setTimeout(
            () =>
                resolve({
                    name: "Ada Lovelace",
                    role: "engineer",
                    loadedAt: `load #${attempt + 1}`,
                }),
            800,
        ),
    );
}

// The child does NOT know about loading. It reads the value and renders it —
// use() suspends while the promise is pending, and the boundary above owns the
// fallback.
function Profile({ userPromise }: { userPromise: Promise<User> }) {
    const user = use(userPromise);

    return (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-lg font-semibold text-[var(--text)]">{user.name}</p>
            <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                {user.role} · <span className="text-[var(--mint)]">resolved</span> ·{" "}
                {user.loadedAt}
            </p>
        </div>
    );
}

export default function UseHookDemo() {
    // The promise is created ONCE, in the initializer — never inline in render,
    // which would make a new promise every pass and suspend forever.
    const [attempt, setAttempt] = useState(0);
    const [userPromise, setUserPromise] = useState(() => fetchUser(0));

    function reload() {
        const next = attempt + 1;
        setAttempt(next);
        setUserPromise(fetchUser(next)); // created in a handler, not during render
    }

    return (
        <div className="space-y-3">
            {/* keyed by attempt: a fresh boundary remounts, so the fallback is
                shown again on every reload rather than holding the old value */}
            <Suspense
                key={attempt}
                fallback={
                    <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
                        <p className="font-mono text-sm text-[var(--amber)]">
                            Loading… <span className="text-[var(--muted)]">
                                (Suspense fallback — the child is suspended)
                            </span>
                        </p>
                    </div>
                }
            >
                <Profile userPromise={userPromise} />
            </Suspense>

            <div className="flex items-center gap-3">
                <button
                    onClick={reload}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    reload
                </button>
                <p className="text-xs text-[var(--muted)]">
                    Click reload to make a new promise — the fallback returns for
                    ~800ms, then <span className="font-mono">use</span> hands back the
                    value. No <span className="font-mono">useEffect</span>, and no
                    loading branch inside{" "}
                    <span className="font-mono">Profile</span>.
                </p>
            </div>
        </div>
    );
}
