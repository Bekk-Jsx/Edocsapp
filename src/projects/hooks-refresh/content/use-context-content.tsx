import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > tip > next). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop below, which marks a section whose ENTIRE
// topic is one severity. See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // inline `trap · unstable value` callout — no header treatment, article only
    "stable-value": ["trap"],
    // whole section is a React-vs-Next difference (flagged header + article),
    // plus an inline `tip · mount low` callout. `next` sorts first, so the card
    // stays orchid.
    "client-boundary": ["next", "tip"],

    // --- part 2 (Usage) ---
    // inline `trap · missing provider` callout — no header treatment
    "missing-provider": ["trap"],
    // inline `trap · no partial subscription` callout — no header treatment
    "all-consumers-re-render": ["trap"],
    // whole section is a React-vs-Next difference (flagged header + article),
    // plus an inline `note · async components` callout. `next` sorts first, so
    // the card stays orchid.
    "server-components-can-t-consume": ["next", "note"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
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
// Part 1 — Creation. One fragment of the auth-context module per
// section, in the order the module is written: declare the context,
// own the state, expose the value, mark the boundary. Each section
// leads with its fragment and explains that fragment only — there is
// no whole-module source panel on this page.
// Consuming the context is Part 2.
// ===================================================================

const CREATE = `import { createContext } from "react";

interface AuthValue {
  user: { name: string; email: string } | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthValue | null>(null);`;

const PROVIDER = `export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthValue["user"]>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string) => {
    setIsLoading(true);
    const u = await api.login(email); // your real call
    setUser(u);
    setIsLoading(false);
  };
  const logout = () => setUser(null);

  // ...provide the value (next section)
}`;

const VALUE = `const value: AuthValue = {
  user,
  isLoading,
  isLoggedIn: user !== null, // derived, not stored
  login,
  logout,
};

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;`;

const BOUNDARY = `"use client";
// auth-context.tsx — the entire module is a client boundary`;

// Nested inside the `tip · mount low` callout at the end of "client boundary",
// showing the pattern that callout describes; the callout tints in globals.css
// re-colour the Shiki frame to the callout's own hue.
const MOUNT_LOW = `// layout.tsx (Server Component) — provider wraps server children
import { AuthProvider } from "@/context/auth-context"; // client
import ServerContent from "./server-content";          // stays server

export default function Layout({ children }) {
  return (
    <AuthProvider>
      {children}          {/* server content passed in -> stays server */}
    </AuthProvider>
  );
}`;


// ===================================================================
// Part 2 — Usage. The read side, in the order the questions come up:
// what a read resolves to, what it resolves to when nothing provides,
// who re-renders when it changes, and where it cannot be read at all.
// ===================================================================

const CONSUME = `"use client";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

function UserBadge() {
  const auth = useContext(AuthContext);   // the NEAREST provider above
  if (!auth) return null;

  const { user } = auth;
  return <span>{user ? user.name : "guest"}</span>;
}`;

const ACTIONS = `"use client";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

function AuthControls() {
  const auth = useContext(AuthContext);
  if (!auth) return null;

  const { user, isLoading, login, logout } = auth; // state + actions

  return user ? (
    <button onClick={logout}>Log out {user.name}</button>
  ) : (
    <button disabled={isLoading} onClick={() => login("sam@acme.com")}>
      {isLoading ? "Signing in…" : "Log in"}
    </button>
  );
}`;

const NESTED = `// the same context, provided twice — the inner one wins for its subtree
<AuthContext.Provider value={adminSession}>
  <Navbar />                        {/* reads adminSession */}

  <AuthContext.Provider value={guestSession}>
    <PreviewPane />                 {/* reads guestSession — nearest wins */}
  </AuthContext.Provider>

  <Footer />                        {/* reads adminSession again */}
</AuthContext.Provider>`;

const NO_PROVIDER = `// nothing provides AuthContext above this component
function UserBadge() {
  const auth = useContext(AuthContext); // -> null, the createContext default
  return <span>{auth.user.name}</span>; // TypeError: auth is null
}

// guard at the consumption site, so the cause is named where it happens
function UserBadge() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("UserBadge must be rendered inside <AuthProvider>");

  const { user } = auth;
  return <span>{user ? user.name : "guest"}</span>;
}`;

const ALL_CONSUMERS = `function UserName() {
  const auth = useContext(AuthContext);
  return <span>{auth?.user?.name}</span>;    // reads user only
}

function Spinner() {
  const auth = useContext(AuthContext);
  return auth?.isLoading ? <Dots /> : null;  // reads isLoading only
}

// login() flips isLoading -> BOTH re-render
// logout() clears user    -> BOTH re-render`;

const SPLIT = `// split by change rate: two contexts, two independent consumer sets
<UserContext.Provider value={userValue}>       {/* changes on login/logout */}
  <ThemeContext.Provider value={themeValue}>   {/* changes on every toggle */}
    <App />
  </ThemeContext.Provider>
</UserContext.Provider>`;

const SERVER_CONSUME = `// app/profile/page.tsx — Server Component (no "use client")
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";

export default function Page() {
  const auth = useContext(AuthContext);
  // useContext only works in Client Components. Add the "use client"
  // directive at the top of the file to use it.
  return <p>{auth?.user?.name}</p>;
}`;

const SERVER_PROPS = `// app/profile/page.tsx — fetch on the server, hand the data down as props
import { getUser } from "@/lib/user";
import Profile from "./profile";   // "use client"

export default async function Page() {
  const user = await getUser();    // runs on the server, never in the bundle
  return <Profile user={user} />;  // no context involved
}`;

export function UseContextDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Creation</PartHeading>
            <div>
                <DocSection title="createContext">
                    <CodeBlock code={CREATE} lang="tsx" />
                    <p>
                        <Term>
                            <Code>createContext(defaultValue)</Code> creates a context
                            object
                        </Term>{" "}
                        — a channel a provider fills and consumers read. It returns one
                        object exposing both ends: <Code>Ctx.Provider</Code> to supply a
                        value, and the context itself to read with{" "}
                        <Code>useContext</Code>.
                    </p>
                    <p>
                        <Term>The value is a contract.</Term> It is typically an object of
                        state and the actions that change it, typed once and shared by
                        every consumer.
                    </p>
                    <p>
                        <Term>The default is a fallback.</Term> It is used only when a
                        consumer has no matching Provider above it in the tree; with a
                        provider, it is ignored.
                    </p>
                    <p>
                        <Term>
                            <Code>null</Code> makes a missing provider detectable.
                        </Term>{" "}
                        Passing <Code>null</Code> rather than a fabricated object surfaces
                        an unprovided context immediately, instead of failing later with
                        an unclear error.
                    </p>
                    <p>
                        <Term>Create the context once, at module top level</Term> — never
                        inside a component, where it would be recreated each render and
                        break every consumer.
                    </p>
                </DocSection>

                <DocSection title="the provider">
                    <CodeBlock code={PROVIDER} lang="tsx" />
                    <p>
                        <Term>A context is empty until a Provider fills it.</Term> The
                        Provider is an ordinary component that owns the state and the
                        actions that change it.
                    </p>
                    <p>
                        <Term>The state belongs here, not in the route file.</Term>{" "}
                        Keeping <Code>useState</Code> in the Provider is the point: the
                        page stays thin, and the logic lives in the context module.
                    </p>
                    <p>
                        <Term>
                            <Code>children</Code> sets the scope.
                        </Term>{" "}
                        The Provider receives <Code>children</Code> as a prop and wraps
                        whatever is nested inside it, so the same provider can scope a
                        whole layout or a single subtree.
                    </p>
                </DocSection>

                <DocSection title="stable value">
                    <CodeBlock code={VALUE} lang="tsx" />
                    <p>
                        <Term>
                            The Provider exposes state and actions through{" "}
                            <Code>value</Code>.
                        </Term>{" "}
                        Derive values that follow from state instead of storing them:{" "}
                        <Code>isLoggedIn</Code> is <Code>user !== null</Code> computed each
                        render, so it can never drift out of sync with <Code>user</Code>.
                    </p>
                    <p>
                        <Term>The value is compared by reference.</Term> Built inline, a
                        new object is created every render, so every consumer re-renders
                        every time — even when nothing it reads changed.
                    </p>
                    <p>
                        <Term>Context has no partial subscription.</Term> Any change to the
                        provider value re-renders all consumers; a component cannot
                        subscribe to one field of it.
                    </p>

                    <Callout severity="trap" label="trap · unstable value">
                        <p>
                            An inline <Code>value</Code> object is a new reference each
                            render, so all consumers re-render — reference identity is
                            compared, not contents. Stabilize it so it changes only when
                            its contents do; that is what <Code>useMemo</Code> does (its
                            own page).
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="client boundary" sectionSeverity="next">
                    <CodeBlock code={BOUNDARY} lang="tsx" />
                    <p>
                        <Term>Context is a client-side mechanism.</Term> The module must
                        begin with <Code>&quot;use client&quot;</Code>, and only client
                        components can provide or consume it.
                    </p>
                    <p>
                        <Term>Server Components cannot participate.</Term> In the App
                        Router components are Server Components by default, and a Server
                        Component can neither call <Code>useContext</Code> nor render
                        provider state logic.
                    </p>
                    <p>
                        <Term>Mount providers inside a client boundary</Term> — usually a{" "}
                        <Code>Providers</Code> component rendered within a (server) layout
                        — and give Server Components their data via props or direct
                        fetching.
                    </p>
                    <p>
                        Context is for client concerns — theme, client session, open/closed
                        UI state — not for delivering server data.
                    </p>

                    <Callout severity="tip" label="tip · mount low">
                        <p>
                            Mount providers as low in the tree as they are needed. If you
                            must wrap high (a layout), pass server-rendered content as{" "}
                            <Code>children</Code> so it stays server and is not pulled into
                            the client bundle. Wrapping high does not make the whole app
                            client — importing content under the provider does.
                        </p>
                        <div className="mt-3">
                            <CodeBlock code={MOUNT_LOW} lang="tsx" />
                        </div>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Usage</PartHeading>
            <div>
                <DocSection title="consuming the value">
                    <CodeBlock code={CONSUME} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useContext</Code> reads the nearest provider above.
                        </Term>{" "}
                        Given the context object, React walks up the tree from the
                        consumer and stops at the closest matching{" "}
                        <Code>Provider</Code>, returning the value it holds. Distance is
                        irrelevant: a consumer twenty levels down reads the same value as
                        one directly inside the provider, and no component in between has
                        to pass anything along.
                    </p>
                    <CodeBlock code={ACTIONS} lang="tsx" />
                    <p>
                        <Term>The value carries actions as well as state.</Term> A
                        consumer destructures whatever it needs from the same{" "}
                        <Code>useContext</Code> call — <Code>user</Code> and{" "}
                        <Code>isLoading</Code> to render with, <Code>login</Code> and{" "}
                        <Code>logout</Code> to call — and invokes the actions from event
                        handlers like any other function.
                    </p>
                    <p>
                        <Term>The consumer never owns this state.</Term> It calls the
                        action, the action updates state inside the provider, and that
                        update re-renders the consumers with the new value. Nothing flows
                        back up: <Code>AuthControls</Code> holds no session state of its
                        own and has no setter for it. This is how context removes prop
                        drilling for behaviour too, not only for values.
                    </p>
                    <p>
                        <Term>Where the provider is mounted defines the scope.</Term> A
                        context has no reach of its own — only the subtree a provider
                        wraps can read it. Mounting the provider higher widens that
                        subtree; mounting it lower narrows it.
                    </p>
                    <CodeBlock code={NESTED} lang="tsx" />
                    <p>
                        <Term>A nested provider of the same context overrides it</Term>{" "}
                        for its own subtree, and only there. Because the lookup stops at
                        the first match, <Code>PreviewPane</Code> reads{" "}
                        <Code>guestSession</Code> while <Code>Navbar</Code> and{" "}
                        <Code>Footer</Code> — outside the inner provider — still read{" "}
                        <Code>adminSession</Code>. Overriding is scoped, not global: the
                        outer value is shadowed, never replaced.
                    </p>
                </DocSection>

                <DocSection title="missing provider">
                    <CodeBlock code={NO_PROVIDER} lang="tsx" />
                    <p>
                        <Term>No provider means the default, not an error.</Term> When the
                        walk up the tree finds no matching <Code>Provider</Code>,{" "}
                        <Code>useContext</Code> returns the value passed to{" "}
                        <Code>createContext</Code> — here <Code>null</Code>. Nothing
                        throws at the read; the fallback is doing exactly what it was
                        declared to do.
                    </p>
                    <p>
                        <Term>The failure surfaces later, somewhere else.</Term> The{" "}
                        <Code>null</Code> propagates until something dereferences it, so
                        the stack trace points at the consumer that used the value rather
                        than at the provider that was never mounted.
                    </p>
                    <p>
                        <Term>Guard at the consumption site.</Term> A{" "}
                        <Code>if (!auth)</Code> check — returning a fallback or throwing a
                        named error — converts a distant crash into an immediate, legible
                        one. Prefer a non-null default only when a genuine
                        &quot;no provider&quot; value exists: a default theme is
                        meaningful, an anonymous session usually is not. For auth, cart or
                        session data, <Code>null</Code> plus a guard is the honest choice.
                    </p>

                    <Callout severity="trap" label="trap · missing provider">
                        <p>
                            Consuming with no provider above returns the{" "}
                            <Code>createContext</Code> default (<Code>null</Code>), not an
                            error. That <Code>null</Code> propagates and crashes far from
                            the missing provider. Guard consumers (or throw a named error)
                            so a forgotten provider fails immediately.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="all consumers re-render">
                    <CodeBlock code={ALL_CONSUMERS} lang="tsx" />
                    <p>
                        <Term>Context has no partial subscription.</Term> A consumer
                        subscribes to the context, not to the field it happens to read.
                        Any change to the provider&apos;s value re-renders every consumer
                        beneath it — <Code>UserName</Code> re-renders when{" "}
                        <Code>isLoading</Code> flips, even though it never reads that
                        field.
                    </p>
                    <p>
                        <Term>This compounds with an unstable value.</Term> A value object
                        rebuilt inline on every provider render is a new reference every
                        time, so every consumer re-renders on every provider render —
                        whether or not any field actually changed. Keeping the reference
                        stable is what limits re-renders to real changes.
                    </p>
                    <CodeBlock code={SPLIT} lang="tsx" />
                    <p>
                        <Term>Split state that changes at different rates.</Term> Two
                        contexts mean two independent consumer sets: a theme toggle
                        re-renders only the theme consumers, and a login re-renders only
                        the user consumers. The split is the mechanism for limiting the
                        blast radius, since a single context cannot be subscribed to in
                        parts.
                    </p>

                    <Callout severity="trap" label="trap · no partial subscription">
                        <p>
                            Any change to the provider value re-renders{" "}
                            <strong className="text-[var(--text)]">all</strong> consumers —
                            you cannot subscribe to one field. Keep <Code>value</Code>{" "}
                            stable, and split unrelated or differently-paced state into
                            separate contexts to limit the re-render blast radius.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection
                    title="server components can't consume"
                    sectionSeverity="next"
                >
                    <CodeBlock code={SERVER_CONSUME} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useContext</Code> is client-only.
                        </Term>{" "}
                        It is a hook: it needs the render-time state machinery that only
                        exists on the client. A Server Component renders once, on the
                        server, with no hook runtime — so it cannot consume a context at
                        any depth, regardless of which providers are mounted above it.
                    </p>
                    <p>
                        <Term>The App Router is server-by-default.</Term> A component
                        without <Code>&quot;use client&quot;</Code> is a Server Component,
                        so reading a context in it errors rather than returning the
                        default. Adding the directive fixes the error by moving the
                        component into the client bundle — which is the right answer only
                        when the component genuinely needs client behaviour.
                    </p>
                    <CodeBlock code={SERVER_PROPS} lang="tsx" />
                    <p>
                        <Term>Fetch on the server and pass props.</Term> Context is a
                        transport for client state, not for server data. A Server
                        Component that awaits its data and hands it to a child as props
                        keeps the fetch on the server, ships less JavaScript, and needs no
                        provider at all.
                    </p>

                    <Callout severity="note" label="note · async components">
                        <p>
                            <Code>async function</Code> components are Server Components —
                            only Server Components can be async. They run on the server,
                            during the request, before any HTML is sent. Client components
                            can never be async like this.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useContext</Code> is identical to React. What differs is the
                    boundary: providers and consumers must be client components, and
                    Server Components cannot participate. Wrap the tree with a client{" "}
                    <Code>Providers</Code> component inside a server layout, and give
                    Server Components their data via props or direct fetching.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>what is the context default value for?</>}
                    a={
                        <>
                            &ldquo;A <Term>fallback</Term> used only when a consumer has{" "}
                            <Term>no Provider above it</Term>; with a provider present, it
                            is ignored.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                why do all consumers re-render when the provider value
                                changes?
                            </>
                        }
                        a={
                            <>
                                &ldquo;Context has <Term>no partial subscription</Term> —
                                any change to the provider value re-renders{" "}
                                <Term>every consumer</Term>, so an unstable
                                (new-reference) value re-renders them
                                needlessly.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
