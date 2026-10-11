import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header —
// that is the explicit `sectionSeverity` prop, which only "a guard is a promise"
// carries; every other callout below is inline only.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Union Types) ---
    // "what-a-union-is" has no callout, so it has no entry.
    // inline `note · undefined or null — the api decides`
    "where-unions-come-from": ["note"],
    // inline `trap · a wider member swallows the literals` + `note · why string & {} works`
    "combining-unions": ["trap", "note"],

    // --- part 2 (Narrowing) ---
    // inline `trap · typeof null is "object"`
    "narrowing-with-typeof": ["trap"],
    // inline `trap · truthiness also removes 0 and ""` + `tip · ?? is the safe fallback`
    "removing-null-and-undefined": ["trap", "tip"],
    // inline `trap · Array.isArray on unknown gives any[]` + `note · instanceof needs a class`
    "narrowing-objects": ["trap", "note"],
    // inline `tip · copy it into a const` + `note · a named condition still narrows`
    "when-narrowing-is-lost": ["tip", "note"],

    // --- part 3 (Discriminated Unions) ---
    // inline `tip · make illegal states unrepresentable`
    "one-label-per-shape": ["tip"],
    // inline `note · destructuring keeps the link`
    "narrowing-on-the-discriminant": ["note"],
    // inline `trap · built on its own line, the literal widens` + `note · why literal unions, not enums`
    "designing-the-discriminant": ["trap", "note"],

    // --- part 4 (Type Guard Functions) ---
    // inline `note · simple guards are inferred since typescript 5.5`
    "value-is-t": ["note"],
    // whole section flagged danger (sectionSeverity) + inline `note · asserts value is T`
    "a-guard-is-a-promise": ["danger", "note"],

    // --- part 5 (Exhaustiveness) ---
    // inline `trap · a switch does not have to cover every case` + `note · a return type is a partial check`
    "the-forgotten-case": ["trap", "note"],
    // inline `tip · a Record is exhaustive by itself`
    assertnever: ["tip"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in functions.tsx.
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

// The grid table functions.tsx uses, copied unchanged — this page needs it once,
// for what each null check takes out of a union.
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

// PAGE RULES — those of functions.tsx, with one change to the error style:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it and read by the sentence below it. Two fragments never touch.
// 2. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed `// ❌ ` — but written in PLAIN WORDS, saying what
//    is wrong, not in tsc's wording. Where a contrast helps, a passing line ends
//    in `// ✅`. The markers are plain text in the fragment — no component, no
//    class.
// 3. Inferred types are a trailing comment on the same line.
// 4. Traps are inline Callouts; there is no traps section.
// 5. Every fragment declares its language: ts, and tsx for the one React
//    fragment.
// 6. A comparison shows both codes side by side, in the same container-query
//    grid functions.tsx uses, and each column opens with a one-line label so two
//    fragments never touch even when stacked.

// ===================================================================
// part 1 — union types
// ===================================================================

const UNION_BASIC = `let id: string | number;

id = "u_42";   // ✅
id = 42;       // ✅
id = true;
// ❌ a boolean is neither a string nor a number`;

const UNIONS_MET = `type Theme = "dark" | "light";     // a union of literals
let name: string | null = null;    // a union with null`;

const UNION_SHARED = `function show(id: string | number) {
    id.toString();      // ✅ exists on string AND on number
    id.toUpperCase();
    // ❌ numbers have no toUpperCase, and id might be a number
}`;

const LIBRARY_UNIONS = `const users = ["sam", "alex"];

const found = users.find(u => u.startsWith("z"));    // string | undefined
const el = document.getElementById("app");           // HTMLElement | null
const saved = localStorage.getItem("theme");         // string | null`;

const LIBRARY_UNIONS_USE = `found.toUpperCase();
// ❌ found might be undefined — find returns nothing when no element matches

el.textContent = "hi";
// ❌ el might be null — the element may not exist in the page`;

const FLAT_UNION = `type Primary = "red" | "blue";
type Extra = "green" | "black";

type Color = Primary | Extra;   // "red" | "blue" | "green" | "black"`;

const SWALLOWED = `type Theme = "dark" | "light" | string;   // string`;

const STRING_AND_EMPTY = `type Theme = "dark" | "light" | (string & {});

const a: Theme = "dark";      // ✅ suggested by the editor
const b: Theme = "#1e1e1e";   // ✅ any other string still accepted`;

const EMPTY_OBJECT_TYPE = `const a: {} = "hi";       // ✅
const b: {} = 42;         // ✅
const c: {} = { x: 1 };   // ✅
const d: {} = null;
// ❌ null and undefined are the only values {} excludes`;

const IDENTITY_NOT_MEANING = `type A = "dark" | string;           // string — the literal is removed
type B = "dark" | (string & {});    // "dark" | (string & {}) — the literal is kept`;

// ===================================================================
// part 2 — narrowing
// ===================================================================

const TYPEOF_NARROW = `function show(id: string | number) {
    if (typeof id === "string") {
        id.toUpperCase();   // ✅ id: string in here
    } else {
        id.toFixed(2);      // ✅ id: number in here
    }
}`;

const EARLY_RETURN = `function show(id: string | number) {
    if (typeof id === "number") return id.toFixed(2);

    id.toUpperCase();   // ✅ the number case already returned, so id: string
}`;

const TYPEOF_NULL = `function size(value: string[] | null) {
    if (typeof value === "object") {
        value.length;
        // ❌ value might still be null — typeof null is "object" too
    }
}`;

const STRICT_EQUALITY = `function greet(name: string | null) {
    if (name !== null) {
        name.toUpperCase();   // ✅ name: string
    }
}`;

const LOOSE_NULL = `function greet(name: string | null | undefined) {
    if (name != null) {
        name.toUpperCase();   // ✅ name: string — null AND undefined are gone
    }
}`;

const TRUTHINESS = `function greet(name: string | null) {
    if (name) {
        name.toUpperCase();   // ✅ name: string
    }
}`;

const OPERATORS = `const length = name?.length;      // number | undefined — stops at null instead of crashing
const label = name ?? "guest";    // string — fallback only for null or undefined`;

const TRUTHY_ZERO = `function setVolume(level: number | undefined) {
    if (level) {
        apply(level);
    }
    // compiles — but a real level of 0 never reaches apply, because 0 is falsy
}`;

const IN_NARROW = `type Cat = { name: string; meow: () => void };
type Dog = { name: string; bark: () => void };

function speak(pet: Cat | Dog) {
    if ("meow" in pet) {
        pet.meow();   // ✅ pet: Cat
    } else {
        pet.bark();   // ✅ pet: Dog
    }
}`;

const INSTANCEOF = `function format(value: Date | string) {
    if (value instanceof Date) {
        return value.toISOString();   // ✅ value: Date
    }
    return value.trim();              // ✅ value: string
}`;

const IS_ARRAY = `function names(input: string | string[]) {
    if (Array.isArray(input)) {
        return input.join(", ");   // ✅ input: string[]
    }
    return input;                  // ✅ input: string
}`;

const IS_ARRAY_UNKNOWN = `function count(data: unknown) {
    if (Array.isArray(data)) {
        data[0].whatever();   // compiles — data is any[], so checking is off again
    }
}`;

const INSTANCEOF_TYPE = `type User = { name: string };

if (value instanceof User) {}
// ❌ User is only a type — it does not exist at runtime, so there is nothing to check against`;

const REASSIGN = `let id: string | number = "u_42";   // narrowed to string by the assignment
id.toUpperCase();                   // ✅

id = 42;                            // now narrowed to number
id.toUpperCase();
// ❌ id holds a number now — narrowing follows the latest assignment`;

const CALLBACK_VARIABLE = `function greetLater(name: string | null) {
    if (!name) return;
    setTimeout(() => name.toUpperCase(), 100);   // ✅ name: string — never reassigned
}`;

const CALLBACK_PROPERTY = `function notify(user: { email?: string }, ids: string[]) {
    if (user.email) {
        ids.forEach(id => send(id, user.email));
        // ❌ user.email might be undefined again by the time the callback runs
    }
}`;

const COPY_TO_CONST = `if (user.email) {
    const email = user.email;              // string, and it cannot change
    ids.forEach(id => send(id, email));    // ✅
}`;

const NAMED_CONDITION = `function show(id: string | number) {
    const isText = typeof id === "string";
    if (isText) {
        id.toUpperCase();   // ✅ the compiler remembers what isText proved
    }
}`;

// ===================================================================
// part 3 — discriminated unions
// ===================================================================

const OPTIONAL_FIELDS = `type RequestState = {
    loading: boolean;
    data?: User[];
    error?: string;
};

const a: RequestState = { loading: true, data: users, error: "timeout" };   // ✅ compiles
const b: RequestState = { loading: false };                                  // ✅ compiles`;

const LABELLED_SHAPES = `type RequestState =
    | { status: "loading" }
    | { status: "success"; data: User[] }
    | { status: "error"; error: string };

const a: RequestState = { status: "loading", data: users };
// ❌ a loading state has no data field — data only exists on success
const b: RequestState = { status: "success" };
// ❌ a success state must carry its data`;

const RENDER_IF = `function render(state: RequestState) {
    if (state.status === "loading") {
        return "Loading…";
    }
    if (state.status === "error") {
        return \`Failed: \${state.error}\`;     // ✅ state is the error member
    }
    return \`\${state.data.length} users\`;     // ✅ only "success" is left
}`;

const RENDER_UNCHECKED = `function render(state: RequestState) {
    state.data;
    // ❌ data only exists on the success state — check status first
}`;

const RENDER_SWITCH = `function render(state: RequestState) {
    switch (state.status) {
        case "loading":
            return "Loading…";
        case "success":
            return \`\${state.data.length} users\`;   // ✅ state is the success member
        case "error":
            return \`Failed: \${state.error}\`;       // ✅ state is the error member
    }
}`;

const REACT_RENDER = `function UserList({ state }: { state: RequestState }) {
    if (state.status === "loading") return <Spinner />;
    if (state.status === "error") return <ErrorBox message={state.error} />;
    return <ul>{state.data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}`;

const DESTRUCTURED = `type Action =
    | { type: "add"; payload: number }
    | { type: "rename"; payload: string };

function reduce(action: Action) {
    const { type, payload } = action;
    if (type === "add") {
        payload.toFixed();   // ✅ checking type narrowed payload to number
    }
}`;

const STRING_DISCRIMINANT = `type Shape =
    | { kind: string; radius: number }
    | { kind: string; side: number };

function area(s: Shape) {
    if (s.kind === "circle") {
        s.radius;
        // ❌ kind is just string on both members, so the check proves nothing
    }
}`;

const BOOLEAN_DISCRIMINANT = `type Result =
    | { ok: true; value: number }
    | { ok: false; error: string };

function show(r: Result) {
    if (r.ok) {
        r.value;   // ✅ the ok: true member
    } else {
        r.error;   // ✅ the ok: false member
    }
}`;

const WIDENED_LABEL = `const s = { status: "loading" };   // { status: string } — widened
setState(s);
// ❌ status is a plain string here, and a string cannot prove which state this is`;

const KEEP_LITERAL = `setState({ status: "loading" });                  // ✅ written in place, it stays literal
const a: RequestState = { status: "loading" };    // ✅ annotated
const b = { status: "loading" } as const;         // ✅ frozen literal`;

// ===================================================================
// part 4 — type guard functions
// ===================================================================

const GUARD_BOOLEAN = `function isUser(value: User | Admin): boolean {
    return "email" in value && !("level" in value);
}

function greet(person: User | Admin) {
    if (isUser(person)) {
        person.email;
        // ❌ person is still User | Admin
    }
}`;

const GUARD_PREDICATE = `function isUser(value: User | Admin): value is User {
    return "email" in value && !("level" in value);
}

function greet(person: User | Admin) {
    if (isUser(person)) {
        person.email;   // ✅ person: User
    } else {
        person.level;   // ✅ person: Admin
    }
}`;

const GUARD_FILTER = `const items: (User | Admin)[] = load();

const users = items.filter(isUser);   // User[]`;

const INFERRED_PREDICATE = `const ids = [1, null, 3, null];

const clean = ids.filter(id => id !== null);   // number[] — inferred as  id is number`;

const GUARD_LIES = `function isUser(value: User | Admin): value is User {
    return true;   // ✅ compiles — the body is never compared with the promise
}

function greet(person: User | Admin) {
    if (isUser(person)) {
        person.email.toUpperCase();   // compiles, then crashes on an Admin
    }
}`;

const GUARD_WEAK = `function isUser(value: unknown): value is User {
    return typeof value === "object" && value !== null && "name" in value;
    // proves name exists — but not that it is a string, and nothing about email
}`;

const GUARD_FULL = `type User = { name: string; email: string };

function isUser(value: unknown): value is User {
    return (
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        typeof value.name === "string" &&
        "email" in value &&
        typeof value.email === "string"
    );
}`;

const ASSERTS = `function assertUser(value: unknown): asserts value is User {
    if (!isUser(value)) throw new Error("Not a user");
}

const data: unknown = JSON.parse(raw);
assertUser(data);
data.email;   // ✅ data: User from here on — the call would have thrown otherwise`;

// ===================================================================
// part 5 — exhaustiveness
// ===================================================================

const FORGOTTEN_CASE = `type RequestState =
    | { status: "loading" }
    | { status: "success"; data: User[] }
    | { status: "error"; error: string }
    | { status: "idle" };                 // added later

function log(state: RequestState) {
    switch (state.status) {
        case "loading": console.log("…"); break;
        case "success": console.log(state.data); break;
        case "error":   console.log(state.error); break;
    }
    // compiles — "idle" falls through and nothing happens
}`;

const NEVER_DEFAULT = `function log(state: RequestState) {
    switch (state.status) {
        case "loading": console.log("…"); break;
        case "success": console.log(state.data); break;
        case "error":   console.log(state.error); break;
        default: {
            const unhandled: never = state;
            // ❌ the idle state reaches here — no case handles it yet
        }
    }
}`;

const RETURN_TYPE_CHECK = `function label(state: RequestState): string {
    // ❌ not every path returns a string — the idle case falls off the end
    switch (state.status) {
        case "loading": return "Loading";
        case "success": return "Done";
        case "error":   return "Failed";
    }
}`;

const ASSERT_NEVER = `function assertNever(value: never): never {
    throw new Error(\`Unhandled case: \${JSON.stringify(value)}\`);
}`;

const ASSERT_NEVER_USE = `function label(state: RequestState): string {
    switch (state.status) {
        case "loading": return "Loading";
        case "success": return "Done";
        case "error":   return "Failed";
        case "idle":    return "Waiting";
        default:        return assertNever(state);   // ✅ every case handled, state: never
    }
}`;

const SATISFIES_NEVER = `switch (state.status) {
    case "loading": return "Loading";
    case "success": return "Done";
    case "error":   return "Failed";
    default:
        state satisfies never;
        // ❌ the idle state is left over, and it does not fit never
}`;

const RECORD_EXHAUSTIVE = `const LABELS: Record<RequestState["status"], string> = {
    loading: "Loading",
    success: "Done",
    error: "Failed",
};
// ❌ the idle key is missing — a Record over a union needs every key

const text = LABELS[state.status];`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings functions.tsx uses, so the pages split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function UnionsAndNarrowingDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the earlier pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Most values in a real program can be more than one thing: a
                    result that may be missing, an id that may be a string or a
                    number, a request that is loading, done or failed.{" "}
                    <Term>
                        A union type says so, and narrowing is how you find out
                        which one you have.
                    </Term>{" "}
                    The two always come together — a union describes the
                    possibilities, and every use of it starts by ruling some of
                    them out.
                </p>
                <p>
                    This page builds from the plain union, through the checks the
                    compiler understands, to the two patterns that make unions safe
                    at scale: discriminated unions and exhaustiveness checks. Same
                    conventions as before: <Code>strict: true</Code>{" "}throughout,
                    errors marked <Code>{"// ❌"}</Code> on the line below the code
                    that caused them, <Code>{"// ✅"}</Code> on lines that compile
                    where the contrast helps, and inferred types as a comment at the
                    end of the line.
                </p>
            </div>

            {/* ---------- part 1 — the plain union ---------- */}
            <PartHeading kicker="part 1">Union Types</PartHeading>
            <div>
                <DocSection title="what a union is">
                    <p>
                        <Term>A union says a value is one of several types.</Term>{" "}
                        It is written with <Code>|</Code> between the members:
                    </p>
                    <CodeBlock code={UNION_BASIC} lang="ts" />
                    <p>
                        Read <Code>string | number</Code> as &ldquo;string{" "}
                        <em>or</em> number&rdquo;. At any moment the value is exactly
                        one of them; the type simply does not say which. You have
                        already met unions without the name:
                    </p>
                    <CodeBlock code={UNIONS_MET} lang="ts" />
                    <p>
                        <Term>A union only allows what is valid for every member.</Term>{" "}
                        The compiler does not know which member is there right now, so
                        it permits only the operations they all share:
                    </p>
                    <CodeBlock code={UNION_SHARED} lang="ts" />
                    <p>
                        This is the rule Objects &amp; Aliases showed for unions of
                        objects — a union gives you only what all its members have in
                        common. To call <Code>toUpperCase</Code> you must first prove{" "}
                        <Code>id</Code> is a string. That proof is{" "}
                        <Term>narrowing</Term>, the subject of part 2.
                    </p>
                </DocSection>

                <DocSection title="where unions come from">
                    <p>
                        You write unions yourself, but more often{" "}
                        <Term>the standard library hands them to you.</Term>{" "}
                        Any API that might come back empty returns a union with{" "}
                        <Code>undefined</Code> or <Code>null</Code>:
                    </p>
                    <CodeBlock code={LIBRARY_UNIONS} lang="ts" />
                    <p>
                        Each is honest: <Code>find</Code> may match nothing, the
                        element may not exist, the key may never have been set. Under{" "}
                        <Code>strictNullChecks</Code> that possibility is part of the
                        type, so it cannot be forgotten:
                    </p>
                    <CodeBlock code={LIBRARY_UNIONS_USE} lang="ts" />
                    <p>
                        <Term>
                            <Code>T | undefined</Code> and <Code>T | null</Code> are
                            the unions you will handle most
                        </Term>{" "}
                        — far more often than <Code>string | number</Code>. Your own
                        functions produce them too: Functions showed that a function
                        returning on some paths and not others is inferred as a union
                        with <Code>undefined</Code>. Wherever a value has more than one
                        possible outcome, a union appears.
                    </p>

                    <Callout
                        severity="note"
                        label="note · undefined or null — the api decides"
                    >
                        <p>
                            <Code>undefined</Code> usually means nothing was found or
                            nothing was passed: <Code>find</Code>, optional
                            parameters, optional properties. <Code>null</Code>{" "}
                            usually means deliberately empty:{" "}
                            <Code>getElementById</Code>,{" "}
                            <Code>localStorage.getItem</Code>, JSON values, most
                            database drivers. Which one you get is decided by the
                            API, not by you — and both are removed the same way, by
                            narrowing.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="combining unions">
                    <p>
                        <Term>A union of unions is one flat union.</Term>{" "}
                        Members are simply collected together:
                    </p>
                    <CodeBlock code={FLAT_UNION} lang="ts" />
                    <p>
                        Three rules hold for every union and explain the types you see
                        in editor tooltips: order does not matter (
                        <Code>string | number</Code> and <Code>number | string</Code>{" "}
                        are the same type); duplicates collapse (
                        <Code>{'"red" | "red"'}</Code> is just <Code>{'"red"'}</Code>);{" "}
                        <Code>never</Code> vanishes (<Code>string | never</Code> is{" "}
                        <Code>string</Code>, because <Code>never</Code> has no values
                        to add). That last rule is why <Code>never</Code> appears so
                        often inside the toolkit&apos;s types without ever showing up
                        in their results.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · a wider member swallows the literals"
                    >
                        <p>
                            When one member already contains another, the smaller one
                            is absorbed:
                        </p>
                        <CodeBlock code={SWALLOWED} lang="ts" />
                        <p>
                            <Code>{'"dark"'}</Code> and <Code>{'"light"'}</Code> are
                            strings, so <Code>string</Code> swallows them and the whole
                            union collapses to plain <Code>string</Code>. It still
                            compiles and still accepts <Code>{'"dark"'}</Code> — but
                            autocomplete is gone, and a typo like{" "}
                            <Code>{'"drak"'}</Code> is accepted silently. The same
                            happens at the extremes: <Code>unknown | string</Code> is{" "}
                            <Code>unknown</Code>, and anything unioned with{" "}
                            <Code>any</Code> is <Code>any</Code>.
                        </p>
                        <p>
                            When you genuinely want &ldquo;these known values, but any
                            other string too&rdquo; — CSS colours, event names — the
                            known fix keeps the suggestions:
                        </p>
                        <CodeBlock code={STRING_AND_EMPTY} lang="ts" />
                    </Callout>

                    <Callout severity="note" label="note · why string & {} works">
                        <p>
                            It is a quirk of the compiler, not a feature of the
                            standard library. As a type, <Code>{"{}"}</Code> does not
                            mean &ldquo;empty object&rdquo; — it means any value that
                            is not <Code>null</Code> or <Code>undefined</Code>:
                        </p>
                        <CodeBlock code={EMPTY_OBJECT_TYPE} lang="ts" />
                        <p>
                            So <Code>{"string & {}"}</Code> is &ldquo;a string that is
                            not null or undefined&rdquo; — every string, exactly the
                            same values as <Code>string</Code>. The difference is in
                            how unions are simplified: the compiler drops string
                            literals when the <Code>string</Code> type <em>itself</em>{" "}
                            is a member, and an intersection is a different type that
                            merely holds the same values. The check compares by
                            identity, not by meaning, so it does not fire:
                        </p>
                        <CodeBlock code={IDENTITY_NOT_MEANING} lang="ts" />
                        <p>
                            The literals survive, so the editor can still offer them.
                            The TypeScript team keeps this working because so many
                            libraries rely on it; some give it a name, like{" "}
                            <Code>LiteralUnion</Code> in type-fest, but underneath it
                            is always the same <Code>{"& {}"}</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — ruling members out ---------- */}
            <PartHeading kicker="part 2">Narrowing</PartHeading>
            <div>
                <DocSection title="narrowing with typeof">
                    <p>
                        <Term>
                            Narrowing is the compiler shrinking a union inside a
                            block, because a runtime check proved which member is
                            there.
                        </Term>{" "}
                        You write ordinary JavaScript checks; the compiler follows
                        them. The first tool is <Code>typeof</Code>:
                    </p>
                    <CodeBlock code={TYPEOF_NARROW} lang="ts" />
                    <p>
                        Inside the <Code>if</Code>, <Code>number</Code> is ruled out;
                        in the <Code>else</Code>, <Code>string</Code> is ruled out.
                        Nothing had to be annotated — the compiler read the check.
                    </p>
                    <p>
                        <Term>The compiler tracks control flow.</Term>{" "}
                        It follows every <Code>if</Code>, <Code>return</Code>,{" "}
                        <Code>throw</Code> and <Code>else</Code>, and knows which
                        types can still reach each line. That makes early returns
                        narrow too:
                    </p>
                    <CodeBlock code={EARLY_RETURN} lang="ts" />
                    <p>
                        Handle the odd case, return, then carry on with the main one —
                        the most common narrowing shape in real code.
                    </p>
                    <p>
                        <Code>typeof</Code> can only answer with a fixed set of
                        strings, so those are the only things it can narrow to:{" "}
                        <Code>{'"string"'}</Code>, <Code>{'"number"'}</Code>,{" "}
                        <Code>{'"boolean"'}</Code>, <Code>{'"bigint"'}</Code>,{" "}
                        <Code>{'"symbol"'}</Code>, <Code>{'"undefined"'}</Code>,{" "}
                        <Code>{'"function"'}</Code> and <Code>{'"object"'}</Code>.
                        There is no <Code>{'"array"'}</Code> and no{" "}
                        <Code>{'"null"'}</Code>.
                    </p>

                    <Callout severity="trap" label='trap · typeof null is "object"'>
                        <p>
                            A JavaScript bug from 1995 that can never be fixed — and
                            the compiler knows about it, so <Code>{'"object"'}</Code>{" "}
                            narrows to &ldquo;an object <em>or</em> null&rdquo;:
                        </p>
                        <CodeBlock code={TYPEOF_NULL} lang="ts" />
                        <p>
                            Arrays report <Code>{'"object"'}</Code> as well. For
                            arrays use <Code>Array.isArray</Code>; for null, compare
                            with <Code>null</Code> directly.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="removing null and undefined">
                    <p>
                        The unions you narrow most are <Code>T | null</Code> and{" "}
                        <Code>T | undefined</Code>. There are three ways to remove the
                        empty case, and they do not remove the same things.
                    </p>
                    <p>
                        <Term>An equality check is exact.</Term>{" "}
                        <Code>===</Code> and <Code>!==</Code> narrow by precisely what
                        you compared against:
                    </p>
                    <CodeBlock code={STRICT_EQUALITY} lang="ts" />
                    <p>
                        One exception worth using: loose <Code>!= null</Code> removes
                        both <Code>null</Code> and <Code>undefined</Code> at once,
                        because in JavaScript <Code>null == undefined</Code> is true.
                        It is the one place where <Code>!=</Code> is the idiomatic
                        choice rather than a mistake:
                    </p>
                    <CodeBlock code={LOOSE_NULL} lang="ts" />
                    <p>
                        <Term>A truthiness check is short.</Term>{" "}
                        <Code>if (name)</Code> narrows correctly too:
                    </p>
                    <CodeBlock code={TRUTHINESS} lang="ts" />
                    <p>
                        <Term>The operators need no block at all.</Term>{" "}
                        <Code>?.</Code> reads through a possibly empty value, and{" "}
                        <Code>??</Code> supplies a fallback:
                    </p>
                    <CodeBlock code={OPERATORS} lang="ts" />
                    <p>Side by side, what each check takes out of the union:</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["check", "removes", "lets through"]}
                        rows={[
                            ["x !== null", "null", 'undefined, 0, ""'],
                            ["x != null", "null, undefined", '0, "", false'],
                            ["if (x)", 'null, undefined, 0, "", NaN, false', "truthy values only"],
                            ["x ?? fallback", "null, undefined", '0, "", false'],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label='trap · truthiness also removes 0 and ""'
                    >
                        <p>
                            <Code>if (x)</Code> rules out every falsy value, not just
                            the empty ones. The types still check, so the compiler
                            says nothing — this is a logic bug, not a type error:
                        </p>
                        <CodeBlock code={TRUTHY_ZERO} lang="ts" />
                        <p>
                            A valid <Code>0</Code> is treated exactly like a missing
                            value, and so is an empty string you meant to keep. Use
                            truthiness for objects and arrays, where no valid value is
                            falsy; for numbers and strings, compare with{" "}
                            <Code>null</Code> or <Code>undefined</Code> explicitly.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · ?? is the safe fallback">
                        <p>
                            <Code>??</Code> replaces only <Code>null</Code> and{" "}
                            <Code>undefined</Code>, so <Code>0</Code> and{" "}
                            <Code>{'""'}</Code> survive. The older{" "}
                            <Code>{'name || "guest"'}</Code> also replaces an empty
                            string — the same trap as truthiness, in operator form.
                            Reach for <Code>??</Code> by default.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="narrowing objects">
                    <p>
                        <Code>typeof</Code> says <Code>{'"object"'}</Code> for every
                        object, so it cannot tell two object types apart. Three other
                        checks can.
                    </p>
                    <p>
                        <Term>
                            <Code>in</Code> checks whether a property exists.
                        </Term>{" "}
                        The compiler keeps only the members that have it:
                    </p>
                    <CodeBlock code={IN_NARROW} lang="ts" />
                    <p>
                        Two things decide whether it works well. The key must belong to
                        some members and not all — <Code>{'"name" in pet'}</Code>{" "}
                        narrows nothing, because both have it. And an optional key does
                        not split cleanly: if <Code>Dog</Code> had{" "}
                        <Code>{"meow?: () => void"}</Code>, a <Code>Dog</Code> could
                        still be inside the <Code>if</Code>, so both members stay.
                        That fragility is why part 3 replaces <Code>in</Code> with a
                        dedicated label.
                    </p>
                    <p>
                        <Term>
                            <Code>instanceof</Code> checks which class made a value.
                        </Term>
                    </p>
                    <CodeBlock code={INSTANCEOF} lang="ts" />
                    <p>
                        You will use it most in <Code>catch</Code>, as{" "}
                        <Code>e instanceof Error</Code>.
                    </p>
                    <p>
                        <Term>
                            <Code>Array.isArray</Code> checks for an array.
                        </Term>{" "}
                        It is the standard way to accept one value or many:
                    </p>
                    <CodeBlock code={IS_ARRAY} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · Array.isArray on unknown gives any[]"
                    >
                        <p>
                            On an <Code>unknown</Code>, the check narrows to{" "}
                            <Code>any[]</Code>, not <Code>unknown[]</Code> — the{" "}
                            <Code>any</Code> slips back in through the library&apos;s
                            own signature:
                        </p>
                        <CodeBlock code={IS_ARRAY_UNKNOWN} lang="ts" />
                        <p>
                            When the input is <Code>unknown</Code>, check the elements
                            too before trusting them. The type guards in part 4 are
                            built for exactly that.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · instanceof needs a class">
                        <p>
                            It works only with things that exist at runtime and can be{" "}
                            <Code>new</Code>-ed — <Code>Date</Code>, <Code>Error</Code>,{" "}
                            <Code>Map</Code>, your own classes. A type or an interface
                            is erased before the program runs, so there is nothing to
                            compare against:
                        </p>
                        <CodeBlock code={INSTANCEOF_TYPE} lang="ts" />
                        <p>
                            The type world and value world split from First Types,
                            once more.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="when narrowing is lost">
                    <p>
                        Narrowing is a fact the compiler holds about one place in the
                        code. A few things make it drop that fact, and knowing them
                        explains most &ldquo;but I already checked it&rdquo; errors.
                    </p>
                    <p>
                        <Term>Reassignment resets it.</Term>{" "}
                        A new assignment throws away what was proved, and the variable
                        goes back to its declared type:
                    </p>
                    <CodeBlock code={REASSIGN} lang="ts" />
                    <p>
                        A <Code>const</Code> cannot be reassigned, so whatever you
                        prove about one stays proved.
                    </p>
                    <p>
                        <Term>Callbacks keep it for variables, not for properties.</Term>{" "}
                        A callback runs later, so the compiler asks whether the value
                        could have changed by then. A parameter or variable that is
                        never reassigned afterwards keeps its narrowing (TypeScript
                        5.4 and later):
                    </p>
                    <CodeBlock code={CALLBACK_VARIABLE} lang="ts" />
                    <p>
                        A property is different. Any code could change{" "}
                        <Code>user.email</Code> between the check and the moment the
                        callback runs, so the narrowing does not survive:
                    </p>
                    <CodeBlock code={CALLBACK_PROPERTY} lang="ts" />

                    <Callout severity="tip" label="tip · copy it into a const">
                        <p>
                            Take the narrowed value out into a <Code>const</Code>{" "}
                            first. A <Code>const</Code> cannot change, so its type
                            holds everywhere — including inside callbacks:
                        </p>
                        <CodeBlock code={COPY_TO_CONST} lang="ts" />
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · a named condition still narrows"
                    >
                        <p>
                            Since TypeScript 4.4 a check can be stored in a variable
                            and narrowing still flows through it, as long as both are{" "}
                            <Code>const</Code>:
                        </p>
                        <CodeBlock code={NAMED_CONDITION} lang="ts" />
                        <p>
                            Useful when a condition is long or used twice. Make{" "}
                            <Code>isText</Code> a <Code>let</Code> and the link is
                            lost.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — the labelled union ---------- */}
            <PartHeading kicker="part 3">Discriminated Unions</PartHeading>
            <div>
                <DocSection title="one label per shape">
                    <p>
                        Take a shape every application has, the state of a request.
                        The first instinct is one object with optional fields. It
                        compiles, and it describes the request badly, because it
                        allows states that can never really happen. The alternative
                        describes each real state as its own shape, and labels it:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>optional fields — anything goes</Term>
                                </p>
                                <CodeBlock code={OPTIONAL_FIELDS} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>one labelled shape per state</Term>
                                </p>
                                <CodeBlock code={LABELLED_SHAPES} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        On the left, <Code>a</Code> is loading, has data and has
                        failed all at once, and <Code>b</Code> finished with neither
                        data nor an error. Every consumer must defend against those
                        combinations, and <Code>data</Code> is always{" "}
                        <Code>User[] | undefined</Code> — even where the request
                        clearly succeeded.
                    </p>
                    <p>
                        The right is a <Term>discriminated union</Term>. Each member is
                        one real situation with exactly the fields that exist in it,
                        and every member carries the same key — <Code>status</Code> —
                        holding a different literal. That key is the{" "}
                        <Term>discriminant</Term>. The impossible states are now
                        impossible to write, and the mistake is reported where the
                        wrong object is built rather than wherever it is later read.
                    </p>

                    <Callout
                        severity="tip"
                        label="tip · make illegal states unrepresentable"
                    >
                        <p>
                            When two optional fields are never meant to be set
                            together, or one only makes sense alongside another, the
                            shape is really several shapes. Split it into a
                            discriminated union, and the type itself rules out the
                            combinations you would otherwise have to guard against at
                            runtime.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="narrowing on the discriminant">
                    <p>
                        <Term>
                            One comparison on the discriminant tells the compiler which
                            member you have
                        </Term>{" "}
                        — and every field of that member becomes available:
                    </p>
                    <CodeBlock code={RENDER_IF} lang="ts" />
                    <p>
                        No optional chaining and no <Code>undefined</Code> checks. On{" "}
                        <Code>{'"error"'}</Code>, <Code>error</Code> is a plain string;
                        after two early returns only <Code>{'"success"'}</Code>{" "}
                        remains, so <Code>data</Code> is a plain <Code>User[]</Code>.
                        Reaching for a field before checking is refused, which is
                        exactly the protection you want:
                    </p>
                    <CodeBlock code={RENDER_UNCHECKED} lang="ts" />
                    <p>
                        <Term>
                            <Code>switch</Code> is the natural form once there are
                            three or more members.
                        </Term>{" "}
                        Each case narrows on its own, and the editor autocompletes the
                        case values, because <Code>state.status</Code> is a literal
                        union:
                    </p>
                    <CodeBlock code={RENDER_SWITCH} lang="ts" />
                    <p>In React it is the standard way to render by state:</p>
                    <CodeBlock code={REACT_RENDER} lang="tsx" />

                    <Callout
                        severity="note"
                        label="note · destructuring keeps the link"
                    >
                        <p>
                            Since TypeScript 4.6, checking a destructured discriminant
                            narrows its sibling, provided both are <Code>const</Code>{" "}
                            and the field exists on every member:
                        </p>
                        <CodeBlock code={DESTRUCTURED} lang="ts" />
                        <p>
                            It works because <Code>payload</Code> is on both members.
                            You cannot destructure <Code>data</Code> from{" "}
                            <Code>RequestState</Code>, since loading and error do not
                            have it. The same <Code>type</Code> /{" "}
                            <Code>payload</Code> shape is what <Code>useReducer</Code>{" "}
                            actions look like — Hooks &amp; State builds on it.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="designing the discriminant">
                    <p>
                        The pattern only works when the discriminant follows a few
                        rules. Break one and narrowing quietly stops.
                    </p>
                    <p>
                        <Term>It must be a literal type, not string.</Term>{" "}
                        The compiler narrows by ruling out the members whose literal
                        does not match; with <Code>string</Code> on every member,
                        nothing can be ruled out:
                    </p>
                    <CodeBlock code={STRING_DISCRIMINANT} lang="ts" />
                    <p>
                        <Term>
                            The same key on every member, a different value on each.
                        </Term>{" "}
                        Pick one name — <Code>kind</Code>, <Code>type</Code> and{" "}
                        <Code>status</Code> are the usual ones — and use it
                        everywhere. Two members sharing a value cannot be told apart.
                        Keep it at the top level too: a label nested deeper, like{" "}
                        <Code>state.meta.kind</Code>, does not narrow{" "}
                        <Code>state</Code> itself.
                    </p>
                    <p>
                        <Term>It can be a boolean.</Term>{" "}
                        <Code>true</Code> and <Code>false</Code> are literals as well,
                        and a two-way result often reads clearest that way:
                    </p>
                    <CodeBlock code={BOOLEAN_DISCRIMINANT} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · built on its own line, the literal widens"
                    >
                        <p>
                            An object written on its own loses its literal, because
                            its properties are mutable — the let-widens rule from
                            First Types:
                        </p>
                        <CodeBlock code={WIDENED_LABEL} lang="ts" />
                        <p>Three ways to keep the literal:</p>
                        <CodeBlock code={KEEP_LITERAL} lang="ts" />
                        <p>
                            Writing the object where it is used is usually enough; an
                            annotation is clearest when it is built ahead of time.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · why literal unions, not enums"
                    >
                        <p>
                            A discriminant is a literal union, which is the practical
                            reason First Types recommends literal unions over{" "}
                            <Code>enum</Code>: they drop straight into this pattern,
                            compare against plain strings arriving from an API, and
                            need no import at every call site.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — checks you write yourself ---------- */}
            <PartHeading kicker="part 4">Type Guard Functions</PartHeading>
            <div>
                <DocSection title="value is T">
                    <p>
                        Real checks are often longer than one <Code>typeof</Code>, and
                        you want to write them once and reuse them. A function that
                        returns <Code>boolean</Code> does not help, because the
                        compiler never looks inside it. A <Term>type predicate</Term>{" "}
                        does:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>boolean — tells the caller nothing</Term>
                                </p>
                                <CodeBlock code={GUARD_BOOLEAN} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>value is User — narrows the argument</Term>
                                </p>
                                <CodeBlock code={GUARD_PREDICATE} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        <Term>
                            Read <Code>value is User</Code> as a promise:
                        </Term>{" "}
                        if this returns true, the argument is a <Code>User</Code>. The
                        compiler narrows the argument in the <Code>if</Code>, and the
                        opposite way in the <Code>else</Code>. The name before{" "}
                        <Code>is</Code> must be one of the function&apos;s own
                        parameters.
                    </p>
                    <p>
                        The most common use is filtering — <Code>filter</Code> with a
                        guard narrows the type of the array it returns:
                    </p>
                    <CodeBlock code={GUARD_FILTER} lang="ts" />

                    <Callout
                        severity="note"
                        label="note · simple guards are inferred since typescript 5.5"
                    >
                        <p>
                            An arrow function whose body is a narrowing check now gets
                            a predicate automatically:
                        </p>
                        <CodeBlock code={INFERRED_PREDICATE} lang="ts" />
                        <p>
                            Before 5.5 this produced <Code>(number | null)[]</Code>,
                            which is why older code is full of hand-written{" "}
                            <Code>{"(x): x is number => x !== null"}</Code>. Write the
                            predicate yourself when the check is too complex to infer,
                            or when the function is exported and the predicate is part
                            of its contract.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="a guard is a promise" sectionSeverity="danger">
                    <p>
                        <Term>
                            The compiler never checks that a guard&apos;s body keeps
                            its promise.
                        </Term>{" "}
                        Only the return value has to be a boolean:
                    </p>
                    <CodeBlock code={GUARD_LIES} lang="ts" />
                    <p>
                        The guard lies, and every place that uses it is now typed
                        wrongly — silently. In practice the cause is rarely{" "}
                        <Code>return true</Code>; it is a check that is too weak, one
                        that tests a single property of a type with several:
                    </p>
                    <CodeBlock code={GUARD_WEAK} lang="ts" />
                    <p>
                        A guard is as strong as an <Code>as</Code> assertion, and just
                        as unchecked. Keep guards small, test every field the type
                        promises, and keep them next to the type they describe. From{" "}
                        <Code>unknown</Code>, that means proving each field step by
                        step:
                    </p>
                    <CodeBlock code={GUARD_FULL} lang="ts" />
                    <p>
                        Long for two fields, and it grows with every field and every
                        nested object. This is where real projects stop writing guards
                        by hand and let a validation library such as Zod generate them
                        from a schema — Data Boundaries &amp; Async picks that thread
                        up.
                    </p>

                    <Callout severity="note" label="note · asserts value is T">
                        <p>
                            An <Term>assertion function</Term> throws instead of
                            returning a boolean, and narrows everything <em>after</em>{" "}
                            the call:
                        </p>
                        <CodeBlock code={ASSERTS} lang="ts" />
                        <p>
                            Use <Code>value is T</Code> when the caller should branch,{" "}
                            <Code>asserts value is T</Code> when bad data should simply
                            stop the program. The same honesty rule applies to both:
                            the compiler believes the signature, not the body.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — proving every case is handled ---------- */}
            <PartHeading kicker="part 5">Exhaustiveness</PartHeading>
            <div>
                <DocSection title="the forgotten case">
                    <p>
                        A discriminated union grows over time. The danger is the day
                        someone adds a member and one of the places that handles the
                        union is not updated:
                    </p>
                    <CodeBlock code={FORGOTTEN_CASE} lang="ts" />
                    <p>
                        <Term>
                            The <Code>never</Code> check closes the gap.
                        </Term>{" "}
                        First Types showed the idea with <Code>if</Code>; in a{" "}
                        <Code>switch</Code> it goes in the <Code>default</Code>:
                    </p>
                    <CodeBlock code={NEVER_DEFAULT} lang="ts" />
                    <p>
                        Each case rules its member out. When all of them are handled,
                        nothing is left for the <Code>default</Code>, so{" "}
                        <Code>state</Code> is <Code>never</Code> and the assignment
                        compiles. When one is missing, <Code>state</Code> is that
                        member — which cannot be assigned to <Code>never</Code>, so the
                        error lands on the function you forgot, naming the state left
                        over.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · a switch does not have to cover every case"
                    >
                        <p>
                            Without a <Code>never</Code> check, a missing case is not
                            an error at all — the value falls through the{" "}
                            <Code>switch</Code> and nothing happens. Adding a member to
                            a union is only safe when every <Code>switch</Code> over it
                            ends in an exhaustiveness check.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · a return type is a partial check"
                    >
                        <p>
                            When the function declares a return type, a missing case
                            fails as well, because one path falls off the end without
                            returning:
                        </p>
                        <CodeBlock code={RETURN_TYPE_CHECK} lang="ts" />
                        <p>
                            Useful, but it only covers functions that return a value,
                            and the error is about the missing return rather than the
                            missing case. The <Code>never</Code> check works for any{" "}
                            <Code>switch</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="assertNever">
                    <p>
                        Writing <Code>const unhandled: never = state</Code> in every{" "}
                        <Code>switch</Code> is repetitive, and it does nothing at
                        runtime. <Term>One small helper fixes both:</Term>
                    </p>
                    <CodeBlock code={ASSERT_NEVER} lang="ts" />
                    <p>Use it as the default of every exhaustive switch:</p>
                    <CodeBlock code={ASSERT_NEVER_USE} lang="ts" />
                    <p>
                        <Term>At compile time</Term> the parameter is{" "}
                        <Code>never</Code>, so passing anything still possible fails —
                        remove the <Code>{'"idle"'}</Code> case and the call errors.{" "}
                        <Term>At runtime</Term> it throws. The types say the line
                        cannot be reached, but data from outside the program does not
                        respect your types: if an API starts sending a status your code
                        has never heard of, you get a clear error naming the value
                        instead of a silent <Code>undefined</Code> further down. And
                        because <Code>assertNever</Code> returns <Code>never</Code>,{" "}
                        <Code>return assertNever(state)</Code> satisfies the{" "}
                        <Code>string</Code> return type.
                    </p>
                    <p>
                        <Term>A compile-only form</Term> uses <Code>satisfies</Code>{" "}
                        (TypeScript 4.9 and later) — the same check, without a helper
                        or a variable, and without the runtime protection:
                    </p>
                    <CodeBlock code={SATISFIES_NEVER} lang="ts" />
                    <p>
                        Use it where a silent fall-through would be harmless, and{" "}
                        <Code>assertNever</Code> where unexpected data must stop the
                        program.
                    </p>

                    <Callout
                        severity="tip"
                        label="tip · a Record is exhaustive by itself"
                    >
                        <p>
                            When each case only maps to a value, skip the{" "}
                            <Code>switch</Code>. A <Code>Record</Code> keyed by the
                            union requires every key, as Objects &amp; Aliases showed:
                        </p>
                        <CodeBlock code={RECORD_EXHAUSTIVE} lang="ts" />
                        <p>
                            Adding a member to the union breaks the object until it is
                            filled in. Use the <Code>Record</Code> for plain lookups,
                            and the <Code>switch</Code> with <Code>assertNever</Code>{" "}
                            when cases run different logic.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
