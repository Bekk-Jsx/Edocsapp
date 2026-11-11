import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ClassesDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/classes";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all ten without exception: 10 sections, 10 cards.
const FIELDS_TEXT = [
    {
        title: "Declaring and Initialising Fields",
        href: "#declaring-and-initialising-fields",
        text: (
            <>
                Every field is declared, and under strict initialised.{" "}
                <Mono>| null</Mono> for empty; <Mono>!</Mono> only when something
                else sets it.
            </>
        ),
    },
    {
        title: "Methods and this",
        href: "#methods-and-this",
        text: (
            <>
                A method passed as a callback loses <Mono>this</Mono>. Use an arrow
                field, or declare <Mono>this</Mono> and bind.
            </>
        ),
    },
];

const ACCESS_TEXT = [
    {
        title: "public, private, protected",
        href: "#public-private-protected",
        text: (
            <>
                Who may use a member. <Mono>private</Mono> is compile-time only —
                brackets and <Mono>any</Mono> reach it.
            </>
        ),
    },
    {
        title: "#private and readonly",
        // "#private and readonly" slugs to this id: slug() drops the leading "#".
        href: "#private-and-readonly",
        text: (
            <>
                <Mono>#</Mono> is real runtime privacy and never combines with{" "}
                <Mono>private</Mono>. <Mono>readonly</Mono> assigns once.
            </>
        ),
    },
];

const PARAMETER_PROPERTIES_TEXT = [
    {
        title: "The Constructor Shortcut",
        href: "#the-constructor-shortcut",
        text: (
            <>
                A modifier on a constructor parameter makes it a field — without one
                it stays a parameter.
            </>
        ),
    },
    {
        title: "Erasable Syntax",
        href: "#erasable-syntax",
        text: (
            <>
                Parameter properties generate code, so type stripping refuses them.{" "}
                <Mono>erasableSyntaxOnly</Mono> flags it.
            </>
        ),
    },
];

const CONTRACTS_TEXT = [
    {
        title: "implements",
        href: "#implements",
        text: (
            <>
                A checked promise of shape. It gives the class no types, and moves
                errors onto the class.
            </>
        ),
    },
    {
        title: "Abstract Classes and override",
        href: "#abstract-classes-and-override",
        text: (
            <>
                Shared code plus required members, never created directly.{" "}
                <Mono>override</Mono> catches stale overrides.
            </>
        ),
    },
];

const AS_TYPES_TEXT = [
    {
        title: "One Name, Two Things",
        href: "#one-name-two-things",
        text: (
            <>
                <Mono>User</Mono> is the instance type, <Mono>typeof User</Mono> the
                class. A plain object can fit <Mono>User</Mono> without{" "}
                <Mono>instanceof</Mono>.
            </>
        ),
    },
    {
        title: "When to Use a Class",
        href: "#when-to-use-a-class",
        text: (
            <>
                Data that travels is a type plus functions — methods die in JSON.
                Classes for state and errors.
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

const FIELDS: SummaryArticle[] = FIELDS_TEXT.map(withSeverities);
const ACCESS: SummaryArticle[] = ACCESS_TEXT.map(withSeverities);
const PARAMETER_PROPERTIES: SummaryArticle[] =
    PARAMETER_PROPERTIES_TEXT.map(withSeverities);
const CONTRACTS: SummaryArticle[] = CONTRACTS_TEXT.map(withSeverities);
const AS_TYPES: SummaryArticle[] = AS_TYPES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("classes");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Fields & Constructors", items: FIELDS },
                        { label: "Access Modifiers", items: ACCESS },
                        { label: "Parameter Properties", items: PARAMETER_PROPERTIES },
                        { label: "implements & abstract", items: CONTRACTS },
                        { label: "Classes as Types", items: AS_TYPES },
                    ]}
                />
            }
        >
            {/* Same arrangement as Assignability: no DemoFrame and no "use
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

                <ClassesDocs />
            </article>
        </PageShell>
    );
}
