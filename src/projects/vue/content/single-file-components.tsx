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
    // --- part 1 (Typing components) ---
    // inline `vue 2 → 3 · Vue.extend is gone`
    definecomponent: ["difference"],
    // inline `tip · always use defineComponent with ts`
    "plain-object-or-definecomponent": ["tip"],
    // "typing-data-computed-and-methods" carries no callout, so no entry.

    // --- part 2 (Type-checking .vue files) ---
    // inline `trap · the dev server ignores type errors`
    "who-checks-types": ["trap"],
    // inline `trap · no *.vue shim` — "Cannot find module './App.vue'" slugs to
    // this id: slug() turns the quotes, "./" and "." into "-".
    "cannot-find-module-app-vue": ["trap"],

    // --- part 3 (Scoped styles) ---
    // "scoped-styles" carries no callout, so no entry.
    // inline `vue 2 → 3 · deep selectors`
    "styling-inside-a-child-deep": ["difference"],
    // inline `vue 2 → 3 · slot content belongs to the parent`
    "styling-slot-content-slotted": ["difference"],
    // "one-global-rule-global" carries no callout, so no entry.

    // --- part 4 (Component state in CSS) ---
    // "v-bind-in-css" carries no callout, so no entry.
    // inline `trap · no automatic px`
    "expressions-and-units": ["trap"],
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
// 3. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed `// ❌ `.
// 4. Every fragment declares its language: vue, ts, css, json or js.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — typing components
// ===================================================================

const PLAIN_OPTIONS = `export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
      // ❌ count does not exist on the type of \`this\`
    },
  },
}`;

const DEFINE_COMPONENT = `import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++ // ✅ this.count: number
    },
  },
})`;

const NULL_START = `data() {
  return { user: null }
},
methods: {
  login(name: string) {
    this.user = { id: 1, name }
    // ❌ { id: number; name: string } is not assignable to null
  },
},`;

const NULL_CAST = `data() {
  return { user: null as User | null } // User | null
},`;

const COMPUTED_RETURN = `computed: {
  label(): string {
    return this.user?.name ?? 'guest'
  },
},`;

const METHOD_PARAMS = `methods: {
  increment(step: number) {
    this.count += step
  },
},`;

const USER_CARD = `<script lang="ts">
import { defineComponent } from 'vue'
import type { User } from '@/types/user'

export default defineComponent({
  name: 'UserCard',
  data() {
    return {
      count: 0,
      user: null as User | null,
    }
  },
  computed: {
    label(): string {
      return this.user?.name ?? 'guest'
    },
  },
  methods: {
    login(name: string) {
      this.user = { id: 1, name }
    },
    increment(step: number) {
      this.count += step
    },
  },
})
</script>

<template>
  <section class="card">
    <p>Hello, {{ label }} · clicks: {{ count }}</p>
    <button @click="login('Ada')">Login</button>
    <button @click="increment(1)">+1</button>
  </section>
</template>`;

// ===================================================================
// part 2 — type-checking .vue files
// ===================================================================

const BUILD_SCRIPTS = `"build": "run-p type-check \\"build-only {@}\\"",
"type-check": "vue-tsc --build"`;

// ===================================================================
// part 3 — scoped styles
// ===================================================================

const UNSCOPED_STYLE = `<!-- UserCard.vue -->
<style>
.card { border: 2px solid var(--accent); }
</style>`;

const SCOPED_STYLE = `<style scoped>
.card { border: 2px solid var(--accent); }
</style>`;

const SCOPED_COMPILED = `/* written */
.card { border: 2px solid var(--accent); }

/* compiled */
.card[data-v-7ba5bd90] { border: 2px solid var(--accent); }`;

const DEEP = `.card :deep(.title) { color: var(--accent); }
/* compiled: .card[data-v-7ba5bd90] .title */`;

const SLOTTED = `:slotted(p) { margin: 0; }`;

const GLOBAL = `:global(.no-scroll) { overflow: hidden; }`;

// ===================================================================
// part 4 — component state in CSS
// ===================================================================

const VUE2_CSS_VAR = `<section :style="{ '--accent': accent }" class="card">`;

const V_BIND_CSS = `<style scoped>
.card {
  padding: v-bind(padding);
}
.card:hover {
  border-color: v-bind(accent);
}
</style>`;

const V_BIND_EXPRESSION = `.card { color: v-bind('theme.primary'); }`;

const V_BIND_NO_UNIT = `/* size: 16 */
.card { padding: v-bind(size); }
/* ❌ becomes padding: 16 — invalid, ignored by the browser */`;

const V_BIND_UNIT = `computed: {
  padding(): string {
    return \`\${this.size}px\`
  },
},`;

export function SingleFileComponentsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A single-file component (<Code>.vue</Code>) holds a component&apos;s
                    template, script and styles in one file. Written with{" "}
                    <Code>lang=&quot;ts&quot;</Code>, the script is type-checked like
                    any TypeScript,{" "}
                    <Term>
                        as long as the component is typed correctly and the tooling
                        understands .vue files
                    </Term>
                    .
                </p>
                <p>
                    This page covers typing Options API components, how{" "}
                    <Code>.vue</Code> files are type-checked, scoped styles, and
                    binding component state into CSS.
                </p>
            </div>

            {/* ---------- part 1 — typing components ---------- */}
            <PartHeading kicker="part 1">Typing components</PartHeading>
            <div>
                <DocSection title="defineComponent">
                    <p>
                        Inside <Code>computed</Code>, <Code>methods</Code>,{" "}
                        <Code>watch</Code> and lifecycle hooks, <Code>this</Code> is
                        the component instance; it gives access to data, props,
                        computed and methods. TypeScript doesn&apos;t know that by
                        itself. In a plain object, <Code>this</Code> is typed as the
                        object literal, so members from <Code>data()</Code> don&apos;t
                        exist on it. A component options object in a{" "}
                        <Code>.ts</Code> file:
                    </p>
                    <CodeBlock code={PLAIN_OPTIONS} lang="ts" />
                    <p>
                        Wrapping the options in <Code>defineComponent</Code> tells
                        TypeScript the shape of <Code>this</Code>:
                    </p>
                    <CodeBlock code={DEFINE_COMPONENT} lang="ts" />
                    <p>
                        At runtime <Code>defineComponent</Code> returns the object it
                        receives, unchanged. It exists only for type inference.
                        TypeScript removes types but keeps the call, so the compiled
                        output still calls <Code>defineComponent</Code>, and that call
                        returns the same object a plain export would.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · Vue.extend is gone"
                    >
                        <p>
                            Vue 2 typed components with{" "}
                            <Code>{"Vue.extend({...})"}</Code> (Vue 2.7 also backported{" "}
                            <Code>defineComponent</Code>). Vue 3 uses{" "}
                            <Code>{"defineComponent({...})"}</Code>. Class components
                            are no longer maintained for Vue 3.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Plain object or defineComponent">
                    <p>
                        Both forms produce the same component at runtime. They differ
                        only in how much TypeScript can check.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["Situation", "Plain object", "defineComponent"]}
                        rows={[
                            [
                                "JavaScript",
                                "works fully, no type checking",
                                "adds nothing",
                            ],
                            ["TypeScript, no this used", "works", "works"],
                            [
                                "TypeScript, this used, in a .ts file",
                                "this untyped, fails to compile",
                                "typed",
                            ],
                            [
                                "TypeScript, this used, in a .vue file",
                                "typed, the Vue tooling wraps it in defineComponent internally",
                                "typed",
                            ],
                        ]}
                    />
                    <p>
                        The automatic wrapping only happens inside <Code>.vue</Code>{" "}
                        files and depends on the tooling.{" "}
                        <Code>defineComponent</Code> is explicit, works in{" "}
                        <Code>.ts</Code> files (render-function components, shared
                        option objects, tests), and is the documented form for the
                        Options API with TypeScript.
                    </p>

                    <Callout
                        severity="tip"
                        label="tip · always use defineComponent with ts"
                    >
                        <p>
                            It keeps every component consistent and typed, wherever it
                            lives.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Typing data, computed and methods">
                    <p>
                        <Code>defineComponent</Code> infers most types from the
                        options. Three places need help, and each fixes a specific
                        problem.
                    </p>
                    <p>
                        A field that starts as <Code>null</Code> is inferred as type{" "}
                        <Code>null</Code>, so it can never hold a value:
                    </p>
                    <CodeBlock code={NULL_START} lang="ts" />
                    <p>Cast the initial value to the full type:</p>
                    <CodeBlock code={NULL_CAST} lang="ts" />
                    <p>
                        Computeds read <Code>this</Code>, and <Code>this</Code>{" "}
                        includes the computeds themselves. This circular reference can
                        break inference and turn members into <Code>any</Code>. An
                        explicit return type on every computed prevents it:
                    </p>
                    <CodeBlock code={COMPUTED_RETURN} lang="ts" />
                    <p>
                        Method parameters have no context to infer from, so under{" "}
                        <Code>strict</Code> they are implicit <Code>any</Code> errors.
                        Type them as in any function:
                    </p>
                    <CodeBlock code={METHOD_PARAMS} lang="ts" />
                    <p>
                        A complete typed component, with the <Code>User</Code> type
                        imported from a shared file:
                    </p>
                    <CodeBlock code={USER_CARD} lang="vue" />
                </DocSection>
            </div>

            {/* ---------- part 2 — type-checking .vue files ---------- */}
            <PartHeading kicker="part 2">Type-checking .vue files</PartHeading>
            <div>
                <DocSection title="Who checks types">
                    <p>
                        A type error in a <Code>.vue</Code> file does not stop the app
                        from running. Three tools process <Code>.vue</Code> files, and
                        only two of them check types.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Tool", "What it does with types"]}
                        rows={[
                            [
                                "Vite (dev server and build)",
                                "strips them with esbuild, without checking",
                            ],
                            [
                                "Editor with the Vue (Official) extension",
                                "checks them live",
                            ],
                            [
                                "vue-tsc (npm run type-check)",
                                "checks them on the command line, for builds and CI",
                            ],
                        ]}
                    />
                    <p>
                        Plain <Code>tsc</Code> cannot read <Code>.vue</Code> files.{" "}
                        <Code>vue-tsc</Code> is <Code>tsc</Code> with Vue support.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the dev server ignores type errors"
                    >
                        <p>
                            Vite never checks types. With a type error the dev server
                            keeps running and the page works; the error shows up only
                            in the editor and in <Code>vue-tsc</Code>.
                        </p>
                    </Callout>

                    <p>
                        create-vue projects run the type check as part of the build,
                        in parallel with the Vite build, so a type error fails the
                        build:
                    </p>
                    <CodeBlock code={BUILD_SCRIPTS} lang="json" />
                </DocSection>

                <DocSection title="Cannot find module './App.vue'">
                    <p>
                        The editor reports &quot;Cannot find module
                        &apos;./App.vue&apos; or its corresponding type
                        declarations.&quot; on <Code>.vue</Code> imports, while the app
                        runs fine. The editor&apos;s TypeScript server does not
                        understand <Code>.vue</Code> files on its own.
                    </p>
                    <p>
                        Install the Vue (Official) extension (formerly Volar), disable
                        the old Vetur extension (the two conflict), and restart the
                        TypeScript server.
                    </p>

                    <Callout severity="trap" label="trap · no *.vue shim">
                        <p>
                            Declaring <Code>{"declare module '*.vue'"}</Code> in{" "}
                            <Code>env.d.ts</Code> silences the error, but it types
                            every component as a generic <Code>DefineComponent</Code>,
                            so all prop and emit checking is lost. The extension is the
                            real fix.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — scoped styles ---------- */}
            <PartHeading kicker="part 3">Scoped styles</PartHeading>
            <div>
                <DocSection title="Scoped styles">
                    <p>
                        Every <Code>{"<style>"}</Code> block of every component ends up
                        in one global stylesheet. A class in one component styles
                        every element with that class in the whole app, and when two
                        components style the same class, the one loaded last wins:
                    </p>
                    <CodeBlock code={UNSCOPED_STYLE} lang="vue" />
                    <p>
                        Any other component using <Code>class=&quot;card&quot;</Code>{" "}
                        gets this border too.
                    </p>
                    <p>
                        The <Code>scoped</Code> attribute limits the styles to this
                        component&apos;s own template:
                    </p>
                    <CodeBlock code={SCOPED_STYLE} lang="vue" />
                    <p>
                        Vue gives the component a hash, adds it as an attribute to
                        every element in its template, and rewrites every selector to
                        require that attribute:
                    </p>
                    <CodeBlock code={SCOPED_COMPILED} lang="css" />
                    <p>
                        A child component&apos;s root element carries both the
                        child&apos;s and the parent&apos;s hash, so a parent can style a
                        child&apos;s root element but nothing inside it.
                    </p>
                </DocSection>

                <DocSection title="Styling inside a child: :deep()">
                    <p>
                        Elements inside a child component don&apos;t carry the
                        parent&apos;s hash, so a scoped parent rule targeting them never
                        matches (for example, styling the inner input of a library
                        component).
                    </p>
                    <p>
                        <Code>:deep()</Code> keeps the hash on the outer part of the
                        selector and drops it from the inner part:
                    </p>
                    <CodeBlock code={DEEP} lang="css" />

                    <Callout severity="difference" label="vue 2 → 3 · deep selectors">
                        <p>
                            <Code>{">>>"}</Code>, <Code>/deep/</Code> and{" "}
                            <Code>::v-deep</Code> are deprecated. Use the function form{" "}
                            <Code>:deep(.title)</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Styling slot content: :slotted()">
                    <p>
                        Content passed into a slot belongs to the parent and carries
                        the parent&apos;s hash, so the child&apos;s scoped styles
                        don&apos;t reach it.
                    </p>
                    <p>
                        <Code>:slotted()</Code> in the child targets slot content:
                    </p>
                    <CodeBlock code={SLOTTED} lang="css" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · slot content belongs to the parent"
                    >
                        <p>
                            In Vue 2, a child&apos;s scoped styles also applied to slot
                            content. In Vue 3 they don&apos;t, and{" "}
                            <Code>:slotted()</Code> is needed.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="One global rule: :global()">
                    <p>
                        Sometimes a single rule must not be scoped, for example a class
                        toggled on <Code>{"<body>"}</Code>. Adding a second, unscoped{" "}
                        <Code>{"<style>"}</Code> block only for that rule splits the
                        styles.
                    </p>
                    <p>
                        <Code>:global()</Code> opts one rule out of scoping inside a
                        scoped block:
                    </p>
                    <CodeBlock code={GLOBAL} lang="css" />
                </DocSection>
            </div>

            {/* ---------- part 4 — component state in CSS ---------- */}
            <PartHeading kicker="part 4">Component state in CSS</PartHeading>
            <div>
                <DocSection title="v-bind() in CSS">
                    <p>
                        A style value that comes from component state (a user-picked
                        color, a size) can be set with inline <Code>:style</Code>, but
                        inline styles cannot reach <Code>:hover</Code>,{" "}
                        <Code>::before</Code> or media queries, and they must be
                        repeated on every element. In Vue 2 the workaround was setting
                        a CSS variable by hand on the root element:
                    </p>
                    <CodeBlock code={VUE2_CSS_VAR} lang="vue" />
                    <p>
                        <Code>v-bind()</Code> reads component state directly inside{" "}
                        <Code>{"<style>"}</Code>:
                    </p>
                    <CodeBlock code={V_BIND_CSS} lang="vue" />
                    <p>
                        Each <Code>v-bind()</Code> compiles to a hashed CSS variable,
                        such as <Code>var(--7ba5bd90-accent)</Code>. Vue sets these
                        variables as inline styles on the component&apos;s root element
                        and updates only the variable when the state changes. The
                        stylesheet itself never changes.
                    </p>
                </DocSection>

                <DocSection title="Expressions and units">
                    <p>Paths and JavaScript expressions must be quoted:</p>
                    <CodeBlock code={V_BIND_EXPRESSION} lang="css" />
                    <p>The bound value is inserted as-is; no unit is added:</p>
                    <CodeBlock code={V_BIND_NO_UNIT} lang="css" />
                    <p>
                        Bind a string that includes the unit, typically from a
                        computed:
                    </p>
                    <CodeBlock code={V_BIND_UNIT} lang="ts" />

                    <Callout severity="trap" label="trap · no automatic px">
                        <p>
                            A number bound with <Code>v-bind()</Code> produces invalid
                            CSS for properties that need units, and the browser ignores
                            the declaration silently.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
