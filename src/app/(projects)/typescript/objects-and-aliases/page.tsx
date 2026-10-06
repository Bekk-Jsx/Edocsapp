import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    ObjectsAndAliasesDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/objects-and-aliases";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all ten without exception.
const OBJECTS_TEXT = [
    {
        title: "Describing an object",
        href: "#describing-an-object",
        text: (
            <>
                <Mono>type</Mono> names a shape and nothing more. A literal must
                match it exactly — missing keys fail, and so do extra ones,
                assigned directly.
            </>
        ),
    },
    {
        title: "Optional and readonly",
        href: "#optional-and-readonly",
        text: (
            <>
                <Mono>?</Mono> may be absent and reads back as{" "}
                <Mono>| undefined</Mono>; <Mono>readonly</Mono> blocks
                reassignment — at compile time only, one level deep.
            </>
        ),
    },
    {
        title: "Nesting and reuse",
        href: "#nesting-and-reuse",
        text: (
            <>
                Name an inner shape once it is used twice. <Mono>&amp;</Mono>{" "}
                accepts fewer values and gives more keys; <Mono>|</Mono> the
                reverse, and needs narrowing.
            </>
        ),
    },
];

const TYPE_VS_INTERFACE_TEXT = [
    {
        title: "Two ways to write the same thing",
        href: "#two-ways-to-write-the-same-thing",
        text: (
            <>
                For an object shape they check identically;{" "}
                <Mono>extends</Mono> and <Mono>&amp;</Mono> land in the same place,
                and the two mix freely.
            </>
        ),
    },
    {
        title: "The real differences",
        href: "#the-real-differences",
        text: (
            <>
                <Mono>type</Mono> describes anything, <Mono>interface</Mono> only
                objects — but only an interface can be reopened. Default to{" "}
                <Mono>type</Mono>.
            </>
        ),
    },
];

const INDEX_TEXT = [
    {
        title: "When you don't know the keys",
        href: "#when-you-don-t-know-the-keys",
        text: (
            <>
                <Mono>[key: string]: T</Mono> — or <Mono>Record</Mono> — for keys
                from data. Every named property must fit the index type.
            </>
        ),
    },
    {
        title: "The index signature trap",
        href: "#the-index-signature-trap",
        text: (
            <>
                Every lookup is typed as a hit. Check misses yourself, and use{" "}
                <Mono>Record&lt;Union, T&gt;</Mono> when the keys can be named.
            </>
        ),
    },
];

const TUPLES_TEXT = [
    {
        title: "Fixed length, fixed positions",
        href: "#fixed-length-fixed-positions",
        text: (
            <>
                Type, order and length all checked — out-of-range reads too. Never
                inferred: annotate, or use <Mono>as const</Mono>.
            </>
        ),
    },
    {
        title: "When a tuple is the wrong choice",
        href: "#when-a-tuple-is-the-wrong-choice",
        text: (
            <>
                Two positions with an obvious order, like <Mono>useState</Mono>.
                Anything more is an object — names survive a reorder.
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

const OBJECTS: SummaryArticle[] = OBJECTS_TEXT.map(withSeverities);
const TYPE_VS_INTERFACE: SummaryArticle[] = TYPE_VS_INTERFACE_TEXT.map(withSeverities);
const INDEX: SummaryArticle[] = INDEX_TEXT.map(withSeverities);
const TUPLES: SummaryArticle[] = TUPLES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("objects-and-aliases");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Object Types", items: OBJECTS },
                        { label: "type vs interface", items: TYPE_VS_INTERFACE },
                        { label: "Index Signatures", items: INDEX },
                        { label: "Tuples", items: TUPLES },
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

                <ObjectsAndAliasesDocs />
            </article>
        </PageShell>
    );
}
