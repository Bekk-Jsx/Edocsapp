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
    // --- part 1 (Batched updates) ---
    // inline `vue 2 → 3 · nextTick is imported`
    "batched-updates-and-nexttick": ["difference"],

    // --- part 2 (From template to DOM) ---
    // inline `note · hand-written render functions` + `note · Vapor mode`
    "render-function-virtual-dom-and-patch": ["note"],
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

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. Every fragment declares its language: ts, vue or text. Component examples
//    use <script setup lang="ts">.
// 4. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 5. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — batched updates
// ===================================================================

const STALE_DOM = `const items = ref<string[]>([])
const list = useTemplateRef<HTMLUListElement>('list')

function add() {
  items.value.push(\`Item \${items.value.length + 1}\`)
  list.value!.scrollTop = list.value!.scrollHeight
  // ❌ the new <li> is not in the DOM yet — scrolls to the old bottom
}`;

const BATCHED_CHANGES = `count.value++
count.value++
count.value++
// one re-render with count + 3`;

const AWAIT_NEXT_TICK = `<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'

const items = ref<string[]>(['Item 1', 'Item 2', 'Item 3'])
const list = useTemplateRef<HTMLUListElement>('list')

async function add() {
  items.value.push(\`Item \${items.value.length + 1}\`)
  await nextTick()
  list.value!.scrollTop = list.value!.scrollHeight // ✅ the new <li> exists
}
</script>

<template>
  <button @click="add">Add</button>
  <ul ref="list" class="list">
    <li v-for="item in items" :key="item">{{ item }}</li>
  </ul>
</template>`;

// ===================================================================
// part 2 — from template to DOM
// ===================================================================

const PIPELINE = `template  ──(compiler, at build time)──▶  render function
render function  ──(each render)──▶  virtual DOM (plain JS objects)
new vs old virtual DOM  ──(patch)──▶  minimal real DOM changes`;

export function RenderingUnderTheHoodDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Vue <Term>does not update the DOM at the moment state changes</Term>,
                    and it does not rebuild the DOM on every render. Both facts explain
                    when the DOM is up to date and why rendering is fast.
                </p>
                <p>
                    This page covers only what affects everyday code: batched updates
                    with <Code>nextTick</Code>, and the path from template to DOM.
                </p>
            </div>

            {/* ---------- part 1 — batched updates ---------- */}
            <PartHeading kicker="part 1">Batched updates</PartHeading>
            <div>
                <DocSection title="Batched updates and nextTick">
                    <p>
                        Reading or changing the DOM directly after a state change sees
                        the old DOM:
                    </p>
                    <CodeBlock code={STALE_DOM} lang="ts" />
                    <p>
                        A state change does not re-render immediately. Vue schedules one
                        update for the end of the current tick, after the running code
                        finishes, so several changes produce a single DOM update:
                    </p>
                    <CodeBlock code={BATCHED_CHANGES} lang="ts" />
                    <p>
                        <Code>await nextTick()</Code> waits until the pending update has
                        been applied to the DOM:
                    </p>
                    <CodeBlock code={AWAIT_NEXT_TICK} lang="vue" />
                    <p>
                        <Code>nextTick</Code> is needed only for DOM access right after a
                        change; reactive state itself, such as{" "}
                        <Code>items.value.length</Code>, is always current. The Options
                        API uses <Code>this.$nextTick()</Code>.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · nextTick is imported"
                    >
                        <p>
                            The global <Code>Vue.nextTick</Code> becomes{" "}
                            <Code>{"import { nextTick } from 'vue'"}</Code>.{" "}
                            <Code>this.$nextTick()</Code> remains available in the Options
                            API.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — from template to DOM ---------- */}
            <PartHeading kicker="part 2">From template to DOM</PartHeading>
            <div>
                <DocSection title="Render function, virtual DOM and patch">
                    <p>Three steps turn a template into DOM:</p>
                    <CodeBlock code={PIPELINE} lang="text" />
                    <p>
                        The compiler turns <Code>{"<template>"}</Code> into a JavaScript
                        render function at build time; the browser never sees template
                        syntax. Each render runs that function, which returns a tree of
                        plain objects describing the UI — the virtual DOM — and reactive
                        reads during the run are tracked as dependencies. Vue compares the
                        new tree with the previous one and applies only the differences to
                        the real DOM; keys tell this comparison which old list item
                        corresponds to which new one.
                    </p>
                    <p>
                        Because the compiler sees the whole template, it marks what can
                        change. Elements without bindings are static: created once and
                        never compared again. Dynamic elements receive patch flags naming
                        what can change — only the text, only the class — so an update
                        checks those spots instead of diffing the whole tree. The generated
                        code, including flags such as <Code>{"/* TEXT */"}</Code> and{" "}
                        <Code>{"/* CLASS */"}</Code>, is visible in the JS output tab of
                        the Vue SFC Playground (<Code>play.vuejs.org</Code>).
                    </p>

                    <Callout
                        severity="note"
                        label="note · hand-written render functions"
                    >
                        <p>
                            Render functions written by hand with <Code>h()</Code> are
                            mainly used by libraries. Templates are usually faster, because
                            hand-written render functions get no compiler flags.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · Vapor mode">
                        <p>
                            Vue 3.6, currently a release candidate, adds Vapor mode: an
                            opt-in, per-component compile mode that produces direct DOM
                            operations without a virtual DOM. It is not stable yet.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
