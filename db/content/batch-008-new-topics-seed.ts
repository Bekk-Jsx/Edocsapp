import { CATEGORY, ITEM, PAGES, type SeedPage } from "../seeds/interviews";
import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// BATCH 008 — tags for the 58 questions added with the new topic pages.
//
// The questions themselves are NOT inserted here: `db:content` upserts by
// { page, slug } and skips a pair it does not find (scripts/db/content.ts),
// and `ContentEntry` has no `order` field at all — structure belongs to
// db:seed, which inserted these 58 with `$setOnInsert` and `tags: []`.
// This batch adds the one thing the seed cannot express per page: the topic
// tag.
//
// Titles and priorities are read straight out of db/seeds/interviews.ts
// rather than retyped, so this file cannot drift from the seed. The tags are
// the only values it actually owns, and the only fields that change: every
// entry's title, priority and status already match, so db:content reports
// them as changed on the tag alone.
//
// SCOPE is an allowlist, not a filter on "everything new": the four Git
// questions sit on a page whose other ten are untouched, and nothing outside
// these pages and slugs can be reached from here.
// ===================================================================

/** The topic tag per page slug. One tag — the page's subject. */
const TAGS: Record<string, string> = {
    testing: "testing",
    "apis-realtime": "apis-realtime",
    "cloud-devops": "cloud-devops",
    payments: "payments",
    "data-visualization": "data-visualization",
    "your-ai-workflow": "ai-workflow",
    "quality-responsibility": "ai-quality",
    "tool-landscape": "ai-tools",
    "ai-tech-stack": "ai-stack",
};

/**
 * The four Git questions appended to the existing Git & Tools page, by slug.
 * The ten the seed wrote before them keep `tags: []` — retagging them would
 * be a content change nobody asked for.
 */
const GIT_SLUGS = [
    "merge-conflicts",
    "branching-strategies",
    "reset-revert-restore",
    "cherry-pick-stash",
] as const;

const pagePath = (page: SeedPage) =>
    `${page.item ? `${CATEGORY.path}/${page.item}` : ITEM.path}/${page.slug}`;

const tagged = (page: SeedPage, tag: string, slugs?: readonly string[]) =>
    page.questions
        .filter((question) => !slugs || slugs.includes(question.slug))
        .map(
            (question): ContentEntry => ({
                page: pagePath(page),
                slug: question.slug,
                title: question.title,
                blocks: [],
                status: question.status,
                priority: question.priority,
                tags: [tag],
            }),
        );

const find = (slug: string): SeedPage => {
    const page = PAGES.find((p) => p.slug === slug);
    if (!page) throw new Error(`batch-008: no seeded page "${slug}"`);
    return page;
};

export const entries: ContentEntry[] = [
    ...Object.entries(TAGS).flatMap(([slug, tag]) => tagged(find(slug), tag)),
    ...tagged(find("git-tools"), "git", GIT_SLUGS),
];
