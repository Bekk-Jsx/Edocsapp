import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header —
// that is the explicit `sectionSeverity` prop, and no section here is wholly one
// severity, so every callout below is inline only.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Parameters & Returns) ---
    // inline `trap · a missing return makes the type undefined, not an error`
    "typing-a-function": ["trap"],
    // inline `trap · void only applies to the function's own return`
    "void-vs-undefined": ["trap"],

    // --- part 2 (Flexible Parameters) ---
    // inline `trap · title?: string is not title: string | undefined`
    "optional-parameters": ["trap"],
    // inline `trap · the default fires on undefined…` + `note · a default may precede…`
    "default-parameters": ["trap", "note"],
    // inline `note · spreading into a call needs a tuple, not an array`
    "rest-parameters": ["note"],

    // --- part 3 (Function Types & Overloads) ---
    // inline `note · this is the type you write most in React`
    "a-function-as-a-type": ["note"],
    // inline `trap · parameter types are not as forgiving as parameter count`
    "why-callbacks-accept-fewer-parameters": ["trap"],
    // inline `trap · the implementation signature…` + `note · you mostly read these`
    overloads: ["trap", "note"],
};

// Top-level divider between the three parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in first-types.tsx.
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

// Exactly the grid treatment the redis content files use (inspecting-the-keyspace
// and friends), copied as objects-and-aliases.tsx copied it — a real <table>
// would be the only one in the codebase. Markup, padding and colours unchanged;
// this page needs it once, for the void vs undefined summary.
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

// PAGE RULES — those of objects-and-aliases.tsx, with the error style updated:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it and read by the sentence below it. Two fragments never touch.
// 2. ERROR HOUSE STYLE (from this page on): a compiler error is a comment on the
//    line BELOW the offending code, prefixed `// ❌ ` and in tsc's exact wording.
//    A multi-line tsc message keeps tsc's own nesting, indented under the first
//    line's text. Where a contrast helps, a passing line ends in `// ✅`. Every
//    message was produced by this repo's tsc (5.9) under `strict`. The markers
//    are plain text in the fragment — no component, no class.
// 3. Inferred types are a trailing comment on the same line.
// 4. Traps are inline Callouts; there is no traps section.
// 5. Every fragment declares its language: ts.
// 6. A comparison shows both codes side by side, in the same container-query
//    grid objects-and-aliases.tsx uses: two columns once the body column can
//    hold them, stacked below that, and each column opens with a one-line label
//    so two fragments never touch even when stacked.

// ===================================================================
// part 1 — parameters & returns
// ===================================================================

const ADD_FULL = `function add(a: number, b: number): number {
    return a + b;
}`;

const ADD_INFERRED = `function add(a: number, b: number) {   // returns number
    return a + b;
}`;

const ADD_ARROW = `const add = (a: number, b: number) => a + b;   // returns number`;

const CALL_TYPE = `add("1", 2);
// ❌ Argument of type 'string' is not assignable to parameter of type 'number'.`;

const CALL_COUNT = `add(1);
// ❌ Expected 2 arguments, but got 1.
add(1, 2, 3);
// ❌ Expected 2 arguments, but got 3.`;

const CALL_RESULT = `const sum = add(1, 2);   // number
sum.toUpperCase();
// ❌ Property 'toUpperCase' does not exist on type 'number'.`;

const CONTRACT_INFERRED = `export function total(items: number[]) {
    if (items.length === 0) return "none";
    return items.reduce((a, b) => a + b, 0);
}
// now returns number | "none" — no error here`;

const CONTRACT_ANNOTATED = `export function total(items: number[]): number {
    if (items.length === 0) return "none";
    // ❌ Type 'string' is not assignable to type 'number'.
    return items.reduce((a, b) => a + b, 0);
}`;

const MISSING_RETURN = `function find(id: string) {   // returns "found" | undefined
    if (id) return "found";
}

const result = find("x");
result.toUpperCase();
// ❌ 'result' is possibly 'undefined'.`;

const NO_IMPLICIT_RETURNS = `function find(id: string) {
// ❌ Not all code paths return a value.
    if (id) return "found";
}`;

const VOID_AND_UNDEFINED = `function a(): void {}        // ✅
function b(): undefined {}   // ✅ since TypeScript 5.1`;

const VOID_LOOSE = `const fn: () => void = () => 42;   // ✅ allowed

const result = fn();   // void
result.toFixed();
// ❌ Property 'toFixed' does not exist on type 'void'.`;

const UNDEFINED_STRICT = `const fn2: () => undefined = () => 42;
// ❌ Type 'number' is not assignable to type 'undefined'.`;

const FOR_EACH = `numbers.forEach(n => target.push(n));   // ✅ push's number is discarded`;

const VOID_PROPS = `type Props = {
    onClick: () => void;
    onChange: (value: string) => void;
};`;

// ===================================================================
// part 2 — flexible parameters
// ===================================================================

const OPTIONAL_PARAM = `function greet(name: string, title?: string) {
    // ...
}

greet("sam");         // ✅
greet("sam", "Dr");   // ✅`;

const OPTIONAL_INSIDE = `function greet(name: string, title?: string) {
    title.toUpperCase();
    // ❌ 'title' is possibly 'undefined'.
}`;

const OPTIONAL_LAST = `function greet(title?: string, name: string) {}
// ❌ A required parameter cannot follow an optional parameter.`;

const OPTIONAL_ARG = `function a(x?: string) {}

a();   // ✅`;

const UNDEFINED_ARG = `function b(x: string | undefined) {}

b();
// ❌ Expected 1 arguments, but got 0.
b(undefined);   // ✅`;

const DEFAULT = `function greet(name: string, title = "Dr") {
    return \`\${title} \${name}\`;
}`;

const DEFAULT_OPTIONAL = `function a(title?: string) {
    title.toUpperCase();
    // ❌ 'title' is possibly 'undefined'.
}`;

const DEFAULT_GUARANTEED = `function b(title = "Dr") {
    title.toUpperCase();   // ✅ title: string
}`;

const DEFAULT_AND_QUESTION = `function greet(title?: string = "Dr") {}
// ❌ Parameter cannot have question mark and initializer.`;

const DEFAULT_WIDENED = `function setTheme(theme = "dark") {}          // theme: string — widened
function setTheme(theme: Theme = "dark") {}   // theme: Theme ✅`;

const DEFAULT_ON_UNDEFINED = `greet("sam", undefined);   // ✅ the default is used
greet("sam", null);
// ❌ Argument of type 'null' is not assignable to parameter of type 'string | undefined'.`;

const DEFAULT_FIRST = `function range(start = 0, end: number) {}

range(undefined, 10);   // ✅ start is 0
range(10);
// ❌ Expected 2 arguments, but got 1.`;

const REST_SUM = `function sum(...numbers: number[]) {
    return numbers.reduce((a, b) => a + b, 0);
}

sum();          // ✅ 0
sum(1, 2, 3);   // ✅ 6
sum(1, "2");
// ❌ Argument of type 'string' is not assignable to parameter of type 'number'.`;

const REST_MIXED = `function log(level: string, ...messages: string[]) {}

log("info", "server", "started");   // messages: ["server", "started"]
log("info");                        // messages: []`;

const REST_LAST = `function log(...messages: string[], level: string) {}
// ❌ A rest parameter must be last in a parameter list.`;

const REST_TUPLE = `function point(...args: [x: number, y: number, label?: string]) {}

point(1, 2);             // ✅
point(1, 2, "origin");   // ✅
point(1, "2");
// ❌ Argument of type 'string' is not assignable to parameter of type 'number'.`;

const SPREAD_ARRAY = `const args = [1, 2];   // number[]
point(...args);
// ❌ A spread argument must either have a tuple type or be passed to a rest parameter.`;

const SPREAD_TUPLE = `const args = [1, 2] as const;   // readonly [1, 2]
point(...args);                 // ✅`;

// ===================================================================
// part 3 — function types & overloads
// ===================================================================

const FN_TYPE = `type Add = (a: number, b: number) => number;

const add: Add = (a, b) => a + b;`;

const CONTEXTUAL = `const add: Add = (a, b) => a + b;   // ✅ a, b: number`;

const NO_CONTEXT = `const add = (a, b) => a + b;
// ❌ Parameter 'a' implicitly has an 'any' type.
// ❌ Parameter 'b' implicitly has an 'any' type.`;

const INLINE_CALLBACK = `function run(callback: (value: string) => void) {
    callback("done");
}

run(value => console.log(value));   // ✅ value: string
run(msg => console.log(msg));       // ✅ the same thing`;

const PROPERTY_FORM = `type Handlers = {
    onClick: (id: string) => void;
};`;

const METHOD_FORM = `type Handlers = {
    onClick(id: string): void;
};`;

const REACT_PROPS = `type Props = {
    onSave: (value: string) => void;
    onCancel: () => void;
};`;

const FEWER_PARAMS = `type Handler = (value: string, index: number) => void;

const a: Handler = (value, index) => {};   // ✅
const b: Handler = (value) => {};          // ✅
const c: Handler = () => {};               // ✅
const d: Handler = (value: string, index: number, extra: string) => {};
// ❌ Type '(value: string, index: number, extra: string) => void' is not assignable to type 'Handler'.
//      Target signature provides too few arguments. Expected 3 or more, but got 2.`;

const MAP_CALLBACK = `[1, 2, 3].map(n => n * 2);   // ✅ index and array ignored

// what map actually passes:
// (value: number, index: number, array: number[]) => U`;

const RETURN_GROWS = `type Run = () => void;
const a: Run = () => 42;   // ✅ returned and discarded
const b: Run = () => {};   // ✅

type Get = () => string;
const c: Get = () => {};
// ❌ Type '() => void' is not assignable to type 'Get'.
//      Type 'void' is not assignable to type 'string'.`;

const PARAM_TYPE = `const e: Handler = (value: number) => {};
// ❌ Type '(value: number) => void' is not assignable to type 'Handler'.
//      Types of parameters 'value' and 'value' are incompatible.
//        Type 'string' is not assignable to type 'number'.`;

const UNION_SIGNATURE = `function parse(value: string | number): string | number {
    // ...
}

const n = parse("42");   // string | number
n.toFixed();
// ❌ Property 'toFixed' does not exist on type 'string | number'.
//      Property 'toFixed' does not exist on type 'string'.`;

const OVERLOADS = `function parse(value: string): number;
function parse(value: number): string;
function parse(value: string | number): string | number {
    return typeof value === "string" ? Number(value) : String(value);
}

const n = parse("42");   // ✅ number
const s = parse(42);     // ✅ string`;

const NO_OVERLOAD = `parse(true);
// ❌ No overload matches this call.
//      Overload 1 of 2, '(value: string): number', gave the following error.
//        Argument of type 'boolean' is not assignable to parameter of type 'string'.
//      Overload 2 of 2, '(value: number): string', gave the following error.
//        Argument of type 'boolean' is not assignable to parameter of type 'number'.`;

const FIRST_OVERLOADS = `function first(arr: string[]): string;
function first(arr: number[]): number;
function first(arr: any[]): any {
    return arr[0];
}

// boolean[]? User[]? one more line each`;

const FIRST_GENERIC = `function first<T>(arr: T[]): T {
    return arr[0];
}

first(["a"]);    // string
first([true]);   // boolean`;

const CREATE_ELEMENT = `document.createElement("input");       // HTMLInputElement
document.createElement("my-widget");   // HTMLElement`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings objects-and-aliases.tsx uses, so the two pages split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function FunctionsDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the earlier pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A function is where types meet behaviour: values go in, a value
                    comes out, and the compiler checks both ends of every call. This
                    page covers typing the two ends, the ways a parameter list can
                    flex, and how a function itself becomes a type you can pass
                    around.
                </p>
                <p>
                    One change of convention from here on: a compiler error is
                    marked <Code>{"// ❌"}</Code>{" "}
                    on the line below the code that caused it,
                    in tsc&apos;s exact wording, and where a contrast helps, a line
                    that compiles ends in <Code>{"// ✅"}</Code>. Everything still assumes{" "}
                    <Code>strict: true</Code>.
                </p>
            </div>

            {/* ---------- part 1 — the two ends of a function ---------- */}
            <PartHeading kicker="part 1">Parameters &amp; Returns</PartHeading>
            <div>
                <DocSection title="typing a function">
                    <p>
                        <Term>There are two places to annotate:</Term>{" "}
                        each parameter, and the return, after the parameter list:
                    </p>
                    <CodeBlock code={ADD_FULL} lang="ts" />
                    <p>
                        Parameter types are required — the compiler has nothing to
                        infer them from, since they are filled in by whoever calls.
                        The return type is optional, because the body determines it:
                    </p>
                    <CodeBlock code={ADD_INFERRED} lang="ts" />
                    <p>
                        This is &ldquo;annotate inputs, infer outputs&rdquo; from
                        First Types, and it holds for arrow functions exactly the
                        same way:
                    </p>
                    <CodeBlock code={ADD_ARROW} lang="ts" />

                    <p>
                        <Term>Calls are checked both ways.</Term>{" "}
                        Every argument is
                        checked against its parameter:
                    </p>
                    <CodeBlock code={CALL_TYPE} lang="ts" />
                    <p>
                        So is the count — stricter than JavaScript, where a missing
                        argument is silently <Code>undefined</Code> and an extra one
                        is silently ignored:
                    </p>
                    <CodeBlock code={CALL_COUNT} lang="ts" />
                    <p>And what comes back is typed, so misuse of the result is caught too:</p>
                    <CodeBlock code={CALL_RESULT} lang="ts" />

                    <p>
                        <Term>When to write the return type.</Term>{" "}
                        The inference rule
                        has one real exception: an <em>exported</em> function, where
                        the return type is a contract with every caller. Here is the
                        same edit made to both versions:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>inferred — the type moves silently</Term>
                                </p>
                                <CodeBlock code={CONTRACT_INFERRED} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>annotated — the error lands here</Term>
                                </p>
                                <CodeBlock code={CONTRACT_ANNOTATED} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Without the annotation, the edit quietly changes the public
                        type, and the error surfaces wherever a caller did arithmetic
                        on the result — possibly in another file, possibly in code
                        you have never seen. With it, the error lands on the function
                        you just broke.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · a missing return makes the type undefined, not an error"
                    >
                        <p>
                            A function with no <Code>return</Code> at all is inferred
                            as <Code>void</Code>. One that returns on some paths and
                            not others is inferred as a union with{" "}
                            <Code>undefined</Code>, and that union flows out and bites
                            a caller instead:
                        </p>
                        <CodeBlock code={MISSING_RETURN} lang="ts" />
                        <p>
                            The bug is in <Code>find</Code>, but the error appears at
                            the call. The <Code>noImplicitReturns</Code>{" "}
                            flag — not
                            part of <Code>strict</Code>, so it must be switched on
                            separately — turns the inconsistency itself into an error,
                            at the function:
                        </p>
                        <CodeBlock code={NO_IMPLICIT_RETURNS} lang="ts" />
                    </Callout>
                </DocSection>

                <DocSection title="void vs undefined">
                    <p>
                        Both describe a function that gives you nothing back, and they
                        are not the same.{" "}
                        <Term>
                            <Code>void</Code> means ignore the return value, whatever
                            it is. <Code>undefined</Code> means the return value is
                            specifically <Code>undefined</Code>.
                        </Term>
                    </p>
                    <p>Either one accepts an empty body:</p>
                    <CodeBlock code={VOID_AND_UNDEFINED} lang="ts" />
                    <p>
                        The second line was an error before TypeScript 5.1, and older
                        articles still say so. It is fine now — a function that
                        falls off the end returns <Code>undefined</Code>, and the
                        compiler accepts that as satisfying the annotation.
                    </p>

                    <p>
                        <Term>Why void is so loose.</Term>{" "}
                        A <Code>void</Code>{" "}
                        return type does not forbid returning something. It says the
                        caller must not use it:
                    </p>
                    <CodeBlock code={VOID_LOOSE} lang="ts" />
                    <p>
                        The function returns 42, the compiler knows it, and the
                        result is still typed <Code>void</Code>. The value is there at
                        runtime, but unreachable through the types.{" "}
                        <Code>undefined</Code>, by contrast, permits only{" "}
                        <Code>undefined</Code>:
                    </p>
                    <CodeBlock code={UNDEFINED_STRICT} lang="ts" />
                    <p>
                        This looks like a bug, and it is deliberate. It is what makes
                        one-line callbacks work:
                    </p>
                    <CodeBlock code={FOR_EACH} lang="ts" />
                    <p>
                        <Code>forEach</Code> expects a callback returning{" "}
                        <Code>void</Code>; <Code>push</Code> returns the new length,
                        a number. Without the loose rule, every one-line arrow
                        callback would need braces just to throw its result away.
                        Side by side:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", ": void", ": undefined"]}
                        rows={[
                            ["empty body", "allowed", "allowed"],
                            ["the result", "unusable", "undefined, usable as a value"],
                            ["what may be returned", "anything — discarded", "only undefined"],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · void only applies to the function's own return"
                    >
                        <p>
                            It says nothing about what the function <em>does</em>. A{" "}
                            <Code>void</Code>{" "}
                            callback can mutate state, throw, or start
                            async work and never await it.{" "}
                            <Term>
                                <Code>void</Code> means nothing comes back, not
                                nothing happens.
                            </Term>
                        </p>
                    </Callout>

                    <p>
                        <Term>Which to write.</Term>{" "}
                        Use <Code>void</Code>. It is the
                        correct type for a function that exists for its side effect —
                        logging, saving, dispatching, setting state — and it is what
                        you see constantly in React props:
                    </p>
                    <CodeBlock code={VOID_PROPS} lang="ts" />
                    <p>
                        Reach for <Code>undefined</Code> as a return type only when{" "}
                        <Code>undefined</Code> is a real, meaningful value the caller
                        will check — and even then, <Code>T | undefined</Code>{" "}
                        is
                        usually what you actually want.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — parameter lists that bend ---------- */}
            <PartHeading kicker="part 2">Flexible Parameters</PartHeading>
            <div>
                <DocSection title="optional parameters">
                    <p>
                        <Term>
                            A <Code>?</Code> after the name makes an argument
                            skippable:
                        </Term>
                    </p>
                    <CodeBlock code={OPTIONAL_PARAM} lang="ts" />
                    <p>
                        Inside the function, the parameter is a union with{" "}
                        <Code>undefined</Code>:
                    </p>
                    <CodeBlock code={OPTIONAL_INSIDE} lang="ts" />
                    <p>
                        The same rule as optional properties on Objects &amp; Aliases:
                        the absence is in the type, so the compiler forces you to
                        handle it before use.
                    </p>

                    <p>
                        <Term>Optional parameters must come last.</Term>
                    </p>
                    <CodeBlock code={OPTIONAL_LAST} lang="ts" />
                    <p>
                        Arguments are matched by position, so a required parameter
                        after an optional one could never be reached without passing
                        something for the optional one first. Objects do not have this
                        problem — which is one reason a function with several options
                        takes an options object instead of a long parameter list.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · title?: string is not title: string | undefined"
                    >
                        <p>
                            Same distinction as on Objects &amp; Aliases, moved to the
                            call site. <Code>?</Code> makes the <em>argument</em>{" "}
                            skippable; <Code>| undefined</Code> still requires you to
                            pass something:
                        </p>
                        <div className={PAIR_FRAME}>
                            <div className={PAIR_GRID}>
                                <div className={PAIR_COL}>
                                    <p>
                                        <Term>optional — may be left out</Term>
                                    </p>
                                    <CodeBlock code={OPTIONAL_ARG} lang="ts" />
                                </div>
                                <div className={PAIR_COL}>
                                    <p>
                                        <Term>required — may be undefined</Term>
                                    </p>
                                    <CodeBlock code={UNDEFINED_ARG} lang="ts" />
                                </div>
                            </div>
                        </div>
                    </Callout>
                </DocSection>

                <DocSection title="default parameters">
                    <p>
                        A parameter can be given a default value with{" "}
                        <Code>=</Code>. This is plain JavaScript; the only TypeScript
                        part is what it does to the type.
                    </p>
                    <CodeBlock code={DEFAULT} lang="ts" />

                    <p>
                        <Term>The default replaces the annotation.</Term>{" "}
                        <Code>title</Code> is inferred as <Code>string</Code> from{" "}
                        <Code>&quot;Dr&quot;</Code>, and inside the function it is{" "}
                        <Code>string</Code> — not <Code>string | undefined</Code>,
                        because the default guarantees a value. Compare the two:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>optional — must be checked</Term>
                                </p>
                                <CodeBlock code={DEFAULT_OPTIONAL} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>default — always a value</Term>
                                </p>
                                <CodeBlock code={DEFAULT_GUARANTEED} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Prefer a default whenever a sensible one exists: less
                        narrowing, fewer branches.
                    </p>

                    <p>
                        <Term>Defaults are also skippable.</Term>{" "}
                        A parameter with a
                        default is already optional at the call site, without{" "}
                        <Code>?</Code>. Writing both is a contradiction, and the
                        compiler says so:
                    </p>
                    <CodeBlock code={DEFAULT_AND_QUESTION} lang="ts" />

                    <p>
                        <Term>Annotating anyway.</Term>{" "}
                        Sometimes the inferred type is
                        too wide:
                    </p>
                    <CodeBlock code={DEFAULT_WIDENED} lang="ts" />
                    <p>
                        A parameter is mutable inside the function, like a{" "}
                        <Code>let</Code>, so the literal widens to{" "}
                        <Code>string</Code> — the widening rule from First Types.
                        Annotate when the parameter should be narrower than the
                        default&apos;s own type.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the default fires on undefined, not on missing"
                    >
                        <p>
                            The default is used whenever the argument is{" "}
                            <Code>undefined</Code> — passed explicitly or left out —
                            and <Code>null</Code> is not <Code>undefined</Code>:
                        </p>
                        <CodeBlock code={DEFAULT_ON_UNDEFINED} lang="ts" />
                        <p>
                            The error names the type the parameter really has at the
                            call site: <Code>string | undefined</Code>. That is useful
                            when forwarding an optional value through —{" "}
                            <Code>greet(name, maybeTitle)</Code>{" "}
                            works when{" "}
                            <Code>maybeTitle</Code> is <Code>string | undefined</Code>,
                            and the default catches the absent case.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · a default may precede a required parameter"
                    >
                        <p>
                            Unlike <Code>?</Code>, this is legal, because you can pass{" "}
                            <Code>undefined</Code> to reach past it:
                        </p>
                        <CodeBlock code={DEFAULT_FIRST} lang="ts" />
                        <p>Legal, and confusing to call. Keep defaults last anyway.</p>
                    </Callout>
                </DocSection>

                <DocSection title="rest parameters">
                    <p>
                        <Term>
                            <Code>...</Code> collects any number of remaining arguments
                            into an array:
                        </Term>
                    </p>
                    <CodeBlock code={REST_SUM} lang="ts" />
                    <p>
                        The annotation is an <em>array</em> type even though you call
                        it with separate arguments, and inside the function{" "}
                        <Code>numbers</Code> is a real <Code>number[]</Code>, with
                        every array method. Rest parameters mix with normal ones:
                    </p>
                    <CodeBlock code={REST_MIXED} lang="ts" />
                    <p>
                        A rest parameter swallows everything that remains, so nothing
                        can come after it:
                    </p>
                    <CodeBlock code={REST_LAST} lang="ts" />

                    <p>
                        <Term>Typed per position with a tuple.</Term>{" "}
                        The rest type
                        does not have to be an array of one thing:
                    </p>
                    <CodeBlock code={REST_TUPLE} lang="ts" />
                    <p>
                        This is the labelled tuple from Objects &amp; Aliases used as
                        a parameter list. You will rarely write it directly, but it is
                        how generic wrapper functions forward arguments, so you will
                        read it in library types.
                    </p>

                    <Callout
                        severity="note"
                        label="note · spreading into a call needs a tuple, not an array"
                    >
                        <p>Spreading an ordinary array into that function fails:</p>
                        <CodeBlock code={SPREAD_ARRAY} lang="ts" />
                        <p>
                            <Code>args</Code> is <Code>number[]</Code> — unknown
                            length — so the compiler cannot check it against two
                            required parameters. Make the length part of the type,
                            with <Code>as const</Code> or a tuple annotation:
                        </p>
                        <CodeBlock code={SPREAD_TUPLE} lang="ts" />
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — functions as values ---------- */}
            <PartHeading kicker="part 3">Function Types &amp; Overloads</PartHeading>
            <div>
                <DocSection title="a function as a type">
                    <p>
                        So far every type described a function you were writing. You
                        can also describe a function as a <em>value</em> — the type
                        of a variable, a parameter, or a property that holds one:
                    </p>
                    <CodeBlock code={FN_TYPE} lang="ts" />
                    <p>
                        The syntax is the parameter list, an arrow, the return type.{" "}
                        <Term>
                            In a type, <Code>=&gt;</Code> separates the parameters
                            from the return
                        </Term>{" "}
                        — it is not the arrow of an arrow function, even though it
                        looks identical and the two often sit on the same line.
                    </p>
                    <p>
                        The parameters in <Code>(a, b) =&gt; a + b</Code>{" "}
                        need no
                        annotations, because <Code>Add</Code> already said what they
                        are. This is <Term>contextual typing</Term>: the type flows
                        from the slot into the function. The same function, with and
                        without a slot:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>with a target type</Term>
                                </p>
                                <CodeBlock code={CONTEXTUAL} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>without one</Term>
                                </p>
                                <CodeBlock code={NO_CONTEXT} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Only the one with a known target gets its parameters inferred.
                    </p>

                    <p>
                        <Term>Writing it inline.</Term>{" "}
                        A function type can sit
                        directly in a parameter, which is how a function that takes a
                        callback is typed:
                    </p>
                    <CodeBlock code={INLINE_CALLBACK} lang="ts" />
                    <p>
                        The name <Code>value</Code>{" "}inside the function type is
                        documentation only. The caller&apos;s names are their own —
                        only position and type matter.
                    </p>

                    <p>
                        <Term>The object-property form.</Term>{" "}
                        Inside an object type, a
                        function can be written two ways:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>property syntax</Term>
                                </p>
                                <CodeBlock code={PROPERTY_FORM} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>method syntax</Term>
                                </p>
                                <CodeBlock code={METHOD_FORM} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Both work. Prefer the property form: under{" "}
                        <Code>strict</Code>{" "}
                        its parameter types are checked more
                        strictly, and it reads consistently with every other property.
                        The method form exists mostly for compatibility with how
                        classes and older interface code are written.
                    </p>

                    <Callout
                        severity="note"
                        label="note · this is the type you write most in React"
                    >
                        <p>Every event prop on a component is one:</p>
                        <CodeBlock code={REACT_PROPS} lang="ts" />
                        <p>
                            <Code>=&gt; void</Code>{" "}
                            because the component never uses
                            what a handler returns. Typing Components picks this up.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="why callbacks accept fewer parameters">
                    <p>
                        A function type that asks for two parameters will accept a
                        function that takes one, or none — but not three:
                    </p>
                    <CodeBlock code={FEWER_PARAMS} lang="ts" />
                    <p>
                        <Term>The rule runs that way round because the caller supplies the arguments.</Term>{" "}
                        <Code>Handler</Code> guarantees two values will be passed, so
                        a function that ignores one is safe — JavaScript has always
                        let you drop parameters. A function wanting a third is not
                        safe: nobody will pass it, so <Code>extra</Code> would be{" "}
                        <Code>undefined</Code> at runtime.
                    </p>
                    <p>You have relied on this for as long as you have written callbacks:</p>
                    <CodeBlock code={MAP_CALLBACK} lang="ts" />
                    <p>
                        If the rule were strict, every <Code>map</Code> callback would
                        have to list all three parameters.
                    </p>

                    <p>
                        <Term>The same logic on return types.</Term>{" "}
                        A callback may
                        return <em>more</em> than asked, never less:
                    </p>
                    <CodeBlock code={RETURN_GROWS} lang="ts" />
                    <p>
                        This is the <Code>void</Code>{" "}
                        looseness from part 1, now
                        with its reason: a caller ignores a <Code>void</Code> result,
                        so returning extra is harmless; a caller expecting a string
                        will <em>use</em> it, so returning nothing breaks them.
                    </p>
                    <p>
                        <Term>The general principle:</Term>{" "}
                        a function is
                        substitutable if it demands no more than it is promised and
                        delivers no less than it promised. Parameters can shrink,
                        return types can grow. Assignability works this through
                        properly.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · parameter types are not as forgiving as parameter count"
                    >
                        <p>Dropping a parameter is safe; changing its type is not:</p>
                        <CodeBlock code={PARAM_TYPE} lang="ts" />
                        <p>
                            The caller will pass a string. A function expecting a
                            number would be handed the wrong thing, so the compiler
                            refuses.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="overloads">
                    <p>
                        Overloads describe one function with several valid call
                        shapes, each with its own return type. The problem first: a
                        union signature loses track of which input produced which
                        output.
                    </p>
                    <CodeBlock code={UNION_SIGNATURE} lang="ts" />
                    <p>
                        You know a string in means a number out. The signature does
                        not say so, so every caller has to narrow something they
                        already know.
                    </p>

                    <p>
                        <Term>The overload form.</Term>{" "}
                        Declare the valid shapes, then
                        write one implementation:
                    </p>
                    <CodeBlock code={OVERLOADS} lang="ts" />
                    <p>
                        The first two lines are <Term>overload signatures</Term> —
                        declarations with no body. The third is the{" "}
                        <Term>implementation signature</Term>, which has the body and
                        must be broad enough to accept every overload. It is
                        invisible to callers:
                    </p>
                    <CodeBlock code={NO_OVERLOAD} lang="ts" />
                    <p>
                        <Code>string | number</Code> is what the implementation
                        accepts, but only the two declared shapes are callable — and
                        the error reports each one it tried.
                    </p>

                    <p>
                        <Term>When overloads are the wrong tool.</Term>{" "}
                        Here is the same
                        function written both ways:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>overloads — one line per type</Term>
                                </p>
                                <CodeBlock code={FIRST_OVERLOADS} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>generic — the relationship, once</Term>
                                </p>
                                <CodeBlock code={FIRST_GENERIC} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        The generic works for <Code>boolean[]</Code>,{" "}
                        <Code>User[]</Code>, anything; the overload version needs a
                        new line for each. Overloads list combinations by hand, a
                        generic expresses the relationship once. Reach for overloads
                        only when the shapes are genuinely unrelated — different
                        parameter counts, or input/output pairs with no common
                        pattern. The Generics chapter starts from exactly this.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the implementation signature is not a callable overload"
                    >
                        <p>
                            A common mistake is writing only the implementation and
                            expecting precise returns. Without the declared overload
                            lines above it, the implementation signature <em>is</em>{" "}
                            the signature — callers see{" "}
                            <Code>string | number</Code> in and out, exactly as in the
                            first example of this section, and gain nothing.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · you mostly read these">
                        <p>
                            Overloads are a library-author tool, and the DOM types use
                            them constantly. <Code>document.createElement</Code>{" "}
                            is
                            the classic:
                        </p>
                        <CodeBlock code={CREATE_ELEMENT} lang="ts" />
                        <p>
                            It has three signatures: two look the tag name up in a
                            map of known elements, and a last one takes any string
                            and returns a plain <Code>HTMLElement</Code>. A known tag
                            matches the lookup; anything else falls through to the
                            fallback. Recognising that shape in a <Code>.d.ts</Code>{" "}
                            file matters far more than writing it.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
