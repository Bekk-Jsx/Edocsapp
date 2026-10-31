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
    // --- part 1 (Provide and inject) ---
    // "passing-values-down-the-tree" carries no callout, so no entry.

    // --- part 2 (Reactive provided values) ---
    // inline `vue 2 → 3 · computed instead of a reactive object`
    "providing-a-ref": ["difference"],
    // "changing-provided-state" carries no callout, so no entry.

    // --- part 3 (Typing injections) ---
    // inline `main vs setup · typed injection needs the functions`
    "typing-with-a-string-key": ["difference"],
    // inline `tip · which key to use`
    injectionkey: ["tip"],
    // inline `trap · defaults can hide a missing provider`
    "defaults-and-required-injections": ["trap"],
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
// 4. Every fragment declares its language: ts, vue or text.
// 5. Differences are inline Callouts with severity "difference" and one of two
//    label prefixes: "vue 2 → 3 · …" or "main vs setup · …".
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — provide and inject
// ===================================================================

const PROP_CHAIN = `ThemeRoot          owns theme
 └─ ThemePanel     prop theme → only passes it on
     └─ ThemeButton  prop theme → uses it`;

const PROVIDE_OPTION = `provide() {
  return {
    theme: 'dark',
  }
},`;

const INJECT_OPTION = `inject: ['theme'],
// this.theme`;

// ===================================================================
// part 2 — reactive provided values
// ===================================================================

const PROVIDE_COPY = `data() {
  return { theme: 'dark' }
},
provide() {
  return {
    theme: this.theme, // ❌ the string 'dark', copied once
  }
},`;

const PROVIDE_COMPUTED = `import { computed } from 'vue'

provide() {
  return {
    theme: computed(() => this.theme), // ✅ always reads the current theme
  }
},`;

const PROVIDE_TOGGLE = `provide() {
  return {
    theme: computed(() => this.theme),
    toggleTheme: this.toggle,
  }
},
methods: {
  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark'
  },
},`;

// ===================================================================
// part 3 — typing injections
// ===================================================================

const UNTYPED_INJECT = `inject: ['theme'],
// template {{ theme }}
// ❌ Property 'theme' does not exist on type 'CreateComponentPublicInstanceWithMixins<…>'`;

const INJECT_GENERIC = `import { defineComponent, inject, type Ref } from 'vue'

export default defineComponent({
  setup() {
    const theme = inject<Ref<string>>('theme') // Ref<string> | undefined
    return { theme }
  },
})`;

const THEME_KEYS = `// src/keys/theme.ts
import type { ComputedRef, InjectionKey } from 'vue'

export const ThemeKey: InjectionKey<ComputedRef<string>> = Symbol('theme')
export const ToggleThemeKey: InjectionKey<() => void> = Symbol('toggleTheme')`;

const INJECT_KEY = `const theme = inject(ThemeKey) // ComputedRef<string> | undefined`;

const PROVIDE_KEY_CHECK = `provide(ThemeKey, computed(() => 'dark')) // ✅
provide(ThemeKey, 42)
// ❌ number is not assignable to ComputedRef<string>`;

const PROVIDE_OPTION_SYMBOLS = `provide() {
  return {
    [ThemeKey as symbol]: computed(() => this.theme), // not checked against the key
    [ToggleThemeKey as symbol]: this.toggle,
  }
},`;

const INJECT_DEFAULT = `const theme = inject(ThemeKey, computed(() => 'dark')) // ComputedRef<string>`;

const INJECT_REQUIRED = `const toggleTheme = inject(ToggleThemeKey)
if (!toggleTheme) throw new Error('ThemeButton must be used inside ThemeRoot')`;

export function ProvideInjectDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Props pass data one level down. <Code>provide</Code> and{" "}
                    <Code>inject</Code> pass a value from an ancestor to any
                    descendant,{" "}
                    <Term>
                        at any depth, without the components in between knowing about
                        it
                    </Term>
                    .
                </p>
                <p>
                    This page covers the basic options, keeping provided values
                    reactive, and typing injections. App-wide values are provided with{" "}
                    <Code>app.provide</Code> (see The App Instance).
                </p>
            </div>

            {/* ---------- part 1 — provide and inject ---------- */}
            <PartHeading kicker="part 1">Provide and inject</PartHeading>
            <div>
                <DocSection title="Passing values down the tree">
                    <p>
                        Data needed deep in the tree — a theme, the current user, form
                        state — has to be passed through every level with props, even
                        through components that never use it. Every middle component
                        declares a prop only to pass it on, and adding a level means
                        editing all of them:
                    </p>
                    <CodeBlock code={PROP_CHAIN} lang="text" />
                    <p>
                        An ancestor provides a value under a key; any descendant
                        injects it by that key. The middle components are unchanged.
                        The ancestor:
                    </p>
                    <CodeBlock code={PROVIDE_OPTION} lang="ts" />
                    <p>Any descendant:</p>
                    <CodeBlock code={INJECT_OPTION} lang="ts" />
                    <p>
                        <Code>inject</Code> searches up the component tree for the
                        nearest ancestor that provides the key. Only ancestors count,
                        never siblings; when several ancestors provide the same key, the
                        closest one wins. When no ancestor provides it and no default is
                        given, Vue warns.
                    </p>
                    <p>
                        The options syntax is unchanged from Vue 2. Two limits apply:
                        provided values are not reactive by default, and the{" "}
                        <Code>inject</Code> option is not typed.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — reactive provided values ---------- */}
            <PartHeading kicker="part 2">Reactive provided values</PartHeading>
            <div>
                <DocSection title="Providing a ref">
                    <p>
                        <Code>provide()</Code> runs once, when the providing component
                        is created. A primitive returned from it is copied at that
                        moment; later changes in the provider never reach the
                        descendants:
                    </p>
                    <CodeBlock code={PROVIDE_COPY} lang="ts" />
                    <p>
                        When the provider later sets{" "}
                        <Code>{"this.theme = 'light'"}</Code>, its own template updates,
                        but injecting components keep <Code>{"'dark'"}</Code>.
                    </p>
                    <p>
                        Provide a ref instead of the value. A computed that reads the
                        provider&apos;s state is the simplest one:
                    </p>
                    <CodeBlock code={PROVIDE_COMPUTED} lang="ts" />
                    <p>
                        <Code>provide()</Code> still runs once, but it hands out a ref —
                        a container whose content follows <Code>this.theme</Code> —
                        instead of a copied value. Descendants read the ref while
                        rendering, so they are tracked and re-render when the theme
                        changes. Templates unwrap the ref, so{" "}
                        <Code>{"{{ theme }}"}</Code> renders the string.
                    </p>

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · computed instead of a reactive object"
                    >
                        <p>
                            In Vue 2 the workaround was providing a reactive object,
                            such as <Code>this.$data</Code>, and reading its properties.
                            In Vue 3, providing a <Code>computed</Code> or another ref is
                            the documented approach.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Changing provided state">
                    <p>
                        A provided computed is read-only, so descendants cannot change
                        it. Letting descendants write shared state directly would also
                        let any component change it without the provider&apos;s
                        knowledge.
                    </p>
                    <p>
                        The provider also provides a function that changes its own
                        state. Descendants request changes through it; the provider
                        stays the single owner:
                    </p>
                    <CodeBlock code={PROVIDE_TOGGLE} lang="ts" />
                </DocSection>
            </div>

            {/* ---------- part 3 — typing injections ---------- */}
            <PartHeading kicker="part 3">Typing injections</PartHeading>
            <div>
                <DocSection title="Typing with a string key">
                    <p>
                        The <Code>inject</Code> option adds nothing to the
                        component&apos;s type. Using the injected property in the
                        template or script is a type error, although it works at
                        runtime:
                    </p>
                    <CodeBlock code={UNTYPED_INJECT} lang="ts" />
                    <p>
                        The <Code>inject()</Code> function inside <Code>setup()</Code>{" "}
                        returns a typed value. With a string key, the type is passed as
                        a generic:
                    </p>
                    <CodeBlock code={INJECT_GENERIC} lang="ts" />
                    <p>
                        <Code>inject()</Code> returns <Code>T | undefined</Code>,
                        because the component may be rendered without a provider. With a
                        string key, the generic is an unchecked claim: a typo in the key
                        or a provider sending a different type is not reported, and the
                        value is <Code>undefined</Code> or wrong at runtime.
                    </p>

                    <Callout
                        severity="difference"
                        label="main vs setup · typed injection needs the functions"
                    >
                        <p>
                            The <Code>provide</Code> and <Code>inject</Code> options are
                            not type-checked. Typed injection uses the{" "}
                            <Code>provide()</Code> and <Code>inject()</Code> functions
                            inside <Code>setup()</Code>; see Script Setup.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="InjectionKey">
                    <p>
                        A string key connects provider and consumer only by name.
                        Nothing checks that both sides agree on the name or on the type.
                    </p>
                    <p>
                        An <Code>InjectionKey</Code> is a symbol that carries the
                        value&apos;s type. It is created once and imported by both
                        sides:
                    </p>
                    <CodeBlock code={THEME_KEYS} lang="ts" />
                    <p>
                        <Code>inject</Code> reads the type from the key; no generic is
                        written:
                    </p>
                    <CodeBlock code={INJECT_KEY} lang="ts" />
                    <p>
                        Because the key is an imported symbol, a misspelled key is a
                        compile error instead of a silent <Code>undefined</Code>, and no
                        library can collide with it. The <Code>provide()</Code> function
                        checks the provided value against the key&apos;s type:
                    </p>
                    <CodeBlock code={PROVIDE_KEY_CHECK} lang="ts" />
                    <p>
                        The <Code>provide</Code> option can use symbol keys but does not
                        check them. A symbol key needs <Code>as symbol</Code> to be used
                        as an object key; without it TypeScript reports &quot;A computed
                        property name must be of type &apos;string&apos;,
                        &apos;number&apos;, &apos;symbol&apos;, or &apos;any&apos;.&quot;
                    </p>
                    <CodeBlock code={PROVIDE_OPTION_SYMBOLS} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "inject<Ref<string>>('theme')", "inject(ThemeKey)"]}
                        rows={[
                            ["Setup", "one line, no extra file", "a shared key file"],
                            [
                                "Type",
                                "Ref<string> | undefined (a claim)",
                                "ComputedRef<string> | undefined (from the key)",
                            ],
                            ["Misspelled key", "undefined at runtime", "compile error"],
                            [
                                "Provider sends another type",
                                "not reported",
                                "error with the provide() function",
                            ],
                            [
                                "Name clash with a library",
                                "possible",
                                "impossible (unique symbol)",
                            ],
                        ]}
                    />

                    <Callout severity="tip" label="tip · which key to use">
                        <p>
                            String keys with a generic suit small apps where one
                            developer owns provider and consumer.{" "}
                            <Code>InjectionKey</Code> suits values used in many
                            components, plugins and libraries, and team code — the key
                            file is the shared contract.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Defaults and required injections">
                    <p>
                        <Code>inject()</Code> returns <Code>T | undefined</Code>, so
                        every use has to handle a missing provider.
                    </p>
                    <p>
                        A default value as the second argument removes{" "}
                        <Code>undefined</Code> from the type:
                    </p>
                    <CodeBlock code={INJECT_DEFAULT} lang="ts" />
                    <p>
                        When a component cannot work without its provider, a default
                        hides a setup mistake. Fail loudly instead:
                    </p>
                    <CodeBlock code={INJECT_REQUIRED} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · defaults can hide a missing provider"
                    >
                        <p>
                            A default makes a component render without its provider. Use
                            one only when that is a valid case.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
