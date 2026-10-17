import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    GenericsExercisesDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/generics-exercises";
import { topicBySlug } from "@/projects/typescript/typescript";

// One card per exercise — the difficulty and kind lead each card's text.
// Each href targets a DocSection id (slugged from its title in the content file:
// "exercise 1 · what T becomes" -> "exercise-1-what-t-becomes").
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id: 8 sections, 8 cards.
const BASICS_TEXT = [
    {
        title: "Exercise 1 · What T Becomes",
        href: "#exercise-1-what-t-becomes",
        text: (
            <>
                <Mono>easy · predict</Mono> — read results, not just T.
            </>
        ),
    },
    {
        title: "Exercise 2 · Useless and Lying Generics",
        href: "#exercise-2-useless-and-lying-generics",
        text: (
            <>
                <Mono>easy · fix</Mono> — the used-once rule and the return-only T.
            </>
        ),
    },
    {
        title: "Exercise 3 · A Result Type",
        href: "#exercise-3-a-result-type",
        text: (
            <>
                <Mono>medium · write</Mono> — a generic union with{" "}
                <Mono>unwrapOr</Mono> and <Mono>mapResult</Mono>.
            </>
        ),
    },
    {
        title: "Exercise 4 · A Registry",
        href: "#exercise-4-a-registry",
        text: (
            <>
                <Mono>medium · write</Mono> — a constrained generic class with a
                getter and a safe copy.
            </>
        ),
    },
];

const KEYS_TEXT = [
    {
        title: "Exercise 5 · Read the Lookups",
        href: "#exercise-5-read-the-lookups",
        text: (
            <>
                <Mono>easy · predict</Mono> — <Mono>keyof</Mono>, <Mono>T[K]</Mono>,{" "}
                <Mono>[number]</Mono> and <Mono>as const</Mono>.
            </>
        ),
    },
    {
        title: "Exercise 6 · Sort and Group by Key",
        href: "#exercise-6-sort-and-group-by-key",
        text: (
            <>
                <Mono>medium · write</Mono> — <Mono>keyof T</Mono> versus{" "}
                <Mono>K extends keyof T</Mono>.
            </>
        ),
    },
    {
        title: "Exercise 7 · Types from a Constant",
        href: "#exercise-7-types-from-a-constant",
        text: (
            <>
                <Mono>medium · write</Mono> — a derived union, a guard and a lookup.
            </>
        ),
    },
];

const MIXED_TEXT = [
    {
        title: "Exercise 8 · A Typed Event Emitter",
        href: "#exercise-8-a-typed-event-emitter",
        text: (
            <>
                <Mono>hard · write · not solved yet</Mono> — event names that type
                their payloads.
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

const BASICS: SummaryArticle[] = BASICS_TEXT.map(withSeverities);
const KEYS: SummaryArticle[] = KEYS_TEXT.map(withSeverities);
const MIXED: SummaryArticle[] = MIXED_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("generics-exercises");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Generics Basics", items: BASICS },
                        { label: "Keys & Lookups", items: KEYS },
                        { label: "Mixed", items: MIXED },
                    ]}
                />
            }
        >
            {/* Same arrangement as Foundations Exercises: no DemoFrame, header
                inlined with DemoFrame's markup, heading and summary from the
                registry. The only client code on the page is each exercise's
                Reveal buttons. */}
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

                <GenericsExercisesDocs />
            </article>
        </PageShell>
    );
}
