import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is one
// severity. No section here is, so every callout below is inline only.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Annotations & Inference) ---
    // inline `trap · an annotation is not a conversion`
    "the-annotation": ["trap"],
    // inline `note · annotate, infer, any` + `trap · a missing parameter type…`
    inference: ["trap", "note"],
    // inline `note · as const on a plain variable` + `note · const is not deep`
    "let-const-and-widening": ["note"],
    // inline `danger · any is contagious`
    "any-sneaking-in": ["danger"],

    // --- part 2 (Primitives & Arrays) ---
    // inline `trap · String, Number, Boolean are not the types you mean`
    "the-primitives": ["trap"],
    // inline `trap · the empty array` + `trap · indexing is not bounds-checked`
    arrays: ["trap"],

    // --- part 3 (Literal Types) ---
    // inline `note · this is why as const matters`
    "a-type-with-one-value": ["note"],
    // inline `trap · numeric enums are worse`
    "literal-unions-vs-enum": ["trap"],

    // --- part 4 (any, unknown, never) ---
    // inline `trap · any is invisible`
    "any-turns-the-checker-off": ["trap"],
    // inline `note · checking a property` + `note · the rule of thumb`
    "unknown-the-safe-any": ["note"],
    // inline `note · why literal unions beat loose strings`
    never: ["note"],

    // --- part 5 (Types & Values) ---
    // inline `note · the colon is the type` + `note · what exists in both worlds`
    "two-separate-worlds": ["note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper every redis and elasticsearch content file defines for
// its own part dividers.
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

// PAGE RULES, applied to every section below — this is the first written page of
// the project, so these are the template every later typescript page follows.
//
// 1. A section opens with prose: the reader knows what it is about before any
//    fragment appears.
// 2. Fragments are SMALL and single-purpose. Every one is introduced by the
//    sentence above it and read by the sentence below it. Two fragments never
//    touch, and no section is one long listing.
// 3. A compiler error is written as a comment on the line BELOW the offending
//    code, in the wording tsc actually prints. Every message on this page was
//    produced by this repo's own tsc (5.9) under `strict`, not recalled.
// 4. An inferred type is written as a trailing comment on the same line.
// 5. Traps live inline, as Callouts inside the section they belong to. There is
//    no traps section anywhere on this page.
// 6. Every fragment declares a language: ts for TypeScript, js for emitted
//    output, jsonc for tsconfig.
//
// No demo and no "use client": TypeScript is erased before anything runs and
// there is no compiler in the browser, so this project is documentation plus
// fragments, permanently.

// ===================================================================
// part 1 — annotations & inference
// ===================================================================

const ANNOTATION = `const name: string = "Nasereddine";
let count: number = 0;

function greet(user: string): string {
    return \`hello \${user}\`;
}`;

const ANNOTATION_BREAK = `const name: string = 42;
// Type 'number' is not assignable to type 'string'.`;

const ERASED = `const name = "Nasereddine";
let count = 0;

function greet(user) {
    return \`hello \${user}\`;
}`;

const INFERRED = `const name = "Nasereddine";   // string
let count = 0;                // number
const active = true;          // boolean`;

const INFERRED_IS_REAL = `let count = 0;     // number
count = "zero";
// Type 'string' is not assignable to type 'number'.`;

const INFER_RETURN = `function double(n: number) {
    return n * 2;
}

const result = double(21);    // number`;

const IMPLICIT_ANY = `function total(price) { return price * 1.2; }
// Parameter 'price' implicitly has an 'any' type.`;

const WIDENING = `let mode = "dark";       // string
const theme = "dark";    // "dark"`;

const UNION_FIT = `type Theme = "dark" | "light";

const a = "dark";    // "dark"
let b = "dark";      // string

const t1: Theme = a;   // ok
const t2: Theme = b;
// Type 'string' is not assignable to type 'Theme'.`;

const WIDENING_FIXES = `let b: Theme = "dark";      // narrow the variable
let c = "dark" as const;    // freeze this one literal`;

const AS_CONST_COPY = `const a = "dark";
let x = a;   // string — the literal widened on copy

const b = "dark" as const;
let y = b;   // "dark" — non-widening, it stays put`;

const AS_CONST_OBJECT = `const a = { theme: "dark" };            // { theme: string }
const b = { theme: "dark" } as const;   // { readonly theme: "dark" }`;

const CONST_NOT_DEEP = `const user = { name: "sam" };
user.name = "alex";          // ok — the contents are not protected
user = { name: "alex" };
// Cannot assign to 'user' because it is a constant.`;

const TYPO = `function greet(user) {
    return user.nmae.toUpperCase();
}`;

const ANY_DOORS = `function save(user) {}                  // implicit any parameter
const data = JSON.parse(raw);           // any, always
const value = input as any;             // written on purpose
import legacy from "untyped-package";   // any — no types shipped`;

const TYPO_TYPED = `function greet(user: { name: string }) { return user.nmae.toUpperCase(); }
// Property 'nmae' does not exist on type '{ name: string; }'.`;

// ===================================================================
// part 2 — primitives & arrays
// ===================================================================

const PRIMITIVES = `let title: string;
let count: number;
let ready: boolean;`;

const WRAPPERS = `let s: String = "hi";   // compiles — the boxed object type
const t: string = s;
// Type 'String' is not assignable to type 'string'.
//   'string' is a primitive, but 'String' is a wrapper object.`;

const ONE_NUMBER = `const int = 42;          // number
const float = 3.14;      // number
const broken = NaN;      // number
const huge = Infinity;   // number`;

const NULLS = `let name: string = null;
// Type 'null' is not assignable to type 'string'.

let maybe: string | null = null;   // say it instead`;

const EXOTIC = `const big: bigint = 10n;
const key: symbol = Symbol("id");`;

const ARRAY = `const names: string[] = ["sam", "alex"];
const scores: number[] = [10, 20];`;

const ARRAY_INFER = `const names = ["sam", "alex"];   // string[]
names.push(42);
// Argument of type 'number' is not assignable to parameter of type 'string'.`;

const ARRAY_PARENS = `const mixed: (string | number)[] = ["a", 1];   // array of (string or number)
const other: string | number[] = "a";          // a string, OR an array of number`;

const ARRAY_GENERIC = `const names: Array<string> = ["sam", "alex"];   // identical to string[]`;

const EMPTY_ARRAY = `const items = [];        // any[] — nothing to read
items.push("sam");
items.push(42);
const first = items[0];
first.toUpperCase();
// Property 'toUpperCase' does not exist on type 'string | number'.`;

const EMPTY_ARRAY_ESCAPES = `const bag = [];
// Variable 'bag' implicitly has type 'any[]' in some locations
// where its type cannot be determined.
function add(value: string) { bag.push(value); }
bag[0].toUpperCase();
// Variable 'bag' implicitly has an 'any[]' type.`;

const INDEXING = `const names = ["sam"];     // string[]
const second = names[1];   // typed string — undefined at runtime
second.toUpperCase();
// no compiler error. At runtime:
// TypeError: Cannot read properties of undefined (reading 'toUpperCase')`;

const NO_UNCHECKED = `{
    "compilerOptions": {
        // every arr[i] becomes T | undefined, and must be checked
        "noUncheckedIndexedAccess": true
    }
}`;

// ===================================================================
// part 3 — literal types
// ===================================================================

const LITERAL = `let mode: "dark" = "dark";
mode = "light";
// Type '"light"' is not assignable to type '"dark"'.`;

const LITERAL_KINDS = `let a: "dark" = "dark";   // a string literal type
let b: 42 = 42;           // a number literal type
let c: true = true;       // a boolean literal type`;

const LITERAL_UNION = `type Theme = "dark" | "light" | "auto";

let theme: Theme = "dark";
theme = "blue";
// Type '"blue"' is not assignable to type 'Theme'.`;

const UNION_SIGNATURES = `function setTheme(theme: string) {}   // accepts "dakr", "", "banana"
function setTheme(theme: Theme) {}    // accepts three things`;

const UNION_VS_ENUM = `// one or the other, not both

type Theme = "dark" | "light";
setTheme("dark");

enum Theme { Dark = "dark", Light = "light" }
setTheme(Theme.Dark);`;

const ENUM_AS_OBJECT = `const Theme = { Dark: "dark", Light: "light" };`;

const ENUM_EMITTED = `var Theme;
(function (Theme) {
    Theme["Dark"] = "dark";
    Theme["Light"] = "light";
})(Theme || (Theme = {}));`;

const ENUM_BOUNDARY = `const stored = localStorage.getItem("theme");   // a plain string

// union — the value already fits
const a: Theme = stored as Theme;

// enum — convert at the boundary
const b: Theme = Theme[stored as keyof typeof Theme];`;

const NUMERIC_ENUM = `enum Status { Active, Done }   // Active = 0, Done = 1, by position

const s: Status = 99;
// Type '99' is not assignable to type 'Status'.`;

const NUMERIC_ENUM_HOLE = `enum Level { Low = 1, High = compute() }

const l: Level = 99;   // compiles — any number fits`;

// ===================================================================
// part 4 — any, unknown, never
// ===================================================================

const ANY = `let value: any = "hello";

value.toUpperCase();   // works
value.foo.bar.baz();   // crashes at runtime
value();               // crashes at runtime
value * 10;            // NaN — no crash, just wrong`;

const ANY_SPREADS = `const data: any = JSON.parse(raw);

const user = data.user;   // any
const name = user.name;   // any
name.toUpperCase();       // any — checked by nobody`;

const ANY_VS_UNKNOWN = `function handle(input: any) {}       // "type-check nothing in here"
function handle(input: unknown) {}   // "I don't know yet — prove it first"`;

const UNKNOWN = `let a: any = getData();
a.toUpperCase();        // ok

let u: unknown = getData();
u.toUpperCase();
// 'u' is of type 'unknown'.`;

const UNKNOWN_PROVE = `let u: unknown = getData();

if (typeof u === "string") {
    u.toUpperCase();   // string in here
}`;

const UNKNOWN_ONE_WAY = `const u: unknown = "hi";   // anything goes in
const s: string = u;
// Type 'unknown' is not assignable to type 'string'.`;

const UNKNOWN_CATCH = `try {
    risky();
} catch (e) {
    // e is unknown: JavaScript lets you throw anything
    if (e instanceof Error) console.error(e.message);
}`;

const UNKNOWN_IN = `if (typeof value === "object" && value !== null && "name" in value) {
    value.name;   // unknown — known to be there, not known to be a string
}`;

const TYPE_GUARD = `function hasName(value: unknown): value is { name: string } {
    return (
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        typeof value.name === "string"
    );
}`;

const NEVER = `let b: never = undefined;
// Type 'undefined' is not assignable to type 'never'.`;

const NEVER_RETURNS = `function fail(message: string): never {
    throw new Error(message);
}

function listen(): never {
    while (true) {}
}`;

const EXHAUSTIVE = `type Theme = "dark" | "light";

function apply(theme: Theme) {
    if (theme === "dark") return darkTokens;
    if (theme === "light") return lightTokens;

    const exhaustive: never = theme;   // ok — all cases handled
    return exhaustive;
}`;

const EXHAUSTIVE_BREAKS = `type Theme = "dark" | "light" | "auto";

    const exhaustive: never = theme;
    // Type '"auto"' is not assignable to type 'never'.`;

// ===================================================================
// part 5 — types & values
// ===================================================================

const TWO_WORLDS = `const user = { name: "sam" };   // a VALUE — exists at runtime
type User = { name: string };   // a TYPE — deleted at compile time`;

const THE_LINE = `const theme: Theme = "dark";
//    ^^^^^  ^^^^^   ^^^^^^
//    value  type    value`;

const NAMESPACES = `type User = { name: string };
const User = { name: "sam" };   // no conflict — different namespaces`;

const CROSSING_VALUE = `const user = { name: "sam" };

function greet(u: user) {}
// 'user' refers to a value, but is being used as a type here.
// Did you mean 'typeof user'?`;

const CROSSING_TYPE = `type User = { name: string };

console.log(User);
// 'User' only refers to a type, but is being used as a value here.`;

const TYPEOF_BRIDGE = `const config = { host: "localhost", port: 5432 };

type Config = typeof config;   // { host: string; port: number }`;

const COLON_AND_EQUALS = `function greet(u: User = defaultUser) {}
//                ^^^^   ^^^^^^^^^^^
//                type   value`;

export function FirstTypesDocs() {
    return (
        <>
            {/* Page lead. Frames what the whole project is before the first
                divider: a type is a claim checked before the program runs, and
                nothing survives into the program itself. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    TypeScript is one idea applied relentlessly:{" "}
                    <Term>
                        write down what a value is supposed to be, and have a
                        program check you before anything runs.
                    </Term>{" "}
                    Everything on this page — annotations, inference, literal
                    types, <Code>any</Code> — is a way of making that claim, or a
                    way of giving up on making it.
                </p>
                <p>
                    The thing to hold onto from the start is that none of it
                    exists at runtime. The compiler reads the claims, reports what
                    does not add up, deletes every one of them and emits plain
                    JavaScript. A type is a conversation with the compiler, not a
                    feature of the running program.
                </p>
                <p>
                    Every error message quoted here is the real one, produced by
                    this repo&apos;s own compiler under <Code>strict: true</Code>
                    {" "}— assume that setting for the whole project. Errors are
                    written as a comment on the line below the code that caused
                    them, and inferred types as a comment at the end of the line.
                </p>
            </div>

            {/* ---------- part 1 — the claim, and who makes it ---------- */}
            <PartHeading kicker="part 1">Annotations &amp; Inference</PartHeading>
            <div>
                <DocSection title="the annotation">
                    <p>
                        <Term>
                            An annotation is a claim you write about a value,
                            attached with a colon.
                        </Term>{" "}
                        The compiler checks the claim. It does not trust it, and it
                        has no way to make it true — it can only agree or object.
                    </p>
                    <CodeBlock code={ANNOTATION} lang="ts" />
                    <p>
                        The colon goes in three places: after the variable name,
                        after each parameter name, and after the parameter list for
                        a return type. Everything to the right of a colon is{" "}
                        <Term>type syntax</Term> — a separate language living inside
                        the JavaScript, with its own grammar. Learning to see the
                        line break into those two halves is most of learning to read
                        TypeScript.
                    </p>
                    <p>
                        Break the claim and the objection arrives immediately:
                    </p>
                    <CodeBlock code={ANNOTATION_BREAK} lang="ts" />
                    <p>
                        <Term>Read that as a sentence.</Term>{" "}
                        The value&apos;s type
                        is <Code>number</Code>, the slot&apos;s type is{" "}
                        <Code>string</Code>, and one does not fit into the other.
                        Every assignability error in TypeScript is that same
                        sentence with different nouns, however long the two type
                        names grow — which is why Assignability gets a page of its
                        own later in this chapter.
                    </p>
                    <p>
                        <Term>Annotations vanish at runtime.</Term> The same file,
                        compiled, is the JavaScript you would have written by hand
                        with every type deleted:
                    </p>
                    <CodeBlock code={ERASED} lang="js" />
                    <p>
                        Nothing checks types while the program runs, because by then
                        there is nothing left to check with. This has one large
                        consequence, covered in Data Boundaries &amp; Async: anything
                        arriving from outside the program — a response body, a form
                        field, an environment variable — is unchecked no matter what
                        it was annotated as.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · an annotation is not a conversion"
                    >
                        <p>
                            <Code>const id: string = someValue</Code> does not turn{" "}
                            <Code>someValue</Code> into a string. It asserts that it
                            already is one, and errors if it is not. There is no
                            runtime coercion anywhere in the type system — nothing
                            in an annotation ever changes a value.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="inference">
                    <p>
                        <Term>You rarely write annotations.</Term> When a variable is
                        declared with a value, the compiler reads the value and
                        derives the type itself.
                    </p>
                    <CodeBlock code={INFERRED} lang="ts" />
                    <p>
                        <Term>An inferred type is a real type, not a weaker one.</Term>{" "}
                        Nothing is relaxed by leaving the annotation off:
                    </p>
                    <CodeBlock code={INFERRED_IS_REAL} lang="ts" />
                    <p>
                        Inference runs through returns as well. The compiler knows
                        what <Code>n * 2</Code> produces, so it knows what the
                        function produces, and so it knows what the call site gets:
                    </p>
                    <CodeBlock code={INFER_RETURN} lang="ts" />
                    <p>
                        <Term>Annotate inputs, infer outputs.</Term> That is the
                        working rule, and the reason for it is mechanical rather
                        than stylistic. A parameter has no value to inspect — it is
                        filled in at call time, by code the compiler may not have
                        read yet — so you have to say. A return value is computed
                        from those parameters, so once the inputs are known the
                        compiler already knows the output and repeating it adds
                        nothing.
                    </p>
                    <p>
                        The exception is a function other code depends on. On an
                        exported or otherwise public function, an explicit return
                        type is a deliberate contract: it pins the shape, so a
                        change inside the body that alters what comes out fails
                        there rather than silently at every call site.
                    </p>

                    <Callout severity="note" label="note · annotate, infer, any">
                        <p>
                            <Term>annotate</Term> — you decide the type, and it is
                            checked.
                        </p>
                        <p>
                            <Term>infer</Term> — the compiler decides the type, and
                            it is checked.
                        </p>
                        <p>
                            <Term>any</Term> — nobody decides, and nothing is
                            checked.
                        </p>
                        <p>
                            Inference is not &ldquo;skipping the type&rdquo;. The
                            type is there and fully enforced; the only difference is
                            who wrote it down. The thing that actually skips
                            checking is <Code>any</Code>, and it has its own name
                            for exactly that reason.
                        </p>
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · a missing parameter type is not an error by default"
                    >
                        <p>
                            Without <Code>strict</Code>, an un-annotated parameter
                            does not fail — it silently becomes <Code>any</Code>,
                            and checking inside that function stops.{" "}
                            <Code>noImplicitAny</Code> turns the silence into an
                            error:
                        </p>
                        <CodeBlock code={IMPLICIT_ANY} lang="ts" />
                        <p>
                            It is on under <Code>strict: true</Code>, which this
                            whole project assumes.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="let, const, and widening">
                    <p>
                        The same value, declared two ways, gets two different
                        inferred types:
                    </p>
                    <CodeBlock code={WIDENING} lang="ts" />
                    <p>
                        <Term>
                            <Code>const</Code> keeps the literal, <Code>let</Code>{" "}
                            widens it.
                        </Term>{" "}
                        A <Code>const</Code> can never be reassigned, so the
                        compiler is safe to remember the exact value as the type. A{" "}
                        <Code>let</Code> can hold something else tomorrow, so the
                        compiler widens to the general type the value belongs to.
                    </p>
                    <p>
                        That sounds like trivia until a union is involved, which is
                        where everyone meets it for the first time:
                    </p>
                    <CodeBlock code={UNION_FIT} lang="ts" />
                    <p>
                        <Code>string</Code> includes <Code>&quot;purple&quot;</Code>{" "}
                        and every other string there has ever been, which is far
                        wider than <Code>Theme</Code> allows — so it does not fit.
                        Note what the compiler did <em>not</em> do: it never looked
                        at what is sitting in <Code>b</Code> right now. It reasons
                        about the type, never about the current value.
                    </p>
                    <p>There are two fixes, and the difference between them matters:</p>
                    <CodeBlock code={WIDENING_FIXES} lang="ts" />
                    <p>
                        <Term>Narrowing the variable is usually the right one.</Term>{" "}
                        It is a real constraint that keeps paying off: every later
                        assignment to <Code>b</Code> is checked against{" "}
                        <Code>Theme</Code> too. <Code>as const</Code> freezes this
                        one literal and says nothing about the next.
                    </p>

                    <Callout
                        severity="note"
                        label="note · as const on a plain variable is pointless"
                    >
                        <p>
                            <Code>const c = &quot;dark&quot;</Code> and{" "}
                            <Code>let c = &quot;dark&quot; as const</Code> both give
                            the type <Code>&quot;dark&quot;</Code>, and a mutable
                            variable that can only ever hold one value is not useful.
                            The real difference shows up on copy:
                        </p>
                        <CodeBlock code={AS_CONST_COPY} lang="ts" />
                        <p>
                            A <Code>const</Code>&apos;s literal type is a{" "}
                            <em>widening</em> literal — it relaxes the moment it is
                            copied somewhere mutable. <Code>as const</Code> produces
                            a non-widening one that stays put. Where it really earns
                            its keep is objects and arrays, where nothing is literal
                            by default:
                        </p>
                        <CodeBlock code={AS_CONST_OBJECT} lang="ts" />
                        <p>
                            That is the form you will actually reach for, and it is
                            the basis of deriving types from data in Keys &amp;
                            Lookups.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · const is not deep">
                        <p>
                            <Code>const</Code> protects the binding, not the
                            contents:
                        </p>
                        <CodeBlock code={CONST_NOT_DEEP} lang="ts" />
                        <p>
                            <Code>user.name</Code> is still <Code>string</Code> and
                            still writable. This is plain JavaScript behaviour that
                            the type system faithfully reports, not a TypeScript
                            rule.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="any sneaking in">
                    <p>
                        <Code>any</Code> means stop checking. It gets its full
                        treatment in part 4, and it belongs here too, because the
                        way you usually get it is{" "}
                        <Term>without asking for it.</Term>
                    </p>
                    <CodeBlock code={TYPO} lang="ts" />
                    <p>
                        The typo compiles. Without <Code>noImplicitAny</Code>,{" "}
                        <Code>user</Code> is <Code>any</Code>, so{" "}
                        <Code>user.nmae</Code> is <Code>any</Code>, so calling{" "}
                        <Code>.toUpperCase()</Code> on it is <Code>any</Code> as
                        well. One missing annotation switched off checking for the
                        entire body.
                    </p>
                    <p>
                        <Term>There are four doors it comes through</Term>, and they
                        are worth recognising on sight:
                    </p>
                    <CodeBlock code={ANY_DOORS} lang="ts" />
                    <p>
                        <Code>JSON.parse</Code> is the one that matters most. It
                        returns <Code>any</Code>{" "}
                        always, by signature, and every API
                        response in an application enters through a door like it —
                        which is the subject of Data Boundaries &amp; Async.
                    </p>
                    <p>
                        <Term>
                            <Code>strict</Code> changes when the bug breaks, not
                            whether it breaks.
                        </Term>{" "}
                        With <Code>strict: true</Code> the compile fails, no{" "}
                        <Code>.js</Code> is produced, and the typo is fixed on your
                        machine. With <Code>strict: false</Code>{" "}
                        it compiles, ships,
                        and throws on a user&apos;s screen. Same bug both times.
                        TypeScript&apos;s entire job is to move the failure earlier
                        — it cannot protect the running program, because by then the
                        types are gone.
                    </p>
                    <p>
                        One detail that confuses people:{" "}
                        <Code>noImplicitAny</Code> flags the <em>parameter</em>, not
                        the typo. The typo only becomes visible once a type exists
                        for the compiler to compare against:
                    </p>
                    <CodeBlock code={TYPO_TYPED} lang="ts" />
                    <p>
                        So <Code>noImplicitAny</Code> does not find bugs itself. It
                        closes the hole that lets bugs through unchecked, and the
                        ordinary type checking does the rest.
                    </p>

                    <Callout severity="danger" label="danger · any is contagious">
                        <p>
                            Any expression that touches an <Code>any</Code> becomes{" "}
                            <Code>any</Code>. One untyped value at the top of a file
                            can disable checking through every function it flows
                            into, across files, and nothing warns you — the code
                            looks exactly like checked code.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the types you write every day ---------- */}
            <PartHeading kicker="part 2">Primitives &amp; Arrays</PartHeading>
            <div>
                <DocSection title="the primitives">
                    <p>
                        JavaScript has seven primitive types. You will write three of
                        them constantly and the rest almost never.
                    </p>
                    <CodeBlock code={PRIMITIVES} lang="ts" />
                    <p>
                        Lowercase, always. The capitalised spellings exist and mean
                        something else entirely — see the trap below.
                    </p>
                    <p>
                        <Term>
                            <Code>number</Code> is one type.
                        </Term>{" "}
                        JavaScript has no int/float split, so there is nothing in
                        TypeScript to reflect: integers, decimals,{" "}
                        <Code>NaN</Code> and <Code>Infinity</Code> are all the same
                        type.
                    </p>
                    <CodeBlock code={ONE_NUMBER} lang="ts" />
                    <p>
                        <Term>
                            <Code>null</Code> and <Code>undefined</Code> are their
                            own types
                        </Term>
                        , and under <Code>strict</Code> they are kept out of every
                        other type:
                    </p>
                    <CodeBlock code={NULLS} lang="ts" />
                    <p>
                        That is <Code>strictNullChecks</Code>, the single most
                        valuable flag in the compiler. With it on, a{" "}
                        <Code>string</Code> is always a real string and never
                        secretly null; when a value might genuinely be absent you
                        say so, and the compiler then forces you to handle both
                        cases before using it. Handling both cases is{" "}
                        <Term>narrowing</Term>, which Unions &amp; Narrowing covers
                        in full.
                    </p>
                    <p>
                        The last two are worth knowing exist and nothing more:
                    </p>
                    <CodeBlock code={EXOTIC} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · String, Number, Boolean are not the types you mean"
                    >
                        <p>
                            The capitalised versions are JavaScript&apos;s wrapper
                            object types, not the primitives:
                        </p>
                        <CodeBlock code={WRAPPERS} lang="ts" />
                        <p>
                            The declaration compiles, so the mistake survives until
                            the value is used somewhere a real{" "}
                            <Code>string</Code> is expected. Lowercase, every time.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="arrays">
                    <p>
                        <Term>
                            An array type is the element type followed by{" "}
                            <Code>[]</Code>.
                        </Term>{" "}
                        Read <Code>string[]</Code>{" "}
                        as &ldquo;array of
                        string&rdquo;. Arrays are homogeneous by default — one
                        element type for the whole array.
                    </p>
                    <CodeBlock code={ARRAY} lang="ts" />
                    <p>
                        As with everything else, you usually let inference do it,
                        and the element type is enforced from then on:
                    </p>
                    <CodeBlock code={ARRAY_INFER} lang="ts" />
                    <p>
                        <Term>When the elements are mixed, the parentheses matter.</Term>{" "}
                        <Code>[]</Code> binds tighter than <Code>|</Code>, so these
                        two annotations are unrelated types:
                    </p>
                    <CodeBlock code={ARRAY_PARENS} lang="ts" />
                    <p>
                        The first is an array whose elements are each a string or a
                        number. The second is a value that is either a plain string
                        or an array of numbers. Wrap it when in doubt.
                    </p>
                    <p>
                        There is a second spelling, and it means exactly the same
                        thing:
                    </p>
                    <CodeBlock code={ARRAY_GENERIC} lang="ts" />
                    <p>
                        Pick one and stay with it — <Code>string[]</Code> reads
                        better for simple cases, <Code>Array&lt;...&gt;</Code> for a
                        long element type. Those angle brackets are generic syntax,
                        which the Generics chapter takes apart properly.
                    </p>

                    <Callout severity="trap" label="trap · the empty array infers any[]">
                        <p>
                            Inference works by reading the value, and{" "}
                            <Code>[]</Code> has nothing to read — so the compiler
                            falls back to <Code>any[]</Code>. Under{" "}
                            <Code>strict</Code>{" "}
                            it then tries to rescue you by
                            tracking what gets pushed, an &ldquo;evolving
                            any&rdquo;, and the complaint lands downstream at the
                            use rather than at the push:
                        </p>
                        <CodeBlock code={EMPTY_ARRAY} lang="ts" />
                        <p>
                            That rescue stops working the moment the array is used
                            anywhere the compiler cannot follow linearly — captured
                            in a closure, returned, passed along:
                        </p>
                        <CodeBlock code={EMPTY_ARRAY_ESCAPES} lang="ts" />
                        <p>
                            Without <Code>strict</Code> neither of those is reported
                            at all: the array is <Code>any[]</Code>, every push is
                            accepted, <Code>items[0]</Code> is <Code>any</Code>, and{" "}
                            <Code>.toUpperCase()</Code> on a number compiles and
                            crashes. The rule is the same either way —{" "}
                            <Term>
                                if an array starts empty, annotate it:{" "}
                                <Code>const items: string[] = []</Code>.
                            </Term>{" "}
                            If it starts with values, do not bother.
                        </p>
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · indexing is not bounds-checked"
                    >
                        <p>
                            Length is not part of an array&apos;s type.{" "}
                            <Code>string[]</Code>{" "}
                            means &ldquo;some number of
                            strings, possibly zero&rdquo;, so the compiler answers{" "}
                            <Code>string</Code> for every index you ask about:
                        </p>
                        <CodeBlock code={INDEXING} lang="ts" />
                        <p>
                            This is one of the few places the type system knowingly
                            lies, and it is a deliberate trade: honest typing would
                            make every <Code>arr[i]</Code> in every loop return{" "}
                            <Code>string | undefined</Code> and demand a check. You
                            can opt into exactly that:
                        </p>
                        <CodeBlock code={NO_UNCHECKED} lang="jsonc" />
                        <p>
                            On or off, the takeaway is worth carrying: array
                            indexing is the one everyday spot where
                            &ldquo;TypeScript said it was fine&rdquo; is not a
                            guarantee. tsconfig Structure goes through this flag and
                            the rest of the family.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — types made of exact values ---------- */}
            <PartHeading kicker="part 3">Literal Types</PartHeading>
            <div>
                <DocSection title="a type with one value">
                    <p>
                        <Term>
                            A literal type is a type whose only member is one exact
                            value.
                        </Term>{" "}
                        Not &ldquo;a string&rdquo; but &ldquo;this string&rdquo;:
                    </p>
                    <CodeBlock code={LITERAL} lang="ts" />
                    <p>
                        The <Code>&quot;dark&quot;</Code> after the colon is a{" "}
                        <em>type</em>, not a string value — the same characters
                        meaning something different because of where they sit.
                        Literal types exist for strings, numbers and booleans:
                    </p>
                    <CodeBlock code={LITERAL_KINDS} lang="ts" />
                    <p>
                        On its own a literal type is useless; a variable that can
                        hold one value is a constant written the long way. Literals
                        earn their place in combination.
                    </p>
                    <p>
                        <Term>The actual use is the literal union.</Term> Several
                        literals joined with <Code>|</Code> describe a closed set of
                        allowed values:
                    </p>
                    <CodeBlock code={LITERAL_UNION} lang="ts" />
                    <p>
                        This is the most-used pattern in everyday TypeScript, and
                        the comparison that explains why is the pair of signatures:
                    </p>
                    <CodeBlock code={UNION_SIGNATURES} lang="ts" />
                    <p>
                        The first accepts <Code>&quot;dakr&quot;</Code>, the empty
                        string and <Code>&quot;banana&quot;</Code>. The second
                        accepts three things. The typo is caught at the call site
                        rather than inside the function or in production, and the
                        editor autocompletes the three options — fewer bugs and less
                        to remember, from one line of type.
                    </p>
                    <p>
                        Literal unions are also the foundation of discriminated
                        unions, where one literal field tells you which shape the
                        rest of the object has. That is the subject of Unions &amp;
                        Narrowing.
                    </p>

                    <Callout severity="note" label="note · this is why as const matters">
                        <p>
                            <Code>const</Code> keeps a literal, <Code>let</Code>{" "}
                            widens to <Code>string</Code>, and <Code>string</Code>{" "}
                            will not fit a literal union. A value on its way into a{" "}
                            <Code>Theme</Code> slot has to stay literal the whole way
                            to get there — which is the practical reason the widening
                            rules in part 1 are worth knowing.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="literal unions vs enum">
                    <p>
                        Both of these solve the same problem — a fixed set of named
                        options — and both check equally well.{" "}
                        <Code>setTheme(&quot;blue&quot;)</Code> fails either way:
                    </p>
                    <CodeBlock code={UNION_VS_ENUM} lang="ts" />
                    <p>
                        <Term>What an enum actually is</Term> is a named list of
                        fixed options that exists as real code. It is roughly a
                        lookup object you declared with special syntax:
                    </p>
                    <CodeBlock code={ENUM_AS_OBJECT} lang="ts" />
                    <p>
                        — except that the <Code>enum</Code> keyword also gives you a
                        type with the same name, so <Code>Theme</Code> is usable in
                        both worlds at once. Part 5 comes back to what that means.
                    </p>
                    <p>
                        <Term>
                            The real difference is that one of them exists at
                            runtime.
                        </Term>{" "}
                        A literal union compiles to nothing at all. An enum emits a
                        real JavaScript object into your bundle:
                    </p>
                    <CodeBlock code={ENUM_EMITTED} lang="js" />
                    <p>
                        That makes <Code>enum</Code> the one TypeScript feature that
                        is not erased — a language feature bolted on top of
                        JavaScript rather than a description of it. The upside is
                        that you can iterate it at runtime. The cost is that you
                        ship code you did not write.
                    </p>
                    <p>
                        <Term>Three things the union does better.</Term> It accepts
                        plain strings, where an enum forces <Code>Theme.Dark</Code>{" "}
                        and an import at every call site. It matches your data:
                        values from an API, a database or <Code>localStorage</Code>{" "}
                        arrive as plain strings, so a union fits them directly while
                        an enum needs converting at every boundary.
                    </p>
                    <CodeBlock code={ENUM_BOUNDARY} lang="ts" />
                    <p>
                        And it composes — with <Code>|</Code>, with{" "}
                        <Code>===</Code>, with <Code>keyof</Code> and the rest of
                        the toolkit this project is about. Enums sit outside all of
                        that.
                    </p>
                    <p>
                        <Term>Use literal unions.</Term> They are the modern default,
                        they are what the React and Next ecosystems use, and they
                        cost nothing at runtime. Reach for an enum only when you
                        genuinely need the values as a runtime object to iterate —
                        and even then an ordinary object with <Code>as const</Code>{" "}
                        does the same job. You will still <em>read</em> enums
                        constantly, because NestJS and older codebases are full of
                        them, so recognising one matters; writing a new one rarely
                        does.
                    </p>

                    <Callout severity="trap" label="trap · numeric enums are worse">
                        <p>
                            An enum with no values assigned numbers its members by
                            position, which means the stored value changes if anyone
                            reorders the list. Assigning an arbitrary number to one
                            is at least caught now:
                        </p>
                        <CodeBlock code={NUMERIC_ENUM} lang="ts" />
                        <p>
                            That check arrived in TypeScript 5.0 and only covers an
                            enum whose members are all literal. Add one computed
                            member and any number fits again:
                        </p>
                        <CodeBlock code={NUMERIC_ENUM_HOLE} lang="ts" />
                        <p>
                            If you must use an enum, always give its members explicit
                            string values.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the three types about not knowing ---------- */}
            <PartHeading kicker="part 4">any, unknown, never</PartHeading>
            <div>
                <DocSection title="any turns the checker off">
                    <p>
                        <Code>any</Code> is not a looser type. It is the absence of
                        a type: every operation on it is permitted, because there is
                        nothing to check the operation against.
                    </p>
                    <CodeBlock code={ANY} lang="ts" />
                    <p>
                        Four lines, all accepted by the compiler, one of them
                        correct. Note the last one especially — it does not even
                        crash, it just produces a wrong answer quietly, which is the
                        failure mode you find out about from a user.
                    </p>
                    <p>
                        <Term>It spreads.</Term> The result of any operation on an{" "}
                        <Code>any</Code> is itself <Code>any</Code>, all the way
                        down:
                    </p>
                    <CodeBlock code={ANY_SPREADS} lang="ts" />
                    <p>
                        Pass <Code>data</Code> into a function and the{" "}
                        <Code>any</Code>{" "}
                        rides along into that function&apos;s body.
                        One untyped value at an entry point can switch off checking
                        across an entire feature without a single warning.
                    </p>
                    <p>
                        <Term>There are times it is genuinely fine.</Term> Migrating
                        a JavaScript file, where <Code>any</Code> first and tighter
                        types later beats not migrating. A third-party library whose
                        types would cost more to write than the integration is worth.
                        A dynamic value you are about to validate anyway. Outside
                        those, reaching for <Code>any</Code>{" "}
                        almost always means
                        &ldquo;I do not know how to type this yet&rdquo; — and there
                        is a type that says that honestly:
                    </p>
                    <CodeBlock code={ANY_VS_UNKNOWN} lang="ts" />

                    <Callout severity="trap" label="trap · any is invisible">
                        <p>
                            Nothing highlights an <Code>any</Code>, nothing warns on
                            it, and the code reads exactly like code that is being
                            checked. You find out it was there when something
                            crashes. <Code>noImplicitAny</Code>{" "}
                            catches the
                            accidental ones; the ones you wrote deliberately are
                            nobody&apos;s problem but yours.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="unknown, the safe any">
                    <p>
                        <Code>any</Code> and <Code>unknown</Code>{" "}
                        both mean &ldquo;I
                        do not know what this is&rdquo;. They behave in opposite
                        ways:
                    </p>
                    <CodeBlock code={UNKNOWN} lang="ts" />
                    <p>
                        <Term>
                            <Code>any</Code> says assume it is whatever you need.{" "}
                            <Code>unknown</Code> says prove it first.
                        </Term>{" "}
                        You can hold an <Code>unknown</Code>, pass it around and
                        store it. What you cannot do is use it until you have
                        established what it is.
                    </p>
                    <p>
                        Proving it is an ordinary runtime check, and the compiler
                        follows along:
                    </p>
                    <CodeBlock code={UNKNOWN_PROVE} lang="ts" />
                    <p>
                        Inside the <Code>if</Code>, <Code>u</Code> is a{" "}
                        <Code>string</Code> and every string method is available;
                        outside it, <Code>u</Code> is still <Code>unknown</Code>.
                        That is <Term>narrowing</Term>{" "}
                        — the mechanism Unions &amp;
                        Narrowing is built on, and the reason <Code>unknown</Code>{" "}
                        is usable at all rather than merely strict.
                    </p>
                    <p>
                        <Term>Assignment goes one way.</Term> This asymmetry is the
                        whole safety property:
                    </p>
                    <CodeBlock code={UNKNOWN_ONE_WAY} lang="ts" />
                    <p>
                        Everything is assignable <em>to</em> <Code>unknown</Code>;
                        nothing is assignable <em>from</em> it without a check.{" "}
                        <Code>any</Code> is assignable in both directions, which is
                        precisely how it leaks into code that was otherwise typed.
                    </p>
                    <p>
                        You will meet it in three places: the result of{" "}
                        <Code>JSON.parse</Code> once you stop accepting{" "}
                        <Code>any</Code>, a function that genuinely accepts
                        anything, and <Code>catch</Code>:
                    </p>
                    <CodeBlock code={UNKNOWN_CATCH} lang="ts" />
                    <p>
                        <Code>catch (e)</Code> is <Code>unknown</Code> under{" "}
                        <Code>strict</Code> because JavaScript lets you throw
                        anything at all — a string, a number, an object. That is why{" "}
                        <Code>instanceof Error</Code> is how you reach{" "}
                        <Code>.message</Code>, and why reaching for it directly does
                        not compile.
                    </p>

                    <Callout
                        severity="note"
                        label="note · checking a property on an unknown"
                    >
                        <p>
                            Two separate things have to be proved: that the value is
                            an object, and that the property is on it.
                        </p>
                        <CodeBlock code={UNKNOWN_IN} lang="ts" />
                        <p>
                            <Code>typeof null</Code> is{" "}
                            <Code>&quot;object&quot;</Code> — a 1995 bug that can
                            never be fixed — so the null check is not optional. The{" "}
                            <Code>in</Code> operator then proves the property exists
                            and narrows the value. What you get back is{" "}
                            <Code>value.name</Code> typed <Code>unknown</Code>: the
                            compiler knows it is <em>there</em>, not what is in it,
                            so a third check is needed before using it as a string.
                        </p>
                        <p>
                            That is verbose, and it is the honest cost of{" "}
                            <Code>unknown</Code>. The normal fix is to write it once
                            as a type guard:
                        </p>
                        <CodeBlock code={TYPE_GUARD} lang="ts" />
                        <p>
                            The <Code>value is {"{ name: string }"}</Code>{" "}
                            return
                            type is the interesting part: it tells the compiler that
                            if this function returns true, the argument may be
                            treated as that type from then on. Unions &amp; Narrowing
                            covers the form properly. At scale nobody hand-writes
                            these for API responses — a validation library generates
                            them from a schema, which is where Data Boundaries &amp;
                            Async picks the thread up.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the rule of thumb">
                        <p>
                            Anything entering your program from outside it is{" "}
                            <Code>unknown</Code>, not <Code>any</Code>: API
                            responses, parsed JSON, form input, environment
                            variables. <Code>unknown</Code> forces a check at the
                            door, which is the one place a check is worth most.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="never">
                    <p>
                        <Term>
                            <Code>never</Code> is the type with no values at all.
                        </Term>{" "}
                        Not empty in the way <Code>null</Code> or{" "}
                        <Code>undefined</Code> are empty — those are values, and they
                        have types. Nothing whatsoever is assignable to{" "}
                        <Code>never</Code>:
                    </p>
                    <CodeBlock code={NEVER} lang="ts" />
                    <p>
                        You rarely write it. Mostly you read it back from the
                        compiler, where it means &ldquo;by my reasoning, nothing can
                        reach here&rdquo;.
                    </p>
                    <p>
                        It shows up as the return type of a function that never
                        returns at all:
                    </p>
                    <CodeBlock code={NEVER_RETURNS} lang="ts" />
                    <p>
                        That is a different claim from <Code>void</Code>.{" "}
                        <Code>void</Code> means the function returns, with nothing
                        useful; <Code>never</Code> means control does not come back —
                        it throws, or it loops forever. It also shows up in a branch
                        where the union has been exhausted, and there{" "}
                        <Code>never</Code> usually means the branch is dead code.
                    </p>
                    <p>
                        <Term>
                            Which leads to the one place you will actually use it:
                            exhaustiveness.
                        </Term>{" "}
                        Handle every member of a union, then assign what is left to{" "}
                        <Code>never</Code>:
                    </p>
                    <CodeBlock code={EXHAUSTIVE} lang="ts" />
                    <p>
                        It compiles, because after both checks <Code>theme</Code>{" "}
                        genuinely has no possible values left. Now add{" "}
                        <Code>&quot;auto&quot;</Code> to <Code>Theme</Code> and the
                        same line stops compiling:
                    </p>
                    <CodeBlock code={EXHAUSTIVE_BREAKS} lang="ts" />
                    <p>
                        The compiler points straight at the function you forgot to
                        update, and names the case you forgot. Adding a member to a
                        union makes every place that handles it fail to compile until
                        it is handled — which turns a union into something you can
                        safely extend a year later. The same trick with a{" "}
                        <Code>switch</Code>{" "}
                        over a discriminated union is in Unions
                        &amp; Narrowing.
                    </p>

                    <Callout
                        severity="note"
                        label="note · why literal unions beat loose strings"
                    >
                        <p>
                            With <Code>theme: string</Code> nothing can ever be
                            exhaustive — there is always another string, so the
                            leftover type is never <Code>never</Code>. The closed set
                            is what makes the check possible at all.
                        </p>
                    </Callout>

                    <p>
                        <Term>The three in one line.</Term> <Code>any</Code> — stop
                        checking. <Code>unknown</Code> — check before using.{" "}
                        <Code>never</Code> — nothing can be here.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 5 — the split that explains the error messages ---------- */}
            <PartHeading kicker="part 5">Types &amp; Values</PartHeading>
            <div>
                <DocSection title="two separate worlds">
                    <p>
                        A TypeScript file contains two languages at once, and almost
                        every confusing error message comes from crossing between
                        them by accident.
                    </p>
                    <CodeBlock code={TWO_WORLDS} lang="ts" />
                    <p>
                        <Term>The dividing line is syntactic, not conceptual.</Term>{" "}
                        Everything after a <Code>:</Code> in a declaration, and
                        everything inside a <Code>type</Code> or{" "}
                        <Code>interface</Code> body, is the type world. Everything
                        else is the value world. One ordinary line contains both:
                    </p>
                    <CodeBlock code={THE_LINE} lang="ts" />
                    <p>
                        <Term>The two worlds have separate namespaces.</Term> A type
                        and a value can share a name in the same file with no
                        conflict at all:
                    </p>
                    <CodeBlock code={NAMESPACES} lang="ts" />
                    <p>
                        It looks like a mistake and it is not — the compiler knows
                        which one you mean from the position, and this is a common
                        pattern for a class-like value with a matching type.
                    </p>
                    <p>
                        <Term>Crossing the line is an error in both directions</Term>
                        , and the messages name the problem exactly:
                    </p>
                    <CodeBlock code={CROSSING_VALUE} lang="ts" />
                    <p>
                        The other direction, using a type where a value is required:
                    </p>
                    <CodeBlock code={CROSSING_TYPE} lang="ts" />
                    <p>
                        Both read as instructions once you know the split exists, and
                        the first one even contains the fix.
                    </p>
                    <p>
                        <Term>
                            <Code>typeof</Code> is the bridge.
                        </Term>{" "}
                        In a type position it reaches into the value world and brings
                        a type back:
                    </p>
                    <CodeBlock code={TYPEOF_BRIDGE} lang="ts" />
                    <p>
                        This is not JavaScript&apos;s runtime <Code>typeof</Code>,
                        the one that returns <Code>&quot;string&quot;</Code>{" "}
                        — same
                        keyword, two worlds, two meanings, decided by where it sits.
                        It is how you write an object once, derive its type, and make
                        it impossible for the two to drift apart. Keys &amp; Lookups
                        builds on it.
                    </p>

                    <Callout
                        severity="note"
                        label="note · the colon is the type, the equals is the default"
                    >
                        <p>
                            Two different symbols doing two different jobs, which can
                            appear on the same parameter:
                        </p>
                        <CodeBlock code={COLON_AND_EQUALS} lang="ts" />
                        <p>
                            <Code>:</Code> is the type world — what shape the
                            argument must have. <Code>=</Code> is the value world —
                            what to use when nothing is passed. Default parameters are
                            plain JavaScript and not a type feature at all. Which is
                            why <Code>function greet(u: user) {"{}"}</Code> fails because
                            a <em>value</em> was put after the colon, and has nothing
                            to do with <Code>undefined</Code>.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · what exists in both worlds">
                        <p>
                            <Code>class</Code> and <Code>enum</Code> are the
                            exceptions that live in both: a class is a value you can{" "}
                            <Code>new</Code> and a type you can annotate with, and an
                            enum is both for the same reason — it emits an object.{" "}
                            <Code>type</Code> and <Code>interface</Code> are
                            type-only; <Code>const</Code>, <Code>let</Code> and{" "}
                            <Code>function</Code> are value-only.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
