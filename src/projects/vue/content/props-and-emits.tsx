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
    // --- part 1 (Typed props) ---
    // inline `vue 2 → 3 · props checked in parent templates`
    "typed-props-with-proptype": ["difference"],
    // inline `trap · PropType is compile-time only`
    "required-default-and-validator": ["trap"],

    // --- part 2 (Component events) ---
    // "how-component-events-work" carries no callout, so no entry.
    // inline `vue 2 → 3 · emits is new`
    "declaring-events-with-emits": ["difference"],
    // inline `vue 2 → 3 · $listeners and .native removed`
    "undeclared-listeners-fall-through": ["difference"],

    // --- part 3 (Function props and child methods) ---
    // inline `note · listeners are props under the hood` + `tip · emit by default`
    "function-props": ["note", "tip"],
    // inline `trap · refs exist only after mount` + `note · use refs sparingly` —
    // "Calling a child's methods" slugs to this id: the apostrophe becomes "-".
    "calling-a-child-s-methods": ["trap", "note"],
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
//    offending code, prefixed `// ❌ `.
// 4. Every fragment declares its language: vue, ts, html or text.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — typed props
// ===================================================================

const UNTYPED_PROP = `props: {
  user: Object,
},
computed: {
  label(): string {
    return this.user.nmae
    // no error: any key is accepted on an untyped object
  },
},`;

const PROP_TYPE = `import { defineComponent, type PropType } from 'vue'
import type { User } from '@/types/user'

export default defineComponent({
  props: {
    user: {
      type: Object as PropType<User>,
      required: true,
    },
  },
  computed: {
    label(): string {
      return this.user.nmae
      // ❌ Property 'nmae' does not exist on type 'User'
    },
  },
})`;

const LITERAL_PROP = `size: {
  type: String as PropType<'sm' | 'md' | 'lg'>,
  default: 'md',
},`;

const VALIDATOR_PROP = `size: {
  type: String as PropType<'sm' | 'md' | 'lg'>,
  default: 'md',
  validator: (v: string) => ['sm', 'md', 'lg'].includes(v),
},`;

// ===================================================================
// part 2 — component events
// ===================================================================

const DATA_FLOW = `Parent ──── props (data) ────▶ Child
Parent ◀─── events (emit) ──── Child`;

const EMIT_CHILD = `<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['increase'],
})
</script>

<template>
  <button @click="$emit('increase', 5)">+5</button>
</template>`;

const EMIT_PARENT = `<script lang="ts">
import { defineComponent } from 'vue'
import CounterButton from '@/components/CounterButton.vue'

export default defineComponent({
  components: { CounterButton },
  data() {
    return { total: 0 }
  },
  methods: {
    add(amount: number) {
      this.total += amount
    },
  },
})
</script>

<template>
  <p>Total: {{ total }}</p>
  <CounterButton @increase="add" />
</template>`;

const UNTYPED_EMIT = `this.$emit('ad', this.counter)   // typo: the parent never hears it
this.$emit('add', 'five')        // wrong payload type`;

const TYPED_EMITS = `emits: {
  add: (amount: number) => amount > 0,
},
methods: {
  send() {
    this.$emit('add', this.counter)  // ✅
    this.$emit('add', 'five')
    // ❌ 'string' is not assignable to parameter of type 'number'
    this.$emit('ad', this.counter)
    // ❌ '"ad"' is not assignable to parameter of type '"add"'
  },
},`;

const FALLTHROUGH_USE = `<CounterButton class="big" title="My counter" />`;

const FALLTHROUGH_OUTPUT = `<div class="counter big" title="My counter">…</div>`;

const CLICK_CHILD = `<!-- CounterButton.vue -->
<div class="counter">
  <button @click="$emit('click', counter)">Add to value</button>
</div>`;

const CLICK_PARENT = `<CounterButton @click="addToValue" />`;

const DOUBLE_CALL = `value: 0 → 5 → "5[object PointerEvent]"`;

const DECLARE_CLICK = `emits: {
  click: (amount: number) => true,
},`;

// ===================================================================
// part 3 — function props and child methods
// ===================================================================

const FUNCTION_PROP_CHILD = `<script lang="ts">
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  props: {
    onMinus: {
      type: Function as PropType<(amount: number) => void>,
      required: true,
    },
  },
  data() {
    return { counter: 5 }
  },
})
</script>

<template>
  <button @click="onMinus(counter)">Minus from value</button>
</template>`;

const FUNCTION_PROP_PARENT = `<CounterButton :on-minus="minusFromValue" />`;

const CAN_DELETE = `props: {
  canDelete: {
    type: Function as PropType<(id: number) => Promise<boolean>>,
    required: true,
  },
},
methods: {
  async remove(id: number) {
    if (await this.canDelete(id)) {
      // continue deleting
    }
  },
},`;

const CHILD_METHOD = `data() {
  return { counter: 5 }
},
methods: {
  changeCounter() {
    this.counter += 5
  },
},`;

const PARENT_REF = `<script lang="ts">
import { defineComponent } from 'vue'
import CounterButton from '@/components/CounterButton.vue'

export default defineComponent({
  components: { CounterButton },
  methods: {
    changeChildCounter() {
      const child = this.$refs.counterButton as InstanceType<typeof CounterButton>
      child.changeCounter()
    },
  },
})
</script>

<template>
  <button @click="changeChildCounter">Change counter</button>
  <CounterButton ref="counterButton" />
</template>`;

export function PropsAndEmitsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Term>Data flows down through props; notifications flow up through
                    events.</Term>{" "}
                    Vue 3 types both: props through <Code>PropType</Code>, events
                    through the <Code>emits</Code> option.
                </p>
                <p>
                    This page covers typed props, component events, the fallthrough of
                    undeclared listeners, function props, and calling a child&apos;s
                    methods from the parent.
                </p>
            </div>

            {/* ---------- part 1 — typed props ---------- */}
            <PartHeading kicker="part 1">Typed props</PartHeading>
            <div>
                <DocSection title="Typed props with PropType">
                    <p>
                        Runtime prop types such as <Code>Object</Code> or{" "}
                        <Code>Array</Code> say nothing about the shape. TypeScript
                        sees an untyped object, so typos and wrong shapes pass
                        unnoticed:
                    </p>
                    <CodeBlock code={UNTYPED_PROP} lang="ts" />
                    <p>
                        Keep the runtime constructor and cast it with{" "}
                        <Code>{"PropType<T>"}</Code>:
                    </p>
                    <CodeBlock code={PROP_TYPE} lang="ts" />
                    <p>
                        There are two separate checks. <Code>Object</Code> is the
                        runtime check — in development Vue warns when the parent passes
                        a non-object. <Code>{"as PropType<User>"}</Code> exists only at
                        compile time and gives TypeScript the exact shape. The runtime
                        check stays coarse; TypeScript performs the precise check,
                        inside the component and in the parent&apos;s template.
                    </p>
                    <p>The same cast narrows primitives:</p>
                    <CodeBlock code={LITERAL_PROP} lang="ts" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · props checked in parent templates"
                    >
                        <p>
                            <Code>PropType</Code> already existed for Vue 2 with
                            TypeScript. The Vue (Official) tooling now also checks props
                            in the parent&apos;s template: a wrong value, an unknown
                            literal or a missing required prop is a type error there.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="required, default and validator">
                    <p>
                        <Code>required</Code> and <Code>default</Code> change the
                        prop&apos;s type inside the component.
                    </p>
                    <GridTable
                        cols="grid-cols-[1fr_max-content]"
                        head={["Declaration", "Type of this.user"]}
                        rows={[
                            ["{ type: Object as PropType<User> }", "User | undefined"],
                            ["{ …, required: true }", "User"],
                            ["{ …, default: () => ({ id: 0, name: 'guest' }) }", "User"],
                        ]}
                    />
                    <p>
                        <Code>PropType</Code> only exists at compile time. At runtime, a
                        literal-union prop is only checked as a string, so values
                        coming from outside TypeScript (an API, a CMS) can still pass{" "}
                        <Code>{"'xl'"}</Code>.
                    </p>
                    <p>
                        A <Code>validator</Code> adds a runtime check; in development
                        Vue warns when it returns <Code>false</Code>:
                    </p>
                    <CodeBlock code={VALIDATOR_PROP} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · PropType is compile-time only"
                    >
                        <p>
                            TypeScript rejects <Code>size=&quot;xl&quot;</Code> in
                            templates, but at runtime only <Code>String</Code> is
                            checked. Add a <Code>validator</Code> when the exact value
                            matters.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — component events ---------- */}
            <PartHeading kicker="part 2">Component events</PartHeading>
            <div>
                <DocSection title="How component events work">
                    <p>
                        Props flow only from parent to child, and a child must not
                        change its props — they belong to the parent, and Vue warns and
                        overwrites the change on the next render. A child still needs a
                        way to tell the parent that something happened:
                    </p>
                    <CodeBlock code={DATA_FLOW} lang="text" />
                    <p>
                        The child announces an event with <Code>$emit</Code>; the
                        parent listens with <Code>@eventName</Code> and runs its own
                        method. Extra <Code>$emit</Code> arguments become the
                        handler&apos;s arguments. The child,{" "}
                        <Code>CounterButton.vue</Code>:
                    </p>
                    <CodeBlock code={EMIT_CHILD} lang="vue" />
                    <p>The parent registers its own method for the event:</p>
                    <CodeBlock code={EMIT_PARENT} lang="vue" />
                    <p>
                        The child does not call the parent. It fires an event on itself
                        without knowing who listens; Vue looks up the listener the
                        parent attached to that child and calls it. The parent then
                        changes its own state. Different parents can handle the same
                        event differently or ignore it.
                    </p>
                    <p>
                        Component events do not bubble — only the direct parent can
                        listen. Inline handlers receive the first payload argument as{" "}
                        <Code>$event</Code>:{" "}
                        <Code>@increase=&quot;total += $event&quot;</Code>.
                    </p>
                </DocSection>

                <DocSection title="Declaring events with emits">
                    <p>
                        Without a declaration, <Code>$emit</Code> accepts any event
                        name and any payload. A typo or a wrong payload compiles and
                        fails silently:
                    </p>
                    <CodeBlock code={UNTYPED_EMIT} lang="ts" />
                    <p>
                        The object form of <Code>emits</Code> declares each event with
                        a function whose parameters type the payload:
                    </p>
                    <CodeBlock code={TYPED_EMITS} lang="ts" />
                    <p>
                        TypeScript types <Code>$emit</Code> and the parent&apos;s{" "}
                        <Code>@add</Code> handler from the function&apos;s parameters.
                        At runtime the function is a validator: in development Vue
                        warns when it returns <Code>false</Code>, and the event is
                        still emitted. For types only, return <Code>true</Code>. The
                        array form, <Code>{"emits: ['add']"}</Code>, declares names
                        without payload types. Declared events are also excluded from
                        fallthrough (next section).
                    </p>

                    <Callout severity="difference" label="vue 2 → 3 · emits is new">
                        <p>
                            Vue 2.6 has no <Code>emits</Code> option. In Vue 3, every
                            emitted event should be declared.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Undeclared listeners fall through">
                    <p>
                        Attributes the parent sets on a component that the component
                        does not declare as props fall through to the component&apos;s
                        root element and are collected in <Code>this.$attrs</Code>:
                    </p>
                    <CodeBlock code={FALLTHROUGH_USE} lang="vue" />
                    <p>Rendered output:</p>
                    <CodeBlock code={FALLTHROUGH_OUTPUT} lang="html" />
                    <p>
                        In Vue 3 listeners are treated like attributes. A listener for
                        an event that is not declared in <Code>emits</Code> falls
                        through to the root element as a native DOM listener. For an
                        invented name such as <Code>add</Code> this is invisible,
                        because the browser never fires a native <Code>add</Code>{" "}
                        event. It breaks when the event name is also a DOM event (
                        <Code>click</Code>, <Code>input</Code>, <Code>change</Code>,{" "}
                        <Code>focus</Code>, <Code>submit</Code>). A child without{" "}
                        <Code>emits</Code>:
                    </p>
                    <CodeBlock code={CLICK_CHILD} lang="vue" />
                    <p>
                        The parent listens for <Code>click</Code>:
                    </p>
                    <CodeBlock code={CLICK_PARENT} lang="vue" />
                    <p>
                        One click on the inner button calls the handler twice: once
                        from <Code>$emit</Code> with the counter, and once as a native
                        click that bubbles from the button to the root{" "}
                        <Code>div</Code>, where the fallen-through listener receives a{" "}
                        <Code>PointerEvent</Code>:
                    </p>
                    <CodeBlock code={DOUBLE_CALL} lang="text" />
                    <p>
                        Declaring the event removes it from fallthrough; the root
                        element gets no native listener, and only <Code>$emit</Code>{" "}
                        reaches the parent:
                    </p>
                    <CodeBlock code={DECLARE_CLICK} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Parent writes", "Child declares it in", "Where it goes"]}
                        rows={[
                            ["class, title, …", "—", "root element (fallthrough)"],
                            [':count="…"', "props", "the prop"],
                            ['@add="…"', "emits", "component listener, called by $emit"],
                            ['@add="…"', "nowhere", "root element as a native listener"],
                        ]}
                    />
                    <p>
                        Disabling fallthrough with <Code>inheritAttrs: false</Code> is
                        covered on Lifecycle &amp; Attrs.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · $listeners and .native removed"
                    >
                        <p>
                            In Vue 2 listeners lived in <Code>$listeners</Code> and only
                            reached the root with <Code>.native</Code>. Vue 3 removes
                            both; undeclared listeners are part of <Code>$attrs</Code>{" "}
                            and fall through like attributes.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — function props and child methods ---------- */}
            <PartHeading kicker="part 3">Function props and child methods</PartHeading>
            <div>
                <DocSection title="Function props">
                    <p>A prop can hold a function; the child calls it directly:</p>
                    <CodeBlock code={FUNCTION_PROP_CHILD} lang="vue" />
                    <p>The parent passes its method as the prop:</p>
                    <CodeBlock code={FUNCTION_PROP_PARENT} lang="vue" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "emits", "Function prop"]}
                        rows={[
                            [
                                "Parent must provide it",
                                "no — emitting without a listener is fine",
                                "yes, or the child must check it",
                            ],
                            ["Child receives a return value", "no", "yes"],
                            ["Visible in the Vue DevTools timeline", "yes", "no"],
                            ["Vue convention", "yes", "no"],
                        ]}
                    />
                    <p>
                        A function prop fits when the child needs an answer from the
                        parent:
                    </p>
                    <CodeBlock code={CAN_DELETE} lang="ts" />

                    <Callout
                        severity="note"
                        label="note · listeners are props under the hood"
                    >
                        <p>
                            <Code>@minus=&quot;…&quot;</Code> compiles to a prop named{" "}
                            <Code>onMinus</Code>. A child that declares an{" "}
                            <Code>onMinus</Code> prop therefore also receives{" "}
                            <Code>@minus</Code> listeners as that prop. Use one style
                            per event, never both an emit and an <Code>on…</Code> prop
                            for the same name.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · emit by default">
                        <p>
                            Use events for &quot;something happened&quot; and a
                            function prop only when the child needs a return value.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Calling a child's methods">
                    <p>
                        Props and events move data and notifications. Some actions are
                        imperative and start in the parent — reset, focus, play,
                        increment the child&apos;s own counter — and there is no prop
                        change that expresses them.
                    </p>
                    <p>
                        A template ref gives the parent the child&apos;s instance; every
                        method of an Options API child can be called on it.{" "}
                        <Code>{"InstanceType<typeof Child>"}</Code> types the ref. The
                        child&apos;s methods, in <Code>CounterButton.vue</Code>:
                    </p>
                    <CodeBlock code={CHILD_METHOD} lang="ts" />
                    <p>The parent:</p>
                    <CodeBlock code={PARENT_REF} lang="vue" />
                    <p>
                        Inside <Code>v-for</Code>, a ref holds an array of instances
                        whose order is not guaranteed to match the source array —
                        suitable for &quot;all&quot; actions, not for access by index.
                    </p>

                    <Callout severity="trap" label="trap · refs exist only after mount">
                        <p>
                            <Code>$refs</Code> is empty until the child has rendered; it
                            is <Code>undefined</Code> in <Code>created</Code> and before
                            the first render.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · use refs sparingly">
                        <p>
                            Calling child methods couples the parent to the child&apos;s
                            internals. Prefer props down and events up for data. Refs in
                            setup code are covered on Template Refs.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
