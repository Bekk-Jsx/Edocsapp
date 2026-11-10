import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > difference > tip > note). It is NOT what flags a
// section header — that is the explicit `sectionSeverity` prop, and no section
// here is wholly one severity, so every callout below is inline only.
// Keys are slug(title) — the id DocSection gives the section.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Why a store library) ---
    // "what-a-reactive-module-cannot-do" and "using-a-store" carry no callout,
    // so they have no entry.

    // --- part 2 (Option stores) ---
    // "state-getters-and-actions" and "typing-a-store" carry no callout either.

    // --- part 3 (Stores outside components) ---
    // inline `trap · no store at module load`
    "stores-in-guards-and-modules": ["trap"],

    // --- part 4 (Pinia vs Vuex) ---
    // inline `vue 2 → 3 · Vuex → Pinia`
    "pinia-vs-vuex": ["difference"],
};

// Top-level divider between the parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in the typescript content files.
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

// The grid table the typescript pages use, copied unchanged.
// `cols` is a literal grid-template-columns utility so Tailwind sees it at build time.
function GridTable({
    cols,
    head,
    rows,
}: {
    cols: string;
    head: string[];
    rows: string[][];
}) {
    const cell = "px-3 py-2";
    const ruled = `${cell} border-b border-[var(--border)]`;
    return (
        <div
            className={`grid ${cols} overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[0.75rem]`}
        >
            {head.map((h) => (
                <div key={h} className={`${ruled} text-[var(--text)]`}>
                    {h}
                </div>
            ))}
            {rows.map((row, r) =>
                row.map((value, c) => (
                    <div
                        key={`${r}-${c}`}
                        // last row keeps the outer border as its only rule
                        className={`${r === rows.length - 1 ? cell : ruled} ${
                            c === 0 ? "text-[var(--accent)]" : "text-[var(--muted)]"
                        }`}
                    >
                        {value}
                    </div>
                )),
            )}
        </div>
    );
}

// Column grid for a side-by-side comparison — the same plain utility strings
// the app-instance and typescript pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. Every fragment declares its language: ts or vue. Component examples use
//    <script setup lang="ts">.
// 4. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 5. A comparison shows both codes side by side in the container-query pair
//    grid, and each column opens with a one-line <Term> label.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — why a store library
// ===================================================================

const CREATE_PINIA = `// main.ts
import { createPinia } from 'pinia'

createApp(App).use(createPinia()).use(router).mount('#app')`;

const COUNTER_STORE = `// src/stores/counter.ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment(step = 1) {
      this.count += step
    },
  },
})`;

const COUNTER_COMPONENT = `<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <p>count: {{ counter.count }} · double: {{ counter.double }}</p>
  <button @click="counter.increment()">+1</button>
  <button @click="counter.increment(5)">+5</button>
  <button @click="counter.count = 0">Reset</button>
</template>`;

const MODULE_COUNTER = `import { computed, ref } from 'vue'

export const count = ref(0)
export const double = computed(() => count.value * 2)

export function increment(step = 1): void {
  count.value += step
}`;

const PINIA_COUNTER = `export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: { double: (state) => state.count * 2 },
  actions: {
    increment(step = 1) {
      this.count += step
    },
  },
})`;

// ===================================================================
// part 2 — option stores
// ===================================================================

const CROSS_STORE_ACTION = `actions: {
  checkout() {
    const session = useSessionStore()
    if (!session.isLoggedIn) return
    this.submit()
  },
},`;

const STATE_UNTYPED = `state: () => ({
  user: null,  // ❌ type null — can never hold a user
  users: [],   // ❌ type never[]
}),`;

const STATE_ANNOTATED = `state: () => ({
  user: null as User | null,
  users: [] as User[],
  theme: 'dark' as 'dark' | 'light',
}),`;

const STATE_INTERFACE = `interface SessionState {
  user: User | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => ({
    user: null,
  }),
})`;

const GETTERS_ACTIONS = `getters: {
  isLoggedIn: (state) => state.user !== null,
  isAdmin: (state) => state.user?.role === 'admin',
  displayName(): string {
    return this.user?.name ?? 'guest'
  },
},
actions: {
  login(name: string, role: User['role'] = 'user') {
    this.user = { id: 1, name, role }
  },
  async loadUsers() {
    this.users = await fetchUsers()
  },
},`;

// ===================================================================
// part 3 — stores outside components
// ===================================================================

const STORE_AT_MODULE_LOAD = `const session = useSessionStore()
// ❌ getActivePinia() was called but there was no active Pinia
router.beforeEach((to) => { /* … */ })`;

const STORE_IN_GUARD = `router.beforeEach((to) => {
  const session = useSessionStore()

  if (to.meta.requiresAuth && !session.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.role && session.user?.role !== to.meta.role) {
    return { name: 'home' }
  }
})`;

// ===================================================================
// part 4 — pinia vs vuex
// ===================================================================

const VUEX_MUTATIONS = `mutations: {
  SET_USER(state, user) { state.user = user },
},
actions: {
  async login({ commit }, name) {
    commit('SET_USER', await api(name))
  },
},`;

const PINIA_ACTIONS = `actions: {
  async login(name: string) {
    this.user = await api(name)
  },
},`;

export function PiniaBasicsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A reactive module already provides shared state (see Refs &amp;
                    Reactive). <Term>Pinia</Term>, the official store library for Vue
                    3, adds what a module cannot: dev tooling, server-safe instances,
                    store-wide hooks and resettable state.
                </p>
                <p>
                    This page covers why that matters, option stores, typing them, and
                    the move from Vuex. Setup stores and <Code>storeToRefs</Code> follow
                    on Setup Stores.
                </p>
            </div>

            {/* ---------- part 1 — why a store library ---------- */}
            <PartHeading kicker="part 1">Why a store library</PartHeading>
            <div>
                <DocSection title="What a reactive module cannot do">
                    <p>
                        Exported refs in a module give shared, reactive, typed, even
                        persisted state, and for a single store that is often enough.
                        Four limits appear as an app grows.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Limit", "Consequence"]}
                        rows={[
                            [
                                "No dev tooling",
                                "State cannot be inspected, edited live or replayed as a timeline",
                            ],
                            [
                                "Module state is per process",
                                "On the server one instance is shared by all users, so one request's data leaks into another's render (see How SSR Works)",
                            ],
                            [
                                "No store-wide hooks",
                                "Nothing to subscribe to for logging, persistence or undo across stores",
                            ],
                            [
                                "State survives between tests",
                                "Every test has to reset the module by hand",
                            ],
                        ]}
                    />
                    <p>Pinia is installed as a plugin, like the router:</p>
                    <CodeBlock code={CREATE_PINIA} lang="ts" />
                    <p>
                        The Pinia instance owns the stores, and it belongs to the app —
                        so a server creates one per request instead of one per process.{" "}
                        <Code>defineStore</Code> returns a composable; the first call
                        creates the store, every later call anywhere returns the same
                        instance:
                    </p>
                    <CodeBlock code={COUNTER_STORE} lang="ts" />
                    <p>
                        The id (<Code>&apos;counter&apos;</Code>) identifies the store
                        in DevTools and in SSR serialization and must be unique. The
                        convention is one file per store,{" "}
                        <Code>stores/counter.ts</Code> exporting{" "}
                        <Code>useCounterStore</Code>.
                    </p>
                </DocSection>

                <DocSection title="Using a store">
                    <p>
                        A component calls the composable and reads state, getters and
                        actions straight off the returned store object:
                    </p>
                    <CodeBlock code={COUNTER_COMPONENT} lang="vue" />
                    <p>
                        The store object is reactive like a <Code>reactive</Code>{" "}
                        object, not a ref, so no <Code>.value</Code> is involved. State
                        can be assigned directly — Pinia has no mutations — though going
                        through an action gives the change a name in the DevTools
                        timeline. The same store in both forms:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Reactive module</Term>
                                </p>
                                <CodeBlock code={MODULE_COUNTER} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Pinia store</Term>
                                </p>
                                <CodeBlock code={PINIA_COUNTER} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Reactive module", "Pinia store"]}
                        rows={[
                            ["State", "ref / reactive at module level", "state: () => ({ … })"],
                            ["Derived values", "computed", "getters"],
                            ["Logic", "exported functions", "actions"],
                            ["Access", "named imports", "useCounterStore()"],
                            ["In script", "count.value", "store.count"],
                            [
                                "Created",
                                "at first import, once per process",
                                "at first use, per Pinia instance",
                            ],
                        ]}
                    />
                </DocSection>
            </div>

            {/* ---------- part 2 — option stores ---------- */}
            <PartHeading kicker="part 2">Option stores</PartHeading>
            <div>
                <DocSection title="state, getters and actions">
                    <p>The three options map onto component options.</p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Component option", "Store option", "Note"]}
                        rows={[
                            [
                                "data()",
                                "state: () => ({ … })",
                                "a function, so each Pinia instance gets its own state object",
                            ],
                            ["computed", "getters", "cached, like computed"],
                            ["methods", "actions", "may be async; this is the store"],
                        ]}
                    />
                    <p>
                        Actions can call other actions with <Code>this</Code>, and other
                        stores by calling their composable in the body. Option stores
                        also provide <Code>$reset()</Code>, which re-runs the state
                        function.
                    </p>
                    <CodeBlock code={CROSS_STORE_ACTION} lang="ts" />
                </DocSection>

                <DocSection title="Typing a store">
                    <p>
                        State infers from its initial value, so empty or{" "}
                        <Code>null</Code> fields infer uselessly — the same trap as{" "}
                        <Code>ref(null)</Code> and <Code>data()</Code> (see Refs &amp;
                        Reactive):
                    </p>
                    <CodeBlock code={STATE_UNTYPED} lang="ts" />
                    <p>Annotate in place:</p>
                    <CodeBlock code={STATE_ANNOTATED} lang="ts" />
                    <p>
                        Or declare an interface and annotate the state function&apos;s
                        return type, which scales better for larger stores:
                    </p>
                    <CodeBlock code={STATE_INTERFACE} lang="ts" />
                    <p>
                        Getters follow the rules from Single-File Components: an arrow
                        getter receiving <Code>state</Code> infers everything, while a
                        getter that uses <Code>this</Code> needs an explicit return
                        type, because <Code>this</Code> includes the getters themselves:
                    </p>
                    <CodeBlock code={GETTERS_ACTIONS} lang="ts" />
                </DocSection>
            </div>

            {/* ---------- part 3 — stores outside components ---------- */}
            <PartHeading kicker="part 3">Stores outside components</PartHeading>
            <div>
                <DocSection title="Stores in guards and modules">
                    <p>
                        A navigation guard needs the session store, but calling the
                        store composable at a module&apos;s top level fails: when the
                        module is evaluated, <Code>createPinia()</Code> has not run yet:
                    </p>
                    <CodeBlock code={STORE_AT_MODULE_LOAD} lang="ts" />
                    <p>
                        Call the composable inside the function that runs later, when
                        Pinia is installed:
                    </p>
                    <CodeBlock code={STORE_IN_GUARD} lang="ts" />
                    <p>
                        The rule applies anywhere outside a component: guards,
                        interceptors, helper modules. Inside components, calling it at
                        the top level of <Code>{"<script setup>"}</Code> is fine,
                        because Pinia is installed before any component renders.
                    </p>

                    <Callout severity="trap" label="trap · no store at module load">
                        <p>
                            <Code>useStore()</Code> at a module&apos;s top level runs
                            before the app is created. Move the call into the guard, the
                            handler or the function that needs it.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — pinia vs vuex ---------- */}
            <PartHeading kicker="part 4">Pinia vs Vuex</PartHeading>
            <div>
                <DocSection title="Pinia vs Vuex">
                    <p>
                        Pinia replaces Vuex for Vue 3, and three concepts disappear.
                    </p>
                    <p>
                        Mutations existed so DevTools could record named state changes.
                        Pinia records the action instead, so the layer lost its purpose:
                        actions mutate state directly.
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Vuex</Term>
                                </p>
                                <CodeBlock code={VUEX_MUTATIONS} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Pinia</Term>
                                </p>
                                <CodeBlock code={PINIA_ACTIONS} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        <Code>commit</Code> and <Code>dispatch</Code> are gone too:
                        stores expose methods, so calls are typed, autocompleted and
                        refactorable, where <Code>dispatch(&apos;login&apos;, name)</Code>{" "}
                        was a string. Namespaced modules are gone because every store is
                        already a module with its own file and id; cross-store access is
                        a call to the other store&apos;s composable, replacing{" "}
                        <Code>rootState</Code>, <Code>rootGetters</Code> and path
                        strings such as <Code>&apos;cart/items&apos;</Code>. Typing is
                        inferred from the store definition, where Vuex 4&apos;s types
                        were a known weak point.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Vuex", "Pinia"]}
                        rows={[
                            ["state", "state"],
                            ["getters", "getters"],
                            ["mutations", "— (actions mutate directly)"],
                            ["actions", "actions"],
                            ["commit('SET_X', v)", "store.x = v or an action"],
                            ["dispatch('login', n)", "store.login(n)"],
                            ["namespaced modules", "one store per file"],
                            ["mapState / mapGetters", "storeToRefs (see Setup Stores)"],
                        ]}
                    />

                    <Callout severity="difference" label="vue 2 → 3 · Vuex → Pinia">
                        <p>
                            Pinia is the official recommendation for Vue 3. Vuex 4 still
                            works and is maintained but gets no new features, and both
                            can run side by side during a gradual migration.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
