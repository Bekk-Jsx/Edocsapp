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
    // --- part 1 (keyof) ---
    // "keys-as-a-union" carries no callout, so no entry.
    // inline `trap · for…in and Object.keys give string, not keyof`
    "keyof-typeof-and-index-signatures": ["trap"],

    // --- part 2 (Indexed Access) ---
    // "reading-a-property-type" and "nested-and-array-lookups" carry no callout,
    // so no entry.
    // inline `trap · the key must be a type, not a variable`
    "one-source-of-truth": ["trap"],

    // --- part 3 (K extends keyof T) ---
    // inline `note · K is what links the key to the result`
    "a-key-and-its-value-type": ["note"],
    // inline `tip · you have used this pattern` + `trap · a union key loosens the value check`
    "keys-that-drive-values": ["trap", "tip"],

    // --- part 4 (Deriving Types from Data) ---
    // inline `trap · without as const the union collapses`
    "a-union-from-an-array": ["trap"],
    // "keys-and-values-from-an-object" carries no callout, so no entry.
    // inline `trap · includes rejects a plain string` + `tip · when to derive, when to write`
    "one-constant-two-jobs": ["trap", "tip"],
};

// Top-level divider between the four parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in generics-basics.tsx.
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
// part 1 — keyof
// ===================================================================

const KEYOF_USER = `type User = { id: number; name: string; email: string };

type UserKey = keyof User;   // "id" | "name" | "email"

const a: UserKey = "name";   // ✅
const b: UserKey = "age";
// ❌ "age" is not a key of User`;

const SORT_BY = `function sortBy(users: User[], key: keyof User) { … }

sortBy(users, "email");   // ✅
sortBy(users, "emial");
// ❌ a typo — "emial" is not a key of User`;

const KEYOF_TYPEOF = `const config = { host: "localhost", port: 3000 };

type ConfigKey = keyof typeof config;   // "host" | "port"`;

const INDEX_SIGNATURE = `type Scores = { [name: string]: number };

type ScoreKey = keyof Scores;   // string | number`;

const FOR_IN = `for (const key in user) {
    user[key];
    // ❌ key is a string — and not every string is a key of User
}`;

// ===================================================================
// part 2 — indexed access
// ===================================================================

const PROPERTY_TYPE = `type User = {
    id: number;
    name: string;
    phone?: string;
    roles: ("admin" | "editor")[];
};

type Name = User["name"];     // string
type Phone = User["phone"];   // string | undefined — optional adds undefined`;

const UNION_KEYS = `type IdOrName = User["id" | "name"];   // number | string
type AnyValue = User[keyof User];      // every value type of User, in one union`;

const BRACKETS_ONLY = `type Wrong = User.name;
// ❌ User is a type, not a namespace — write User["name"]
type Missing = User["age"];
// ❌ age is not a property of User`;

const NESTED = `type Order = {
    id: string;
    customer: {
        name: string;
        address: { city: string; zip: string };
    };
};

type Address = Order["customer"]["address"];   // { city: string; zip: string }`;

const ARRAY_LOOKUP = `type Role = User["roles"][number];   // "admin" | "editor"

type Pair = [string, number];
type First = Pair[0];                // string`;

const POINT_AT = `function updateContact(id: User["id"], phone: User["phone"]) { … }

function ship(address: Order["customer"]["address"]) { … }`;

const VARIABLE_KEY = `const key = "name";

type A = User[key];
// ❌ key is a value — inside a type you need its type
type B = User[typeof key];   // ✅ string — typeof key is the literal "name"`;

// ===================================================================
// part 3 — K extends keyof T
// ===================================================================

const GET_PROP = `function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const user = { id: 1, name: "sam", email: "sam@x.com" };

getProp(user, "name");   // string
getProp(user, "id");     // number
getProp(user, "age");
// ❌ "age" is not a key of this object`;

const GET_LOOSE = `function getLoose<T>(obj: T, key: keyof T) {
    return obj[key];
}

getLoose(user, "name");   // string | number — any value, not the one asked for`;

const SET_PROP = `function setProp<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
    obj[key] = value;
}

setProp(user, "id", 2);     // ✅
setProp(user, "id", "2");
// ❌ id holds a number — the value must match the key`;

const PLUCK = `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
    return items.map((item) => item[key]);
}

pluck(users, "name");   // string[]
pluck(users, "id");     // number[]`;

const UNION_KEY = `function pick(): "id" | "name" { … }   // returns "id"

setProp(user, pick(), "oops");   // compiles — value only has to be number | string
user.id;                         // "oops" at runtime, typed number`;

// ===================================================================
// part 4 — deriving types from data
// ===================================================================

const ROLES_UNION = `const ROLES = ["admin", "editor", "viewer"] as const;

type Role = (typeof ROLES)[number];   // "admin" | "editor" | "viewer"`;

const ROLES_WIDE = `const ROLES = ["admin", "editor", "viewer"];   // string[]
type Role = (typeof ROLES)[number];            // string — every string is a "role"`;

const STATUS_MAP = `const STATUS = { active: "Active", banned: "Banned" } as const;

type StatusKey = keyof typeof STATUS;            // "active" | "banned"
type StatusLabel = (typeof STATUS)[StatusKey];   // "Active" | "Banned"`;

const PLANS = `const PLANS = [
    { id: "free", price: 0 },
    { id: "pro", price: 9 },
] as const;

type PlanId = (typeof PLANS)[number]["id"];   // "free" | "pro"`;

const IS_ROLE = `function isRole(value: string): value is Role {
    return (ROLES as readonly string[]).includes(value);
}`;

const INCLUDES_STRICT = `ROLES.includes(value);
// ❌ value is a string, but includes on this array only accepts "admin" | "editor" | "viewer"`;

export function KeysAndLookupsDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the earlier pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Three type operators that read other types:{" "}
                    <Code>keyof</Code> lists an object&apos;s keys,{" "}
                    <Code>T[K]</Code> reads the type behind a key, and{" "}
                    <Code>typeof</Code> brings a runtime value into the type world.
                    Together they let{" "}
                    <Term>
                        one type — or one constant — be the single source of truth
                        for many others.
                    </Term>
                </p>
                <p>
                    The page builds them up in order, combines them with generics as{" "}
                    <Code>K extends keyof T</Code>, and ends with types derived from
                    data, so a runtime list and its type can never drift apart.
                </p>
            </div>

            {/* ---------- part 1 — the keys of a type ---------- */}
            <PartHeading kicker="part 1">keyof</PartHeading>
            <div>
                <DocSection title="keys as a union">
                    <p>
                        <Term>
                            <Code>keyof</Code> takes an object type and gives a union of
                            its keys
                        </Term>{" "}
                        as string literals:
                    </p>
                    <CodeBlock code={KEYOF_USER} lang="ts" />
                    <p>
                        It is a literal union (First Types), built for you and always
                        in sync: add <Code>role</Code> to <Code>User</Code> and{" "}
                        <Code>UserKey</Code> includes <Code>&quot;role&quot;</Code> with
                        nothing else to update. That makes it the type for any
                        parameter that must be one of the keys:
                    </p>
                    <CodeBlock code={SORT_BY} lang="ts" />
                    <p>
                        With <Code>key: string</Code>, the typo would compile and sort
                        by <Code>undefined</Code>.
                    </p>
                </DocSection>

                <DocSection title="keyof typeof and index signatures">
                    <p>
                        <Code>keyof</Code> only works on types. For a constant object,
                        apply <Code>typeof</Code> first (First Types, two separate
                        worlds):
                    </p>
                    <CodeBlock code={KEYOF_TYPEOF} lang="ts" />
                    <p>
                        Read it right to left: <Code>typeof config</Code> gives the
                        value&apos;s type, and <Code>keyof</Code> its keys.{" "}
                        <Term>On an index signature you get the key type itself:</Term>
                    </p>
                    <CodeBlock code={INDEX_SIGNATURE} lang="ts" />
                    <p>
                        <Code>number</Code> is included because JavaScript turns number
                        keys into strings — <Code>obj[1]</Code> is{" "}
                        <Code>obj[&quot;1&quot;]</Code>.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · for…in and Object.keys give string, not keyof"
                    >
                        <p>
                            Looping over an object does not give you its{" "}
                            <Code>keyof</Code>:
                        </p>
                        <CodeBlock code={FOR_IN} lang="ts" />
                        <p>
                            This is deliberate: by structural typing (Assignability) an
                            object typed <Code>User</Code> can carry extra keys at
                            runtime, so TypeScript cannot promise only{" "}
                            <Code>&quot;id&quot; | &quot;name&quot; | &quot;email&quot;</Code>.
                            For an object you control,{" "}
                            <Code>Object.keys(user) as (keyof User)[]</Code> is one of the
                            accepted uses of <Code>as</Code> (Assignability, as overrides
                            the check).
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the type behind a key ---------- */}
            <PartHeading kicker="part 2">Indexed Access</PartHeading>
            <div>
                <DocSection title="reading a property type">
                    <p>
                        <Term>
                            <Code>T[K]</Code> reads the type of a value by its key
                        </Term>{" "}
                        — JavaScript&apos;s brackets, at the type level:
                    </p>
                    <CodeBlock code={PROPERTY_TYPE} lang="ts" />
                    <p>
                        The optional <Code>phone</Code> brings its{" "}
                        <Code>undefined</Code> along.{" "}
                        <Term>A union of keys gives a union of values:</Term>
                    </p>
                    <CodeBlock code={UNION_KEYS} lang="ts" />
                    <p>
                        <Code>T[keyof T]</Code> — &ldquo;any value of{" "}
                        <Code>T</Code>&rdquo; — is common in library types. Two rules:
                        brackets, never a dot; and the key must exist:
                    </p>
                    <CodeBlock code={BRACKETS_ONLY} lang="ts" />
                    <p>
                        The dot belongs to namespaces and values; a type is only ever
                        read with brackets.
                    </p>
                </DocSection>

                <DocSection title="nested and array lookups">
                    <p>
                        <Term>Lookups chain as deep as needed:</Term>
                    </p>
                    <CodeBlock code={NESTED} lang="ts" />
                    <p>
                        <Term>
                            <Code>[number]</Code> reads the element type.
                        </Term>{" "}
                        An array&apos;s keys are numbers, so indexing with{" "}
                        <Code>number</Code> means &ldquo;any element&rdquo;; a tuple has
                        a type per position:
                    </p>
                    <CodeBlock code={ARRAY_LOOKUP} lang="ts" />
                    <p>
                        <Code>roles</Code> is an array of a union, so its element type
                        is that union.
                    </p>
                </DocSection>

                <DocSection title="one source of truth">
                    <p>
                        <Term>Point at a piece of a type instead of rewriting it:</Term>
                    </p>
                    <CodeBlock code={POINT_AT} lang="ts" />
                    <p>
                        If <Code>id</Code> becomes a string one day, every{" "}
                        <Code>User[&quot;id&quot;]</Code> follows; a hand-written{" "}
                        <Code>id: number</Code> would stay silently wrong.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the key must be a type, not a variable"
                    >
                        <p>A constant holding the key name is still a value:</p>
                        <CodeBlock code={VARIABLE_KEY} lang="ts" />
                        <p>
                            Same rule as always: inside a type, values need{" "}
                            <Code>typeof</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — keys meet generics ---------- */}
            <PartHeading kicker="part 3">K extends keyof T</PartHeading>
            <div>
                <DocSection title="a key and its value type">
                    <p>
                        A generic plus <Code>keyof</Code> plus indexed access is{" "}
                        <Term>the pattern behind &ldquo;get a property by name&rdquo;</Term>:
                    </p>
                    <CodeBlock code={GET_PROP} lang="ts" />
                    <p>How to read it:</p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            <Code>T</Code> — the object&apos;s type, inferred from{" "}
                            <Code>user</Code>;
                        </li>
                        <li>
                            <Code>K extends keyof T</Code> — one of <Code>T</Code>&apos;s
                            keys, inferred from <Code>&quot;name&quot;</Code> as the
                            literal <Code>&quot;name&quot;</Code>;
                        </li>
                        <li>
                            <Code>T[K]</Code> — the type of exactly that property.
                        </li>
                    </ul>
                    <p>
                        Why does <Code>K</Code> need its own type parameter? Drop it and
                        type the key as <Code>keyof T</Code>:
                    </p>
                    <CodeBlock code={GET_LOOSE} lang="ts" />
                    <p>
                        The call still checks the key, but the result no longer knows
                        which one was asked for.
                    </p>

                    <Callout
                        severity="note"
                        label="note · K is what links the key to the result"
                    >
                        <p>
                            <Code>keyof T</Code> is the whole union, so the result is{" "}
                            <Code>T[keyof T]</Code>. <Code>K</Code> captures which key
                            was passed — it appears in the parameter and in the return,
                            so it passes the used-once rule (Generics Basics).
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="keys that drive values">
                    <p>
                        <Term>The value can depend on the key:</Term>
                    </p>
                    <CodeBlock code={SET_PROP} lang="ts" />
                    <p>
                        <Code>K</Code> is <Code>&quot;id&quot;</Code>, so{" "}
                        <Code>T[K]</Code> is <Code>number</Code>. A real use — pluck one
                        field from a list:
                    </p>
                    <CodeBlock code={PLUCK} lang="ts" />
                    <p>
                        One function, and each call returns an array of exactly the
                        field it named.
                    </p>

                    <Callout severity="tip" label="tip · you have used this pattern">
                        <p>
                            lodash&apos;s <Code>get</Code> and <Code>pick</Code>,
                            sortable table columns, and form libraries&apos;{" "}
                            <Code>register(&quot;email&quot;)</Code> are all{" "}
                            <Code>K extends keyof T</Code>.
                        </p>
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · a union key loosens the value check"
                    >
                        <p>
                            When <Code>K</Code> is a union of keys, <Code>T[K]</Code>{" "}
                            becomes the union of their value types and the key–value
                            link is lost:
                        </p>
                        <CodeBlock code={UNION_KEY} lang="ts" />
                        <p>
                            A known, deliberate trade-off. The pattern is safe with
                            literal keys; be careful when the key is a variable that may
                            hold several keys.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the constant is the source ---------- */}
            <PartHeading kicker="part 4">Deriving Types from Data</PartHeading>
            <div>
                <DocSection title="a union from an array">
                    <p>
                        <Term>Write the values once and derive the type</Term>, so a
                        runtime list and its type never drift. The recipe is{" "}
                        <Code>as const</Code> → <Code>typeof</Code> →{" "}
                        <Code>[number]</Code>:
                    </p>
                    <CodeBlock code={ROLES_UNION} lang="ts" />
                    <p>
                        Read it right to left: <Code>typeof ROLES</Code> is{" "}
                        <Code>
                            readonly [&quot;admin&quot;, &quot;editor&quot;, &quot;viewer&quot;]
                        </Code>
                        ; <Code>[number]</Code> is any element. Add{" "}
                        <Code>&quot;owner&quot;</Code> to the array and{" "}
                        <Code>Role</Code> follows.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · without as const the union collapses"
                    >
                        <p>
                            Without <Code>as const</Code> the array widens, and so does
                            everything derived from it:
                        </p>
                        <CodeBlock code={ROLES_WIDE} lang="ts" />
                        <p>
                            The type still compiles everywhere — it just stopped
                            meaning anything.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="keys and values from an object">
                    <p>
                        <Term>An object map gives both sides:</Term>
                    </p>
                    <CodeBlock code={STATUS_MAP} lang="ts" />
                    <p>
                        Keys stored in the database, labels shown in the UI — one object
                        drives both. For an array of objects, index twice:
                    </p>
                    <CodeBlock code={PLANS} lang="ts" />
                    <p>
                        <Code>[number]</Code> picks any plan, <Code>[&quot;id&quot;]</Code>{" "}
                        its id: the array renders the pricing page, and{" "}
                        <Code>PlanId</Code> types every function taking a plan.
                    </p>
                </DocSection>

                <DocSection title="one constant, two jobs">
                    <p>
                        <Term>The same constant does the runtime check</Term>, so a
                        guard for the derived <Code>Role</Code> is one line:
                    </p>
                    <CodeBlock code={IS_ROLE} lang="ts" />
                    <p>
                        The list that defines the type is the list that checks the
                        value — they cannot disagree.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · includes rejects a plain string"
                    >
                        <p>The obvious version, without the cast, does not compile:</p>
                        <CodeBlock code={INCLUDES_STRICT} lang="ts" />
                        <p>
                            The array&apos;s type is strict, so <Code>includes</Code>{" "}
                            wants a <Code>Role</Code> — exactly what is being checked.
                            Widen the array, not the value, to{" "}
                            <Code>readonly string[]</Code>: a safe <Code>as</Code>,
                            because it only makes the type wider.
                        </p>
                    </Callout>

                    <Callout
                        severity="tip"
                        label="tip · when to derive, when to write"
                    >
                        <p>
                            Derive when the values exist at runtime anyway — options,
                            config, constants. Write the type by hand when there is no
                            runtime list, such as the shape of an API response.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
