import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Two flags, both about expectations rather than crashes: `note` for the thing
// everyone assumes wrongly (that sharing a hook shares its state), and `next`
// for the one place a hand-written hook meets the server — localStorage doesn't
// exist during SSR. The rest is plain React with nothing to warn about.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (What a custom hook is) ---
    // inline `note · logic not state` callout
    "shares-logic-not-state": ["note"],
    // --- part 2 (Real examples) ---
    // inline `react ⇄ next · SSR guard & hydration` callout
    "uselocalstorage-persistent-state": ["next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-effect, use-memo, use-optimistic, use-params, use-pathname, use-reducer,
// use-router, use-search-params and use-selected-layout-segment define for their
// own parts.
function PartHeading({
    kicker,
    children,
}: {
    kicker: string;
    children: string;
}) {
    return (
        <div className="mt-14 mb-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {kicker}
            </p>
            <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

// ===================================================================
// Part 1 — What a custom hook is. The definition, the one thing people
// assume wrongly about it, and the rules it still has to follow.
// ===================================================================

const DEFINITION = `function useCounter() {
  const [count, setCount] = useState(0);
  return { count, increment: () => setCount(c => c + 1) };
}`;

const LOGIC_NOT_STATE = `function A() { const { count } = useCounter(); } // A's OWN count
function B() { const { count } = useCounter(); } // B's OWN count — separate`;

const RULES = `function useCounter(initial = 0, step = 1) { const [c, setC] = useState(initial); /* ... */ }

function useUser() { const auth = useAuth(); const [data] = useFetch(auth.id); return data; }`;

// ===================================================================
// Part 2 — Real examples. Three hooks worth writing, each showing a
// different shape: own state, own state + a browser API, shared state.
// ===================================================================

const USE_FETCH = `"use client";
import { useState, useEffect } from "react";

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch(url)
      .then(res => { if (!res.ok) throw new Error(\`HTTP \${res.status}\`); return res.json(); })
      .then(json => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}`;

const USE_LOCAL_STORAGE = `"use client";
import { useState, useEffect } from "react";

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue; // SSR guard
    try { const s = window.localStorage.getItem(key); return s ? JSON.parse(s) as T : initialValue; }
    catch { return initialValue; }
  });

  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}`;

const USE_AUTH = `"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type User = { id: string; name: string };
type AuthValue = { user: User | null; login: (u: User) => void; logout: () => void };

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return <AuthContext.Provider value={{ user, login: setUser, logout: () => setUser(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}`;

export function CustomHooksDocs() {
    return (
        <>
            <PartHeading kicker="part 1">What a custom hook is</PartHeading>
            <div>
                <DocSection title="the definition">
                    <CodeBlock code={DEFINITION} lang="tsx" />
                    <p>
                        <Term>It is just a FUNCTION.</Term> One whose name starts with{" "}
                        <Code>use</Code> and that CALLS other hooks inside it. There is
                        no special syntax and nothing to register.
                    </p>
                    <p>
                        <Term>Two things make it a hook.</Term> The{" "}
                        <Code>use*</Code>{" "}name — which is how React and the linter
                        know to apply the rules of hooks — and the fact that it calls
                        other hooks.
                    </p>
                    <p>
                        <Term>Its purpose is reusing stateful logic.</Term> Pull the
                        hook logic out of a component into a function, then use it like
                        any built-in hook.
                    </p>
                </DocSection>

                <DocSection title="shares logic, not state" sectionSeverity="note">
                    <CodeBlock code={LOGIC_NOT_STATE} lang="tsx" />
                    <p>
                        <Term>Each caller gets its OWN state.</Term>{" "}Two components
                        using the same custom hook do not see each other&apos;s values —
                        the hook shares the LOGIC (the how), not the values.
                    </p>
                    <p>
                        <Term>Like a recipe:</Term> same steps, separate meals. Same
                        code running twice, two independent pieces of state.
                    </p>
                    <p>
                        <Term>So a custom hook alone can&apos;t share state.</Term> For
                        that you need Context or a store underneath — which the hook can
                        WRAP, the way <Code>useAuth</Code> wraps a context below.
                    </p>

                    <Callout severity="note" label="note · logic not state">
                        <p>
                            Custom hooks share logic; each caller gets its own state.
                            Sharing state requires a shared source (Context/store) that
                            the hook wraps — the hook itself doesn&apos;t create
                            sharing.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="args, return, composition, rules">
                    <CodeBlock code={RULES} lang="tsx" />
                    <p>
                        <Term>They take ARGUMENTS and RETURN anything.</Term> An object,
                        an array, a single value — whatever the call site reads best.
                    </p>
                    <p>
                        <Term>They compose.</Term> A custom hook can call other custom
                        hooks, so small ones stack into bigger ones.
                    </p>
                    <p>
                        <Term>And they follow the RULES OF HOOKS.</Term> Call them at
                        the TOP LEVEL — never inside an <Code>if</Code>, a loop or a
                        nested function — and only from components or from other hooks.
                    </p>
                    <p>
                        <Term>
                            The <Code>use*</Code> prefix is required,
                        </Term>{" "}
                        not stylistic: it is what the linter keys off to enforce those
                        rules for you.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Real examples</PartHeading>
            <div>
                <DocSection title="useFetch — data fetching">
                    <CodeBlock code={USE_FETCH} lang="tsx" />
                    <p>
                        <Term>It bundles the data / loading / error trio</Term> — the
                        three pieces of state every fetch needs — into one reusable
                        hook.
                    </p>
                    <p>
                        <Term>
                            <Code>[url]</Code> is the dependency,
                        </Term>{" "}
                        so changing the URL re-fetches and nothing else does.
                    </p>
                    <p>
                        <Term>
                            The <Code>cancelled</Code> flag is the important part.
                        </Term>{" "}
                        The cleanup sets it before the next fetch or the unmount, so a
                        late response can&apos;t call <Code>setData</Code> on a gone
                        component or overwrite fresher data with a stale answer.
                    </p>
                    <p>
                        <Term>
                            <Code>res.ok</Code> has to be checked by hand.
                        </Term>{" "}
                        <Code>fetch</Code> does NOT reject on 404 or 500 — without that
                        line you would happily parse an error page as data.
                    </p>
                    <p>
                        <Term>
                            The generic <Code>&lt;T&gt;</Code> types the response,
                        </Term>{" "}
                        so <Code>data</Code> arrives as <Code>T | null</Code> at the
                        call site rather than <Code>any</Code>. And each caller gets its
                        own trio — logic shared, state separate.
                    </p>
                    <p>
                        <Term>In a real app you&apos;d reach for React Query or SWR</Term>{" "}
                        (caching, dedup, retries), or fetch in a Server Component.
                        Writing this once is how you learn what those are doing for you.
                    </p>
                </DocSection>

                <DocSection
                    title="useLocalStorage — persistent state"
                    sectionSeverity="next"
                >
                    <CodeBlock code={USE_LOCAL_STORAGE} lang="tsx" />
                    <p>
                        <Term>
                            Same API as <Code>useState</Code>
                        </Term>{" "}
                        — <Code>[value, setValue]</Code> — but the value survives a
                        reload. It wraps <Code>useState</Code> plus{" "}
                        <Code>useEffect</Code> to add persistence while keeping the
                        familiar interface.
                    </p>
                    <p>
                        <Term>The lazy initializer reads storage ONCE,</Term> on the
                        first render only, instead of on every render.
                    </p>
                    <p>
                        <Term>
                            <Code>typeof window === &quot;undefined&quot;</Code> is the
                            SSR guard.
                        </Term>{" "}
                        <Code>localStorage</Code> does not exist on the server — without
                        that line the component crashes during server rendering.
                    </p>
                    <p>
                        <Term>Storage holds strings only,</Term> hence{" "}
                        <Code>JSON.stringify</Code> on the way in and{" "}
                        <Code>JSON.parse</Code> on the way out — wrapped in{" "}
                        <Code>try/catch</Code> for corrupt JSON or a full store.
                    </p>

                    <Callout
                        severity="next"
                        label="react ⇄ next · SSR guard & hydration"
                    >
                        <p>
                            <Code>localStorage</Code>{" "}doesn&apos;t exist on the server —
                            guard with{" "}
                            <Code>typeof window === &quot;undefined&quot;</Code> or it
                            crashes during SSR. The server renders{" "}
                            <Code>initialValue</Code> and the stored value loads after
                            hydration, so expect a possible first-paint flash (use a
                            cookie or a pre-hydration script for critical values like
                            theme).
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="useAuth — wrapping a context">
                    <CodeBlock code={USE_AUTH} lang="tsx" />
                    <p>
                        <Term>This is the &ldquo;wrap a context&rdquo; pattern.</Term>{" "}
                        <Code>useAuth</Code> is essentially{" "}
                        <Code>useContext(AuthContext)</Code> plus a null check.
                    </p>
                    <p>
                        <Term>Why wrap it at all?</Term> A cleaner call site —{" "}
                        <Code>useAuth()</Code>{" "}everywhere, with no context object to
                        import. A clear error when it&apos;s used outside the provider:{" "}
                        <Code>createContext</Code> defaults to <Code>null</Code>, so
                        without the check you get a cryptic{" "}
                        <Code>cannot read user of null</Code> somewhere deep instead.
                        And encapsulation — consumers depend on <Code>useAuth</Code>,
                        not on the context internals.
                    </p>
                    <p>
                        <Term>This one DOES share state.</Term> Every caller reads the
                        same context, so a <Code>login</Code> in one place updates every
                        consumer.
                    </p>
                    <p>
                        <Term>Which is the whole contrast.</Term>{" "}
                        <Code>useFetch</Code> and <Code>useLocalStorage</Code> call{" "}
                        <Code>useState</Code> inside, so every caller owns its state;{" "}
                        <Code>useAuth</Code> wraps a SHARED context, so every caller
                        sees the same state.
                    </p>
                    <p>
                        <Term>In Next,</Term> mount <Code>AuthProvider</Code> — a client
                        component — inside the server root layout.
                    </p>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Custom hooks are plain React — nothing about them is
                    framework-specific. What changes in Next is the surroundings.
                </p>
                <p>
                    A hook that calls other client hooks needs{" "}
                    <Code>&quot;use client&quot;</Code> at the component boundary; any
                    browser API it touches (<Code>localStorage</Code>,{" "}
                    <Code>window</Code>) needs an SSR guard; and for initial data, a
                    Server Component or server-side fetch usually beats a client-side{" "}
                    <Code>useFetch</Code>.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            do two components sharing a custom hook share state?
                        </>
                    }
                    a={
                        <>
                            &ldquo;No — each gets its OWN state; the hook shares the{" "}
                            <Term>logic</Term>. Sharing state needs a Context or store
                            that the hook wraps, like <Code>useAuth</Code>.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>what makes a function a custom hook?</>}
                        a={
                            <>
                                &ldquo;A <Code>use*</Code> name plus{" "}
                                <Term>calling other hooks inside</Term> — the prefix is
                                what lets the linter enforce the rules of
                                hooks.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
