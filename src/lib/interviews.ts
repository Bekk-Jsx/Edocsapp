import "server-only";

import { cache } from "react";
import { getDb } from "@/server/db";
import {
    COLLECTIONS,
    localized,
    type EntryDoc,
    type NodeDoc,
} from "@/server/schema";
import type { ProjectStatus } from "./projects";
import { interviewItemHref } from "./routes";

// ===================================================================
// INTERVIEWS — the whole interview tree, read from MongoDB.
//
//   Interviews -> sub-category -> item -> pages
//
// getInterviewTree() is still the ONLY way the UI reads the tree; it just
// reads `nodes` and `entries` now instead of a literal. Hidden nodes and
// hidden entries are filtered out here, so no caller can leak one by
// forgetting a check.
//
// `server-only`: this opens the database, so importing it from a client
// component is a build error. Client components take the tree as a prop and
// import the TYPES below with `import type`, which is erased at compile time.
//
// cache() makes each loader run at most once per request, so the home page's
// sidebar and main area share one round trip.
// ===================================================================

/** One interview item — a set of pages, addressable at its own href. */
export interface InterviewItem {
    slug: string;
    name: string;
    summary: string;
    href: string;
    status: ProjectStatus;
    /**
     * True while the item is scaffolded but not published: its card is greyed
     * with a "coming soon" pill, exactly like a planned question, and it still
     * links to its landing.
     */
    planned: boolean;
    /** Non-hidden questions across the item's pages. */
    questionCount: number;
    /** Questions whose answer is published (status "active"). */
    readyCount: number;
}

/** One sub-category, the level that groups items in the sidebar. */
export interface InterviewCategory {
    slug: string;
    name: string;
    items: InterviewItem[];
}

/** One page inside an item, as the item's placeholder page lists them. */
export interface InterviewPage {
    slug: string;
    name: string;
    questionCount: number;
    readyCount: number;
}

export const AREA_PATH = "interviews";

/** A node's status, mapped onto the badge vocabulary the cards already use. */
function badgeStatus(status: NodeDoc["status"]): ProjectStatus {
    return status === "active" ? "in-progress" : "not-started";
}

type Counts = { questionCount: number; readyCount: number };

/** Visible questions and published answers for a set of page paths. */
async function countFor(pagePaths: string[]): Promise<Map<string, Counts>> {
    const counts = new Map<string, Counts>();
    if (!pagePaths.length) return counts;

    const db = await getDb();
    const rows = await db
        .collection<EntryDoc>(COLLECTIONS.entries)
        .aggregate<{ _id: string; questionCount: number; readyCount: number }>([
            // Hidden entries (duplicates, out-of-stack) are never counted.
            { $match: { page: { $in: pagePaths }, status: { $ne: "hidden" } } },
            {
                $group: {
                    _id: "$page",
                    questionCount: { $sum: 1 },
                    readyCount: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                    },
                },
            },
        ])
        .toArray();

    for (const row of rows) {
        counts.set(row._id, {
            questionCount: row.questionCount,
            readyCount: row.readyCount,
        });
    }
    return counts;
}

/**
 * The whole visible subtree in one pass, cached per request.
 *
 * Throws when the database is unreachable — the home page catches that and
 * renders its "Interviews are unavailable" state rather than failing.
 */
const loadInterviews = cache(
    async (): Promise<{
        name: string;
        summary: string;
        categories: InterviewCategory[];
    }> => {
        const db = await getDb();
        const nodes = db.collection<NodeDoc>(COLLECTIONS.nodes);

        // One query for the area and everything under it, ordered as seeded.
        const all = await nodes
            .find({
                $or: [{ path: AREA_PATH }, { path: { $regex: `^${AREA_PATH}/` } }],
                status: { $ne: "hidden" },
            })
            .sort({ order: 1 })
            .toArray();

        const area = all.find((n) => n.path === AREA_PATH && n.type === "area");
        if (!area) {
            // Migrated but not seeded yet: an empty tree, not an error.
            return { name: "Interviews", summary: "", categories: [] };
        }

        const byParent = (parent: string, type: NodeDoc["type"]) =>
            all
                .filter((n) => n.parent === parent && n.type === type)
                .sort((a, b) => a.order - b.order);

        // Count once for every page in the subtree rather than per item.
        const pageNodes = all.filter((n) => n.type === "page");
        const counts = await countFor(pageNodes.map((n) => n.path));

        const categories: InterviewCategory[] = byParent(area.path, "category").map(
            (category) => ({
                slug: category.slug,
                name: localized(category.name),
                items: byParent(category.path, "item").map((item) => {
                    const pages = pageNodes.filter((p) => p.parent === item.path);
                    const totals = pages.reduce<Counts>(
                        (acc, page) => {
                            const c = counts.get(page.path);
                            return {
                                questionCount: acc.questionCount + (c?.questionCount ?? 0),
                                readyCount: acc.readyCount + (c?.readyCount ?? 0),
                            };
                        },
                        { questionCount: 0, readyCount: 0 },
                    );
                    return {
                        slug: item.slug,
                        name: localized(item.name),
                        summary: item.summary ? localized(item.summary) : "",
                        href: interviewItemHref(item.slug),
                        status: badgeStatus(item.status),
                        planned: item.status !== "active",
                        ...totals,
                    };
                }),
            }),
        );

        return {
            name: localized(area.name),
            summary: area.summary ? localized(area.summary) : "",
            categories,
        };
    },
);

/** The tree, in display order. Same return shape as the static version. */
export async function getInterviewTree(): Promise<InterviewCategory[]> {
    return (await loadInterviews()).categories;
}

/** The one-line summary under the "Interviews" heading, from the area node. */
export async function getInterviewAreaSummary(): Promise<string> {
    return (await loadInterviews()).summary;
}

/** One item by slug, or null — used by the item route to 404 properly. */
export async function getInterviewItem(slug: string): Promise<{
    item: InterviewItem;
    categoryName: string;
} | null> {
    for (const category of await getInterviewTree()) {
        const item = category.items.find((i) => i.slug === slug);
        if (item) return { item, categoryName: category.name };
    }
    return null;
}

/** The item's visible pages, in order, with their counts. */
export const getInterviewPages = cache(
    async (itemSlug: string): Promise<InterviewPage[]> => {
        const db = await getDb();
        const itemPath = `${AREA_PATH}/`;
        const pages = await db
            .collection<NodeDoc>(COLLECTIONS.nodes)
            .find({
                type: "page",
                status: { $ne: "hidden" },
                // The sub-category is not in the URL, so the item is matched by
                // its slug anywhere under the area.
                parent: { $regex: `^${itemPath}.*/${itemSlug}$` },
            })
            .sort({ order: 1 })
            .toArray();

        const counts = await countFor(pages.map((p) => p.path));
        return pages.map((page) => {
            const c = counts.get(page.path);
            return {
                slug: page.slug,
                name: localized(page.name),
                questionCount: c?.questionCount ?? 0,
                readyCount: c?.readyCount ?? 0,
            };
        });
    },
);
