import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UnionsAndNarrowingDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/unions-and-narrowing";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all fourteen without exception: 14 sections, 14 cards.
const UNION_TYPES_TEXT = [
    {
        title: "What a Union Is",
        href: "#what-a-union-is",
        text: (
            <>
                <Mono>A | B</Mono> is one of several types, never saying which — so
                only what every member shares is allowed.
            </>
        ),
    },
    {
        title: "Where Unions Come From",
        href: "#where-unions-come-from",
        text: (
            <>
                Mostly from the library: <Mono>find</Mono>,{" "}
                <Mono>getElementById</Mono> and friends return{" "}
                <Mono>T | undefined</Mono> or <Mono>T | null</Mono>.
            </>
        ),
    },
    {
        title: "Combining Unions",
        href: "#combining-unions",
        text: (
            <>
                Unions flatten and dedupe; a wider member swallows its literals —{" "}
                <Mono>{"string & {}"}</Mono> keeps them.
            </>
        ),
    },
];

const NARROWING_TEXT = [
    {
        title: "Narrowing with typeof",
        href: "#narrowing-with-typeof",
        text: (
            <>
                The compiler follows checks and early returns. <Mono>typeof</Mono>{" "}
                cannot see null — it reports <Mono>{'"object"'}</Mono>.
            </>
        ),
    },
    {
        title: "Removing null and undefined",
        href: "#removing-null-and-undefined",
        text: (
            <>
                <Mono>!= null</Mono> removes both; truthiness also drops{" "}
                <Mono>0</Mono> and <Mono>{'""'}</Mono>. Prefer <Mono>??</Mono> to{" "}
                <Mono>||</Mono>.
            </>
        ),
    },
    {
        title: "Narrowing Objects",
        href: "#narrowing-objects",
        text: (
            <>
                <Mono>in</Mono> for keys, <Mono>instanceof</Mono> for classes,{" "}
                <Mono>Array.isArray</Mono> for arrays — <Mono>any[]</Mono> on{" "}
                <Mono>unknown</Mono>.
            </>
        ),
    },
    {
        title: "When Narrowing Is Lost",
        href: "#when-narrowing-is-lost",
        text: (
            <>
                Reassignment resets it; callbacks drop it for properties. Copy the
                value into a <Mono>const</Mono>.
            </>
        ),
    },
];

const DISCRIMINATED_TEXT = [
    {
        title: "One Label per Shape",
        href: "#one-label-per-shape",
        text: (
            <>
                One member per real state, each with the same literal key — illegal
                states become impossible to write.
            </>
        ),
    },
    {
        title: "Narrowing on the Discriminant",
        href: "#narrowing-on-the-discriminant",
        text: (
            <>
                One comparison on the label unlocks that member&apos;s fields;{" "}
                <Mono>switch</Mono> once there are three or more.
            </>
        ),
    },
    {
        title: "Designing the Discriminant",
        href: "#designing-the-discriminant",
        text: (
            <>
                Literal, same key everywhere, top level. Built on its own line it
                widens to <Mono>string</Mono> — annotate it.
            </>
        ),
    },
];

const GUARDS_TEXT = [
    {
        title: "value is T",
        href: "#value-is-t",
        text: (
            <>
                A predicate return type lets your own check narrow the argument —
                inferred for simple arrows since 5.5.
            </>
        ),
    },
    {
        title: "A Guard Is a Promise",
        href: "#a-guard-is-a-promise",
        text: (
            <>
                The body is never checked against the predicate. A weak guard
                mistypes every caller, silently.
            </>
        ),
    },
];

const EXHAUSTIVENESS_TEXT = [
    {
        title: "The Forgotten Case",
        href: "#the-forgotten-case",
        text: (
            <>
                A <Mono>switch</Mono> need not cover every member — assigning the
                leftover to <Mono>never</Mono> makes it.
            </>
        ),
    },
    {
        title: "assertNever",
        href: "#assertnever",
        text: (
            <>
                Fails to compile on a missing case and throws on unexpected data. A{" "}
                <Mono>Record</Mono> over the union is exhaustive too.
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

const UNION_TYPES: SummaryArticle[] = UNION_TYPES_TEXT.map(withSeverities);
const NARROWING: SummaryArticle[] = NARROWING_TEXT.map(withSeverities);
const DISCRIMINATED: SummaryArticle[] = DISCRIMINATED_TEXT.map(withSeverities);
const GUARDS: SummaryArticle[] = GUARDS_TEXT.map(withSeverities);
const EXHAUSTIVENESS: SummaryArticle[] = EXHAUSTIVENESS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("unions-and-narrowing");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Union Types", items: UNION_TYPES },
                        { label: "Narrowing", items: NARROWING },
                        { label: "Discriminated Unions", items: DISCRIMINATED },
                        { label: "Type Guard Functions", items: GUARDS },
                        { label: "Exhaustiveness", items: EXHAUSTIVENESS },
                    ]}
                />
            }
        >
            {/* Same arrangement as Functions: no DemoFrame and no "use client",
                header inlined with DemoFrame's markup, heading and summary from
                the registry so the page, its sidebar row and its landing card
                can never drift. No StatusBadge — the page is written. */}
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

                <UnionsAndNarrowingDocs />
            </article>
        </PageShell>
    );
}
