// Single source of truth for the typescript navbar + project landing.
// Mirrors the shape of projects/redis-refresh/redis.ts so the shared Navbar can
// be fed the same way. One entry per page: adding a topic here is what puts it
// in the sidebar and on the landing grid — array order is render order.
//
// SCAFFOLD STAGE: every page is a placeholder. `parts` is the chapter plan each
// page renders while it has no content, so the plan lives beside the nav entry
// rather than in twenty page files that would drift from it. Same arrangement
// the elasticsearch registry used while it was at this stage.

export type TypeScriptChapter = string;

export const CHAPTERS: { id: string; label: string }[] = [
    { id: "foundations", label: "Foundations" },
    { id: "structure", label: "Structure" },
    { id: "generics", label: "Generics" },
    { id: "toolkit", label: "The Type Toolkit" },
    { id: "practice", label: "In Practice" },
    { id: "react-next", label: "React & Next" },
    // Lookup pages, deliberately last: not part of the learning sequence.
    { id: "reference", label: "Reference" },
];

export interface TypeScriptTopic {
    slug: string; // URL segment -> /typescript/<slug>
    name: string; // nav + card label
    chapter: string; // CHAPTERS id
    summary: string; // one-line blurb
    /**
     * Planned sections, rendered by the placeholder page. Dropped once the page
     * is written — a topic with no `parts` is one that no longer needs a plan.
     */
    parts?: string[];
}

export const TOPICS: TypeScriptTopic[] = [
    // — Foundations —
    {
        slug: "first-types", name: "First Types", chapter: "foundations",
        summary: "Annotations vs inference, primitives, any/unknown/never, literal types, and the types-vs-values split.",
        parts: [
            "Annotations vs inference",
            "Primitives and arrays",
            "any, unknown, never",
            "Literal types",
            "Types and values are two different namespaces",
        ],
    },
    {
        slug: "objects-and-aliases", name: "Objects & Aliases", chapter: "foundations",
        summary: "Object types, optional and readonly, type vs interface, index signatures, tuples.",
        parts: [
            "Object types, optional and readonly",
            "type vs interface",
            "Index signatures",
            "Tuples",
        ],
    },
    {
        slug: "functions", name: "Functions", chapter: "foundations",
        summary: "Parameters and returns, optional/default/rest, void vs undefined, overloads.",
        parts: [
            "Parameter and return types",
            "Optional, default and rest parameters",
            "void vs undefined",
            "Overloads",
        ],
    },
    {
        slug: "unions-and-narrowing", name: "Unions & Narrowing", chapter: "foundations",
        summary: "Unions, discriminated unions, type guards, exhaustiveness, enum vs literal union.",
        parts: [
            "Union types",
            "Narrowing with typeof, in and truthiness",
            "Discriminated unions",
            "Type guard functions",
            "Exhaustiveness with never",
            "enum vs literal union",
        ],
    },
    {
        slug: "assignability", name: "Assignability", chapter: "foundations",
        summary: "Structural typing, the excess property check, and why the errors read the way they do.",
        parts: [
            "Structural typing — shape, not name",
            "Assignable vs identical",
            "The excess property check",
            "Function parameter and return assignability",
            "Reading an assignability error",
        ],
    },
    {
        slug: "classes", name: "Classes", chapter: "foundations",
        summary: "Access modifiers, parameter properties, implements, abstract, readonly fields.",
        parts: [
            "Fields and constructors",
            "public, private, protected, readonly",
            "Parameter properties",
            "implements an interface",
            "abstract classes",
            "Classes as types",
        ],
    },

    // — Structure —
    {
        slug: "tsconfig-structure", name: "tsconfig Structure", chapter: "structure",
        summary: "Anatomy of the file: compilerOptions, the strict family, module/target/moduleResolution, paths.",
        parts: [
            "The file's top-level shape",
            "compilerOptions worth knowing",
            "The strict family, option by option",
            "target, module, moduleResolution, lib",
            "paths and baseUrl",
            "include, exclude, and what tsc actually compiles",
        ],
    },
    {
        slug: "reading-type-syntax", name: "Reading Type Syntax", chapter: "structure",
        summary: "How to read angle brackets, extends ? :, infer, [K in ...] and template literals — reading, not writing.",
        parts: [
            "Type expressions as a grammar",
            "Angle brackets — arguments vs parameters",
            "extends as a constraint vs a condition",
            "The conditional form and infer",
            "The mapped form [K in ...]",
            "Template literal types",
            "Reading a real type from a library",
        ],
    },

    // — Generics —
    {
        slug: "generics-basics", name: "Generics Basics", chapter: "generics",
        summary: "Type parameters, inference, constraints, defaults.",
        parts: [
            "Why a type parameter",
            "Inference at the call site",
            "Constraints with extends",
            "Default type parameters",
            "Generic interfaces and type aliases",
        ],
    },
    {
        slug: "keys-and-lookups", name: "Keys & Lookups", chapter: "generics",
        summary: "keyof, indexed access types, typeof, as const.",
        parts: [
            "keyof",
            "Indexed access types",
            "typeof on a value",
            "as const and literal inference",
            "Combining them to derive types from data",
        ],
    },

    // — The Type Toolkit —
    {
        slug: "utility-types", name: "Utility Types", chapter: "toolkit",
        summary: "Partial, Required, Pick, Omit, Record, Readonly, Extract, Exclude, NonNullable, ReturnType, Parameters, Awaited.",
        parts: [
            "Partial, Required, Readonly",
            "Pick and Omit",
            "Record",
            "Extract, Exclude, NonNullable",
            "ReturnType, Parameters, Awaited",
            "Choosing between them — a decision table",
        ],
    },
    {
        slug: "mapped-and-template-types", name: "Mapped & Template Literal Types", chapter: "toolkit",
        summary: "The mapped and template literal types worth writing by hand — no type-level puzzles.",
        parts: [
            "The mapped type form",
            "Key remapping with as",
            "Modifiers — adding and removing optional and readonly",
            "Template literal types",
            "Building one useful type end to end",
        ],
    },

    // — In Practice —
    {
        slug: "data-boundaries", name: "Data Boundaries & Async", chapter: "practice",
        summary: "unknown from APIs, guards vs assertions, satisfies, Promise<T>, and catch (e) being unknown.",
        parts: [
            "unknown at the edge of the program",
            "Type guards vs type assertions",
            "Validating a response",
            "satisfies",
            "Promise<T> and async return inference",
            "catch (e) is unknown",
        ],
    },
    {
        slug: "modules-and-declarations", name: "Modules & Declarations", chapter: "practice",
        summary: "import type, .d.ts, ambient types, @types packages, module augmentation, ESM vs CJS resolution.",
        parts: [
            "import type and verbatimModuleSyntax",
            ".d.ts files",
            "Ambient declarations",
            "@types packages",
            "Module augmentation — adding req.user",
            "ESM vs CJS resolution under nodenext",
        ],
    },
    {
        slug: "errors-and-escape-hatches", name: "Errors & Escape Hatches", chapter: "practice",
        summary: "Reading tsc output, as, the non-null assertion, @ts-expect-error, and when any is correct.",
        parts: [
            "How to read a tsc error",
            "Assertions with as, and double assertions",
            "The non-null assertion",
            "@ts-expect-error vs @ts-ignore",
            "When any is the right answer",
        ],
    },

    // — React & Next —
    {
        slug: "typing-components", name: "Typing Components", chapter: "react-next",
        summary: "Props, children and ReactNode, optional and default props, extending native HTML props.",
        parts: [
            "Typing props",
            "children and ReactNode",
            "Optional props and defaults",
            "Extending native HTML props",
            "Generic components",
        ],
    },
    {
        slug: "events-and-refs", name: "Events & Refs", chapter: "react-next",
        summary: "Event types, useRef for DOM vs mutable values, forwardRef.",
        parts: [
            "Event types by element",
            "The inline vs extracted handler difference",
            "useRef for a DOM node",
            "useRef for a mutable value",
            "forwardRef",
        ],
    },
    {
        slug: "hooks-and-state", name: "Hooks & State", chapter: "react-next",
        summary: "useState generics, useReducer with discriminated unions, useContext and the null default, custom hooks returning as const.",
        parts: [
            "useState and its inference limits",
            "useState generics",
            "useReducer with a discriminated union",
            "useContext and the null default",
            "Custom hooks and as const",
        ],
    },
    {
        slug: "next-specific-types", name: "Next-Specific Types", chapter: "react-next",
        summary: "Server vs Client components, async components, params and searchParams, route handlers, Metadata, typed env.",
        parts: [
            "Server vs Client component boundaries",
            "async components",
            "params and searchParams",
            "Route handlers with NextRequest and NextResponse",
            "Metadata",
            "Typed environment variables",
        ],
    },

    // — Reference —
    {
        slug: "notes", name: "Notes", chapter: "reference",
        summary: "A running collection of traps, answers to my questions, and key takeaways gathered while working through the chapters.",
        // No `parts`: this page is filled progressively rather than planned, so
        // the placeholder drops the Planned panel entirely.
    },
];

export const topicBySlug = (slug: string) =>
    TOPICS.find((t) => t.slug === slug);

// Only chapters that actually have at least one topic (hide empty chapters).
export const topicsByChapter = () =>
    CHAPTERS.map((c) => ({
        ...c,
        topics: TOPICS.filter((t) => t.chapter === c.id),
    })).filter((g) => g.topics.length > 0);
