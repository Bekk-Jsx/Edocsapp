import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    FunctionsDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/functions";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all eight without exception.
const PARAMS_RETURNS_TEXT = [
    {
        title: "Typing a function",
        href: "#typing-a-function",
        text: (
            <>
                Annotate every parameter; let the return infer — except on an
                exported function, where it is a contract.
            </>
        ),
    },
    {
        title: "void vs undefined",
        href: "#void-vs-undefined",
        text: (
            <>
                <Mono>void</Mono> means ignore the result, whatever it is; that
                looseness is what lets one-line callbacks return anything.
            </>
        ),
    },
];

const FLEXIBLE_TEXT = [
    {
        title: "Optional parameters",
        href: "#optional-parameters",
        text: (
            <>
                <Mono>?</Mono> makes the argument skippable and the parameter{" "}
                <Mono>| undefined</Mono> inside. Optional ones go last.
            </>
        ),
    },
    {
        title: "Default parameters",
        href: "#default-parameters",
        text: (
            <>
                A default is optional at the call and never undefined inside. It
                fires on <Mono>undefined</Mono>, not on <Mono>null</Mono>.
            </>
        ),
    },
    {
        title: "Rest parameters",
        href: "#rest-parameters",
        text: (
            <>
                <Mono>...xs: T[]</Mono> collects the remaining arguments, last in the
                list. Spreading into a call needs a tuple.
            </>
        ),
    },
];

const FUNCTION_TYPES_TEXT = [
    {
        title: "A function as a type",
        href: "#a-function-as-a-type",
        text: (
            <>
                <Mono>(a: A) =&gt; R</Mono> types a function value; assigned to one,
                a function gets its parameters inferred from the slot.
            </>
        ),
    },
    {
        title: "Why callbacks accept fewer parameters",
        href: "#why-callbacks-accept-fewer-parameters",
        text: (
            <>
                Demand no more, deliver no less: parameters can shrink, returns can
                grow — but a parameter&apos;s type cannot change.
            </>
        ),
    },
    {
        title: "Overloads",
        href: "#overloads",
        text: (
            <>
                Declared call shapes over one hidden implementation. If a type
                parameter can express the relationship, use a generic.
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

const PARAMS_RETURNS: SummaryArticle[] = PARAMS_RETURNS_TEXT.map(withSeverities);
const FLEXIBLE: SummaryArticle[] = FLEXIBLE_TEXT.map(withSeverities);
const FUNCTION_TYPES: SummaryArticle[] = FUNCTION_TYPES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("functions");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Parameters & Returns", items: PARAMS_RETURNS },
                        { label: "Flexible Parameters", items: FLEXIBLE },
                        { label: "Function Types & Overloads", items: FUNCTION_TYPES },
                    ]}
                />
            }
        >
            {/* Same arrangement as First Types: no DemoFrame and no "use client",
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

                <FunctionsDocs />
            </article>
        </PageShell>
    );
}
