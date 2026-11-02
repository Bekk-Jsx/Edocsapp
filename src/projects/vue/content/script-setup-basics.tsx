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
    // --- part 1 (The <script setup> syntax) ---
    // inline `main vs setup · same logic, less code`
    "top-level-bindings-without-a-return": ["difference"],

    // --- part 2 (Using components) ---
    // "imported-components" and "dynamic-components" carry no callout, so no entry.

    // --- part 3 (Closed by default) ---
    // inline `main vs setup · closed by default`
    "closed-by-default": ["difference"],
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

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed with ❌.
// 4. Every fragment declares its language: vue or ts.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "main vs setup · …".
// 6. A comparison shows both codes side by side in the container-query pair
//    grid, and each column opens with a one-line <Term> label.
// 7. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — the <script setup> syntax
// ===================================================================

const SETUP_WRAPPER = `export default defineComponent({
  setup() {
    const count = ref(0)
    const double = computed(() => count.value * 2)
    function increment() { count.value++ }
    // … more bindings
    return { count, double, increment /* …, one forgotten? */ }
  },
})`;

const SCRIPT_SETUP = `<script setup lang="ts">
import { computed, ref } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)
function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">{{ count }} × 2 = {{ double }}</button>
</template>`;

const SETUP_FORM = `<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0)
    function increment() {
      count.value++
    }
    return { count, increment }
  },
})
</script>`;

const SCRIPT_SETUP_FORM = `<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
function increment() {
  count.value++
}
</script>`;

// ===================================================================
// part 2 — using components
// ===================================================================

const OPTIONS_REGISTRATION = `import UserCard from '@/components/UserCard.vue'

export default defineComponent({
  components: { UserCard }, // required, easy to forget
})`;

const IMPORTED_COMPONENT = `<script setup lang="ts">
import UserCard from '@/components/UserCard.vue'
</script>

<template>
  <UserCard />
</template>`;

const DYNAMIC_COMPONENT = `<script setup lang="ts">
import { shallowRef } from 'vue'
import StepOne from './StepOne.vue'
import StepTwo from './StepTwo.vue'

const current = shallowRef(StepOne)
</script>

<template>
  <component :is="current" />
  <button @click="current = StepTwo">Next</button>
</template>`;

// ===================================================================
// part 3 — closed by default
// ===================================================================

const PARENT_REF = `<script setup lang="ts">
import { ref } from 'vue'
import ResetCounter from '@/components/ResetCounter.vue'

const counterRef = ref<InstanceType<typeof ResetCounter> | null>(null)

function resetChild() {
  counterRef.value?.reset()
  // ❌ Property 'reset' does not exist — undefined at runtime
}
</script>

<template>
  <ResetCounter ref="counterRef" />
  <button @click="resetChild">Reset from parent</button>
</template>`;

const COMPILED_OUTPUT = `export default {
  setup(__props, { expose }) {
    expose() // nothing exposed

    const count = ref(0)
    function reset() {
      count.value = 0
    }

    return { count, reset } // for the template only
  },
}`;

const DEFINE_EXPOSE = `defineExpose({ reset })`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings the typescript pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function ScriptSetupBasicsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Code>{"<script setup>"}</Code> is compile-time syntax for the{" "}
                    <Code>setup()</Code> function. The block&apos;s code becomes the
                    body of <Code>setup()</Code>, and{" "}
                    <Term>
                        its top-level bindings are available to the template without a
                        return
                    </Term>
                    .
                </p>
                <p>
                    This page covers the syntax, using components, and the
                    closed-by-default public API. Props, emits and other declarations
                    use compiler macros, covered on Compiler Macros.
                </p>
            </div>

            {/* ---------- part 1 — the <script setup> syntax ---------- */}
            <PartHeading kicker="part 1">{"The <script setup> syntax"}</PartHeading>
            <div>
                <DocSection title="Top-level bindings without a return">
                    <p>
                        <Code>setup()</Code> inside <Code>defineComponent</Code>{" "}
                        surrounds the logic with <Code>export default</Code>,{" "}
                        <Code>defineComponent</Code>, the <Code>setup()</Code> wrapper
                        and a return that repeats every binding. In real components the
                        return lists many names, and a forgotten one is unavailable to
                        the template:
                    </p>
                    <CodeBlock code={SETUP_WRAPPER} lang="ts" />
                    <p>
                        The <Code>setup</Code> attribute on the script tag removes the
                        wrapper; only the logic remains:
                    </p>
                    <CodeBlock code={SCRIPT_SETUP} lang="vue" />
                    <p>
                        The compiler turns the block into the body of{" "}
                        <Code>setup()</Code> and makes every top-level binding —
                        variables, functions and imports — available to the template.
                        Everything from The setup() Function applies: the code runs once
                        per instance, refs use <Code>.value</Code> in script and are
                        unwrapped in the template, there is no <Code>this</Code>, and
                        lifecycle functions such as <Code>onMounted</Code> work the same
                        way.
                    </p>
                    <p>
                        Only top-level bindings are exposed to the template; variables
                        declared inside functions are not. Imported helpers are usable
                        directly in the template:{" "}
                        <Code>{"import { formatDate } from '@/utils'"}</Code> allows{" "}
                        <Code>{"{{ formatDate(d) }}"}</Code>.
                    </p>
                    <p>The same component in both forms:</p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>setup()</Term>
                                </p>
                                <CodeBlock code={SETUP_FORM} lang="vue" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>{"<script setup>"}</Term>
                                </p>
                                <CodeBlock code={SCRIPT_SETUP_FORM} lang="vue" />
                            </div>
                        </div>
                    </div>

                    <Callout
                        severity="difference"
                        label="main vs setup · same logic, less code"
                    >
                        <p>
                            <Code>{"<script setup>"}</Code> is <Code>setup()</Code>{" "}
                            without <Code>defineComponent</Code>, the wrapper and the
                            return. It is the recommended syntax for new Vue 3
                            components.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — using components ---------- */}
            <PartHeading kicker="part 2">Using components</PartHeading>
            <div>
                <DocSection title="Imported components">
                    <p>
                        In the Options API every child component is named twice: in the
                        import and in the <Code>components</Code> option. A missing
                        registration renders nothing and only warns at runtime
                        (&quot;Failed to resolve component&quot;):
                    </p>
                    <CodeBlock code={OPTIONS_REGISTRATION} lang="ts" />
                    <p>
                        In <Code>{"<script setup>"}</Code> an imported component is a
                        top-level binding and is used in the template directly:
                    </p>
                    <CodeBlock code={IMPORTED_COMPONENT} lang="vue" />
                    <p>
                        The compiler links <Code>{"<UserCard />"}</Code> to the variable
                        of that name. Because it is a real variable, a misspelled tag is
                        a compile error instead of a runtime warning, and props are
                        type-checked.
                    </p>
                    <p>
                        Without a <Code>name</Code> option, the component&apos;s name in
                        Vue DevTools and warnings is derived from the file name:{" "}
                        <Code>UserCard.vue</Code> → <Code>UserCard</Code>.{" "}
                        <Code>{"defineOptions({ name: '…' })"}</Code> sets it explicitly
                        (see Compiler Macros).
                    </p>
                </DocSection>

                <DocSection title="Dynamic components">
                    <p>
                        In the Options API,{" "}
                        <Code>{`<component :is="'UserCard'">`}</Code> takes a string,
                        which only resolves registered components.
                    </p>
                    <p>
                        In <Code>{"<script setup>"}</Code>, <Code>:is</Code> receives the
                        component variable itself:
                    </p>
                    <CodeBlock code={DYNAMIC_COMPONENT} lang="vue" />
                    <p>
                        <Code>shallowRef</Code> is used because the component object
                        itself does not need deep reactivity; only which component is
                        shown changes.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 3 — closed by default ---------- */}
            <PartHeading kicker="part 3">Closed by default</PartHeading>
            <div>
                <DocSection title="Closed by default">
                    <p>
                        With the Options API or <Code>setup()</Code>, a parent holding a
                        template ref can call any method of the child. With a{" "}
                        <Code>{"<script setup>"}</Code> child, the same call fails:
                    </p>
                    <CodeBlock code={PARENT_REF} lang="vue" />
                    <p>
                        Simplified, the compiler produces a <Code>setup()</Code> that
                        calls <Code>expose()</Code> with no arguments. The generated
                        return serves the template only; the empty{" "}
                        <Code>expose()</Code> gives a parent&apos;s ref nothing:
                    </p>
                    <CodeBlock code={COMPILED_OUTPUT} lang="ts" />
                    <p>
                        <Code>defineExpose</Code> lists the members a parent may use; it
                        compiles to <Code>{"expose({ … })"}</Code>. In the child:
                    </p>
                    <CodeBlock code={DEFINE_EXPOSE} lang="ts" />
                    <p>
                        <Code>counterRef.value?.reset()</Code> now works and is typed;
                        members not listed, such as <Code>increment</Code>, remain
                        inaccessible.
                    </p>
                    <p>
                        Closed by default makes the child&apos;s public API explicit. In
                        the Options API every method and data field was public, so
                        refactoring a child could silently break parents.
                    </p>

                    <Callout
                        severity="difference"
                        label="main vs setup · closed by default"
                    >
                        <p>
                            Options API and <Code>setup()</Code> components expose
                            everything to a parent&apos;s template ref unless{" "}
                            <Code>expose()</Code> is called.{" "}
                            <Code>{"<script setup>"}</Code> components expose nothing
                            unless <Code>defineExpose</Code> lists it.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
