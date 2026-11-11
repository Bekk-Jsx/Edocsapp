import type { Db } from "mongodb";
import { COLLECTIONS } from "../../src/server/schema";

// ===================================================================
// 0002-progress — the practice-progress collection.
//
// Additive only: a new collection and one index. Nothing existing is touched,
// so there is nothing to upgrade in place and no schemaVersion to bump on any
// other document.
//
// The unique index is { owner, entry } rather than { entry } from the start,
// so adding real accounts later is a change of value, not of shape.
// ===================================================================

export const id = "0002-progress";

export const description = "create the progress collection and its index";

export async function up(db: Db): Promise<string[]> {
    const done: string[] = [];

    try {
        await db.createCollection(COLLECTIONS.progress);
        done.push(`created collection ${COLLECTIONS.progress}`);
    } catch (error) {
        // 48 = NamespaceExists: already there, which is success here.
        const code = (error as { code?: number }).code;
        if (code !== 48) throw error;
        done.push(`collection ${COLLECTIONS.progress} already present`);
    }

    await db
        .collection(COLLECTIONS.progress)
        .createIndex(
            { owner: 1, entry: 1 },
            { unique: true, name: "owner_entry_unique" },
        );
    done.push("index progress.owner+entry (unique)");

    return done;
}
