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
    // --- part 1 (Lifecycle hooks) ---
    // inline `vue 2 → 3 · destroy → unmount`
    "renamed-hooks": ["difference"],
    // inline `trap · no state changes in updated`
    updated: ["trap"],
    // "activated-and-deactivated" carries no callout, so no entry.
    // inline `note · what it does not catch`
    errorcaptured: ["note"],

    // --- part 2 (Fallthrough attributes) ---
    // inline `trap · v-bind without inheritAttrs: false duplicates` +
    // `vue 2 → 3 · class and style are in $attrs` — "$" slugs to "-".
    "inheritattrs-and-attrs": ["trap", "difference"],

    // --- part 3 (Multi-root components) ---
    // inline `vue 2 → 3 · multiple roots allowed`
    "multiple-root-nodes": ["difference"],
    // inline `tip · the rule`
    "choosing-v-bind-and-inheritattrs": ["tip"],
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
// 4. Every fragment declares its language: ts, vue, html or text.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. A comparison shows the codes side by side in the container-query pair
//    grid, and each column opens with a one-line <Term> label.
// 7. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — lifecycle hooks
// ===================================================================

const DESTROYED_HOOK = `mounted() {
  this.timer = setInterval(() => console.log('tick'), 1000)
},
destroyed() {
  clearInterval(this.timer) // ❌ never runs in Vue 3
},`;

const UNMOUNTED_HOOK = `unmounted() {
  clearInterval(this.timer)
},`;

const UPDATED_HOOK = `data() {
  return { messages: [] as string[] }
},
updated() {
  const box = this.$refs.box as HTMLElement
  box.scrollTop = box.scrollHeight
},`;

const DYNAMIC_STEP = `<component :is="steps[current]" />`;

const KEEP_ALIVE_STEP = `<KeepAlive>
  <component :is="steps[current]" />
</KeepAlive>`;

const ERROR_BOUNDARY = `<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ErrorBoundary',
  data() {
    return { error: null as string | null }
  },
  errorCaptured(err: unknown) {
    this.error = err instanceof Error ? err.message : String(err)
    return false
  },
})
</script>

<template>
  <p v-if="error">Something went wrong: {{ error }}</p>
  <slot v-else />
</template>`;

const ERROR_BOUNDARY_USE = `<ErrorBoundary>
  <UserWidget />
</ErrorBoundary>`;

// ===================================================================
// part 2 — fallthrough attributes
// ===================================================================

const BASE_INPUT_USE = `<BaseInput label="Email" type="email" placeholder="you@mail.com" class="wide" @focus="onFocus" />`;

const WRONG_ELEMENT = `<label class="wide" type="email" placeholder="you@mail.com">  <!-- ❌ wrong element -->
  Email <input />                                             <!-- ❌ receives nothing -->
</label>`;

const BASE_INPUT = `<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BaseInput',
  inheritAttrs: false,
  props: {
    label: { type: String, required: true },
  },
})
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <input v-bind="$attrs" />
  </label>
</template>`;

const V_BIND_OBJECT = `<input v-bind="{ type: 'email', placeholder: 'you@mail.com' }" />
<!-- same as -->
<input :type="'email'" :placeholder="'you@mail.com'" />`;

// ===================================================================
// part 3 — multi-root components
// ===================================================================

const WRAPPER_ROOT = `<div>
  <dt>{{ term }}</dt>
  <dd>{{ value }}</dd>
</div>`;

const WRAPPER_OUTPUT = `<dl class="info">  <!-- grid-template-columns: max-content 1fr -->
  <div><dt>Name</dt><dd>Ada Lovelace</dd></div>
  <div><dt>Role</dt><dd>Engineer</dd></div>
</dl>`;

const FRAGMENT_ROOT = `<template>
  <dt>{{ term }}</dt>
  <dd>{{ value }}</dd>
</template>`;

const FRAGMENT_OUTPUT = `<dl class="info">
  <dt>Name</dt><dd>Ada Lovelace</dd>
  <dt>Role</dt><dd>Engineer</dd>
</dl>`;

const FRAGMENT_WARNING = `[Vue warn]: Extraneous non-props attributes (class) were passed to component
but could not be automatically inherited because component renders fragment
or text or teleport root nodes.`;

const FRAGMENT_ATTRS = `<template>
  <dt v-bind="$attrs">{{ term }}</dt>
  <dd>{{ value }}</dd>
</template>`;

const SHAPE_A = `<template>
  <input type="search" />
</template>`;

const SHAPE_B = `<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  inheritAttrs: false,
})
</script>

<template>
  <label>
    <span>Search</span>
    <input type="search" v-bind="$attrs" />
  </label>
</template>`;

const SHAPE_C = `<template>
  <label for="search">Search</label>
  <input id="search" type="search" v-bind="$attrs" />
</template>`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings the typescript pages use, so they all split at the same width. With
// three columns the third wraps below the first two.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function LifecycleAndAttrsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Most lifecycle hooks are unchanged from Vue 2; the two destroy
                    hooks are renamed. Attribute handling changed more:{" "}
                    <Term>
                        class, style and listeners are now part of <Code>$attrs</Code>
                    </Term>
                    , and components may render several root nodes.
                </p>
                <p>
                    This page covers the lifecycle hooks, fallthrough attributes and
                    multi-root components.
                </p>
            </div>

            {/* ---------- part 1 — lifecycle hooks ---------- */}
            <PartHeading kicker="part 1">Lifecycle hooks</PartHeading>
            <div>
                <DocSection title="Renamed hooks">
                    <p>
                        Cleanup written in <Code>beforeDestroy</Code> or{" "}
                        <Code>destroyed</Code> no longer runs in Vue 3. The component
                        unmounts, the cleanup is skipped and, for example, an interval
                        keeps running — a leak with no runtime error:
                    </p>
                    <CodeBlock code={DESTROYED_HOOK} lang="ts" />
                    <p>Use the renamed hooks:</p>
                    <CodeBlock code={UNMOUNTED_HOOK} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Vue 2", "Vue 3"]}
                        rows={[
                            ["beforeCreate, created", "unchanged"],
                            ["beforeMount, mounted", "unchanged"],
                            ["beforeUpdate, updated", "unchanged"],
                            ["beforeDestroy", "beforeUnmount"],
                            ["destroyed", "unmounted"],
                            ["activated, deactivated", "unchanged (KeepAlive)"],
                            ["errorCaptured", "unchanged"],
                        ]}
                    />
                    <p>
                        The names describe what happens: the component is unmounted
                        from the DOM. <Code>renderTracked</Code> and{" "}
                        <Code>renderTriggered</Code> are new debugging hooks, covered on
                        Vue DevTools.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · destroy → unmount"
                    >
                        <p>
                            <Code>beforeDestroy</Code> → <Code>beforeUnmount</Code>,{" "}
                            <Code>destroyed</Code> → <Code>unmounted</Code>.{" "}
                            <Code>this.$destroy()</Code> is removed.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="updated">
                    <p>
                        <Code>updated</Code> runs after the component has re-rendered
                        because reactive data changed; the DOM already shows the new
                        state. It suits work that needs the updated DOM, such as
                        measuring or scrolling:
                    </p>
                    <CodeBlock code={UPDATED_HOOK} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · no state changes in updated"
                    >
                        <p>
                            Changing state in <Code>updated</Code> causes another render
                            and another <Code>updated</Code> call — an endless loop. To
                            react to a specific value, use <Code>watch</Code>;{" "}
                            <Code>updated</Code> fires on every re-render of the
                            component.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="activated and deactivated">
                    <p>
                        Switching between views — the steps of a stepper, tabs —
                        unmounts the hidden view and loses its state, such as filled-in
                        form fields.
                    </p>
                    <p>
                        Without <Code>KeepAlive</Code>, the old step is unmounted and
                        the new one mounted:
                    </p>
                    <CodeBlock code={DYNAMIC_STEP} lang="vue" />
                    <p>
                        <Code>KeepAlive</Code> caches hidden views instead of unmounting
                        them. Their state is kept, and two hooks report visibility:
                    </p>
                    <CodeBlock code={KEEP_ALIVE_STEP} lang="vue" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["Event", "Without KeepAlive", "With KeepAlive"]}
                        rows={[
                            ["First shown", "mounted", "mounted + activated"],
                            ["Hidden", "unmounted", "deactivated"],
                            [
                                "Shown again",
                                "mounted (fresh state)",
                                "activated (state kept)",
                            ],
                        ]}
                    />
                    <p>
                        In a cached view, <Code>mounted</Code> runs once for one-time
                        setup; <Code>activated</Code> runs every time the view becomes
                        visible (refresh data, focus an input);{" "}
                        <Code>deactivated</Code> runs every time it is hidden (pause a
                        timer, stop polling). <Code>KeepAlive</Code> itself is covered on
                        Built-in Components.
                    </p>
                </DocSection>

                <DocSection title="errorCaptured">
                    <p>
                        An error thrown in one component&apos;s render or hooks can
                        break the whole page.
                    </p>
                    <p>
                        <Code>errorCaptured</Code> catches errors thrown by descendants.
                        A component using it acts as an error boundary and can render a
                        fallback:
                    </p>
                    <CodeBlock code={ERROR_BOUNDARY} lang="vue" />
                    <p>
                        Wrapped content that throws is replaced by the message; the rest
                        of the page keeps working:
                    </p>
                    <CodeBlock code={ERROR_BOUNDARY_USE} lang="vue" />
                    <p>
                        The hook receives the error, the component instance that threw,
                        and an info string naming where it happened (render function, a
                        lifecycle hook, a watcher, an event handler). It catches errors
                        from descendants in render, lifecycle hooks, watchers, event
                        handlers and <Code>setup()</Code>, including rejected promises
                        returned from hooks and handlers. Returning <Code>false</Code>{" "}
                        stops propagation; otherwise the error continues to
                        ancestors&apos; <Code>errorCaptured</Code> hooks and to{" "}
                        <Code>app.config.errorHandler</Code>.
                    </p>

                    <Callout severity="note" label="note · what it does not catch">
                        <p>
                            Errors in the component itself (only descendants are
                            covered) and errors in code Vue does not call, such as a
                            bare <Code>setTimeout</Code> callback.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — fallthrough attributes ---------- */}
            <PartHeading kicker="part 2">Fallthrough attributes</PartHeading>
            <div>
                <DocSection title="inheritAttrs and $attrs">
                    <p>
                        Everything a parent passes that the component does not declare
                        as a prop or emit is collected in <Code>this.$attrs</Code> and,
                        by default, applied to the component&apos;s root element.
                        Declared props never appear in <Code>$attrs</Code>.
                    </p>
                    <p>
                        When the element that should receive the attributes is not the
                        root — an input wrapped in a label — they land on the wrong
                        element. The parent:
                    </p>
                    <CodeBlock code={BASE_INPUT_USE} lang="vue" />
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Parent passes", "Declared?", "Goes to"]}
                        rows={[
                            ['label="Email"', "yes, in props", "this.label"],
                            ['type="email"', "no", "$attrs"],
                            ['placeholder="…"', "no", "$attrs"],
                            ['class="wide"', "no", "$attrs"],
                            [
                                '@focus="onFocus"',
                                "no, not in emits",
                                "$attrs (as onFocus)",
                            ],
                        ]}
                    />
                    <p>Rendered without changes:</p>
                    <CodeBlock code={WRONG_ELEMENT} lang="html" />
                    <p>
                        <Code>inheritAttrs: false</Code> stops the automatic
                        fallthrough; <Code>v-bind=&quot;$attrs&quot;</Code> applies the
                        attributes to the chosen element:
                    </p>
                    <CodeBlock code={BASE_INPUT} lang="vue" />
                    <p>
                        <Code>v-bind</Code> without an argument takes an object and
                        binds every key as its own attribute, like a spread; keys
                        starting with <Code>on</Code> become event listeners:
                    </p>
                    <CodeBlock code={V_BIND_OBJECT} lang="vue" />

                    <Callout
                        severity="trap"
                        label="trap · v-bind without inheritAttrs: false duplicates"
                    >
                        <p>
                            With only <Code>v-bind=&quot;$attrs&quot;</Code> on the inner
                            element, the attributes land on the root (automatic) and on
                            the inner element (manual); listeners fire twice.
                        </p>
                    </Callout>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · class and style are in $attrs"
                    >
                        <p>
                            In Vue 2 <Code>class</Code> and <Code>style</Code> always
                            stayed on the root, even with <Code>inheritAttrs: false</Code>
                            . In Vue 3 they are ordinary entries of <Code>$attrs</Code>{" "}
                            and move with <Code>v-bind=&quot;$attrs&quot;</Code>.
                            Listeners are part of <Code>$attrs</Code> too (
                            <Code>$listeners</Code> is removed; see Props &amp; Emits).
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — multi-root components ---------- */}
            <PartHeading kicker="part 3">Multi-root components</PartHeading>
            <div>
                <DocSection title="Multiple root nodes">
                    <p>
                        Vue 2 required exactly one root element. Components producing
                        several siblings needed a wrapper, which breaks layouts that
                        depend on direct children: CSS grid and flex, table rows,{" "}
                        <Code>{"<dl>"}</Code> lists:
                    </p>
                    <CodeBlock code={WRAPPER_ROOT} lang="vue" />
                    <p>
                        A grid only places its direct children. With the wrapper, the{" "}
                        <Code>{"<dl>"}</Code> has one child per row component instead of
                        a <Code>dt</Code> and a <Code>dd</Code>, and the columns no
                        longer line up:
                    </p>
                    <CodeBlock code={WRAPPER_OUTPUT} lang="html" />
                    <p>
                        Vue 3 components may render several root nodes (a fragment). The
                        siblings are inserted directly into the parent&apos;s layout:
                    </p>
                    <CodeBlock code={FRAGMENT_ROOT} lang="vue" />
                    <p>Rendered:</p>
                    <CodeBlock code={FRAGMENT_OUTPUT} lang="html" />
                    <p>
                        With several roots there is no automatic fallthrough, because
                        Vue cannot choose a root. Attributes passed by the parent are
                        dropped, and Vue warns:
                    </p>
                    <CodeBlock code={FRAGMENT_WARNING} lang="text" />
                    <p>
                        Binding <Code>$attrs</Code> to one root resolves it;{" "}
                        <Code>inheritAttrs: false</Code> is not needed:
                    </p>
                    <CodeBlock code={FRAGMENT_ATTRS} lang="vue" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · multiple roots allowed"
                    >
                        <p>
                            Vue 3 allows several root nodes. Attributes then do not fall
                            through automatically and must be bound with{" "}
                            <Code>v-bind=&quot;$attrs&quot;</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Choosing v-bind and inheritAttrs">
                    <p>
                        The parent call is the same in each case:{" "}
                        <Code>
                            {'<SearchField placeholder="Search users" class="wide" />'}
                        </Code>
                        , with no props declared. The attributes must reach the input:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>A · one root, the target</Term>
                                </p>
                                <CodeBlock code={SHAPE_A} lang="vue" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>B · one root, target inside</Term>
                                </p>
                                <CodeBlock code={SHAPE_B} lang="vue" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>C · several roots</Term>
                                </p>
                                <CodeBlock code={SHAPE_C} lang="vue" />
                            </div>
                        </div>
                    </div>
                    <p>What each shape needs:</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_max-content_1fr_max-content]"
                        head={[
                            "Child shape",
                            "Automatic fallthrough goes to",
                            "Problem",
                            'v-bind="$attrs"',
                            "inheritAttrs: false",
                        ]}
                        rows={[
                            ["A · one root = target", "the target", "no", "no", "no"],
                            [
                                "B · one root, target inside",
                                "the wrong root",
                                "yes",
                                "yes, on the target",
                                "yes",
                            ],
                            [
                                "C · several roots",
                                "nowhere, with a warning",
                                "yes",
                                "yes, on the target",
                                "no",
                            ],
                        ]}
                    />

                    <Callout severity="tip" label="tip · the rule">
                        <p>
                            <Code>v-bind=&quot;$attrs&quot;</Code> chooses where
                            attributes go; <Code>inheritAttrs: false</Code> is needed
                            only when there is one root and it is not that place.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
