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
    // --- part 1 (Structural Typing) ---
    // inline `danger · typed as X never means only X` + `note · the same object written inline fails`
    "shape-not-name": ["danger", "note"],
    // inline `tip · brand the ids that must not mix` + `note · a brand blocks entry, not use`
    "when-names-should-matter": ["tip", "note"],

    // --- part 2 (Assignable vs Identical) ---
    // inline `trap · console.log(typeof x) cannot show…` + `note · the annotation decides the type`
    "types-as-sets-of-values": ["trap", "note"],
    // inline `danger · writing through a wider array` + `trap · readonly properties do not survive assignment`
    "assignable-is-not-identical": ["danger", "trap"],

    // --- part 3 (The Excess Property Check) ---
    // inline `note · with unions, a discriminant makes the check exact`
    "fresh-literals-are-checked-for-extra-keys": ["note"],
    // inline `trap · one overlapping key lets a typo through` + `note · required keys plus open extras`
    "allowing-extra-keys": ["trap", "note"],
    // inline `trap · as unknown as T silences every check` + `tip · when as is the right tool`
    // + `note · ! is an assertion too` + `note · as const asserts nothing`
    "as-overrides-the-check": ["trap", "tip", "note"],

    // --- part 4 (Function Assignability) ---
    // inline `note · covariant and contravariant` + `note · this check is strictFunctionTypes`
    "parameters-wider-returns-narrower": ["note"],
    // inline `trap · method syntax is checked loosely` + `tip · write callbacks with property syntax`
    "the-method-loophole": ["trap", "tip"],

    // --- part 5 (Reading an Assignability Error) ---
    // inline `note · the last line is usually enough`
    "reading-a-nested-error": ["note"],
    // inline `tip · a checklist for any assignability error`
    "making-errors-land-in-the-right-place": ["tip"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in unions-and-narrowing.tsx.
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

// The grid table classes.tsx uses, copied unchanged — this page needs it once,
// for the honest replacements of each `as` misuse.
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

// PAGE RULES — those of unions-and-narrowing.tsx, with one exception in part 5:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it and read by the sentence below it. Two fragments never touch.
// 2. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed `// ❌ ` and written in PLAIN WORDS. Where a
//    contrast helps, a passing line ends in `// ✅`. The markers are plain text
//    in the fragment — no component, no class.
//    EXCEPTION — part 5 teaches reading the compiler itself, so its `text`
//    blocks are the REAL tsc output, verbatim. Never reword them.
// 3. Inferred types are a trailing comment on the same line.
// 4. Traps are inline Callouts; there is no traps section.
// 5. Every fragment declares its language: ts, jsonc for tsconfig, and text for
//    compiler output.
// 6. A comparison shows both codes side by side, in the same container-query
//    grid the earlier pages use, and each column opens with a one-line label so
//    two fragments never touch even when stacked.

// ===================================================================
// part 1 — structural typing
// ===================================================================

const SAME_SHAPE = `type User = { name: string };
type Pet = { name: string };

const pet: Pet = { name: "rex" };
const user: User = pet;   // ✅ same shape, so it fits — the names are irrelevant`;

const MORE_THAN_NEEDED = `type Named = { name: string };

const admin = { name: "sam", role: "admin" };
const n: Named = admin;   // ✅ admin has a name — the extra role is fine`;

const HIDDEN_KEY = `n.name;   // ✅
n.role;
// ❌ role is not in Named — the type does not let you see it`;

const STILL_THERE = `Object.keys(n);      // ["name", "role"] at runtime
JSON.stringify(n);   // '{"name":"sam","role":"admin"}'`;

const LEAK = `type PublicUser = { id: string; name: string };

function toResponse(user: PublicUser) {
    return JSON.stringify(user);
}

const dbUser = { id: "1", name: "sam", passwordHash: "…" };
toResponse(dbUser);   // ✅ compiles — and sends passwordHash to the client`;

const PICK_FIELDS = `function toResponse(user: PublicUser) {
    return JSON.stringify({ id: user.id, name: user.name });
}`;

const INLINE_FAILS = `const m: Named = { name: "redha", role: "admin" };
// ❌ role is not part of Named, and this object is written right here, so the extra key is
//    almost certainly a mistake`;

const SAME_CLASSES = `class Celsius { constructor(public value: number) {} }
class Fahrenheit { constructor(public value: number) {} }

const temp: Celsius = new Fahrenheit(100);   // ✅ same shape — and a real bug`;

const MIXED_IDS = `function getOrder(orderId: string) {}

const userId = "u_42";
getOrder(userId);   // ✅ compiles — a user id passed where an order id belongs`;

const BRANDS = `type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

function getOrder(id: OrderId) {}

const userId = "u_42" as UserId;
getOrder(userId);
// ❌ a UserId is not an OrderId — their brands differ
getOrder("o_7");
// ❌ a plain string has no brand, so it cannot be passed as an OrderId either`;

const BRAND_CONSTRUCTOR = `function toOrderId(raw: string): OrderId {
    if (!raw.startsWith("o_")) throw new Error("Not an order id");
    return raw as OrderId;
}`;

const PRIVATE_FIELDS = `class Meters { #value = 0; }
class Feet { #value = 0; }

const m: Meters = new Feet();
// ❌ the private field belongs to Feet, not Meters, so the shapes cannot match`;

const BRAND_ENTRY = `const a: UserId = "u_42";
// ❌ a plain string has no __brand property
const b: UserId = { __brand: "UserId" };
// ❌ an object with a brand is not a string`;

const BRAND_USE = `const id = "u_42" as UserId;
id.toUpperCase();          // ✅ every string method
const s: string = id;      // ✅ a UserId fits a string slot`;

// ===================================================================
// part 2 — assignable vs identical
// ===================================================================

const LITERAL_SETS = `const theme: "dark" = "dark";

const a: string = theme;     // ✅ every "dark" is a string
const b: "dark" = a;
// ❌ a string could be "purple" — not every string is "dark"`;

const OBJECT_SETS = `type Named = { name: string };
type Person = { name: string; age: number };

const p: Person = { name: "sam", age: 30 };
const n: Named = p;          // ✅ every Person is also a Named
const q: Person = n;
// ❌ a Named might have no age — not every Named is a Person`;

const ANNOTATION_WINS = `const a: string = theme;   // a: string — you asked for string`;

const KEEP_NARROW = `const b = theme;                 // b: "dark" — inferred from theme
const c: typeof theme = theme;   // c: "dark" — explicit`;

const LET_COPIES = `const theme1: "dark" = "dark";
let x = theme1;    // "dark"

const theme2 = "dark";
let y = theme2;    // string`;

const TWO_TYPEOFS = `const b = theme;

console.log(typeof b);   // "string" — JavaScript's runtime typeof
type B = typeof b;       // "dark"   — TypeScript's type-level typeof`;

const PROVE_TYPE = `const check: "dark" = b;   // ✅ b really is "dark"
const wrong: "light" = b;
// ❌ b is "dark", which is not "light"`;

const BOTH_WAYS = `type A = { name: string };
type B = { name: string; age?: number };

const a: A = { name: "sam" };
const b: B = a;    // ✅ age is optional, so a missing age is fine
const c: A = b;    // ✅ B has a name, the possible age is just extra`;

const READONLY_LOST = `type Frozen = { readonly id: string };
type Open = { id: string };

const frozen: Frozen = { id: "u_1" };
const open: Open = frozen;   // ✅ compiles — readonly is ignored here

open.id = "u_2";             // ✅ and now frozen.id is "u_2" too — same object`;

const READONLY_ARRAY = `const list: readonly string[] = ["a"];
const copy: string[] = list;
// ❌ a readonly array cannot go where a mutable one is expected — push would break the promise`;

const WIDER_ARRAY = `const nums: number[] = [1, 2];
const mixed: (number | string)[] = nums;   // ✅ every number[] fits (number | string)[]

mixed.push("oops");      // ✅ allowed — mixed accepts strings
nums[2].toFixed();       // compiles — and crashes: nums now holds a string`;

// ===================================================================
// part 3 — the excess property check
// ===================================================================

const THROUGH_VARIABLE = `const admin = { name: "sam", role: "admin" };
const n: Named = admin;   // ✅`;

const WRITTEN_INLINE = `const m: Named = { name: "redha", role: "admin" };
// ❌ role is not part of Named — written here, the extra key is almost certainly a mistake`;

const EVERY_SLOT = `type Options = { color?: string; size?: number };

const a: Options = { colour: "red" };
// ❌ colour is not a known option — did you mean color?

function draw(opts: Options) {}
draw({ colour: "red" });
// ❌ same check on a function argument

function defaults(): Options {
    return { colour: "red" };
    // ❌ and on a return value, when the function declares its return type
}`;

const NESTED_LITERAL = `type Config = { theme: { color?: string } };

const c: Config = { theme: { colour: "red" } };
// ❌ the inner object is a fresh literal too, so colour is checked there as well`;

const DISCRIMINATED_EXCESS = `type Shape =
    | { kind: "circle"; radius: number }
    | { kind: "square"; side: number };

const s: Shape = { kind: "circle", radius: 1, side: 2 };
// ❌ side does not belong to the circle member — kind: "circle" already chose it`;

const UNDISCRIMINATED_EXCESS = `type Contact = { email: string } | { phone: string };

const c: Contact = { email: "a@b.c", phone: "123" };   // ✅ each key exists on some member`;

const INDEX_EXTRAS = `type Options = {
    color?: string;
    size?: number;
    [key: string]: unknown;   // anything else is allowed too
};

const o: Options = { color: "red", trackingId: "x1" };   // ✅ extras are part of the type now`;

const VIA_VARIABLE = `const raw = { color: "red", trackingId: "x1" };
const o: Options = raw;   // ✅ no longer fresh, so no excess check`;

const WEAK_TYPE = `const raw = { colour: "red" };
draw(raw);
// ❌ raw has nothing in common with Options — not a single known key`;

const ONE_OVERLAP = `const raw = { colour: "red", size: 2 };
draw(raw);   // ✅ compiles — size overlaps, so colour is silently ignored`;

const REQUIRED_PLUS_EXTRAS = `type Options = {
    color: string;
    size: number;
    [key: string]: string;
    // ❌ size is a number, but the index signature says every key holds a string
};`;

const EXTRAS_FIXES = `type Options2 = { color: string; size: number; [key: string]: string | number };
type Options3 = { color: string; size: number; extra: Record<string, string> };`;

const AS_ANNOTATED = `type User = { name: string; age: number };

const a: User = {};
// ❌ {} is missing name and age`;

const AS_TRUSTED = `const b = {} as User;   // b: User — but it is empty

b.name.toUpperCase();   // compiles — crashes at runtime`;

const AS_OVERLAP = `const c = {} as User;                // ✅ User fits into {}
const d = { name: "sam" } as User;   // ✅ User fits into { name: string } — age still missing
const e = "hello" as number;
// ❌ a string and a number do not overlap at all
const f = { nmae: "sam" } as User;
// ❌ no overlap — the typo is caught`;

const DOUBLE_AS = `const g = "hello" as unknown as number;   // g: number — really a string

g.toFixed(2);   // compiles — crashes at runtime: toFixed is not a function`;

const AS_ON_UNKNOWN = `function shout(value: unknown) {
    return (value as string).toUpperCase();   // compiles — no typeof check
}

shout(42);   // crashes at runtime`;

const FREEZE_SHALLOW = `const c = Object.freeze({ mode: "dark", db: { host: "x" } });
c.mode = "light";
// ❌ mode is read-only
c.db.host = "y";   // ✅ compiles and works at runtime — the nested object is not frozen`;

// ===================================================================
// part 4 — function assignability
// ===================================================================

const RETURNS_NARROWER = `type GetLabel = () => string;

const getTheme = (): "dark" | "light" => "dark";
const getCount = (): number => 3;

const a: GetLabel = getTheme;   // ✅ "dark" | "light" is narrower than string
const b: GetLabel = getCount;
// ❌ the slot promises a string, but this returns a number`;

const PARAMS_WIDER = `type OnText = (value: string) => void;

const logAnything = (value: string | number) => console.log(value);
const onlyDark = (value: "dark") => console.log("dark mode");

const c: OnText = logAnything;   // ✅ handles every string, plus numbers
const d: OnText = onlyDark;
// ❌ callers may pass any string, but this only handles "dark"`;

const CALLER_VIEW = `function runWithInput(handler: OnText) {
    handler("light");             // the caller passes ANY string
}
function shout(get: GetLabel) {
    return get().toUpperCase();   // the caller USES the result as a string
}`;

const BOTH_RULES = `type Convert = (input: "dark") => string;

const impl = (input: string): "ok" => "ok";

const e: Convert = impl;
// ✅ parameter is wider ("dark" → string), return is narrower (string → "ok")`;

const FEWER_PARAMS = `type Handler = (value: string, index: number) => void;

const h1: Handler = (value) => {};   // ✅ ignores index — demands less
const h2: Handler = (value: string, index: number, extra: boolean) => {};
// ❌ nobody will pass a third argument, so extra would always be undefined`;

const ONE_TEST = `type User = { id: string; name: string };
type Admin = User & { level: number };

type LoadUser = (id: string) => User;

const load1 = (id: string | number): Admin => ({ id: String(id), name: "sam", level: 1 });
const load2 = (id: string, retries: number): User => ({ id, name: "sam" });

const x: LoadUser = load1;
// ✅ it handles every string id, and an Admin is a User
const y: LoadUser = load2;
// ❌ the caller passes only an id, so retries would never be given`;

const STRICT_FUNCTION_TYPES = `{
    "compilerOptions": {
        "strict": true   // includes strictFunctionTypes: true
    }
}`;

const TWO_FORMS = `type WithProperty = { handle: (value: string | number) => void };   // property syntax
type WithMethod = { handle(value: string | number): void };         // method syntax`;

const LOOPHOLE = `const onlyText = (value: string) => console.log(value.toUpperCase());

const p: WithProperty = { handle: onlyText };
// ❌ the slot may pass a number, but onlyText only handles strings

const m: WithMethod = { handle: onlyText };   // ✅ compiles — the loophole
m.handle(42);                                 // compiles, then crashes`;

const ARRAY_METHODS = `const names: string[] = ["sam"];
const values: (string | number)[] = names;   // ✅ only works because push is a method`;

const CLASS_METHODS = `class Logger {
    log(value: string | number) {}
}

class TextLogger extends Logger {
    log(value: string) { value.toUpperCase(); }   // ✅ compiles — narrower parameter
}

const logger: Logger = new TextLogger();
logger.log(42);   // compiles, then crashes`;

const PROPERTY_SYNTAX = `type Props = {
    onChange: (value: string) => void;   // ✅ property syntax — strictly checked
    onSave(value: string): void;         // method syntax — loosely checked
};`;

// ===================================================================
// part 5 — reading an assignability error
// (the text blocks below are real tsc output, verbatim — rule 2's exception)
// ===================================================================

const NESTED_SOURCE = `type Address = { city: string; zip: string };
type User = { name: string; address: Address };

const data = { name: "sam", address: { city: "Paris", zip: 75001 } };
const user: User = data;`;

const NESTED_OUTPUT = `error TS2322: Type '{ name: string; address: { city: string; zip: number; }; }' is not assignable to type 'User'.
  The types of 'address.zip' are incompatible between these types.
    Type 'number' is not assignable to type 'string'.`;

const FUNCTION_SOURCE = `type Handler = (value: string, index: number) => void;
const h: Handler = (value: number) => {};`;

const FUNCTION_OUTPUT = `error TS2322: Type '(value: number) => void' is not assignable to type 'Handler'.
  Types of parameters 'value' and 'value' are incompatible.
    Type 'string' is not assignable to type 'number'.`;

const FLAT_OUTPUT = `error TS2741: Property 'zip' is missing in type '{ city: string; }' but required in type 'Address'.`;

const ANNOTATED_SOURCE = `const data: User = { name: "sam", address: { city: "Paris", zip: 75001 } };`;

const ANNOTATED_OUTPUT = `error TS2322: Type 'number' is not assignable to type 'string'.`;

const UNION_SOURCE = `const s: RequestState = { status: "success", data: [1, 2] };`;

const UNION_OUTPUT = `error TS2322: Type 'number' is not assignable to type 'string'.
error TS2322: Type 'number' is not assignable to type 'string'.`;

const TRUNCATED_OUTPUT = `error TS2322: Type '{ a: string; b: string; … u: string; ... 5 more ...; zz: string; }' is not assignable to type 'Big'.
  Types of property 'zz' are incompatible.
    Type 'string' is not assignable to type 'number'.`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings the earlier pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function AssignabilityDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the earlier pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Every error you have seen so far on these pages is the same
                    question asked in a different place:{" "}
                    <Term>does this value fit this slot?</Term> That question is
                    assignability, and the compiler asks it at every variable,
                    argument, return and property. This page is about how it
                    answers.
                </p>
                <p>
                    The answer rests on one idea — types are matched by shape, not
                    by name — and on a few rules built on top of it: a stricter
                    check for object literals, opposite directions for parameters
                    and returns, and a fixed structure in every error message. Same
                    conventions as before: <Code>strict: true</Code>{" "}throughout,{" "}
                    <Code>{"// ❌"}</Code> marks errors on the line below the code
                    that caused them, <Code>{"// ✅"}</Code> marks lines that
                    compile where the contrast helps.
                </p>
            </div>

            {/* ---------- part 1 — matched by shape ---------- */}
            <PartHeading kicker="part 1">Structural Typing</PartHeading>
            <div>
                <DocSection title="shape, not name">
                    <p>
                        In many languages, Java and C# among them, two types are
                        compatible only if one is declared to be the other.{" "}
                        <Term>
                            TypeScript does not care about names. It asks one
                            question: does the value have the shape the slot needs?
                        </Term>
                    </p>
                    <CodeBlock code={SAME_SHAPE} lang="ts" />
                    <p>
                        <Code>User</Code> and <Code>Pet</Code> were never connected,
                        and they do not need to be. Both describe an object with a
                        string <Code>name</Code>, so a value of one fits wherever the
                        other is expected. This is <Term>structural typing</Term>. It
                        works with more than needed, too:
                    </p>
                    <CodeBlock code={MORE_THAN_NEEDED} lang="ts" />
                    <p>
                        <Term>A type is a minimum requirement, not an exact description.</Term>{" "}
                        <Code>Named</Code> only asks for <Code>name</Code>;{" "}
                        <Code>admin</Code> has it, plus more, and extra properties do
                        not break the shape. TypeScript works this way because it
                        describes JavaScript, where objects are bags of properties and
                        nobody declares &ldquo;this object is a User&rdquo; — duck
                        typing, checked by the compiler.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · typed as X never means only X"
                    >
                        <p>
                            <Code>n: Named</Code> does not mean <Code>n</Code> has only{" "}
                            <Code>name</Code>. It means <Code>n</Code> has{" "}
                            <em>at least</em> <Code>name</Code>. The type hides{" "}
                            <Code>role</Code>, so reading it through <Code>n</Code> is
                            refused:
                        </p>
                        <CodeBlock code={HIDDEN_KEY} lang="ts" />
                        <p>
                            But <Code>n</Code> and <Code>admin</Code> are the same
                            object, and <Code>role</Code> is still there at runtime.
                            Anything that walks the whole object sees it:
                        </p>
                        <CodeBlock code={STILL_THERE} lang="ts" />
                        <p>
                            That is why <Code>Object.keys</Code> returns{" "}
                            <Code>string[]</Code> and not the type&apos;s keys. The
                            real-world version is a leak:
                        </p>
                        <CodeBlock code={LEAK} lang="ts" />
                        <p>
                            A type annotation never removes properties. To really drop
                            keys, build a new object with only the fields you list:
                        </p>
                        <CodeBlock code={PICK_FIELDS} lang="ts" />
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · the same object written inline fails"
                    >
                        <p>Write the same object straight into the slot, and it is refused:</p>
                        <CodeBlock code={INLINE_FAILS} lang="ts" />
                        <p>
                            The shape still fits — a stricter check runs only on object
                            literals written directly into a typed slot. Part 3
                            explains it.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="when names should matter">
                    <p>
                        Structural typing applies to everything, classes included. Two
                        classes with the same shape are interchangeable even though
                        they are unrelated:
                    </p>
                    <CodeBlock code={SAME_CLASSES} lang="ts" />
                    <p>
                        Usually that flexibility is what you want. Sometimes two
                        things that <em>mean</em> different things slip into each
                        other&apos;s place — and the most common case is plain
                        strings:
                    </p>
                    <CodeBlock code={MIXED_IDS} lang="ts" />
                    <p>
                        <Term>The fix is a brand:</Term> a fake property that exists
                        only in the type, making two shapes different on purpose:
                    </p>
                    <CodeBlock code={BRANDS} lang="ts" />
                    <p>
                        <Code>__brand</Code> never exists at runtime — these are
                        ordinary strings. Branded values are created in one place,
                        usually a small function that validates and then uses{" "}
                        <Code>as</Code>:
                    </p>
                    <CodeBlock code={BRAND_CONSTRUCTOR} lang="ts" />
                    <p>
                        This is <Term>nominal typing by convention</Term>: TypeScript
                        stays structural, and you add the name yourself where the
                        meaning matters — ids, currencies, units, validated emails.
                    </p>
                    <p>
                        <Term>Classes have one built-in exception.</Term> A class with
                        a <Code>private</Code> or <Code>#private</Code> field is only
                        compatible with itself, because nothing outside the class can
                        have that exact member:
                    </p>
                    <CodeBlock code={PRIVATE_FIELDS} lang="ts" />
                    <p>Classes comes back to this.</p>

                    <Callout severity="note" label="note · a brand blocks entry, not use">
                        <p>
                            The <Code>&amp;</Code> means both conditions must hold: a
                            string AND a <Code>__brand</Code> property. No real value
                            can be both — a string primitive cannot carry a property:
                        </p>
                        <CodeBlock code={BRAND_ENTRY} lang="ts" />
                        <p>
                            So the only way in is <Code>as</Code> — a{" "}
                            <Code>UserId</Code> can never be created by accident. The
                            other direction is free, because a branded value is still
                            a string:
                        </p>
                        <CodeBlock code={BRAND_USE} lang="ts" />
                    </Callout>

                    <Callout severity="tip" label="tip · brand the ids that must not mix">
                        <p>
                            Brand ids, money amounts and units when two of them share a
                            primitive type and mixing them up would be a bug. Keep the{" "}
                            <Code>as</Code> inside one constructor function per brand,
                            so every branded value has passed its check.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — fitting, not matching ---------- */}
            <PartHeading kicker="part 2">Assignable vs Identical</PartHeading>
            <div>
                <DocSection title="types as sets of values">
                    <p>
                        <Term>Picture every type as a set of values.</Term>{" "}
                        <Code>string</Code> is every possible string;{" "}
                        <Code>{'"dark"'}</Code> is a set with one value;{" "}
                        <Code>{'"dark" | "light"'}</Code> has two.{" "}
                        <Term>
                            Assignment is allowed when the source&apos;s set fits
                            inside the target&apos;s set
                        </Term>{" "}
                        — every value the source could hold must be valid for the
                        target:
                    </p>
                    <CodeBlock code={LITERAL_SETS} lang="ts" />
                    <p>
                        <Code>{'"dark"'}</Code> is the <Term>narrower</Term> type
                        (fewer values), <Code>string</Code> the <Term>wider</Term>{" "}
                        one. Assignment flows from narrow to wide, never the other way
                        without a check. Objects follow the same rule, and it feels
                        backwards at first:
                    </p>
                    <CodeBlock code={OBJECT_SETS} lang="ts" />
                    <p>
                        <Term>More properties means a narrower type.</Term> More
                        requirements, fewer objects qualify, smaller set. So a{" "}
                        <Code>Person</Code> fits anywhere a <Code>Named</Code> is
                        wanted, not the reverse.
                    </p>
                    <p>
                        The two ends of the scale:{" "}
                        <Term>
                            <Code>unknown</Code> is the widest type
                        </Term>
                        , the set of everything — anything is assignable to it.{" "}
                        <Term>
                            <Code>never</Code> is the narrowest
                        </Term>
                        , the empty set — it is assignable to anything, because it has
                        no values that could fail to fit (which is why{" "}
                        <Code>assertNever</Code> can return <Code>never</Code> from a
                        function typed <Code>: string</Code>, on Unions &amp;
                        Narrowing). <Code>any</Code> simply leaves the system: it goes
                        in and out of everything, which is why it is dangerous.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · console.log(typeof x) cannot show a TypeScript type"
                    >
                        <p>
                            There are two <Code>typeof</Code>s, and only one of them
                            knows TypeScript types:
                        </p>
                        <CodeBlock code={TWO_TYPEOFS} lang="ts" />
                        <p>
                            The runtime one runs after every type is deleted and only
                            knows the JavaScript categories. To see a type, hover it in
                            the editor, or prove it with a check only that type can
                            pass:
                        </p>
                        <CodeBlock code={PROVE_TYPE} lang="ts" />
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · the annotation decides the type"
                    >
                        <p>
                            Assigning a narrow value to a wider annotation widens the
                            variable — the annotation always wins:
                        </p>
                        <CodeBlock code={ANNOTATION_WINS} lang="ts" />
                        <p>
                            To keep the narrow type, let inference copy it, or annotate
                            with <Code>typeof</Code>:
                        </p>
                        <CodeBlock code={KEEP_NARROW} lang="ts" />
                        <p>
                            With <Code>let</Code> it depends on how the source got its
                            literal. An annotated literal stays put; an inferred{" "}
                            <Code>const</Code> literal widens when copied into a{" "}
                            <Code>let</Code> (First Types):
                        </p>
                        <CodeBlock code={LET_COPIES} lang="ts" />
                    </Callout>
                </DocSection>

                <DocSection title="assignable is not identical">
                    <p>
                        &ldquo;Assignable&rdquo; only means one direction fits. Two
                        types can fit both ways and still not be the same, and a few
                        rules are looser than you would expect.
                    </p>
                    <p>
                        <Term>Optional properties make two types fit both ways:</Term>
                    </p>
                    <CodeBlock code={BOTH_WAYS} lang="ts" />
                    <p>
                        Each fits into the other, yet they are not the same type. The
                        compiler only ever asks &ldquo;does this fit here?&rdquo;,
                        never &ldquo;is this the same type?&rdquo;.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · readonly properties do not survive assignment"
                    >
                        <p>
                            A <Code>readonly</Code> property can be assigned to a
                            mutable one without complaint:
                        </p>
                        <CodeBlock code={READONLY_LOST} lang="ts" />
                        <p>
                            <Code>readonly</Code> only stops writes through that one
                            type. Readonly ARRAYS are stricter — that one is checked:
                        </p>
                        <CodeBlock code={READONLY_ARRAY} lang="ts" />
                    </Callout>

                    <Callout
                        severity="danger"
                        label="danger · writing through a wider array"
                    >
                        <p>
                            Arrays are assignable to wider arrays, and that is unsafe:
                        </p>
                        <CodeBlock code={WIDER_ARRAY} lang="ts" />
                        <p>
                            <Code>nums</Code> and <Code>mixed</Code> are the same
                            array. TypeScript allows this on purpose — forbidding it
                            would break countless everyday assignments — and part 4
                            shows the mechanism behind it. Never write through a
                            widened reference to an array or object you still use
                            under its narrow type.
                        </p>
                    </Callout>

                    <p>
                        Assignability is a practical check of &ldquo;does it fit right
                        now&rdquo;, not a guarantee that two types are equal or that
                        the value stays as typed forever.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 3 — the stricter check for literals ---------- */}
            <PartHeading kicker="part 3">The Excess Property Check</PartHeading>
            <div>
                <DocSection title="fresh literals are checked for extra keys">
                    <p>
                        <Term>
                            An object literal written directly into a typed slot may
                            not have keys the type does not know.
                        </Term>{" "}
                        The structural rule is the same everywhere; this is an extra
                        check that only runs on such fresh literals:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>through a variable — no extra check</Term>
                                </p>
                                <CodeBlock code={THROUGH_VARIABLE} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>written inline — extra keys rejected</Term>
                                </p>
                                <CodeBlock code={WRITTEN_INLINE} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        <Term>Why the two differ.</Term> Through the variable,{" "}
                        <Code>admin</Code> exists on its own and other code can still
                        use <Code>admin.role</Code> — the extra property has a
                        purpose. Written inline, the object exists only to go into{" "}
                        <Code>m</Code>, and through <Code>m</Code> <Code>role</Code>{" "}
                        can never be read again. It is dead on arrival, so the most
                        likely explanation is a typo or a wrong type. A literal is{" "}
                        <Term>fresh</Term> at the moment it is written; once stored in
                        a variable it stops being fresh and only the normal structural
                        rule applies.
                    </p>
                    <p>
                        It fires wherever a fresh literal meets a known type — not
                        just variable declarations:
                    </p>
                    <CodeBlock code={EVERY_SLOT} lang="ts" />
                    <p>It reaches nested literals too:</p>
                    <CodeBlock code={NESTED_LITERAL} lang="ts" />
                    <p>
                        <Term>Why the check exists: optional properties.</Term> Every
                        key of <Code>Options</Code> is optional, so{" "}
                        <Code>{'{ colour: "red" }'}</Code> fits structurally — it has
                        no <Code>color</Code>, but <Code>color</Code> is not required.
                        Without the excess check the typo would compile,{" "}
                        <Code>color</Code> would silently be <Code>undefined</Code>,
                        and the default would be used with no error anywhere. That is
                        the everyday case it protects: options objects, props and
                        config. In React it is what catches{" "}
                        <Code>{'<Button colr="red" />'}</Code> — props are an object
                        literal checked against the component&apos;s props type.
                    </p>

                    <Callout
                        severity="note"
                        label="note · with unions, a discriminant makes the check exact"
                    >
                        <p>
                            With a discriminated union, the compiler picks the member
                            from the discriminant first, then checks extra keys
                            against that member only:
                        </p>
                        <CodeBlock code={DISCRIMINATED_EXCESS} lang="ts" />
                        <p>
                            Without a discriminant it cannot tell which member you
                            mean, so it only rejects a key that belongs to no member at
                            all:
                        </p>
                        <CodeBlock code={UNDISCRIMINATED_EXCESS} lang="ts" />
                        <p>
                            One more reason to give unions a discriminant (Unions &amp;
                            Narrowing).
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="allowing extra keys">
                    <p>
                        Sometimes extra keys are intended — known fields plus
                        arbitrary metadata, or a value built once and passed to
                        several APIs. There are honest ways to allow that, and one
                        dishonest one.
                    </p>
                    <p>
                        <Term>Say so in the type, with an index signature:</Term>
                    </p>
                    <CodeBlock code={INDEX_EXTRAS} lang="ts" />
                    <p>
                        The cost, from Objects &amp; Aliases: misspelled known keys are
                        no longer caught — <Code>colour</Code> is now just another key.
                    </p>
                    <p>
                        <Term>Going through a variable is the dishonest way.</Term> It
                        only hides the check:
                    </p>
                    <CodeBlock code={VIA_VARIABLE} lang="ts" />
                    <p>
                        Use it when the object genuinely has another purpose, not to
                        silence a red line.
                    </p>
                    <p>
                        <Term>The weak type rule</Term> — a second check even variables
                        cannot avoid. A type whose properties are all optional is a
                        weak type, and assigning something that shares no property
                        with it fails, fresh or not:
                    </p>
                    <CodeBlock code={WEAK_TYPE} lang="ts" />
                    <p>
                        Without it, any object at all would fit a type where
                        everything is optional.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · one overlapping key lets a typo through"
                    >
                        <p>One correct key is enough to pass the weak type rule:</p>
                        <CodeBlock code={ONE_OVERLAP} lang="ts" />
                        <p>
                            Write options and props inline whenever you can, where the
                            full excess check protects every key. When you must build
                            them first, annotate the variable itself —{" "}
                            <Code>{"const raw: Options = { … }"}</Code> — which moves
                            the full check to where the object is written.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · required keys plus open extras"
                    >
                        <p>
                            Remove the <Code>?</Code> to make the known keys required.
                            If extras may hold anything, the index signature stays{" "}
                            <Code>unknown</Code>. If extras must be strings, the index
                            type must still cover every named property, or the
                            declaration fails:
                        </p>
                        <CodeBlock code={REQUIRED_PLUS_EXTRAS} lang="ts" />
                        <p>
                            Widen the index type, or fence the extras off in their own
                            property — usually the cleanest:
                        </p>
                        <CodeBlock code={EXTRAS_FIXES} lang="ts" />
                    </Callout>
                </DocSection>

                <DocSection title="as overrides the check">
                    <p>
                        An annotation asks the compiler to check a value.{" "}
                        <Code>as</Code> tells it to trust you:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>annotation — checked</Term>
                                </p>
                                <CodeBlock code={AS_ANNOTATED} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>as — trusted</Term>
                                </p>
                                <CodeBlock code={AS_TRUSTED} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Same value, same target type: the annotation checked it,{" "}
                        <Code>as</Code> did not. <Code>as</Code> exists for the moments
                        you know something the compiler cannot — and when you are
                        wrong, nothing tells you.
                    </p>
                    <p>
                        <Term>
                            The one rule <Code>as</Code> keeps: the types must overlap.
                        </Term>{" "}
                        An assertion is allowed when either type is assignable to the
                        other — so <Code>as</Code> can make a type narrower or wider,
                        never jump between unrelated types:
                    </p>
                    <CodeBlock code={AS_OVERLAP} lang="ts" />
                    <p>
                        <Term>
                            The double <Code>as</Code> removes even that rule.
                        </Term>{" "}
                        <Code>unknown</Code> overlaps with every type, so going through
                        it allows any conversion — the compiler&apos;s own error
                        message suggests it (&ldquo;convert the expression to
                        &apos;unknown&apos; first&rdquo;):
                    </p>
                    <CodeBlock code={DOUBLE_AS} lang="ts" />
                    <p>
                        <Term>
                            <Code>as</Code> on <Code>unknown</Code> skips the narrowing.
                        </Term>{" "}
                        This is why <Code>unknown</Code> is narrowed with a check (First
                        Types, Unions &amp; Narrowing) and never with <Code>as</Code> — a
                        check runs at runtime, <Code>as</Code> is erased:
                    </p>
                    <CodeBlock code={AS_ON_UNKNOWN} lang="ts" />
                    <p>
                        Each misuse has an honest replacement — check it, build it, or
                        convert it:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["instead of", "write"]}
                        rows={[
                            ["data as User", "data: unknown + a type guard"],
                            ["{} as User, then fill fields", "const user: User = { … } — one annotated literal"],
                            ["(s as Circle).radius", 'narrow on the discriminant: s.kind === "circle"'],
                            ["users.find(…)!.name", 'users.find(…)?.name ?? "not found"'],
                            ["id as unknown as number", "Number(id) — convert the value, do not relabel it"],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · as unknown as T silences every check"
                    >
                        <p>
                            It compiles any conversion, and the value is unchanged at
                            runtime. If you need it, the type design is usually wrong —
                            fix the types or convert the value.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · ! is an assertion too">
                        <p>
                            <Code>value!</Code> removes <Code>null</Code> and{" "}
                            <Code>undefined</Code> from the type without checking
                            anything — the same &ldquo;trust me&rdquo; as{" "}
                            <Code>as</Code>, with the same risk.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · when as is the right tool">
                        <p>
                            Only when you know something no check can give the
                            compiler, and being wrong is impossible: the DOM element
                            you wrote yourself —{" "}
                            <Code>{'document.getElementById("email") as HTMLInputElement'}</Code>
                            , or better{" "}
                            <Code>{'document.querySelector<HTMLInputElement>("#email")'}</Code>
                            ; <Code>e.target as HTMLInputElement</Code> in a handler;{" "}
                            <Code>Object.keys(PIXELS) as (keyof typeof PIXELS)[]</Code>{" "}
                            for your own constant; partial mocks in tests. Never on
                            data from outside.
                        </p>
                        <p>
                            Quick test before writing it: if I am wrong, does the
                            compiler or the runtime tell me? If neither does, write a
                            check instead.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · as const asserts nothing">
                        <p>
                            It only narrows — readonly at every level, literal values
                            kept (First Types) — so it is always safe. It is
                            compile-time only; for a runtime lock use{" "}
                            <Code>Object.freeze</Code>, which is shallow:
                        </p>
                        <CodeBlock code={FREEZE_SHALLOW} lang="ts" />
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — opposite directions ---------- */}
            <PartHeading kicker="part 4">Function Assignability</PartHeading>
            <div>
                <DocSection title="parameters wider, returns narrower">
                    <p>
                        Functions introduced the rule &ldquo;demand no more, deliver
                        no less&rdquo;. With the set view from part 2 you can see why
                        it runs in opposite directions for parameters and returns.
                    </p>
                    <p>
                        <Term>Returns follow the normal direction — narrower is fine.</Term>{" "}
                        The caller still gets what it expected:
                    </p>
                    <CodeBlock code={RETURNS_NARROWER} lang="ts" />
                    <p>
                        <Term>Parameters run the other way — wider is fine.</Term> A
                        function that accepts more can replace one that accepts less:
                    </p>
                    <CodeBlock code={PARAMS_WIDER} lang="ts" />
                    <p>
                        <Term>Why opposite directions:</Term> the caller supplies the
                        arguments and uses the result. Here is what would break if the
                        two failing lines were allowed:
                    </p>
                    <CodeBlock code={CALLER_VIEW} lang="ts" />
                    <p>
                        <Code>onlyDark</Code> would receive <Code>{'"light"'}</Code>, a
                        value it was never written for; <Code>getCount</Code> would
                        return 3, and <Code>3.toUpperCase()</Code> would crash. The
                        replacement must handle everything the caller might pass, and
                        return only what the caller expects.
                    </p>
                    <p>
                        Both rules apply at once — the safest replacement takes more
                        and returns less:
                    </p>
                    <CodeBlock code={BOTH_RULES} lang="ts" />
                    <p>
                        <Term>Fewer parameters is the same idea</Term> — ignoring an
                        argument demands less; wanting one nobody passes does not work:
                    </p>
                    <CodeBlock code={FEWER_PARAMS} lang="ts" />
                    <p>
                        <Term>One test covers all of it:</Term> could a caller, using
                        the slot&apos;s type honestly, ever pass something the function
                        cannot handle, or get back something it did not expect? If not,
                        it is assignable:
                    </p>
                    <CodeBlock code={ONE_TEST} lang="ts" />

                    <Callout severity="note" label="note · covariant and contravariant">
                        <p>
                            Returns are <em>covariant</em> — they move with the slot,
                            narrower is fine. Parameters are <em>contravariant</em> —
                            they move against it, wider is fine. You do not need the
                            words to write code, but you will meet them in error
                            explanations and articles.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · this check is strictFunctionTypes"
                    >
                        <p>
                            The strict parameter check comes from{" "}
                            <Code>strictFunctionTypes</Code>, part of{" "}
                            <Code>strict</Code>:
                        </p>
                        <CodeBlock code={STRICT_FUNCTION_TYPES} lang="jsonc" />
                        <p>
                            With it off, parameters are compared loosely in both
                            directions and <Code>const d: OnText = onlyDark</Code>{" "}
                            compiles — then breaks at runtime exactly as shown above.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the method loophole">
                    <p>
                        Functions recommended the property form for callbacks in
                        object types, saying it is checked more strictly. Here is
                        exactly what that means. The two forms look like the same
                        type:
                    </p>
                    <CodeBlock code={TWO_FORMS} lang="ts" />
                    <p>
                        Give each a function that only accepts strings — narrower than
                        the slot, so it should fail:
                    </p>
                    <CodeBlock code={LOOPHOLE} lang="ts" />
                    <p>
                        <Term>Method syntax switches off the strict parameter check.</Term>{" "}
                        <Code>strictFunctionTypes</Code> only applies to function types
                        written with <Code>{"=>"}</Code>. Parameters declared with
                        method syntax are checked <em>bivariantly</em> — they pass if
                        they fit in either direction.
                    </p>
                    <p>
                        <Term>Why the loophole exists: arrays.</Term> Every array
                        method is written with method syntax — for example{" "}
                        <Code>push(...items: T[])</Code> — and that is what allows the
                        array assignment from part 2:
                    </p>
                    <CodeBlock code={ARRAY_METHODS} lang="ts" />
                    <p>
                        With a strict <Code>push</Code>, <Code>string[]</Code> would no
                        longer fit <Code>(string | number)[]</Code>. So TypeScript
                        keeps methods loose on purpose — the same hole as part 2&apos;s
                        danger, seen from the inside.
                    </p>
                    <p>
                        <Term>Classes use method syntax too:</Term>
                    </p>
                    <CodeBlock code={CLASS_METHODS} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · method syntax is checked loosely"
                    >
                        <p>
                            A callback declared as a method accepts handlers that
                            cannot cope with every argument it will be given, and
                            nothing warns you. The crash appears at runtime, far from
                            the declaration.
                        </p>
                    </Callout>

                    <Callout
                        severity="tip"
                        label="tip · write callbacks with property syntax"
                    >
                        <p>Declare every callback as a property holding a function type:</p>
                        <CodeBlock code={PROPERTY_SYNTAX} lang="ts" />
                        <p>
                            Use the property form in every type you write. The{" "}
                            <Code>@typescript-eslint/method-signature-style</Code> lint
                            rule can enforce it across a project.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — the compiler's own words ---------- */}
            <PartHeading kicker="part 5">Reading an Assignability Error</PartHeading>
            <div>
                <DocSection title="reading a nested error">
                    <p>
                        This part teaches reading the compiler itself, so — unlike the
                        rest of the docs — its output blocks show the real compiler
                        text, exactly as the editor and terminal print it. Start with
                        an object that is wrong deep inside:
                    </p>
                    <CodeBlock code={NESTED_SOURCE} lang="ts" />
                    <p>The compiler prints:</p>
                    <CodeBlock code={NESTED_OUTPUT} lang="text" />
                    <p>
                        <Term>Each indented line zooms one level deeper into the first.</Term>{" "}
                        Line 1 is the whole thing: the source type (what you have) on
                        the left, the target (what is expected) on the right — long
                        types printed in full, which is why it is the scariest line.
                        Line 2 is where: the path, <Code>address.zip</Code>, a property
                        you can go straight to. Line 3 is the actual reason, in its
                        simplest form.
                    </p>
                    <p>
                        <Term>
                            The reading rule: last line first, then the path, and line
                            1 only if you still need context.
                        </Term>
                    </p>
                    <p>
                        The same structure appears for functions — the parameter trap
                        from part 4:
                    </p>
                    <CodeBlock code={FUNCTION_SOURCE} lang="ts" />
                    <p>prints:</p>
                    <CodeBlock code={FUNCTION_OUTPUT} lang="text" />
                    <p>
                        Line 2 names the parameter, line 3 the reason — and the last
                        line reads backwards compared to the assignment:{" "}
                        <Code>string</Code> to <Code>number</Code>, not{" "}
                        <Code>number</Code> to <Code>string</Code>. That is
                        contravariance from part 4: for parameters, the compiler checks
                        whether the slot&apos;s argument fits your parameter.
                    </p>
                    <p>
                        Not every error is nested. A missing property usually arrives
                        as one flat sentence that already names everything:
                    </p>
                    <CodeBlock code={FLAT_OUTPUT} lang="text" />
                    <p>What is missing, what you have, and where it is required.</p>

                    <Callout
                        severity="note"
                        label="note · the last line is usually enough"
                    >
                        <p>
                            For most errors the deepest line alone tells you what to
                            fix. Read upward only when the last line is ambiguous — the
                            same number-to-string mismatch could be at several paths.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="making errors land in the right place">
                    <p>
                        <Term>Where the error lands depends on where the type is known.</Term>{" "}
                        In the previous section the object was built untyped and
                        checked later, so the compiler compared two whole types.
                        Annotate the object where you build it and the same mistake
                        reads:
                    </p>
                    <CodeBlock code={ANNOTATED_SOURCE} lang="ts" />
                    <p>prints:</p>
                    <CodeBlock code={ANNOTATED_OUTPUT} lang="text" />
                    <p>
                        One line, and the underline sits on <Code>75001</Code> itself —
                        the compiler checks each property as it reads the literal.
                    </p>
                    <p>
                        <Term>An error always appears where a value meets a type it fails.</Term>{" "}
                        If the type arrives late, the error arrives late, at the far
                        end of the problem. Typing values where they are created moves
                        errors to the place you need to fix — the &ldquo;annotate
                        exported return types&rdquo; advice from Functions, from the
                        other side.
                    </p>
                    <p>
                        <Term>Discriminated unions keep errors precise.</Term> The
                        compiler picks the member first, so each bad element is
                        underlined on its own. Here <Code>RequestState</Code> is the
                        loading / success / error union from Unions &amp; Narrowing,
                        with the success member carrying{" "}
                        <Code>data: string[]</Code>:
                    </p>
                    <CodeBlock code={UNION_SOURCE} lang="ts" />
                    <p>prints, one error per bad element:</p>
                    <CodeBlock code={UNION_OUTPUT} lang="text" />
                    <p>
                        <Term>Long types get cut short.</Term>{" "}
                        <Code>... N more ...</Code> means properties were left out of
                        the printout, not of the check:
                    </p>
                    <CodeBlock code={TRUNCATED_OUTPUT} lang="text" />
                    <p>
                        The deeper lines still name the exact property. To print the
                        full type, set <Code>{'"noErrorTruncation": true'}</Code> in
                        tsconfig.
                    </p>

                    <Callout
                        severity="tip"
                        label="tip · a checklist for any assignability error"
                    >
                        <p>1. Read the last line: what does not fit what.</p>
                        <p>2. Read the path in the middle lines: where it is.</p>
                        <p>
                            3. Decide which side is wrong — the value (fix the data) or
                            the type (fix the declaration). The compiler cannot know
                            which you intended.
                        </p>
                        <p>
                            4. If the error sits far from the cause, annotate the value
                            where it is created and let the error move to the real
                            spot.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
