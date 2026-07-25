"use client";

import { createContext, useContext, useMemo, useState } from "react";

type User = { name: string; role: "admin" | "guest" };

// Passing `null` here means "must be inside a provider" — consumers assume it exists.
const UserContext = createContext<User | null>(null);

function useUser(): User {
    const u = useContext(UserContext);
    if (!u) throw new Error("useUser must be used inside <UserContext>");
    return u;
}

function Header() {
    const user = useUser();
    return (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
            <span className="text-[var(--muted)]">header · </span>
            hi, <span className="text-[var(--accent)]">{user.name}</span>
        </div>
    );
}

function Sidebar() {
    const user = useUser();
    return (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
            <span className="text-[var(--muted)]">sidebar · </span>
            role: <span className="text-[var(--accent)]">{user.role}</span>
        </div>
    );
}

const USERS: User[] = [
    { name: "amina", role: "admin" },
    { name: "guest-01", role: "guest" },
];

export default function UseContextDemo() {
    const [i, setI] = useState(0);

    // Memoize so the value identity is stable across re-renders when i is unchanged —
    // otherwise every render creates a new object and defeats memoized consumers.
    const user = useMemo(() => USERS[i], [i]);

    return (
        <UserContext value={user}>
            <div className="space-y-3">
                <div className="flex gap-2">
                    {USERS.map((u, idx) => (
                        <button
                            key={u.name}
                            onClick={() => setI(idx)}
                            className={`rounded-md border px-3 py-1.5 text-sm ${idx === i
                                    ? "border-[var(--accent)] text-[var(--accent)]"
                                    : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                                }`}
                        >
                            {u.name}
                        </button>
                    ))}
                </div>

                <Header />
                <Sidebar />

                <p className="text-xs text-[var(--muted)]">
                    Both consumers re-render when the context value changes — no
                    prop drilling. In React 19, use{" "}
                    <code className="font-mono">&lt;UserContext value={"{...}"} /&gt;</code>{" "}
                    directly (no <code className="font-mono">.Provider</code>).
                </p>
            </div>
        </UserContext>
    );
}
