import Link from "next/link";
import { notFound } from "next/navigation";
import { InterviewsUnavailable } from "@/components/home/interviews-content";
import { Text } from "@/components/interviews/inline";
import { LangPair, LangText } from "@/components/interviews/lang-provider";
import { interviewPageHref } from "@/lib/routes";
import {
    getItem,
    getItemPages,
    PRIORITY_ORDER,
    type ItemNode,
    type PageSummary,
} from "@/server/interviews";
import type { Lang } from "@/components/interviews/inline";

// ===================================================================
// ITEM LANDING /interviews/<item>
//
// The same markup system as a project landing: eyebrow, title, summary, then
// the item's visible pages as cards — each with how many questions it holds,
// how many are answered, and the priority mix, so the work ahead is legible
// before any of it is written.
//
// Both languages are rendered on the server and LangPair/LangText pick one.
// ===================================================================

/** "12 high · 9 medium · 6 low" — zero buckets dropped. */
function priorityLine(page: PageSummary): string {
    return PRIORITY_ORDER.filter((p) => page.byPriority[p] > 0)
        .map((p) => `${page.byPriority[p]} ${p}`)
        .join(" · ");
}

function PageCard({
    item,
    page,
    lang,
}: {
    item: ItemNode;
    page: PageSummary;
    lang: Lang;
}) {
    const breakdown = priorityLine(page);
    return (
        <Link
            href={interviewPageHref(item.slug, page.slug)}
            className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors duration-150 hover:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            <h2 className="text-lg font-semibold text-[var(--accent)]">
                <Text text={page.name} lang={lang} />
            </h2>
            <p className="mt-2 font-mono text-[0.65rem] text-[var(--muted)]">
                {page.questionCount} questions · {page.readyCount} ready
            </p>
            {breakdown ? (
                <p className="mt-1 font-mono text-[0.65rem] text-[var(--muted)]">
                    {breakdown}
                </p>
            ) : null}
        </Link>
    );
}

export default async function InterviewItemPage({
    params,
}: {
    params: Promise<{ item: string }>;
}) {
    const { item: slug } = await params;

    // An unreachable database must NOT read as a missing item: a 404 would say
    // the page does not exist, when the truth is that it could not be looked
    // up. So the two are kept apart — error state here, notFound() below.
    let item: ItemNode | null = null;
    let pages: PageSummary[] = [];
    try {
        item = await getItem(slug);
        if (item) pages = await getItemPages(slug);
    } catch (error) {
        console.error(`[interviews] ${slug} unavailable`, error);
        return <InterviewsUnavailable />;
    }

    if (!item) notFound();
    const node = item;

    const header = (lang: Lang) => (
        <>
            <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                Interviews · <Text text={node.categoryName} lang={lang} />
            </p>
        </>
    );

    return (
        <article className="w-full">
            <header className="mb-10">
                <LangPair en={header("en")} de={header("de")} />
                <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                    <LangText
                        en={<Text text={node.name} lang="en" />}
                        de={<Text text={node.name} lang="de" />}
                    />
                </h1>
                {node.summary ? (
                    <div className="mt-3 max-w-[60ch] leading-relaxed text-[var(--muted)]">
                        <LangText
                            en={<Text text={node.summary} lang="en" />}
                            de={<Text text={node.summary} lang="de" />}
                        />
                    </div>
                ) : null}
            </header>

            {/* A scaffolded item has no pages yet; say so rather than render
                an empty grid. Pages arrive with their first content batch. */}
            {pages.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 font-mono text-sm text-[var(--muted)]">
                    Pages coming soon.
                </p>
            ) : (
                <LangPair
                    en={
                        <div className="grid gap-3 sm:grid-cols-2">
                            {pages.map((page) => (
                                <PageCard
                                    key={page.slug}
                                    item={node}
                                    page={page}
                                    lang="en"
                                />
                            ))}
                        </div>
                    }
                    de={
                        <div className="grid gap-3 sm:grid-cols-2">
                            {pages.map((page) => (
                                <PageCard
                                    key={page.slug}
                                    item={node}
                                    page={page}
                                    lang="de"
                                />
                            ))}
                        </div>
                    }
                />
            )}
        </article>
    );
}
