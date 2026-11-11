import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    FoundationsExercisesDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/foundations-exercises";
import { topicBySlug } from "@/projects/typescript/typescript";

// One card per exercise — the difficulty and kind lead each card's text, since
// the rail carries no severities on this page (see SECTION_SEVERITIES).
// Each href targets a DocSection id (slugged from its title in the content file:
// "exercise 1 · inferred types" -> "exercise-1-inferred-types").
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id: 13 sections, 13 cards.
const FIRST_TYPES_TEXT = [
    {
        title: "Exercise 1 · Inferred Types",
        href: "#exercise-1-inferred-types",
        text: (
            <>
                <Mono>easy · predict</Mono> — let, const, empty arrays, objects and
                mixed arrays.
            </>
        ),
    },
    {
        title: "Exercise 2 · Exhaustive Sizes",
        href: "#exercise-2-exhaustive-sizes",
        text: (
            <>
                <Mono>easy · write</Mono> — a literal union whose new member fails to
                compile.
            </>
        ),
    },
    {
        title: "Exercise 3 · Labels from Unknown",
        href: "#exercise-3-labels-from-unknown",
        text: (
            <>
                <Mono>medium · write</Mono> — narrowing <Mono>unknown</Mono> with{" "}
                <Mono>typeof</Mono>, no <Mono>any</Mono>, no <Mono>as</Mono>.
            </>
        ),
    },
];

const OBJECTS_TEXT = [
    {
        title: "Exercise 4 · Product Fixes",
        href: "#exercise-4-product-fixes",
        text: (
            <>
                <Mono>easy · fix</Mono> — a typo, a possibly missing value, an id that
                must not change.
            </>
        ),
    },
    {
        title: "Exercise 5 · Stock Limits",
        href: "#exercise-5-stock-limits",
        text: (
            <>
                <Mono>medium · write</Mono> — a closed Record, an open Record, a
                missing key.
            </>
        ),
    },
];

const FUNCTIONS_TEXT = [
    {
        title: "Exercise 6 · Three Signatures",
        href: "#exercise-6-three-signatures",
        text: (
            <>
                <Mono>easy · fix</Mono> — optional, default and rest parameters in the
                right place.
            </>
        ),
    },
    {
        title: "Exercise 7 · Validators",
        href: "#exercise-7-validators",
        text: (
            <>
                <Mono>medium · write</Mono> — function types, a function returning a
                function, rest.
            </>
        ),
    },
];

const UNIONS_TEXT = [
    {
        title: "Exercise 8 · Payment Methods",
        href: "#exercise-8-payment-methods",
        text: (
            <>
                <Mono>medium · write</Mono> — a discriminated union with an exhaustive
                switch.
            </>
        ),
    },
    {
        title: "Exercise 9 · A User Guard",
        href: "#exercise-9-a-user-guard",
        text: (
            <>
                <Mono>medium · write</Mono> — a real type guard from{" "}
                <Mono>unknown</Mono>, with arrays.
            </>
        ),
    },
];

const ASSIGNABILITY_TEXT = [
    {
        title: "Exercise 10 · What Fits",
        href: "#exercise-10-what-fits",
        text: (
            <>
                <Mono>medium · predict</Mono> — objects, literals and function types.
            </>
        ),
    },
];

const CLASSES_TEXT = [
    {
        title: "Exercise 11 · A Bank Account",
        href: "#exercise-11-a-bank-account",
        text: (
            <>
                <Mono>medium · write</Mono> — <Mono>#private</Mono>, a getter,{" "}
                <Mono>implements</Mono>, a static factory.
            </>
        ),
    },
    {
        title: "Exercise 12 · Notifiers",
        href: "#exercise-12-notifiers",
        text: (
            <>
                <Mono>medium · write</Mono> — an abstract class with{" "}
                <Mono>override</Mono>.
            </>
        ),
    },
];

const MIXED_TEXT = [
    {
        title: "Exercise 13 · An Event Log",
        href: "#exercise-13-an-event-log",
        text: (
            <>
                <Mono>hard · write</Mono> — parse, validate, store and summarise
                events.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here.
// The map is empty on this page, so every card renders plain; kept for
// consistency with every other page.
const withSeverities = (item: {
    title: string;
    href: string;
    text: React.ReactNode;
}): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const FIRST_TYPES: SummaryArticle[] = FIRST_TYPES_TEXT.map(withSeverities);
const OBJECTS: SummaryArticle[] = OBJECTS_TEXT.map(withSeverities);
const FUNCTIONS: SummaryArticle[] = FUNCTIONS_TEXT.map(withSeverities);
const UNIONS: SummaryArticle[] = UNIONS_TEXT.map(withSeverities);
const ASSIGNABILITY: SummaryArticle[] = ASSIGNABILITY_TEXT.map(withSeverities);
const CLASSES: SummaryArticle[] = CLASSES_TEXT.map(withSeverities);
const MIXED: SummaryArticle[] = MIXED_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("foundations-exercises");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "First Types", items: FIRST_TYPES },
                        { label: "Objects & Aliases", items: OBJECTS },
                        { label: "Functions", items: FUNCTIONS },
                        { label: "Unions & Narrowing", items: UNIONS },
                        { label: "Assignability", items: ASSIGNABILITY },
                        { label: "Classes", items: CLASSES },
                        { label: "Mixed", items: MIXED },
                    ]}
                />
            }
        >
            {/* Same arrangement as Classes: no DemoFrame, header inlined with
                DemoFrame's markup, heading and summary from the registry. The
                only client code on the page is each exercise's Reveal buttons. */}
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

                <FoundationsExercisesDocs />
            </article>
        </PageShell>
    );
}
