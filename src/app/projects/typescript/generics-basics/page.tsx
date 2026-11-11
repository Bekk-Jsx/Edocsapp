import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    GenericsBasicsDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/generics-basics";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all thirteen without exception: 13 sections, 13 cards.
const WHY_TEXT = [
    {
        title: "The Problem",
        href: "#the-problem",
        text: (
            <>
                <Mono>any</Mono> loses the type, <Mono>unknown</Mono> makes every
                caller re-check it — neither links input to output.
            </>
        ),
    },
    {
        title: "A Type Parameter",
        href: "#a-type-parameter",
        text: (
            <>
                <Mono>{"<T>"}</Mono> is a type variable, filled separately at every
                call.
            </>
        ),
    },
    {
        title: "Generics You Already Use",
        href: "#generics-you-already-use",
        text: (
            <>
                <Mono>{"Array<T>"}</Mono>, <Mono>{"Map<K, V>"}</Mono>,{" "}
                <Mono>{"Promise<T>"}</Mono>. In .tsx, write <Mono>{"<T,>"}</Mono>{" "}
                before an arrow.
            </>
        ),
    },
];

const INFERENCE_TEXT = [
    {
        title: "Inference from Arguments",
        href: "#inference-from-arguments",
        text: (
            <>
                T is read from the arguments, callbacks included — hover the call to
                see it.
            </>
        ),
    },
    {
        title: "One T, Several Arguments",
        href: "#one-t-several-arguments",
        text: (
            <>
                The first argument decides T; literals widen to their primitive.
            </>
        ),
    },
    {
        title: "Writing Type Arguments",
        href: "#writing-type-arguments",
        text: (
            <>
                Only when the start value hides the type — and then all of them.
            </>
        ),
    },
];

const CONSTRAINTS_TEXT = [
    {
        title: "extends as a Minimum",
        href: "#extends-as-a-minimum",
        text: (
            <>
                The constraint is what T must have; T stays the full real type.
            </>
        ),
    },
    {
        title: "Constraints in Practice",
        href: "#constraints-in-practice",
        text: (
            <>
                <Mono>{"T extends { id: number }"}</Mono> for any entity;{" "}
                <Mono>extends string</Mono> or <Mono>const T</Mono> keeps literals.
            </>
        ),
    },
];

const GENERIC_TYPES_TEXT = [
    {
        title: "Generic Aliases and Interfaces",
        href: "#generic-aliases-and-interfaces",
        text: (
            <>
                <Mono>{"Result<T>"}</Mono> written once — and a generic type never
                infers its argument.
            </>
        ),
    },
    {
        title: "Generic Classes",
        href: "#generic-classes",
        text: (
            <>
                <Mono>new</Mono> infers from the constructor; static members cannot
                use T.
            </>
        ),
    },
    {
        title: "Default Type Parameters",
        href: "#default-type-parameters",
        text: (
            <>
                <Mono>{"<T = unknown>"}</Mono>, defaults last — never default to{" "}
                <Mono>any</Mono>.
            </>
        ),
    },
];

const WHEN_NOT_TEXT = [
    {
        title: "The Used-Once Rule",
        href: "#the-used-once-rule",
        text: (
            <>
                T must appear twice to link anything — otherwise use the constraint.
            </>
        ),
    },
    {
        title: "A Return-Only T Is a Hidden as",
        href: "#a-return-only-t-is-a-hidden-as",
        text: (
            <>
                <Mono>{"parse<User>()"}</Mono> checks nothing — take a guard instead.
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

const WHY: SummaryArticle[] = WHY_TEXT.map(withSeverities);
const INFERENCE: SummaryArticle[] = INFERENCE_TEXT.map(withSeverities);
const CONSTRAINTS: SummaryArticle[] = CONSTRAINTS_TEXT.map(withSeverities);
const GENERIC_TYPES: SummaryArticle[] = GENERIC_TYPES_TEXT.map(withSeverities);
const WHEN_NOT: SummaryArticle[] = WHEN_NOT_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("generics-basics");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Why a Type Parameter", items: WHY },
                        { label: "Inference", items: INFERENCE },
                        { label: "Constraints", items: CONSTRAINTS },
                        { label: "Generic Types", items: GENERIC_TYPES },
                        { label: "When Not to Use One", items: WHEN_NOT },
                    ]}
                />
            }
        >
            {/* Same arrangement as Classes: no DemoFrame and no "use client",
                header inlined with DemoFrame's markup, heading and summary from
                the registry so the page, its sidebar row and its landing card can
                never drift. No StatusBadge — the page is written. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        typescript · generics
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <GenericsBasicsDocs />
            </article>
        </PageShell>
    );
}
