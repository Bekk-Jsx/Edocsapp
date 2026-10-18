import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    TsconfigStructureDocs,
    SECTION_SEVERITIES,
} from "@/projects/typescript/content/tsconfig-structure";
import { topicBySlug } from "@/projects/typescript/typescript";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all fourteen without exception: 14 sections, 14 cards.
const SHAPE_TEXT = [
    {
        title: "What tsconfig Decides",
        href: "#what-tsconfig-decides",
        text: (
            <>
                <Mono>compilerOptions</Mono> is how, <Mono>include</Mono> is which
                files — and tsc emits JavaScript unless <Mono>noEmit</Mono>.
            </>
        ),
    },
    {
        title: "include and the Default",
        href: "#include-and-the-default",
        text: (
            <>
                No include means every .ts in the tree; <Mono>strict</Mono> is on by
                default in TypeScript 6.
            </>
        ),
    },
    {
        title: "extends",
        href: "#extends",
        text: (
            <>
                Options merge key by key; <Mono>include</Mono> /{" "}
                <Mono>exclude</Mono> / <Mono>files</Mono> are replaced. Check with{" "}
                <Mono>--showConfig</Mono>.
            </>
        ),
    },
    {
        title: "tsc with a File Name",
        href: "#tsc-with-a-file-name",
        text: (
            <>
                A file argument skips tsconfig (TS5112) — run plain{" "}
                <Mono>tsc</Mono> or <Mono>-p</Mono>.
            </>
        ),
    },
];

const STRICT_TEXT = [
    {
        title: "What strict Turns On",
        href: "#what-strict-turns-on",
        text: (
            <>
                Eight flags; <Mono>strictNullChecks</Mono> catches the most crashes.
            </>
        ),
    },
    {
        title: "One Flag Off, strict Still On",
        href: "#one-flag-off-strict-still-on",
        text: (
            <>
                An explicit flag beats <Mono>strict</Mono> — for migrations, not new
                code.
            </>
        ),
    },
    {
        title: "noUncheckedIndexedAccess",
        href: "#nouncheckedindexedaccess",
        text: (
            <>
                Index reads add <Mono>| undefined</Mono> — not in strict, worth
                turning on.
            </>
        ),
    },
    {
        title: "Flags Outside strict",
        href: "#flags-outside-strict",
        text: (
            <>
                Returns, fallthrough, override — cheap; unused code goes to ESLint.
            </>
        ),
    },
];

const PATHS_TEXT = [
    {
        title: "An Alias for src",
        href: "#an-alias-for-src",
        text: (
            <>
                <Mono>{'"@/*": ["./src/*"]'}</Mono>, relative to the tsconfig — no{" "}
                <Mono>baseUrl</Mono>.
            </>
        ),
    },
    {
        title: "The Runtime Does Not Read paths",
        href: "#the-runtime-does-not-read-paths",
        text: (
            <>
                tsc passes, Node crashes — Next reads paths, Node needs{" "}
                <Mono>#</Mono> imports.
            </>
        ),
    },
];

const REAL_TEXT = [
    {
        title: "Checking and Who Compiles",
        href: "#checking-and-who-compiles",
        text: (
            <>
                tsc checks, SWC compiles file by file — so <Mono>export type</Mono>{" "}
                for types.
            </>
        ),
    },
    {
        title: "Modules",
        href: "#modules",
        text: (
            <>
                <Mono>bundler</Mono> for bundled apps; JSON imports are typed from the
                file.
            </>
        ),
    },
    {
        title: "Environment and JSX",
        href: "#environment-and-jsx",
        text: (
            <>
                <Mono>lib</Mono> is what TypeScript believes exists, not what the
                browser has.
            </>
        ),
    },
    {
        title: "Next.js Lines",
        href: "#next-js-lines",
        text: (
            <>
                An editor plugin plus generated route types — present only after Next
                runs.
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

const SHAPE: SummaryArticle[] = SHAPE_TEXT.map(withSeverities);
const STRICT: SummaryArticle[] = STRICT_TEXT.map(withSeverities);
const PATHS: SummaryArticle[] = PATHS_TEXT.map(withSeverities);
const REAL: SummaryArticle[] = REAL_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("tsconfig-structure");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The File's Shape", items: SHAPE },
                        { label: "The Strict Family", items: STRICT },
                        { label: "paths", items: PATHS },
                        { label: "Reading a Real tsconfig", items: REAL },
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
                        typescript · structure
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <TsconfigStructureDocs />
            </article>
        </PageShell>
    );
}
