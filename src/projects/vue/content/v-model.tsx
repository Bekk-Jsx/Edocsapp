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
    // --- part 1 (v-model on components) ---
    // inline `vue 2 → 3 · new names` + `trap · migrated components break silently`
    "the-modelvalue-contract": ["difference", "trap"],
    // "why-the-contract-matters" carries no callout, so no entry.

    // --- part 2 (Multiple v-models) ---
    // inline `vue 2 → 3 · .sync is removed`
    "v-model-arguments": ["difference"],

    // --- part 3 (Forwarding v-model to inner inputs) ---
    // inline `trap · objects: emit a copy, never mutate` +
    // `tip · defineModel in script setup`
    "writable-computed-for-inner-inputs": ["trap", "tip"],
};

// Top-level divider between the three parts of the page — mirrors the groups in
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
// 4. Every fragment declares its language: vue, ts or text.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. A comparison shows both codes side by side in the container-query pair
//    grid, and each column opens with a one-line <Term> label.
// 7. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — v-model on components
// ===================================================================

const MANUAL_BINDING = `<SearchBox :value="query" @input="query = $event" />`;

const V_MODEL_USE = `<SearchBox v-model="query" />`;

const CONTRACT_FLOW = `parent query  ──▶  child prop modelValue                    (read)
child emits update:modelValue('abc')  ──▶  parent query = 'abc'   (write)`;

const SEARCH_BOX = `<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SearchBox',
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  emits: {
    'update:modelValue': (value: string) => true,
  },
  methods: {
    onInput(event: Event) {
      this.$emit('update:modelValue', (event.target as HTMLInputElement).value)
    },
  },
})
</script>

<template>
  <input :value="modelValue" @input="onInput" />
</template>`;

const SETTER_PROP_USE = `<SearchBox :model-value="query" :set-model-value="(v: string) => (query = v)" />`;

const SETTER_PROP_DECL = `props: {
  setModelValue: {
    type: Function as PropType<(value: string) => void>,
    required: true,
  },
},`;

const SHARED_CONTRACT = `<input v-model="form.name" />
<SearchBox v-model="form.query" />
<DatePicker v-model="form.birthday" />
<RichEditor v-model="form.bio" />`;

const NESTED_PATHS = `<SearchBox v-model="form.address.city" />
<SearchBox v-model="items[i].qty" />`;

// ===================================================================
// part 2 — multiple v-models
// ===================================================================

const NAMED_MODELS_USE = `<UserForm v-model:first-name="first" v-model:last-name="last" />`;

const NAMED_MODELS_DECL = `props: {
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
},
emits: {
  'update:firstName': (value: string) => true,
  'update:lastName': (value: string) => true,
},`;

// ===================================================================
// part 3 — forwarding v-model to inner inputs
// ===================================================================

const PROP_V_MODEL = `<input v-model="firstName" />
<!-- ❌ Cannot assign to 'firstName' because it is a read-only property -->`;

const WRITABLE_COMPUTED = `computed: {
  first: {
    get(): string {
      return this.firstName
    },
    set(value: string) {
      this.$emit('update:firstName', value)
    },
  },
},`;

const COMPUTED_V_MODEL = `<input v-model="first" />`;

const WIRED_BY_HAND = `<input :value="firstName" @input="onFirst" />
<!-- plus an onFirst method that emits -->`;

const WRITABLE_FORM = `<input v-model="first" />
<!-- plus a computed first with get/set -->`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings the typescript pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function VModelDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Code>v-model</Code> gives components the same two-way binding
                    native inputs have. It is{" "}
                    <Term>a contract of one prop and one event</Term>; any component
                    that implements it can be bound with <Code>v-model</Code>.
                </p>
                <p>
                    This page covers the contract, why it matters, binding several
                    values with arguments, and forwarding a binding to an inner input.
                    The <Code>{"<script setup>"}</Code> shorthand{" "}
                    <Code>defineModel</Code> is covered on Compiler Macros.
                </p>
            </div>

            {/* ---------- part 1 — v-model on components ---------- */}
            <PartHeading kicker="part 1">v-model on components</PartHeading>
            <div>
                <DocSection title="The modelValue contract">
                    <p>
                        A component that edits a value owned by its parent — a search
                        box around an <Code>{"<input>"}</Code> — needs a prop to read
                        the value and an event to request a change. Without a
                        convention, every use repeats both bindings, and every
                        component picks its own names:
                    </p>
                    <CodeBlock code={MANUAL_BINDING} lang="vue" />
                    <p>
                        <Code>v-model</Code> on a component replaces both bindings:
                    </p>
                    <CodeBlock code={V_MODEL_USE} lang="vue" />
                    <p>
                        <Code>v-model</Code> is a naming contract. The parent puts its
                        own variable into <Code>v-model</Code>; the child uses exactly
                        two names: the prop <Code>modelValue</Code>, which receives the
                        parent&apos;s variable, and the event{" "}
                        <Code>update:modelValue</Code>, whose payload is assigned to
                        that variable. The child never knows the parent&apos;s variable
                        name, so the same component works with{" "}
                        <Code>v-model=&quot;query&quot;</Code>,{" "}
                        <Code>v-model=&quot;filter&quot;</Code> or{" "}
                        <Code>v-model=&quot;form.name&quot;</Code>:
                    </p>
                    <CodeBlock code={CONTRACT_FLOW} lang="text" />
                    <p>A complete child component:</p>
                    <CodeBlock code={SEARCH_BOX} lang="vue" />
                    <p>
                        <Code>modelValue</Code> and <Code>update:modelValue</Code> are
                        the fixed names for <Code>v-model</Code> without an argument;
                        they cannot be renamed, but an argument selects other names
                        (Multiple v-models). They are ordinary prop and event names,
                        required only when the component supports{" "}
                        <Code>v-model</Code>. Other props are passed normally next to{" "}
                        <Code>v-model</Code>:{" "}
                        <Code>
                            {'<SearchBox v-model="query" placeholder="Find user" />'}
                        </Code>
                        .
                    </p>

                    <Callout severity="difference" label="vue 2 → 3 · new names">
                        <p>
                            Prop <Code>value</Code> → <Code>modelValue</Code>, event{" "}
                            <Code>input</Code> → <Code>update:modelValue</Code>. The{" "}
                            <Code>model</Code> option that renamed the pair is removed;
                            use <Code>v-model</Code> arguments.
                        </p>
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · migrated components break silently"
                    >
                        <p>
                            A component still using the <Code>value</Code> prop and the{" "}
                            <Code>input</Code> event receives nothing from{" "}
                            <Code>v-model</Code> in Vue 3 — its value is{" "}
                            <Code>undefined</Code> and the parent never updates. There
                            is no error unless prop types catch it.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Why the contract matters">
                    <p>
                        A value plus a setter function, passed as two props, also gives
                        a child read and write access. It is a private agreement
                        between two components, and every field needs its own setter:
                    </p>
                    <CodeBlock code={SETTER_PROP_USE} lang="vue" />
                    <p>The matching prop declaration:</p>
                    <CodeBlock code={SETTER_PROP_DECL} lang="ts" />
                    <p>
                        <Code>v-model</Code> is a shared agreement. The parent uses
                        every supporting component the same way, whether it is a native
                        input, an own component or a UI library component, without
                        knowing its API:
                    </p>
                    <CodeBlock code={SHARED_CONTRACT} lang="vue" />
                    <p>
                        The parent writes no setter: nested paths and array items work
                        directly:
                    </p>
                    <CodeBlock code={NESTED_PATHS} lang="vue" />
                    <p>
                        The child stays reusable: it does not care whether the value
                        lives in <Code>data</Code>, a store or an array item. This is
                        why UI libraries implement their inputs with{" "}
                        <Code>v-model</Code>.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — multiple v-models ---------- */}
            <PartHeading kicker="part 2">Multiple v-models</PartHeading>
            <div>
                <DocSection title="v-model arguments">
                    <p>
                        Plain <Code>v-model</Code> binds one value. A form component
                        that edits a first and a last name needs two two-way bindings.
                    </p>
                    <p>
                        An argument after <Code>v-model:</Code> names the pair. The
                        argument is the prop name, and the event is{" "}
                        <Code>update:</Code> plus that name:
                    </p>
                    <CodeBlock code={NAMED_MODELS_USE} lang="vue" />
                    <p>The child declares one prop and one event per argument:</p>
                    <CodeBlock code={NAMED_MODELS_DECL} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Parent writes", "Child prop", "Child emits"]}
                        rows={[
                            ['v-model="query"', "modelValue", "update:modelValue"],
                            [
                                'v-model:first-name="first"',
                                "firstName",
                                "update:firstName",
                            ],
                            [
                                'v-model:last-name="last"',
                                "lastName",
                                "update:lastName",
                            ],
                        ]}
                    />
                    <p>
                        Each pair is matched by name, so bindings never mix. Templates
                        use kebab-case and scripts camelCase, as for any prop. Plain{" "}
                        <Code>v-model</Code> is the same as{" "}
                        <Code>v-model:model-value</Code> and can be combined with named
                        ones.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · .sync is removed"
                    >
                        <p>
                            <Code>:first-name.sync=&quot;first&quot;</Code> becomes{" "}
                            <Code>v-model:first-name=&quot;first&quot;</Code>. Both emit{" "}
                            <Code>update:firstName</Code>, so the child is unchanged;
                            only the parent template changes.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — forwarding v-model to inner inputs ---------- */}
            <PartHeading kicker="part 3">Forwarding v-model to inner inputs</PartHeading>
            <div>
                <DocSection title="Writable computed for inner inputs">
                    <p>
                        Wiring every inner input by hand needs <Code>:value</Code>,{" "}
                        <Code>@input</Code> and a handler method per field. Binding the
                        inner input&apos;s <Code>v-model</Code> to the prop is not
                        allowed, because <Code>v-model</Code> assigns to its value and
                        props are read-only:
                    </p>
                    <CodeBlock code={PROP_V_MODEL} lang="vue" />
                    <p>
                        A writable computed sits between the prop and the inner input:{" "}
                        <Code>get</Code> returns the prop, <Code>set</Code> emits the
                        update:
                    </p>
                    <CodeBlock code={WRITABLE_COMPUTED} lang="ts" />
                    <p>The inner input binds to the computed:</p>
                    <CodeBlock code={COMPUTED_V_MODEL} lang="vue" />
                    <p>
                        The inner <Code>v-model</Code> reads <Code>first</Code> through{" "}
                        <Code>get</Code> (the prop) and assigns to <Code>first</Code> on
                        input, which calls <Code>set</Code> and emits. The parent
                        updates its variable, the prop changes, and <Code>get</Code>{" "}
                        returns the new value. The prop is never written. Side by side:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Wired by hand</Term>
                                </p>
                                <CodeBlock code={WIRED_BY_HAND} lang="vue" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Writable computed</Term>
                                </p>
                                <CodeBlock code={WRITABLE_FORM} lang="vue" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Both behave the same. The computed version needs no handler per
                        field, and it also forwards to components instead of native
                        inputs — <Code>{'<DatePicker v-model="date" />'}</Code> —
                        without knowing their prop and event names.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · objects: emit a copy, never mutate"
                    >
                        <p>
                            When the bound value is an object, writing{" "}
                            <Code>this.modelValue.name = …</Code> mutates the
                            parent&apos;s object and bypasses the event. Emit a new
                            object instead:{" "}
                            <Code>
                                {
                                    "set(name: string) { this.$emit('update:modelValue', { ...this.modelValue, name }) }"
                                }
                            </Code>
                            .
                        </p>
                    </Callout>

                    <Callout
                        severity="tip"
                        label="tip · defineModel in script setup"
                    >
                        <p>
                            In <Code>{"<script setup>"}</Code>,{" "}
                            <Code>defineModel()</Code> replaces the prop, the event and
                            the writable computed in one call (see Compiler Macros).
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
