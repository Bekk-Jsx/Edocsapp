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
    // --- part 1 (Stores as setup functions) ---
    // inline `trap · no $reset in setup stores`
    "stores-written-like-script-setup": ["trap"],
    // inline `main vs setup · the same mapping twice`
    "option-or-setup-store": ["difference"],

    // --- part 2 (storeToRefs) ---
    // inline `trap · storeToRefs skips actions` + `vue 2 → 3 · mapState and mapGetters`
    "destructuring-a-store": ["trap", "difference"],

    // --- part 3 (Stores using stores) ---
    // inline `note · no root state`
    "stores-using-stores": ["note"],
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

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. Every fragment declares its language: ts or vue. Component examples use
//    <script setup lang="ts">.
// 4. Differences are inline Callouts with severity "difference" and one of two
//    label prefixes: "vue 2 → 3 · …" or "main vs setup · …".
// 5. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — stores as setup functions
// ===================================================================

const SETUP_STORE = `import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { User } from '@/types/user'

export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(loadUser())

  const isLoggedIn = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const displayName = computed(() => user.value?.name ?? 'guest')

  function login(name: string, role: User['role'] = 'user') {
    user.value = { id: 1, name, role }
  }

  function logout() {
    user.value = null
  }

  watch(user, (value) => {
    if (value) localStorage.setItem('user', JSON.stringify(value))
    else localStorage.removeItem('user')
  })

  return { user, isLoggedIn, isAdmin, displayName, login, logout }
})`;

// ===================================================================
// part 2 — storeToRefs
// ===================================================================

const DESTRUCTURE_BROKEN = `const { user, isLoggedIn } = useSessionStore()
// ❌ plain values, frozen at this moment`;

const STORE_TO_REFS = `<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()
const { user, isLoggedIn } = storeToRefs(session)
const { login, logout } = session
</script>

<template>
  <p v-if="isLoggedIn">{{ user?.name }}</p>
  <button @click="login('Ada')">Log in</button>
</template>`;

// ===================================================================
// part 3 — stores using stores
// ===================================================================

const CART_STORE = `export const useCartStore = defineStore('cart', () => {
  const session = useSessionStore()
  const items = ref<string[]>([])

  const canCheckout = computed(() => session.isLoggedIn && items.value.length > 0)

  function checkout() {
    if (!canCheckout.value) return
    items.value = []
  }

  return { items, canCheckout, checkout }
})`;

export function SetupStoresDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A store can be defined with an options object or with a{" "}
                    <Term>setup function</Term>. The setup form is written like{" "}
                    <Code>{"<script setup>"}</Code> and can hold anything a component
                    can: watchers, composables, private helpers.
                </p>
                <p>
                    This page covers the setup syntax, choosing between the two forms,
                    destructuring a store with <Code>storeToRefs</Code>, and stores
                    that use other stores.
                </p>
            </div>

            {/* ---------- part 1 — stores as setup functions ---------- */}
            <PartHeading kicker="part 1">Stores as setup functions</PartHeading>
            <div>
                <DocSection title="Stores written like <script setup>">
                    <p>
                        Option stores split one feature across <Code>state</Code>,{" "}
                        <Code>getters</Code> and <Code>actions</Code>, and anything that
                        is none of the three has no place — a watcher, a composable
                        call, a private helper. Persisting the session is the typical
                        case: in an option store the <Code>localStorage</Code> write
                        must be repeated in every action that changes the user.
                    </p>
                    <p>
                        <Code>defineStore</Code> also accepts a function instead of an
                        options object. Inside it, state is a ref, getters are{" "}
                        <Code>computed</Code>, actions are functions, and the returned
                        object is the store&apos;s public surface:
                    </p>
                    <CodeBlock code={SETUP_STORE} lang="ts" />
                    <p>
                        Everything not returned stays private, which an option store
                        cannot express. Returned refs are unwrapped on the store object
                        — <Code>session.user</Code>, never{" "}
                        <Code>session.user.value</Code> — exactly like refs returned
                        from <Code>setup()</Code>. The watcher lives in the store, so
                        persistence is written once for every change instead of in each
                        action.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Option store", "Setup store"]}
                        rows={[
                            ["state: () => ({ user })", "const user = ref(…)"],
                            ["getters", "computed()"],
                            ["actions", "plain functions"],
                            ["—", "watch, watchEffect, composables, private helpers"],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · no $reset in setup stores"
                    >
                        <p>
                            Pinia cannot know the initial values of a setup store, so{" "}
                            <Code>$reset()</Code> throws. Define and return one:{" "}
                            <Code>{"function $reset() { user.value = null }"}</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Option or setup store">
                    <p>
                        Both forms are fully supported; the choice is one of style and
                        capability.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Option store", "Setup store"]}
                        rows={[
                            ["Feel", "like the Options API", "like <script setup>"],
                            ["$reset()", "provided", "written by hand"],
                            ["watch, composables inside", "no", "yes"],
                            [
                                "Private members",
                                "no, everything is public",
                                "yes, by not returning it",
                            ],
                            ["Circular store references", "tolerant", "may need care"],
                        ]}
                    />
                    <p>
                        In a codebase written with <Code>{"<script setup>"}</Code>,
                        setup stores keep the style consistent, and they are the only
                        option once a store needs a watcher or a composable.
                    </p>

                    <Callout
                        severity="difference"
                        label="main vs setup · the same mapping twice"
                    >
                        <p>
                            Option store is to setup store what the Options API is to{" "}
                            <Code>{"<script setup>"}</Code>: identical capabilities for
                            state and logic, different grouping — plus the freedom to
                            use any composition API inside.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — storeToRefs ---------- */}
            <PartHeading kicker="part 2">storeToRefs</PartHeading>
            <div>
                <DocSection title="Destructuring a store">
                    <p>
                        A store object is reactive, so destructuring it copies the
                        current values and the copies never update — the same rule as
                        destructuring a <Code>reactive</Code> object or props:
                    </p>
                    <CodeBlock code={DESTRUCTURE_BROKEN} lang="ts" />
                    <p>
                        <Code>storeToRefs</Code> converts state and getters into refs
                        that keep their connection to the store:
                    </p>
                    <CodeBlock code={STORE_TO_REFS} lang="vue" />
                    <p>
                        <Code>storeToRefs</Code> returns only state and getters, each as
                        a ref, which templates unwrap as usual. Actions are plain
                        functions that are already bound to the store, so they are
                        destructured from the store itself. Reading{" "}
                        <Code>session.user</Code> directly, without destructuring, is
                        always safe too.
                    </p>

                    <Callout severity="trap" label="trap · storeToRefs skips actions">
                        <p>
                            Actions are not in its result. Destructure them from the
                            store, or call them as <Code>session.login(…)</Code>.
                        </p>
                    </Callout>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · mapState and mapGetters"
                    >
                        <p>
                            The Vuex helpers are replaced by <Code>storeToRefs</Code> in
                            setup code. Pinia also ships <Code>mapState</Code> /{" "}
                            <Code>mapActions</Code> for Options API components.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — stores using stores ---------- */}
            <PartHeading kicker="part 3">Stores using stores</PartHeading>
            <div>
                <DocSection title="Stores using stores">
                    <p>
                        A cart store needs the signed-in user, and a notifications store
                        needs both. Vuex solved this with <Code>rootState</Code> and
                        namespaced paths.
                    </p>
                    <p>
                        A store calls another store&apos;s composable inside its own
                        body or actions, like any component would:
                    </p>
                    <CodeBlock code={CART_STORE} lang="ts" />
                    <p>
                        Because every store is a singleton per Pinia instance, both
                        stores see the same session state, and a getter reading another
                        store&apos;s state stays reactive through it. Calling the
                        composable inside an action instead of at the top of the setup
                        function also works and avoids problems when two stores
                        reference each other.
                    </p>

                    <Callout severity="note" label="note · no root state">
                        <p>
                            Pinia has no <Code>rootState</Code>,{" "}
                            <Code>rootGetters</Code> or namespace paths. Cross-store
                            access is an ordinary call, so the dependency is visible in
                            the code.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
