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
    // --- part 1 (DOM refs) ---
    // inline `main vs setup · refs`
    usetemplateref: ["difference"],
    // inline `trap · null during setup`
    "when-a-ref-is-filled": ["trap"],

    // --- part 2 (Component refs) ---
    // inline `tip · expose actions, keep DOM private`
    "refs-on-child-components": ["tip"],
    // inline `trap · array order is not guaranteed`
    "refs-inside-v-for": ["trap"],
};

// Top-level divider between the two parts of the page — mirrors the groups in
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
// 4. Every fragment declares its language: ts or vue.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "main vs setup · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — DOM refs
// ===================================================================

const USE_TEMPLATE_REF = `<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

const inputEl = useTemplateRef<HTMLInputElement>('email')

onMounted(() => {
  inputEl.value?.focus()
})
</script>

<template>
  <input ref="email" />
</template>`;

const PLAIN_REF = `const email = ref<HTMLInputElement | null>(null)
// template: <input ref="email" />`;

const READ_DURING_SETUP = `const inputEl = useTemplateRef<HTMLInputElement>('email')
inputEl.value?.focus() // ❌ null: nothing rendered yet`;

// ===================================================================
// part 2 — component refs
// ===================================================================

const SEARCH_FIELD = `<script setup lang="ts">
import { useTemplateRef } from 'vue'

const query = defineModel<string>({ default: '' })
const inputEl = useTemplateRef<HTMLInputElement>('input')

function focus() {
  inputEl.value?.focus()
}

function clear() {
  query.value = ''
  focus()
}

defineExpose({ focus, clear })
</script>

<template>
  <input ref="input" v-model="query" />
</template>`;

const SEARCH_FIELD_PARENT = `<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import SearchField from '@/components/SearchField.vue'

const query = ref('')
const field = useTemplateRef<InstanceType<typeof SearchField>>('field')
</script>

<template>
  <SearchField ref="field" v-model="query" />
  <button @click="field?.focus()">Focus</button>
  <button @click="field?.clear()">Clear</button>
</template>`;

const V_FOR_REF_SCRIPT = `const items = useTemplateRef<HTMLLIElement[]>('items')`;

const V_FOR_REF_TEMPLATE = `<li v-for="u in users" :key="u.id" ref="items">{{ u.name }}</li>`;

export function TemplateRefsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A template ref gives script code access to{" "}
                    <Term>
                        a rendered DOM element or to a child component&apos;s public
                        instance
                    </Term>
                    . In <Code>{"<script setup>"}</Code> there is no{" "}
                    <Code>this.$refs</Code>; refs are obtained with{" "}
                    <Code>useTemplateRef</Code>.
                </p>
                <p>
                    This page covers DOM refs, when refs are available, component refs
                    and refs inside <Code>v-for</Code>. Calling child methods from the
                    Options API is covered on Props &amp; Emits.
                </p>
            </div>

            {/* ---------- part 1 — DOM refs ---------- */}
            <PartHeading kicker="part 1">DOM refs</PartHeading>
            <div>
                <DocSection title="useTemplateRef">
                    <p>
                        Some tasks need the real DOM element: focusing an input,
                        measuring a size, handing an element to a third-party library.
                        The Options API used <Code>this.$refs</Code>, which does not
                        exist in <Code>{"<script setup>"}</Code>.
                    </p>
                    <p>
                        The element gets a <Code>ref</Code> attribute;{" "}
                        <Code>useTemplateRef</Code> (Vue 3.5+) returns a ref holding that
                        element:
                    </p>
                    <CodeBlock code={USE_TEMPLATE_REF} lang="vue" />
                    <p>
                        The string argument links the ref to the element with the same{" "}
                        <Code>ref</Code> attribute; the variable name is free. Vue fills
                        the ref when the element renders. Its type is{" "}
                        <Code>HTMLInputElement | null</Code>.
                    </p>
                    <p>
                        Code written before Vue 3.5 uses a plain <Code>ref</Code> whose
                        variable name matches the <Code>ref</Code> attribute. It behaves
                        the same, but the link depends on matching names and breaks
                        silently on renames:
                    </p>
                    <CodeBlock code={PLAIN_REF} lang="ts" />

                    <Callout severity="difference" label="main vs setup · refs">
                        <p>
                            <Code>this.$refs.email as HTMLInputElement</Code> →{" "}
                            <Code>{"useTemplateRef<HTMLInputElement>('email')"}</Code>,
                            typed without a cast.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="When a ref is filled">
                    <p>
                        A template ref holds an element only while that element is
                        rendered.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Moment", "Value"]}
                        rows={[
                            ["During setup (top level of <script setup>)", "null"],
                            ["After mount (onMounted, event handlers)", "the element"],
                            ["Hidden by v-if, or after unmount", "null"],
                        ]}
                    />
                    <p>
                        Top-level code runs before the first render, so the element does
                        not exist yet:
                    </p>
                    <CodeBlock code={READ_DURING_SETUP} lang="ts" />
                    <p>
                        Access the element in <Code>onMounted</Code>, in event handlers,
                        or in a <Code>watch</Code> on the ref.
                    </p>

                    <Callout severity="trap" label="trap · null during setup">
                        <p>
                            A ref read during setup is always <Code>null</Code>. A
                            misspelled <Code>ref</Code> attribute also leaves it{" "}
                            <Code>null</Code>, without an error.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — component refs ---------- */}
            <PartHeading kicker="part 2">Component refs</PartHeading>
            <div>
                <DocSection title="Refs on child components">
                    <p>
                        A parent sometimes needs to trigger an action inside a child —
                        focus its input, reset it, scroll it — while the child&apos;s DOM
                        stays private.
                    </p>
                    <p>
                        A ref on a component holds the component&apos;s public instance.
                        A <Code>{"<script setup>"}</Code> child is closed by default and
                        lists its public actions with <Code>defineExpose</Code> (see
                        Compiler Macros); <Code>{"InstanceType<typeof Child>"}</Code>{" "}
                        types the parent&apos;s ref. The child,{" "}
                        <Code>SearchField.vue</Code>:
                    </p>
                    <CodeBlock code={SEARCH_FIELD} lang="vue" />
                    <p>The parent:</p>
                    <CodeBlock code={SEARCH_FIELD_PARENT} lang="vue" />
                    <p>
                        On an HTML element the ref holds the element; on a component it
                        holds the public instance. The parent requests an action, and the
                        child decides how to perform it on its own DOM. Members not
                        exposed — such as <Code>query</Code> here — are type errors on
                        the ref.
                    </p>

                    <Callout
                        severity="tip"
                        label="tip · expose actions, keep DOM private"
                    >
                        <p>
                            Expose methods like <Code>focus</Code> or <Code>clear</Code>{" "}
                            instead of the child&apos;s elements, so the child&apos;s
                            markup can change without breaking parents.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Refs inside v-for">
                    <p>
                        A <Code>ref</Code> attribute inside <Code>v-for</Code> fills the
                        ref with an array of elements. In the script:
                    </p>
                    <CodeBlock code={V_FOR_REF_SCRIPT} lang="ts" />
                    <p>In the template:</p>
                    <CodeBlock code={V_FOR_REF_TEMPLATE} lang="vue" />

                    <Callout
                        severity="trap"
                        label="trap · array order is not guaranteed"
                    >
                        <p>
                            The order of the ref array does not necessarily match the
                            source array. Use it for actions on all items, not for access
                            by index.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
