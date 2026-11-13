import type { Db } from "mongodb";
import { COLLECTIONS } from "../../src/server/schema";

// ===================================================================
// 0003-phrasebook — EN/DE phrase pairs taken while reading questions.
//
// Additive only: a new collection and its indexes. Nothing existing is
// touched, so no document needs upgrading and no schemaVersion moves.
//
// The index covers how the phrasebook is actually read: everything for one
// owner, narrowed to an item or a page, newest last. `owner` leads so adding
// real accounts later is a change of value, not of shape.
// ===================================================================

export const id = "0003-phrasebook";

export const description = "create the phrasebook collection and its index";

export async function up(db: Db): Promise<string[]> {
    const done: string[] = [];

    try {
        await db.createCollection(COLLECTIONS.phrasebook);
        done.push(`created collection ${COLLECTIONS.phrasebook}`);
    } catch (error) {
        // 48 = NamespaceExists: already there, which is success here.
        const code = (error as { code?: number }).code;
        if (code !== 48) throw error;
        done.push(`collection ${COLLECTIONS.phrasebook} already present`);
    }

    await db
        .collection(COLLECTIONS.phrasebook)
        .createIndex(
            { owner: 1, "link.item": 1, "link.page": 1, createdAt: 1 },
            { name: "owner_item_page_created" },
        );
    done.push("index phrasebook.owner+link.item+link.page+createdAt");

    return done;
}
