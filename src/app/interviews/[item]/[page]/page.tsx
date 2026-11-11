import { notFound } from "next/navigation";
import { InterviewsUnavailable } from "@/components/home/interviews-content";
import { Text, plain, type Lang } from "@/components/interviews/inline";
import { LangPair, LangText } from "@/components/interviews/lang-provider";
import PlannedCard from "@/components/interviews/planned-card";
import PracticeProvider from "@/components/interviews/practice-provider";
import { RailState } from "@/components/interviews/practice-section";
import PracticeToggle from "@/components/interviews/practice-toggle";
import QuestionSection, {
    PartHeading,
} from "@/components/interviews/question-section";
import { getProgress } from "@/server/progress";
import { entryKey, type ProgressState } from "@/server/schema";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    type SummaryArticle,
    type SummaryGroup,
} from "@/components/ui/summary-articles";
import {
    byPriority,
    getAssets,
    getPage,
    imageAssetIds,
    type AssetInfo,
    type PageWithEntries,
    type QuestionEntry,
} from "@/server/interviews";

// ===================================================================
// QUESTION PAGE /interviews/<item>/<page>
//
// The doc-page layout: PageShell with a summary rail, a header, then the
// questions grouped into High / Medium / Low priority parts (empty parts
// omitted) and ordered within a part by `order`.
//
// An answered question renders as a full section; a planned one as a quiet
// card. Hidden ones never arrive here — getPage filters them out.
//
// NO page search, and nothing had to be switched off for that: PageSearch
// keys off parseProjectPath, which returns null outside /projects/, so on an
// interview route it mounts no slot and renders no box. The static search
// index is generated from the content FILES and does not cover database
// content — searching interview questions is a later prompt.
// ===================================================================

/**
 * One rail card per question: planned ones say "soon", answered ones show
 * their practice state (a client component, so it follows the mode).
 */
function railCard(entry: QuestionEntry, lang: Lang): SummaryArticle {
    return {
        title: plain(entry.title, lang),
        href: `#${entry.slug}`,
        text:
            entry.status === "planned" ? (
                <span className="text-[var(--muted)]">coming soon</span>
            ) : (
                <RailState slug={entry.slug} />
            ),
    };
}

function rail(data: PageWithEntries, lang: Lang): SummaryGroup[] {
    return byPriority(data.entries).map((part) => ({
        label: part.label,
        items: part.entries.map((entry) => railCard(entry, lang)),
    }));
}

function Body({
    data,
    assets,
}: {
    data: PageWithEntries;
    assets: Map<string, AssetInfo>;
}) {
    return (
        <>
            {byPriority(data.entries).map((part) => (
                <div key={part.priority}>
                    <PartHeading kicker="priority">{part.label}</PartHeading>
                    <div>
                        {part.entries.map((entry) =>
                            entry.status === "active" ? (
                                <QuestionSection
                                    key={entry.slug}
                                    entry={entry}
                                    assets={assets}
                                />
                            ) : null,
                        )}
                    </div>
                    {/* Planned ones are listed together under the written
                        ones, so a part reads "here is what exists, here is
                        what is coming" rather than interleaving the two. */}
                    <div className="mt-3 space-y-2">
                        <LangPair
                            en={
                                <div className="space-y-2">
                                    {part.entries
                                        .filter((e) => e.status === "planned")
                                        .map((entry) => (
                                            <PlannedCard
                                                key={entry.slug}
                                                entry={entry}
                                                lang="en"
                                            />
                                        ))}
                                </div>
                            }
                            de={
                                <div className="space-y-2">
                                    {part.entries
                                        .filter((e) => e.status === "planned")
                                        .map((entry) => (
                                            <PlannedCard
                                                key={entry.slug}
                                                entry={entry}
                                                lang="de"
                                            />
                                        ))}
                                </div>
                            }
                        />
                    </div>
                </div>
            ))}
        </>
    );
}

export default async function InterviewQuestionPage({
    params,
}: {
    params: Promise<{ item: string; page: string }>;
}) {
    const { item: itemSlug, page: pageSlug } = await params;

    let data: PageWithEntries | null = null;
    let assets = new Map<string, AssetInfo>();
    // slug -> saved practice state, for the questions on this page.
    let progress: Record<string, ProgressState> = {};
    try {
        data = await getPage(itemSlug, pageSlug);
        // Bound to a const so the closures below are narrowed too.
        const loaded = data;
        if (loaded) {
            // Only answered questions can show an image.
            const ids = loaded.entries
                .filter((e) => e.status === "active")
                .flatMap((e) => imageAssetIds(e.blocks));
            if (ids.length) assets = await getAssets(ids);

            // Keyed by slug for the client; stored by full entry path.
            const saved = await getProgress(loaded.page.path);
            progress = Object.fromEntries(
                loaded.entries
                    .map((entry) => [
                        entry.slug,
                        saved.get(entryKey(loaded.page.path, entry.slug)),
                    ])
                    .filter(
                        (pair): pair is [string, ProgressState] =>
                            pair[1] !== undefined,
                    ),
            );
        }
    } catch (error) {
        console.error(`[interviews] ${itemSlug}/${pageSlug} unavailable`, error);
        return <InterviewsUnavailable />;
    }

    if (!data) notFound();
    const page = data;

    const total = page.entries.length;
    const ready = page.entries.filter((e) => e.status === "active").length;

    return (
        // Everything that practice mode touches — the toggle, the sections and
        // the rail dots — reads one provider, so the count and the chips can
        // never disagree.
        <PracticeProvider
            pagePath={page.page.path}
            initialProgress={progress}
            total={ready}
        >
            <PageShell
                alerts={
                    <LangPair
                        en={<SummaryArticles groups={rail(page, "en")} />}
                        de={<SummaryArticles groups={rail(page, "de")} />}
                    />
                }
            >
                <article className="w-full">
                    <header className="mb-6">
                        <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                            Interviews ·{" "}
                            <LangText
                                en={<Text text={page.item.name} lang="en" />}
                                de={<Text text={page.item.name} lang="de" />}
                            />
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                            <LangText
                                en={<Text text={page.page.name} lang="en" />}
                                de={<Text text={page.page.name} lang="de" />}
                            />
                        </h1>
                        <div className="mt-3 font-mono text-[0.8rem] text-[var(--muted)]">
                            {total} questions · {ready} ready
                        </div>
                        <PracticeToggle />
                    </header>

                    <Body data={page} assets={assets} />
                </article>
            </PageShell>
        </PracticeProvider>
    );
}
