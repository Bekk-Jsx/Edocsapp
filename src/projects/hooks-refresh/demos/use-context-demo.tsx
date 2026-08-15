"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// The value shape is the contract: state plus the actions that change it.
interface AuthValue {
    user: { name: string; email: string } | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (email: string) => Promise<void>;
    logout: () => void;
}

// Created once, at module top level. `null` is the default, so a consumer
// rendered without a provider is detectable rather than silently wrong.
const AuthContext = createContext<AuthValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthValue["user"]>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function login(email: string) {
        setIsLoading(true);
        await new Promise((r) => setTimeout(r, 700)); // stands in for the network
        setUser({ name: email.split("@")[0], email });
        setIsLoading(false);
    }

    function logout() {
        setUser(null);
    }

    // `isLoggedIn` is derived, not stored — it cannot drift out of sync with
    // `user`. Built inline, so the object identity is new on every render:
    // see "stable value" in the notes below.
    const value: AuthValue = {
        user,
        isLoading,
        isLoggedIn: user !== null,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const FIELD =
    "rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]";
const BTN =
    "rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-45";

function Consumer() {
    // Raw useContext, so the value is `AuthValue | null` and the no-provider case
    // is handled here. Both hooks are called before the guard: hooks must run
    // unconditionally, in the same order on every render.
    const auth = useContext(AuthContext);
    const [email, setEmail] = useState("amina@example.com");
    if (!auth) throw new Error("Consumer must be rendered inside <AuthProvider>");

    const { user, isLoading, isLoggedIn, login, logout } = auth;

    return (
        <div className="space-y-3">
            {/* everything here is read from the context — nothing is passed in */}
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[0.78rem]">
                <dt className="text-[var(--muted)]">isLoggedIn</dt>
                <dd className="text-[var(--accent)]">{String(isLoggedIn)}</dd>

                <dt className="text-[var(--muted)]">isLoading</dt>
                <dd className="text-[var(--accent)]">{String(isLoading)}</dd>

                <dt className="text-[var(--muted)]">user</dt>
                <dd className="text-[var(--accent)]">
                    {user ? `${user.name} · ${user.email}` : "null"}
                </dd>
            </dl>

            <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    void login(email);
                }}
            >
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoggedIn || isLoading}
                    aria-label="email"
                    className={`${FIELD} min-w-0 flex-1`}
                />
                <button
                    type="submit"
                    disabled={isLoggedIn || isLoading}
                    className={`${BTN} border-[var(--accent)] text-[var(--accent)]`}
                >
                    {isLoading ? "logging in…" : "log in"}
                </button>
                <button
                    type="button"
                    onClick={logout}
                    disabled={!isLoggedIn}
                    className={`${BTN} border-[var(--border)] text-[var(--muted)] enabled:hover:text-[var(--text)]`}
                >
                    log out
                </button>
            </form>
        </div>
    );
}

// Provide once, consume anywhere inside with raw useContext: <Consumer /> takes
// no props. Wrapping the read in a guarded custom hook is the Custom Hooks page.
export default function UseContextDemo() {
    return (
        <AuthProvider>
            <Consumer />
        </AuthProvider>
    );
}
