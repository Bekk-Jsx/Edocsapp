import "server-only";

import { cache } from "react";
import { ObjectId } from "mongodb";
import { getDb } from "./db";
import {
    COLLECTIONS,
    safeBlocks,
    type AssetDoc,
    type Block,
    type EntryDoc,
    type NodeDoc,
    type Priority,
} from "./schema";

// ===================================================================
// INTERVIEWS (server) — every query the interview pages make.
//
// Hidden nodes and hidden entries are filtered out HERE, so no page can leak
// one by forgetting a check: a hidden page addressed directly simply is not
// found.
//
// These return null for "no such thing" rather than calling notFound()
// themselves. The pages call notFound(), which keeps "unknown" (404) apart
// from "database unreachable" (an error state) — a notFound() thrown inside a
// query would be swallowed by the try/catch that handles the outage.
//
// cache() dedupes per request: a page's header, its rail and its body all read
// the same documents once.
// ===================================================================

export const AREA_PATH = "interviews";

/** Priority order for the parts of a question page. */
export const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];

export const PRIORITY_LABEL: Record<Priority, string> = {
    high: "High priority",
    medium: "Medium priority",
    low: "Low priority",
};

export type ItemNode = {
    slug: string;
    path: string;
    name: NodeDoc["name"];
    summary?: NodeDoc["summary"];
    categoryName: NodeDoc["name"];
};

export type PageSummary = {
    slug: string;
    path: string;
    name: NodeDoc["name"];
    questionCount: number;
    readyCount: number;
    /** Visible questions per priority, for the breakdown on the card. */
    byPriority: Record<Priority, number>;
};

export type QuestionEntry = {
    slug: string;
    title: EntryDoc["title"];
    shortAnswer?: EntryDoc["shortAnswer"];
    blocks: Block[];
    followUps?: EntryDoc["followUps"];
    priority: Priority;
    /** Only "active" or "planned" ever reach a page. */
    status: "active" | "planned";
    order: number;
};

export type PageWithEntries = {
    page: { slug: string; path: string; name: NodeDoc["name"] };
    item: ItemNode;
    entries: QuestionEntry[];
};

/** Every visible node of the interviews subtree, read once per request. */
const visibleNodes = cache(async (): Promise<NodeDoc[]> => {
    const db = await getDb();
    return db
        .collection<NodeDoc>(COLLECTIONS.nodes)
        .find({
            $or: [{ path: AREA_PATH }, { path: { $regex: `^${AREA_PATH}/` } }],
            status: { $ne: "hidden" },
        })
        .sort({ order: 1 })
        .toArray();
});

/** One item by slug, with the name of the category above it. */
export const getItem = cache(async (slug: string): Promise<ItemNode | null> => {
    const nodes = await visibleNodes();
    const item = nodes.find((n) => n.type === "item" && n.slug === slug);
    if (!item) return null;
    const category = nodes.find((n) => n.path === item.parent);
    if (!category) return null;
    return {
        slug: item.slug,
        path: item.path,
        name: item.name,
        summary: item.summary,
        categoryName: category.name,
    };
});

/** Visible questions per page path: totals, published, and per priority. */
async function countsFor(
    pagePaths: string[],
): Promise<Map<string, Omit<PageSummary, "slug" | "path" | "name">>> {
    const out = new Map<string, Omit<PageSummary, "slug" | "path" | "name">>();
    if (!pagePaths.length) return out;

    const db = await getDb();
    const rows = await db
        .collection<EntryDoc>(COLLECTIONS.entries)
        .aggregate<{ _id: { page: string; priority: Priority }; n: number; ready: number }>([
            { $match: { page: { $in: pagePaths }, status: { $ne: "hidden" } } },
            {
                $group: {
                    _id: { page: "$page", priority: "$priority" },
                    n: { $sum: 1 },
                    ready: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                    },
                },
            },
        ])
        .toArray();

    for (const path of pagePaths) {
        out.set(path, {
            questionCount: 0,
            readyCount: 0,
            byPriority: { high: 0, medium: 0, low: 0 },
        });
    }
    for (const row of rows) {
        const bucket = out.get(row._id.page);
        if (!bucket) continue;
        bucket.questionCount += row.n;
        bucket.readyCount += row.ready;
        bucket.byPriority[row._id.priority] += row.n;
    }
    return out;
}

/** The item's visible pages, in order, with their counts. */
export const getItemPages = cache(
    async (itemSlug: string): Promise<PageSummary[]> => {
        const item = await getItem(itemSlug);
        if (!item) return [];
        const nodes = await visibleNodes();
        const pages = nodes
            .filter((n) => n.type === "page" && n.parent === item.path)
            .sort((a, b) => a.order - b.order);

        const counts = await countsFor(pages.map((p) => p.path));
        return pages.map((page) => ({
            slug: page.slug,
            path: page.path,
            name: page.name,
            ...(counts.get(page.path) ?? {
                questionCount: 0,
                readyCount: 0,
                byPriority: { high: 0, medium: 0, low: 0 },
            }),
        }));
    },
);

/** One page with its visible questions, ordered by priority then `order`. */
export const getPage = cache(
    async (itemSlug: string, pageSlug: string): Promise<PageWithEntries | null> => {
        const item = await getItem(itemSlug);
        if (!item) return null;

        const nodes = await visibleNodes();
        const page = nodes.find(
            (n) =>
                n.type === "page" && n.parent === item.path && n.slug === pageSlug,
        );
        if (!page) return null;

        const db = await getDb();
        const docs = await db
            .collection<EntryDoc>(COLLECTIONS.entries)
            .find({ page: page.path, status: { $ne: "hidden" } })
            .sort({ order: 1 })
            .toArray();

        const entries: QuestionEntry[] = docs.map((doc) => ({
            slug: doc.slug,
            title: doc.title,
            shortAnswer: doc.shortAnswer,
            // Read path: an invalid block is dropped with a server warning
            // rather than taking the page down.
            blocks: safeBlocks(doc.blocks, `${doc.page}/${doc.slug}`),
            followUps: doc.followUps,
            priority: doc.priority,
            status: doc.status === "active" ? "active" : "planned",
            order: doc.order,
        }));

        return {
            page: { slug: page.slug, path: page.path, name: page.name },
            item,
            entries,
        };
    },
);

/** Group a page's questions into the three priority parts, empties dropped. */
export function byPriority(
    entries: QuestionEntry[],
): { priority: Priority; label: string; entries: QuestionEntry[] }[] {
    return PRIORITY_ORDER.map((priority) => ({
        priority,
        label: PRIORITY_LABEL[priority],
        entries: entries
            .filter((e) => e.priority === priority)
            .sort((a, b) => a.order - b.order),
    })).filter((part) => part.entries.length > 0);
}

export type AssetInfo = {
    alt: AssetDoc["alt"];
    width?: number;
    height?: number;
};

/** Metadata for the assets an image block refers to, keyed by id string. */
export const getAssets = cache(
    async (ids: string[]): Promise<Map<string, AssetInfo>> => {
        const out = new Map<string, AssetInfo>();
        const valid = ids.filter((id) => ObjectId.isValid(id));
        if (!valid.length) return out;

        const db = await getDb();
        const docs = await db
            .collection<AssetDoc>(COLLECTIONS.assets)
            .find({ _id: { $in: valid.map((id) => new ObjectId(id)) } })
            .toArray();

        for (const doc of docs) {
            out.set(String(doc._id), {
                alt: doc.alt,
                width: doc.width,
                height: doc.height,
            });
        }
        return out;
    },
);

/** Every assetId used by an image block, including inside a compare block. */
export function imageAssetIds(blocks: Block[]): string[] {
    const ids: string[] = [];
    const walk = (list: Block[]) => {
        for (const block of list) {
            if (block.type === "image") ids.push(block.assetId);
            else if (block.type === "compare") {
                walk(block.left.blocks);
                walk(block.right.blocks);
            }
        }
    };
    walk(blocks);
    return [...new Set(ids)];
}
