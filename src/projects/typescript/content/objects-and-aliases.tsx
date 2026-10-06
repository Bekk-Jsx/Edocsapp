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
    // --- part 1 (Object Types) ---
    // inline `note · inference works here too`
    "describing-an-object": ["note"],
    // inline `trap · email?: string is not…` + `trap · readonly is compile-time only…`
    "optional-and-readonly": ["trap"],
    // inline `note · the practical way to write a union`
    "nesting-and-reuse": ["note"],

    // --- part 2 (type vs interface) ---
    // "two-ways-to-write-the-same-thing" carries no callout, so it has no entry.
    // inline `note · error messages differ slightly` + `note · you will read both…`
    "the-real-differences": ["note"],

    // --- part 3 (Index Signatures) ---
    // inline `note · required stays required, extras are allowed, reads are wider`
    "when-you-don-t-know-the-keys": ["note"],
    // inline `trap · every lookup is a guess`
    "the-index-signature-trap": ["trap"],

    // --- part 4 (Tuples) ---
    // inline `note · you already use tuples every day`
    "fixed-length-fixed-positions": ["note"],
    // "when-a-tuple-is-the-wrong-choice" carries no callout, so it has no entry.
};

// Top-level divider between the four parts of the page — mirrors the groups in
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
// and friends) — a real <table> would be the only one in the codebase. The markup,
// the cell padding and the three text colours are unchanged; this page needs it
// only for the & vs | summary pair in part 1.
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

// PAGE RULES — the ones first-types.tsx sets for the whole project, plus one:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it and read by the sentence below it. Two fragments never touch.
// 2. Compiler errors sit on the line BELOW the offending code, in tsc's exact
//    wording — every one on this page was produced by this repo's tsc (5.9)
//    under `strict`. Inferred types are a trailing comment on the same line.
// 3. Traps are inline Callouts; there is no traps section.
// 4. Every fragment declares a language: ts, or jsonc for tsconfig.
// 5. A COMPARISON SHOWS BOTH CODES, side by side: a two-column grid (stacking
//    on a narrow body column, via a container query on the column itself, not
//    the viewport — the rail and sidebar eat most of a laptop screen). Each
//    column opens with a one-line label, so even stacked, two fragments never
//    touch.

// ===================================================================
// part 1 — object types
// ===================================================================

const OBJECT_INLINE = `const user: { name: string; age: number } = { name: "sam", age: 30 };`;

const ALIAS = `type User = { name: string; age: number };

const user: User = { name: "sam", age: 30 };`;

const ALIAS_ANY = `type ID = string | number;       // a union
type Names = string[];           // an array
type Theme = "dark" | "light";   // a literal union
type User = { name: string };    // an object`;

const MISSING = `const user: User = { name: "sam" };
// Property 'age' is missing in type '{ name: string; }' but required in type 'User'.`;

const EXCESS = `const user: User = { name: "sam", age: 30, email: "x@y.com" };
// Object literal may only specify known properties, and 'email' does not exist in type 'User'.`;

const INFER_OBJECT = `const user = { name: "sam", age: 30 };   // { name: string; age: number }`;

const OPTIONAL = `type User = { name: string; email?: string };

const a: User = { name: "sam" };                     // ok
const b: User = { name: "sam", email: "s@x.com" };   // ok`;

const OPTIONAL_READ = `user.email;   // string | undefined

user.email.toUpperCase();
// 'user.email' is possibly 'undefined'.`;

const OPTIONAL_GUARD = `if (user.email) {
    user.email.toUpperCase();   // string in here
}`;

const OPTIONAL_KEY = `type A = { name: string; email?: string };

const a: A = { name: "sam" };   // ok — the key may be left out`;

const UNDEFINED_KEY = `type B = { name: string; email: string | undefined };

const b: B = { name: "sam" };
// Property 'email' is missing in type '{ name: string; }' but required in type 'B'.
const c: B = { name: "sam", email: undefined };   // ok`;

const READONLY = `type User = { readonly id: string; name: string };

user.name = "alex";   // ok
user.id = "u2";
// Cannot assign to 'id' because it is a read-only property.`;

const READONLY_SHALLOW = `type Config = { readonly tags: string[] };

config.tags = [];
// Cannot assign to 'tags' because it is a read-only property.
config.tags.push("x");   // fine — the array itself is not readonly`;

const API_SHAPE = `type User = {
    readonly id: string;   // set once by the server
    name: string;          // always there, editable
    email?: string;        // may be missing
};`;

const NESTED_INLINE = `type User = {
    name: string;
    address: {
        street: string;
        city: string;
    };
};`;

const NESTED_NAMED = `type Address = { street: string; city: string };

type User = {
    name: string;
    address: Address;
};

function formatAddress(address: Address) {}`;

const INTERSECTION = `type Timestamps = { createdAt: string; updatedAt: string };

type User = { name: string } & Timestamps;
// the shape of { name: string; createdAt: string; updatedAt: string }`;

const INTERSECTION_SHARED = `type Post = { title: string } & Timestamps;
type Comment = { body: string } & Timestamps;`;

const A_AND_B = `type A = { name: string; age: number };
type B = { name: string; color: string };`;

const AND_ACCEPT = `type Both = A & B;   // { name: string; age: number; color: string }

const x: Both = { name: "sam", age: 30, color: "red" };   // ok
const y: Both = { name: "sam", age: 30 };
// Type '{ name: string; age: number; }' is not assignable to type 'Both'.
//   Property 'color' is missing in type '{ name: string; age: number; }' but required in type 'B'.`;

const OR_ACCEPT = `type Either = A | B;

const p: Either = { name: "sam", age: 30 };        // ok — it's an A
const q: Either = { name: "rex", color: "red" };   // ok — it's a B`;

const AND_READ = `value.name;    // string
value.age;     // number
value.color;   // string`;

const OR_READ = `value.name;    // string — on A AND on B
value.age;
// Property 'age' does not exist on type 'Either'.
//   Property 'age' does not exist on type 'B'.
value.color;
// Property 'color' does not exist on type 'Either'.
//   Property 'color' does not exist on type 'A'.`;

const NARROW_IN = `if ("age" in value) {
    value.age;     // value is A in here
} else {
    value.color;   // value is B in here
}`;

const DISCRIMINATED = `type A = { kind: "user"; name: string; age: number };
type B = { kind: "pet";  name: string; color: string };

if (value.kind === "user") {
    value.age;     // A
} else {
    value.color;   // B
}`;

const ARRAY_OF_OBJECTS = `const users: User[] = [
    { name: "sam", age: 30 },
    { name: "alex", age: 25 },
];`;

// ===================================================================
// part 2 — type vs interface
// ===================================================================

const TYPE_FORM = `type User = {
    name: string;
    age: number;
};`;

const INTERFACE_FORM = `interface User {
    name: string;
    age: number;
}`;

const EXTENDS_INTERFACE = `interface User extends Timestamps {
    name: string;
}`;

const EXTENDS_TYPE = `type User = { name: string } & Timestamps;`;

const MIXING = `interface Admin extends TypeUser { level: number }   // interface extends a type
type Owner = InterfaceUser & { since: string };      // type intersects an interface`;

const TYPE_ANYTHING = `type Theme = "dark" | "light";   // a union
type ID = string | number;       // primitives
type Names = string[];           // an array
type Config = typeof config;     // derived from a value`;

const INTERFACE_OBJECTS = `interface Theme = "dark" | "light";
// '{' expected.

interface Theme { mode: "dark" | "light" }   // braces — its only form`;

const MERGE_INTERFACE = `interface User { name: string }
interface User { age: number }

// merged — User has name AND age
const user: User = { name: "sam", age: 30 };`;

const MERGE_TYPE = `type User = { name: string };
// Duplicate identifier 'User'.
type User = { age: number };
// Duplicate identifier 'User'.`;

const AUGMENT_EXPRESS = `// types/express.d.ts
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; role: "admin" | "member" };
        }
    }
}

export {};`;

// ===================================================================
// part 3 — index signatures
// ===================================================================

const SCORES_DATA = `const scores = {
    sam: 10,
    alex: 7,
    // ...one key per player who has ever played
};`;

const INDEX_SIGNATURE = `type Scores = { [key: string]: number };

const scores: Scores = {};
scores.anyone = 5;       // ok
scores["whoever"] = 7;   // ok`;

const MIXED_BAD = `type Config = {
    name: string;
    version: number;
    // Property 'version' of type 'number' is not assignable to 'string' index type 'string'.
    [key: string]: string;
};`;

const INDEX_READ = `const key = getKeyFromSomewhere();   // string
const value = config[key];           // string — says the compiler`;

const FIX_WIDEN = `type Config = {
    name: string;
    version: number;
    [key: string]: string | number;
};`;

const FIX_LIST = `type Config = {
    name: string;
    version: number;
};`;

const OPEN_CONFIG = `type Config = { name: string; version: number; [key: string]: string | number };

const a: Config = { name: "app" };
// Property 'version' is missing in type '{ name: string; }' but required in type 'Config'.
const b: Config = { name: "app", version: 1, port: 3000, env: "dev" };   // ok
const c: Config = { name: "app", version: 1, debug: true };
// Type 'boolean' is not assignable to type 'string | number'.`;

const OPTIONAL_LISTED = `type Config = {
    name: string;
    version?: number;
    // Property 'version' of type 'number | undefined' is not assignable to 'string' index type 'string | number'.
    [key: string]: string | number;
};`;

const OPEN_READS = `config.name;      // string
config.version;   // number
config.port;      // string | number`;

const RECORD = `type Scores = Record<string, number>;   // same as { [key: string]: number }`;

const INDEX_LIE = `const scores: Record<string, number> = { sam: 10 };

const n = scores.nobody;   // number
n.toFixed();               // compiles — crashes at runtime`;

const NO_UNCHECKED = `{
    "compilerOptions": {
        // every index-signature read becomes T | undefined
        "noUncheckedIndexedAccess": true
    }
}`;

const INDEX_HONEST = `const n = scores.nobody;   // number | undefined
n.toFixed();
// 'n' is possibly 'undefined'.`;

const OPEN_RECORD = `type Colors = Record<string, string>;

colors.dark;     // string
colors.nobody;   // string — a guess`;

const CLOSED_RECORD = `type Theme = "dark" | "light";
type Colors = Record<Theme, string>;   // { dark: string; light: string }

colors.dark;     // string — guaranteed
colors.nobody;
// Property 'nobody' does not exist on type 'Colors'.`;

// ===================================================================
// part 4 — tuples
// ===================================================================

const TUPLE = `let pair: [string, number] = ["sam", 30];`;

const TUPLE_ERRORS = `pair = [30, "sam"];
// Type 'number' is not assignable to type 'string'.
// Type 'string' is not assignable to type 'number'.
pair = ["sam"];
// Type '[string]' is not assignable to type '[string, number]'.
//   Source has 1 element(s) but target requires 2.
pair = ["sam", 30, true];
// Type '[string, number, boolean]' is not assignable to type '[string, number]'.
//   Source has 3 element(s) but target allows only 2.`;

const TUPLE_READ = `pair[0];   // string
pair[1];   // number
pair[2];
// Tuple type '[string, number]' of length '2' has no element at index '2'.`;

const TUPLE_INFER = `const a = ["sam", 30];                     // (string | number)[]
const b: [string, number] = ["sam", 30];   // [string, number]
const c = ["sam", 30] as const;            // readonly ["sam", 30]`;

const TUPLE_LABELS = `type Point = [x: number, y: number];   // still [number, number]`;

const USE_STATE = `const [count, setCount] = useState(0);
// useState returns [number, Dispatch<SetStateAction<number>>]`;

const TUPLE_RETURN = `function useFeed(): [Post[], boolean, boolean, () => void] {
    // ...
}

const [posts, loading, hasMore, retry] = useFeed();`;

const OBJECT_RETURN = `function useFeed(): {
    posts: Post[];
    loading: boolean;
    hasMore: boolean;
    retry: () => void;
} {
    // ...
}

const { posts, loading, hasMore, retry } = useFeed();`;

const REST = `type Args = [string, ...number[]];

const a: Args = ["sum", 1, 2, 3];   // ok
const b: Args = ["sum"];            // ok — zero numbers is still "any number"`;

const READONLY_TUPLE = `const point = [1, 2] as const;   // readonly [1, 2]
point[0] = 5;
// Cannot assign to '0' because it is a read-only property.`;

// Column grid for a side-by-side comparison (rule 5). Plain utility strings
// rather than a component: the container query keys off the body column, so the
// pair only splits once each half can hold a code line.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function ObjectsAndAliasesDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on First Types. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    First Types covered single values. Real programs pass around{" "}
                    <Term>shapes</Term> — a user, a config, a row from a table — and
                    this page is about describing them: listing their properties,
                    naming them so they can be reused, and the two places where a
                    shape&apos;s keys are not known in advance.
                </p>
                <p>
                    Same conventions as before: <Code>strict: true</Code>{" "}
                    throughout, errors on the line below the code that caused them,
                    inferred types as a comment at the end of the line, and every
                    message quoted exactly as this repo&apos;s compiler prints it.
                </p>
            </div>

            {/* ---------- part 1 — shapes, and naming them ---------- */}
            <PartHeading kicker="part 1">Object Types</PartHeading>
            <div>
                <DocSection title="describing an object">
                    <p>
                        <Term>
                            An object type lists the properties and what each one
                            holds.
                        </Term>{" "}
                        Written inline, it sits after the colon like any other type:
                    </p>
                    <CodeBlock code={OBJECT_INLINE} lang="ts" />
                    <p>
                        Inside the braces it is property name, colon, type — the same
                        colon rule as everywhere else. Properties may be separated by{" "}
                        <Code>;</Code> or <Code>,</Code>; semicolons are the
                        convention for types written inline.
                    </p>
                    <p>
                        Past two properties that annotation is unreadable, so you{" "}
                        <Term>give the shape a name with a type alias</Term>:
                    </p>
                    <CodeBlock code={ALIAS} lang="ts" />
                    <p>
                        <Code>type</Code> creates a name for a type. That is its
                        entire job. It is not a class, it produces nothing at
                        runtime, and it is deleted at compile time like everything
                        else in the type world. And it is not limited to objects —
                        anything that can sit after a colon can be named:
                    </p>
                    <CodeBlock code={ALIAS_ANY} lang="ts" />

                    <p>
                        <Term>The object must match.</Term> Leave out a property the
                        type requires and the assignment fails:
                    </p>
                    <CodeBlock code={MISSING} lang="ts" />
                    <p>That one nobody argues with. The other direction is subtler:</p>
                    <CodeBlock code={EXCESS} lang="ts" />
                    <p>
                        This surprises people, because the object <em>has</em>{" "}
                        everything <Code>User</Code> needs — it just has more. What
                        fired is the <Term>excess property check</Term>, and it only
                        applies to an object literal assigned directly to a typed
                        slot, where an extra key is almost always a typo. Pass the
                        same object through a variable first and it is accepted.
                        Why the rule is that narrow is the subject of Assignability.
                    </p>

                    <Callout severity="note" label="note · inference works here too">
                        <p>An object literal is inferred like any other value:</p>
                        <CodeBlock code={INFER_OBJECT} lang="ts" />
                        <p>
                            No annotation, and the shape is inferred in full. Write
                            the alias when the shape is <Term>reused</Term> — a
                            parameter, a return type, several variables holding the
                            same kind of thing — not for one local object.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="optional and readonly">
                    <p>
                        Two modifiers go on individual properties. One controls
                        whether the property has to be there; the other controls
                        whether it can change.
                    </p>
                    <p>
                        <Term>
                            <Code>?</Code> means the property may be absent.
                        </Term>{" "}
                        The question mark goes on the name, before the colon:
                    </p>
                    <CodeBlock code={OPTIONAL} lang="ts" />
                    <p>
                        What you get back when you read it is a union with{" "}
                        <Code>undefined</Code>, and the compiler will not let you
                        forget that:
                    </p>
                    <CodeBlock code={OPTIONAL_READ} lang="ts" />
                    <p>Guard it, and inside the branch it narrows to a plain string:</p>
                    <CodeBlock code={OPTIONAL_GUARD} lang="ts" />
                    <p>
                        This is <Code>strictNullChecks</Code> again, and it is the
                        whole point of optional properties: the absence is visible
                        in the type, so it cannot be forgotten at the place the value
                        is used.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · email?: string is not email: string | undefined"
                    >
                        <p>
                            They read the same and they are not. The first lets you{" "}
                            <em>omit</em> the key; the second requires the key and
                            requires you to write <Code>undefined</Code> in it
                            explicitly:
                        </p>
                        <div className={PAIR_FRAME}>
                            <div className={PAIR_GRID}>
                                <div className={PAIR_COL}>
                                    <p>
                                        <Term>optional — the key may be missing</Term>
                                    </p>
                                    <CodeBlock code={OPTIONAL_KEY} lang="ts" />
                                </div>
                                <div className={PAIR_COL}>
                                    <p>
                                        <Term>required — the value may be empty</Term>
                                    </p>
                                    <CodeBlock code={UNDEFINED_KEY} lang="ts" />
                                </div>
                            </div>
                        </div>
                        <p>
                            Use <Code>?</Code> when the property may be absent. Use{" "}
                            <Code>| undefined</Code> when it must be present but may
                            be empty — a form field that exists but has not been
                            filled in.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            <Code>readonly</Code> means the property cannot be
                            reassigned.
                        </Term>
                    </p>
                    <CodeBlock code={READONLY} lang="ts" />
                    <p>
                        It is for anything that identifies a record — ids, created
                        timestamps, keys — where a reassignment is always a bug
                        rather than an update.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · readonly is compile-time only, and shallow"
                    >
                        <p>
                            It disappears from the emitted JavaScript like every
                            other type, so nothing stops a reassignment at runtime:
                            it is a rule for your code, not a lock on the object. And
                            it protects that one property, not what the property
                            points at:
                        </p>
                        <CodeBlock code={READONLY_SHALLOW} lang="ts" />
                        <p>
                            To freeze the array itself, its type has to say so:{" "}
                            <Code>readonly string[]</Code>. That is what{" "}
                            <Code>as const</Code> applies automatically, at every
                            level.
                        </p>
                    </Callout>

                    <p>
                        The two combine freely, and together they describe most API
                        records you will ever type:
                    </p>
                    <CodeBlock code={API_SHAPE} lang="ts" />
                </DocSection>

                <DocSection title="nesting and reuse">
                    <p>
                        A property&apos;s type can be another object type, written
                        inline:
                    </p>
                    <CodeBlock code={NESTED_INLINE} lang="ts" />
                    <p>
                        Fine for a shape used once. It stops being fine quickly: you
                        cannot refer to that address type anywhere else, so you
                        cannot annotate a function that takes just an address, and
                        three levels of inline braces are unreadable.{" "}
                        <Term>Name the inner shape</Term>:
                    </p>
                    <CodeBlock code={NESTED_NAMED} lang="ts" />
                    <p>
                        The rule is simple: extract an inner type the moment it is
                        needed in two places.
                    </p>

                    <p>
                        <Term>Composing with &amp;.</Term> An intersection joins two
                        object types into one:
                    </p>
                    <CodeBlock code={INTERSECTION} lang="ts" />
                    <p>
                        Read <Code>&amp;</Code> as AND — the value must satisfy both
                        sides. Its everyday use is sharing common fields without
                        repeating them:
                    </p>
                    <CodeBlock code={INTERSECTION_SHARED} lang="ts" />

                    <p>
                        <Term>&amp; and | feel backwards.</Term> They are easiest to
                        understand together, on two types that share one property:
                    </p>
                    <CodeBlock code={A_AND_B} lang="ts" />
                    <p>
                        First, which values each one accepts. <Code>&amp;</Code>{" "}
                        must be both; <Code>|</Code> could be either:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>A &amp; B — must be both</Term>
                                </p>
                                <CodeBlock code={AND_ACCEPT} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>A | B — could be either</Term>
                                </p>
                                <CodeBlock code={OR_ACCEPT} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        The union accepts both objects — and TypeScript does{" "}
                        <em>not</em> remember which branch each one matched. Both{" "}
                        <Code>p</Code> and <Code>q</Code> are typed{" "}
                        <Code>Either</Code>, full stop. That is what makes reading
                        them so different:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>reading a Both</Term>
                                </p>
                                <CodeBlock code={AND_READ} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>reading an Either</Term>
                                </p>
                                <CodeBlock code={OR_READ} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Every property from both sides is usable on a{" "}
                        <Code>Both</Code>. On an <Code>Either</Code>,{" "}
                        <Code>name</Code> is fine — whichever one you got, it is
                        there. But <Code>age</Code> only exists on <Code>A</Code>,
                        and the compiler does not know it got an <Code>A</Code>. If
                        it got a <Code>B</Code>, <Code>value.age</Code> is{" "}
                        <Code>undefined</Code> and the next line crashes, so it
                        refuses.{" "}
                        <Term>
                            A union gives you only the keys that exist on every
                            member.
                        </Term>
                    </p>
                    <p>
                        To reach the others, narrow first — check for a key only one
                        side has:
                    </p>
                    <CodeBlock code={NARROW_IN} lang="ts" />
                    <p>
                        Inside the <Code>if</Code>, <Code>B</Code> is ruled out, so{" "}
                        <Code>value</Code> is an <Code>A</Code>; in the{" "}
                        <Code>else</Code>, <Code>A</Code> is ruled out, so it is a{" "}
                        <Code>B</Code>. Side by side, the two operators trade
                        against each other exactly:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <GridTable
                                cols="grid-cols-[max-content_1fr]"
                                head={["A & B", "must be both"]}
                                rows={[
                                    ["values accepted", "fewer"],
                                    ["properties usable", "more"],
                                    ["narrowing needed", "no"],
                                ]}
                            />
                            <GridTable
                                cols="grid-cols-[max-content_1fr]"
                                head={["A | B", "could be either"]}
                                rows={[
                                    ["values accepted", "more"],
                                    ["properties usable", "fewer — only the common ones"],
                                    ["narrowing needed", "yes"],
                                ]}
                            />
                        </div>
                    </div>
                    <p>
                        <Term>The inversion in one line:</Term> <Code>&amp;</Code>{" "}
                        accepts fewer values but gives you more to work with;{" "}
                        <Code>|</Code> accepts more values but gives you less.{" "}
                        <Code>&amp;</Code> is for composition, <Code>|</Code> for
                        alternatives.
                    </p>

                    <Callout
                        severity="note"
                        label="note · the practical way to write a union"
                    >
                        <p>
                            Checking <Code>&quot;age&quot; in value</Code> is
                            fragile — it breaks the day <Code>B</Code> grows an{" "}
                            <Code>age</Code> of its own. Real code adds a key whose
                            only job is to say which shape it is:
                        </p>
                        <CodeBlock code={DISCRIMINATED} lang="ts" />
                        <p>
                            <Code>kind</Code> is a literal type present on both sides,
                            so it can always be read, and comparing it tells the
                            compiler exactly which branch you are in. This is a{" "}
                            <Term>discriminated union</Term>, the most useful pattern
                            in the language — Unions &amp; Narrowing is built around
                            it.
                        </p>
                    </Callout>

                    <p>
                        <Term>Arrays of objects.</Term>{" "}Put the two together and you
                        have the single most common type in an application — every
                        list endpoint, every table&apos;s rows, every mapped list of
                        components:
                    </p>
                    <CodeBlock code={ARRAY_OF_OBJECTS} lang="ts" />
                </DocSection>
            </div>

            {/* ---------- part 2 — the two keywords ---------- */}
            <PartHeading kicker="part 2">type vs interface</PartHeading>
            <div>
                <DocSection title="two ways to write the same thing">
                    <p>
                        There is a second keyword for naming an object shape, and for
                        the shape above it produces an identical type:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>type alias</Term>
                                </p>
                                <CodeBlock code={TYPE_FORM} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>interface</Term>
                                </p>
                                <CodeBlock code={INTERFACE_FORM} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Two syntax differences: an <Code>interface</Code> has no{" "}
                        <Code>=</Code>, and no semicolon after the closing brace — it
                        is a declaration, like a <Code>function</Code>, rather than
                        an assignment.
                    </p>
                    <p>
                        At the point of use they behave identically: same checking,
                        same autocomplete, and with either one, the same error:
                    </p>
                    <CodeBlock code={MISSING} lang="ts" />
                    <p>
                        Both are deleted at compile time. Neither produces any
                        runtime code.
                    </p>

                    <p>
                        <Term>Extending.</Term> Building one shape on top of another
                        is spelled differently, and lands in the same place:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>interface — extends</Term>
                                </p>
                                <CodeBlock code={EXTENDS_INTERFACE} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>type — &amp;</Term>
                                </p>
                                <CodeBlock code={EXTENDS_TYPE} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Same result. And the two mix freely — an interface can extend
                        a type alias, and a type alias can intersect an interface:
                    </p>
                    <CodeBlock code={MIXING} lang="ts" />
                    <p>
                        So far this looks like a pure style choice. It mostly is —
                        but there are two real differences, and one of them matters.
                    </p>
                </DocSection>

                <DocSection title="the real differences">
                    <p>
                        <Term>
                            The bigger one: <Code>type</Code> describes anything;{" "}
                            <Code>interface</Code> only describes objects.
                        </Term>
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>type — any type at all</Term>
                                </p>
                                <CodeBlock code={TYPE_ANYTHING} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>interface — object shapes only</Term>
                                </p>
                                <CodeBlock code={INTERFACE_OBJECTS} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        The interface error is a <em>syntax</em> error: the grammar
                        has no form for it, so the parser stops at the{" "}
                        <Code>=</Code> looking for the brace an interface always
                        opens with. An interface has braces and properties, and that
                        is all it can ever be. Unions, primitives, tuples,
                        conditional types and mapped types are all{" "}
                        <Code>type</Code>-only — and most of the toolkit in the later
                        chapters produces exactly those. <Code>type</Code> is simply
                        the more capable keyword.
                    </p>

                    <p>
                        <Term>
                            The second: an interface can be reopened; a type cannot.
                        </Term>
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>interface — the declarations merge</Term>
                                </p>
                                <CodeBlock code={MERGE_INTERFACE} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>type — a name is declared once</Term>
                                </p>
                                <CodeBlock code={MERGE_TYPE} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        This is <Term>declaration merging</Term>. Inside your own
                        code it is a hazard: two unrelated files can each declare an{" "}
                        <Code>interface User</Code> and silently extend the same type,
                        with no warning from anyone.
                    </p>
                    <p>
                        It has exactly one good use — adding properties to a type you
                        do not own. Express attaches the authenticated user to the
                        request, but its <Code>Request</Code> type has never heard of
                        your <Code>user</Code>:
                    </p>
                    <CodeBlock code={AUGMENT_EXPRESS} lang="ts" />
                    <p>
                        Express exports <Code>Request</Code> as an interface, so it
                        can be reopened from your project and <Code>req.user</Code>{" "}
                        type-checks everywhere. Had it been a type alias, there
                        would be no way in. This is <Term>module augmentation</Term>,
                        and Modules &amp; Declarations covers it properly.
                    </p>

                    <p>
                        <Term>Which to use.</Term> Use <Code>type</Code> by default:
                        it covers every case, reads consistently with the rest of
                        the type syntax, and cannot be merged by accident. Use{" "}
                        <Code>interface</Code>{" "}when you are writing a type meant to
                        be extended by consumers — a library&apos;s public API — or
                        when you need merging for augmentation. Plenty of teams use{" "}
                        <Code>interface</Code> for every object shape and{" "}
                        <Code>type</Code> for everything else, and that is fine too.
                        The one thing that matters is picking a rule and keeping the
                        codebase consistent.
                    </p>

                    <Callout severity="note" label="note · error messages differ slightly">
                        <p>
                            An interface always keeps its name in errors. A type
                            alias is sometimes expanded into its full shape instead,
                            which is noisier on a large object. Minor — but noticeable
                            the first time a 20-field type is printed out in full.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · you will read both constantly">
                        <p>
                            React&apos;s own type definitions use{" "}
                            <Code>interface</Code> heavily; most modern application
                            code uses <Code>type</Code>. This is not a decision you
                            make once and stop seeing — recognise both on sight and
                            move on.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — keys that come from data ---------- */}
            <PartHeading kicker="part 3">Index Signatures</PartHeading>
            <div>
                <DocSection title="when you don't know the keys">
                    <p>
                        Every type so far has listed its properties by name.
                        Sometimes you cannot, because the keys come from data:
                    </p>
                    <CodeBlock code={SCORES_DATA} lang="ts" />
                    <p>
                        You cannot write the player names into a type. What you{" "}
                        <em>can</em> say is that any string key holds a number:
                    </p>
                    <CodeBlock code={INDEX_SIGNATURE} lang="ts" />
                    <p>
                        <Term>Read the bracket line as a sentence:</Term> for any key
                        of type <Code>string</Code>, the value is{" "}
                        <Code>number</Code>. The word <Code>key</Code> is just a
                        label — <Code>[k: string]</Code> or{" "}
                        <Code>[playerName: string]</Code> mean exactly the same.
                        Only <Code>string</Code> and <Code>number</Code> are allowed
                        as the key type.
                    </p>

                    <p>
                        <Term>Mixing with named properties.</Term> You can list known
                        keys alongside an index signature, but they must fit it:
                    </p>
                    <CodeBlock code={MIXED_BAD} lang="ts" />
                    <p>
                        <Code>[key: string]: string</Code> promises that{" "}
                        <em>every</em> string key holds a string.{" "}
                        <Code>&quot;version&quot;</Code> is a string key too, so the
                        type claims two contradictory things at once. It has to be
                        strict about this because reads go through the index
                        signature:
                    </p>
                    <CodeBlock code={INDEX_READ} lang="ts" />
                    <p>
                        The compiler cannot know what is in <Code>key</Code> — it
                        could be <Code>&quot;version&quot;</Code>. If{" "}
                        <Code>version: number</Code> were allowed,{" "}
                        <Code>config[key]</Code> would be typed <Code>string</Code>{" "}
                        while holding a number, and <Code>value.toUpperCase()</Code>{" "}
                        would compile and crash.{" "}
                        <Term>
                            Every named property must be assignable to the index
                            signature&apos;s value type
                        </Term>
                        , otherwise the index lookup would be lying.
                    </p>
                    <p>There are two fixes, and they trade differently:</p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>widen the index type</Term>
                                </p>
                                <CodeBlock code={FIX_WIDEN} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>drop the index signature</Term>
                                </p>
                                <CodeBlock code={FIX_LIST} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Widening is honest, but every read through the index now
                        needs narrowing before use. Dropping the signature and
                        listing the keys is usually right: an index signature is for
                        keys that genuinely come from data, and a two-field config is
                        not that.
                    </p>

                    <Callout
                        severity="note"
                        label="note · required stays required, extras are allowed, reads are wider"
                    >
                        <p>
                            Take the widened version. The index signature adds
                            permission for <em>extra</em> keys — it does not make the
                            listed ones optional, and the extras still have to fit:
                        </p>
                        <CodeBlock code={OPEN_CONFIG} lang="ts" />
                        <p>
                            An optional listed property works too, but{" "}
                            <Code>version?: number</Code> is{" "}
                            <Code>number | undefined</Code>, so by the same rule the
                            index type has to include <Code>undefined</Code> as well:
                        </p>
                        <CodeBlock code={OPTIONAL_LISTED} lang="ts" />
                        <p>
                            Reading depends on the key. Known keys keep their precise
                            type; anything else gets the index type:
                        </p>
                        <CodeBlock code={OPEN_READS} lang="ts" />
                        <p>
                            <Code>config.port</Code> needs narrowing before you can
                            use it as either. That is the cost of the open door.
                        </p>
                    </Callout>

                    <p>
                        <Term>Record does the same thing.</Term> The standard library
                        ships the plain case as a utility type:
                    </p>
                    <CodeBlock code={RECORD} lang="ts" />
                    <p>
                        Identical, and the form you will see far more often. The
                        bracket syntax still matters, because you need to read it in
                        library types, and because <Code>Record</Code> cannot express
                        the mixed case above. Utility Types covers{" "}
                        <Code>Record</Code> alongside the rest of the family.
                    </p>
                </DocSection>

                <DocSection title="the index signature trap">
                    <p>
                        An index signature says any string key works, and the
                        compiler takes that literally — including for keys that are
                        not there:
                    </p>
                    <CodeBlock code={INDEX_LIE} lang="ts" />
                    <p>
                        This is the same lie as array indexing on the First Types
                        page, for the same reason: the type describes a rule, not the
                        actual contents.
                    </p>

                    <Callout severity="trap" label="trap · every lookup is a guess">
                        <p>
                            An index signature promises a value for <em>every</em>{" "}
                            key, so the compiler never considers a miss. A plain
                            object type would have rejected{" "}
                            <Code>scores.nobody</Code> as an unknown property — the
                            index signature is exactly what switched that check off.
                            The open door swings both ways.
                        </p>
                    </Callout>

                    <p>
                        <Term>The honest version.</Term> The flag from First Types
                        covers this too:
                    </p>
                    <CodeBlock code={NO_UNCHECKED} lang="jsonc" />
                    <p>With it on, the same lookup has to be checked before use:</p>
                    <CodeBlock code={INDEX_HONEST} lang="ts" />
                    <p>
                        Without the flag, write that check yourself whenever the key
                        is not one you control.
                    </p>

                    <p>
                        <Term>Prefer a known key set when you have one.</Term>{" "}
                        <Code>Record</Code> takes any key type, not just{" "}
                        <Code>string</Code> — and that changes what it means:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>open — any string key</Term>
                                </p>
                                <CodeBlock code={OPEN_RECORD} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>closed — a literal union of keys</Term>
                                </p>
                                <CodeBlock code={CLOSED_RECORD} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Given a literal union, <Code>Record</Code> builds a closed
                        object: every key required, no unknown lookups, full
                        autocomplete.{" "}
                        <Term>
                            Use <Code>Record&lt;string, T&gt;</Code> only when the
                            keys genuinely come from data at runtime. If you can name
                            them, name them.
                        </Term>
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 4 — arrays with positions ---------- */}
            <PartHeading kicker="part 4">Tuples</PartHeading>
            <div>
                <DocSection title="fixed length, fixed positions">
                    <p>
                        An array type says &ldquo;any number of these&rdquo;. A{" "}
                        <Term>tuple</Term>{" "}says &ldquo;exactly these, in this
                        order&rdquo;:
                    </p>
                    <CodeBlock code={TUPLE} lang="ts" />
                    <p>
                        The same square brackets, but the contents are a list of
                        types rather than one type. The compiler enforces the type of
                        each position, their order, and the length:
                    </p>
                    <CodeBlock code={TUPLE_ERRORS} lang="ts" />
                    <p>Reads are typed per position, and the end is real:</p>
                    <CodeBlock code={TUPLE_READ} lang="ts" />
                    <p>
                        Unlike a regular array, a tuple <em>does</em> catch
                        out-of-range access, because its length is part of the type.
                    </p>

                    <p>
                        <Term>You must annotate it.</Term> Inference never produces a
                        tuple on its own:
                    </p>
                    <CodeBlock code={TUPLE_INFER} lang="ts" />
                    <p>
                        Left alone, the compiler assumes an array of mixed values —
                        the safer general guess, since most arrays grow. You get a
                        tuple by asking for one, or by freezing the literal with{" "}
                        <Code>as const</Code>.
                    </p>

                    <p>
                        <Term>Labels.</Term> Positions can be given names:
                    </p>
                    <CodeBlock code={TUPLE_LABELS} lang="ts" />
                    <p>
                        A label changes nothing about the type — it is purely for
                        readability, and shows up in editor tooltips and error
                        messages where a bare <Code>number</Code> would tell you
                        nothing.
                    </p>

                    <Callout
                        severity="note"
                        label="note · you already use tuples every day"
                    >
                        <p>Every React component that holds state destructures one:</p>
                        <CodeBlock code={USE_STATE} lang="ts" />
                        <p>
                            Position 0 is the value, position 1 the setter —
                            different types, fixed order. That is why destructuring
                            gives you two correctly typed variables, and why the
                            names are yours to choose. Hooks &amp; State goes through
                            where this inference stops being enough.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="when a tuple is the wrong choice">
                    <p>
                        A tuple&apos;s meaning lives in <Term>position</Term>; an
                        object&apos;s lives in <Term>names</Term>. Position is fine
                        for two values and bad for four:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>tuple — meaning by position</Term>
                                </p>
                                <CodeBlock code={TUPLE_RETURN} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>object — meaning by name</Term>
                                </p>
                                <CodeBlock code={OBJECT_RETURN} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        The object version wins on everything that matters later.
                        Swap <Code>loading</Code> and <Code>hasMore</Code> in the
                        tuple and nothing errors — they are both booleans, and the
                        only thing connecting a variable to its meaning is counting.
                        Add a field in the middle and every call site silently
                        shifts. With names, order is irrelevant, and a rename is a
                        compiler error rather than a wrong value.
                    </p>
                    <p>
                        <Term>The rule of thumb:</Term> two positions whose order is
                        obvious, use a tuple; anything else, use an object.{" "}
                        <Code>useState</Code> is the canonical good case, and{" "}
                        <Code>[lat, lng]</Code>, <Code>[min, max]</Code> and the{" "}
                        <Code>[key, value]</Code> pairs from{" "}
                        <Code>Object.entries</Code> are the same shape of thing.
                    </p>

                    <p>
                        <Term>Rest elements.</Term> A tuple can end in a run of any
                        length:
                    </p>
                    <CodeBlock code={REST} lang="ts" />
                    <p>
                        First element a string, then any number of numbers. This is
                        how a typed <Code>...rest</Code> parameter list is described
                        — mostly something you read in library signatures rather than
                        write.
                    </p>

                    <p>
                        <Term>Readonly tuples.</Term> <Code>as const</Code> on an
                        array literal produces one:
                    </p>
                    <CodeBlock code={READONLY_TUPLE} lang="ts" />
                    <p>
                        A readonly tuple with literal element types — the array
                        equivalent of what <Code>as const</Code>{" "}does to objects.
                        It is how you write a constant list once and derive a type
                        from it, which is where Keys &amp; Lookups picks up.
                    </p>
                </DocSection>
            </div>
        </>
    );
}
