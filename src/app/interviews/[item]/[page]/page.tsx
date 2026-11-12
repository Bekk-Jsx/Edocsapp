import { notFound } from "next/navigation";
import { InterviewsUnavailable } from "@/components/home/interviews-content";
import { Text } from "@/components/interviews/inline";
import {
    LangPair,
    LangText,
    RailCardTitle,
} from "@/components/interviews/lang-provider";
import { CodeOpenProvider } from "@/components/interviews/code-collapse";
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

/** The priority parts, shared by the rail and the main column. */
type Parts = ReturnType<typeof byPriority>;

/**
 * One rail card per question: planned ones say "soon", answered ones show
 * their practice state (a client component, so it follows the mode).
 *
 * The title is a client component too, so each card follows ITS section's
 * language — the global switch and that section's own override alike. That is
 * why the rail is rendered ONCE rather than once per language.
 *
 * The `key` on each `text` element is required, not decorative. These elements
 * are built inside a .map(), so React has not key-validated them, and they
 * then travel inside the `items` array from this server component into the
 * client SummaryArticles — where React flags them as unkeyed list children.
 * (The project rails avoid this only because their `text` is written in static
 * array literals rather than produced in a loop.)
 */
function railCard(entry: QuestionEntry): SummaryArticle {
    return {
        title: <RailCardTitle sectionId={entry.slug} text={entry.title} />,
        href: `#${entry.slug}`,
        text:
            entry.status === "planned" ? (
                <span key={entry.slug} className="text-[var(--muted)]">
                    coming soon
                </span>
            ) : (
                <RailState key={entry.slug} slug={entry.slug} />
            ),
    };
}

/** The rail, from the SAME parts the main column renders — no second query. */
function railGroups(parts: Parts): SummaryGroup[] {
    return parts.map((part) => ({
        label: part.label,
        items: part.entries.map((entry) => railCard(entry)),
    }));
}

/**
 * Dev-only guard: the rail and the main column must list exactly the same
 * questions. They are built from one `parts` array, so this can only fire if
 * a filter is added to one side later — which is precisely when it is useful.
 */
function assertRailMatches(
    pagePath: string,
    groups: SummaryGroup[],
    parts: Parts,
): void {
    if (process.env.NODE_ENV === "production") return;
    const railSlugs = groups.flatMap((g) =>
        g.items.map((i) => i.href.replace(/^#/, "")),
    );
    const rendered = parts.flatMap((p) => p.entries.map((e) => e.slug));
    if (railSlugs.length === rendered.length) return;

    const missing = rendered.filter((slug) => !railSlugs.includes(slug));
    const extra = railSlugs.filter((slug) => !rendered.includes(slug));
    console.error(
        `[interviews] rail/question mismatch on ${pagePath}: ` +
            `${railSlugs.length} rail card(s) vs ${rendered.length} rendered question(s)` +
            (missing.length ? ` — missing from rail: ${missing.join(", ")}` : "") +
            (extra.length ? ` — extra in rail: ${extra.join(", ")}` : ""),
    );
}

function Body({
    parts,
    assets,
}: {
    /** The SAME array the rail is built from, so the two cannot diverge. */
    parts: Parts;
    assets: Map<string, AssetInfo>;
}) {
    return (
        <>
            {parts.map((part) => (
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

    // ONE source for both columns: the rail and the body read this array.
    const parts = byPriority(page.entries);
    const groups = railGroups(parts);
    assertRailMatches(page.page.path, groups, parts);

    return (
        // Everything that practice mode touches — the toggle, the sections and
        // the rail dots — reads one provider, so the count and the chips can
        // never disagree.
        <PracticeProvider
            pagePath={page.page.path}
            initialProgress={progress}
            total={ready}
        >
            {/* Holds which code blocks are open, shared across each section's
                two language copies so switching EN/DE does not collapse them. */}
            <CodeOpenProvider>
            <PageShell
                // One rail, not one per language: each card's title follows
                // its own section's language (see RailCardTitle).
                alerts={<SummaryArticles groups={groups} />}
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

                    <Body parts={parts} assets={assets} />
                </article>
            </PageShell>
            </CodeOpenProvider>
        </PracticeProvider>
    );
}
