import { DocSection, Code, Callout } from "@/components/ui/doc-section";
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
    // --- part 1 (Reactive state outside components) ---
    // inline `vue 2 → 3 · Vue.observable → reactive`
    "reactive-state-outside-components": ["difference"],

    // --- part 2 (ref) ---
    // inline `tip · const for the box`
    "ref-and-value": ["tip"],
    // "unwrapping-in-templates" carries no callout, so no entry.

    // --- part 3 (reactive) ---
    // inline `note · deep by default`
    "always-go-through-the-proxy": ["note"],
    // inline `trap · Object.assign only adds and overwrites`
    "change-it-never-replace-it": ["trap"],

    // --- part 4 (Typing refs and reactive) ---
    // "typing-ref" carries no callout, so no entry.
    // inline `tip · no generic on reactive`
    "typing-reactive": ["tip"],

    // --- part 5 (ref or reactive) ---
    // "ref-or-reactive" carries no callout, so no entry.
};

// Top-level divider between the five parts of the page — mirrors the groups in
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
// 3. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed `// ❌ `.
// 4. Every fragment declares its language: vue, ts, css, json or js.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — reactive state outside components
// ===================================================================

const SESSION_STORE = `// src/stores/session.ts
import { reactive } from 'vue'
import type { User } from '@/types/user'

export const session = reactive({
  user: null as User | null,
})

export function login(name: string): void {
  session.user = { id: 1, name }
}`;

const SESSION_READER = `import { defineComponent } from 'vue'
import { session } from '@/stores/session'

export default defineComponent({
  computed: {
    name(): string {
      return session.user?.name ?? 'guest'
    },
  },
})`;

// ===================================================================
// part 2 — ref
// ===================================================================

const REACTIVE_PRIMITIVE = `const loginCount = reactive(0)
// ❌ number is not assignable to parameter of type 'object'`;

const REF_COUNT = `import { ref } from 'vue'

export const loginCount = ref(0)

loginCount.value++              // write
console.log(loginCount.value)   // read`;

const REF_AS_VALUE = `logins(): number {
  return loginCount
  // ❌ Ref<number> is not assignable to number
},`;

const TEMPLATE_UNWRAP = `<p>Count: {{ count }}</p>
<!-- count is a ref; the template reads count.value -->`;

// ===================================================================
// part 3 — reactive
// ===================================================================

const RAW_WRITE = `const raw = { user: null as User | null }
export const session = reactive(raw)

raw.user = { id: 1, name: 'Ada' }
// ❌ data changes, nothing re-renders — the write bypassed the proxy

session.user = { id: 1, name: 'Ada' }
// ✅ tracked`;

const REPLACE_REACTIVE = `export let session = reactive({ user: null as User | null })

export function loadSession(data: { user: User }): void {
  session = reactive(data)
  // ❌ components keep rendering the old state
}`;

const OBJECT_ASSIGN = `export const session = reactive({ user: null as User | null })

export function loadSession(data: { user: User }): void {
  Object.assign(session, data) // ✅ same as session.user = data.user
}`;

const REPLACE_REF = `export const session = ref<{ user: User | null }>({ user: null })

session.value = data // ✅ the box stays, its content is replaced`;

// ===================================================================
// part 4 — typing refs and reactive
// ===================================================================

const REF_INFERRED = `const user = ref(null)   // Ref<null>
user.value = { id: 1, name: 'Ada' }
// ❌ { id: number; name: string } is not assignable to null

const users = ref([])    // Ref<never[]>
users.value.push({ id: 1, name: 'Ada' })
// ❌ not assignable to never`;

const REF_GENERIC = `const user = ref<User | null>(null)  // Ref<User | null>
const users = ref<User[]>([])        // Ref<User[]>`;

const REF_NO_INITIAL = `const token = ref<string>()  // Ref<string | undefined>`;

const REF_PARAM = `import type { Ref } from 'vue'

function increment(counter: Ref<number>): void {
  counter.value++
}`;

const REACTIVE_INTERFACE = `interface SessionState {
  user: User | null
  theme: 'dark' | 'light'
}

const session: SessionState = reactive({
  user: null,
  theme: 'dark',
})`;

export function RefsAndReactiveDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Code>data()</Code> makes state reactive inside one component.{" "}
                    <Code>reactive()</Code> and <Code>ref()</Code> make state reactive
                    anywhere — in plain TypeScript modules, in setup code, in
                    composables and stores.
                </p>
                <p>
                    This page covers both APIs, the rules each one imposes, how to type
                    them, and when to use which.
                </p>
            </div>

            {/* ---------- part 1 — reactive state outside components ---------- */}
            <PartHeading kicker="part 1">Reactive state outside components</PartHeading>
            <div>
                <DocSection title="Reactive state outside components">
                    <p>
                        State in <Code>data()</Code> belongs to one component instance.
                        Two components that need the same state, such as the signed-in
                        user, each get their own copy, and keeping them in sync means
                        passing props through the tree or adding a store library.
                    </p>
                    <p>
                        <Code>reactive()</Code> turns a plain object into reactive state
                        in any module. Every component that reads it re-renders when it
                        changes:
                    </p>
                    <CodeBlock code={SESSION_STORE} lang="ts" />
                    <p>
                        Any Options API component can read it, for example through a
                        computed:
                    </p>
                    <CodeBlock code={SESSION_READER} lang="ts" />
                    <p>
                        <Code>reactive()</Code> wraps the object in a Proxy. While a
                        component renders, every property read through the proxy is
                        recorded as a dependency; a write through the proxy re-renders
                        exactly the components that read that property. If the object
                        were plain, the data would change but nothing would re-render.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · Vue.observable → reactive"
                    >
                        <p>
                            <Code>{"Vue.observable({...})"}</Code> becomes{" "}
                            <Code>{"reactive({...})"}</Code>. Vue 2 made the passed
                            object itself reactive; Vue 3 returns a new proxy and leaves
                            the original untouched, so the returned value must be used.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — ref ---------- */}
            <PartHeading kicker="part 2">ref</PartHeading>
            <div>
                <DocSection title="ref and .value">
                    <p>
                        A Proxy can only wrap objects, so <Code>reactive()</Code> cannot
                        hold a number, string or boolean:
                    </p>
                    <CodeBlock code={REACTIVE_PRIMITIVE} lang="ts" />
                    <p>
                        A reactive object also cannot be replaced as a whole — only its
                        fields can change (see &quot;Change it, never replace it&quot;).
                    </p>
                    <p>
                        <Code>ref()</Code> wraps any value in a box. The value is read
                        and written through <Code>.value</Code>, and it can be replaced
                        completely at any time:
                    </p>
                    <CodeBlock code={REF_COUNT} lang="ts" />
                    <p>
                        A ref is an object whose <Code>value</Code> property has a getter
                        and a setter. The getter records the dependency and the setter
                        triggers updates. Script code must therefore always use{" "}
                        <Code>.value</Code>; the getter is the only place Vue can
                        observe the read. Object values are made deeply reactive with{" "}
                        <Code>reactive()</Code> internally.
                    </p>

                    <Callout severity="tip" label="tip · const for the box">
                        <p>
                            Declare refs (and reactive objects) with <Code>const</Code>.
                            Components track the box they read; reassigning the variable
                            to a new ref leaves them tracking the old box. Change the
                            content through <Code>.value</Code>, never the variable.
                        </p>
                    </Callout>

                    <p>
                        Using the ref where its value is expected is a type error,
                        because the ref is the box, not the value:
                    </p>
                    <CodeBlock code={REF_AS_VALUE} lang="ts" />
                </DocSection>

                <DocSection title="Unwrapping in templates">
                    <p>
                        Templates unwrap top-level refs automatically, so{" "}
                        <Code>{"{{ count }}"}</Code> renders the value without{" "}
                        <Code>.value</Code>. This applies to refs exposed from{" "}
                        <Code>setup()</Code>, covered in Script Setup. In script code —
                        including Options API <Code>computed</Code> and{" "}
                        <Code>methods</Code> — <Code>.value</Code> is always required.
                    </p>
                    <p>In a template, a ref reads like a plain value:</p>
                    <CodeBlock code={TEMPLATE_UNWRAP} lang="vue" />
                </DocSection>
            </div>

            {/* ---------- part 3 — reactive ---------- */}
            <PartHeading kicker="part 3">reactive</PartHeading>
            <div>
                <DocSection title="Always go through the proxy">
                    <p>
                        <Code>reactive()</Code> suits a group of related fields — it
                        reads like a plain object, without <Code>.value</Code>. In
                        exchange it only works through its proxy.
                    </p>
                    <p>
                        Writes made to the original object bypass the proxy and are not
                        tracked:
                    </p>
                    <CodeBlock code={RAW_WRITE} lang="ts" />
                    <p>
                        Keep no reference to the raw object; write{" "}
                        <Code>{"reactive({ … })"}</Code> inline.
                    </p>

                    <Callout severity="note" label="note · deep by default">
                        <p>
                            Nested objects are reactive too —{" "}
                            <Code>session.user.name = &apos;Bob&apos;</Code> is tracked.
                            Nested proxies are created lazily on first access.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Change it, never replace it">
                    <p>
                        When a complete new state arrives, for example an API response
                        or a reset, assigning a new reactive object to the variable does
                        not update anything:
                    </p>
                    <CodeBlock code={REPLACE_REACTIVE} lang="ts" />
                    <p>
                        Vue does not watch variables; it watches property reads and
                        writes on a proxy. Components recorded reads on the first proxy.
                        Pointing the variable at a second proxy writes nothing to the
                        first, so nothing is triggered. With <Code>const</Code> the
                        reassignment is a compile error, which is why reactive objects
                        are always <Code>const</Code>.
                    </p>
                    <p>
                        Write the new values into the existing proxy.{" "}
                        <Code>Object.assign</Code> sets each property through the proxy,
                        so every write is tracked:
                    </p>
                    <CodeBlock code={OBJECT_ASSIGN} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · Object.assign only adds and overwrites"
                    >
                        <p>
                            Keys missing from the new data keep their old values. Reset
                            such fields explicitly.
                        </p>
                    </Callout>

                    <p>
                        When the whole value genuinely needs replacing, a ref is the
                        right tool:
                    </p>
                    <CodeBlock code={REPLACE_REF} lang="ts" />
                </DocSection>
            </div>

            {/* ---------- part 4 — typing refs and reactive ---------- */}
            <PartHeading kicker="part 4">Typing refs and reactive</PartHeading>
            <div>
                <DocSection title="Typing ref">
                    <p>
                        <Code>ref</Code> infers its type from the initial value, which
                        is often too narrow:
                    </p>
                    <CodeBlock code={REF_INFERRED} lang="ts" />
                    <p>Pass the type as a generic:</p>
                    <CodeBlock code={REF_GENERIC} lang="ts" />
                    <p>
                        Without an initial value, <Code>undefined</Code> is added to the
                        type:
                    </p>
                    <CodeBlock code={REF_NO_INITIAL} lang="ts" />
                    <p>
                        Functions that receive a ref type the parameter with{" "}
                        <Code>Ref</Code>:
                    </p>
                    <CodeBlock code={REF_PARAM} lang="ts" />
                </DocSection>

                <DocSection title="Typing reactive">
                    <p>
                        Describe the state with an interface and annotate the variable:
                    </p>
                    <CodeBlock code={REACTIVE_INTERFACE} lang="ts" />

                    <Callout severity="tip" label="tip · no generic on reactive">
                        <p>
                            Avoid <Code>{"reactive<SessionState>(…)"}</Code>.{" "}
                            <Code>reactive</Code> unwraps refs nested inside it, so its
                            return type can differ from the generic argument. Annotating
                            the variable checks the object against the interface without
                            that mismatch.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — ref or reactive ---------- */}
            <PartHeading kicker="part 5">ref or reactive</PartHeading>
            <div>
                <DocSection title="ref or reactive">
                    <p>
                        The two APIs overlap. Without a rule, code mixes them
                        arbitrarily and runs into each one&apos;s limits in different
                        places.
                    </p>
                    <p>
                        Use <Code>ref</Code> by default — the Vue docs recommend it as
                        the primary API. Use <Code>reactive</Code> for a group of related
                        fields that are only changed field by field and never replaced,
                        such as form state or grouped module state.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "ref", "reactive"]}
                        rows={[
                            ["Primitives", "yes", "no, objects only"],
                            [
                                "Replace the whole value",
                                "yes, x.value = …",
                                "no, change fields only",
                            ],
                            [
                                "Destructure without losing reactivity",
                                "yes, it is one box",
                                "no, destructured fields lose reactivity",
                            ],
                            ["Syntax in script", ".value everywhere", "plain obj.field"],
                            [
                                "Best fit",
                                "almost everything",
                                "form state, grouped module state",
                            ],
                        ]}
                    />
                    <p>
                        <Code>ref</Code>&apos;s only cost is <Code>.value</Code>, and a
                        missing <Code>.value</Code> is usually a type error.{" "}
                        <Code>reactive</Code>&apos;s costs — no primitives, no
                        replacement, broken destructuring — show up as silent bugs at
                        runtime.
                    </p>
                </DocSection>
            </div>
        </>
    );
}
