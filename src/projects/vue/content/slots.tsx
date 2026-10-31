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
    // --- part 1 (Default and named slots) ---
    // inline `vue 2 → 3 · old slot syntax removed` +
    // `vue 2 → 3 · $scopedSlots merged into $slots`
    "default-and-named-slots": ["difference"],

    // --- part 2 (Scoped slots) ---
    // inline `trap · name is reserved`
    "sending-data-to-the-parent": ["trap"],
    // inline `trap · don't mix both forms`
    "props-on-the-default-slot": ["trap"],

    // --- part 3 (Typing slots) ---
    // inline `trap · declare in the child, not the parent` +
    // `trap · never is not an empty slot` + `vue 2 → 3 · slots can be typed`
    "declaring-slots-with-slotstype": ["trap", "difference"],
    // inline `danger · the declaration is a promise` + `tip · when to declare`
    "what-slotstype-checks": ["danger", "tip"],
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
// 4. Every fragment declares its language: vue or ts.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — default and named slots
// ===================================================================

const BASE_CARD = `<section class="card">
  <header><slot name="header">Untitled</slot></header>
  <slot />
  <footer><slot name="footer" /></footer>
</section>`;

const BASE_CARD_USE = `<BaseCard>
  <template #header>Users</template>

  <p>Everything outside a template goes to the default slot.</p>

  <template #footer>
    <button @click="reload">Reload</button>
  </template>
</BaseCard>`;

// ===================================================================
// part 2 — scoped slots
// ===================================================================

const NO_SLOT_PROPS = `<UserTable :users="users">
  <strong>{{ user.name }}</strong>
  <!-- ❌ user does not exist here: it lives in the child's v-for -->
</UserTable>`;

const ITEM_SLOT_CHILD = `<li v-for="(u, i) in users" :key="u.id">
  <slot name="item" :user="u" :index="i">{{ u.name }}</slot>
</li>`;

const ITEM_SLOT_PARENT = `<UserTable :users="users">
  <template #item="{ user, index }">
    {{ index + 1 }}. <strong>{{ user.name }}</strong>
  </template>
</UserTable>`;

const MESSAGES_CHILD = `<slot name="messages" :messages="texts" :messages2="codes" />`;

const MESSAGES_PARENT = `<template #messages="{ messages, messages2 }">
  <p v-for="m in messages" :key="m">{{ m }}</p>
  <p>Codes: {{ messages2.join(', ') }}</p>
</template>`;

const DEFAULT_SLOT_CHILD = `<li v-for="(u, i) in users" :key="u.id">
  <slot :user="u" :index="i">{{ u.name }}</slot>
</li>`;

const V_SLOT_ON_COMPONENT = `<UserTable :users="users" v-slot="{ user, index }">
  {{ index + 1 }}. {{ user.name }}
</UserTable>`;

const DEFAULT_TEMPLATE = `<UserTable :users="users">
  <template #header>Team</template>
  <template #default="{ user, index }">
    {{ index + 1 }}. {{ user.name }}
  </template>
</UserTable>`;

// ===================================================================
// part 3 — typing slots
// ===================================================================

const SLOTS_TYPE = `import { defineComponent, type SlotsType } from 'vue'
import type { User } from '@/types/user'

export default defineComponent({
  slots: Object as SlotsType<{
    default: Record<string, never>
    header: Record<string, never>
    item: { user: User; index: number }
    messages: { messages: string[]; messages2: number[] }
  }>,
  computed: {
    hasCustomHeader(): boolean {
      return !!this.$slots.header
    },
  },
})`;

const HELLO_SLOT = `<script lang="ts">
import { defineComponent, type SlotsType } from 'vue'

export default defineComponent({
  name: 'HelloSlot',
  slots: Object as SlotsType<{
    default: { userName: string; age: number }
  }>,
})
</script>

<template>
  <slot userName="Ada" :age="36" />
</template>`;

const HELLO_SLOT_USE = `<HelloSlot v-slot="{ userName, age }">
  <p>{{ userName }} is {{ age }}</p>
</HelloSlot>`;

const HELLO_SLOT_ERRORS = `<HelloSlot v-slot="{ userNmae }" />
<!-- ❌ userNmae does not exist on the slot props -->

<HelloSlot v-slot="{ age }">{{ age.toUpperCase() }}</HelloSlot>
<!-- ❌ toUpperCase does not exist on type number -->`;

export function SlotsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Props pass data into a component; slots pass template content. A
                    slot can also send data back, so{" "}
                    <Term>
                        the child owns the data while the parent decides how it is
                        rendered
                    </Term>
                    .
                </p>
                <p>
                    This page covers default and named slots, scoped slots, and typing
                    slots in the Options API. The <Code>{"<script setup>"}</Code>{" "}
                    form, <Code>defineSlots</Code>, is covered on Compiler Macros.
                </p>
            </div>

            {/* ---------- part 1 — default and named slots ---------- */}
            <PartHeading kicker="part 1">Default and named slots</PartHeading>
            <div>
                <DocSection title="Default and named slots">
                    <p>
                        Some components need markup from the parent, not only data — a
                        card whose body is a form in one place and a list in another,
                        with a custom header. Passing HTML strings through props loses
                        components, events and reactivity.
                    </p>
                    <p>
                        The child marks places with <Code>{"<slot>"}</Code>; the parent
                        fills them with template content. The child,{" "}
                        <Code>BaseCard.vue</Code>:
                    </p>
                    <CodeBlock code={BASE_CARD} lang="vue" />
                    <p>
                        The parent fills the named slots with{" "}
                        <Code>{"<template #name>"}</Code>; everything else goes to the
                        default slot:
                    </p>
                    <CodeBlock code={BASE_CARD_USE} lang="vue" />
                    <p>
                        <Code>{"<slot />"}</Code> is the default slot.{" "}
                        <Code>{'<slot name="header">'}</Code> is a named slot, filled by{" "}
                        <Code>{"<template #header>"}</Code> (short for{" "}
                        <Code>v-slot:header</Code>). Content between the{" "}
                        <Code>{"<slot>"}</Code> tags is the fallback, rendered when the
                        parent provides nothing for that slot. Slot content is compiled
                        in the parent&apos;s scope: <Code>reload</Code> is the
                        parent&apos;s method.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · old slot syntax removed"
                    >
                        <p>
                            The <Code>slot=&quot;header&quot;</Code> attribute and{" "}
                            <Code>slot-scope</Code>, deprecated since 2.6, are removed.
                            Only <Code>v-slot</Code> / <Code>#</Code> is supported:{" "}
                            <Code>{"<template #header><h2>Users</h2></template>"}</Code>.
                        </p>
                    </Callout>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · $scopedSlots merged into $slots"
                    >
                        <p>
                            In render functions and script, every slot is a function —{" "}
                            <Code>this.$slots.header?.()</Code> — and{" "}
                            <Code>$scopedSlots</Code> no longer exists. Templates are
                            unaffected.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — scoped slots ---------- */}
            <PartHeading kicker="part 2">Scoped slots</PartHeading>
            <div>
                <DocSection title="Sending data to the parent">
                    <p>
                        Slot content only sees the parent&apos;s data. When the child
                        owns the data — a table looping over users — and the parent
                        wants to decide how each item looks, the parent cannot reach the
                        child&apos;s loop variable:
                    </p>
                    <CodeBlock code={NO_SLOT_PROPS} lang="vue" />
                    <p>
                        The child passes values to the slot as attributes (slot props);
                        the parent receives them as an object. The child:
                    </p>
                    <CodeBlock code={ITEM_SLOT_CHILD} lang="vue" />
                    <p>The parent:</p>
                    <CodeBlock code={ITEM_SLOT_PARENT} lang="vue" />
                    <p>
                        The child renders the slot once per item, each time with that
                        item&apos;s slot props. The parent&apos;s template receives the
                        props object and returns the markup: the data comes from the
                        child, the rendering decision from the parent. Without slot
                        content, the fallback is rendered. Parent data and methods
                        remain available next to the slot props, for example an{" "}
                        <Code>isAdmin(user)</Code> method of the parent.
                    </p>
                    <p>
                        A slot can pass several props; they all arrive in one object.
                        The child:
                    </p>
                    <CodeBlock code={MESSAGES_CHILD} lang="vue" />
                    <p>The parent:</p>
                    <CodeBlock code={MESSAGES_PARENT} lang="vue" />

                    <Callout severity="trap" label="trap · name is reserved">
                        <p>
                            <Code>name</Code> on a <Code>{"<slot>"}</Code> sets the
                            slot&apos;s name and cannot be used as a slot prop. Use
                            another key, such as <Code>userName</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Props on the default slot">
                    <p>
                        The default slot passes props like any named slot. The child:
                    </p>
                    <CodeBlock code={DEFAULT_SLOT_CHILD} lang="vue" />
                    <p>
                        When only the default slot is used, <Code>v-slot</Code> can sit
                        on the component itself:
                    </p>
                    <CodeBlock code={V_SLOT_ON_COMPONENT} lang="vue" />
                    <p>
                        Together with named slots, the default slot moves into{" "}
                        <Code>{"<template #default>"}</Code>:
                    </p>
                    <CodeBlock code={DEFAULT_TEMPLATE} lang="vue" />

                    <Callout severity="trap" label="trap · don't mix both forms">
                        <p>
                            <Code>v-slot</Code> on the component plus{" "}
                            <Code>{"<template #name>"}</Code> inside it is a compile
                            error. As soon as a named slot is used, use{" "}
                            <Code>{"<template #default>"}</Code> for the default slot.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — typing slots ---------- */}
            <PartHeading kicker="part 3">Typing slots</PartHeading>
            <div>
                <DocSection title="Declaring slots with SlotsType">
                    <p>
                        Slot props are a contract like props. Inside <Code>.vue</Code>{" "}
                        templates the Vue (Official) tooling infers slot prop types
                        from the child&apos;s <Code>{"<slot>"}</Code> tags. That is not
                        available when slots are used in the child&apos;s script (
                        <Code>this.$slots</Code>), in render functions or in components
                        written in <Code>.ts</Code> files, and it leaves the slot API
                        undeclared.
                    </p>
                    <p>
                        The <Code>slots</Code> option with <Code>SlotsType</Code> (Vue
                        3.3+) declares the slots in the child, like props and emits.
                        Each key is a slot name; its type is that slot&apos;s props
                        object:
                    </p>
                    <CodeBlock code={SLOTS_TYPE} lang="ts" />
                    <p>
                        Like <Code>PropType</Code>, it is a type-only cast;{" "}
                        <Code>Object</Code> does nothing at runtime. It types{" "}
                        <Code>this.$slots</Code> in the child and the slot props
                        received by the parent.{" "}
                        <Code>{"Record<string, never>"}</Code> declares a slot without
                        props.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · declare in the child, not the parent"
                    >
                        <p>
                            <Code>slots</Code> describes the slots a component renders.
                            Declared in the parent, it describes the parent&apos;s own
                            (unused) slots and checks nothing.
                        </p>
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · never is not an empty slot"
                    >
                        <p>
                            <Code>header: never</Code> means the slot cannot exist. Use{" "}
                            <Code>{"Record<string, never>"}</Code> for a slot without
                            props.
                        </p>
                    </Callout>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · slots can be typed"
                    >
                        <p>
                            Vue 2 had no way to type slot props. The <Code>slots</Code>{" "}
                            option with <Code>SlotsType</Code> is new in Vue 3.3;{" "}
                            <Code>{"<script setup>"}</Code> uses{" "}
                            <Code>defineSlots</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="What SlotsType checks">
                    <p>
                        The declaration types the parent side. With a child declaring{" "}
                        <Code>{"default: { userName: string; age: number }"}</Code>:
                    </p>
                    <CodeBlock code={HELLO_SLOT} lang="vue" />
                    <p>The parent:</p>
                    <CodeBlock code={HELLO_SLOT_USE} lang="vue" />
                    <p>
                        In the parent, an unknown slot prop and a wrong use of a
                        declared type are errors:
                    </p>
                    <CodeBlock code={HELLO_SLOT_ERRORS} lang="vue" />
                    <p>
                        The child&apos;s own <Code>{"<slot>"}</Code> tags are not
                        checked against the declaration in the Options API. Passing a
                        different type, or omitting a declared slot prop, produces no
                        error. The parent only knows the declaration, never the real
                        value.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_max-content_1fr]"
                        head={[
                            "Declared",
                            "Child actually passes",
                            "Parent writes",
                            "Result",
                        ]}
                        rows={[
                            [
                                "string",
                                "number",
                                "{{ x }}",
                                "no error; the number is rendered",
                            ],
                            [
                                "string",
                                "number",
                                "{{ x.toUpperCase() }}",
                                "no error; crashes at runtime",
                            ],
                            [
                                "number",
                                "number",
                                "{{ x.toUpperCase() }}",
                                "type error in the editor",
                            ],
                        ]}
                    />

                    <Callout
                        severity="danger"
                        label="danger · the declaration is a promise"
                    >
                        <p>
                            A wrong declaration misleads every parent: code compiles
                            against the declared type and fails at runtime. Keep the
                            declaration and the <Code>{"<slot>"}</Code> tags in sync by
                            hand.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · when to declare">
                        <p>
                            For ordinary <Code>.vue</Code> components, rely on the
                            inferred slot types — they always match the{" "}
                            <Code>{"<slot>"}</Code> tags. Declare <Code>SlotsType</Code>{" "}
                            when slots are used in script, in render functions or in{" "}
                            <Code>.ts</Code> components.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
