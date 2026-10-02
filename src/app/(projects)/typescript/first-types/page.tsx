import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    FirstTypesDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/first-types";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// footer sections, so the rule holds for all twelve without exception.
const ANNOTATIONS_TEXT = [
    {
        title: "The annotation",
        href: "#the-annotation",
        text: (
            <>
                A claim attached with a colon and checked, never applied —{" "}
                <Mono>: string</Mono> asserts a value already is one and is deleted
                before the program runs.
            </>
        ),
    },
    {
        title: "Inference",
        href: "#inference",
        text: (
            <>
                An inferred type is a real, enforced type. Annotate inputs, infer
                outputs: a parameter has no value to read, a return is computed from
                one.
            </>
        ),
    },
    {
        title: "let, const, and widening",
        href: "#let-const-and-widening",
        text: (
            <>
                <Mono>const</Mono> keeps the literal, <Mono>let</Mono> widens to{" "}
                <Mono>string</Mono> — and <Mono>string</Mono> will not fit a literal
                union.
            </>
        ),
    },
    {
        title: "any sneaking in",
        href: "#any-sneaking-in",
        text: (
            <>
                Four doors: an implicit parameter, <Mono>JSON.parse</Mono>,{" "}
                <Mono>as any</Mono>, an untyped import. <Mono>strict</Mono> changes
                when the bug breaks, not whether.
            </>
        ),
    },
];

const PRIMITIVES_TEXT = [
    {
        title: "The primitives",
        href: "#the-primitives",
        text: (
            <>
                Lowercase <Mono>string</Mono>, <Mono>number</Mono>,{" "}
                <Mono>boolean</Mono>; one numeric type; <Mono>null</Mono> kept out of
                every other type by <Mono>strictNullChecks</Mono>.
            </>
        ),
    },
    {
        title: "Arrays",
        href: "#arrays",
        text: (
            <>
                <Mono>string[]</Mono> is homogeneous and carries no length, so
                indexing is unchecked — and an array that starts empty needs an
                annotation.
            </>
        ),
    },
];

const LITERALS_TEXT = [
    {
        title: "A type with one value",
        href: "#a-type-with-one-value",
        text: (
            <>
                A literal type admits one exact value; joined with <Mono>|</Mono>{" "}
                they become the closed set that catches typos at the call site.
            </>
        ),
    },
    {
        title: "Literal unions vs enum",
        href: "#literal-unions-vs-enum",
        text: (
            <>
                Both check the same. A union erases, an <Mono>enum</Mono> emits a
                runtime object and needs converting at every data boundary — use the
                union.
            </>
        ),
    },
];

const UNCERTAIN_TEXT = [
    {
        title: "any turns the checker off",
        href: "#any-turns-the-checker-off",
        text: (
            <>
                Not a looser type but no type, and it spreads through every
                expression it touches — invisible until something crashes.
            </>
        ),
    },
    {
        title: "unknown, the safe any",
        href: "#unknown-the-safe-any",
        text: (
            <>
                Everything is assignable to <Mono>unknown</Mono>, nothing out of it
                without a check. The type for anything entering from outside.
            </>
        ),
    },
    {
        title: "never",
        href: "#never",
        text: (
            <>
                The type with no values. You read it back from the compiler, and
                write it once — to make a forgotten union case fail to compile.
            </>
        ),
    },
];

const WORLDS_TEXT = [
    {
        title: "Two separate worlds",
        href: "#two-separate-worlds",
        text: (
            <>
                After a <Mono>:</Mono> is the type world, everywhere else the value
                world; separate namespaces, and <Mono>typeof</Mono> is the one bridge
                between them.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: {
    title: string;
    href: string;
    text: React.ReactNode;
}): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const ANNOTATIONS: SummaryArticle[] = ANNOTATIONS_TEXT.map(withSeverities);
const PRIMITIVES: SummaryArticle[] = PRIMITIVES_TEXT.map(withSeverities);
const LITERALS: SummaryArticle[] = LITERALS_TEXT.map(withSeverities);
const UNCERTAIN: SummaryArticle[] = UNCERTAIN_TEXT.map(withSeverities);
const WORLDS: SummaryArticle[] = WORLDS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("first-types");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Annotations & Inference", items: ANNOTATIONS },
                        { label: "Primitives & Arrays", items: PRIMITIVES },
                        { label: "Literal Types", items: LITERALS },
                        { label: "any, unknown, never", items: UNCERTAIN },
                        { label: "Types & Values", items: WORLDS },
                    ]}
                />
            }
        >
            {/* No DemoFrame and no "use client": TypeScript is a compile-time tool
                and there is no compiler in the browser, so this page has nothing
                that could run there and no client boundary to draw. The header a
                DemoFrame would otherwise supply is inlined with the same markup, so
                the page keeps the rhythm of the redis pages — every fragment is
                introduced and explained by its own DocSection rather than shown as
                one module-sized source panel.
                Heading and summary come from the registry, so this page, its
                sidebar row and its landing card can never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        typescript · foundations
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <FirstTypesDocs />
            </article>
        </PageShell>
    );
}
