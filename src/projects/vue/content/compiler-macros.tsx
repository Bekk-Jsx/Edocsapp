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
    // --- part 1 (defineProps) ---
    // inline `main vs setup · props`
    "typed-props": ["difference"],
    // inline `trap · watch destructured props with a getter` +
    // `main vs setup · destructuring is safe here`
    "defaults-and-destructuring": ["trap", "difference"],

    // --- part 2 (defineEmits) ---
    // inline `main vs setup · emits`
    "typed-events": ["difference"],

    // --- part 3 (defineModel) ---
    // inline `trap · objects: assign a copy` +
    // `main vs setup · v-model in the child`
    "v-model-in-one-line": ["trap", "difference"],

    // --- part 4 (defineExpose and defineOptions) ---
    // inline `tip · expose actions, not data`
    defineexpose: ["tip"],
    // "defineoptions" carries no callout, so no entry.

    // --- part 5 (defineSlots) ---
    // inline `trap · keep the declaration and the <slot> tags in sync`
    "typed-slots": ["trap"],
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

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed with ❌.
// 4. Every fragment declares its language: ts or vue.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "main vs setup · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — defineProps
// ===================================================================

const RUNTIME_PROPS = `props: {
  user: { type: Object as PropType<User>, required: true },
  size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
},`;

const DEFINE_PROPS = `const props = defineProps<{
  user: User
  size?: 'sm' | 'md' | 'lg'
}>()`;

const DEFINE_PROPS_RUNTIME = `const props = defineProps(['user', 'size'])

const props = defineProps({
  user: { type: Object, required: true },
  size: { type: String, default: 'md' },
})`;

const DESTRUCTURED_PROPS = `const { user, size = 'md' } = defineProps<{
  user: User
  size?: 'sm' | 'md' | 'lg'
}>()
// size: 'sm' | 'md' | 'lg'`;

const WATCH_DESTRUCTURED = `watch(size, () => { /* … */ })        // ❌ a value, nothing to track
watch(() => size, () => { /* … */ })  // ✅`;

const WITH_DEFAULTS = `const props = withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), {
  size: 'md',
})`;

// ===================================================================
// part 2 — defineEmits
// ===================================================================

const DEFINE_EMITS = `const emit = defineEmits<{
  select: [user: User]
  close: []
}>()

emit('select', user)  // ✅
emit('select')
// ❌ Expected 2 arguments
emit('selcet', user)
// ❌ '"selcet"' is not assignable`;

const CALL_SIGNATURES = `const emit = defineEmits<{
  (e: 'select', user: User): void
  (e: 'close'): void
}>()`;

// ===================================================================
// part 3 — defineModel
// ===================================================================

const MANUAL_MODELS = `props: { firstName: …, lastName: … },
emits: { 'update:firstName': …, 'update:lastName': … },
computed: {
  first: { get() { … }, set(v) { this.$emit('update:firstName', v) } },
  last:  { get() { … }, set(v) { this.$emit('update:lastName', v) } },
},`;

const DEFINE_MODEL = `<script setup lang="ts">
const query = defineModel<string>({ required: true })
</script>

<template>
  <input v-model="query" />
</template>`;

const NAMED_MODELS = `const firstName = defineModel<string>('firstName', { required: true })
const lastName = defineModel<string>('lastName', { required: true })`;

const NAMED_MODELS_PARENT = `<UserForm v-model:first-name="first" v-model:last-name="last" />`;

const MODEL_DEFAULT = `const model = defineModel<string>({ default: '' }) // Ref<string>`;

// ===================================================================
// part 4 — defineExpose and defineOptions
// ===================================================================

const EXPOSE_CHILD = `const model = defineModel<string>({ required: true })

function clear() {
  model.value = ''
}

defineExpose({ clear })`;

const EXPOSE_PARENT = `<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/components/BaseInput.vue'

const email = ref('')
const inputRef = ref<InstanceType<typeof BaseInput> | null>(null)
</script>

<template>
  <BaseInput ref="inputRef" v-model="email" label="Email" />
  <button @click="inputRef?.clear()">Clear</button>
</template>`;

const SECOND_SCRIPT = `<script lang="ts">
export default { inheritAttrs: false }
</script>

<script setup lang="ts">
// the component
</script>`;

const DEFINE_OPTIONS = `defineOptions({
  name: 'BaseInput',
  inheritAttrs: false,
})`;

const BASE_INPUT = `<script setup lang="ts">
defineOptions({
  name: 'BaseInput',
  inheritAttrs: false,
})

const { label } = defineProps<{
  label: string
}>()

const model = defineModel<string>({ required: true })

function clear() {
  model.value = ''
}

defineExpose({ clear })
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input v-model="model" v-bind="$attrs" />
  </label>
</template>`;

// ===================================================================
// part 5 — defineSlots
// ===================================================================

const DEFINE_SLOTS = `const slots = defineSlots<{
  header(): any
  item(props: { user: User; index: number }): any
}>()

const hasCustomHeader = computed(() => !!slots.header)`;

const SLOTS_PARENT = `<UserTable :users="users">
  <template #item="{ user, index }">
    {{ index + 1 }}. {{ user.nmae }}
    <!-- ❌ Property 'nmae' does not exist on type 'User' -->
  </template>
</UserTable>`;

export function CompilerMacrosDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Code>{"<script setup>"}</Code> has no options object. A
                    component&apos;s props, events, <Code>v-model</Code> bindings,
                    public methods, options and slots are declared with compiler macros
                    instead.
                </p>
                <p>
                    Macros are not imported and{" "}
                    <Term>do not exist at runtime</Term>: the compiler reads them —
                    including their TypeScript types — and generates the matching
                    component options.
                </p>
            </div>

            {/* ---------- part 1 — defineProps ---------- */}
            <PartHeading kicker="part 1">defineProps</PartHeading>
            <div>
                <DocSection title="Typed props">
                    <p>
                        <Code>{"<script setup>"}</Code> has no <Code>props</Code>{" "}
                        option. The runtime props syntax is also verbose with
                        TypeScript: each prop needs a constructor, a{" "}
                        <Code>PropType</Code> cast and <Code>required</Code>:
                    </p>
                    <CodeBlock code={RUNTIME_PROPS} lang="ts" />
                    <p>
                        <Code>defineProps</Code> takes the props as a TypeScript type.
                        Required props are plain keys; optional props use{" "}
                        <Code>?</Code>:
                    </p>
                    <CodeBlock code={DEFINE_PROPS} lang="ts" />
                    <p>
                        <Code>defineProps</Code> is a compiler macro. The compiler reads
                        the type and generates the runtime <Code>props</Code> option (
                        <Code>{"user: { type: Object, required: true }"}</Code>, …), so
                        the development-mode runtime checks remain. The type must be
                        resolvable by the compiler: a literal type, or an interface or
                        type alias from the same file or an import.
                    </p>
                    <p>
                        In JavaScript, or when runtime options are wanted,{" "}
                        <Code>defineProps</Code> takes the runtime declaration instead —
                        an array of names or the object form. A single call uses either
                        a type argument or a runtime object, never both:
                    </p>
                    <CodeBlock code={DEFINE_PROPS_RUNTIME} lang="ts" />

                    <Callout severity="difference" label="main vs setup · props">
                        <p>
                            <Code>{"props: { … }"}</Code> with <Code>PropType</Code> →{" "}
                            <Code>{"defineProps<{ … }>()"}</Code>. Templates read props
                            directly by name.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Defaults and destructuring">
                    <p>
                        An optional prop includes <Code>undefined</Code> in its type
                        until it has a default.
                    </p>
                    <p>
                        Since Vue 3.5, props are destructured with JavaScript defaults:
                    </p>
                    <CodeBlock code={DESTRUCTURED_PROPS} lang="ts" />
                    <p>
                        The compiler rewrites every use of a destructured prop into{" "}
                        <Code>{"props.<name>"}</Code>, so the variables stay reactive —
                        unlike destructuring the <Code>props</Code> argument of{" "}
                        <Code>setup()</Code>.
                    </p>
                    <p>
                        A destructured prop looks like a plain variable but is only
                        rewritten where it is read. Passed to <Code>watch</Code>{" "}
                        directly, it is a value, not a source:
                    </p>
                    <CodeBlock code={WATCH_DESTRUCTURED} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · watch destructured props with a getter"
                    >
                        <p>
                            Wrap destructured props in a getter when passing them to{" "}
                            <Code>watch</Code> or to composables that expect a reactive
                            source.
                        </p>
                    </Callout>

                    <p>
                        Before Vue 3.5, defaults were declared with{" "}
                        <Code>withDefaults</Code>:
                    </p>
                    <CodeBlock code={WITH_DEFAULTS} lang="ts" />

                    <Callout
                        severity="difference"
                        label="main vs setup · destructuring is safe here"
                    >
                        <p>
                            In <Code>setup(props)</Code>, destructuring freezes values.
                            In <Code>{"<script setup>"}</Code> since Vue 3.5,
                            destructuring <Code>defineProps</Code> keeps them reactive.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — defineEmits ---------- */}
            <PartHeading kicker="part 2">defineEmits</PartHeading>
            <div>
                <DocSection title="Typed events">
                    <p>
                        <Code>{"<script setup>"}</Code> has no <Code>emits</Code>{" "}
                        option, no <Code>this.$emit</Code> and no <Code>setup()</Code>{" "}
                        context argument to receive <Code>emit</Code> from.
                    </p>
                    <p>
                        <Code>defineEmits</Code> declares the events and returns the
                        typed <Code>emit</Code> function. Each key is an event name; its
                        value is a tuple of the payload arguments. Labels such as{" "}
                        <Code>user:</Code> are documentation only; <Code>[]</Code>{" "}
                        declares an event without payload:
                    </p>
                    <CodeBlock code={DEFINE_EMITS} lang="ts" />
                    <p>
                        The compiler generates the runtime <Code>emits</Code> option (
                        <Code>{"['select', 'close']"}</Code>). Declared events do not
                        fall through as native listeners (see Props &amp; Emits), and the
                        parent&apos;s handlers are checked against the payload: a handler
                        typed <Code>(id: number)</Code> on <Code>@select</Code> is an
                        error.
                    </p>
                    <p>
                        Code written before Vue 3.3 uses call signatures for the same
                        declaration:
                    </p>
                    <CodeBlock code={CALL_SIGNATURES} lang="ts" />
                    <p>
                        The type form has no runtime validators; the object form provides
                        them:{" "}
                        <Code>
                            {"defineEmits({ select: (user: User) => user.id > 0 })"}
                        </Code>
                        . In JavaScript: <Code>{"defineEmits(['select', 'close'])"}</Code>
                        .
                    </p>

                    <Callout severity="difference" label="main vs setup · emits">
                        <p>
                            <Code>emits</Code> option + <Code>this.$emit</Code> →{" "}
                            <Code>{"const emit = defineEmits<…>()"}</Code> +{" "}
                            <Code>emit(…)</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — defineModel ---------- */}
            <PartHeading kicker="part 3">defineModel</PartHeading>
            <div>
                <DocSection title="v-model in one line">
                    <p>
                        Supporting <Code>v-model</Code> in a component requires a{" "}
                        <Code>modelValue</Code> prop, an <Code>update:modelValue</Code>{" "}
                        event and a writable computed to forward it to an inner input —
                        six pieces for two bindings:
                    </p>
                    <CodeBlock code={MANUAL_MODELS} lang="ts" />
                    <p>
                        <Code>defineModel</Code> (Vue 3.4+) declares the prop and the
                        event and returns a ref:
                    </p>
                    <CodeBlock code={DEFINE_MODEL} lang="vue" />
                    <p>
                        Reading the ref returns the current prop value; assigning to it
                        emits <Code>update:modelValue</Code>. The parent uses{" "}
                        <Code>v-model</Code> exactly as before.
                    </p>
                    <p>
                        The first argument names the model, matching{" "}
                        <Code>v-model:name</Code> in the parent:
                    </p>
                    <CodeBlock code={NAMED_MODELS} lang="ts" />
                    <p>The parent:</p>
                    <CodeBlock code={NAMED_MODELS_PARENT} lang="vue" />
                    <p>
                        Without <Code>required</Code>, the type includes{" "}
                        <Code>undefined</Code> (
                        <Code>{"Ref<string | undefined>"}</Code>); a default removes it:
                    </p>
                    <CodeBlock code={MODEL_DEFAULT} lang="ts" />

                    <Callout severity="trap" label="trap · objects: assign a copy">
                        <p>
                            <Code>{"model.value.name = 'Bob'"}</Code> mutates the
                            parent&apos;s object without emitting. Assign a new object:{" "}
                            <Code>{"model.value = { ...model.value, name: 'Bob' }"}</Code>
                            .
                        </p>
                    </Callout>

                    <Callout
                        severity="difference"
                        label="main vs setup · v-model in the child"
                    >
                        <p>
                            Prop + emit + writable computed →{" "}
                            <Code>defineModel()</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — defineExpose and defineOptions ---------- */}
            <PartHeading kicker="part 4">defineExpose and defineOptions</PartHeading>
            <div>
                <DocSection title="defineExpose">
                    <p>
                        <Code>{"<script setup>"}</Code> components are closed by default
                        (see Script Setup Basics). <Code>defineExpose</Code> lists the
                        members a parent&apos;s template ref may use, and types that ref.
                        The child:
                    </p>
                    <CodeBlock code={EXPOSE_CHILD} lang="ts" />
                    <p>The parent:</p>
                    <CodeBlock code={EXPOSE_PARENT} lang="vue" />
                    <p>
                        Members not listed are type errors on the ref and{" "}
                        <Code>undefined</Code> at runtime.
                    </p>

                    <Callout severity="tip" label="tip · expose actions, not data">
                        <p>
                            Expose imperative actions a parent legitimately triggers —
                            focus, clear, reset, scroll. Data keeps flowing through props
                            and events.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="defineOptions">
                    <p>
                        Options without a macro — <Code>name</Code>,{" "}
                        <Code>inheritAttrs</Code> — have no place in{" "}
                        <Code>{"<script setup>"}</Code>. Before Vue 3.3 they required a
                        second, plain <Code>{"<script>"}</Code> block:
                    </p>
                    <CodeBlock code={SECOND_SCRIPT} lang="vue" />
                    <p>
                        <Code>defineOptions</Code> (Vue 3.3+) declares them inside{" "}
                        <Code>{"<script setup>"}</Code>; the object is merged into the
                        generated options:
                    </p>
                    <CodeBlock code={DEFINE_OPTIONS} lang="ts" />
                    <p>
                        <Code>props</Code>, <Code>emits</Code>, <Code>expose</Code> and{" "}
                        <Code>slots</Code> are not allowed in{" "}
                        <Code>defineOptions</Code>; they have their own macros. A complete
                        component combining the macros:
                    </p>
                    <CodeBlock code={BASE_INPUT} lang="vue" />
                </DocSection>
            </div>

            {/* ---------- part 5 — defineSlots ---------- */}
            <PartHeading kicker="part 5">defineSlots</PartHeading>
            <div>
                <DocSection title="Typed slots">
                    <p>
                        Slot props are a contract like props. The Options API declares
                        them with <Code>{"slots: Object as SlotsType<…>"}</Code>;{" "}
                        <Code>{"<script setup>"}</Code> has no options object.
                    </p>
                    <p>
                        <Code>defineSlots</Code> (Vue 3.3+) declares each slot as a
                        function: the parameter is the slot props, the return type the
                        rendered content (usually <Code>any</Code>). A slot without props
                        has no parameter. The returned object is the component&apos;s
                        slots, equivalent to <Code>$slots</Code>:
                    </p>
                    <CodeBlock code={DEFINE_SLOTS} lang="ts" />
                    <p>The parent&apos;s slot props are typed from the declaration:</p>
                    <CodeBlock code={SLOTS_PARENT} lang="vue" />
                    <p>
                        <Code>defineSlots</Code> is type-only; nothing is generated at
                        runtime.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · keep the declaration and the <slot> tags in sync"
                    >
                        <p>
                            Parents rely on the declared slot types. If the{" "}
                            <Code>{"<slot>"}</Code> tags pass something else, the parent
                            compiles against the declaration and fails at runtime (see
                            Slots).
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
