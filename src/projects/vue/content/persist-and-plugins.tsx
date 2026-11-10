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
    // --- part 1 (Persisting state) ---
    // inline `trap · localStorage is not available everywhere` + `tip · the ready-made plugin`
    "surviving-a-reload": ["trap", "tip"],

    // --- part 2 (Patching, subscribing, resetting) ---
    // "patch-and-subscribe" carries no callout, so it has no entry.
    // inline `trap · a forgotten field survives a reset`
    "resetting-state": ["trap"],

    // --- part 3 (Plugins) ---
    // inline `note · setup stores and custom options`
    "extending-every-store": ["note"],
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

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. Every fragment declares its language: ts or vue. Component examples use
//    <script setup lang="ts">.
// 4. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
//
// This page needs no GridTable and no comparison pair grid, so neither helper
// is copied in — an unused one would only be dead code.

// ===================================================================
// part 1 — persisting state
// ===================================================================

const PERSISTED_SESSION = `function loadUser(): User | null {
  const raw = localStorage.getItem('user')
  return raw ? (JSON.parse(raw) as User) : null
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(loadUser())

  watch(user, (value) => {
    if (value) localStorage.setItem('user', JSON.stringify(value))
    else localStorage.removeItem('user')
  })

  return { user }
})`;

// ===================================================================
// part 2 — patching, subscribing, resetting
// ===================================================================

const PATCH = `const session = useSessionStore()

session.$patch({ theme: 'light', lastSeen: Date.now() })

session.$patch((state) => {
  state.items.push('new')
  state.count = state.items.length
})`;

const SUBSCRIBE = `session.$subscribe((mutation, state) => {
  console.log(mutation.type, mutation.storeId)
  localStorage.setItem('session', JSON.stringify(state))
})`;

const ON_ACTION = `session.$onAction(({ name, args, after, onError }) => {
  after(() => console.log(\`\${name} finished\`, args))
  onError((error) => console.warn(\`\${name} failed\`, error))
})`;

const SETUP_RESET = `export const useCartStore = defineStore('cart', () => {
  const items = ref<string[]>([])

  function $reset() {
    items.value = []
  }

  return { items, $reset }
})`;

const STATE_REPLACE = `session.$state = { user: null }`;

// ===================================================================
// part 3 — plugins
// ===================================================================

const PERSIST_PLUGIN = `import { createPinia, type PiniaPluginContext } from 'pinia'

function persistPlugin({ store, options }: PiniaPluginContext) {
  if (!options.persist) return

  const saved = localStorage.getItem(store.$id)
  if (saved) store.$patch(JSON.parse(saved))

  store.$subscribe((_mutation, state) => {
    localStorage.setItem(store.$id, JSON.stringify(state))
  })
}

const pinia = createPinia()
pinia.use(persistPlugin)`;

const PERSIST_OPT_IN = `export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] as string[] }),
  persist: true,
})`;

const AUGMENT_OPTIONS = `declare module 'pinia' {
  interface DefineStoreOptionsBase<S, Store> {
    persist?: boolean
  }
}`;

export function PersistAndPluginsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Store state lives in memory, so a reload starts from nothing. Pinia
                    exposes the hooks needed to <Term>persist, observe, reset and
                    extend</Term> state.
                </p>
                <p>
                    This page covers persisting a store, <Code>$patch</Code> and{" "}
                    <Code>$subscribe</Code>, resetting, and plugins that add behavior to
                    every store at once.
                </p>
            </div>

            {/* ---------- part 1 — persisting state ---------- */}
            <PartHeading kicker="part 1">Persisting state</PartHeading>
            <div>
                <DocSection title="Surviving a reload">
                    <p>
                        A reload recreates every store from its initial state, so a
                        signed-in user, a chosen theme or a filled cart is gone.
                    </p>
                    <p>
                        Load from storage when the state is created, and write on every
                        change. In a setup store a single watcher covers every path that
                        changes the value:
                    </p>
                    <CodeBlock code={PERSISTED_SESSION} lang="ts" />
                    <p>
                        The load happens while the state is being created, so the first
                        render and the first navigation guard already see the restored
                        value (see Protected routes on Guards). A ref watcher is not
                        deep by default: it fires when the value is replaced, and
                        actions that replace <Code>user</Code> cover that. State changed
                        field by field needs <Code>{"{ deep: true }"}</Code> (see
                        Computed &amp; Watchers).
                    </p>
                    <p>
                        Storage holds strings, so values are serialized with JSON.
                        Anything JSON cannot represent — <Code>Date</Code>,{" "}
                        <Code>Map</Code>, <Code>Set</Code>, <Code>undefined</Code>,
                        functions — must be converted on both sides, and stored data
                        from an older version of the app may no longer match the current
                        type, which is why the parsed value is a claim, not a guarantee.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · localStorage is not available everywhere"
                    >
                        <p>
                            On a server there is no <Code>localStorage</Code>, so a
                            store that touches it directly breaks SSR (see SSR-Safe
                            Code). Guard the access or move it into a plugin that only
                            runs in the browser.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · the ready-made plugin">
                        <p>
                            <Code>pinia-plugin-persistedstate</Code> adds persistence to
                            any store through a <Code>persist</Code> option, with
                            configurable storage, picked paths and serializers — worth
                            preferring over hand-written persistence once more than one
                            store needs it.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — patching, subscribing, resetting ---------- */}
            <PartHeading kicker="part 2">
                Patching, subscribing, resetting
            </PartHeading>
            <div>
                <DocSection title="$patch and $subscribe">
                    <p>
                        Changing several fields one by one produces several separate
                        state changes, which is noisier in the timeline and triggers
                        subscribers more than once.
                    </p>
                    <p>
                        <Code>$patch</Code> applies several changes as one. The object
                        form merges fields; the function form receives the state and
                        suits arrays and conditional updates:
                    </p>
                    <CodeBlock code={PATCH} lang="ts" />
                    <p>
                        Reacting to any change of a store — for logging, analytics or
                        persistence — would otherwise mean watching every field.
                    </p>
                    <p>
                        <Code>$subscribe</Code> runs a callback after every state change
                        of that store:
                    </p>
                    <CodeBlock code={SUBSCRIBE} lang="ts" />
                    <p>
                        <Code>mutation.type</Code> says how the state changed — a direct
                        assignment, an object patch or a function patch — and{" "}
                        <Code>mutation.storeId</Code> names the store. Called inside a
                        component, the subscription is removed when that component
                        unmounts; <Code>{"{ detached: true }"}</Code> keeps it alive for
                        the app&apos;s lifetime. <Code>$onAction</Code> is the
                        equivalent for actions: it reports the action name and arguments
                        and can run code after a successful call or on an error:
                    </p>
                    <CodeBlock code={ON_ACTION} lang="ts" />
                </DocSection>

                <DocSection title="Resetting state">
                    <p>
                        Signing out, leaving a wizard or finishing a checkout should
                        return a store to its initial state, and assigning every field
                        by hand is easy to get wrong when a field is added later.
                    </p>
                    <p>
                        An option store provides <Code>$reset()</Code>, which re-runs
                        its state function. A setup store defines its own, because Pinia
                        does not know its initial values:
                    </p>
                    <CodeBlock code={SETUP_RESET} lang="ts" />
                    <p>
                        <Code>$state</Code> replaces the whole state object at once,
                        which is also how a server-rendered app hands its state to the
                        client (see Hydration):
                    </p>
                    <CodeBlock code={STATE_REPLACE} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · a forgotten field survives a reset"
                    >
                        <p>
                            A hand-written <Code>$reset</Code> must be updated when
                            state is added; otherwise old values stay behind after
                            signing out.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — plugins ---------- */}
            <PartHeading kicker="part 3">Plugins</PartHeading>
            <div>
                <DocSection title="Extending every store">
                    <p>
                        Cross-cutting behavior — persistence, logging, a shared API
                        client — written in each store is duplicated, and every new
                        store has to remember it.
                    </p>
                    <p>
                        A Pinia plugin is a function registered on the Pinia instance.
                        It runs once per store, receives that store and its options, and
                        what it returns is added to the store:
                    </p>
                    <CodeBlock code={PERSIST_PLUGIN} lang="ts" />
                    <p>
                        Stores opt in through a custom option, and the plugin reads it
                        from <Code>options</Code>:
                    </p>
                    <CodeBlock code={PERSIST_OPT_IN} lang="ts" />
                    <p>
                        <Code>store.$id</Code> is the store&apos;s id, which makes a
                        unique storage key. Returning an object from the plugin adds
                        properties to every store — a shared client, a timestamp — and
                        those additions are typed by augmenting Pinia&apos;s interfaces,
                        the same module augmentation used for <Code>RouteMeta</Code>{" "}
                        (see Guards):
                    </p>
                    <CodeBlock code={AUGMENT_OPTIONS} lang="ts" />

                    <Callout
                        severity="note"
                        label="note · setup stores and custom options"
                    >
                        <p>
                            A setup store passes such options in{" "}
                            <Code>defineStore</Code>&apos;s third argument:{" "}
                            <Code>
                                {"defineStore('cart', () => { … }, { persist: true })"}
                            </Code>
                            .
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
