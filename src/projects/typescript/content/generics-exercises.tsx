import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";
import ExerciseMeta from "@/components/ui/exercise-meta";
import Reveal from "@/components/ui/reveal";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header —
// that is the explicit `sectionSeverity` prop, which no exercise carries. Most
// callouts sit inside a solution, but a hidden callout is still part of its
// section, so the rail shows it.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Generics Basics) ---
    // inline `trap · answering T instead of the result` + `note · never disappears in a union`
    "exercise-1-what-t-becomes": ["trap", "note"],
    // inline two traps (`a boolean callback cannot narrow`, `T on the key, not the result`)
    // + `tip · try/catch for invalid JSON`
    "exercise-2-useless-and-lying-generics": ["trap", "tip"],
    // inline two traps (`!value treats 0 as a failure`, `a union return type instead of a parameter`)
    // + `note · the failure passes through unchanged`
    "exercise-3-a-result-type": ["trap", "note"],
    // inline `trap · a counter next to a computed size` + `tip · find and some, not filter()[0]`
    // + `note · the copy is shallow`
    "exercise-4-a-registry": ["trap", "tip", "note"],

    // --- part 2 (Keys & Lookups) ---
    // inline `note · write unions with |, keys exactly`
    "exercise-5-read-the-lookups": ["note"],
    // inline `trap · T[keyof T] is every value at once` + `note · keyof T or K extends keyof T`
    "exercise-6-sort-and-group-by-key": ["trap", "note"],
    // inline `tip · why a guard when the type exists` + `note · find admits it may miss`
    "exercise-7-types-from-a-constant": ["tip", "note"],

    // --- part 3 (Mixed) ---
    // VISIBLE `danger · not solved yet` (outside the solution, see rule 4)
    // + `tip · return the unsubscribe function` + `note · K links the name to the payload`
    "exercise-8-a-typed-event-emitter": ["danger", "tip", "note"],
};

// Top-level divider between the parts of the page — one per source page, then
// "Mixed". Identical to the helper in foundations-exercises.tsx.
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

// The grid table foundations-exercises.tsx uses, copied unchanged.
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

// PAGE RULES — those of foundations-exercises.tsx, with one exception:
//
// 1. Each exercise is ONE DocSection titled "exercise N · <short name>", and
//    holds, in order: ExerciseMeta, the task (prose + code), then the Reveal
//    row — hint first, solution second.
// 2. Fragments follow the usual rules: introduced by the sentence above, read by
//    the sentence below, never touching; `// ❌ ` errors in plain words on the
//    line below, `// ✅` where a contrast helps, inferred types trailing.
// 3. Every fragment declares its language: ts.
// 4. Callouts live inside solutions only, and still count toward
//    SECTION_SEVERITIES (see above).
//    EXCEPTION — an exercise marked `unsolved` opens with a VISIBLE
//    `danger · not solved yet` callout, placed before ExerciseMeta.
// 5. One Reveal per exercise, given `hint` and `solution`: it draws the button
//    row and opens each panel below it (see the layout note in reveal.tsx).
// 6. Every task's example calls are fixed: a solution must make them work
//    exactly as written, including the ❌ lines that must fail to compile.

// ===================================================================
// part 1 — generics basics
// ===================================================================

const EX1_GIVEN = `function first<T>(items: T[]): T | undefined { return items[0]; }
function same<T>(a: T, b: T): T[] { return [a, b]; }
function wrap<T extends string>(value: T) { return { value }; }
function box<T>(value: T) { return { value }; }`;

const EX1_TASK = `const a = first([true, false]);
const b = first([]);
const c = first(["x", 1]);
const d = same("a", "b");
const e = wrap("dark");
const f = box("dark");
const g = new Map();
const h = first<number>([]);
const i = same(1, "2");`;

const EX2_HELPERS = `type User = { id: number; name: string };

function isUser(v: unknown): v is User {
    return typeof v === "object" && v !== null &&
        "id" in v && typeof v.id === "number" &&
        "name" in v && typeof v.name === "string";
}

const storage: Record<string, string> = {
    user: '{"id":1,"name":"sam"}',
    broken: '{"id":"x"}',
};`;

const EX2_TASK = `// 1. Logs every item.
function printAll<T>(items: T[]): void {
    items.forEach((item) => console.log(item));
}

// 2. Returns how many characters / elements something has.
function count<T extends { length: number }>(value: T): number {
    return value.length;
}

// 3. Reads a stored JSON value by key.
function load<T>(key: string): T {
    return JSON.parse(storage[key] ?? "null");
}

// 4. Returns the longer of two values.
function pickLonger<T extends { length: number }>(a: T, b: T): T {
    return a.length >= b.length ? a : b;
}`;

const EX2_EXPECTED = `printAll([1, "a"]);           // logs 1, then "a"
count("hello");               // 5
count([1, 2]);                // 2
load("user", isUser);         // { id: 1, name: "sam" } — typed User | null
load("broken", isUser);       // null — id is not a number
load("missing", isUser);      // null — no such key
pickLonger("sam", "alex");    // "alex" — typed string`;

const EX2_SOLUTION = `function printAll(items: unknown[]): void {
    items.forEach((item) => console.log(item));
}

function count(value: { length: number }): number {
    return value.length;
}

function load<T>(
    key: string,
    isT: (v: unknown) => v is T,
): T | null {
    try {
        const data: unknown = JSON.parse(storage[key] ?? "null");
        return isT(data) ? data : null;
    } catch {
        return null;   // invalid JSON
    }
}

// 4. keep — T is in both parameters and the return`;

const EX3_STEP2 = `parseNumber("42");    // { ok: true, value: 42 }
parseNumber("0");     // { ok: true, value: 0 }
parseNumber("abc");   // { ok: false, error: 'Not a number: "abc"' }
parseNumber("");      // { ok: false, error: 'Not a number: ""' }   ← Number("") is 0`;

const EX3_STEP3 = `unwrapOr(parseNumber("42"), 0);       // 42
unwrapOr(parseNumber("x"), 0);        // 0
unwrapOr(parseNumber("x"), "zero");   // ❌ must not compile`;

const EX3_STEP4 = `mapResult(parseNumber("21"), (n) => n * 2);
// { ok: true, value: 42 } → Result<number>
mapResult(parseNumber("21"), (n) => n.toFixed(1));
// { ok: true, value: "21.0" } → Result<string>
mapResult(parseNumber("x"), (n) => n * 2);
// { ok: false, error: 'Not a number: "x"' }`;

const EX3_SOLUTION = `type Result<T> =
    | { ok: true; value: T }
    | { ok: false; error: string };

function parseNumber(raw: string): Result<number> {
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) {
        return { ok: false, error: \`Not a number: "\${raw}"\` };
    }
    return { ok: true, value: n };
}

function unwrapOr<T>(result: Result<T>, fallback: T): T {
    return result.ok ? result.value : fallback;
}

function mapResult<T, U>(
    result: Result<T>,
    fn: (value: T) => U,
): Result<U> {
    return result.ok
        ? { ok: true, value: fn(result.value) }
        : result;
}`;

const EX4_TASK = `type Product = { id: string; name: string; price: number };

const products = new Registry<Product>();
products.add({ id: "p1", name: "Lamp", price: 40 });
products.add({ id: "p2", name: "Chair", price: 90 });

products.get("p1")?.price;    // 40 — typed number
products.get("p9");           // undefined
products.size;                // 2

products.add({ id: "p1", name: "Desk", price: 200 });
// throws "Duplicate id: p1"

products.remove("p2");        // true
products.remove("p2");        // false
products.size;                // 1

const list = products.all();
list.push({ id: "x", name: "X", price: 1 });
products.size;                // still 1

new Registry<number>();                      // ❌ must not compile
products.add({ id: "p3", name: "Desk" });    // ❌ must not compile — price missing
products.size = 5;                           // ❌ must not compile`;

const EX4_SOLUTION = `class Registry<T extends { id: string }> {
    #items: T[] = [];

    get size(): number {
        return this.#items.length;
    }

    add(item: T): void {
        if (this.#items.some((elm) => elm.id === item.id)) {
            throw new Error(\`Duplicate id: \${item.id}\`);
        }
        this.#items.push(item);
    }

    get(id: string): T | undefined {
        return this.#items.find((elm) => elm.id === id);
    }

    remove(id: string): boolean {
        const before = this.#items.length;
        this.#items = this.#items.filter((elm) => elm.id !== id);
        return this.#items.length < before;
    }

    all(): T[] {
        return [...this.#items];
    }
}`;

// ===================================================================
// part 2 — keys & lookups
// ===================================================================

const EX5_GIVEN = `type Product = {
    id: string;
    price: number;
    tags: string[];
    stock?: number;
    supplier: { name: string; country: "DE" | "FR" };
};

const SIZES = ["S", "M", "L"] as const;
const COLORS = ["red", "blue"];`;

const EX5_TASK = `type A = keyof Product;
type B = Product["price"];
type C = Product["stock"];
type D = Product["tags"][number];
type E = Product["supplier"]["country"];
type F = Product["id" | "price"];
type G = (typeof SIZES)[number];
type H = (typeof COLORS)[number];
type I = Product.price;`;

const EX6_GIVEN = `type Product = {
    id: string;
    name: string;
    price: number;
    category: "lamps" | "chairs";
};

const products: Product[] = [
    { id: "p1", name: "Lamp",      price: 40, category: "lamps" },
    { id: "p2", name: "Chair",     price: 90, category: "chairs" },
    { id: "p3", name: "Desk lamp", price: 25, category: "lamps" },
];`;

const EX6_STEP1 = `sortBy(products, "price").map((p) => p.id);    // ["p3", "p1", "p2"]
sortBy(products, "name").map((p) => p.name);   // ["Chair", "Desk lamp", "Lamp"]
products.map((p) => p.id);                     // ["p1", "p2", "p3"] — unchanged
sortBy(products, "color");                     // ❌ must not compile`;

const EX6_STEP2 = `const byCategory = groupBy(products, "category");
// Map<"lamps" | "chairs", Product[]>

byCategory.get("lamps")?.map((p) => p.id);   // ["p1", "p3"]
byCategory.get("chairs")?.length;            // 1
byCategory.size;                             // 2
byCategory.get("tables");                    // ❌ must not compile
groupBy(products, "price");                  // Map<number, Product[]>`;

const EX6_SOLUTION = `function sortBy<T>(items: T[], key: keyof T): T[] {
    return [...items].sort((a, b) =>
        a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
    );
}

function groupBy<T, K extends keyof T>(
    items: T[],
    key: K,
): Map<T[K], T[]> {
    const groups = new Map<T[K], T[]>();

    for (const item of items) {
        const value = item[key];
        const group = groups.get(value);

        if (group) group.push(item);
        else groups.set(value, [item]);
    }

    return groups;
}`;

const EX7_GIVEN = `const CURRENCIES = [
    { code: "EUR", symbol: "€" },
    { code: "USD", symbol: "$" },
    { code: "GBP", symbol: "£" },
];`;

const EX7_STEP2 = `isCurrencyCode("USD");   // true
isCurrencyCode("JPY");   // false
isCurrencyCode("eur");   // false — case matters`;

const EX7_STEP3 = `formatPrice(9.5, "EUR");   // "€9.50"
formatPrice(20, "GBP");    // "£20.00"
formatPrice(5, "JPY");     // ❌ must not compile`;

const EX7_STEP4 = `const raw: string = "USD";
formatPrice(3, raw);                            // ❌ must not compile — raw is any string
if (isCurrencyCode(raw)) formatPrice(3, raw);   // ✅ "$3.00"`;

const EX7_SOLUTION = `const CURRENCIES = [
    { code: "EUR", symbol: "€" },
    { code: "USD", symbol: "$" },
    { code: "GBP", symbol: "£" },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]["code"];

function isCurrencyCode(value: string): value is CurrencyCode {
    return CURRENCIES.some((c) => c.code === value);
}

function formatPrice(amount: number, code: CurrencyCode): string {
    const currency = CURRENCIES.find((c) => c.code === code);
    return \`\${currency?.symbol ?? ""}\${amount.toFixed(2)}\`;
}`;

// ===================================================================
// part 3 — mixed
// ===================================================================

const EX8_EVENTS = `type AppEvents = {
    login: { userId: string };
    purchase: { userId: string; amount: number };
    logout: { userId: string };
};`;

const EX8_STORAGE = `#handlers: { [K in keyof E]?: Array<(payload: E[K]) => void> } = {};`;

const EX8_TASK = `const events = new Emitter<AppEvents>();
const log: string[] = [];

events.on("login", (p) => log.push(\`login \${p.userId}\`));
const unsubscribe = events.on("purchase", (p) =>
    log.push(\`purchase \${p.amount.toFixed(2)}\`),
);

events.emit("login", { userId: "u1" });
events.emit("purchase", { userId: "u1", amount: 20 });
unsubscribe();
events.emit("purchase", { userId: "u1", amount: 5 });   // no handler left
events.emit("logout", { userId: "u1" });                // no handler at all

log;   // ["login u1", "purchase 20.00"]

events.emit("signup", { userId: "u1" });     // ❌ unknown event
events.emit("purchase", { userId: "u1" });   // ❌ amount missing
events.on("login", (p) => p.amount);         // ❌ a login payload has no amount`;

const EX8_SOLUTION = `class Emitter<E> {
    #handlers: { [K in keyof E]?: Array<(payload: E[K]) => void> } = {};

    on<K extends keyof E>(
        event: K,
        handler: (payload: E[K]) => void,
    ): () => void {
        const list = this.#handlers[event] ?? [];
        list.push(handler);
        this.#handlers[event] = list;

        return () => {
            this.#handlers[event] =
                this.#handlers[event]?.filter((h) => h !== handler);
        };
    }

    emit<K extends keyof E>(event: K, payload: E[K]): void {
        this.#handlers[event]?.forEach((handler) => handler(payload));
    }
}`;

export function GenericsExercisesDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the chapter pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Eight exercises covering Generics Basics and Keys &amp; Lookups,
                    easy to hard inside each part, with a final mixed exercise that
                    needs both pages. Most of them ask you to <Term>write code</Term>{" "}
                    — solve them in an editor with <Code>strict: true</Code> before
                    looking.
                </p>
                <p>
                    The example calls in each task are fixed: your code has to make
                    them work exactly as written, including the <Code>{"// ❌"}</Code>{" "}
                    lines that must fail to compile. Hints and full solutions sit
                    behind their buttons.
                </p>
            </div>

            {/* ---------- part 1 — Generics Basics ---------- */}
            <PartHeading kicker="part 1">Generics Basics</PartHeading>
            <div>
                <DocSection title="exercise 1 · what T becomes">
                    <ExerciseMeta difficulty="easy" kind="predict" source="Generics Basics" />
                    <p>Given these four functions:</p>
                    <CodeBlock code={EX1_GIVEN} lang="ts" />
                    <p>
                        write the type of each <Term>variable</Term> — the result, not
                        just <Code>T</Code>. One line does not compile: say which, and
                        why.
                    </p>
                    <CodeBlock code={EX1_TASK} lang="ts" />
                    <p>
                        Answer in the form <Code>a: …</Code>, <Code>b: …</Code>
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Work out <Code>T</Code> first, then put it into the
                                    declared return type.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>Each variable, with the reason:</p>
                                <GridTable
                                    cols="grid-cols-[max-content_1fr_1fr]"
                                    head={["var", "type", "why"]}
                                    rows={[
                                        ["a", "boolean | undefined", "T = boolean, returned as T | undefined"],
                                        ["b", "undefined", "T = never; never | undefined is just undefined"],
                                        ["c", "string | number | undefined", "T = the array's own type"],
                                        ["d", "string[]", "same returns T[]"],
                                        ["e", '{ value: "dark" }', "extends string keeps the literal"],
                                        ["f", "{ value: string }", "no constraint — the literal widens"],
                                        ["g", "Map<any, any>", "nothing to infer — the hidden any"],
                                        ["h", "number | undefined", "T written explicitly"],
                                        ["i", "❌", 'T is taken as number from the first argument — "2" is rejected'],
                                    ]}
                                />
                                <Callout
                                    severity="trap"
                                    label="trap · answering T instead of the result"
                                >
                                    <p>
                                        <Code>T</Code> is only the hole — the variable gets
                                        the declared return type with <Code>T</Code>{" "}
                                        filled in: <Code>T | undefined</Code>,{" "}
                                        <Code>T[]</Code>, <Code>{"{ value: T }"}</Code>.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · never disappears in a union"
                                >
                                    <p>
                                        <Code>never | undefined</Code> is{" "}
                                        <Code>undefined</Code>. Literal types are written
                                        with quotes: <Code>{'"dark"'}</Code>, not{" "}
                                        <Code>dark</Code>.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 2 · useless and lying generics">
                    <ExerciseMeta difficulty="easy" kind="fix" source="Generics Basics" />
                    <p>The four functions below share these helpers:</p>
                    <CodeBlock code={EX2_HELPERS} lang="ts" />
                    <p>
                        For each function, decide: <Term>keep</Term> (the generic is
                        justified) or <Term>change</Term> (useless or lying) — and
                        write the fixed version:
                    </p>
                    <CodeBlock code={EX2_TASK} lang="ts" />
                    <p>
                        Function 3 needs a NEW signature with a second parameter — the
                        expected calls below already use it. After the fixes:
                    </p>
                    <CodeBlock code={EX2_EXPECTED} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>, no <Code>as</Code>;{" "}
                        <Code>load</Code> must check the data, not trust it. Keep the
                        function names.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Count how often <Code>T</Code> appears. Once means
                                    useless; only in the return means a hidden{" "}
                                    <Code>as</Code>.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>Three changed, one kept:</p>
                                <CodeBlock code={EX2_SOLUTION} lang="ts" />
                                <p>
                                    1 and 2 used <Code>T</Code> once (the used-once rule),
                                    so <Code>unknown</Code> and the constraint itself say
                                    the same thing honestly. 3 had <Code>T</Code> only in
                                    the return — a hidden <Code>as</Code>; the fix takes{" "}
                                    <Code>T</Code> from the guard, so <Code>T</Code>{" "}
                                    appears twice and the value is checked. 4 links input
                                    to output.
                                </p>
                                <Callout
                                    severity="trap"
                                    label="trap · a boolean callback cannot narrow"
                                >
                                    <p>
                                        With <Code>{"isT: (v: unknown) => boolean"}</Code>,{" "}
                                        <Code>return data</Code> compiles only because{" "}
                                        <Code>JSON.parse</Code> returns <Code>any</Code> —
                                        store it as <Code>unknown</Code> and the compiler
                                        rejects it. The parameter must be a real guard (
                                        <Code>v is T</Code>).
                                    </p>
                                </Callout>
                                <Callout
                                    severity="trap"
                                    label="trap · T on the key, not the result"
                                >
                                    <p>
                                        A common mistake is writing{" "}
                                        <Code>T extends keyof typeof storage</Code>, which
                                        puts the generic on the key — for a{" "}
                                        <Code>{"Record<string, string>"}</Code> that is just{" "}
                                        <Code>string</Code>, and the result stays
                                        hardcoded. <Code>T</Code> belongs to what comes
                                        back.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="tip"
                                    label="tip · try/catch for invalid JSON"
                                >
                                    <p>
                                        <Code>JSON.parse</Code> throws on malformed text;
                                        catching it makes <Code>load</Code> return{" "}
                                        <Code>null</Code> for every bad input.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 3 · a Result type">
                    <ExerciseMeta difficulty="medium" kind="write" source="Generics Basics" />
                    <p>
                        1. Write <Code>{"Result<T>"}</Code>: a discriminated union on{" "}
                        <Code>ok</Code> — success{" "}
                        <Code>{"{ ok: true; value: T }"}</Code>, failure{" "}
                        <Code>{"{ ok: false; error: string }"}</Code>.
                    </p>
                    <p>
                        2. Write <Code>{"parseNumber(raw: string): Result<number>"}</Code>
                        . It fails when <Code>raw</Code> is empty (or only spaces) or
                        not a number, with the error text{" "}
                        <Code>{'Not a number: "<raw>"'}</Code>:
                    </p>
                    <CodeBlock code={EX3_STEP2} lang="ts" />
                    <p>
                        3. Write <Code>unwrapOr(result, fallback)</Code>: the value on
                        success, else the fallback, which must have the same type as
                        the value:
                    </p>
                    <CodeBlock code={EX3_STEP3} lang="ts" />
                    <p>
                        4. Write <Code>mapResult(result, fn)</Code>: on success apply{" "}
                        <Code>fn</Code> to the value and return a new success; on
                        failure return the same error. Input and output must both be
                        generic:
                    </p>
                    <CodeBlock code={EX3_STEP4} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>, no <Code>as</Code>; do not annotate{" "}
                        <Code>n</Code>; the calls stay exactly as written.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    <Code>unwrapOr</Code> needs one type parameter;{" "}
                                    <Code>mapResult</Code> needs two — one for what goes
                                    in, one for what the callback returns.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>All four steps:</p>
                                <CodeBlock code={EX3_SOLUTION} lang="ts" />
                                <p>
                                    <Code>unwrapOr</Code>&apos;s single <Code>T</Code>{" "}
                                    is read from the result first, so a fallback of
                                    another type is rejected. <Code>mapResult</Code>{" "}
                                    reads <Code>T</Code> from the result and{" "}
                                    <Code>U</Code> from what the callback returns.
                                </p>
                                <Callout
                                    severity="trap"
                                    label="trap · !value treats 0 as a failure"
                                >
                                    <p>
                                        A truthiness check rejects the valid number 0, and{" "}
                                        <Code>{'Number("")'}</Code> is 0, so the empty
                                        string must be checked on <Code>raw</Code> itself.
                                        Check the two failure cases separately: empty
                                        text, and <Code>NaN</Code>.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="trap"
                                    label="trap · a union return type instead of a parameter"
                                >
                                    <p>
                                        Typing <Code>fn</Code> as{" "}
                                        <Code>{"(n: number) => number | string"}</Code>{" "}
                                        returns <Code>{"Result<number | string>"}</Code>{" "}
                                        for every call — <Code>U</Code> must be a type
                                        parameter so each call gets exactly what its
                                        callback returns.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · the failure passes through unchanged"
                                >
                                    <p>
                                        In the else branch <Code>result</Code> is narrowed
                                        to <Code>{"{ ok: false; error: string }"}</Code>,
                                        which is already a valid{" "}
                                        <Code>{"Result<U>"}</Code> for any <Code>U</Code> —
                                        no need to rebuild it.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 4 · a registry">
                    <ExerciseMeta difficulty="medium" kind="write" source="Generics Basics" />
                    <p>
                        Write <Code>{"class Registry<T>"}</Code> that stores items by
                        id and only accepts types with <Code>id: string</Code>. Store
                        the items in a private <Code>#</Code> field you create — an
                        array or a <Code>{"Map<string, T>"}</Code>. Its members:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["member", "behaviour"]}
                        rows={[
                            ["add(item)", 'stores it; throws Error("Duplicate id: <id>") if the id exists'],
                            ["get(id)", "the item, or undefined"],
                            ["remove(id)", "true if something was removed, false otherwise"],
                            ["size", "a getter — readable, not assignable — always the number of stored items"],
                            ["all()", "an array of all items; changing that array must not change the registry"],
                        ]}
                    />
                    <p>It must make these calls behave exactly as commented:</p>
                    <CodeBlock code={EX4_TASK} lang="ts" />
                    <p>
                        The last three lines are part of the task: the class must
                        reject them.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    The constraint goes on the class&apos;s type
                                    parameter. <Code>size</Code> is computed from the
                                    storage; <Code>all()</Code> returns a copy.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>With an array as the storage:</p>
                                <CodeBlock code={EX4_SOLUTION} lang="ts" />
                                <p>
                                    <Code>{"T extends { id: string }"}</Code> rejects{" "}
                                    <Code>{"Registry<number>"}</Code>, a getter with no
                                    setter makes <Code>size</Code> read-only, and{" "}
                                    <Code>T</Code> stays the full <Code>Product</Code>, so{" "}
                                    <Code>price</Code> is required and typed.
                                </p>
                                <Callout
                                    severity="trap"
                                    label="trap · a counter next to a computed size"
                                >
                                    <p>
                                        A separate <Code>#size</Code> field updated in{" "}
                                        <Code>add</Code> and <Code>remove</Code> is state
                                        that can drift from the real storage — and is dead
                                        code when the getter already returns{" "}
                                        <Code>#items.length</Code>.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="tip"
                                    label="tip · find and some, not filter()[0]"
                                >
                                    <p>
                                        <Code>find</Code> returns the first match (or{" "}
                                        <Code>undefined</Code>), <Code>some</Code> answers
                                        &ldquo;does one exist?&rdquo; — both stop early,
                                        both read as the intent, and{" "}
                                        <Code>Array.isArray</Code> on a{" "}
                                        <Code>filter</Code> result is always true.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · the copy is shallow"
                                >
                                    <p>
                                        <Code>[...this.#items]</Code> is a new array, so
                                        pushing into it is harmless — but the items are the
                                        same objects; <Code>list[0].price = 0</Code> would
                                        still change the stored product.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 2 — Keys & Lookups ---------- */}
            <PartHeading kicker="part 2">Keys &amp; Lookups</PartHeading>
            <div>
                <DocSection title="exercise 5 · read the lookups">
                    <ExerciseMeta difficulty="easy" kind="predict" source="Keys & Lookups" />
                    <p>Given a product type and two constants:</p>
                    <CodeBlock code={EX5_GIVEN} lang="ts" />
                    <p>
                        write what each alias resolves to. One line does not compile:
                        say which, and why. Write <Code>keyof</Code> as the full union.
                    </p>
                    <CodeBlock code={EX5_TASK} lang="ts" />
                    <p>
                        Answer in the form <Code>A: …</Code>, <Code>B: …</Code>
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Optional adds <Code>undefined</Code>;{" "}
                                    <Code>[number]</Code> is any element;{" "}
                                    <Code>as const</Code> decides whether literals
                                    survive.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>Each alias resolved:</p>
                                <GridTable
                                    cols="grid-cols-[max-content_1fr]"
                                    head={["alias", "type"]}
                                    rows={[
                                        ["A", '"id" | "price" | "tags" | "stock" | "supplier"'],
                                        ["B", "number"],
                                        ["C", "number | undefined"],
                                        ["D", "string"],
                                        ["E", '"DE" | "FR"'],
                                        ["F", "string | number"],
                                        ["G", '"S" | "M" | "L"'],
                                        ["H", "string — no as const, so the array is string[]"],
                                        ["I", '❌ Product is a type, not a namespace — write Product["price"]'],
                                    ]}
                                />
                                <Callout
                                    severity="note"
                                    label="note · write unions with |, keys exactly"
                                >
                                    <p>
                                        <Code>{'"S" | "M" | "L"'}</Code>, not{" "}
                                        <Code>{'"S", "M", "L"'}</Code> — and a misspelled
                                        key in a union is simply a different, wrong key.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 6 · sort and group by key">
                    <ExerciseMeta difficulty="medium" kind="write" source="Keys & Lookups" />
                    <p>
                        Both steps work on this list. The sorting and grouping
                        algorithm is not the point — focus on the signatures.
                    </p>
                    <CodeBlock code={EX6_GIVEN} lang="ts" />
                    <p>
                        1. <Code>sortBy(items, key)</Code>: a NEW array sorted ascending
                        by <Code>key</Code>, for any item type; <Code>key</Code> must be
                        one of the item&apos;s keys:
                    </p>
                    <CodeBlock code={EX6_STEP1} lang="ts" />
                    <p>
                        2. <Code>groupBy(items, key)</Code>: a <Code>Map</Code> from
                        each value of that key to the items having it; the{" "}
                        <Code>Map</Code>&apos;s key type must be that property&apos;s
                        type:
                    </p>
                    <CodeBlock code={EX6_STEP2} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>, no <Code>as</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Does the result depend on WHICH key was passed? If
                                    yes, the key needs its own type parameter.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>Both functions:</p>
                                <CodeBlock code={EX6_SOLUTION} lang="ts" />
                                <p>
                                    <Code>sortBy</Code> takes <Code>keyof T</Code>;{" "}
                                    <Code>groupBy</Code> captures the key as{" "}
                                    <Code>K</Code> so the <Code>Map</Code> can be keyed by{" "}
                                    <Code>T[K]</Code>.
                                </p>
                                <Callout
                                    severity="note"
                                    label="note · keyof T or K extends keyof T"
                                >
                                    <p>
                                        <Code>sortBy</Code> returns <Code>T[]</Code>{" "}
                                        whatever the key, so a separate <Code>K</Code>{" "}
                                        would appear once — <Code>keyof T</Code> is enough.{" "}
                                        <Code>groupBy</Code>&apos;s result type depends on
                                        the key, so <Code>K</Code> is required.{" "}
                                        <Code>[...items]</Code> copies first because{" "}
                                        <Code>sort</Code> mutates.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="trap"
                                    label="trap · T[keyof T] is every value at once"
                                >
                                    <p>
                                        Typing the Map as{" "}
                                        <Code>{"Map<T[keyof T], T[]>"}</Code> gives{" "}
                                        <Code>{"Map<string | number, Product[]>"}</Code> —{" "}
                                        <Code>{'get("tables")'}</Code> then compiles. Only{" "}
                                        <Code>T[K]</Code> keeps the exact property type.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 7 · types from a constant">
                    <ExerciseMeta difficulty="medium" kind="write" source="Keys & Lookups" />
                    <p>
                        Start from this constant. You may change how it is declared,
                        but keep the data exactly the same — do not add currencies.
                    </p>
                    <CodeBlock code={EX7_GIVEN} lang="ts" />
                    <p>
                        1. <Code>{'type CurrencyCode = "EUR" | "USD" | "GBP"'}</Code>,
                        derived from <Code>CURRENCIES</Code>: if a currency were added
                        to the array later, the type must follow on its own.
                    </p>
                    <p>
                        2. <Code>isCurrencyCode(value: string)</Code> — a type guard
                        checking against <Code>CURRENCIES</Code> at runtime:
                    </p>
                    <CodeBlock code={EX7_STEP2} lang="ts" />
                    <p>
                        3.{" "}
                        <Code>formatPrice(amount: number, code: CurrencyCode): string</Code>{" "}
                        — symbol + amount with 2 decimals, symbol taken from{" "}
                        <Code>CURRENCIES</Code>:
                    </p>
                    <CodeBlock code={EX7_STEP3} lang="ts" />
                    <p>4. And with a value that is only known to be a string:</p>
                    <CodeBlock code={EX7_STEP4} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>; no <Code>as</Code> except{" "}
                        <Code>as const</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    <Code>as const</Code>, then <Code>typeof</Code>, then
                                    index twice. The guard and <Code>formatPrice</Code>{" "}
                                    both read the array.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>One constant drives the type, the guard and the lookup:</p>
                                <CodeBlock code={EX7_SOLUTION} lang="ts" />
                                <p>
                                    <Code>[number]</Code> picks any currency,{" "}
                                    <Code>{'["code"]'}</Code> its code — the union only
                                    survives because of <Code>as const</Code>.
                                </p>
                                <Callout
                                    severity="tip"
                                    label="tip · why a guard when the type exists"
                                >
                                    <p>
                                        <Code>CurrencyCode</Code> only exists at compile
                                        time; a string from a URL, a form or an API is just{" "}
                                        <Code>string</Code>. The guard is the runtime check
                                        that turns it into a <Code>CurrencyCode</Code> — and
                                        because it reads <Code>CURRENCIES</Code>, a new
                                        currency is accepted automatically.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · find admits it may miss"
                                >
                                    <p>
                                        <Code>find</Code> returns{" "}
                                        <Code>… | undefined</Code>, so the compiler makes
                                        &ldquo;not found&rdquo; visible;{" "}
                                        <Code>filter(...)[0]</Code> is typed as if the
                                        element always exists. Also:{" "}
                                        <Code>amount.toFixed(2)</Code>, not{" "}
                                        <Code>amount</Code> — 9.5 must print as 9.50.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — Mixed ---------- */}
            <PartHeading kicker="part 3">Mixed</PartHeading>
            <div>
                <DocSection title="exercise 8 · a typed event emitter">
                    {/* Rule 4's exception: visible, ahead of the meta row. */}
                    <Callout severity="danger" label="danger · not solved yet">
                        <p>
                            Open exercise — come back to it and solve it before reading
                            the solution.
                        </p>
                    </Callout>
                    <ExerciseMeta
                        difficulty="hard"
                        kind="write"
                        source="Generics Basics, Keys & Lookups"
                        unsolved
                    />
                    <p>
                        An emitter lets code subscribe to named events and emit them
                        with a payload. The types must make it impossible to emit an
                        unknown event, send the wrong payload, or read a field the
                        event does not have. The events of this app:
                    </p>
                    <CodeBlock code={EX8_EVENTS} lang="ts" />
                    <p>
                        Write <Code>{"class Emitter<E>"}</Code>, where <Code>E</Code> is
                        an events map like <Code>AppEvents</Code>: event name → payload
                        type. The storage is given — use it exactly as is:
                    </p>
                    <CodeBlock code={EX8_STORAGE} lang="ts" />
                    <p>
                        It is a mapped type, covered on a later page; read it as
                        &ldquo;for each event <Code>K</Code>, an optional list of
                        handlers taking <Code>E[K]</Code>&rdquo;. The two methods:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["method", "behaviour"]}
                        rows={[
                            ["on(event, handler)", "adds the handler to that event's list; returns a function that removes this handler again"],
                            ["emit(event, payload)", "calls every handler of that event with the payload; nothing if none"],
                        ]}
                    />
                    <p>The calls it must support, and the three it must reject:</p>
                    <CodeBlock code={EX8_TASK} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>, no <Code>as</Code>; do not annotate{" "}
                        <Code>p</Code>. Start with the signatures of <Code>on</Code> and{" "}
                        <Code>emit</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Both methods take the same{" "}
                                    <Code>{"<K extends keyof E>"}</Code>; the payload and
                                    the handler&apos;s parameter are both{" "}
                                    <Code>E[K]</Code>.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>Each method gets its own key parameter:</p>
                                <CodeBlock code={EX8_SOLUTION} lang="ts" />
                                <p>
                                    <Code>this.#handlers[event]</Code> is that event&apos;s
                                    list or <Code>undefined</Code>, so <Code>on</Code>{" "}
                                    starts an empty one when needed, and{" "}
                                    <Code>?.</Code> lets <Code>emit</Code> do nothing for
                                    an event nobody listens to.
                                </p>
                                <Callout
                                    severity="note"
                                    label="note · K links the name to the payload"
                                >
                                    <p>
                                        <Code>K</Code> is inferred from the event-name
                                        literal, so <Code>p</Code> in a handler is exactly
                                        that event&apos;s payload — the same pattern as{" "}
                                        <Code>getProp</Code>, applied to a method.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="tip"
                                    label="tip · return the unsubscribe function"
                                >
                                    <p>
                                        The returned arrow closes over <Code>event</Code>{" "}
                                        and <Code>handler</Code>, so the caller never needs
                                        a separate <Code>off(event, handler)</Code> method.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>
        </>
    );
}
