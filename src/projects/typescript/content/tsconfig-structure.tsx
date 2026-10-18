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
    // --- part 1 (The File's Shape) ---
    // inline `note · JSON with comments`
    "what-tsconfig-decides": ["note"],
    // inline `note · strict is on by default`
    "include-and-the-default": ["note"],
    // inline `trap · a child include replaces the base` + `tip · npx tsc --showConfig`
    extends: ["trap", "tip"],
    // inline `trap · a file argument ignores tsconfig`
    "tsc-with-a-file-name": ["trap"],

    // --- part 2 (The Strict Family) ---
    // inline `note · this inside a class is never the problem`
    "what-strict-turns-on": ["note"],
    // inline `tip · prefer fixing to switching off`
    "one-flag-off-strict-still-on": ["tip"],
    // inline `tip · turn it on in new projects`
    nouncheckedindexedaccess: ["tip"],
    // "flags-outside-strict" carries no callout, so no entry.

    // --- part 3 (paths) ---
    // inline `note · baseUrl is deprecated`
    "an-alias-for-src": ["note"],
    // inline `trap · tsc passing does not mean it runs` + `note · the .ts in Node imports`
    "the-runtime-does-not-read-paths": ["trap", "note"],

    // --- part 4 (Reading a Real tsconfig) ---
    // inline `tip · mark type-only imports and exports`
    "checking-and-who-compiles": ["tip"],
    // inline `note · esModuleInterop: false is deprecated`
    modules: ["note"],
    // inline `trap · lib can promise what the runtime lacks`
    "environment-and-jsx": ["trap"],
    // inline `trap · .next types exist only after Next runs` + `tip · the one line worth adding here`
    "next-js-lines": ["trap", "tip"],
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

// The grid table classes.tsx uses, with one addition: every cell may break
// anywhere ([overflow-wrap:anywhere]), because this page's first columns hold
// whole config lines — ".next/dev/types/**/*.ts" must wrap inside its cell, not
// widen the page at 375px. The wide-key tables pass proportional `cols`.
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
    const cell = "min-w-0 px-3 py-2 [overflow-wrap:anywhere]";
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

// Two columns for a table whose first column holds whole config lines.
const WIDE_KEYS = "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]";

// PAGE RULES — those of generics-basics.tsx, adapted to a config page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it and read by the sentence below it. Two fragments never touch.
// 2. ERROR HOUSE STYLE in ts fragments: a compiler error is a comment on the
//    line BELOW the offending code, prefixed `// ❌ ` and written in PLAIN
//    WORDS. Where a contrast helps, a passing line ends in `// ✅`.
//    EXCEPTION — this page teaches real output, so every `text` block is REAL
//    tsc 6.0 or Node output, verbatim (long local paths shortened to ".../").
//    Never reword them.
// 3. Inferred types are a trailing comment on the same line.
// 4. Traps are inline Callouts; there is no traps section.
// 5. Every fragment declares its language: json for config files (no comments
//    — a file name goes in the sentence above), bash for commands, text for
//    compiler and runtime output, ts for TypeScript.
// 6. Part 4 quotes the repo's tsconfig.json and next-env.d.ts EXACTLY. When
//    either file changes, update the quote.

// ===================================================================
// part 1 — the file's shape
// ===================================================================

const INDEX_TS = `function greet(name: string) {
    return "hi " + name;
}

console.log(greet(42));`;

const EMPTY_CONFIG = `{}`;

const RUN_TSC = `npx tsc`;

const EMPTY_OUT = `src/index.ts(4,19): error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.`;

const NO_EMIT = `{
    "compilerOptions": {
        "noEmit": true
    }
}`;

const STRAY_NOTES = `function log(x) { console.log(x); }`;

const STRAY_OUT = `notes.ts(1,14): error TS7006: Parameter 'x' implicitly has an 'any' type.`;

const INCLUDE_SRC = `{
    "compilerOptions": {
        "noEmit": true
    },
    "include": ["src"]
}`;

const LIST_FILES = `npx tsc --listFilesOnly`;

const BASE_CONFIG = `{
    "compilerOptions": {
        "noEmit": true,
        "strict": false
    },
    "include": ["src"]
}`;

const CHILD_CONFIG = `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "strict": true
    }
}`;

const CHILD_INCLUDE = `{
    "extends": "./tsconfig.base.json",
    "compilerOptions": {
        "strict": true
    },
    "include": ["scripts"]
}`;

const CHILD_INCLUDE_OUT = `scripts/seed.ts(2,7): error TS2322: Type 'string' is not assignable to type 'number'.`;

const FILE_ARG = `npx tsc src/index.ts`;

const FILE_ARG_OUT = `error TS5112: tsconfig.json is present but will not be loaded if files are specified on commandline. Use '--ignoreConfig' to skip this error.`;

const ONE_CONFIG = `{
    "extends": "./tsconfig.json",
    "files": ["src/index.ts"],
    "include": []
}`;

const ONE_RUN = `npx tsc -p tsconfig.one.json`;

const IGNORE_RUN = `npx tsc --ignoreConfig --noEmit src/index.ts`;

// ===================================================================
// part 2 — the strict family
// ===================================================================

const SHOW_STRICT = `npx tsc --showConfig --strict false`;

const S_IMPLICIT_ANY = `function double(x) { return x * 2; }
// ❌ x has no type, so it silently became any`;

const S_IMPLICIT_THIS = `function getName() { return this.name; }
// ❌ a plain function can be called from anywhere — this is unknown`;

const S_NULL = `const found = ["sam"].find((n) => n.startsWith("z"));
found.toUpperCase();
// ❌ found may be undefined — find can return nothing`;

const S_FUNCTION_TYPES = `type OnText = (value: string) => void;
const handler: OnText = (value: "dark") => {};
// ❌ OnText may get any string, the handler accepts only "dark"`;

const S_BIND_CALL = `function add(a: number, b: number) { return a + b; }
add.call(null, 1, "2");
// ❌ call checks arguments like a normal call — "2" is not a number`;

const S_PROPERTY_INIT = `class User { name: string; }
// ❌ name is never set, so it would be undefined`;

const S_ITERATOR = `const prices = new Map<string, number>();
const firstPrice = prices.values().next().value;   // number | undefined
firstPrice.toFixed(2);
// ❌ a finished iterator returns value undefined`;

const S_CATCH = `try { JSON.parse("{"); } catch (e) { e.message; }
// ❌ anything can be thrown — e is unknown`;

const NULL_CRASH = `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`;

const THIS_PARAMETER = `function getName(this: { name: string }) {
    return this.name;   // ✅
}

getName.call({ name: "alex" });   // ✅
getName();
// ❌ called alone, this is not a { name: string }`;

const ONE_OFF = `{
    "compilerOptions": {
        "noEmit": true,
        "strict": true,
        "useUnknownInCatchVariables": false
    },
    "include": ["src"]
}`;

const LOOKUP = `const users = ["sam", "alex"];
const third = users[2];                 // string — really undefined

const stock: Record<string, number> = { p1: 4 };
const p9 = stock["p9"];                 // number — really undefined

export {};

console.log(p9 + 1);
console.log(third.toUpperCase());`;

const LOOKUP_RUN = `NaN
TypeError: Cannot read properties of undefined (reading 'toUpperCase')`;

const UNCHECKED_OUT = `src/lookup.ts(9,13): error TS18048: 'p9' is possibly 'undefined'.
src/lookup.ts(10,13): error TS18048: 'third' is possibly 'undefined'.`;

const UNCHECKED_FIX = `third?.toUpperCase() ?? "no third user";   // ✅
(stock["p9"] ?? 0) + 1;                    // ✅ 1`;

const O_RETURNS = `function label(n: number): string | undefined {
    if (n > 0) return "positive";
}
// ❌ the other path falls off the end — write return undefined on purpose`;

const O_FALLTHROUGH = `switch (plan) {
    case "free":
        p = 0;
        // ❌ no break — "pro" runs too
    case "pro":
        p = 9;
}`;

const O_OVERRIDE = `class Base { save() {} }
class Child extends Base { save() {} }
// ❌ replacing a parent method must say override`;

const O_EXACT = `type Settings = { theme?: "dark" | "light" };
const s: Settings = { theme: undefined };
// ❌ optional means the key may be missing — not that it may hold undefined`;

const O_UNUSED = `function greet(name: string, age: number) {
    const unused = 1;
    // ❌ declared but never read
    return name;
}
// ❌ age is never used`;

// ===================================================================
// part 3 — paths
// ===================================================================

const RELATIVE_IMPORT = `import { formatPrice } from "../../utils/money/format";`;

const ALIAS_IMPORT = `import { formatPrice } from "@/utils/money/format";`;

const ALIAS_OUT = `src/features/cart/summary.ts(1,29): error TS2307: Cannot find module '@/utils/money/format' or its corresponding type declarations.`;

const PATHS_CONFIG = `{
    "compilerOptions": {
        "noEmit": true,
        "strict": true,
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src"]
}`;

const BASEURL_CONFIG = `{
    "compilerOptions": {
        "noEmit": true,
        "strict": true,
        "baseUrl": ".",
        "paths": { "@/*": ["./src/*"] }
    },
    "include": ["src"]
}`;

const BASEURL_OUT = `tsconfig.json(5,9): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
  Visit https://aka.ms/ts6 for migration information.`;

const NODE_RUN = `node src/features/cart/summary.ts`;

const NODE_OUT = `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@/utils' imported from .../src/features/cart/summary.ts`;

const PKG_IMPORTS = `{
    "type": "module",
    "imports": {
        "#src/*": "./src/*"
    }
}`;

const HASH_IMPORT = `import { formatPrice } from "#src/utils/money/format.ts";

console.log(formatPrice(9.5));`;

const HASH_OUT = `€9.50`;

// ===================================================================
// part 4 — reading a real tsconfig
// ===================================================================

// The repo's tsconfig.json, EXACTLY (rule 6) — two-space indent and all.
const PROJECT_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}`;

const TYPES_TS = `export type User = { id: number };`;

const BARREL_TS = `export { User } from "./types";`;

const ISOLATED_OUT = `src/barrel.ts(1,10): error TS1205: Re-exporting a type when 'isolatedModules' is enabled requires using 'export type'.`;

const EXPORT_TYPE = `export type { User } from "./types";      // ✅ a type — delete this line`;

const IMPORT_TYPE = `import type { User } from "./types";       // the whole import is types
import { formatPrice, type User } from "@/utils/money/format";   // only User is removed`;

const DATA_JSON = `{ "name": "x", "version": "1.0.0" }`;

const USE_JSON = `import pkg from "./data.json";

const v: number = pkg.version;
// ❌ version is a string in the file`;

const ENV_TS = `export const last = [1, 2, 3].at(-1);
export const title = document.title;`;

const LIB_OUT = `src/env.ts(1,31): error TS2550: Property 'at' does not exist on type 'number[]'. Do you need to change your target library? Try changing the 'lib' compiler option to 'es2022' or later.
src/env.ts(2,22): error TS2584: Cannot find name 'document'. Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.`;

// The repo's next-env.d.ts, EXACTLY (rule 6).
const NEXT_ENV = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.`;

export function TsconfigStructureDocs() {
    return (
        <>
            {/* Page lead — before the first divider, as on the earlier pages. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Code>tsconfig.json</Code> answers two questions for the compiler
                    and your editor:{" "}
                    <Term>
                        how files are checked, and which files belong to the project.
                    </Term>{" "}
                    This page builds one up option by option, using real TypeScript 6
                    output — the version where <Code>strict</Code> became the default
                    and <Code>baseUrl</Code> was deprecated.
                </p>
                <p>
                    It ends by reading this project&apos;s own config line by line.
                    The deeper story of <Code>target</Code>, <Code>module</Code> and{" "}
                    <Code>moduleResolution</Code> is left for a later version; here
                    each gets the one sentence you need to read a config.
                </p>
            </div>

            {/* ---------- part 1 — the file's shape ---------- */}
            <PartHeading kicker="part 1">The File&apos;s Shape</PartHeading>
            <div>
                <DocSection title="what tsconfig decides">
                    <p>
                        A config answers two questions — <Term>how</Term> to check (
                        <Code>compilerOptions</Code>) and <Term>which files</Term> (
                        <Code>include</Code> / <Code>exclude</Code> /{" "}
                        <Code>files</Code>) — plus <Code>extends</Code> for reuse:
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["key", "what it does"]}
                        rows={[
                            ["compilerOptions", "how to check and compile — almost everything lives here"],
                            ["include", 'which files, as glob patterns ("src", "**/*.ts")'],
                            ["exclude", "removes files from what include matched"],
                            ["files", "an exact list of files, no globs"],
                            ["extends", "start from another config, then override it"],
                        ]}
                    />
                    <p>
                        <Term>Even an empty config does two jobs.</Term> Take a type
                        error in <Code>src/index.ts</Code>:
                    </p>
                    <CodeBlock code={INDEX_TS} lang="ts" />
                    <p>
                        and a <Code>tsconfig.json</Code> that holds nothing at all:
                    </p>
                    <CodeBlock code={EMPTY_CONFIG} lang="json" />
                    <p>Then run the compiler:</p>
                    <CodeBlock code={RUN_TSC} lang="bash" />
                    <p>It prints the error:</p>
                    <CodeBlock code={EMPTY_OUT} lang="text" />
                    <p>
                        — and it also writes <Code>src/index.js</Code> next to the
                        source. By default tsc checks <Term>and</Term> emits
                        JavaScript, even when there are errors. <Code>noEmit</Code>{" "}
                        keeps only the check:
                    </p>
                    <CodeBlock code={NO_EMIT} lang="json" />
                    <p>
                        Next.js projects always have <Code>noEmit</Code> — the
                        framework compiles, tsc only checks (part 4).
                    </p>

                    <Callout severity="note" label="note · JSON with comments">
                        <p>
                            <Code>tsconfig.json</Code> accepts <Code>{"//"}</Code>{" "}
                            comments and trailing commas (<Code>tsc --init</Code> writes
                            both) — <Code>JSON.parse</Code> would reject it; it is
                            TypeScript&apos;s own format.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="include and the default">
                    <p>
                        <Term>
                            Without <Code>include</Code> or <Code>files</Code>, tsc takes
                            every <Code>.ts</Code> file in the folder tree
                        </Term>{" "}
                        (except <Code>node_modules</Code> and the output folder). A stray{" "}
                        <Code>notes.ts</Code> in the project root:
                    </p>
                    <CodeBlock code={STRAY_NOTES} lang="ts" />
                    <p>is checked too:</p>
                    <CodeBlock code={STRAY_OUT} lang="text" />
                    <p>
                        <Code>include</Code> limits the project to the folders you
                        name:
                    </p>
                    <CodeBlock code={INCLUDE_SRC} lang="json" />
                    <p>To see exactly which files are in, ask tsc for the list:</p>
                    <CodeBlock code={LIST_FILES} lang="bash" />
                    <p>
                        It prints your files plus TypeScript&apos;s own{" "}
                        <Code>lib</Code> files — <Code>notes.ts</Code> is gone.
                    </p>

                    <Callout severity="note" label="note · strict is on by default">
                        <p>
                            The implicit-any error appeared without{" "}
                            <Code>{'"strict": true'}</Code> — since TypeScript 6,{" "}
                            <Code>strict</Code> defaults to on. Writing it explicitly is
                            still good practice for readers of the config.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="extends">
                    <p>
                        <Term>A config can start from another one.</Term> A base, in{" "}
                        <Code>tsconfig.base.json</Code>:
                    </p>
                    <CodeBlock code={BASE_CONFIG} lang="json" />
                    <p>
                        and a child that extends it, in <Code>tsconfig.json</Code>:
                    </p>
                    <CodeBlock code={CHILD_CONFIG} lang="json" />
                    <p>
                        <Term>
                            Rule 1 — <Code>compilerOptions</Code> merge key by key:
                        </Term>{" "}
                        the child&apos;s <Code>strict</Code> wins, <Code>noEmit</Code>{" "}
                        still comes from the base.{" "}
                        <Term>Rule 2 — lists are replaced.</Term> Adding an{" "}
                        <Code>include</Code> to the child, intending to add a folder:
                    </p>
                    <CodeBlock code={CHILD_INCLUDE} lang="json" />
                    <p>makes <Code>src</Code> disappear — only the script is checked:</p>
                    <CodeBlock code={CHILD_INCLUDE_OUT} lang="text" />
                    <p>
                        <Code>--listFilesOnly</Code> shows only{" "}
                        <Code>scripts/seed.ts</Code>. To keep both, list both:{" "}
                        <Code>{'"include": ["src", "scripts"]'}</Code>. Typical uses of{" "}
                        <Code>extends</Code>: a shared base in a monorepo, and presets
                        like <Code>@tsconfig/node22</Code>.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · a child include replaces the base"
                    >
                        <p>
                            <Code>include</Code>, <Code>exclude</Code> and{" "}
                            <Code>files</Code> are never merged — writing any of them in
                            the child discards the base&apos;s list.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · npx tsc --showConfig">
                        <p>
                            It prints the final merged config and the file list — the
                            first thing to run when a setting &ldquo;does not
                            work&rdquo;.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="tsc with a file name">
                    <p>
                        <Term>Passing a file skips the config entirely</Term>, and
                        TypeScript 6 refuses instead of doing it silently:
                    </p>
                    <CodeBlock code={FILE_ARG} lang="bash" />
                    <p>prints:</p>
                    <CodeBlock code={FILE_ARG_OUT} lang="text" />
                    <p>
                        The right ways are <Code>npx tsc</Code> (which reads{" "}
                        <Code>./tsconfig.json</Code>) or{" "}
                        <Code>{"npx tsc -p <config>"}</Code>. The editor always uses{" "}
                        <Code>tsconfig.json</Code>.
                    </p>
                    <p>
                        <Term>To check one file anyway, with your options</Term>, write
                        a small config that extends yours — here{" "}
                        <Code>tsconfig.one.json</Code>:
                    </p>
                    <CodeBlock code={ONE_CONFIG} lang="json" />
                    <p>and point tsc at it:</p>
                    <CodeBlock code={ONE_RUN} lang="bash" />
                    <p>
                        <Code>{'"include": []'}</Code> is required, or the inherited{" "}
                        <Code>include</Code> adds its files back. Imported files are
                        still checked — tsc always follows imports.{" "}
                        <Term>With default options instead</Term>, skip the config on
                        purpose:
                    </p>
                    <CodeBlock code={IGNORE_RUN} lang="bash" />
                    <p>
                        Every option you need then has to be passed as a flag; without{" "}
                        <Code>--noEmit</Code> it writes <Code>index.js</Code>.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · a file argument ignores tsconfig"
                    >
                        <p>
                            Older versions did this silently — a file could pass on the
                            command line and fail in the editor.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the strict family ---------- */}
            <PartHeading kicker="part 2">The Strict Family</PartHeading>
            <div>
                <DocSection title="what strict turns on">
                    <p>
                        <Term>
                            <Code>strict</Code> is a shortcut for eight flags
                        </Term>
                        ; this command lists them:
                    </p>
                    <CodeBlock code={SHOW_STRICT} lang="bash" />
                    <p>
                        One example each. All of them compile silently with{" "}
                        <Code>{'"strict": false'}</Code>; with{" "}
                        <Code>{'"strict": true'}</Code> each gives the error shown.
                    </p>
                    <p>
                        <Term>noImplicitAny</Term>
                    </p>
                    <CodeBlock code={S_IMPLICIT_ANY} lang="ts" />
                    <p>
                        <Term>noImplicitThis</Term>
                    </p>
                    <CodeBlock code={S_IMPLICIT_THIS} lang="ts" />
                    <p>
                        <Term>strictNullChecks</Term>
                    </p>
                    <CodeBlock code={S_NULL} lang="ts" />
                    <p>
                        <Term>strictFunctionTypes</Term>
                    </p>
                    <CodeBlock code={S_FUNCTION_TYPES} lang="ts" />
                    <p>
                        <Term>strictBindCallApply</Term>
                    </p>
                    <CodeBlock code={S_BIND_CALL} lang="ts" />
                    <p>
                        <Term>strictPropertyInitialization</Term>
                    </p>
                    <CodeBlock code={S_PROPERTY_INIT} lang="ts" />
                    <p>
                        <Term>strictBuiltinIteratorReturn</Term>
                    </p>
                    <CodeBlock code={S_ITERATOR} lang="ts" />
                    <p>
                        <Term>useUnknownInCatchVariables</Term>
                    </p>
                    <CodeBlock code={S_CATCH} lang="ts" />
                    <p>
                        Without <Code>strict</Code>, the <Code>strictNullChecks</Code>{" "}
                        example compiles — and crashes when it runs:
                    </p>
                    <CodeBlock code={NULL_CRASH} lang="text" />
                    <p>
                        In daily work, <Code>strictNullChecks</Code> matters far more
                        than the rest, then <Code>noImplicitAny</Code>,{" "}
                        <Code>useUnknownInCatchVariables</Code> and{" "}
                        <Code>strictPropertyInitialization</Code> — keep all eight on.
                    </p>

                    <Callout
                        severity="note"
                        label="note · this inside a class is never the problem"
                    >
                        <p>
                            Class methods and object-literal methods already type{" "}
                            <Code>this</Code>; the flag fires for standalone functions
                            (old constructor functions, shared helpers). The fix is a
                            fake first parameter, erased at runtime:
                        </p>
                        <CodeBlock code={THIS_PARAMETER} lang="ts" />
                        <p>
                            DOM callbacks written as{" "}
                            <Code>{"function () { this… }"}</Code> are already typed by
                            the DOM types; in modern code, classes replace constructor
                            functions.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="one flag off, strict still on">
                    <p>
                        <Term>An explicit flag always overrides strict&apos;s default</Term>
                        , in any order:
                    </p>
                    <CodeBlock code={ONE_OFF} lang="json" />
                    <p>
                        The <Code>catch</Code> error from the previous section
                        disappears; the other seven strict errors stay. The typical use
                        is migrating an old codebase: <Code>strict</Code> on, one or two
                        noisy flags off — <Code>strictPropertyInitialization</Code> with
                        frameworks that set fields, <Code>useUnknownInCatchVariables</Code>{" "}
                        in old catch blocks — and fixed later.
                    </p>

                    <Callout severity="tip" label="tip · prefer fixing to switching off">
                        <p>
                            For <Code>catch</Code> the fix is one line:{" "}
                            <Code>e instanceof Error ? e.message : String(e)</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="noUncheckedIndexedAccess">
                    <p>
                        <Term>
                            <Code>strict</Code> still trusts every index read.
                        </Term>{" "}
                        In <Code>src/lookup.ts</Code>:
                    </p>
                    <CodeBlock code={LOOKUP} lang="ts" />
                    <p>
                        With <Code>strict</Code> only, it compiles; running it prints
                        and crashes:
                    </p>
                    <CodeBlock code={LOOKUP_RUN} lang="text" />
                    <p>
                        With <Code>{'"noUncheckedIndexedAccess": true'}</Code>, every
                        index read adds <Code>| undefined</Code>:
                    </p>
                    <CodeBlock code={UNCHECKED_OUT} lang="text" />
                    <p>The fixes handle the missing case:</p>
                    <CodeBlock code={UNCHECKED_FIX} lang="ts" />
                    <p>
                        <Code>for…of</Code> and <Code>forEach</Code> are unaffected —
                        they only visit elements that exist.
                    </p>

                    <Callout severity="tip" label="tip · turn it on in new projects">
                        <p>
                            It is not part of <Code>strict</Code> (it adds checks to much
                            existing code), but <Code>tsc --init</Code> enables it in
                            TypeScript 6 — and Next.js&apos;s default config does not, so
                            add it yourself. See also the index signature trap on
                            Objects &amp; Aliases.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="flags outside strict">
                    <p>
                        <Term>Five more flags, each silent under plain strict.</Term>{" "}
                        With the flag on, each example gives the error shown.
                    </p>
                    <p>
                        <Term>noImplicitReturns</Term>
                    </p>
                    <CodeBlock code={O_RETURNS} lang="ts" />
                    <p>
                        <Term>noFallthroughCasesInSwitch</Term>
                    </p>
                    <CodeBlock code={O_FALLTHROUGH} lang="ts" />
                    <p>
                        <Term>noImplicitOverride</Term> (Classes)
                    </p>
                    <CodeBlock code={O_OVERRIDE} lang="ts" />
                    <p>
                        <Term>exactOptionalPropertyTypes</Term>
                    </p>
                    <CodeBlock code={O_EXACT} lang="ts" />
                    <p>
                        <Term>noUnusedLocals / noUnusedParameters</Term>
                    </p>
                    <CodeBlock code={O_UNUSED} lang="ts" />
                    <p>Which to turn on in a new project:</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["flag", "for a new project"]}
                        rows={[
                            ["noUncheckedIndexedAccess", "yes"],
                            ["noImplicitOverride", "yes, if you use classes"],
                            ["noFallthroughCasesInSwitch", "yes — cheap"],
                            ["noImplicitReturns", "yes — cheap"],
                            ["exactOptionalPropertyTypes", "optional — noisy with libraries"],
                            ["noUnusedLocals/Parameters", "leave to ESLint, as warnings"],
                        ]}
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — paths ---------- */}
            <PartHeading kicker="part 3">paths</PartHeading>
            <div>
                <DocSection title="an alias for src">
                    <p>
                        Deep folders produce imports like this one, which mean counting
                        folders — and every <Code>../</Code> breaks when a file moves:
                    </p>
                    <CodeBlock code={RELATIVE_IMPORT} lang="ts" />
                    <p>
                        <Term>An alias alone fails</Term> — written in{" "}
                        <Code>src/features/cart/summary.ts</Code>:
                    </p>
                    <CodeBlock code={ALIAS_IMPORT} lang="ts" />
                    <p>it looks like an npm package, and tsc finds none:</p>
                    <CodeBlock code={ALIAS_OUT} lang="text" />
                    <p>
                        <Term>
                            <Code>paths</Code> teaches tsc the alias:
                        </Term>
                    </p>
                    <CodeBlock code={PATHS_CONFIG} lang="json" />
                    <p>
                        Read it as &ldquo;anything starting with <Code>@/</Code> → look
                        in <Code>./src/</Code>&rdquo;; the <Code>*</Code> is copied over.
                        Paths are relative to the tsconfig, so the alias works from any
                        folder. <Code>@/</Code> is a convention (Next.js);{" "}
                        <Code>~/</Code> or <Code>@app/</Code> work the same. The value is
                        an array of fallback locations — one is normal.
                    </p>

                    <Callout severity="note" label="note · baseUrl is deprecated">
                        <p>
                            Older guides add <Code>{'"baseUrl": "."'}</Code> next to{" "}
                            <Code>paths</Code>:
                        </p>
                        <CodeBlock code={BASEURL_CONFIG} lang="json" />
                        <p>It is not needed, and TypeScript 6 reports:</p>
                        <CodeBlock code={BASEURL_OUT} lang="text" />
                    </Callout>
                </DocSection>

                <DocSection title="the runtime does not read paths">
                    <p>
                        <Term>
                            <Code>paths</Code> is a type-checking setting — it never
                            rewrites imports.
                        </Term>{" "}
                        tsc passes, then running the file with Node:
                    </p>
                    <CodeBlock code={NODE_RUN} lang="bash" />
                    <p>fails (the local path is shortened):</p>
                    <CodeBlock code={NODE_OUT} lang="text" />
                    <p>Who resolves the alias depends on where the code runs:</p>
                    <GridTable
                        cols={WIDE_KEYS}
                        head={["where the code runs", "who resolves @/"]}
                        rows={[
                            ["Next.js", "Next reads paths from tsconfig — it just works"],
                            ["Vite", "its own alias (resolve.alias in vite.config, or a tsconfig-paths plugin)"],
                            ["plain Node", 'package.json "imports" — Node\'s own aliases'],
                        ]}
                    />
                    <p>
                        <Term>Node&apos;s own alias</Term> is read by both Node and
                        TypeScript, so no <Code>paths</Code> entry is needed. In{" "}
                        <Code>package.json</Code>:
                    </p>
                    <CodeBlock code={PKG_IMPORTS} lang="json" />
                    <p>The import then uses the alias:</p>
                    <CodeBlock code={HASH_IMPORT} lang="ts" />
                    <p>tsc passes, and the file runs:</p>
                    <CodeBlock code={HASH_OUT} lang="text" />
                    <p>
                        Aliases in <Code>imports</Code> must start with <Code>#</Code>.{" "}
                        <Code>{'"type": "module"'}</Code> tells Node the files are ES
                        modules; without it Node still runs them, after a warning.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · tsc passing does not mean it runs"
                    >
                        <p>
                            Whenever you add an alias, check that the bundler or runtime
                            knows it too — not only the compiler.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the .ts in Node imports">
                        <p>
                            When Node runs <Code>.ts</Code> files directly, imports need
                            the real file name (<Code>format.ts</Code>), which TypeScript
                            allows with <Code>allowImportingTsExtensions</Code> (only
                            together with <Code>noEmit</Code>). Bundled apps (Next.js,
                            Vite) write imports without an extension.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — this project's config ---------- */}
            <PartHeading kicker="part 4">Reading a Real tsconfig</PartHeading>
            <div className="mt-6 space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    This is the <Code>tsconfig.json</Code> of the project you are
                    reading, exactly as it is in the repository:
                </p>
                <CodeBlock code={PROJECT_TSCONFIG} lang="json" />
                <p>
                    Every line belongs to one of four groups, read one per section
                    below.
                </p>
            </div>
            <div>
                <DocSection title="checking and who compiles">
                    <p>Five lines decide how strictly and how fast tsc checks:</p>
                    <GridTable
                        cols={WIDE_KEYS}
                        head={["line", "meaning"]}
                        rows={[
                            ['"strict": true', "all 8 strict checks — noUncheckedIndexedAccess is not among them"],
                            ['"skipLibCheck": true', "do not type-check the .d.ts files in node_modules"],
                            ['"noEmit": true', "tsc only checks, never writes JavaScript"],
                            ['"isolatedModules": true', "every file must be compilable on its own"],
                            ['"incremental": true', "caches results in tsconfig.tsbuildinfo so the next check is faster"],
                        ]}
                    />
                    <p>
                        <Term>How they fit:</Term> Next compiles with SWC, which strips
                        types file by file without reading other files. So tsc only
                        checks (<Code>next build</Code> runs that check),{" "}
                        <Code>isolatedModules</Code> forbids what SWC cannot do, and{" "}
                        <Code>skipLibCheck</Code> trades library checking for speed.
                    </p>
                    <p>
                        <Term>
                            <Code>isolatedModules</Code> in practice.
                        </Term>{" "}
                        A type, in <Code>src/types.ts</Code>:
                    </p>
                    <CodeBlock code={TYPES_TS} lang="ts" />
                    <p>
                        re-exported from <Code>src/barrel.ts</Code>:
                    </p>
                    <CodeBlock code={BARREL_TS} lang="ts" />
                    <p>is an error:</p>
                    <CodeBlock code={ISOLATED_OUT} lang="text" />
                    <p>
                        Types are deleted when TypeScript becomes JavaScript; values are
                        kept. A compiler reading only <Code>barrel.ts</Code> cannot tell
                        which one <Code>User</Code> is: keep the line, and the JavaScript
                        asks <Code>types.js</Code> for an export that does not exist;
                        delete it, and a real value would be lost.{" "}
                        <Term>The fix labels it:</Term>
                    </p>
                    <CodeBlock code={EXPORT_TYPE} lang="ts" />
                    <p>The same works for imports, for a whole import or one name:</p>
                    <CodeBlock code={IMPORT_TYPE} lang="ts" />
                    <p>
                        A file-by-file compiler now knows exactly which names to drop.
                    </p>

                    <Callout
                        severity="tip"
                        label="tip · mark type-only imports and exports"
                    >
                        <p>
                            Write <Code>type</Code> in front of anything that is only a
                            type when importing or exporting it.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="modules">
                    <p>Six lines decide how imports are written and found:</p>
                    <GridTable
                        cols={WIDE_KEYS}
                        head={["line", "meaning"]}
                        rows={[
                            ['"module": "esnext"', "you write modern import / export"],
                            ['"moduleResolution": "bundler"', "imports are found the way a bundler finds them — no extension needed, package exports respected"],
                            ['"esModuleInterop": true', 'import React from "react" works with CommonJS packages'],
                            ['"resolveJsonModule": true', ".json files can be imported, with real types"],
                            ['"allowJs": true', ".js files can be part of the project (not checked without checkJs)"],
                            ['"paths"', "the @/* alias — Next reads it too"],
                        ]}
                    />
                    <p>
                        The one-line rule: <Code>bundler</Code> for apps built by a
                        bundler (Next.js, Vite); <Code>nodenext</Code> for code plain
                        Node runs.{" "}
                        <Term>JSON is typed from its content.</Term> Given{" "}
                        <Code>data.json</Code>:
                    </p>
                    <CodeBlock code={DATA_JSON} lang="json" />
                    <p>an import of it knows every field&apos;s type:</p>
                    <CodeBlock code={USE_JSON} lang="ts" />
                    <p>
                        Change the file, and the types follow on the next check.
                    </p>

                    <Callout
                        severity="note"
                        label="note · esModuleInterop: false is deprecated"
                    >
                        <p>
                            TypeScript 6 reports TS5107 for it, so the line is
                            effectively always on.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="environment and jsx">
                    <p>Three lines describe where the code runs and how JSX compiles:</p>
                    <GridTable
                        cols={WIDE_KEYS}
                        head={["line", "meaning"]}
                        rows={[
                            ['"lib": ["dom", "dom.iterable", "esnext"]', "which built-in APIs TypeScript believes exist: the browser plus modern JavaScript"],
                            ['"target": "ES2017"', "the JavaScript version tsc would output — with noEmit it barely matters"],
                            ['"jsx": "react-jsx"', "JSX becomes calls to React's JSX function, imported automatically — no import React"],
                        ]}
                    />
                    <p>
                        <Term>
                            <Code>lib</Code> in practice.
                        </Term>{" "}
                        In <Code>src/env.ts</Code>:
                    </p>
                    <CodeBlock code={ENV_TS} lang="ts" />
                    <p>
                        With <Code>{'"lib": ["es2017"]'}</Code>:
                    </p>
                    <CodeBlock code={LIB_OUT} lang="text" />
                    <p>
                        With <Code>{'"lib": ["es2022", "dom"]'}</Code> there are no
                        errors. <Code>lib</Code> must match where the code runs: the
                        browser or Next → <Code>dom</Code> + <Code>esnext</Code>; a Node
                        backend → no <Code>dom</Code> (so <Code>document</Code> in server
                        code is an error), plus <Code>@types/node</Code>.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · lib can promise what the runtime lacks"
                    >
                        <p>
                            <Code>esnext</Code> tells TypeScript the newest methods
                            exist; an old browser may not have them. In Next.js, real
                            browser support comes from the framework (browserslist,
                            polyfills), not from <Code>lib</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="next.js lines">
                    <p>The rest is there for Next.js:</p>
                    <GridTable
                        cols={WIDE_KEYS}
                        head={["line", "meaning"]}
                        rows={[
                            ['"plugins": [{ "name": "next" }]', "an editor-only language-service plugin — tsc ignores it"],
                            ['"next-env.d.ts" in include', "Next's global types: images, route types"],
                            ['".next/types/**/*.ts", ".next/dev/types/**/*.ts"', "type files Next generates from your routes"],
                            ['"**/*.ts", "**/*.tsx", "**/*.mts"', "all your own code"],
                            ['"exclude": ["node_modules"]', "installed packages are never project files"],
                        ]}
                    />
                    <p>
                        The plugin adds Next-specific warnings in the editor; it only
                        runs when VS Code uses the workspace TypeScript version
                        (&ldquo;TypeScript: Select TypeScript Version&rdquo; → &ldquo;Use
                        Workspace Version&rdquo;). The file the first include names,{" "}
                        <Code>next-env.d.ts</Code>, reads in full:
                    </p>
                    <CodeBlock code={NEXT_ENV} lang="ts" />
                    <p>
                        Each <Code>{'/// <reference types="…" />'}</Code> pulls in
                        global declarations — <Code>next/image-types/global</Code> is why
                        importing a <Code>.png</Code> type-checks. The import loads the
                        route types Next generates under <Code>.next/</Code> during{" "}
                        <Code>next dev</Code> / <Code>next build</Code>. Never edit it —
                        Next rewrites it.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · .next types exist only after Next runs"
                    >
                        <p>
                            On a fresh clone, <Code>npx tsc</Code> can report missing
                            types until <Code>next dev</Code> or <Code>next build</Code>{" "}
                            has run once.
                        </p>
                    </Callout>

                    <Callout
                        severity="tip"
                        label="tip · the one line worth adding here"
                    >
                        <p>
                            <Code>{'"noUncheckedIndexedAccess": true'}</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
