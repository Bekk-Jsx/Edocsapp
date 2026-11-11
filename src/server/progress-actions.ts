"use server";

import { z } from "zod";
import { getDb } from "./db";
import { setProgress } from "./progress";
import { COLLECTIONS, progressStateSchema, type EntryDoc } from "./schema";

// ===================================================================
// The only way practice progress is ever written.
//
// Everything that arrives here comes from the browser, so it is treated as
// untrusted: the shape is validated with zod, and the entry must actually
// exist AND be active. That stops a hand-made request from seeding progress
// for a hidden question, a planned one, or a path that is not a question at
// all — the collection cannot be used as arbitrary key/value storage.
// ===================================================================

const inputSchema = z.object({
    /** "<page path>/<slug>", e.g. "interviews/…/javascript/closures". */
    entry: z.string().min(3).max(300),
    state: progressStateSchema,
});

export type SaveProgressResult = { ok: true } | { ok: false; error: string };

export async function saveProgress(
    input: unknown,
): Promise<SaveProgressResult> {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid request" };
    const { entry, state } = parsed.data;

    // Split on the LAST slash: everything before it is the page path.
    const cut = entry.lastIndexOf("/");
    if (cut <= 0 || cut === entry.length - 1) {
        return { ok: false, error: "Invalid request" };
    }
    const page = entry.slice(0, cut);
    const slug = entry.slice(cut + 1);

    try {
        const db = await getDb();
        const question = await db
            .collection<EntryDoc>(COLLECTIONS.entries)
            .findOne({ page, slug, status: "active" }, { projection: { _id: 1 } });
        if (!question) return { ok: false, error: "Unknown question" };

        await setProgress(entry, state);
        return { ok: true };
    } catch (error) {
        console.error("[progress] write failed", error);
        return { ok: false, error: "Could not save — database unreachable" };
    }
}
