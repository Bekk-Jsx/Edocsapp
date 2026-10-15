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
    // --- part 1 (Why a Type Parameter) ---
    // "the-problem" and "a-type-parameter" carry no callout, so no entry.
    // inline `trap · in a .tsx file, <T> before an arrow reads as JSX`
    "generics-you-already-use": ["trap"],

    // --- part 2 (Inference) ---
    // inline `tip · hover to see what T became`
    "inference-from-arguments": ["tip"],
    // "one-t-several-arguments" carries no callout, so no entry.
    // inline `trap · type arguments are all or nothing`
    "writing-type-arguments": ["trap"],

    // --- part 3 (Constraints) ---
    // inline `trap · you cannot build a T yourself`
    "extends-as-a-minimum": ["trap"],
    // inline `note · keyof constraints are next`
    "constraints-in-practice": ["note"],

    // --- part 4 (Generic Types) ---
    // "generic-aliases-and-interfaces" carries no callout, so no entry.
    // inline `trap · static members cannot use T`
    "generic-classes": ["trap"],
    // inline `tip · unknown is the honest default`
    "default-type-parameters": ["tip"],

    // --- part 5 (When Not to Use One) ---
    // "the-used-once-rule" carries no callout, so no entry.
    // inline `trap · parse<User> is JSON.parse as User` + `tip · the generic checklist`
    "a-return-only-t-is-a-hidden-as": ["trap", "tip"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in classes.tsx.
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

// PAGE RULES — those of assignability.tsx, with the exception moved:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it and read by the sentence below it. Two fragments never touch.
// 2. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed `// ❌ ` and written in PLAIN WORDS. Where a
//    contrast helps, a passing line ends in `// ✅`. The markers are plain text
//    in the fragment — no component, no class.
//    EXCEPTION — the js and text blocks in "erasable syntax" are REAL tsc and
//    Node output, verbatim. Never reword them.
// 3. Inferred types are a trailing comment on the same line.
// 4. Traps are inline Callouts; there is no traps section.
// 5. Every fragment declares its language: ts, js for emitted JavaScript, jsonc
//    for tsconfig, and text for terminal output.
// 6. A comparison shows both codes side by side, in the same container-query
//    grid the earlier pages use, and each column opens with a one-line label so
//    two fragments never touch even when stacked.

// ===================================================================
// part 1 — why a type parameter
// ===================================================================

const FIRST_ANY = `function first(items: any[]) {
    return items[0];
}

const name = first(["sam", "alex"]);   // any
name.toFixed(2);                       // compiles — crashes at runtime`;

const FIRST_UNKNOWN = `function first(items: unknown[]) {
    return items[0];
}

const name = first(["sam"]);   // unknown
name.toUpperCase();
// ❌ name is unknown — even though strings were passed in`;

const FIRST_GENERIC = `function first<T>(items: T[]): T | undefined {
    return items[0];
}

const name = first(["sam", "alex"]);   // string | undefined
const id = first([1, 2]);              // number | undefined`;

const FIRST_CHECKED = `name.toUpperCase();
// ❌ name might be undefined — the array could be empty
name?.toUpperCase();   // ✅`;

const LIBRARY_GENERICS = `const tags: Array<string> = [];          // the same as string[]
const cache = new Map<string, number>();
const res: Promise<Response> = fetch(url);`;

const TSX_ARROW = `const first = <T>(items: T[]) => items[0];
// ❌ in .tsx, <T> looks like an opening JSX tag
const first = <T,>(items: T[]) => items[0];   // ✅ the comma marks a type parameter`;

// ===================================================================
// part 2 — inference at the call site
// ===================================================================

const INFER_ARGS = `first(["sam", "alex"]);   // T = string
first([1, "a"]);          // T = string | number — the array's own type`;

const MAP_ALL = `function mapAll<T, U>(items: T[], fn: (item: T) => U): U[] {
    return items.map(fn);
}

mapAll(["sam", "alex"], (name) => name.length);   // T = string, U = number → number[]`;

const MAP_ALL_ERROR = `mapAll([1, 2], (n) => n.toUpperCase());
// ❌ n is a number — numbers have no toUpperCase`;

const SAME = `function same<T>(a: T, b: T): T[] {
    return [a, b];
}

same(1, 2);                      // T = number
same(1, "x");
// ❌ T was taken as number from the first argument — "x" is not a number
same<number | string>(1, "x");   // ✅ T chosen explicitly`;

const WRAP_WIDENS = `function wrap<T>(value: T) {
    return { value };
}

wrap("dark");            // { value: string }
wrap("dark" as const);   // { value: "dark" }`;

const EXPLICIT_ARGS = `first([]);                  // undefined — an empty array gives T nothing (T = never)
first<string>([]);          // string | undefined ✅

new Map();                  // Map<any, any> — the hidden any
new Map<string, number>();  // ✅

useState<User | null>(null);   // null alone would type the state as just null`;

const PARTIAL_ARGS = `mapAll<string>(["sam"], (n) => n.length);
// ❌ mapAll has two type parameters — one was given`;

// ===================================================================
// part 3 — constraints with extends
// ===================================================================

const LONGEST_UNCONSTRAINED = `function longest<T>(a: T, b: T) {
    return a.length >= b.length ? a : b;
    // ❌ T could be a number or a boolean — not every type has length
}`;

const LONGEST = `function longest<T extends { length: number }>(a: T, b: T): T {
    return a.length >= b.length ? a : b;   // ✅ every T has length
}

longest("sam", "alex");   // T = string → string
longest([1, 2], [3]);     // T = number[] → number[]
longest(10, 20);
// ❌ a number has no length — it does not fit the constraint`;

const LONGEST_RESULT = `const r = longest("sam", "alex");   // string
r.toUpperCase();                    // ✅`;

const LONGEST_PLAIN = `function longestPlain(a: { length: number }, b: { length: number }) {
    return a.length >= b.length ? a : b;
}

const r = longestPlain("sam", "alex");   // { length: number }
r.toUpperCase();
// ❌ the result only knows it has a length`;

const BUILD_T = `function reset<T extends { name: string }>(user: T): T {
    return { name: "" };
    // ❌ { name: "" } fits the constraint, but T might be a User with more fields
}`;

const BUILD_FROM_INPUT = `return { ...user, name: "" };   // ✅ keeps every field of T`;

const FIND_BY_ID = `type User = { id: number; name: string };

function findById<T extends { id: number }>(items: T[], id: number): T | undefined {
    return items.find((item) => item.id === id);
}

const user = findById(users, 1);   // User | undefined — name is still there
findById(["a"], 1);
// ❌ a string has no id`;

const WRAP_STRING = `function wrap<T extends string>(value: T) {
    return { value };
}

wrap("dark");   // { value: "dark" }`;

const WRAP_CONST = `function wrap<const T>(value: T) {
    return { value };
}

wrap(["a", "b"]);   // { value: readonly ["a", "b"] }`;

// ===================================================================
// part 4 — generic types
// ===================================================================

const RESULT = `type Result<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

function parseAge(raw: string): Result<number> {
    const n = Number(raw);
    return Number.isNaN(n)
        ? { ok: false, error: "Not a number" }
        : { ok: true, value: n };
}`;

const RESULT_NARROW = `const r = parseAge("30");

r.value;
// ❌ r might be the error case — check ok first
if (r.ok) r.value.toFixed(0);   // ✅ value: number
else r.error;                   // ✅ error: string`;

const BOX = `interface Box<T> {
    value: T;
}

const b: Box<string> = { value: 1 };
// ❌ in a Box<string>, value must be a string`;

const NO_TYPE_ARG = `const r: Result = { ok: false, error: "x" };
// ❌ Result needs its type argument — Result<what>?`;

const STACK = `class Stack<T> {
    #items: T[] = [];

    push(item: T): void {
        this.#items.push(item);
    }

    pop(): T | undefined {
        return this.#items.pop();
    }
}

const numbers = new Stack<number>();
numbers.push(1);     // ✅
numbers.push("2");
// ❌ this stack holds numbers`;

const HOLDER = `class Holder<T> {
    constructor(public value: T) {}
}

new Holder("dark");   // Holder<string>
new Stack();          // Stack<unknown> — write new Stack<number>()`;

const STATIC_T = `class Stack<T> {
    static empty: T;
    // ❌ static belongs to the class itself — T only exists per instance
}`;

const API_RESPONSE = `type ApiResponse<T = unknown> = { data: T; status: number };

const a: ApiResponse = { data: 1, status: 200 };            // T = unknown
const b: ApiResponse<User> = { data: user, status: 200 };   // T = User`;

const PAGE_META = `type Page<T, TMeta = { page: number }> = { items: T[]; meta: TMeta };

const users: Page<User> = { items: [], meta: { page: 1 } };   // TMeta takes its default`;

const DEFAULT_ORDER = `type Wrong<T = string, U> = { a: T; b: U };
// ❌ a required type parameter cannot follow one with a default`;

// ===================================================================
// part 5 — when not to use a generic
// ===================================================================

const LOG_GENERIC = `function log<T>(value: T): void {
    console.log(value);
}`;

const LOG_UNKNOWN = `function log(value: unknown): void {
    console.log(value);
}`;

const SIZE_GENERIC = `function size<T extends { length: number }>(x: T): number {
    return x.length;
}`;

const SIZE_PLAIN = `function size(x: { length: number }): number {
    return x.length;
}`;

const PARSE_ANY = `function parse<T>(raw: string): T {
    return JSON.parse(raw);
}

const user = parse<User>('{"id":"x"}');   // User — nothing was checked
user.name.toUpperCase();                  // compiles — crashes at runtime`;

const PARSE_UNKNOWN = `function parse<T>(raw: string): T {
    const data: unknown = JSON.parse(raw);
    return data;
    // ❌ unknown is not T — the function cannot prove the data is what the caller picked
}`;

const PARSE_WITH = `function parseWith<T>(raw: string, isT: (v: unknown) => v is T): T | null {
    const data: unknown = JSON.parse(raw);
    return isT(data) ? data : null;
}

const user = parseWith('{"id":"x"}', isUser);   // User | null — null at runtime ✅`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings the earlier pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function GenericsBasicsDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the earlier pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A generic is a function or type with a hole for a type, filled in
                    fresh at every use. It solves one problem —{" "}
                    <Term>
                        keeping the link between what goes in and what comes out
                    </Term>{" "}
                    — that <Code>any</Code> and <Code>unknown</Code> both break.
                </p>
                <p>
                    This page covers writing type parameters, letting the compiler
                    infer them, limiting them with <Code>extends</Code>, generic types
                    and classes with defaults, and the cases where a generic is the
                    wrong tool. <Code>keyof</Code> and indexed access come next, on
                    Keys &amp; Lookups.
                </p>
            </div>

            {/* ---------- part 1 — the missing link ---------- */}
            <PartHeading kicker="part 1">Why a Type Parameter</PartHeading>
            <div>
                <DocSection title="the problem">
                    <p>
                        Take a function that returns the first item of any array. Typed
                        with <Code>any</Code>, the type of the items is lost on the way
                        out:
                    </p>
                    <CodeBlock code={FIRST_ANY} lang="ts" />
                    <p>
                        The compiler checks nothing on an <Code>any</Code>, so a call
                        that makes no sense for a string goes through.{" "}
                        <Code>unknown</Code> is safe, but useless here — every caller
                        has to re-check a value they already know:
                    </p>
                    <CodeBlock code={FIRST_UNKNOWN} lang="ts" />
                    <p>
                        Both versions forget what was passed in. What is missing is a
                        link:{" "}
                        <Term>
                            &ldquo;the type that comes out is the type that went
                            in&rdquo;.
                        </Term>
                    </p>
                </DocSection>

                <DocSection title="a type parameter">
                    <p>
                        <Term>The link is a type parameter</Term>, written in angle
                        brackets after the function name:
                    </p>
                    <CodeBlock code={FIRST_GENERIC} lang="ts" />
                    <p>How to read it:</p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            <Code>{"<T>"}</Code> declares a type variable — a
                            placeholder for a type, as a parameter is for a value;
                        </li>
                        <li>
                            <Code>items: T[]</Code> — an array of that type;
                        </li>
                        <li>
                            <Code>: T | undefined</Code> — the same type back, or{" "}
                            <Code>undefined</Code> for an empty array;
                        </li>
                        <li>
                            each call fills <Code>T</Code> separately —{" "}
                            <Code>string</Code>, then <Code>number</Code>.
                        </li>
                    </ul>
                    <p>
                        Checking still works, because the result is a real type rather
                        than <Code>any</Code>:
                    </p>
                    <CodeBlock code={FIRST_CHECKED} lang="ts" />
                    <p>
                        The compiler knows <Code>name</Code> is a string or nothing, so
                        it asks for exactly the check the runtime needs.
                    </p>
                </DocSection>

                <DocSection title="generics you already use">
                    <p>
                        The standard library is full of generics; you have been filling
                        their type parameters all along:
                    </p>
                    <CodeBlock code={LIBRARY_GENERICS} lang="ts" />
                    <p>
                        <Code>Map</Code> has two type parameters — <Code>K</Code> for
                        keys, <Code>V</Code> for values — and you fill both.
                    </p>
                    <p>
                        <Term>
                            The name <Code>T</Code> is only a convention
                        </Term>{" "}
                        (for Type). Use descriptive names when there are several or
                        when the meaning helps: <Code>TKey</Code>,{" "}
                        <Code>TValue</Code>, <Code>Item</Code>. It is a name like any
                        variable.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · in a .tsx file, <T> before an arrow reads as JSX"
                    >
                        <p>
                            A generic arrow function puts its type parameter right
                            before the parentheses, which in a <Code>.tsx</Code> file
                            is also where a JSX tag can start:
                        </p>
                        <CodeBlock code={TSX_ARROW} lang="ts" />
                        <p>
                            In a <Code>.ts</Code> file <Code>{"<T>"}</Code> works;
                            function declarations never have this problem.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the compiler fills T ---------- */}
            <PartHeading kicker="part 2">Inference at the Call Site</PartHeading>
            <div>
                <DocSection title="inference from arguments">
                    <p>
                        <Term>
                            You rarely write <Code>{"<T>"}</Code> when calling
                        </Term>{" "}
                        — the compiler fills it from the arguments:
                    </p>
                    <CodeBlock code={INFER_ARGS} lang="ts" />
                    <p>
                        It works through callbacks too: every type parameter is filled
                        from wherever it appears.
                    </p>
                    <CodeBlock code={MAP_ALL} lang="ts" />
                    <p>
                        <Code>T</Code> comes from the array first, so{" "}
                        <Code>name</Code> is already a string inside the callback
                        (contextual typing, Functions); <Code>U</Code> comes from what
                        the callback returns. Checks still apply:
                    </p>
                    <CodeBlock code={MAP_ALL_ERROR} lang="ts" />
                    <p>
                        The callback was typed from the array, so the mistake is caught
                        inside it.
                    </p>

                    <Callout severity="tip" label="tip · hover to see what T became">
                        <p>
                            Hovering the call in the editor shows the filled-in
                            signature — <Code>{"mapAll<string, number>(…)"}</Code> —
                            the fastest way to debug a generic.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="one T, several arguments">
                    <p>
                        <Term>
                            When <Code>T</Code> appears twice, both arguments must
                            agree
                        </Term>
                        , and the first one decides:
                    </p>
                    <CodeBlock code={SAME} lang="ts" />
                    <p>
                        Writing the type argument opens <Code>T</Code> up to both.
                        Literals widen, as with <Code>let</Code>:
                    </p>
                    <CodeBlock code={WRAP_WIDENS} lang="ts" />
                    <p>
                        Part 3 shows how a constraint keeps the literal without{" "}
                        <Code>as const</Code>.
                    </p>
                </DocSection>

                <DocSection title="writing type arguments">
                    <p>
                        <Term>
                            Write type arguments when the starting value does not show
                            the real type
                        </Term>{" "}
                        — there is nothing to infer from:
                    </p>
                    <CodeBlock code={EXPLICIT_ARGS} lang="ts" />
                    <p>
                        The rule in one line: an empty array, an empty{" "}
                        <Code>Map</Code>, a <Code>null</Code> that will later hold a
                        value.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · type arguments are all or nothing"
                    >
                        <p>
                            Giving only some of them does not let the compiler infer
                            the rest:
                        </p>
                        <CodeBlock code={PARTIAL_ARGS} lang="ts" />
                        <p>
                            Either let both be inferred, or write both:{" "}
                            <Code>{"mapAll<string, number>(…)"}</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — limiting T ---------- */}
            <PartHeading kicker="part 3">Constraints with extends</PartHeading>
            <div>
                <DocSection title="extends as a minimum">
                    <p>
                        Inside a generic, <Code>T</Code> could be anything, so almost
                        nothing is allowed on it:
                    </p>
                    <CodeBlock code={LONGEST_UNCONSTRAINED} lang="ts" />
                    <p>
                        <Term>
                            <Code>extends</Code> limits what <Code>T</Code> may be
                        </Term>{" "}
                        — &ldquo;<Code>T</Code> must fit this shape&rdquo; — and unlocks
                        that shape inside:
                    </p>
                    <CodeBlock code={LONGEST} lang="ts" />
                    <p>
                        Strings and arrays both fit by structure (Assignability): each
                        has a numeric <Code>length</Code>. Why not simply type the
                        parameters as <Code>{"{ length: number }"}</Code>? Compare the
                        results:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>generic — the real type comes back</Term>
                                </p>
                                <CodeBlock code={LONGEST_RESULT} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>plain parameter — the type is lost</Term>
                                </p>
                                <CodeBlock code={LONGEST_PLAIN} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        <Term>
                            The constraint is the minimum <Code>T</Code> must have;{" "}
                            <Code>T</Code> is still the full real type.
                        </Term>
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · you cannot build a T yourself"
                    >
                        <p>
                            Returning a value that merely fits the constraint is an
                            error:
                        </p>
                        <CodeBlock code={BUILD_T} lang="ts" />
                        <p>
                            The real message reads &ldquo;
                            <Code>
                                {"'{ name: string; }' is assignable to the constraint of type 'T', but 'T' could be instantiated with a different subtype"}
                            </Code>
                            &rdquo;. The caller may pass a full <Code>User</Code> and
                            would get back an object missing its fields. Build from
                            what you received:
                        </p>
                        <CodeBlock code={BUILD_FROM_INPUT} lang="ts" />
                        <p>
                            The spread copies every field of the real <Code>T</Code>,
                            so the result is one.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="constraints in practice">
                    <p>
                        The most common real constraint is &ldquo;anything with an{" "}
                        <Code>id</Code>&rdquo;:
                    </p>
                    <CodeBlock code={FIND_BY_ID} lang="ts" />
                    <p>
                        One function serves Users, Products and Orders — each call
                        returns its own full type.{" "}
                        <Term>A constraint to a primitive keeps the literal:</Term>
                    </p>
                    <CodeBlock code={WRAP_STRING} lang="ts" />
                    <p>
                        For literals of any type, arrays included, TypeScript 5.0&apos;s{" "}
                        <Code>const</Code> type parameter acts like an automatic{" "}
                        <Code>as const</Code>:
                    </p>
                    <CodeBlock code={WRAP_CONST} lang="ts" />
                    <p>
                        The caller writes a plain array and still gets the exact tuple
                        back.
                    </p>

                    <Callout severity="note" label="note · keyof constraints are next">
                        <p>
                            <Code>K extends keyof T</Code> — &ldquo;a key of this
                            object&rdquo; — is the other big constraint pattern; it is
                            covered on Keys &amp; Lookups.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — types with holes ---------- */}
            <PartHeading kicker="part 4">Generic Types</PartHeading>
            <div>
                <DocSection title="generic aliases and interfaces">
                    <p>
                        <Term>Types take parameters too</Term> — written once, filled
                        at every use:
                    </p>
                    <CodeBlock code={RESULT} lang="ts" />
                    <p>
                        This is a discriminated union (Unions &amp; Narrowing) with one
                        hole, and narrowing works as usual:
                    </p>
                    <CodeBlock code={RESULT_NARROW} lang="ts" />
                    <p>An interface works the same way:</p>
                    <CodeBlock code={BOX} lang="ts" />
                    <p>
                        <Term>A generic type does not infer.</Term> An annotation has
                        no arguments to read from:
                    </p>
                    <CodeBlock code={NO_TYPE_ARG} lang="ts" />
                    <p>
                        Inference happens at calls; in a type position you always
                        write the argument, unless a default covers it.
                    </p>
                </DocSection>

                <DocSection title="generic classes">
                    <p>
                        A class takes a type parameter after its name, and{" "}
                        <Term>the parameter is shared by every member</Term>:
                    </p>
                    <CodeBlock code={STACK} lang="ts" />
                    <p>
                        <Code>new</Code> does infer, from the constructor arguments —
                        with nothing to read, <Code>T</Code> is{" "}
                        <Code>unknown</Code>:
                    </p>
                    <CodeBlock code={HOLDER} lang="ts" />
                    <p>
                        An empty collection is the class version of the empty array
                        from part 2: write the type argument.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · static members cannot use T"
                    >
                        <p>A static member cannot mention the class&apos;s type parameter:</p>
                        <CodeBlock code={STATIC_T} lang="ts" />
                        <p>
                            There is one <Code>Stack</Code> class and many{" "}
                            <Code>{"Stack<number>"}</Code> /{" "}
                            <Code>{"Stack<string>"}</Code> instances: a static member
                            cannot know which <Code>T</Code> is meant.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="default type parameters">
                    <p>
                        <Code>{"<T = …>"}</Code> is used when nobody fills the
                        parameter in, like a default parameter value:
                    </p>
                    <CodeBlock code={API_RESPONSE} lang="ts" />
                    <p>
                        <Term>
                            A default is most useful on a second parameter that is
                            usually the same:
                        </Term>
                    </p>
                    <CodeBlock code={PAGE_META} lang="ts" />
                    <p>
                        Callers name only what varies. Defaults go last, like optional
                        parameters:
                    </p>
                    <CodeBlock code={DEFAULT_ORDER} lang="ts" />
                    <p>
                        Swap the two — <Code>{"Wrong<U, T = string>"}</Code> — and it
                        compiles.
                    </p>

                    <Callout severity="tip" label="tip · unknown is the honest default">
                        <p>
                            <Code>unknown</Code> says &ldquo;check before use&rdquo;. A
                            default of <Code>any</Code> is a hidden <Code>any</Code>{" "}
                            (First Types, where any hides).
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — the wrong tool ---------- */}
            <PartHeading kicker="part 5">When Not to Use a Generic</PartHeading>
            <div>
                <DocSection title="the used-once rule">
                    <p>
                        A generic exists to link types — input to output, or one
                        parameter to another.{" "}
                        <Term>
                            A <Code>T</Code> that appears once links nothing:
                        </Term>
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>T used once</Term>
                                </p>
                                <CodeBlock code={LOG_GENERIC} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>the same, honestly</Term>
                                </p>
                                <CodeBlock code={LOG_UNKNOWN} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Both accept anything and promise nothing back. The same holds
                        with a constraint:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>T used once</Term>
                                </p>
                                <CodeBlock code={SIZE_GENERIC} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>the constraint is enough</Term>
                                </p>
                                <CodeBlock code={SIZE_PLAIN} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Contrast <Code>longest</Code> from part 3: it RETURNS{" "}
                        <Code>T</Code>, so its link is real. The test in one line:{" "}
                        <Term>
                            does <Code>T</Code> appear at least twice — two
                            parameters, or a parameter and the return type?
                        </Term>
                    </p>
                    <p>
                        And not &ldquo;just in case&rdquo;: if a function only ever
                        handles Users,{" "}
                        <Code>findUser(users: User[], id: number)</Code> reads better
                        than a generic <Code>findById</Code>. Make it generic when a
                        second real type appears.
                    </p>
                </DocSection>

                <DocSection title="a return-only T is a hidden as">
                    <p>
                        <Term>
                            A <Code>T</Code> only in the return type looks typed and
                            checks nothing:
                        </Term>
                    </p>
                    <CodeBlock code={PARSE_ANY} lang="ts" />
                    <p>
                        The caller picks <Code>T</Code>, and the function cannot know
                        whether the data matches. It compiles only because{" "}
                        <Code>JSON.parse</Code> returns <Code>any</Code>; with{" "}
                        <Code>unknown</Code> the compiler refuses:
                    </p>
                    <CodeBlock code={PARSE_UNKNOWN} lang="ts" />
                    <p>
                        The honest version links <Code>T</Code> to a real check —{" "}
                        <Code>T</Code> now appears twice, and is inferred from the
                        guard:
                    </p>
                    <CodeBlock code={PARSE_WITH} lang="ts" />
                    <p>
                        The bad data is caught when it arrives: <Code>id</Code> is a
                        string, so <Code>isUser</Code> says no and the caller gets{" "}
                        <Code>null</Code> instead of a crash later.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · parse<User> is JSON.parse as User"
                    >
                        <p>
                            <Code>{"parse<User>(raw)"}</Code> is a nicer look on the
                            same assertion as <Code>JSON.parse(raw) as User</Code>{" "}
                            (Assignability, as overrides the check). The type argument
                            is a claim, not a check.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · the generic checklist">
                        <ol className="list-decimal space-y-1 pl-5">
                            <li>
                                Does <Code>T</Code> appear twice or more? If not, use
                                the constraint or <Code>unknown</Code>.
                            </li>
                            <li>
                                Is <Code>T</Code> only in the return? That is a hidden{" "}
                                <Code>as</Code> — return <Code>unknown</Code>, or take
                                a guard.
                            </li>
                            <li>
                                Does more than one real type use it today? If not,
                                write the concrete type.
                            </li>
                        </ol>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
