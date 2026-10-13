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
    // --- part 1 (Fields & Constructors) ---
    // inline `trap · ! switches the initialisation check off` + `note · an empty field says so in its type`
    "declaring-and-initialising-fields": ["trap", "note"],
    // inline `danger · a method loses this when passed around` + `note · returning is not printing`
    "methods-and-this": ["danger", "note"],

    // --- part 2 (Access Modifiers) ---
    // inline `trap · private is a compile-time rule only`
    "public-private-protected": ["trap"],
    // inline `note · # and private cannot share a field` — "#private and readonly"
    // slugs to this id: slug() drops the leading "#".
    "private-and-readonly": ["note"],

    // --- part 3 (Parameter Properties) ---
    // inline `trap · without a modifier it stays a parameter`
    "the-constructor-shortcut": ["trap"],
    // inline `tip · which form to write` + `note · erasableSyntaxOnly`
    "erasable-syntax": ["tip", "note"],

    // --- part 4 (implements & abstract) ---
    // inline `trap · implements only checks…` + `note · implements, an annotation and a literal…`
    implements: ["trap", "note"],
    // inline `tip · turn on noImplicitOverride`
    "abstract-classes-and-override": ["tip"],

    // --- part 5 (Classes as Types) ---
    // inline `trap · the instance type is structural, instanceof is not`
    "one-name-two-things": ["trap"],
    // inline `danger · methods do not survive JSON` + `tip · data travels as types…`
    "when-to-use-a-class": ["danger", "tip"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in assignability.tsx.
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

// The grid table unions-and-narrowing.tsx uses, copied unchanged — this page
// needs it twice, both in part 4.
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
// part 1 — fields & constructors
// ===================================================================

const DECLARED_FIELDS = `class User {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
}

const u = new User("sam", 30);
u.name;   // string`;

const UNDECLARED_FIELD = `class User {
    constructor(name: string) {
        this.name = name;
        // ❌ name was never declared on the class
    }
}`;

const INITIALISATION = `class Counter {
    count: number;
    // ❌ count is never given a value, so it would start as undefined
}

class Counter2 {
    count = 0;                 // ✅ initialised at the declaration — inferred as number
}

class Counter3 {
    count: number;
    constructor() {
        this.count = 0;        // ✅ initialised in the constructor
    }
}`;

const EMPTY_FIELDS = `class Session {
    user: User | null = null;   // ✅ honestly empty until login
    token?: string;             // ✅ optional — undefined is part of the type
}`;

const DEFINITE_ASSIGNMENT = `class Form {
    input!: HTMLInputElement;   // set later by a framework — no error

    focus() {
        this.input.focus();     // compiles — and crashes if nobody actually set it
    }
}`;

const METHOD_THIS = `class User {
    name: string;
    constructor(name: string) { this.name = name; }

    greet() {
        return \`hi \${this.name}\`;   // ✅ this: User
    }
}

new User("sam").greet();   // "hi sam"`;

const LOST_THIS = `const u = new User("sam");
const greet = u.greet;

greet();   // compiles — and crashes: this is undefined, so this.name fails`;

const ARROW_FIELD = `class User {
    constructor(public name: string) {}

    greet = () => \`hi \${this.name}\`;   // a field holding an arrow function
}

const greet = new User("sam").greet;
greet();   // ✅ "hi sam" — this was captured when the object was built`;

const THIS_PARAMETER = `class User {
    constructor(public name: string) {}

    greet(this: User) {
        return \`hi \${this.name}\`;
    }
}

const greet = new User("sam").greet;
greet();
// ❌ called on its own, there is no User for this to point to`;

const BIND_THIS = `const greet = u.greet.bind(u);   // () => string — this is fixed to u
greet();                         // ✅ "hi sam"

const wrong = u.greet.bind({ name: "x" });
// ❌ { name: "x" } is not a User — it has no greet method`;

const WRAP_CALL = `const greet = () => u.greet();   // u is left of the dot when greet runs
setTimeout(() => u.greet(), 100);   // ✅ the same fix for a callback`;

const LOOSE_RECEIVER = `setTimeout(u.greet, 100);   // compiles — and crashes when the timer fires`;

const RETURN_NOT_PRINT = `console.log(greet());   // hi sam`;

const STATIC_MEMBERS = `class User {
    constructor(public name: string) {}

    static create(name: string) {
        return new User(name.trim());
    }
}

User.create(" sam ");   // ✅ called on the class
new User("sam").create;
// ❌ create lives on the class User, not on its instances`;

// ===================================================================
// part 2 — access modifiers
// ===================================================================

const MODIFIERS = `class Account {
    public owner: string;        // anyone
    private balance = 0;         // only code inside Account
    protected currency = "EUR";  // Account and classes that extend it

    constructor(owner: string) { this.owner = owner; }

    deposit(amount: number) {
        this.balance += amount;  // ✅ inside the class
    }
}`;

const FROM_OUTSIDE = `const a = new Account("sam");

a.owner;      // ✅ public
a.balance;
// ❌ balance is private — only Account's own code may touch it
a.currency;
// ❌ currency is protected — only Account and its subclasses may touch it`;

const FROM_SUBCLASS = `class Savings extends Account {
    show() {
        this.currency;   // ✅ protected — a subclass may use it
        this.balance;
        // ❌ private stays private even from a subclass
    }
}`;

const PRIVATE_ERASED = `a["balance"];                 // compiles — bracket access skips the private check
(a as any).balance = -500;    // compiles — any skips every check
console.log(a);               // Account { owner: 'sam', balance: -500, currency: 'EUR' }`;

const HASH_PRIVATE = `class Account {
    #balance = 0;

    deposit(amount: number) {
        this.#balance += amount;   // ✅ inside the class
    }

    get balance() {
        return this.#balance;      // a getter exposes it read-only
    }
}

const a = new Account();
a.#balance;
// ❌ #balance cannot be reached from outside the class
a["#balance"];
// ❌ there is no property called "#balance" — # fields are not ordinary keys`;

const HASH_HIDDEN = `a.deposit(50);
JSON.stringify(a);           // '{}'
Object.keys(a);              // []
(a as any)["#balance"];      // undefined — any cannot reach it either`;

const READONLY_FIELD = `class Account {
    readonly id: string;

    constructor(id: string) {
        this.id = id;              // ✅ the constructor may set it
    }

    reset() {
        this.id = "x";
        // ❌ id is readonly — after construction, not even the class may change it
    }
}

new Account("a1").id = "a2";
// ❌ and nobody outside may either`;

const GETTER_ONLY = `a.balance;       // ✅ 50
a.balance = 5;
// ❌ balance only has a getter, so it can be read but not set`;

const HASH_WITH_MODIFIER = `class Account {
    private #balance = 0;
    // ❌ a # field is already private — an access modifier cannot be added to it
    public #id = "a1";
    // ❌ nor public or protected — # decides access on its own
}`;

const HASH_COMBINES = `class Account {
    readonly #id: string;        // ✅ real privacy + assign once
    static #count = 0;           // ✅ a private field on the class itself

    constructor(id: string) {
        this.#id = id;
        Account.#count++;
    }
}`;

// ===================================================================
// part 3 — parameter properties
// ===================================================================

const WRITTEN_OUT = `class User {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}`;

const PARAMETER_PROPERTY = `class User {
    constructor(public name: string) {}
}`;

const ANY_MODIFIER = `class User {
    constructor(
        public name: string,
        private readonly id: string,
        protected role = "member",
    ) {}
}

const u = new User("sam", "u1");
u.name;   // ✅ public
u.id;
// ❌ id is private — the modifier on the parameter applies to the field`;

const NO_MODIFIER = `class User {
    constructor(public name: string, nickname: string) {}

    hello() {
        return this.nickname;
        // ❌ nickname has no modifier, so it never became a field
    }
}`;

const WRITTEN_TS = `class User {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

const u = new User("sam");
console.log(u.name);`;

const SHORTCUT_TS = `class User {
    constructor(public name: string) {}
}

const u = new User("sam");
console.log(u.name);`;

// Real tsc output for both files — verbatim (rule 2's exception).
const TSC_EMIT = `"use strict";
class User {
    name;
    constructor(name) {
        this.name = name;
    }
}
const u = new User("sam");
console.log(u.name);`;

// Real Node output — verbatim (rule 2's exception).
const NODE_WRITTEN = `$ node --experimental-strip-types written.ts
sam`;

const NODE_SHORTCUT = `$ node --experimental-strip-types shortcut.ts
class User {
    constructor(public name: string) {}
                       ^^^^^^^^^^^^
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode`;

const STRIPPED = `class User {
    constructor(name) {}
}
const u = new User("sam");
console.log(u.name);`;

const STRIPPED_OUTPUT = `undefined`;

const ERASABLE_FLAG = `{
    "compilerOptions": {
        // forbid syntax that cannot simply be deleted
        "erasableSyntaxOnly": true
    }
}`;

const ERASABLE_ERROR = `class User {
    constructor(public name: string) {}
    // ❌ a parameter property needs generated code, which erasableSyntaxOnly forbids
}`;

// ===================================================================
// part 4 — implements & abstract
// ===================================================================

const IMPLEMENTS = `interface Logger {
    level: "info" | "debug";
    log(message: string): void;
}

class ConsoleLogger implements Logger {
    level: "info" | "debug" = "info";

    log(message: string) {
        console.log(message);
    }
}`;

const IMPLEMENTS_MISSING = `class BadLogger implements Logger {
    level = "info" as const;
}
// ❌ BadLogger promises to be a Logger, but it has no log method`;

const IMPLEMENTS_SEVERAL = `interface Closable { close(): void }

class FileLogger implements Logger, Closable {
    level: "info" | "debug" = "debug";
    log(message: string) {}
    close() {}
}`;

const IMPLEMENTS_NO_TYPES = `class LooseLogger implements Logger {
    level: "info" | "debug" = "info";

    log(message) { console.log(message); }
    // ❌ message has no type — implements does not pass the interface's types into the class
}`;

const STRUCTURAL_CLASS = `class Plain {
    level: "info" | "debug" = "info";
    log(message: string) {}
}

const l: Logger = new Plain();   // ✅ same shape — no implements needed`;

const EXTRA_MEMBERS = `class BufferedLogger implements Logger {
    level: "info" | "debug" = "info";
    log(message: string) {}
    flush() {}                          // not in Logger — fine
}

const x = new BufferedLogger();         // x: BufferedLogger
x.flush();                              // ✅`;

const ANNOTATION_HIDES = `const b: Logger = new BufferedLogger();   // ✅ has everything Logger needs, plus flush
b.flush();
// ❌ b is typed Logger, and Logger has no flush`;

const LITERAL_REJECTS = `const c: Logger = {
    level: "info",
    log(message: string) {},
    flush() {},
    // ❌ flush is not part of Logger, and this object is written right here
};`;

const ABSTRACT_SHAPE = `abstract class Shape {
    constructor(public name: string) {}

    abstract area(): number;          // no body — every subclass must write it

    describe() {                      // real code, shared by all subclasses
        return \`\${this.name}: \${this.area().toFixed(2)}\`;
    }
}`;

const ABSTRACT_NEW = `const s = new Shape("x");
// ❌ Shape is abstract — it is a template for subclasses, not a usable object`;

const ABSTRACT_SUBCLASSES = `class Circle extends Shape {
    constructor(public radius: number) { super("circle"); }

    area() {                          // ✅ the missing piece, supplied
        return Math.PI * this.radius ** 2;
    }
}

class Square extends Shape {
    constructor(public side: number) { super("square"); }
}
// ❌ Square extends Shape but never writes area, which Shape left abstract`;

const DESCRIBE_CALL = `new Circle(1).describe();   // "circle: 3.14"`;

const OVERRIDE = `class Loud extends Circle {
    override area() { return 1; }        // ✅ really replaces Circle's area

    override perimeter() { return 2; }
    // ❌ Circle has no perimeter — the parent was renamed, or this is a typo

    describe() { return "loud"; }
    // ❌ this replaces Shape's describe, so it must say override
}`;

const NO_IMPLICIT_OVERRIDE = `{
    "compilerOptions": {
        "noImplicitOverride": true
    }
}`;

// ===================================================================
// part 5 — classes as types
// ===================================================================

const TWO_THINGS = `class User {
    static count = 0;
    constructor(public name: string) {}
    greet() { return \`hi \${this.name}\`; }
}`;

const INSTANCE_VS_CLASS = `const u: User = new User("sam");   // ✅ an instance fits the instance type

const bad: User = User;
// ❌ the class itself is not an instance — it has no greet method`;

const TYPEOF_CLASS = `const C: typeof User = User;   // ✅ the class, not an instance
C.count;                        // ✅ statics live here
new C("alex");                  // ✅ and it can be called with new`;

const CLASS_PARAMETER = `function make(cls: typeof User, name: string) {
    return new cls(name);   // User
}

make(User, "sam");   // ✅ pass the class, not an instance`;

const CONSTRUCT_SIGNATURE = `function create<T>(cls: new (name: string) => T, name: string): T {
    return new cls(name);
}

const m = create(User, "alex");   // User`;

const FAKE_INSTANCE = `const fake: User = { name: "x", greet: () => "hi" };   // ✅ same shape — accepted

fake instanceof User;   // false at runtime`;

const AS_CLASS = `class User {
    constructor(public name: string, public email: string) {}
    label() { return \`\${this.name} <\${this.email}>\`; }
}`;

const AS_TYPE = `type User = { name: string; email: string };
function label(user: User) { return \`\${user.name} <\${user.email}>\`; }`;

const JSON_LOSES_METHODS = `const sent = JSON.stringify(new User("sam", "s@x.com"));
const received: User = JSON.parse(sent);   // compiles — JSON.parse returns any

received.label();   // compiles — and crashes: received is a plain object, label is gone`;

const CUSTOM_ERROR = `class NotFoundError extends Error {
    constructor(public resource: string) {
        super(\`\${resource} not found\`);
        this.name = "NotFoundError";
    }
}

try {
    load();
} catch (e) {
    if (e instanceof NotFoundError) {
        e.resource;   // ✅ narrowed — e is a NotFoundError here
    }
}`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings the earlier pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function ClassesDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the earlier pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A class bundles data and the code that works on it into one thing
                    you create with <Code>new</Code>. Most of what a class is comes
                    from JavaScript; TypeScript adds a layer on top — declared fields,
                    access modifiers, contracts with <Code>implements</Code> and{" "}
                    <Code>abstract</Code> — and{" "}
                    <Term>
                        most of that layer is checked at compile time and then
                        erased.
                    </Term>
                </p>
                <p>
                    This page covers that layer, marks clearly which parts survive
                    into the running program and which do not, and ends with the
                    question that matters most in a React or Next codebase: when a
                    class is the right tool at all. Same conventions as before:{" "}
                    <Code>strict: true</Code>{" "}throughout, <Code>{"// ❌"}</Code> on
                    the line below an error, <Code>{"// ✅"}</Code> where the contrast
                    helps.
                </p>
            </div>

            {/* ---------- part 1 — what an instance holds ---------- */}
            <PartHeading kicker="part 1">Fields &amp; Constructors</PartHeading>
            <div>
                <DocSection title="declaring and initialising fields">
                    <p>
                        In plain JavaScript you can attach anything to{" "}
                        <Code>this</Code> inside the constructor.{" "}
                        <Term>
                            In TypeScript every field must be declared in the class
                            body first
                        </Term>
                        , with its type:
                    </p>
                    <CodeBlock code={DECLARED_FIELDS} lang="ts" />
                    <p>
                        The class body is the class&apos;s shape, so assigning to an
                        undeclared field is an error:
                    </p>
                    <CodeBlock code={UNDECLARED_FIELD} lang="ts" />
                    <p>
                        <Term>Strict mode also makes you initialise every field</Term>{" "}
                        (<Code>strictPropertyInitialization</Code>) — at the
                        declaration or in the constructor:
                    </p>
                    <CodeBlock code={INITIALISATION} lang="ts" />
                    <p>
                        The check exists because a declared{" "}
                        <Code>count: number</Code> that is never assigned would really
                        be <Code>undefined</Code> while the type claims a number.
                    </p>

                    <Callout
                        severity="note"
                        label="note · an empty field says so in its type"
                    >
                        <p>
                            If a field may legitimately be empty, put that in the type
                            instead of fighting the check:
                        </p>
                        <CodeBlock code={EMPTY_FIELDS} lang="ts" />
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · ! switches the initialisation check off"
                    >
                        <p>
                            The definite assignment assertion tells the compiler a
                            field will be set by something it cannot see — a
                            framework, or an <Code>init()</Code> called right after
                            construction:
                        </p>
                        <CodeBlock code={DEFINITE_ASSIGNMENT} lang="ts" />
                        <p>
                            <Code>!</Code> works like <Code>as</Code> for one field:
                            the check is gone, not satisfied. Use it only when
                            something outside the class guarantees the assignment;
                            otherwise prefer an initial value or <Code>| null</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="methods and this">
                    <p>
                        Methods are written in the class body like functions, without
                        the <Code>function</Code> keyword. Inside them,{" "}
                        <Code>this</Code> is the instance:
                    </p>
                    <CodeBlock code={METHOD_THIS} lang="ts" />

                    <Callout
                        severity="danger"
                        label="danger · a method loses this when passed around"
                    >
                        <p>
                            <Code>this</Code> is not fixed to the object — JavaScript
                            decides it at call time, from what is left of the dot. Take
                            the method out and nothing is:
                        </p>
                        <CodeBlock code={LOST_THIS} lang="ts" />
                        <p>
                            TypeScript does not catch this by default, and it happens
                            every time a method is passed as a callback:{" "}
                            <Code>setTimeout(u.greet, 100)</Code>,{" "}
                            <Code>{'addEventListener("click", u.greet)'}</Code>,{" "}
                            <Code>{"onClick={u.greet}"}</Code>.
                        </p>
                    </Callout>

                    <p>
                        <Term>Fix 1 — an arrow-function field.</Term> An arrow
                        function has no <Code>this</Code> of its own; it uses the{" "}
                        <Code>this</Code> of where it was created, the instance:
                    </p>
                    <CodeBlock code={ARROW_FIELD} lang="ts" />
                    <p>
                        The cost: every instance gets its own copy of the function
                        instead of one shared method — harmless for a few objects,
                        worth knowing for thousands. (<Code>public name</Code> is a
                        parameter property, part 3.)
                    </p>
                    <p>
                        <Term>Fix 2 — declare this, and let the compiler check calls.</Term>{" "}
                        A first parameter named <Code>this</Code> is not a real
                        parameter: it states what <Code>this</Code> must be, and it is
                        erased from the output:
                    </p>
                    <CodeBlock code={THIS_PARAMETER} lang="ts" />
                    <p>
                        The mistake is now a compile error; fix it at the call. Lock{" "}
                        <Code>this</Code> with <Code>bind</Code>:
                    </p>
                    <CodeBlock code={BIND_THIS} lang="ts" />
                    <p>Or wrap the call, so the dot is back:</p>
                    <CodeBlock code={WRAP_CALL} lang="ts" />
                    <p>
                        One honest gap, after the fixes: the <Code>this</Code> check
                        only works where the receiving function is precisely typed.{" "}
                        <Code>setTimeout</Code> accepts almost any function:
                    </p>
                    <CodeBlock code={LOOSE_RECEIVER} lang="ts" />
                    <p>
                        So for methods you know will be passed around, the
                        arrow-function field is the safest choice.
                    </p>

                    <Callout severity="note" label="note · returning is not printing">
                        <p>
                            <Code>greet()</Code> returns its string; it does not log
                            it. The value is discarded unless you use it:
                        </p>
                        <CodeBlock code={RETURN_NOT_PRINT} lang="ts" />
                        <p>
                            A method that prints instead calls{" "}
                            <Code>console.log</Code> inside, and returns{" "}
                            <Code>void</Code>.
                        </p>
                    </Callout>

                    <p>
                        <Term>Static members belong to the class, not to instances</Term>{" "}
                        — typically factories and constants:
                    </p>
                    <CodeBlock code={STATIC_MEMBERS} lang="ts" />
                </DocSection>
            </div>

            {/* ---------- part 2 — who may touch a member ---------- */}
            <PartHeading kicker="part 2">Access Modifiers</PartHeading>
            <div>
                <DocSection title="public, private, protected">
                    <p>Access modifiers say who may use a member:</p>
                    <CodeBlock code={MODIFIERS} lang="ts" />
                    <p>From outside the class:</p>
                    <CodeBlock code={FROM_OUTSIDE} lang="ts" />
                    <p>
                        <Term>
                            <Code>protected</Code> opens the door to subclasses,{" "}
                            <Code>private</Code> does not:
                        </Term>
                    </p>
                    <CodeBlock code={FROM_SUBCLASS} lang="ts" />
                    <p>
                        <Code>public</Code> is the default — a member without a
                        modifier is public, so most code leaves the word out.{" "}
                        <Term>Why bother:</Term> <Code>private</Code> lets a class
                        protect its own rules. <Code>balance</Code> can only change
                        through <Code>deposit</Code>, so nothing elsewhere can set it
                        to -500, and the storage can change later without breaking
                        code that was never allowed to depend on it.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · private is a compile-time rule only"
                    >
                        <p>
                            It is erased like every other annotation, so at runtime{" "}
                            <Code>balance</Code> is an ordinary property:
                        </p>
                        <CodeBlock code={PRIVATE_ERASED} lang="ts" />
                        <p>
                            <Code>console.log</Code>, <Code>JSON.stringify</Code> and{" "}
                            <Code>Object.keys</Code> all see private fields.
                            TypeScript&apos;s <Code>private</Code> keeps honest code
                            honest; it does not hide data.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="#private and readonly">
                    <p>
                        <Term>
                            <Code>#private</Code> is JavaScript&apos;s own privacy, and
                            it is real.
                        </Term>{" "}
                        A field whose name starts with <Code>#</Code> is private at
                        runtime:
                    </p>
                    <CodeBlock code={HASH_PRIVATE} lang="ts" />
                    <p>
                        The escape hatches from the previous section do not work,
                        because the field is not stored as a normal property:
                    </p>
                    <CodeBlock code={HASH_HIDDEN} lang="ts" />
                    <p>
                        Browser dev tools can still display <Code>#</Code> fields while
                        debugging, but no code outside the class can read or change
                        them.
                    </p>
                    <p>
                        <Term>
                            <Code>private</Code> or <Code>#</Code>?
                        </Term>{" "}
                        <Code>#</Code> is real runtime privacy, standard JavaScript,
                        works in plain JS too — use it when data must really be hidden
                        (tokens, internal state users must not depend on).{" "}
                        <Code>private</Code> is compile-time only and still shows in
                        logs and serialisation — it is what most existing TypeScript
                        and NestJS code uses. For new code <Code>#</Code> is the more
                        honest choice.
                    </p>
                    <p>
                        <Term>
                            <Code>readonly</Code> means assign once
                        </Term>{" "}
                        — at the declaration or in the constructor, and nowhere else,
                        not even in the class&apos;s own methods:
                    </p>
                    <CodeBlock code={READONLY_FIELD} lang="ts" />
                    <p>
                        <Term>A getter with no setter is readonly too:</Term>
                    </p>
                    <CodeBlock code={GETTER_ONLY} lang="ts" />
                    <p>
                        A private field plus a public getter is the standard pattern
                        for &ldquo;visible, but changeable only through the
                        class&apos;s own methods&rdquo;. As on Objects &amp; Aliases,{" "}
                        <Code>readonly</Code> is compile-time only and shallow — a{" "}
                        <Code>readonly items: string[]</Code> can still be pushed to.
                    </p>

                    <Callout
                        severity="note"
                        label="note · # and private cannot share a field"
                    >
                        <p>
                            A <Code>#</Code> field takes no access modifier at all:
                        </p>
                        <CodeBlock code={HASH_WITH_MODIFIER} lang="ts" />
                        <p>
                            There is no <Code>#protected</Code>: a subclass cannot see
                            its parent&apos;s <Code>#</Code> fields.{" "}
                            <Code>readonly</Code> and <Code>static</Code> do combine
                            with <Code>#</Code>, because they are not about access:
                        </p>
                        <CodeBlock code={HASH_COMBINES} lang="ts" />
                        <p>
                            Both kinds can sit in one class on different fields, but it
                            reads confusingly — pick one style per class, ideally per
                            codebase.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — the one-word field ---------- */}
            <PartHeading kicker="part 3">Parameter Properties</PartHeading>
            <div>
                <DocSection title="the constructor shortcut">
                    <p>
                        <Term>
                            A modifier in front of a constructor parameter turns it into
                            a field.
                        </Term>
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>written out</Term>
                                </p>
                                <CodeBlock code={WRITTEN_OUT} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>parameter property</Term>
                                </p>
                                <CodeBlock code={PARAMETER_PROPERTY} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>One word replaces a declaration and an assignment.</p>
                    <p>
                        Any modifier triggers it — <Code>public</Code>,{" "}
                        <Code>private</Code>, <Code>protected</Code>,{" "}
                        <Code>readonly</Code>, alone or combined — and defaults work:
                    </p>
                    <CodeBlock code={ANY_MODIFIER} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · without a modifier it stays a parameter"
                    >
                        <p>Only the parameters that carry a modifier become fields:</p>
                        <CodeBlock code={NO_MODIFIER} lang="ts" />
                        <p>Forget the modifier and the field silently does not exist.</p>
                    </Callout>
                </DocSection>

                <DocSection title="erasable syntax">
                    <p>
                        Almost all of TypeScript is erased — delete the types and what
                        remains is the JavaScript. Parameter properties are one of the
                        exceptions. Compile two versions of the same class, starting
                        with the written-out one, <Code>written.ts</Code>:
                    </p>
                    <CodeBlock code={WRITTEN_TS} lang="ts" />
                    <p>
                        and the parameter-property one, <Code>shortcut.ts</Code>:
                    </p>
                    <CodeBlock code={SHORTCUT_TS} lang="ts" />
                    <p>tsc emits exactly the same JavaScript for both:</p>
                    <CodeBlock code={TSC_EMIT} lang="js" />
                    <p>
                        For <Code>written.ts</Code> the compiler only DELETED things —{" "}
                        <Code>: string</Code>, twice. For <Code>shortcut.ts</Code> it
                        ADDED things you never wrote: the <Code>name;</Code> field and
                        the <Code>this.name = name;</Code> line, both from the single
                        word <Code>public</Code>.
                    </p>
                    <p>
                        <Term>Why that matters: type stripping.</Term> Node.js can run{" "}
                        <Code>.ts</Code> files directly by erasing type syntax and
                        running what is left — no compiler involved. The real output:
                    </p>
                    <CodeBlock code={NODE_WRITTEN} lang="text" />
                    <p>and:</p>
                    <CodeBlock code={NODE_SHORTCUT} lang="text" />
                    <p>Node must refuse, because erasing alone would produce this:</p>
                    <CodeBlock code={STRIPPED} lang="js" />
                    <p>which prints:</p>
                    <CodeBlock code={STRIPPED_OUTPUT} lang="text" />
                    <p>
                        The meaning of <Code>public</Code> — create and assign a field —
                        cannot be expressed by deleting characters.
                    </p>

                    <Callout severity="note" label="note · erasableSyntaxOnly">
                        <p>
                            TypeScript 5.8 added a flag that makes tsc reject every
                            feature needing generated code, so the problem shows in the
                            editor before anything runs:
                        </p>
                        <CodeBlock code={ERASABLE_FLAG} lang="jsonc" />
                        <p>With it on:</p>
                        <CodeBlock code={ERASABLE_ERROR} lang="ts" />
                        <p>
                            <Code>enum</Code> is refused for the same reason — it also
                            emits code, the object shown on First Types.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · which form to write">
                        <p>
                            In a project compiled by tsc, a bundler or Next.js,
                            parameter properties are fine and common — Angular and
                            NestJS use them everywhere. In a project that runs
                            TypeScript by type stripping, or enables{" "}
                            <Code>erasableSyntaxOnly</Code>, write the fields out. When
                            in doubt, the written-out form works everywhere.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — contracts and templates ---------- */}
            <PartHeading kicker="part 4">implements &amp; abstract</PartHeading>
            <div>
                <DocSection title="implements">
                    <p>
                        <Term>
                            <Code>implements</Code> says &ldquo;this class promises the
                            shape of this type&rdquo;
                        </Term>
                        , and the compiler holds it to that:
                    </p>
                    <CodeBlock code={IMPLEMENTS} lang="ts" />
                    <p>Forget a member and the error points at the class:</p>
                    <CodeBlock code={IMPLEMENTS_MISSING} lang="ts" />
                    <p>Several contracts at once, separated by commas:</p>
                    <CodeBlock code={IMPLEMENTS_SEVERAL} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · implements only checks — it gives the class nothing"
                    >
                        <p>
                            The interface does not fill in types for the class; every
                            member is still typed by hand:
                        </p>
                        <CodeBlock code={IMPLEMENTS_NO_TYPES} lang="ts" />
                        <p>
                            Unlike a callback getting its parameters from its slot
                            (contextual typing, Functions), the class is checked on its
                            own first, and only then compared with the interface.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            <Code>implements</Code> is optional for compatibility.
                        </Term>{" "}
                        Structural typing (Assignability) still applies — a class with
                        the right shape fits a <Code>Logger</Code> slot without the
                        keyword:
                    </p>
                    <CodeBlock code={STRUCTURAL_CLASS} lang="ts" />
                    <p>
                        What the keyword buys is WHERE the error lands: on the class,
                        instead of wherever the object is first used as a{" "}
                        <Code>Logger</Code> — the same reason exported functions
                        annotate their return type.
                    </p>
                    <p>
                        <Term>Extra members are allowed, and the class keeps its full type:</Term>
                    </p>
                    <CodeBlock code={EXTRA_MEMBERS} lang="ts" />

                    <Callout
                        severity="note"
                        label="note · implements, an annotation and a literal check differently"
                    >
                        <p>
                            An annotation sets the variable&apos;s type to the minimum —
                            extras allowed in, then hidden:
                        </p>
                        <CodeBlock code={ANNOTATION_HIDES} lang="ts" />
                        <p>
                            Only an object literal written right there rejects extras —
                            the excess property check from Assignability:
                        </p>
                        <CodeBlock code={LITERAL_REJECTS} lang="ts" />
                        <p>The three side by side:</p>
                        <GridTable
                            cols="grid-cols-[max-content_1fr_1fr_1fr]"
                            head={["", "checks", "extras allowed", "type you see"]}
                            rows={[
                                ["class X implements Logger", "the class", "yes", "stays X"],
                                ["const v: Logger = new X()", "the value", "yes", "becomes Logger"],
                                ["const v: Logger = { … }", "the literal", "no", "becomes Logger"],
                            ]}
                        />
                    </Callout>
                </DocSection>

                <DocSection title="abstract classes and override">
                    <p>
                        <Term>
                            An abstract class is a base class never meant to be used on
                            its own.
                        </Term>{" "}
                        It provides shared code and declares the parts each subclass
                        must supply:
                    </p>
                    <CodeBlock code={ABSTRACT_SHAPE} lang="ts" />
                    <p>
                        <Term>You cannot create one directly:</Term>
                    </p>
                    <CodeBlock code={ABSTRACT_NEW} lang="ts" />
                    <p>
                        <Term>Every subclass must fill in the abstract members:</Term>
                    </p>
                    <CodeBlock code={ABSTRACT_SUBCLASSES} lang="ts" />
                    <p>
                        Now <Code>describe()</Code> works on every shape, though{" "}
                        <Code>Shape</Code> never knew how to compute an area:
                    </p>
                    <CodeBlock code={DESCRIBE_CALL} lang="ts" />
                    <p>
                        <Term>Abstract class or interface?</Term>
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "interface", "abstract class"]}
                        rows={[
                            ["shared method bodies", "no — shape only", "yes"],
                            ["constructor and fields", "no", "yes"],
                            ["exists at runtime", "no — erased", "yes — a real class"],
                            ["how many per class", "many (implements A, B)", "one (extends)"],
                        ]}
                    />
                    <p>
                        Use an interface when you only need a contract; an abstract
                        class when subclasses really share code. A class extends only
                        one parent — do not spend that slot on what an interface could
                        do.
                    </p>
                    <p>
                        <Term>
                            <Code>override</Code> marks a method that replaces the
                            parent&apos;s.
                        </Term>{" "}
                        With <Code>noImplicitOverride</Code> on, it is mandatory and
                        catches two opposite mistakes:
                    </p>
                    <CodeBlock code={OVERRIDE} lang="ts" />
                    <p>
                        The first protects you when the parent changes: rename a base
                        method and every <Code>override</Code> that no longer matches
                        breaks, instead of silently becoming a new, never-called
                        method. The second stops anyone replacing inherited behaviour
                        by accident.
                    </p>

                    <Callout severity="tip" label="tip · turn on noImplicitOverride">
                        <p>
                            It is not part of <Code>strict</Code>, so it must be enabled
                            separately:
                        </p>
                        <CodeBlock code={NO_IMPLICIT_OVERRIDE} lang="jsonc" />
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — the name in both worlds ---------- */}
            <PartHeading kicker="part 5">Classes as Types</PartHeading>
            <div>
                <DocSection title="one name, two things">
                    <p>
                        First Types said <Code>class</Code> lives in both worlds.
                        Precisely: <Code>class User</Code> creates two things with one
                        name:
                    </p>
                    <CodeBlock code={TWO_THINGS} lang="ts" />
                    <p>
                        <Term>
                            A type, <Code>User</Code>
                        </Term>{" "}
                        — the shape of an instance (<Code>name</Code>,{" "}
                        <Code>greet</Code>), written after a colon.{" "}
                        <Term>
                            A value, <Code>User</Code>
                        </Term>{" "}
                        — the class itself, the constructor you call with{" "}
                        <Code>new</Code>, which carries the statics and the
                        constructor&apos;s parameters.
                    </p>
                    <p>They differ, and mixing them up is an error:</p>
                    <CodeBlock code={INSTANCE_VS_CLASS} lang="ts" />
                    <p>
                        <Term>
                            To type the class itself, use <Code>typeof User</Code>
                        </Term>{" "}
                        — the type of the constructor value:
                    </p>
                    <CodeBlock code={TYPEOF_CLASS} lang="ts" />
                    <p>A function that receives a class and builds instances from it:</p>
                    <CodeBlock code={CLASS_PARAMETER} lang="ts" />
                    <p>
                        To accept ANY class with a matching constructor, describe its
                        shape with a construct signature:
                    </p>
                    <CodeBlock code={CONSTRUCT_SIGNATURE} lang="ts" />
                    <p>
                        Read <Code>{"new (name: string) => T"}</Code> as &ldquo;something
                        callable with <Code>new</Code> and a string, producing a{" "}
                        <Code>T</Code>&rdquo;. The angle brackets are a generic
                        (Generics chapter). The reverse direction has a built-in
                        utility: <Code>{"InstanceType<typeof User>"}</Code> is{" "}
                        <Code>User</Code> (Utility Types).
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the instance type is structural, instanceof is not"
                    >
                        <p>
                            <Code>User</Code> as a type is just a shape, so a plain
                            object with the right members fits it — but it was never
                            made by <Code>new User</Code>:
                        </p>
                        <CodeBlock code={FAKE_INSTANCE} lang="ts" />
                        <p>
                            <Code>x: User</Code> does not guarantee{" "}
                            <Code>x instanceof User</Code>. When code relies on{" "}
                            <Code>instanceof</Code>, the value must really come from the
                            constructor; a <Code>#private</Code> field closes the gap,
                            since no plain object can have one (Assignability, part 1).
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="when to use a class">
                    <p>
                        Classes are fully supported, but in modern TypeScript, React
                        and Next code they are the exception, not the default.{" "}
                        <Term>Most data is better as a plain object plus functions.</Term>
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>class</Term>
                                </p>
                                <CodeBlock code={AS_CLASS} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>type + function</Term>
                                </p>
                                <CodeBlock code={AS_TYPE} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Both type-check the same. The difference appears when data
                        leaves memory — sent over the network, saved, cached, or passed
                        from a Server Component to a Client Component.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · methods do not survive JSON"
                    >
                        <p>JSON carries only plain data:</p>
                        <CodeBlock code={JSON_LOSES_METHODS} lang="ts" />
                        <p>
                            The type says <Code>User</Code>, the value is{" "}
                            <Code>{"{ name, email }"}</Code> with no methods, and{" "}
                            <Code>received instanceof User</Code> is false. With the
                            type + function version there is nothing to lose —{" "}
                            <Code>label(received)</Code> works on whatever arrives.
                            That is also why Next.js only lets plain objects cross from
                            server to client components, not class instances.
                        </p>
                    </Callout>

                    <p>
                        <Term>Where classes are the right tool:</Term> long-lived
                        objects with internal state that stays in memory — a cache, a
                        connection, a client SDK (<Code>new Redis()</Code>,{" "}
                        <Code>new PrismaClient()</Code>) — where <Code>#private</Code>{" "}
                        fields and methods guarding their own rules pay off; frameworks
                        built around them, like NestJS and Angular; and{" "}
                        <Term>custom errors</Term>, because <Code>instanceof</Code> is
                        how <Code>catch</Code> tells them apart:
                    </p>
                    <CodeBlock code={CUSTOM_ERROR} lang="ts" />

                    <Callout
                        severity="tip"
                        label="tip · data travels as types, things that live are classes"
                    >
                        <p>
                            Data that moves between server, client, storage and network
                            is a type plus functions. Objects that live, own state and
                            enforce their own rules are classes. In React, components
                            and hooks are functions; class components are legacy you
                            will only read.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
