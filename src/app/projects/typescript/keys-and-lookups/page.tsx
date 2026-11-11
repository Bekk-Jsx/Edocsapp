import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    KeysAndLookupsDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/keys-and-lookups";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all ten without exception: 10 sections, 10 cards.
const KEYOF_TEXT = [
    {
        title: "Keys as a Union",
        href: "#keys-as-a-union",
        text: (
            <>
                <Mono>keyof User</Mono> is a literal union of its keys, always in
                sync.
            </>
        ),
    },
    {
        title: "keyof typeof and Index Signatures",
        href: "#keyof-typeof-and-index-signatures",
        text: (
            <>
                <Mono>keyof typeof value</Mono> for constants;{" "}
                <Mono>for…in</Mono> and <Mono>Object.keys</Mono> still give{" "}
                <Mono>string</Mono>.
            </>
        ),
    },
];

const INDEXED_TEXT = [
    {
        title: "Reading a Property Type",
        href: "#reading-a-property-type",
        text: (
            <>
                <Mono>User[&quot;name&quot;]</Mono> — brackets, never a dot; optional
                adds <Mono>undefined</Mono>.
            </>
        ),
    },
    {
        title: "Nested and Array Lookups",
        href: "#nested-and-array-lookups",
        text: (
            <>
                Chain brackets; <Mono>[number]</Mono> is any element of an array.
            </>
        ),
    },
    {
        title: "One Source of Truth",
        href: "#one-source-of-truth",
        text: (
            <>
                Point at <Mono>User[&quot;id&quot;]</Mono> instead of rewriting it —
                a variable key needs <Mono>typeof</Mono>.
            </>
        ),
    },
];

const KEY_GENERICS_TEXT = [
    {
        title: "A Key and Its Value Type",
        href: "#a-key-and-its-value-type",
        text: (
            <>
                <Mono>{"<T, K extends keyof T>"}</Mono> returns <Mono>T[K]</Mono> —
                the exact property, not every value.
            </>
        ),
    },
    {
        title: "Keys That Drive Values",
        href: "#keys-that-drive-values",
        text: (
            <>
                The value parameter follows the key — unless the key is a union.
            </>
        ),
    },
];

const DERIVING_TEXT = [
    {
        title: "A Union from an Array",
        href: "#a-union-from-an-array",
        text: (
            <>
                <Mono>as const</Mono> → <Mono>typeof</Mono> → <Mono>[number]</Mono>.
                Without <Mono>as const</Mono> it is just <Mono>string</Mono>.
            </>
        ),
    },
    {
        title: "Keys and Values from an Object",
        href: "#keys-and-values-from-an-object",
        text: (
            <>
                <Mono>keyof typeof</Mono> for keys,{" "}
                <Mono>[number][&quot;id&quot;]</Mono> through an array of objects.
            </>
        ),
    },
    {
        title: "One Constant, Two Jobs",
        href: "#one-constant-two-jobs",
        text: (
            <>
                The same constant types and checks — widen it for{" "}
                <Mono>includes</Mono>.
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

const KEYOF: SummaryArticle[] = KEYOF_TEXT.map(withSeverities);
const INDEXED: SummaryArticle[] = INDEXED_TEXT.map(withSeverities);
const KEY_GENERICS: SummaryArticle[] = KEY_GENERICS_TEXT.map(withSeverities);
const DERIVING: SummaryArticle[] = DERIVING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("keys-and-lookups");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "keyof", items: KEYOF },
                        { label: "Indexed Access", items: INDEXED },
                        { label: "K extends keyof T", items: KEY_GENERICS },
                        { label: "Deriving Types from Data", items: DERIVING },
                    ]}
                />
            }
        >
            {/* Same arrangement as Generics Basics: no DemoFrame and no "use
                client", header inlined with DemoFrame's markup, heading and
                summary from the registry so the page, its sidebar row and its
                landing card can never drift. No StatusBadge — the page is written. */}
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

                <KeysAndLookupsDocs />
            </article>
        </PageShell>
    );
}
