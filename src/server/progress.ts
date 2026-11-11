import "server-only";

import { cache } from "react";
import { getDb } from "./db";
import {
    COLLECTIONS,
    LOCAL_OWNER,
    SCHEMA_VERSION,
    type ProgressDoc,
    type ProgressState,
} from "./schema";

// ===================================================================
// PROGRESS — what practice mode remembers.
//
// One document per (owner, entry). `owner` is "local" until there are
// accounts, so everything here already takes it as a parameter of the query
// rather than assuming a single user.
//
// Reads are cached per request; writes go only through the server action in
// ./progress-actions.ts, which validates its input and refuses anything that
// is not a real, active question.
// ===================================================================

/** Practice state for every reviewed entry on one page, keyed by entry path. */
export const getProgress = cache(
    async (pagePath: string): Promise<Map<string, ProgressState>> => {
        const out = new Map<string, ProgressState>();
        const db = await getDb();
        const docs = await db
            .collection<ProgressDoc>(COLLECTIONS.progress)
            .find({
                owner: LOCAL_OWNER,
                // Entries of this page only: "<page path>/<slug>".
                entry: { $regex: `^${escapeRegExp(pagePath)}/[^/]+$` },
            })
            .toArray();

        for (const doc of docs) out.set(doc.entry, doc.state);
        return out;
    },
);

/**
 * Records an answer: sets the state, counts the review and stamps the time.
 *
 * Upsert, so the first answer creates the document and later ones update it;
 * `reviews` therefore counts every answer ever given, not just state changes.
 */
export async function setProgress(
    entry: string,
    state: ProgressState,
): Promise<void> {
    const db = await getDb();
    await db.collection<ProgressDoc>(COLLECTIONS.progress).updateOne(
        { owner: LOCAL_OWNER, entry },
        {
            $set: { state, lastReviewedAt: new Date() },
            $inc: { reviews: 1 },
            $setOnInsert: {
                schemaVersion: SCHEMA_VERSION,
                owner: LOCAL_OWNER,
                entry,
            },
        },
        { upsert: true },
    );
}

/** A page path goes into a regex, so its characters are escaped first. */
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
