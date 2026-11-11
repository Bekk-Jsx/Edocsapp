import type { Db } from "mongodb";
import { COLLECTIONS } from "../../src/server/schema";

// ===================================================================
// 0001-init — the collections and indexes the first schema needs.
//
// Additive and idempotent, like every migration here (AGENTS.md > Database):
// creating a collection that exists is swallowed, and createIndex is a no-op
// when the index already matches. Nothing is ever dropped or rebuilt.
// ===================================================================

export const id = "0001-init";

export const description =
    "create nodes / entries / assets collections and their indexes";

export async function up(db: Db): Promise<string[]> {
    const done: string[] = [];

    // Collections are created implicitly by a first write, but creating them
    // up front means the indexes below have something to attach to on a
    // completely empty database.
    for (const name of [
        COLLECTIONS.nodes,
        COLLECTIONS.entries,
        COLLECTIONS.assets,
    ]) {
        try {
            await db.createCollection(name);
            done.push(`created collection ${name}`);
        } catch (error) {
            // 48 = NamespaceExists: already there, which is success here.
            const code = (error as { code?: number }).code;
            if (code !== 48) throw error;
            done.push(`collection ${name} already present`);
        }
    }

    // nodes: the path IS the identity, and a subtree is read by parent+order.
    await db
        .collection(COLLECTIONS.nodes)
        .createIndex({ path: 1 }, { unique: true, name: "path_unique" });
    done.push("index nodes.path (unique)");

    await db
        .collection(COLLECTIONS.nodes)
        .createIndex({ parent: 1, order: 1 }, { name: "parent_order" });
    done.push("index nodes.parent_order");

    // entries: one slug per page; the page read is status+order; the authoring
    // queue is "what is still planned, highest priority first".
    await db
        .collection(COLLECTIONS.entries)
        .createIndex({ page: 1, slug: 1 }, { unique: true, name: "page_slug_unique" });
    done.push("index entries.page+slug (unique)");

    await db
        .collection(COLLECTIONS.entries)
        .createIndex({ page: 1, status: 1, order: 1 }, { name: "page_status_order" });
    done.push("index entries.page+status+order");

    await db
        .collection(COLLECTIONS.entries)
        .createIndex({ status: 1, priority: 1 }, { name: "status_priority" });
    done.push("index entries.status+priority");

    return done;
}
