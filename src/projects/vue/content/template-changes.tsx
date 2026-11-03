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
    // --- part 1 (v-if and v-for) ---
    // inline `vue 2 → 3 · v-if before v-for`
    "v-if-before-v-for": ["difference"],

    // --- part 2 (Filters) ---
    // inline `vue 2 → 3 · filters removed`
    "filters-replaced-by-functions": ["difference"],

    // --- part 3 (Key rules) ---
    // "key-on-template-v-for" carries no callout, so no entry.
    // inline `trap · manual branch keys must differ` + `vue 2 → 3 · keys`
    "keys-on-v-if-branches": ["trap", "difference"],
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
// 4. Every fragment declares its language: vue, ts, js or text. Component
//    examples use <script setup lang="ts">; Vue 2 code says so in a comment.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — v-if and v-for
// ===================================================================

const SAME_ELEMENT = `<li v-for="u in users" v-if="u.active" :key="u.id">{{ u.name }}</li>
<!-- ❌ u is undefined in v-if -->`;

const SAME_ELEMENT_ERROR = `TypeError: Cannot read properties of undefined (reading 'active')`;

const FILTER_COMPUTED = `<script setup lang="ts">
import { computed, ref } from 'vue'

interface Member {
  id: number
  name: string
  active: boolean
}

const users = ref<Member[]>([
  { id: 1, name: 'Ada', active: true },
  { id: 2, name: 'Linus', active: false },
])

const activeUsers = computed(() => users.value.filter((u) => u.active))
</script>

<template>
  <ul>
    <li v-for="u in activeUsers" :key="u.id">{{ u.name }}</li>
  </ul>
</template>`;

const TEMPLATE_WRAPPER = `<template v-for="u in users" :key="u.id">
  <li v-if="u.active">{{ u.name }}</li>
</template>`;

// ===================================================================
// part 2 — filters
// ===================================================================

const FILTER_SYNTAX = `<!-- Vue 2 -->
<p>{{ price | currency }}</p>
<p>{{ createdAt | date('short') | uppercase }}</p>`;

const FILTER_REGISTRATION = `// Vue 2
Vue.filter('currency', (v) => \`\${v.toFixed(2)} €\`)`;

const FORMAT_FUNCTIONS = `// src/utils/format.ts
export function currency(value: number): string {
  return \`\${value.toFixed(2)} €\`
}

export function shortDate(value: Date): string {
  return value.toLocaleDateString('de-DE')
}

export function uppercase(value: string): string {
  return value.toUpperCase()
}`;

const FORMAT_USE = `<script setup lang="ts">
import { currency, shortDate, uppercase } from '@/utils/format'
</script>

<template>
  <li v-for="item in items" :key="item.id">
    {{ uppercase(item.name) }} · {{ currency(item.price) }} · {{ shortDate(item.addedAt) }}
  </li>
</template>`;

const FORMAT_COMPUTED = `const total = computed(() => currency(items.value.reduce((sum, i) => sum + i.price, 0)))`;

// ===================================================================
// part 3 — key rules
// ===================================================================

const CHILD_KEYS = `<!-- Vue 2 -->
<template v-for="u in users">
  <dt :key="'t' + u.id">{{ u.name }}</dt>
  <dd :key="'d' + u.id">{{ u.role }}</dd>
</template>`;

const TEMPLATE_KEY = `<template v-for="u in users" :key="u.id">
  <dt>{{ u.name }}</dt>
  <dd>{{ u.role }}</dd>
</template>`;

const REUSED_BRANCHES = `<!-- Vue 2: typed text survives the switch -->
<template>
  <div>
    <button @click="mode = mode === 'email' ? 'phone' : 'email'">Switch</button>
    <input v-if="mode === 'email'" placeholder="Email" />
    <input v-else placeholder="Phone" />
  </div>
</template>`;

const VUE2_BRANCH_KEYS = `<!-- Vue 2 fix -->
<input v-if="mode === 'email'" key="email" placeholder="Email" />
<input v-else key="phone" placeholder="Phone" />`;

const AUTOMATIC_BRANCH_KEYS = `<script setup lang="ts">
import { ref } from 'vue'

const mode = ref<'email' | 'phone'>('email')
</script>

<template>
  <button @click="mode = mode === 'email' ? 'phone' : 'email'">Switch</button>
  <input v-if="mode === 'email'" placeholder="Email" />
  <input v-else placeholder="Phone" />
</template>`;

export function TemplateChangesDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Most template syntax is unchanged from Vue 2. A few changes break
                    migrated templates —{" "}
                    <Term>some with a compile error, some silently</Term>.
                </p>
                <p>
                    This page covers directive priority, the removal of filters and the
                    new key rules. The removal of the <Code>.native</Code> modifier is
                    covered on Props &amp; Emits.
                </p>
            </div>

            {/* ---------- part 1 — v-if and v-for ---------- */}
            <PartHeading kicker="part 1">v-if and v-for</PartHeading>
            <div>
                <DocSection title="v-if before v-for">
                    <p>
                        Vue 2 templates often filtered a list by combining both
                        directives on one element. In Vue 2 <Code>v-for</Code> ran
                        first; in Vue 3 <Code>v-if</Code> has higher priority and runs
                        before the loop variable exists:
                    </p>
                    <CodeBlock code={SAME_ELEMENT} lang="vue" />
                    <p>The error at runtime:</p>
                    <CodeBlock code={SAME_ELEMENT_ERROR} lang="text" />
                    <p>
                        Never combine both on one element. Filter in a computed — the
                        usual choice:
                    </p>
                    <CodeBlock code={FILTER_COMPUTED} lang="vue" />
                    <p>
                        When the condition belongs in the template, move the loop to a{" "}
                        <Code>{"<template>"}</Code> wrapper:
                    </p>
                    <CodeBlock code={TEMPLATE_WRAPPER} lang="vue" />
                    <p>
                        In Vue 2 the combination looked like &quot;render only active
                        users&quot; but looped over all users on every render. A computed
                        filters once and is cached until <Code>users</Code> changes. With{" "}
                        <Code>v-if</Code> first, the hidden cost becomes a visible error.
                    </p>
                    <p>
                        A condition that does not depend on the loop variable — showing
                        the list at all — belongs on the parent element:{" "}
                        <Code>{'<ul v-if="showList">'}</Code>. The official ESLint rule{" "}
                        <Code>vue/no-use-v-if-with-v-for</Code> flags both combinations.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · v-if before v-for"
                    >
                        <p>
                            On the same element, <Code>v-if</Code> now takes priority
                            over <Code>v-for</Code>. Filter with a computed or move one
                            directive to a <Code>{"<template>"}</Code> wrapper.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — filters ---------- */}
            <PartHeading kicker="part 2">Filters</PartHeading>
            <div>
                <DocSection title="Filters replaced by functions">
                    <p>
                        Vue 2 filters formatted values in templates with the{" "}
                        <Code>|</Code> syntax, registered globally with{" "}
                        <Code>Vue.filter</Code>. Vue 3 removed them; the syntax is a
                        template compile error:
                    </p>
                    <CodeBlock code={FILTER_SYNTAX} lang="vue" />
                    <p>The global registration:</p>
                    <CodeBlock code={FILTER_REGISTRATION} lang="js" />
                    <p>
                        Formatting becomes plain exported functions. In{" "}
                        <Code>{"<script setup>"}</Code>, imported functions are top-level
                        bindings and can be called in the template:
                    </p>
                    <CodeBlock code={FORMAT_FUNCTIONS} lang="ts" />
                    <p>Imported and called in a component:</p>
                    <CodeBlock code={FORMAT_USE} lang="vue" />
                    <p>
                        Filters were custom syntax outside JavaScript: <Code>|</Code>{" "}
                        clashes with bitwise OR, and TypeScript could not check them, so
                        wrong names or arguments failed only at runtime. Function calls
                        are typed — <Code>{"{{ currency(item.name) }}"}</Code> is a type
                        error.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Vue 2 filter", "Vue 3 function"]}
                        rows={[
                            ["{{ price | currency }}", "{{ currency(price) }}"],
                            ["{{ d | date('short') }}", "{{ date(d, 'short') }}"],
                            ["{{ d | date | uppercase }}", "{{ uppercase(date(d)) }}"],
                        ]}
                    />
                    <p>
                        A function called in the template runs on every render. Values
                        used several times or expensive to compute belong in a computed:
                    </p>
                    <CodeBlock code={FORMAT_COMPUTED} lang="ts" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · filters removed"
                    >
                        <p>
                            <Code>{"{{ x | f }}"}</Code> becomes{" "}
                            <Code>{"{{ f(x) }}"}</Code>; <Code>Vue.filter</Code> becomes
                            an exported function imported where needed.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — key rules ---------- */}
            <PartHeading kicker="part 3">Key rules</PartHeading>
            <div>
                <DocSection title="key on <template v-for>">
                    <p>
                        A loop rendering several elements per item uses{" "}
                        <Code>{"<template v-for>"}</Code>. Vue 2 did not allow a{" "}
                        <Code>key</Code> on <Code>{"<template>"}</Code>, so every child
                        needed its own unique key. In Vue 3 child keys in this position
                        are an error: &quot;&lt;template v-for&gt; key should be placed
                        on the &lt;template&gt; tag&quot;:
                    </p>
                    <CodeBlock code={CHILD_KEYS} lang="vue" />
                    <p>
                        One key on the <Code>{"<template>"}</Code> tag:
                    </p>
                    <CodeBlock code={TEMPLATE_KEY} lang="vue" />
                    <p>
                        Each iteration of a <Code>{"<template v-for>"}</Code> is one
                        block (a fragment), so a single key identifies the whole group.
                    </p>
                </DocSection>

                <DocSection title="Keys on v-if branches">
                    <p>
                        In Vue 2, branches with the same element type at the same
                        position were reused: Vue patched the changed attributes on the
                        existing element. Switching between an email and a phone input
                        kept the typed text:
                    </p>
                    <CodeBlock code={REUSED_BRANCHES} lang="vue" />
                    <p>
                        The Vue 2 fix was a unique key per branch, so the old element was
                        destroyed and a fresh one created:
                    </p>
                    <CodeBlock code={VUE2_BRANCH_KEYS} lang="vue" />
                    <p>
                        Vue 3 assigns a unique key to every <Code>v-if</Code> /{" "}
                        <Code>v-else-if</Code> / <Code>v-else</Code> branch automatically;
                        switching branches creates a fresh element without manual keys:
                    </p>
                    <CodeBlock code={AUTOMATIC_BRANCH_KEYS} lang="vue" />

                    <Callout
                        severity="trap"
                        label="trap · manual branch keys must differ"
                    >
                        <p>
                            Keys added manually to branches must be unique. Reusing one
                            key on both branches to force element reuse no longer works.
                        </p>
                    </Callout>

                    <Callout severity="difference" label="vue 2 → 3 · keys">
                        <p>
                            <Code>{"<template v-for>"}</Code> takes its key on the{" "}
                            <Code>{"<template>"}</Code> tag; <Code>v-if</Code> branches
                            receive unique keys automatically.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
