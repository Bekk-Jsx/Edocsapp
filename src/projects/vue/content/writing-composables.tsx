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
    // --- part 1 (From mixins to composables) ---
    // inline `vue 2 → 3 · mixins → composables`
    "from-mixins-to-composables": ["difference"],

    // --- part 2 (Conventions) ---
    // inline `trap · don't call composables conditionally`
    "the-conventions": ["trap"],
    // inline `trap · unwrap where the value is used`
    "arguments-value-ref-or-getter": ["trap"],

    // --- part 3 (When not to write one) ---
    // "when-a-composable-is-the-wrong-tool" and "composable-or-module-file"
    // carry no callout, so no entry.
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
// 3. Every fragment declares its language: ts, vue or js. Component examples
//    use <script setup lang="ts">; Vue 2 code is labeled in a comment.
// 4. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 5. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — from mixins to composables
// ===================================================================

const MIXIN = `// Vue 2 mixin
export const windowWidthMixin = {
  data() { return { width: window.innerWidth } },
  mounted() { window.addEventListener('resize', this.onResize) },
  beforeDestroy() { window.removeEventListener('resize', this.onResize) },
  methods: { onResize() { this.width = window.innerWidth } },
}`;

const USE_WINDOW_WIDTH = `// src/composables/useWindowWidth.ts
import { onMounted, onUnmounted, ref } from 'vue'

export function useWindowWidth() {
  const width = ref(window.innerWidth)

  function update() {
    width.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width }
}`;

const USE_WINDOW_WIDTH_CALLER = `<script setup lang="ts">
import { useWindowWidth } from '@/composables/useWindowWidth'

const { width } = useWindowWidth()
</script>

<template>
  <p>Width: {{ width }}px</p>
</template>`;

// ===================================================================
// part 2 — conventions
// ===================================================================

const RETURN_REFS = `return reactive({ width })
// ❌ const { width } = … loses reactivity (see Refs & Reactive)

return { width }
// ✅ width stays a ref`;

const TITLE_CALLERS = `useTitle('Dashboard')                  // plain string
useTitle(pageTitle)                    // a ref
useTitle(() => \`\${user.name}'s page\`)  // a getter`;

const USE_TITLE = `// src/composables/useTitle.ts
import { toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

export function useTitle(title: MaybeRefOrGetter<string>) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}`;

const UNWRAP_OUTSIDE = `const t = toValue(title) // ❌ unwrapped once, outside any tracking
watchEffect(() => {
  document.title = t // never updates again
})`;

// ===================================================================
// part 3 — when not to write one
// ===================================================================

const MODULE_ASYNC_STATE = `// ❌ async state as a module: one shared state for the whole app
export const data = ref(null)
export const loading = ref(false)
// two components fetching different things overwrite each other,
// and one panel's spinner shows while the other loads`;

export function WritingComposablesDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A <Term>composable</Term> is a plain function that uses{" "}
                    <Code>ref</Code>, <Code>computed</Code>, watchers and lifecycle
                    hooks, and returns the state it creates. It is Vue 3&apos;s way to
                    share reactive logic between components.
                </p>
                <p>
                    This page covers why composables replace mixins, the conventions
                    that make them work, arguments that accept values, refs and
                    getters, and when a composable is the wrong tool.
                </p>
            </div>

            {/* ---------- part 1 — from mixins to composables ---------- */}
            <PartHeading kicker="part 1">From mixins to composables</PartHeading>
            <div>
                <DocSection title="From mixins to composables">
                    <p>
                        Sharing logic between components in Vue 2 meant mixins. A mixin
                        merging data, lifecycle hooks and methods into the component
                        works, but costs three things as soon as a component uses more
                        than one: the origin of <Code>this.width</Code> is invisible —
                        nothing in the component names the mixin that added it; two
                        mixins declaring the same data field or method silently
                        overwrite each other; and a mixin takes no parameters, so
                        per-component variation is impossible:
                    </p>
                    <CodeBlock code={MIXIN} lang="js" />
                    <p>
                        A composable is a function that builds the same logic from{" "}
                        <Code>ref</Code> and lifecycle hooks and returns what it
                        creates:
                    </p>
                    <CodeBlock code={USE_WINDOW_WIDTH} lang="ts" />
                    <p>A component calls it in its setup code:</p>
                    <CodeBlock code={USE_WINDOW_WIDTH_CALLER} lang="vue" />
                    <p>
                        The function runs during setup, so its lifecycle hooks register
                        on the calling component, and every component that calls it
                        gets its own state. The three mixin costs disappear: the origin
                        is the visible function call; clashes are impossible because the
                        caller names what it receives (
                        <Code>{"const { width: windowWidth } = useWindowWidth()"}</Code>
                        ); and parameters are ordinary function arguments.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · mixins → composables"
                    >
                        <p>
                            Mixins still exist in the Options API, but composables
                            replace them for new code.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — conventions ---------- */}
            <PartHeading kicker="part 2">Conventions</PartHeading>
            <div>
                <DocSection title="The conventions">
                    <p>Composables work because they all follow the same rules:</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Rule", "Why"]}
                        rows={[
                            [
                                "Name starts with use",
                                "Signals that refs and lifecycle hooks may be inside",
                            ],
                            [
                                "Call at the top level of <script setup> or setup()",
                                "Lifecycle hooks must register while setup runs (see The setup() Function)",
                            ],
                            [
                                "Return plain refs in an object",
                                "Destructuring at the call site keeps reactivity",
                            ],
                            [
                                "Clean up in onUnmounted",
                                "No component using the composable can leak listeners or timers",
                            ],
                        ]}
                    />
                    <p>
                        Returning a <Code>reactive</Code> object breaks the
                        caller&apos;s destructuring:
                    </p>
                    <CodeBlock code={RETURN_REFS} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · don't call composables conditionally"
                    >
                        <p>
                            A composable inside an <Code>if</Code>, a loop or a callback
                            registers its hooks on no component — the same rule as for{" "}
                            <Code>onMounted</Code> itself.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Arguments: value, ref or getter">
                    <p>
                        Callers hold their input differently. A{" "}
                        <Code>useTitle(title)</Code> composable gets a plain string from
                        one caller, a ref from another, and a derived getter from a
                        third:
                    </p>
                    <CodeBlock code={TITLE_CALLERS} lang="ts" />
                    <p>
                        Reading only a plain value loses reactivity for ref callers;
                        demanding a ref forces plain-value callers to wrap theirs.
                        Accepting all three with <Code>MaybeRefOrGetter</Code> and
                        normalizing with <Code>toValue</Code> serves every caller:
                    </p>
                    <CodeBlock code={USE_TITLE} lang="ts" />
                    <p>
                        <Code>toValue</Code> returns a plain value unchanged, reads a
                        ref&apos;s <Code>.value</Code>, and calls a getter. Called inside{" "}
                        <Code>watchEffect</Code>, the unwrapping read is tracked, so ref
                        and getter callers get live updates while plain values are
                        applied once. Destructured props are passed as getters —{" "}
                        <Code>{"useTitle(() => props.title)"}</Code> — exactly as
                        described on Compiler Macros.
                    </p>
                    <p>Unwrapping once, before the effect, loses that tracking:</p>
                    <CodeBlock code={UNWRAP_OUTSIDE} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · unwrap where the value is used"
                    >
                        <p>
                            Call <Code>toValue</Code> inside the tracked function (the
                            effect, the computed), never once outside.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — when not to write one ---------- */}
            <PartHeading kicker="part 3">When not to write one</PartHeading>
            <div>
                <DocSection title="When a composable is the wrong tool">
                    <p>
                        A composable earns its place when it bundles reactive state and
                        behavior used by more than one component. Three cases call for
                        something else:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Case", "Use instead"]}
                        rows={[
                            [
                                "Pure function, no reactivity (formatDate)",
                                "A plain util module",
                            ],
                            [
                                "Shared app state (the signed-in user)",
                                "A store — a reactive module or Pinia (see Pinia Basics)",
                            ],
                            [
                                "Logic used by exactly one component",
                                "Leave it inline in that component",
                            ],
                        ]}
                    />
                    <p>
                        The difference between a composable and a store: a composable
                        called in two components creates two independent states; a
                        store is one state shared by all callers.
                    </p>
                </DocSection>

                <DocSection title="Composable or module file">
                    <p>
                        Both a composable and a reactive module file hold refs; they
                        differ in who owns the state. Refs at a module&apos;s top level
                        are created once at first import, and every importer shares
                        them — right for app state such as the session. Refs inside a
                        composable are created per call, and every caller owns its own
                        — right for per-component state. Async state written as a
                        module shows the cost:
                    </p>
                    <CodeBlock code={MODULE_ASYNC_STATE} lang="ts" />
                    <p>
                        Module code also runs once, so it takes no parameters per use,
                        and lifecycle hooks need a component running setup, which
                        module level never has:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Module file", "Composable"]}
                        rows={[
                            ["State created", "once, at import", "per call"],
                            ["Shared", "app-wide (singleton)", "each caller owns its own"],
                            ["Parameters", "no", "yes"],
                            ["Lifecycle hooks", "no", "yes"],
                            [
                                "Fits",
                                "session, app settings",
                                "widths, titles, per-component fetches",
                            ],
                        ]}
                    />
                </DocSection>
            </div>
        </>
    );
}
