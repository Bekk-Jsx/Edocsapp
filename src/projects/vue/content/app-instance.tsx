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
    // --- part 1 (createApp vs new Vue) ---
    // "an-app-instance-not-a-global-constructor" carries no callout, so no entry.
    // inline `vue 2 → 3 · no global vue`
    "global-api-mapping": ["difference"],

    // --- part 2 (Registering on the app) ---
    // inline `vue 2 → 3 · install gets the app`
    plugins: ["difference"],
    // inline `vue 2 → 3 · directive hooks renamed` + `tip · type global components`
    "global-components-and-directives": ["difference", "tip"],
    // "app-level-provide" carries no callout, so no entry.

    // --- part 3 (Mounting) ---
    // inline `vue 2 → 3 · the container is kept`
    "mounting-into-a-container": ["difference"],
    // inline `trap · mount ends the chain`
    "what-mount-returns": ["trap"],
    // inline `trap · register before mount`
    "configure-before-mounting": ["trap"],

    // --- part 4 (Global properties) ---
    // inline `vue 2 → 3 · prototype replaced` — "app.config.globalProperties"
    // slugs to this id: slug() turns each "." into "-".
    "app-config-globalproperties": ["difference"],
    // inline `danger · the file must be a module`
    "typing-global-properties": ["danger"],
    // inline `main vs setup · no this in setup`
    "global-properties-and-setup": ["difference"],
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

// PAGE RULES — those of the typescript pages, adapted to Vue:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed `// ❌ `. Where a contrast helps, a passing line
//    is followed by `// ✅`.
// 3. Every fragment declares its language: js for Vue 2 code, ts for the rest.
// 4. Differences are inline Callouts with severity "difference" and one of two
//    label prefixes: "vue 2 → 3 · …" or "main vs setup · …".
// 5. A comparison shows both codes side by side in the container-query pair
//    grid, and each column opens with a one-line <Term> label.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — createApp vs new Vue
// ===================================================================

const VUE2_GLOBAL = `import Vue from 'vue'

Vue.use(VueRouter)
Vue.component('BaseButton', BaseButton)
Vue.prototype.$http = axios

new Vue({ router, render: h => h(App) }).$mount('#app')`;

const VUE3_APP = `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(router)
app.component('BaseButton', BaseButton)
app.mount('#app')`;

// ===================================================================
// part 2 — registering on the app
// ===================================================================

const LOGGER_PLUGIN = `import type { App } from 'vue'

export const loggerPlugin = {
  install(app: App, options: { prefix: string }) {
    app.config.globalProperties.$log = (msg: string) =>
      console.log(\`[\${options.prefix}] \${msg}\`)
  },
}`;

const USE_PLUGIN = `app.use(loggerPlugin, { prefix: 'app' })

app.use(loggerPlugin, { prefx: 'app' })
// ❌ 'prefx' does not exist in type '{ prefix: string }'`;

const REGISTER_GLOBALS = `app.component('BaseButton', BaseButton)

app.directive('focus', {
  mounted(el: HTMLElement) {
    el.focus()
  },
})`;

const GLOBAL_COMPONENTS = `declare module 'vue' {
  interface GlobalComponents {
    BaseButton: typeof BaseButton
  }
}`;

const APP_PROVIDE = `app.provide('apiBase', 'https://api.example.com')`;

// ===================================================================
// part 3 — mounting
// ===================================================================

const MOUNT = `const app = createApp(App)
app.mount('#app')`;

const MOUNT_CHAIN = `createApp(App).use(router).mount('#app')
// ✅ mount is last in the chain`;

const MOUNT_BROKEN_CHAIN = `const app = createApp(App).use(router).mount('#app')
app.use(pinia)
// ❌ app is the root component instance here, it has no use method`;

// ===================================================================
// part 4 — global properties
// ===================================================================

const GLOBAL_PROPERTY = `app.config.globalProperties.$http = axios`;

const CUSTOM_PROPERTIES = `// src/types/vue.d.ts
import type { AxiosInstance } from 'axios'

declare module 'vue' {
  interface ComponentCustomProperties {
    $http: AxiosInstance
    $log: (msg: string) => void
  }
}`;

// Column grid for a side-by-side comparison (rule 5) — the same plain utility
// strings the typescript pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function AppInstanceDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Vue 3 removes the global <Code>Vue</Code> constructor. An
                    application is created with <Code>createApp</Code>, and{" "}
                    <Term>
                        every plugin, component, directive and global property is
                        registered on that app instance
                    </Term>{" "}
                    instead of on <Code>Vue</Code> itself.
                </p>
                <p>
                    This page covers creating the app, registering things on it,
                    mounting it, and the replacement for{" "}
                    <Code>Vue.prototype</Code>.
                </p>
            </div>

            {/* ---------- part 1 — createApp vs new Vue ---------- */}
            <PartHeading kicker="part 1">createApp vs new Vue</PartHeading>
            <div>
                <DocSection title="An app instance, not a global constructor">
                    <p>
                        In Vue 2, global configuration mutated the shared{" "}
                        <Code>Vue</Code> constructor. Every root instance created with{" "}
                        <Code>new Vue()</Code> inherited it, and in tests one
                        test&apos;s <Code>Vue.use</Code> leaked into the next. The
                        same setup in both versions:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Vue 2</Term>
                                </p>
                                <CodeBlock code={VUE2_GLOBAL} lang="js" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Vue 3</Term>
                                </p>
                                <CodeBlock code={VUE3_APP} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Each <Code>createApp</Code> call returns an isolated app. Two
                        apps on one page share no plugins, components or config.
                    </p>
                </DocSection>

                <DocSection title="Global API mapping">
                    <p>
                        Every global API that changed app behaviour has an app-level
                        counterpart:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Vue 2", "Vue 3"]}
                        rows={[
                            ["Vue.use", "app.use"],
                            ["Vue.component", "app.component"],
                            ["Vue.directive", "app.directive"],
                            ["Vue.mixin", "app.mixin"],
                            ["Vue.prototype.x", "app.config.globalProperties.x"],
                            ["Vue.extend", "removed, use defineComponent"],
                            ["new Vue().$mount(el)", "createApp(App).mount(el)"],
                        ]}
                    />

                    <Callout severity="difference" label="vue 2 → 3 · no global vue">
                        <p>
                            Global APIs that changed app behaviour now live on the app
                            instance. Nothing registered on one app affects another.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — registering on the app ---------- */}
            <PartHeading kicker="part 2">Registering on the app</PartHeading>
            <div>
                <DocSection title="Plugins">
                    <p>
                        A plugin is still an object with <Code>install</Code>, but{" "}
                        <Code>install</Code> receives the app instance instead of{" "}
                        <Code>Vue</Code>:
                    </p>
                    <CodeBlock code={LOGGER_PLUGIN} lang="ts" />
                    <p>
                        <Code>app.use</Code> infers the options type from{" "}
                        <Code>install</Code>, so wrong options fail to compile:
                    </p>
                    <CodeBlock code={USE_PLUGIN} lang="ts" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · install gets the app"
                    >
                        <p>
                            <Code>install(Vue, options)</Code> becomes{" "}
                            <Code>install(app, options)</Code>. Plugins register
                            through <Code>app.component</Code>,{" "}
                            <Code>app.provide</Code>,{" "}
                            <Code>app.config.globalProperties</Code> and so on.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Global components and directives">
                    <p>Registration works as before, but on the app:</p>
                    <CodeBlock code={REGISTER_GLOBALS} lang="ts" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · directive hooks renamed"
                    >
                        <p>
                            Directive hooks now follow the component lifecycle.{" "}
                            <Code>bind</Code> → <Code>beforeMount</Code>,{" "}
                            <Code>inserted</Code> → <Code>mounted</Code>,{" "}
                            <Code>componentUpdated</Code> → <Code>updated</Code>,{" "}
                            <Code>unbind</Code> → <Code>unmounted</Code>.{" "}
                            <Code>update</Code> is removed. <Code>beforeUpdate</Code>{" "}
                            and <Code>beforeUnmount</Code> are new.
                        </p>
                    </Callout>

                    <p>
                        TypeScript does not know about components registered with{" "}
                        <Code>app.component</Code>, so templates get no prop checking
                        for them. Declaring them on <Code>GlobalComponents</Code> fixes
                        this:
                    </p>
                    <CodeBlock code={GLOBAL_COMPONENTS} lang="ts" />

                    <Callout severity="tip" label="tip · type global components">
                        <p>
                            Without the <Code>GlobalComponents</Code> declaration,
                            globally registered components are untyped in templates.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="App-level provide">
                    <p>
                        <Code>app.provide</Code> makes a value available to every
                        component in the app through <Code>inject</Code>. Libraries
                        such as Vue Router and Pinia expose themselves this way. Typed
                        injection is covered on the Provide &amp; Inject page. A
                        single call provides the value app-wide:
                    </p>
                    <CodeBlock code={APP_PROVIDE} lang="ts" />
                </DocSection>
            </div>

            {/* ---------- part 3 — mounting ---------- */}
            <PartHeading kicker="part 3">Mounting</PartHeading>
            <div>
                <DocSection title="Mounting into a container">
                    <p>
                        <Code>mount</Code> accepts a selector or an element and renders
                        the root component inside it:
                    </p>
                    <CodeBlock code={MOUNT} lang="ts" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · the container is kept"
                    >
                        <p>
                            Vue 2&apos;s <Code>$mount</Code> replaced the target element
                            with the root component&apos;s element. Vue 3 keeps the
                            container and renders the app as its children (it replaces{" "}
                            <Code>innerHTML</Code>). Selectors and styles on{" "}
                            <Code>#app</Code> keep working, and the root component can
                            have multiple root nodes.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="What mount returns">
                    <p>
                        <Code>use</Code>, <Code>component</Code>,{" "}
                        <Code>directive</Code> and <Code>provide</Code> return the app,
                        so they chain. <Code>mount</Code> returns the root component
                        instance, not the app:
                    </p>
                    <CodeBlock code={MOUNT_CHAIN} lang="ts" />
                    <p>
                        Assigning the whole chain to a variable stores that instance,
                        not the app:
                    </p>
                    <CodeBlock code={MOUNT_BROKEN_CHAIN} lang="ts" />

                    <Callout severity="trap" label="trap · mount ends the chain">
                        <p>
                            Keep a reference to the app from <Code>createApp</Code>, and
                            call <Code>mount</Code> last.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Configure before mounting">
                    <p>
                        The first render happens inside <Code>mount</Code>. Anything
                        registered after it is missing from that render.
                    </p>

                    <Callout severity="trap" label="trap · register before mount">
                        <p>
                            Call <Code>use</Code>, <Code>component</Code>,{" "}
                            <Code>directive</Code> and <Code>provide</Code> before{" "}
                            <Code>mount</Code>. Calling <Code>mount</Code> a second time
                            on the same app does nothing except log a warning; a new app
                            needs a new <Code>createApp</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — global properties ---------- */}
            <PartHeading kicker="part 4">Global properties</PartHeading>
            <div>
                <DocSection title="app.config.globalProperties">
                    <p>
                        <Code>globalProperties</Code> replaces{" "}
                        <Code>Vue.prototype</Code>. Every component instance gets the
                        property on <Code>this</Code> (Options API) and in templates:
                    </p>
                    <CodeBlock code={GLOBAL_PROPERTY} lang="ts" />
                    <p>
                        If a component defines its own <Code>data</Code>,{" "}
                        <Code>computed</Code> or method with the same name, the
                        component&apos;s own member wins.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · prototype replaced"
                    >
                        <p>
                            <Code>Vue.prototype.$x = …</Code> becomes{" "}
                            <Code>app.config.globalProperties.$x = …</Code>, and it is
                            scoped to the app.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Typing global properties">
                    <p>
                        Global properties are untyped until{" "}
                        <Code>ComponentCustomProperties</Code> is augmented:
                    </p>
                    <CodeBlock code={CUSTOM_PROPERTIES} lang="ts" />
                    <p>
                        With this in place, <Code>this.$log(42)</Code> fails to compile
                        and <Code>$log</Code> is typed in templates.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · the file must be a module"
                    >
                        <p>
                            The augmentation only extends Vue&apos;s types when the file
                            is a module (it has an <Code>import</Code> or{" "}
                            <Code>export</Code>). Without one,{" "}
                            <Code>{"declare module 'vue'"}</Code> replaces the whole{" "}
                            <Code>vue</Code> declaration and <Code>createApp</Code>,{" "}
                            <Code>ref</Code> and the rest disappear for TypeScript. If
                            there is nothing to import, add <Code>{"export {}"}</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Global properties and setup">
                    <p>
                        Global properties are reachable only through <Code>this</Code>.
                        Code in <Code>setup()</Code> and{" "}
                        <Code>{"<script setup>"}</Code> has no <Code>this</Code>.
                    </p>

                    <Callout
                        severity="difference"
                        label="main vs setup · no this in setup"
                    >
                        <p>
                            Setup code cannot use <Code>globalProperties</Code>, except
                            through <Code>getCurrentInstance()</Code>, which is internal
                            and not meant for application code. For values setup code
                            needs, use <Code>app.provide</Code> with{" "}
                            <Code>inject</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
