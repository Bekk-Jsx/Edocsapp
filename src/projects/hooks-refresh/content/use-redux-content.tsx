import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header — that
// is the explicit `sectionSeverity` prop, which marks a section whose ENTIRE
// topic is one severity. "the provider" carries two, so its header stays plain
// and both icons show on its card.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Why Redux) ---
    // inline `note · when to reach for redux` callout
    "context-vs-redux": ["note"],

    // --- part 2 (Setup (Next.js)) ---
    // inline `react ⇄ next · client provider` plus `danger · shared store on the
    // server`. `danger` sorts first, so the card reads red.
    "the-provider": ["next", "danger"],

    // --- part 3 (Slices) ---
    // inline `note · mutation allowed here only` callout
    createslice: ["note"],

    // --- part 4 (Using it) ---
    // inline `trap · new selector references` callout
    "selector-references": ["trap"],

    // --- part 5 (Async) ---
    // inline `react ⇄ next · fetch on the server` callout
    "async-in-next-js": ["next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-context, use-effect, use-memo and use-callback
// define for their own part dividers.
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
// Part 1 — Why Redux. What the store is, the problem it removes, and
// the one capability that actually distinguishes it from Context.
// ===================================================================

const STORE_SHAPE = `// one object, split by domain — each key is a SLICE
store = {
  user:     { data: null, loading: false },
  products: { list: [], filter: "all" },
  session:  { token: null, expiresAt: null },
}`;

const PROP_DRILLING = `// UserMenu needs \`user\`. Nobody in between does.
//
//   App            holds user  ─┐
//    └─ Layout     passes it     │  three components take a prop
//        └─ Sidebar passes it    │  they never read, purely to
//            └─ UserMenu  uses it ┘  forward it downward

<Layout user={user}>
  <Sidebar user={user}>
    <UserMenu user={user} />   {/* the only consumer */}
  </Sidebar>
</Layout>`;

const CONTEXT_VS_REDUX = `// Context: X uses a, Y uses a, Z uses b
//   b changes -> X, Y, Z ALL re-render (one subscription: the whole value)

// Redux: each component selects the piece it needs
const a = useSelector((s) => s.a);   // X and Y
const b = useSelector((s) => s.b);   // Z
//   b changes -> only Z re-renders`;

// ===================================================================
// Part 2 — Setup in the App Router. The store module, then the client
// provider that has to wrap a server layout — and the per-request rule
// that makes the difference between a demo and a data leak.
// ===================================================================

const THE_STORE = `// lib/store.ts
import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "@/features/counter/counterSlice";
import userReducer from "@/features/user/userSlice";

export const store = configureStore({
  reducer: { counter: counterReducer, user: userReducer }, // -> state.counter, state.user
});

// inferred FROM the store, so they can never drift from the real slices
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`;

const STORE_PROVIDER = `// app/StoreProvider.tsx — the client boundary
"use client";
import { Provider } from "react-redux";
import { store } from "@/lib/store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}`;

const ROOT_LAYOUT = `// app/layout.tsx — stays a Server Component
import { StoreProvider } from "./StoreProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}`;

// Nested inside the `danger · shared store on the server` callout; the callout
// tints in globals.css re-colour the Shiki frame to the callout's own hue.
const MAKE_STORE = `// lib/store.ts — a factory, never a module-level instance
export const makeStore = () =>
  configureStore({ reducer: { counter, user } });

export type AppStore = ReturnType<typeof makeStore>;

// app/StoreProvider.tsx — one store per client, built once
const storeRef = useRef<AppStore | null>(null);
if (!storeRef.current) storeRef.current = makeStore();`;

// ===================================================================
// Part 3 — Slices. One file per domain: state, the transitions that
// change it, and the actions RTK generates from them.
// ===================================================================

const CREATE_SLICE = `// features/counter/counterSlice.ts
import { createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },                    // Immer makes this safe
    incrementBy: (state, action: { payload: number }) => {
      state.value += action.payload;
    },
  },
});

export const { increment, incrementBy } = counterSlice.actions;   // auto-generated
export default counterSlice.reducer;                              // -> the store's reducer map`;

// ===================================================================
// Part 4 — Using it. Read with a selector, write with a dispatch, and
// the one selector mistake that quietly undoes the whole benefit.
// ===================================================================

const TYPED_HOOKS = `// lib/hooks.ts — define once, use everywhere
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();`;

const COMPONENT = `// features/counter/Counter.tsx
"use client";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { increment, incrementBy } from "@/features/counter/counterSlice";

function Counter() {
  const value = useAppSelector((state) => state.counter.value); // selective re-render
  const dispatch = useAppDispatch();

  return (
    <>
      <p>{value}</p>
      <button onClick={() => dispatch(increment())}>+1</button>
      <button onClick={() => dispatch(incrementBy(5))}>+5</button>
    </>
  );
}`;

const SELECTOR_REFS = `// new object every call -> re-renders on EVERY dispatch, even unrelated ones
const data = useAppSelector((s) => ({ user: s.user, cart: s.cart }));   // BAD

// select primitives / stable refs, or a memoized selector
const user = useAppSelector((s) => s.user);                             // GOOD`;

// ===================================================================
// Part 5 — Async. Reducers stay pure, so side effects live in a thunk;
// and in the App Router most initial data should not be a thunk at all.
// ===================================================================

const ASYNC_THUNK = `// features/user/userSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const fetchUser = createAsyncThunk("user/fetch", async (id: string) => {
  const res = await fetch(\`/api/user/\${id}\`);
  return res.json();                                  // -> action.payload
});

export const fetchAllUsers = createAsyncThunk("user/fetchAll", async () => {
  const res = await fetch(\`/api/users\`);
  return res.json();
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    data: null as any,
    list: [] as any[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},                                       // no sync actions here
  extraReducers: (builder) => {                       // actions defined OUTSIDE this slice
    builder
      .addCase(fetchUser.pending,   (s)    => { s.loading = true; })
      .addCase(fetchUser.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; })
      .addCase(fetchUser.rejected,  (s, a) => { s.loading = false; s.error = a.error.message ?? "failed"; })
      .addCase(fetchAllUsers.pending,   (s)    => { s.loading = true; })
      .addCase(fetchAllUsers.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchAllUsers.rejected,  (s, a) => { s.loading = false; s.error = a.error.message ?? "failed"; });
  },
});

export default userSlice.reducer;`;

const DISPATCH_THUNK = `// dispatching them — same call shape as any other action
dispatch(fetchUser("42"));
dispatch(fetchAllUsers());`;

const SERVER_FETCH = `// app/users/page.tsx — Server Component
// ✅ prefer: fetch on the server, pass as props
export default async function Page() {
  const users = await getUsers();      // runs on the server, never in the bundle
  return <UserList users={users} />;   // no thunk, no loading flash
}`;

export function ReduxDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Why Redux</PartHeading>
            <div>
                <DocSection title="what redux is">
                    <CodeBlock code={STORE_SHAPE} lang="ts" />
                    <p>
                        <Term>Redux is ONE global store</Term> — a single object holding
                        state that ANY component can read from and update, however far
                        apart they sit in the tree. There is one store per app, not one
                        per feature.
                    </p>
                    <p>
                        <Term>The store is split into SLICES by domain.</Term> Each
                        top-level key (<Code>user</Code>, <Code>products</Code>,{" "}
                        <Code>session</Code>) is owned by its own slice file, with its
                        own initial state and its own transitions. The store is the sum
                        of them; nothing else writes to a slice.
                    </p>
                    <p>
                        <Term>Modern Redux means Redux Toolkit.</Term> RTK is the
                        official package and removed the boilerplate the library was
                        known for — hand-written action-creator files, string type
                        constants, manual store composition,{" "}
                        <Code>connect</Code>/<Code>mapStateToProps</Code>. Tutorials
                        showing those are pre-RTK.
                    </p>
                    <p>
                        <Term>The whole store is inspectable.</Term> The Redux DevTools
                        extension shows current state, every dispatched action and the
                        state before and after it — which is a large part of why teams
                        pick Redux for state that is hard to reason about.
                    </p>
                </DocSection>

                <DocSection title="the problem it solves">
                    <CodeBlock code={PROP_DRILLING} lang="tsx" />
                    <p>
                        <Term>
                            Sharing state between DISTANT components means prop
                            drilling.
                        </Term>{" "}
                        Without a store, the state has to live at the closest common
                        ancestor and be threaded down by hand — through every layer in
                        between, whether or not that layer has any use for it.
                    </p>
                    <p>
                        <Term>The intermediate components pay the cost.</Term>{" "}
                        <Code>Layout</Code> and <Code>Sidebar</Code> gain a prop, a type
                        and a reason to change every time the shape of{" "}
                        <Code>user</Code> changes. They are coupled to data they never
                        read.
                    </p>
                    <p>
                        <Term>A store removes the middle entirely.</Term> The state
                        lives in one place, the consumer reads it directly, and the
                        components in between go back to knowing nothing about it.
                        Distance stops mattering.
                    </p>
                </DocSection>

                <DocSection title="context vs redux">
                    <CodeBlock code={CONTEXT_VS_REDUX} lang="tsx" />
                    <p>
                        <Term>Context has NO partial subscription.</Term> A consumer
                        subscribes to the context, not to the field it reads — so any
                        change to the provider value re-renders every consumer beneath
                        it. Splitting into more contexts is the only lever you have.
                    </p>
                    <p>
                        <Term>
                            <Code>useSelector</Code> gives PARTIAL SUBSCRIPTION.
                        </Term>{" "}
                        Each component subscribes to exactly the slice its selector
                        returns. An update elsewhere in the store computes a selector
                        that returns the same value, so the component is left alone.
                        That is the structural difference, not a tuning detail.
                    </p>
                    <p>
                        <Term>The rest is structure and tooling.</Term> Organized slices
                        per domain, DevTools with an action log and time travel,
                        middleware for cross-cutting concerns, and one standard pattern
                        for async instead of a per-team invention.
                    </p>
                    <p>
                        <Term>Neither one wins outright.</Term> Context is built in,
                        costs nothing to adopt, and is the right answer for a few small
                        values. Redux is a dependency and a set of conventions that pay
                        off when state is large, interconnected and changes often.
                    </p>

                    <Callout severity="note" label="note · when to reach for redux">
                        <p>
                            For a handful of simple shared values, Context (or{" "}
                            <Code>useReducer</Code> + Context) is enough. Reach for
                            Redux when state is large, interconnected, and changes often
                            — selective re-rendering and tooling pay off there.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Setup (Next.js)</PartHeading>
            <div>
                <DocSection title="the store">
                    <CodeBlock code={THE_STORE} lang="ts" />
                    <p>
                        <Term>
                            <Code>configureStore</Code> builds the single store.
                        </Term>{" "}
                        It wires up the reducers, the default middleware and the
                        DevTools connection in one call — the setup that used to be a
                        file of its own.
                    </p>
                    <p>
                        <Term>
                            <Code>reducer</Code> maps slice name → that slice&apos;s
                            reducer.
                        </Term>{" "}
                        That map IS the shape of your state: the key you choose is the
                        key you select through, so{" "}
                        <Code>{"{ counter: counterReducer }"}</Code> is what makes{" "}
                        <Code>state.counter</Code> exist. Registering a domain means
                        adding a line here.
                    </p>
                    <p>
                        <Term>
                            <Code>RootState</Code> and <Code>AppDispatch</Code> are
                            INFERRED from the store.
                        </Term>{" "}
                        They are derived with <Code>ReturnType</Code> rather than
                        declared by hand, so adding a slice updates the types
                        automatically and a selector into a slice you removed stops
                        compiling.
                    </p>
                </DocSection>

                <DocSection title="the provider">
                    <CodeBlock code={STORE_PROVIDER} lang="tsx" />
                    <p>
                        <Term>The react-redux Provider is client-only.</Term> It works
                        through React context and hooks, neither of which exists in a
                        Server Component. So the Provider goes in its own{" "}
                        <Code>&quot;use client&quot;</Code> module rather than directly
                        in the layout.
                    </p>

                    <CodeBlock code={ROOT_LAYOUT} lang="tsx" />
                    <p>
                        <Term>The layout stays a Server Component.</Term> It imports the
                        client <Code>StoreProvider</Code> and renders it around{" "}
                        <Code>children</Code>. Content passed in as children stays on
                        the server — wrapping the tree in a client provider does not
                        make the tree client. This is the same pattern any Context
                        provider uses in the App Router.
                    </p>
                    <p>
                        <Term>Everything that touches the store is client code.</Term>{" "}
                        <Code>useSelector</Code> and <Code>useDispatch</Code> are hooks,
                        so any component reading or dispatching needs the directive too.
                        The store is a client-side concern by construction.
                    </p>

                    <Callout severity="next" label="react ⇄ next · client provider">
                        <p>
                            The Redux Provider (and <Code>useSelector</Code>/
                            <Code>useDispatch</Code>) are client-only. Keep the layout a
                            Server Component and mount a{" "}
                            <Code>&quot;use client&quot;</Code> StoreProvider inside it.
                        </p>
                    </Callout>

                    <Callout
                        severity="danger"
                        label="danger · shared store on the server"
                    >
                        <p>
                            A single module-level store is shared across ALL requests on
                            the server — one user&apos;s data can leak into
                            another&apos;s response. Create the store PER REQUEST: a{" "}
                            <Code>makeStore()</Code> factory, and have{" "}
                            <Code>StoreProvider</Code> build it once per client (e.g. in
                            a <Code>useRef</Code>). Never reuse one global store instance
                            across server requests.
                        </p>
                        <div className="mt-3">
                            <CodeBlock code={MAKE_STORE} lang="ts" />
                        </div>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 3">Slices</PartHeading>
            <div>
                <DocSection title="createSlice">
                    <CodeBlock code={CREATE_SLICE} lang="ts" />
                    <p>
                        <Term>
                            A slice bundles <Code>name</Code>, <Code>initialState</Code>{" "}
                            and <Code>reducers</Code>.
                        </Term>{" "}
                        One file owns one domain: the state it starts with and every
                        transition allowed on it. Nothing outside the slice can change
                        that state.
                    </p>
                    <p>
                        <Term>RTK auto-generates a matching action per reducer.</Term>{" "}
                        A reducer named <Code>increment</Code> produces an{" "}
                        <Code>increment()</Code> action creator on{" "}
                        <Code>counterSlice.actions</Code>, with the type string{" "}
                        <Code>&quot;counter/increment&quot;</Code> derived from{" "}
                        <Code>name</Code>. No hand-written action creators, no type
                        constants — that entire layer is gone.
                    </p>
                    <p>
                        <Term>The payload is the argument.</Term> A reducer&apos;s
                        second parameter is the action, and{" "}
                        <Code>action.payload</Code> is whatever you passed to the
                        creator: <Code>incrementBy(5)</Code> builds{" "}
                        <Code>{'{ type: "counter/incrementBy", payload: 5 }'}</Code>. A
                        reducer taking no argument (<Code>increment</Code>) simply
                        ignores it.
                    </p>
                    <p>
                        <Term>Two exports, two jobs.</Term> The named action creators are
                        imported by components to dispatch; the default export is the
                        reducer, registered under a key in the store&apos;s{" "}
                        <Code>reducer</Code> map (see &quot;the store&quot;). The key you
                        register it under is what you select through.
                    </p>

                    <Callout severity="note" label="note · mutation allowed here only">
                        <p>
                            <Code>state.value += 1</Code> looks like mutation, but RTK
                            uses Immer to turn it into a safe immutable update — this is
                            the ONE place the &quot;never mutate&quot; rule is
                            intentionally reversed: inside <Code>createSlice</Code>{" "}
                            reducers only. Everywhere else, still return new state.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 4">Using it</PartHeading>
            <div>
                <DocSection title="useSelector, useDispatch & typed hooks">
                    <CodeBlock code={TYPED_HOOKS} lang="ts" />
                    <p>
                        <Term>Define TYPED hooks once, then use them everywhere.</Term>{" "}
                        The raw react-redux hooks don&apos;t know your store:{" "}
                        <Code>useSelector</Code> hands you an <Code>unknown</Code> state
                        and <Code>useDispatch</Code> can&apos;t type a thunk. Wrapping
                        them with <Code>RootState</Code> and <Code>AppDispatch</Code>{" "}
                        makes <Code>state.</Code> autocomplete and dispatch accept your
                        actions. Import <Code>useAppSelector</Code>/
                        <Code>useAppDispatch</Code> — not the react-redux ones.
                    </p>

                    <CodeBlock code={COMPONENT} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useSelector</Code> takes (whole state) → the piece you
                            want.
                        </Term>{" "}
                        React-redux runs that selector after every dispatch and
                        re-renders the component only when the RESULT changed. Selecting{" "}
                        <Code>state.counter.value</Code> means a change in{" "}
                        <Code>state.user</Code> never touches this component.
                    </p>
                    <p>
                        <Term>
                            <Code>useDispatch</Code> gives you the store&apos;s dispatch.
                        </Term>{" "}
                        The cycle is one direction:{" "}
                        <Code>dispatch(action())</Code> → the store runs the matching
                        slice reducer → the state updates → every component whose
                        selector result changed re-renders. Components never write to
                        the store directly.
                    </p>
                    <p>
                        <Term>Call the creator, don&apos;t pass it.</Term>{" "}
                        <Code>dispatch(increment())</Code> dispatches the action object;{" "}
                        <Code>dispatch(increment)</Code> dispatches the function and
                        fails. The parentheses are the whole difference.
                    </p>
                    <p>
                        <Term>Both hooks are client-only</Term> — the component needs{" "}
                        <Code>&quot;use client&quot;</Code> and a{" "}
                        <Code>StoreProvider</Code> somewhere above it.
                    </p>
                </DocSection>

                <DocSection title="selector references" sectionSeverity="trap">
                    <CodeBlock code={SELECTOR_REFS} lang="ts" />
                    <p>
                        <Term>
                            <Code>useSelector</Code> re-renders when the selected
                            value&apos;s REFERENCE changes.
                        </Term>{" "}
                        The result of the previous run is compared with the new one; for
                        primitives that is a value check, for objects and arrays it is
                        identity.
                    </p>
                    <p>
                        <Term>
                            Returning a NEW object each call means &quot;always
                            changed&quot;.
                        </Term>{" "}
                        The <Code>BAD</Code> selector builds a fresh{" "}
                        <Code>{"{ user, cart }"}</Code> literal every time it runs, so
                        the comparison fails after every dispatch — including dispatches
                        to slices this component never reads. It quietly gives up exactly
                        the partial subscription you chose Redux for.
                    </p>
                    <p>
                        <Term>Select the smallest piece you need.</Term> Two narrow
                        selectors beat one wide one: <Code>s =&gt; s.user</Code> and{" "}
                        <Code>s =&gt; s.cart</Code> each return a stable reference until
                        that slice actually changes.
                    </p>
                    <p>
                        <Term>
                            For DERIVED data, memoize with <Code>createSelector</Code>.
                        </Term>{" "}
                        When the value has to be computed — a filtered list, a total —
                        it is new by nature. RTK&apos;s <Code>createSelector</Code>{" "}
                        caches the result and recomputes only when its inputs change, so
                        the reference stays stable in between.
                    </p>

                    <Callout severity="trap" label="trap · new selector references">
                        <p>
                            A selector that returns a new object/array each call
                            re-renders the component on every dispatch. Select the
                            smallest piece you need, or use <Code>createSelector</Code>{" "}
                            for derived values.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 5">Async</PartHeading>
            <div>
                <DocSection title="createAsyncThunk">
                    <CodeBlock code={ASYNC_THUNK} lang="ts" />
                    <p>
                        <Term>Reducers must be synchronous and pure.</Term> Given the
                        same state and action they must produce the same next state,
                        with no fetching, no timers, no randomness. That is what makes
                        the DevTools log replayable — so the async has to live somewhere
                        else.
                    </p>
                    <p>
                        <Term>
                            <Code>createAsyncThunk</Code> wraps an async function and
                            auto-dispatches three actions.
                        </Term>{" "}
                        <Code>pending</Code> when it starts, <Code>fulfilled</Code> with
                        the resolved value as <Code>action.payload</Code>, or{" "}
                        <Code>rejected</Code> with the error when it throws. You write
                        one <Code>async</Code> function; you get the lifecycle.
                    </p>
                    <p>
                        <Term>
                            Handle them in <Code>extraReducers</Code>.
                        </Term>{" "}
                        The <Code>reducers</Code> field is for actions the slice OWNS;{" "}
                        <Code>extraReducers</Code> is for actions defined outside it —
                        which is exactly what a thunk&apos;s three actions are. The{" "}
                        <Code>builder</Code> chains one <Code>addCase</Code> per action,
                        and several thunks can chain in the same builder.
                    </p>
                    <p>
                        <Term>Loading and error state come for free.</Term>{" "}
                        <Code>loading</Code> and <Code>error</Code> live in the slice and
                        are set by the pending/rejected cases, so any component can
                        select them — no per-component <Code>useState</Code> flags.
                    </p>

                    <CodeBlock code={DISPATCH_THUNK} lang="ts" />
                    <p>
                        <Term>Dispatch a thunk like any other action.</Term> The
                        argument you pass (<Code>&quot;42&quot;</Code>) is the
                        function&apos;s parameter; a thunk that takes none is called
                        with nothing. Typed <Code>useAppDispatch</Code> is what lets
                        dispatch accept a thunk rather than only a plain object.
                    </p>
                </DocSection>

                <DocSection title="async in next.js" sectionSeverity="next">
                    <CodeBlock code={SERVER_FETCH} lang="tsx" />
                    <p>
                        <Term>
                            Prefer fetching INITIAL data in a Server Component.
                        </Term>{" "}
                        It runs during the request, before any HTML is sent, and the
                        data arrives already rendered. No thunk, no{" "}
                        <Code>loading</Code> flag, no empty-then-filled flash — and the
                        fetch never ships to the browser.
                    </p>
                    <p>
                        <Term>Reserve thunks for CLIENT-side async.</Term> Work
                        triggered by a user action, live updates, polling, anything that
                        must happen in the browser after hydration. That is async the
                        server genuinely cannot do for you.
                    </p>
                    <p>
                        <Term>The two compose.</Term> Fetch on the server, pass the
                        result down as props, and let the client slice take over from
                        there for subsequent interaction — rather than routing
                        server-origin data through a client thunk on mount.
                    </p>
                    <p>
                        <Term>RTK Query exists for data fetching and caching.</Term> It
                        is RTK&apos;s own layer for server state — requests, caching,
                        invalidation, refetching — and it replaces most hand-written
                        thunks in apps that lean on it. A pointer only; beyond this
                        refresh.
                    </p>

                    <Callout severity="next" label="react ⇄ next · fetch on the server">
                        <p>
                            Don&apos;t route server-origin initial data through a client
                            thunk. Fetch it in a Server Component and pass props; reserve
                            thunks for client-triggered async.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Redux core is framework-agnostic — the store, slices, selectors and
                    thunks are identical wherever you run them. Nothing in this page&apos;s
                    Parts 1, 3 and 4 changes because the app is Next.js.
                </p>
                <p>
                    Three things do. The <Code>Provider</Code> and the hooks are
                    client-only, so the store mounts through a{" "}
                    <Code>&quot;use client&quot;</Code> StoreProvider inside a server
                    layout. The store must be created PER REQUEST on the server — a
                    module-level singleton is shared across every request and leaks one
                    user&apos;s state into another&apos;s response. And initial data
                    generally belongs in a Server Component fetch passed down as props,
                    not in a thunk dispatched on mount.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            how does Redux avoid re-rendering everything the way Context
                            does?
                        </>
                    }
                    a={
                        <>
                            &ldquo;<Code>useSelector</Code> gives{" "}
                            <Term>partial subscription</Term> — a component re-renders
                            only when the specific slice it selects changes, not on every
                            store update.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>why is mutating state allowed inside a slice?</>}
                        a={
                            <>
                                &ldquo;RTK uses <Term>Immer</Term> to convert those
                                &lsquo;mutations&rsquo; into safe immutable updates — but
                                only inside <Code>createSlice</Code> reducers.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
