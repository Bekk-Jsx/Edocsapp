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
    // --- part 1 (Teleport) ---
    // inline `vue 2 → 3 · Teleport is built in`
    "rendering-outside-the-component": ["difference"],

    // --- part 2 (KeepAlive) ---
    // inline `trap · the cache dies with its KeepAlive`
    "caching-hidden-views": ["trap"],

    // --- part 3 (Async components) ---
    // inline `vue 2 → 3 · wrap async components`
    "loading-components-on-demand": ["difference"],

    // --- part 4 (Transition) ---
    // inline `vue 2 → 3 · TransitionGroup has no wrapper` + `note · Suspense`
    "renamed-transition-classes": ["difference", "note"],
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
// 3. Every fragment declares its language: vue, ts, css or html. Component
//    examples use <script setup lang="ts">; Vue 2 code says so in a comment.
// 4. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 5. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — Teleport
// ===================================================================

const ANCESTOR_STYLES = `.card {
  overflow: hidden;
  transform: translateZ(0);
}`;

const TELEPORT_MODAL = `<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <section class="card">
    <button @click="open = true">Open modal</button>

    <Teleport to="body">
      <div v-if="open" class="backdrop" @click.self="open = false">
        <div class="modal">
          <p>Modal content</p>
          <button @click="open = false">Close</button>
        </div>
      </div>
    </Teleport>
  </section>
</template>`;

const CUSTOM_TARGET = `<body>
  <div id="app"></div>
  <div id="modals"></div>
</body>`;

// ===================================================================
// part 2 — KeepAlive
// ===================================================================

const KEEP_ALIVE = `<script setup lang="ts">
import { shallowRef } from 'vue'
import FormTab from '@/components/FormTab.vue'
import CounterTab from '@/components/CounterTab.vue'

const current = shallowRef(FormTab)
</script>

<template>
  <button @click="current = FormTab">Form</button>
  <button @click="current = CounterTab">Counter</button>

  <KeepAlive>
    <component :is="current" />
  </KeepAlive>
</template>`;

const CACHED_VIEW_HOOKS = `onMounted(() => console.log('mounted once'))
onActivated(() => console.log('shown'))
onDeactivated(() => console.log('hidden'))`;

const KEEP_ALIVE_OPTIONS = `<KeepAlive include="FormTab" :max="5">
  <component :is="current" />
</KeepAlive>`;

// ===================================================================
// part 3 — async components
// ===================================================================

const ASYNC_COMPONENT = `<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

const HeavyChart = defineAsyncComponent(() => import('@/components/HeavyChart.vue'))
const showChart = ref(false)
</script>

<template>
  <button @click="showChart = true">Show chart</button>
  <HeavyChart v-if="showChart" />
</template>`;

const ASYNC_OPTIONS = `const HeavyChart = defineAsyncComponent({
  loader: () => import('@/components/HeavyChart.vue'),
  loadingComponent: LoadingSpinner, // shown while loading
  delay: 200,                       // only after 200 ms, avoids flicker
  errorComponent: LoadError,        // shown when loading fails
  timeout: 10000,                   // fail after 10 s
})`;

// ===================================================================
// part 4 — Transition
// ===================================================================

const VUE2_CLASSES = `/* Vue 2 */
.fade-enter, .fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }`;

const VUE3_CLASSES = `.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }`;

const TRANSITION_USE = `<Transition name="fade">
  <p v-if="show">Content</p>
</Transition>`;

export function BuiltInComponentsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Vue ships <Term>a few components that need no import</Term>:
                    Teleport, KeepAlive, Transition and TransitionGroup. Together with{" "}
                    <Code>defineAsyncComponent</Code> they control where content is
                    rendered, whether it survives being hidden, when its code is
                    loaded, and how it animates.
                </p>
            </div>

            {/* ---------- part 1 — Teleport ---------- */}
            <PartHeading kicker="part 1">Teleport</PartHeading>
            <div>
                <DocSection title="Rendering outside the component">
                    <p>
                        A modal belongs logically to the component that opens it, but
                        visually it must cover the whole page. Rendered inside nested
                        markup, its ancestors&apos; CSS interferes:{" "}
                        <Code>overflow: hidden</Code> on any ancestor (any element above
                        it in the DOM tree) clips it, a <Code>transform</Code> on an
                        ancestor makes <Code>position: fixed</Code> relative to that
                        ancestor instead of the viewport, and <Code>z-index</Code> stays
                        trapped in the ancestor&apos;s stacking context.
                    </p>
                    <p>Ancestor styles that break a nested modal:</p>
                    <CodeBlock code={ANCESTOR_STYLES} lang="css" />
                    <p>
                        <Code>{"<Teleport>"}</Code> renders its content at another place
                        in the DOM:
                    </p>
                    <CodeBlock code={TELEPORT_MODAL} lang="vue" />
                    <p>
                        Logically the content stays where it is written: it reads the
                        component&apos;s state, its events reach the component&apos;s
                        handlers, and <Code>provide</Code>/<Code>inject</Code> works.
                        Physically its DOM is appended to the target, outside every
                        ancestor&apos;s <Code>overflow</Code>, <Code>transform</Code> and{" "}
                        <Code>z-index</Code>.
                    </p>
                    <p>
                        <Code>to</Code> takes a CSS selector or an element. The target
                        must exist when the component mounts — <Code>body</Code> always
                        does; custom containers belong in <Code>index.html</Code>, outside{" "}
                        <Code>#app</Code>. <Code>{':disabled="true"'}</Code> renders the
                        content in place, for example a dialog that is inline on large
                        screens and teleported on small ones. Several teleports to one
                        target are appended in order.
                    </p>
                    <p>
                        A custom target in <Code>index.html</Code>:
                    </p>
                    <CodeBlock code={CUSTOM_TARGET} lang="html" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · Teleport is built in"
                    >
                        <p>
                            Vue 2 had no portal mechanism; libraries such as{" "}
                            <Code>portal-vue</Code> filled the gap. Vue 3 includes{" "}
                            <Code>{"<Teleport>"}</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — KeepAlive ---------- */}
            <PartHeading kicker="part 2">KeepAlive</PartHeading>
            <div>
                <DocSection title="Caching hidden views">
                    <p>
                        Switching views with <Code>{"<component :is>"}</Code> unmounts
                        the hidden one. Its state is lost — typed input, scroll position,
                        counters, fetched data — and returning mounts a fresh instance
                        that fetches again.
                    </p>
                    <p>
                        <Code>{"<KeepAlive>"}</Code> caches the instances instead:
                    </p>
                    <CodeBlock code={KEEP_ALIVE} lang="vue" />
                    <p>
                        Instead of unmounting, KeepAlive removes the hidden
                        component&apos;s DOM and keeps the instance; switching back
                        re-inserts it with its state. <Code>onMounted</Code> runs once;{" "}
                        <Code>onDeactivated</Code> runs each time the view is hidden and{" "}
                        <Code>onActivated</Code> each time it is shown, including the
                        first time (see Lifecycle &amp; Attrs).
                    </p>
                    <p>Inside a cached view:</p>
                    <CodeBlock code={CACHED_VIEW_HOOKS} lang="ts" />
                    <p>
                        Caching every view costs memory, and some views must always start
                        fresh.
                    </p>
                    <p>
                        <Code>include</Code> and <Code>exclude</Code> select cached
                        components by name; with <Code>{"<script setup>"}</Code> the name
                        is the file name or the name set with{" "}
                        <Code>defineOptions</Code>. <Code>max</Code> limits the cache to
                        the most recently used instances:
                    </p>
                    <CodeBlock code={KEEP_ALIVE_OPTIONS} lang="vue" />

                    <Callout
                        severity="trap"
                        label="trap · the cache dies with its KeepAlive"
                    >
                        <p>
                            When the KeepAlive itself unmounts — through a{" "}
                            <Code>v-if</Code> on it or on a parent — its whole cache is
                            discarded.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — async components ---------- */}
            <PartHeading kicker="part 3">Async components</PartHeading>
            <div>
                <DocSection title="Loading components on demand">
                    <p>
                        Every imported component is part of the main JavaScript bundle,
                        which the browser downloads before rendering. A heavy, rarely
                        used component — a chart, a rich-text editor, an admin dialog —
                        slows every page load, even for users who never open it.
                    </p>
                    <p>
                        <Code>defineAsyncComponent</Code> loads a component when it first
                        renders:
                    </p>
                    <CodeBlock code={ASYNC_COMPONENT} lang="vue" />
                    <p>
                        The dynamic <Code>import()</Code> makes the bundler put the
                        component into a separate file (chunk).{" "}
                        <Code>defineAsyncComponent</Code> returns a wrapper that downloads
                        the chunk on its first render and then renders the real component;
                        later renders reuse it. The request appears in the Network panel
                        only when the component is first shown, and a production build
                        lists the chunk as a separate file.
                    </p>
                    <p>
                        On a slow network the space stays empty while the chunk downloads,
                        and a failed download renders nothing.
                    </p>
                    <p>The options form adds loading and error states:</p>
                    <CodeBlock code={ASYNC_OPTIONS} lang="ts" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · wrap async components"
                    >
                        <p>
                            In Vue 2 a function returning <Code>import()</Code> could be
                            registered directly. In Vue 3 async components must be wrapped
                            with <Code>defineAsyncComponent</Code>. Lazy routes in Vue
                            Router still take a plain <Code>{"() => import(…)"}</Code>{" "}
                            (see Router Setup).
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — Transition ---------- */}
            <PartHeading kicker="part 4">Transition</PartHeading>
            <div>
                <DocSection title="Renamed transition classes">
                    <p>
                        Vue 2 transition CSS migrated unchanged still animates leaving,
                        but entering elements appear without animation and without an
                        error:
                    </p>
                    <CodeBlock code={VUE2_CLASSES} lang="css" />
                    <p>
                        <Code>.fade-enter</Code> no longer exists, so the entering element
                        never receives its start state and there is nothing to animate
                        from.
                    </p>
                    <p>Use the renamed start classes:</p>
                    <CodeBlock code={VUE3_CLASSES} lang="css" />
                    <p>The component that applies them:</p>
                    <CodeBlock code={TRANSITION_USE} lang="vue" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["Phase", "Vue 2", "Vue 3"]}
                        rows={[
                            ["enter start", "v-enter", "v-enter-from"],
                            ["enter active", "v-enter-active", "unchanged"],
                            ["enter end", "v-enter-to", "unchanged"],
                            ["leave start", "v-leave", "v-leave-from"],
                            ["leave active", "v-leave-active", "unchanged"],
                            ["leave end", "v-leave-to", "unchanged"],
                        ]}
                    />
                    <p>
                        <Code>v-</Code> is replaced by the transition&apos;s name. The new
                        names make enter and leave symmetric: each goes from{" "}
                        <Code>…-from</Code> to <Code>…-to</Code>.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · TransitionGroup has no wrapper"
                    >
                        <p>
                            <Code>{"<TransitionGroup>"}</Code> no longer renders a{" "}
                            <Code>{"<span>"}</Code> around its items by default. Set{" "}
                            <Code>{'tag="ul"'}</Code> (or another element) when a wrapper
                            is needed.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · Suspense">
                        <p>
                            <Code>{"<Suspense>"}</Code> renders a fallback while async
                            descendants load, including components with a top-level{" "}
                            <Code>await</Code> in <Code>{"<script setup>"}</Code>. Its API
                            is still marked experimental.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
