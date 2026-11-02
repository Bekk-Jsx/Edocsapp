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
    // --- part 1 (Why setup()) ---
    // inline `main vs setup · same tools, different grouping`
    "grouping-code-by-feature": ["difference"],

    // --- part 2 (setup() basics) ---
    // inline `note · created and beforeCreate`
    "returned-bindings": ["note"],

    // --- part 3 (Lifecycle hooks in setup()) ---
    // inline `trap · register hooks synchronously` +
    // `note · watchers stop themselves`
    "lifecycle-hook-functions": ["trap", "note"],

    // --- part 4 (props and context) ---
    // inline `trap · don't destructure props in setup()`
    "the-props-argument": ["trap"],
    // "the-context-argument" carries no callout, so no entry.
};

// Top-level divider between the four parts of the page — mirrors the groups in
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
//    offending code, prefixed with ❌.
// 4. Every fragment declares its language: ts, vue or text.
// 5. Differences are inline Callouts with severity "difference" and one of two
//    label prefixes: "main vs setup · …" or "vue 2 → 3 · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — why setup()
// ===================================================================

const OPTIONS_SPLIT = `export default defineComponent({
  data() {
    return {
      count: 0,            // counter
      query: '',           // search
      users: [] as User[], // search
    }
  },
  computed: {
    double(): number { return this.count * 2 },                   // counter
    filtered(): User[] { return this.users.filter(/* query */) }, // search
  },
  watch: {
    query(q: string) { /* save to localStorage */ },              // search
  },
  methods: {
    increment() { this.count++ },                                 // counter
  },
})`;

const SETUP_GROUPED = `import { computed, defineComponent, ref, watch } from 'vue'

export default defineComponent({
  setup() {
    // counter
    const count = ref(0)
    const double = computed(() => count.value * 2)
    function increment() {
      count.value++
    }

    // search
    const query = ref('')
    const users = ref<User[]>([])
    const filtered = computed(() =>
      users.value.filter((u) => u.name.toLowerCase().includes(query.value.toLowerCase())),
    )
    watch(query, (q) => localStorage.setItem('query', q))

    return { count, double, increment, query, filtered }
  },
})`;

// ===================================================================
// part 2 — setup() basics
// ===================================================================

const NOT_RETURNED = `setup() {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  return { count }
  // ❌ the template's {{ double }} is not available
},`;

const NO_THIS = `function increment() {
  this.count++ // ❌ there is no this in setup()
}`;

// ===================================================================
// part 3 — lifecycle hooks in setup()
// ===================================================================

const LIFECYCLE_FUNCTIONS = `import { onMounted, onUnmounted, ref } from 'vue'

setup() {
  const width = ref(window.innerWidth)
  function update() {
    width.value = window.innerWidth
  }
  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width }
}`;

const HOOK_AFTER_AWAIT = `async setup() {
  await loadConfig()
  onMounted(() => { /* … */ })
  // ❌ no active component instance
}`;

// ===================================================================
// part 4 — props and context
// ===================================================================

const SETUP_PROPS = `export default defineComponent({
  props: {
    step: { type: Number, required: true },
  },
  emits: {
    change: (value: number) => true,
  },
  setup(props, { emit }) {
    const count = ref(0)

    function increment() {
      count.value += props.step // props.step: number
      emit('change', count.value)
    }

    return { count, increment }
  },
})`;

const DESTRUCTURED_PROPS = `setup(props) {
  const { step } = props // ❌ a plain number, frozen at the first value
}`;

const SETUP_EXPOSE = `setup(props, { emit, expose }) {
  const count = ref(0)
  function increment() {
    count.value++
  }
  function reset() {
    count.value = 0
  }
  expose({ reset }) // a parent ref can call reset(), nothing else
  return { count, increment, reset }
}`;

export function SetupFunctionDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Code>setup()</Code> is a component option in which the
                    component&apos;s logic is written as plain code with{" "}
                    <Code>ref</Code>, <Code>computed</Code>, <Code>watch</Code> and
                    lifecycle functions. It lets code be{" "}
                    <Term>grouped by feature instead of by option type</Term>.
                </p>
                <p>
                    This page covers <Code>setup()</Code> inside{" "}
                    <Code>defineComponent</Code>. <Code>{"<script setup>"}</Code>,
                    covered on Script Setup Basics, is a shorter syntax that compiles
                    to this function.
                </p>
            </div>

            {/* ---------- part 1 — why setup() ---------- */}
            <PartHeading kicker="part 1">Why setup()</PartHeading>
            <div>
                <DocSection title="Grouping code by feature">
                    <p>
                        The Options API groups code by option type. A component with
                        two features — a counter and a user search — splits each feature
                        across <Code>data</Code>, <Code>computed</Code>,{" "}
                        <Code>watch</Code> and <Code>methods</Code>. Understanding one
                        feature means jumping between blocks, and in large components
                        many features are interleaved in every block. Reusing a feature
                        required mixins, with name clashes and unclear origins. The two
                        features in the Options API:
                    </p>
                    <CodeBlock code={OPTIONS_SPLIT} lang="ts" />
                    <p>
                        In <Code>setup()</Code> the same features are written as plain
                        code, each kept together:
                    </p>
                    <CodeBlock code={SETUP_GROUPED} lang="ts" />
                    <p>
                        Because a feature is a group of variables and functions, it can
                        be moved into its own function and reused — a composable (see
                        Writing Composables), the replacement for mixins.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Options API", "setup()"]}
                        rows={[
                            ["data", "ref / reactive"],
                            ["computed: { … }", "computed()"],
                            ["watch: { … }", "watch()"],
                            ["methods: { … }", "plain functions"],
                            ["this.x", "local variables (x.value for refs)"],
                        ]}
                    />

                    <Callout
                        severity="difference"
                        label="main vs setup · same tools, different grouping"
                    >
                        <p>
                            What each tool does is unchanged; only where the code lives
                            changes.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — setup() basics ---------- */}
            <PartHeading kicker="part 2">setup() basics</PartHeading>
            <div>
                <DocSection title="Returned bindings">
                    <p>
                        <Code>setup()</Code> runs once per component instance, before{" "}
                        <Code>created</Code>. Its return value decides what the template
                        can use; anything not returned stays private.
                    </p>
                    <p>
                        A binding used in the template but not returned is unknown to
                        the template:
                    </p>
                    <CodeBlock code={NOT_RETURNED} lang="ts" />
                    <p>
                        Refs returned from <Code>setup()</Code> are unwrapped in the
                        template — <Code>{"{{ count }}"}</Code>, not{" "}
                        <Code>{"{{ count.value }}"}</Code>. Inside <Code>setup()</Code>{" "}
                        the value is accessed with <Code>.value</Code>. There is no{" "}
                        <Code>this</Code> in <Code>setup()</Code>: every piece of state
                        is a local variable.
                    </p>
                    <CodeBlock code={NO_THIS} lang="ts" />
                    <p>
                        <Code>setup()</Code> can be combined with other options in the
                        same component, and bindings returned from <Code>setup()</Code>{" "}
                        are available to them through <Code>this</Code>. New code usually
                        keeps all logic in <Code>setup()</Code>.
                    </p>

                    <Callout severity="note" label="note · created and beforeCreate">
                        <p>
                            <Code>setup()</Code> itself runs at that point of the
                            lifecycle; code placed there replaces both hooks.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — lifecycle hooks in setup() ---------- */}
            <PartHeading kicker="part 3">Lifecycle hooks in setup()</PartHeading>
            <div>
                <DocSection title="Lifecycle hook functions">
                    <p>
                        Many features need the lifecycle, such as adding a window
                        listener on mount and removing it on unmount. With the{" "}
                        <Code>mounted</Code> and <Code>unmounted</Code> options, the
                        feature is split again between <Code>setup()</Code> and the
                        options.
                    </p>
                    <p>
                        Every hook has a function form called inside{" "}
                        <Code>setup()</Code>, next to the feature:
                    </p>
                    <CodeBlock code={LIFECYCLE_FUNCTIONS} lang="ts" />
                    <p>
                        <Code>onMounted(fn)</Code> registers <Code>fn</Code> on the
                        component whose <Code>setup()</Code> is running; Vue calls it at
                        the matching moment. A hook can be registered several times, once
                        per feature; all registrations run in order.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Option", "In setup()"]}
                        rows={[
                            ["beforeCreate, created", "code directly in setup()"],
                            ["beforeMount / mounted", "onBeforeMount / onMounted"],
                            ["beforeUpdate / updated", "onBeforeUpdate / onUpdated"],
                            [
                                "beforeUnmount / unmounted",
                                "onBeforeUnmount / onUnmounted",
                            ],
                            ["activated / deactivated", "onActivated / onDeactivated"],
                            ["errorCaptured", "onErrorCaptured"],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · register hooks synchronously"
                    >
                        <p>
                            Hooks are tied to the component whose <Code>setup()</Code>{" "}
                            is currently running. After an <Code>await</Code> or inside a
                            timer that link is gone and Vue warns: &quot;onMounted is
                            called when there is no active component instance&quot;.
                            Register all hooks before the first <Code>await</Code>.
                        </p>
                    </Callout>

                    <p>
                        A hook registered after an <Code>await</Code>:
                    </p>
                    <CodeBlock code={HOOK_AFTER_AWAIT} lang="ts" />

                    <Callout severity="note" label="note · watchers stop themselves">
                        <p>
                            <Code>watch()</Code> and <Code>watchEffect()</Code> created in{" "}
                            <Code>setup()</Code> stop automatically on unmount.{" "}
                            <Code>onUnmounted</Code> is needed only for resources Vue does
                            not manage: DOM listeners, timers, sockets.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — props and context ---------- */}
            <PartHeading kicker="part 4">props and context</PartHeading>
            <div>
                <DocSection title="The props argument">
                    <p>
                        Without <Code>this</Code>, props cannot be read as{" "}
                        <Code>this.step</Code>.
                    </p>
                    <p>
                        <Code>setup()</Code> receives the props as its first argument: a
                        reactive object typed from the <Code>props</Code> option:
                    </p>
                    <CodeBlock code={SETUP_PROPS} lang="ts" />
                    <p>
                        <Code>props</Code> is reactive as an object. Destructuring copies
                        the current values once, so later changes from the parent are
                        lost:
                    </p>
                    <CodeBlock code={DESTRUCTURED_PROPS} lang="ts" />
                    <p>
                        Read <Code>props.step</Code> where the value is needed.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · don't destructure props in setup()"
                    >
                        <p>
                            Destructured props stop following the parent. In{" "}
                            <Code>{"<script setup>"}</Code> since Vue 3.5, destructuring{" "}
                            <Code>defineProps</Code> keeps reactivity (see Compiler
                            Macros).
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="The context argument">
                    <p>
                        The second argument holds what the Options API reached through{" "}
                        <Code>this</Code>.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["context.", "Options API equivalent"]}
                        rows={[
                            ["emit", "this.$emit, typed from emits"],
                            ["attrs", "this.$attrs"],
                            ["slots", "this.$slots"],
                            ["expose", "— (new)"],
                        ]}
                    />
                    <p>
                        Usually only the needed members are destructured:{" "}
                        <Code>{"setup(props, { emit })"}</Code>.
                    </p>
                    <p>
                        A parent holding a template ref on the component can access
                        everything returned from <Code>setup()</Code>, so every internal
                        function becomes public API.
                    </p>
                    <p>
                        <Code>expose</Code> limits the public API to the listed members:
                    </p>
                    <CodeBlock code={SETUP_EXPOSE} lang="ts" />
                </DocSection>
            </div>
        </>
    );
}
