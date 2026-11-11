import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    AssignabilityDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/assignability";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all eleven without exception: 11 sections, 11 cards.
const STRUCTURAL_TEXT = [
    {
        title: "Shape, Not Name",
        href: "#shape-not-name",
        text: (
            <>
                Types match by shape. A type is a minimum: typed as{" "}
                <Mono>Named</Mono> never means only <Mono>name</Mono> — extra keys
                stay on the object.
            </>
        ),
    },
    {
        title: "When Names Should Matter",
        href: "#when-names-should-matter",
        text: (
            <>
                Same shape, different meaning slips through. A brand makes ids
                distinct; private fields make classes nominal.
            </>
        ),
    },
];

const ASSIGNABLE_TEXT = [
    {
        title: "Types as Sets of Values",
        href: "#types-as-sets-of-values",
        text: (
            <>
                Assignment flows narrow to wide. More properties is narrower;{" "}
                <Mono>unknown</Mono> holds everything, <Mono>never</Mono> nothing.
            </>
        ),
    },
    {
        title: "Assignable Is Not Identical",
        href: "#assignable-is-not-identical",
        text: (
            <>
                Fitting is one-way. <Mono>readonly</Mono> does not survive
                assignment, and writing through a wider array breaks the narrow one.
            </>
        ),
    },
];

const EXCESS_TEXT = [
    {
        title: "Fresh Literals Are Checked for Extra Keys",
        href: "#fresh-literals-are-checked-for-extra-keys",
        text: (
            <>
                A literal written into a typed slot may not carry unknown keys — the
                check that catches option typos.
            </>
        ),
    },
    {
        title: "Allowing Extra Keys",
        href: "#allowing-extra-keys",
        text: (
            <>
                Declare them with an index signature. All-optional types need at
                least one shared key — and one is enough.
            </>
        ),
    },
    {
        title: "as Overrides the Check",
        href: "#as-overrides-the-check",
        text: (
            <>
                An annotation checks, <Mono>as</Mono> trusts. Types must overlap —
                unless you go through <Mono>unknown</Mono>. Check, build or convert
                instead.
            </>
        ),
    },
];

const FUNCTIONS_TEXT = [
    {
        title: "Parameters Wider, Returns Narrower",
        href: "#parameters-wider-returns-narrower",
        text: (
            <>
                A replacement may accept more and return less — never the reverse.
                Fewer parameters is fine.
            </>
        ),
    },
    {
        title: "The Method Loophole",
        href: "#the-method-loophole",
        text: (
            <>
                Method syntax skips the strict parameter check. Write callbacks as
                properties.
            </>
        ),
    },
];

const ERRORS_TEXT = [
    {
        title: "Reading a Nested Error",
        href: "#reading-a-nested-error",
        text: (
            <>
                Each indented line zooms in: last line is the reason, middle lines
                the path.
            </>
        ),
    },
    {
        title: "Making Errors Land in the Right Place",
        href: "#making-errors-land-in-the-right-place",
        text: (
            <>
                Errors appear where a value meets its type. Annotate values where
                they are created.
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

const STRUCTURAL: SummaryArticle[] = STRUCTURAL_TEXT.map(withSeverities);
const ASSIGNABLE: SummaryArticle[] = ASSIGNABLE_TEXT.map(withSeverities);
const EXCESS: SummaryArticle[] = EXCESS_TEXT.map(withSeverities);
const FUNCTIONS: SummaryArticle[] = FUNCTIONS_TEXT.map(withSeverities);
const ERRORS: SummaryArticle[] = ERRORS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("assignability");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Structural Typing", items: STRUCTURAL },
                        { label: "Assignable vs Identical", items: ASSIGNABLE },
                        { label: "The Excess Property Check", items: EXCESS },
                        { label: "Function Assignability", items: FUNCTIONS },
                        { label: "Reading an Assignability Error", items: ERRORS },
                    ]}
                />
            }
        >
            {/* Same arrangement as Unions & Narrowing: no DemoFrame and no "use
                client", header inlined with DemoFrame's markup, heading and
                summary from the registry so the page, its sidebar row and its
                landing card can never drift. No StatusBadge — the page is written. */}
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

                <AssignabilityDocs />
            </article>
        </PageShell>
    );
}
