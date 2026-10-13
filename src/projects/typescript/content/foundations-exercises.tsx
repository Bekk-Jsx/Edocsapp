import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";
import ExerciseMeta from "@/components/ui/exercise-meta";
import Reveal from "@/components/ui/reveal";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header —
// that is the explicit `sectionSeverity` prop, which no exercise carries. The
// callouts all sit inside a solution, but a hidden callout is still part of its
// section, so the rail shows it.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (First Types) ---
    // inline `note · getting the narrow version`
    "exercise-1-inferred-types": ["note"],
    // inline `tip · a Record needs no branching`
    "exercise-2-exhaustive-sizes": ["tip"],
    // "exercise-3-labels-from-unknown" has no callout, so it has no entry.

    // --- part 2 (Objects & Aliases) ---
    // inline `note · if (p.discount) also works here`
    "exercise-4-product-fixes": ["note"],
    // inline `trap · a missing key reads as a number`
    "exercise-5-stock-limits": ["trap"],

    // --- part 3 (Functions) ---
    // inline `trap · reordering parameters changes every call`
    "exercise-6-three-signatures": ["trap"],
    // inline `tip · let the slot type the parameters` + `note · the filter narrows on its own`
    "exercise-7-validators": ["tip", "note"],

    // --- part 4 (Unions & Narrowing) ---
    // inline `trap · a fallback in the default hides bad data` + `note · a const directly in a case`
    "exercise-8-payment-methods": ["trap", "note"],
    // inline two traps (`a boolean guard narrows nothing`, `Array.isArray on unknown hides an any`)
    // + `tip · shorter and clearer` + `note · why "number" and "id" are in quotes`
    "exercise-9-a-user-guard": ["trap", "tip", "note"],

    // --- part 5 (Assignability) ---
    // inline `note · void hides the value, it does not remove it`
    "exercise-10-what-fits": ["note"],

    // --- part 6 (Classes) ---
    // inline `trap · a readonly field cannot hold a changing balance`
    // + `tip · when a static factory beats new` + `note · #balance is not balance`
    "exercise-11-a-bank-account": ["trap", "tip", "note"],
    // inline `note · override on an abstract method is optional`
    "exercise-12-notifiers": ["note"],

    // --- part 7 (Mixed) ---
    // inline two traps (`countByType(): object loses the keys`, `JSON.parse hides an any`)
    // + two notes (`returning the private array breaks privacy`, `check at the boundary…`)
    "exercise-13-an-event-log": ["trap", "note"],
};

// Top-level divider between the parts of the page — one per source page, then
// "Mixed". Identical to the helper in classes.tsx.
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

// The grid table classes.tsx uses, copied unchanged.
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

// PAGE RULES — those of classes.tsx, adapted to exercises:
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
// 5. One Reveal per exercise, given `hint` and `solution`: it draws the button
//    row and opens each panel below it (see the layout note in reveal.tsx).

// ===================================================================
// part 1 — first types
// ===================================================================

const EX1_TASK = `let a = "hello";
const b = "hello";
let c = [];
const d = { mode: "dark" };
const e = ["sam", 42];`;

const EX1_SOLUTION = `let a = "hello";              // string
const b = "hello";            // "hello"
let c = [];                   // any[]
const d = { mode: "dark" };   // { mode: string }
const e = ["sam", 42];        // (string | number)[]`;

const EX2_IF = `type Size = "sm" | "md" | "lg";

function toPixels(size: Size): number {
    if (size === "sm") return 12;
    if (size === "md") return 16;
    if (size === "lg") return 20;

    const unhandled: never = size;   // add "xl" → ❌ "xl" is not assignable to never
    return unhandled;
}`;

const EX2_SWITCH = `function toPixels(size: Size): number {
    switch (size) {
        case "sm": return 12;
        case "md": return 16;
        case "lg": return 20;
        default: {
            const unhandled: never = size;
            return unhandled;
        }
    }
}`;

const EX2_RECORD = `const PIXELS: Record<Size, number> = { sm: 12, md: 16, lg: 20 };
const toPixels = (size: Size) => PIXELS[size];`;

const EX3_SOLUTION = `function toLabel(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toFixed(2);
    if (typeof value === "boolean") return value ? "yes" : "no";
    return "unknown";
}`;

// ===================================================================
// part 2 — objects & aliases
// ===================================================================

const EX4_TASK = `type Product = {
    id: string;
    name: string;
    price: number;
    discount?: number;   // percent, e.g. 10
};

function finalPrice(p: Product) {
    return p.price - (p.price * p.discount) / 100;
}

const lamp: Product = { id: "p1", name: "Lamp", price: 40, dicount: 10 };

lamp.id = "p2";   // an id should never change`;

const EX4_SOLUTION = `type Product = {
    readonly id: string;
    name: string;
    price: number;
    discount?: number;
};

function finalPrice(p: Product) {
    const discount = p.discount ?? 0;   // missing → 0
    return p.price - (p.price * discount) / 100;
}

const lamp: Product = { id: "p1", name: "Lamp", price: 40, discount: 10 };`;

const EX5_CATEGORY = `const a: Category = "lamps";    // ✅
const c: Category = "sofas";
// ❌ "sofas" is not one of the three categories`;

const EX5_MAX_USAGE = `MAX_STOCK.chairs;      // 10
MAX_STOCK[category];   // look up with a Category value`;

const EX5_STOCK = `const stock: Stock = { p1: 4, p7: 12 };`;

const EX5_SIGNATURE = `function canAdd(
    stock: Stock,
    id: string,
    category: Category,
    amount: number,
): boolean`;

const EX5_CALLS = `canAdd(stock, "p1", "chairs", 5);   // true  — 4 + 5 = 9, max 10
canAdd(stock, "p1", "chairs", 7);   // false — 4 + 7 = 11
canAdd(stock, "p9", "tables", 5);   // true  — p9 missing, so 0 + 5 = 5, max 5
canAdd(stock, "p7", "lamps", 9);    // false — 12 + 9 = 21`;

const EX5_SOLUTION = `type Category = "lamps" | "chairs" | "tables";

const MAX_STOCK: Record<Category, number> = { lamps: 20, chairs: 10, tables: 5 };

type Stock = Record<string, number>;

function canAdd(
    stock: Stock,
    id: string,
    category: Category,
    amount: number,
): boolean {
    const current = stock[id] ?? 0;   // a missing id counts as 0
    return current + amount <= MAX_STOCK[category];
}`;

const EX5_NAN = `stock["p9"] + 5;   // compiles — NaN at runtime, and NaN <= 5 is false`;

// ===================================================================
// part 3 — functions
// ===================================================================

const EX6_TASK = `// 1. Joins a name. The middle name is optional.
//    formatName("Ada", undefined, "Lovelace") → "Ada Lovelace"
//    formatName("Ada", "King", "Lovelace")     → "Ada King Lovelace"
function formatName(first: string, middle?: string, last: string) {
    return middle ? \`\${first} \${middle} \${last}\` : \`\${first} \${last}\`;
}

// 2. Greets someone. The greeting defaults to "Hello".
//    greet("Sam") → "Hello, Sam"     greet("Sam", "Hi") → "Hi, Sam"
function greet(name: string, greeting?: string = "Hello") {
    return \`\${greeting}, \${name}\`;
}

// 3. Adds any number of prices and appends a currency.
//    total("EUR", 2, 3, 5) → "10 EUR"
function total(...prices: number[], currency: string) {
    return \`\${prices.reduce((a, b) => a + b, 0)} \${currency}\`;
}`;

const EX6_SOLUTION = `function formatName(first: string, middle: string | undefined, last: string) {
    return middle ? \`\${first} \${middle} \${last}\` : \`\${first} \${last}\`;
}

function greet(name: string, greeting = "Hello") {
    return \`\${greeting}, \${name}\`;
}

function total(currency: string, ...prices: number[]) {
    return \`\${prices.reduce((a, b) => a + b, 0)} \${currency}\`;
}`;

const EX7_REQUIRED = `required("");      // "Required"
required("sam");   // null`;

const EX7_MIN_LENGTH = `const atLeast3 = minLength(3);
atLeast3("ab");    // "Too short"
atLeast3("abc");   // null`;

const EX7_RUN = `runValidators("", required, minLength(3));      // ["Required", "Too short"]
runValidators("ab", required, minLength(3));    // ["Too short"]
runValidators("sam", required, minLength(3));   // []`;

const EX7_SOLUTION = `type Validator = (value: string) => string | null;

const required: Validator = (value) => (value === "" ? "Required" : null);

function minLength(min: number): Validator {
    return (value) => (value.length < min ? "Too short" : null);
}

function runValidators(value: string, ...validators: Validator[]): string[] {
    return validators
        .map((validate) => validate(value))
        .filter((error) => error !== null);
}`;

// ===================================================================
// part 4 — unions & narrowing
// ===================================================================

const EX8_CALLS = `describe({ kind: "card", last4: "4242" });              // "Card ending in 4242"
describe({ kind: "paypal", email: "sam@x.com" });       // "PayPal (sam@x.com)"
describe({ kind: "bank", iban: "DE89370400440532" });   // "Bank transfer"`;

const EX8_SOLUTION = `type Payment =
    | { kind: "card"; last4: string }
    | { kind: "paypal"; email: string }
    | { kind: "bank"; iban: string };

function assertNever(value: never): never {
    throw new Error(\`Unhandled payment: \${JSON.stringify(value)}\`);
}

function describe(p: Payment): string {
    switch (p.kind) {
        case "card":
            return \`Card ending in \${p.last4}\`;
        case "paypal":
            return \`PayPal (\${p.email})\`;
        case "bank":
            return "Bank transfer";
        default:
            return assertNever(p);   // compile-time check + runtime throw
    }
}`;

const EX9_TYPE = `type User = { id: number; name: string; tags: string[] };`;

const EX9_IS_USER_CALLS = `isUser({ id: 1, name: "sam", tags: ["admin"] });   // true
isUser({ id: 1, name: "sam", tags: [] });          // true  — an empty list is fine
isUser({ id: "1", name: "sam", tags: [] });        // false — id is a string
isUser({ id: 1, name: "sam", tags: [42] });        // false — a tag is not a string
isUser(null);                                      // false`;

const EX9_LOAD_CALLS = `loadUsers([{ id: 1, name: "sam", tags: [] }, { id: "x" }, 42]);
// [{ id: 1, name: "sam", tags: [] }]

loadUsers("not an array");
// []`;

const EX9_SOLUTION = `function isUser(value: unknown): value is User {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value && typeof value.id === "number" &&
        "name" in value && typeof value.name === "string" &&
        "tags" in value && Array.isArray(value.tags) &&
        value.tags.every((tag: unknown) => typeof tag === "string")
    );
}

function loadUsers(data: unknown): User[] {
    if (!Array.isArray(data)) return [];
    const items: unknown[] = data;   // close the any[] hole
    return items.filter(isUser);     // ✅ User[] — the guard does the narrowing
}`;

const EX9_BOOLEAN_GUARD = `function loadUsers(data: unknown): User[] {
    if (Array.isArray(data)) {
        const items: unknown[] = data;
        return items.filter((x) => isBooleanUser(x));
        // ❌ unknown[] is not User[] — a boolean guard narrows nothing
    }
    return [];
}`;

const EX9_TYPEOF_TYPE = `if (typeof value === number) {}
// ❌ number only exists as a type — it is gone at runtime`;

const EX9_IN_VARIABLE = `if (id in value) {}
// ❌ there is no variable called id — the property name must be a string`;

// ===================================================================
// part 5 — assignability
// ===================================================================

const EX10_TASK = `type Named = { name: string };
type Person = { name: string; age: number };

const sam = { name: "sam", age: 30, role: "admin" };

const a: Named = sam;                                  // 1
const b: Named = { name: "alex", age: 25 };            // 2
const c: Person = { name: "kim" } as Named;            // 3

type OnText = (value: string) => void;

const d: OnText = (value: string | number) => {};      // 4
const e: OnText = (value: "dark") => {};               // 5
const f: OnText = () => {};                            // 6

const g: () => string = () => 42;                      // 7
const h: () => void = () => 42;                        // 8`;

const EX10_VOID = `const l: number = h() + 5;
// ❌ h() is typed void, so it cannot be used as a number`;

// ===================================================================
// part 6 — classes
// ===================================================================

const EX11_INTERFACE = `interface Account {
    readonly id: string;
    readonly balance: number;
    deposit(amount: number): void;
    withdraw(amount: number): void;
}`;

const EX11_USAGE = `const acc = BankAccount.open("a1");
acc.deposit(100);
acc.withdraw(30);
acc.balance;           // 70

acc.balance = 500;     // ❌ must not compile
acc.id = "a2";         // ❌ must not compile
acc.withdraw(1000);    // throws "Insufficient funds"
acc.deposit(-5);       // throws "Amount must be positive"`;

const EX11_SOLUTION = `class BankAccount implements Account {
    readonly id: string;
    #balance = 0;

    constructor(id: string) {
        this.id = id;
    }

    static open(id: string) {
        return new BankAccount(id);
    }

    get balance() {
        return this.#balance;
    }

    deposit(amount: number): void {
        if (amount <= 0) throw new Error("Amount must be positive");
        this.#balance += amount;
    }

    withdraw(amount: number): void {
        if (amount <= 0) throw new Error("Amount must be positive");
        if (amount > this.#balance) throw new Error("Insufficient funds");
        this.#balance -= amount;
    }
}`;

const EX11_NO_GETTER = `class BankAccount implements Account { … }
// ❌ BankAccount promises to be an Account, but it has no balance property`;

const EX12_USAGE = `const email = new EmailNotifier("shop");
const sms = new SmsNotifier("shop");

email.notify("sam@x.com", "Order shipped");
// "email to sam@x.com: [shop] Order shipped"

broadcast([email, sms], "sam", "Hi");
// ["email to sam: [shop] Hi", "sms to sam: [shop] Hi"]

new Notifier("shop");   // ❌ must not compile`;

const EX12_SOLUTION = `abstract class Notifier {
    constructor(readonly sender: string) {}

    abstract send(to: string, text: string): string;

    notify(to: string, text: string): string {
        return this.send(to, \`[\${this.sender}] \${text}\`);
    }
}

class EmailNotifier extends Notifier {
    override send(to: string, text: string): string {
        return \`email to \${to}: \${text}\`;
    }
}

class SmsNotifier extends Notifier {
    override send(to: string, text: string): string {
        return \`sms to \${to}: \${text}\`;
    }
}

function broadcast(notifiers: Notifier[], to: string, text: string): string[] {
    return notifiers.map((n) => n.notify(to, text));
}`;

// ===================================================================
// part 7 — mixed
// ===================================================================

const EX13_GUARD_CALLS = `isAppEvent({ type: "login", userId: "u1" });                   // true
isAppEvent({ type: "purchase", userId: "u1", amount: 20 });    // true
isAppEvent({ type: "purchase", userId: "u1" });                // false — no amount
isAppEvent({ type: "signup", userId: "u1" });                  // false — unknown type`;

const EX13_PARSE_CALLS = `parseEvents('[{"type":"login","userId":"u1"},{"type":"oops"}]');
// [{ type: "login", userId: "u1" }]

parseEvents('{"type":"login"}');
// [] — not an array`;

const EX13_USAGE = `const raw = \`[
    { "type": "login",    "userId": "u1" },
    { "type": "purchase", "userId": "u1", "amount": 20 },
    { "type": "purchase", "userId": "u2", "amount": 5 },
    { "type": "purchase", "userId": "u1", "amount": 15 },
    { "type": "logout",   "userId": "u1" }
]\`;

const log = new EventLog();
for (const e of parseEvents(raw)) log.record(e);

log.count;           // 5
log.countByType();   // { login: 1, purchase: 3, logout: 1 }
log.revenue("u1");   // 35
log.revenue("u9");   // 0`;

const EX13_SOLUTION = `type AppEvent =
    | { type: "login"; userId: string }
    | { type: "purchase"; userId: string; amount: number }
    | { type: "logout"; userId: string };

function isAppEvent(value: unknown): value is AppEvent {
    if (typeof value !== "object" || value === null) return false;
    if (!("type" in value) || !("userId" in value)) return false;
    if (typeof value.userId !== "string") return false;
    if (value.type === "login" || value.type === "logout") return true;
    return (
        value.type === "purchase" &&
        "amount" in value &&
        typeof value.amount === "number"
    );
}

function parseEvents(raw: string): AppEvent[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return [];   // invalid JSON is not an array of events either
    }
    if (!Array.isArray(parsed)) return [];
    const items: unknown[] = parsed;
    return items.filter(isAppEvent);
}

class EventLog {
    #events: AppEvent[] = [];

    record(event: AppEvent): void {
        this.#events.push(event);
    }

    get count(): number {
        return this.#events.length;
    }

    countByType(): Record<AppEvent["type"], number> {
        const counts: Record<AppEvent["type"], number> = {
            login: 0,
            purchase: 0,
            logout: 0,
        };
        for (const e of this.#events) counts[e.type]++;
        return counts;
    }

    revenue(userId: string): number {
        let sum = 0;
        for (const e of this.#events) {
            if (e.type === "purchase" && e.userId === userId) sum += e.amount;
        }
        return sum;
    }
}`;

export function FoundationsExercisesDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the chapter pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Thirteen exercises covering the six Foundations pages, ordered
                    from easy to hard inside each part, with a final mixed exercise
                    that needs several pages at once. Most of them ask you to{" "}
                    <Term>write code</Term>: open an editor with{" "}
                    <Code>strict: true</Code> and solve them there before looking.
                </p>
                <p>
                    Each exercise shows its difficulty, its kind — predict what the
                    compiler says, fix broken code, or write it from a description —
                    and the page it practises. A hint and a full solution sit behind
                    their buttons; the solutions also flag the mistakes that are
                    easiest to make.
                </p>
            </div>

            {/* ---------- part 1 — First Types ---------- */}
            <PartHeading kicker="part 1">First Types</PartHeading>
            <div>
                <DocSection title="exercise 1 · inferred types">
                    <ExerciseMeta difficulty="easy" kind="predict" source="First Types" />
                    <p>Without running it, write down the type of each variable:</p>
                    <CodeBlock code={EX1_TASK} lang="ts" />
                    <p>
                        Answer in the form <Code>a: …</Code>, <Code>b: …</Code>
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    For each one ask: <Code>const</Code> or{" "}
                                    <Code>let</Code>? An object or array, whose contents
                                    can change? Is there any value to infer from at all?
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>The inferred types, as trailing comments:</p>
                                <CodeBlock code={EX1_SOLUTION} lang="ts" />
                                <p>
                                    <Code>a</Code> — a <Code>let</Code> can change, so the
                                    literal widens. <Code>b</Code> — a <Code>const</Code>{" "}
                                    keeps the literal type; write it with quotes, it is a
                                    type, not a value. <Code>c</Code> — nothing to infer
                                    from; strict mode then tracks it as an &ldquo;evolving
                                    any&rdquo; as values are pushed. <Code>d</Code> — object
                                    properties are mutable, so <Code>{'"dark"'}</Code>{" "}
                                    widens. <Code>e</Code> — inference never produces a
                                    tuple.
                                </p>
                                <Callout
                                    severity="note"
                                    label="note · getting the narrow version"
                                >
                                    <p>
                                        <Code>as const</Code> gives the literal forms —{" "}
                                        <Code>{'{ readonly mode: "dark" }'}</Code> and{" "}
                                        <Code>{'readonly ["sam", 42]'}</Code>.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 2 · exhaustive sizes">
                    <ExerciseMeta difficulty="easy" kind="write" source="First Types" />
                    <p>
                        1. Write a type <Code>Size</Code> that allows only{" "}
                        <Code>{'"sm"'}</Code>, <Code>{'"md"'}</Code> and{" "}
                        <Code>{'"lg"'}</Code>.
                    </p>
                    <p>
                        2. Write <Code>toPixels(size: Size): number</Code> returning
                        12, 16 and 20 respectively.
                    </p>
                    <p>
                        3. Make it so that adding <Code>{'"xl"'}</Code> to{" "}
                        <Code>Size</Code> later makes <Code>toPixels</Code> fail to
                        compile until it handles <Code>{'"xl"'}</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Handle each literal, then assign whatever is left to a
                                    variable typed <Code>never</Code>.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>First the if-chain form:</p>
                                <CodeBlock code={EX2_IF} lang="ts" />
                                <p>
                                    After the three checks nothing is left, so{" "}
                                    <Code>size</Code> is <Code>never</Code> and the line
                                    compiles; add <Code>{'"xl"'}</Code> and{" "}
                                    <Code>size</Code> is <Code>{'"xl"'}</Code> there, which
                                    cannot be assigned to <Code>never</Code>. The same check
                                    with a switch, which reads better as cases grow:
                                </p>
                                <CodeBlock code={EX2_SWITCH} lang="ts" />
                                <Callout
                                    severity="tip"
                                    label="tip · a Record needs no branching"
                                >
                                    <p>When each case only maps to a value, skip the branches:</p>
                                    <CodeBlock code={EX2_RECORD} lang="ts" />
                                    <p>
                                        The <Code>Record</Code> is exhaustive by itself — a
                                        missing key is already an error.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 3 · labels from unknown">
                    <ExerciseMeta difficulty="medium" kind="write" source="First Types" />
                    <p>
                        Write <Code>function toLabel(value: unknown): string</Code>{" "}
                        that returns: a string → the string itself; a number → the
                        number with 2 decimals (<Code>3.14159</Code> →{" "}
                        <Code>{'"3.14"'}</Code>); a boolean → <Code>{'"yes"'}</Code>{" "}
                        or <Code>{'"no"'}</Code>; anything else →{" "}
                        <Code>{'"unknown"'}</Code>.
                    </p>
                    <p>
                        Rules: no <Code>any</Code>, no <Code>as</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    One <Code>typeof</Code> check per case. Inside each
                                    branch the value is already narrowed.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>One narrowing check per case, in order:</p>
                                <CodeBlock code={EX3_SOLUTION} lang="ts" />
                                <p>
                                    Each <Code>typeof</Code> narrows <Code>unknown</Code> to
                                    one primitive, so <Code>toFixed</Code> and the ternary
                                    are allowed only inside their branch. Note that{" "}
                                    <Code>String(true)</Code> would also be a string and pass
                                    the type check — but it returns <Code>{'"true"'}</Code>,
                                    not the <Code>{'"yes"'}</Code> the task asks for; the
                                    compiler checks the type of a value, not whether it is
                                    the right one.
                                </p>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 2 — Objects & Aliases ---------- */}
            <PartHeading kicker="part 2">Objects &amp; Aliases</PartHeading>
            <div>
                <DocSection title="exercise 4 · product fixes">
                    <ExerciseMeta difficulty="easy" kind="fix" source="Objects & Aliases" />
                    <p>
                        This code has two compile errors, plus one thing that should be
                        impossible but is not. Fix all three:
                    </p>
                    <CodeBlock code={EX4_TASK} lang="ts" />
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Look for a misspelled key, a value that may be missing,
                                    and a property that should be assign-once.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>All three fixed:</p>
                                <CodeBlock code={EX4_SOLUTION} lang="ts" />
                                <p>
                                    <Code>dicount</Code> → <Code>discount</Code> (caught by
                                    the excess property check); <Code>p.discount</Code> may
                                    be <Code>undefined</Code>, so it is replaced by 0 with{" "}
                                    <Code>??</Code>; <Code>readonly id</Code> makes{" "}
                                    <Code>{'lamp.id = "p2"'}</Code> an error.
                                </p>
                                <Callout
                                    severity="note"
                                    label="note · if (p.discount) also works here"
                                >
                                    <p>
                                        A truthiness check skips a discount of 0 — harmless
                                        in this case, since 0% returns the full price either
                                        way. <Code>??</Code> replaces only{" "}
                                        <Code>undefined</Code> and <Code>null</Code>, so it
                                        is the safer habit (Unions &amp; Narrowing).
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 5 · stock limits">
                    <ExerciseMeta difficulty="medium" kind="write" source="Objects & Aliases" />
                    <p>
                        <Term>Step 1.</Term> Write <Code>type Category</Code> allowing
                        exactly <Code>{'"lamps"'}</Code>, <Code>{'"chairs"'}</Code>,{" "}
                        <Code>{'"tables"'}</Code>:
                    </p>
                    <CodeBlock code={EX5_CATEGORY} lang="ts" />
                    <p>
                        <Term>Step 2.</Term> Write a constant <Code>MAX_STOCK</Code> —
                        ONE object whose keys are the categories and whose values are
                        the maximum stock:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["category", "max stock"]}
                        rows={[
                            ["lamps", "20"],
                            ["chairs", "10"],
                            ["tables", "5"],
                        ]}
                    />
                    <p>
                        Type it so that leaving a category out, or adding an unknown
                        one, is a compile error. Usage:
                    </p>
                    <CodeBlock code={EX5_MAX_USAGE} lang="ts" />
                    <p>
                        <Term>Step 3.</Term> Write <Code>type Stock</Code>: current item
                        counts per product id, where ids are not known in advance. A
                        valid value:
                    </p>
                    <CodeBlock code={EX5_STOCK} lang="ts" />
                    <p>
                        <Term>Step 4.</Term> Write:
                    </p>
                    <CodeBlock code={EX5_SIGNATURE} lang="ts" />
                    <p>
                        The current count is the number stored for <Code>id</Code>, or
                        0 if <Code>id</Code> is not in <Code>stock</Code> yet; return{" "}
                        <Code>true</Code> if <Code>current + amount</Code> ≤{" "}
                        <Code>MAX_STOCK[category]</Code>. With the stock above:
                    </p>
                    <CodeBlock code={EX5_CALLS} lang="ts" />
                    <Reveal
                        hint={
                            <>
                                <p>
                                    A <Code>Record</Code> keyed by a literal union is closed;
                                    a <Code>Record</Code> keyed by <Code>string</Code> is
                                    open. And an open <Code>Record</Code> does not tell you
                                    when a key is missing.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>One closed record, one open one, and a fallback for a missing id:</p>
                                <CodeBlock code={EX5_SOLUTION} lang="ts" />
                                <p>
                                    <Code>{"Record<Category, number>"}</Code> requires
                                    exactly the three keys;{" "}
                                    <Code>{"Record<string, number>"}</Code> accepts any id.{" "}
                                    <Code>if (cond) return true; else return false;</Code>{" "}
                                    can always be written <Code>return cond;</Code>.
                                </p>
                                <Callout
                                    severity="trap"
                                    label="trap · a missing key reads as a number"
                                >
                                    <p>
                                        <Code>{"Record<string, number>"}</Code> claims every
                                        key holds a number, so <Code>{'stock["p9"]'}</Code>{" "}
                                        is typed <Code>number</Code> while it is{" "}
                                        <Code>undefined</Code> at runtime — and arithmetic on
                                        it gives <Code>NaN</Code>:
                                    </p>
                                    <CodeBlock code={EX5_NAN} lang="ts" />
                                    <p>
                                        Replace the missing value explicitly with{" "}
                                        <Code>?? 0</Code> (Objects &amp; Aliases, the index
                                        signature trap).
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — Functions ---------- */}
            <PartHeading kicker="part 3">Functions</PartHeading>
            <div>
                <DocSection title="exercise 6 · three signatures">
                    <ExerciseMeta difficulty="easy" kind="fix" source="Functions" />
                    <p>
                        Each function has one compile error. Fix each so it compiles
                        AND keeps working exactly as described — the example calls must
                        work as written:
                    </p>
                    <CodeBlock code={EX6_TASK} lang="ts" />
                    <Reveal
                        hint={
                            <>
                                <p>
                                    An optional parameter cannot come before a required one
                                    — but a parameter that is required and allows{" "}
                                    <Code>undefined</Code> can. A default already makes a
                                    parameter skippable. A rest parameter swallows
                                    everything after it.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>The three signatures, fixed:</p>
                                <CodeBlock code={EX6_SOLUTION} lang="ts" />
                                <p>
                                    1 keeps the order and types <Code>middle</Code> as{" "}
                                    <Code>string | undefined</Code> — passed, but may be{" "}
                                    <Code>undefined</Code> (Functions: <Code>?</Code> vs{" "}
                                    <Code>| undefined</Code>). 2 drops the <Code>?</Code> —
                                    the default already makes it optional, and its type is
                                    inferred as <Code>string</Code>. 3 moves the rest
                                    parameter last, which is what the call already does.
                                </p>
                                <Callout
                                    severity="trap"
                                    label="trap · reordering parameters changes every call"
                                >
                                    <p>
                                        Moving <Code>middle</Code> to the end compiles, but{" "}
                                        <Code>{'formatName("Ada", undefined, "Lovelace")'}</Code>{" "}
                                        then passes <Code>undefined</Code> as{" "}
                                        <Code>last</Code> — a compile error — and{" "}
                                        <Code>{'formatName("Ada", "King", "Lovelace")'}</Code>{" "}
                                        silently returns <Code>{'"Ada Lovelace King"'}</Code>{" "}
                                        — two string parameters swapped still type-check.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 7 · validators">
                    <ExerciseMeta difficulty="medium" kind="write" source="Functions" />
                    <p>
                        A validator receives a string and returns an error message
                        (string) or <Code>null</Code> when the value is fine.
                    </p>
                    <p>
                        <Term>Step 1.</Term> Write <Code>type Validator</Code>.
                    </p>
                    <p>
                        <Term>Step 2.</Term> Write <Code>required</Code>: returns{" "}
                        <Code>{'"Required"'}</Code> for <Code>{'""'}</Code>, otherwise{" "}
                        <Code>null</Code>.
                    </p>
                    <CodeBlock code={EX7_REQUIRED} lang="ts" />
                    <p>
                        <Term>Step 3.</Term> Write <Code>minLength</Code> — takes a
                        number, returns a <Code>Validator</Code> giving{" "}
                        <Code>{'"Too short"'}</Code> when the value has fewer
                        characters, otherwise <Code>null</Code>.
                    </p>
                    <CodeBlock code={EX7_MIN_LENGTH} lang="ts" />
                    <p>
                        <Term>Step 4.</Term> Write <Code>runValidators</Code>: takes a
                        value and any number of validators, returns only the error
                        messages.
                    </p>
                    <CodeBlock code={EX7_RUN} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>; the return type of{" "}
                        <Code>runValidators</Code> must be <Code>string[]</Code>, not{" "}
                        <Code>(string | null)[]</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    A function type alias; a function that returns an arrow;
                                    a rest parameter of validators; <Code>map</Code> then
                                    filter out the nulls.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>All four steps:</p>
                                <CodeBlock code={EX7_SOLUTION} lang="ts" />
                                <Callout
                                    severity="tip"
                                    label="tip · let the slot type the parameters"
                                >
                                    <p>
                                        Because <Code>required</Code> is typed{" "}
                                        <Code>Validator</Code>, <Code>value</Code> is already
                                        a string — no annotation needed (contextual typing,
                                        Functions).
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · the filter narrows on its own"
                                >
                                    <p>
                                        Since TypeScript 5.5,{" "}
                                        <Code>{"error => error !== null"}</Code> is inferred
                                        as a type guard, so the result is{" "}
                                        <Code>string[]</Code>. A loop that pushes into a{" "}
                                        <Code>const errors: string[]</Code> is equally
                                        correct.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 4 — Unions & Narrowing ---------- */}
            <PartHeading kicker="part 4">Unions &amp; Narrowing</PartHeading>
            <div>
                <DocSection title="exercise 8 · payment methods">
                    <ExerciseMeta
                        difficulty="medium"
                        kind="write"
                        source="Unions & Narrowing"
                    />
                    <p>Three payment methods, each with its own data:</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["kind", "data"]}
                        rows={[
                            ["card", "last4: string"],
                            ["paypal", "email: string"],
                            ["bank", "iban: string"],
                        ]}
                    />
                    <p>
                        <Term>Step 1.</Term> Write <Code>type Payment</Code> as a
                        discriminated union on <Code>kind</Code>; a card payment must
                        not be allowed an <Code>email</Code>, and so on.
                    </p>
                    <p>
                        <Term>Step 2.</Term> Write{" "}
                        <Code>describe(p: Payment): string</Code> using a{" "}
                        <Code>switch</Code> on <Code>p.kind</Code>:
                    </p>
                    <CodeBlock code={EX8_CALLS} lang="ts" />
                    <p>
                        <Term>Step 3.</Term> Make the switch exhaustive — a fourth
                        method must fail to compile until handled — and make it throw
                        at runtime if an unknown kind ever arrives from outside.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    The <Code>assertNever</Code> helper from Unions &amp;
                                    Narrowing does both jobs at once.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>The union, the helper and the switch:</p>
                                <CodeBlock code={EX8_SOLUTION} lang="ts" />
                                <p>
                                    <Code>return assertNever(p)</Code> satisfies the{" "}
                                    <Code>string</Code> return type because{" "}
                                    <Code>never</Code> fits any type — and at runtime it
                                    never returns, it throws. Keep the return type{" "}
                                    <Code>string</Code>; adding <Code>| undefined</Code>{" "}
                                    would force every caller to handle a case that cannot
                                    happen.
                                </p>
                                <Callout
                                    severity="trap"
                                    label="trap · a fallback in the default hides bad data"
                                >
                                    <p>
                                        Returning a string such as{" "}
                                        <Code>{'"Payment Not Valid"'}</Code> from the default
                                        of an exhaustive switch turns invalid input into a
                                        normal-looking result. Throw, so the bad value is
                                        visible.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · a const directly in a case"
                                >
                                    <p>
                                        <Code>const unhandled: never = p;</Code> written
                                        straight under <Code>default:</Code> without braces
                                        triggers the <Code>no-case-declarations</Code> lint
                                        rule — wrap it in <Code>{"{ }"}</Code>, or use{" "}
                                        <Code>assertNever</Code>.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 9 · a user guard">
                    <ExerciseMeta
                        difficulty="medium"
                        kind="write"
                        source="Unions & Narrowing"
                    />
                    <p>
                        <Term>Step 1.</Term> Start from this type:
                    </p>
                    <CodeBlock code={EX9_TYPE} lang="ts" />
                    <p>
                        <Term>Step 2.</Term> Write{" "}
                        <Code>isUser(value: unknown): value is User</Code> returning
                        true only if <Code>value</Code> is a non-null object,{" "}
                        <Code>id</Code> is a number, <Code>name</Code> is a string, and{" "}
                        <Code>tags</Code> is an array whose every element is a string.
                    </p>
                    <CodeBlock code={EX9_IS_USER_CALLS} lang="ts" />
                    <p>
                        <Term>Step 3.</Term> Write{" "}
                        <Code>loadUsers(data: unknown): User[]</Code> — the valid users
                        when <Code>data</Code> is an array, <Code>[]</Code> when it is
                        not.
                    </p>
                    <CodeBlock code={EX9_LOAD_CALLS} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>, no <Code>as</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    The return type must be <Code>value is User</Code>, not{" "}
                                    <Code>boolean</Code>. <Code>Array.isArray</Code> on{" "}
                                    <Code>unknown</Code> gives <Code>any[]</Code> — give the
                                    array an honest type before filtering.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>The guard, and the loader that uses it:</p>
                                <CodeBlock code={EX9_SOLUTION} lang="ts" />
                                <p>Why it is written exactly this way, in four points:</p>
                                <Callout
                                    severity="trap"
                                    label="trap · a boolean guard narrows nothing"
                                >
                                    <p>
                                        With <Code>: boolean</Code> as the return type,{" "}
                                        <Code>isUser(x)</Code> being true tells the compiler
                                        nothing about <Code>x</Code> — it stays{" "}
                                        <Code>unknown</Code>.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="trap"
                                    label="trap · Array.isArray on unknown hides an any"
                                >
                                    <p>
                                        It narrows to <Code>any[]</Code>, so{" "}
                                        <Code>data.filter(...)</Code> is <Code>any[]</Code>{" "}
                                        and passes as <Code>User[]</Code> without any check —
                                        the code compiles because of <Code>any</Code>, not
                                        because of the guard. Give the array an honest type
                                        and the real problem shows. Here{" "}
                                        <Code>isBooleanUser</Code> is the same function as{" "}
                                        <Code>isUser</Code>, but typed{" "}
                                        <Code>: boolean</Code>:
                                    </p>
                                    <CodeBlock code={EX9_BOOLEAN_GUARD} lang="ts" />
                                </Callout>
                                <Callout severity="tip" label="tip · shorter and clearer">
                                    <p>
                                        <Code>every(...)</Code> reads as the rule itself —
                                        all tags are strings; <Code>filter(isUser)</Code>{" "}
                                        passes the guard directly;{" "}
                                        <Code>if (cond) return true; return false;</Code> is
                                        just <Code>return cond;</Code>;{" "}
                                        <Code>(tag: unknown)</Code> keeps elements honest,
                                        since <Code>value.tags</Code> is <Code>any[]</Code>{" "}
                                        for the same <Code>Array.isArray</Code> reason.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label='note · why "number" and "id" are in quotes'
                                >
                                    <p>
                                        Runtime checks are JavaScript.{" "}
                                        <Code>typeof x</Code> returns a string such as{" "}
                                        <Code>{'"number"'}</Code> — <Code>number</Code>{" "}
                                        without quotes is a type, and types do not exist at
                                        runtime:
                                    </p>
                                    <CodeBlock code={EX9_TYPEOF_TYPE} lang="ts" />
                                    <p>
                                        <Code>in</Code> checks for a property name, which is
                                        a string — <Code>id</Code> without quotes means a
                                        variable called <Code>id</Code>:
                                    </p>
                                    <CodeBlock code={EX9_IN_VARIABLE} lang="ts" />
                                    <p>
                                        After a colon, <Code>number</Code> is the type;
                                        inside a runtime check, <Code>{'"number"'}</Code> is
                                        text.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 5 — Assignability ---------- */}
            <PartHeading kicker="part 5">Assignability</PartHeading>
            <div>
                <DocSection title="exercise 10 · what fits">
                    <ExerciseMeta difficulty="medium" kind="predict" source="Assignability" />
                    <p>
                        For each numbered line answer ✅ compiles or ❌ error, with a
                        one-line reason:
                    </p>
                    <CodeBlock code={EX10_TASK} lang="ts" />
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Is the object written inline or passed through a
                                    variable? For functions: parameters may get wider,
                                    returns may get narrower — and <Code>void</Code>{" "}
                                    discards.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>Line by line:</p>
                                <GridTable
                                    cols="grid-cols-[max-content_max-content_1fr]"
                                    head={["line", "result", "why"]}
                                    rows={[
                                        ["1", "✅", "sam has a name — extra keys are fine through a variable"],
                                        ["2", "❌", "written inline, so the excess property check rejects age"],
                                        ["3", "❌", "a Named has no age, which Person requires"],
                                        ["4", "✅", "the parameter is wider — it handles every string, and more"],
                                        ["5", "❌", "the parameter is narrower — callers may pass any string"],
                                        ["6", "✅", "ignoring a parameter demands less"],
                                        ["7", "❌", "the caller expects a string and would get a number"],
                                        ["8", "✅", "void discards the result"],
                                    ]}
                                />
                                <Callout
                                    severity="note"
                                    label="note · void hides the value, it does not remove it"
                                >
                                    <p>
                                        <Code>h()</Code> still returns 42 at runtime, but its
                                        result is typed <Code>void</Code>:
                                    </p>
                                    <CodeBlock code={EX10_VOID} lang="ts" />
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 6 — Classes ---------- */}
            <PartHeading kicker="part 6">Classes</PartHeading>
            <div>
                <DocSection title="exercise 11 · a bank account">
                    <ExerciseMeta difficulty="medium" kind="write" source="Classes" />
                    <p>
                        Write <Code>class BankAccount</Code> implementing:
                    </p>
                    <CodeBlock code={EX11_INTERFACE} lang="ts" />
                    <p>Requirements:</p>
                    <p>
                        1. <Code>id</Code> set once in the constructor, never
                        changeable.
                    </p>
                    <p>
                        2. The balance is stored in a field no code outside the class
                        can reach, even at runtime; it starts at 0.
                    </p>
                    <p>
                        3. <Code>balance</Code> can be read from outside but not
                        assigned.
                    </p>
                    <p>
                        4. <Code>deposit(amount)</Code> adds; throws{" "}
                        <Code>{'Error("Amount must be positive")'}</Code> if{" "}
                        <Code>amount</Code> ≤ 0.
                    </p>
                    <p>
                        5. <Code>withdraw(amount)</Code> subtracts; same positive check,
                        and throws <Code>{'Error("Insufficient funds")'}</Code> if{" "}
                        <Code>amount</Code> exceeds the balance.
                    </p>
                    <p>
                        6. <Code>static open(id: string)</Code> creates and returns a
                        new account.
                    </p>
                    <CodeBlock code={EX11_USAGE} lang="ts" />
                    <Reveal
                        hint={
                            <>
                                <p>
                                    Two members with two names — a <Code>#</Code> field that
                                    holds the number, and a public getter that exposes it.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>The full class:</p>
                                <CodeBlock code={EX11_SOLUTION} lang="ts" />
                                <Callout
                                    severity="note"
                                    label="note · #balance is not balance"
                                >
                                    <p>
                                        The <Code>#</Code> is part of the name, and an
                                        interface only checks public members — without the
                                        getter the class has no public <Code>balance</Code>:
                                    </p>
                                    <CodeBlock code={EX11_NO_GETTER} lang="ts" />
                                </Callout>
                                <Callout
                                    severity="trap"
                                    label="trap · a readonly field cannot hold a changing balance"
                                >
                                    <p>
                                        Declaring <Code>readonly balance: number</Code> as a
                                        field satisfies the interface, but a readonly field
                                        can only be set in the constructor —{" "}
                                        <Code>deposit</Code> and <Code>withdraw</Code> could
                                        never update it. The getter is readonly from outside
                                        while the private field stays writable inside.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="tip"
                                    label="tip · when a static factory beats new"
                                >
                                    <p>
                                        Validate or clean input before creating, do async
                                        work (a constructor cannot be async), force all
                                        creation through one door with a private
                                        constructor, or give creation a business name.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="exercise 12 · notifiers">
                    <ExerciseMeta difficulty="medium" kind="write" source="Classes" />
                    <p>
                        <Term>Step 1.</Term> Write an abstract class{" "}
                        <Code>Notifier</Code> with: a <Code>readonly sender: string</Code>{" "}
                        set in the constructor; an abstract method{" "}
                        <Code>send(to: string, text: string): string</Code>; and a
                        normal method <Code>notify(to, text): string</Code> that calls{" "}
                        <Code>send</Code> with the text formatted as{" "}
                        <Code>{'"[sender] text"'}</Code> and returns its result.
                    </p>
                    <p>
                        <Term>Step 2.</Term> Write <Code>EmailNotifier</Code> (
                        <Code>send</Code> returns{" "}
                        <Code>{'"email to <to>: <text>"'}</Code>) and{" "}
                        <Code>SmsNotifier</Code> (<Code>send</Code> returns{" "}
                        <Code>{'"sms to <to>: <text>"'}</Code>).
                    </p>
                    <p>
                        <Term>Step 3.</Term> Write{" "}
                        <Code>
                            broadcast(notifiers: Notifier[], to: string, text: string):
                            string[]
                        </Code>{" "}
                        calling <Code>notify</Code> on each.
                    </p>
                    <CodeBlock code={EX12_USAGE} lang="ts" />
                    <p>
                        Rule: write <Code>override</Code> wherever a subclass replaces a
                        parent member.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    The abstract class owns the shared formatting; each
                                    subclass only writes <Code>send</Code>.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>The base class, both subclasses and the broadcast:</p>
                                <CodeBlock code={EX12_SOLUTION} lang="ts" />
                                <Callout
                                    severity="note"
                                    label="note · override on an abstract method is optional"
                                >
                                    <p>
                                        Even with <Code>noImplicitOverride</Code>,
                                        implementing an abstract member does not require{" "}
                                        <Code>override</Code> — but writing it means a
                                        renamed parent method breaks the subclass
                                        immediately instead of leaving an unrelated method
                                        behind.
                                    </p>
                                </Callout>
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 7 — several pages at once ---------- */}
            <PartHeading kicker="part 7">Mixed</PartHeading>
            <div>
                <DocSection title="exercise 13 · an event log">
                    <ExerciseMeta
                        difficulty="hard"
                        kind="write"
                        source="First Types, Unions & Narrowing, Objects & Aliases, Classes"
                    />
                    <p>
                        <Term>Step 1.</Term> Write <Code>type AppEvent</Code> — a
                        discriminated union on <Code>type</Code>:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["type", "data"]}
                        rows={[
                            ["login", "userId: string"],
                            ["purchase", "userId: string, amount: number"],
                            ["logout", "userId: string"],
                        ]}
                    />
                    <p>
                        <Term>Step 2.</Term> Write{" "}
                        <Code>isAppEvent(value: unknown): value is AppEvent</Code> —
                        true only for one of the three shapes exactly, including{" "}
                        <Code>amount</Code> being a number for a purchase.
                    </p>
                    <CodeBlock code={EX13_GUARD_CALLS} lang="ts" />
                    <p>
                        <Term>Step 3.</Term> Write{" "}
                        <Code>parseEvents(raw: string): AppEvent[]</Code> —{" "}
                        <Code>raw</Code> is JSON text that should contain an array of
                        events; return only the valid ones, <Code>[]</Code> when it is
                        not an array.
                    </p>
                    <CodeBlock code={EX13_PARSE_CALLS} lang="ts" />
                    <p>
                        <Term>Step 4.</Term> Write <Code>class EventLog</Code>: stores
                        events in a field no outside code can reach, even at runtime;{" "}
                        <Code>record(event: AppEvent): void</Code>;{" "}
                        <Code>get count</Code> (readable, not assignable);{" "}
                        <Code>countByType()</Code> returning the count per type, whose
                        return type makes a missing type a compile error;{" "}
                        <Code>revenue(userId: string): number</Code> summing that
                        user&apos;s purchase amounts. With this data:
                    </p>
                    <CodeBlock code={EX13_USAGE} lang="ts" />
                    <p>
                        Rules: no <Code>any</Code>, no <Code>as</Code>.
                    </p>
                    <Reveal
                        hint={
                            <>
                                <p>
                                    <Code>JSON.parse</Code> returns <Code>any</Code> — store
                                    it as <Code>unknown</Code>. Count with a{" "}
                                    <Code>Record</Code> keyed by{" "}
                                    <Code>{'AppEvent["type"]'}</Code>, and index it with each
                                    event&apos;s type.
                                </p>
                            </>
                        }
                        solution={
                            <>
                                <p>All four steps:</p>
                                <CodeBlock code={EX13_SOLUTION} lang="ts" />
                                <Callout
                                    severity="trap"
                                    label="trap · countByType(): object loses the keys"
                                >
                                    <p>
                                        With <Code>object</Code> as the return type the
                                        result cannot even be read —{" "}
                                        <Code>log.countByType().login</Code> is an error —
                                        and an <Code>if</Code> / <Code>else</Code> chain that
                                        counts &ldquo;everything else&rdquo; as logout
                                        silently miscounts a fourth type.{" "}
                                        <Code>{'Record<AppEvent["type"], number>'}</Code>{" "}
                                        fails to compile until a new type is added to{" "}
                                        <Code>counts</Code>.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="trap"
                                    label="trap · JSON.parse hides an any"
                                >
                                    <p>
                                        Its result is <Code>any</Code>, so{" "}
                                        <Code>result.filter(...)</Code> is <Code>any[]</Code>{" "}
                                        and passes as <Code>AppEvent[]</Code> unchecked — the
                                        exercise 9 hole again. Store it as{" "}
                                        <Code>unknown</Code> and give the array an honest type
                                        before filtering.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · returning the private array breaks privacy"
                                >
                                    <p>
                                        A method such as{" "}
                                        <Code>{"getEvents() { return this.#events; }"}</Code>{" "}
                                        hands out the SAME array — outside code can push into
                                        it and skip every check. Leave it out, or return a
                                        copy: <Code>return [...this.#events];</Code>.
                                    </p>
                                </Callout>
                                <Callout
                                    severity="note"
                                    label="note · check at the boundary, not inside typed code"
                                >
                                    <p>
                                        <Code>record</Code> receives an{" "}
                                        <Code>AppEvent</Code>, so calling{" "}
                                        <Code>isAppEvent(event)</Code> there is always true.
                                        Validation belongs where unknown data enters —{" "}
                                        <Code>parseEvents</Code>.
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
