import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { EJSON } from "bson";
import type { Db } from "mongodb";
import { COLLECTIONS } from "../../src/server/schema";
import { BACKUP_DIR, byId, log, withDb } from "./lib";

// ===================================================================
// db:export — every collection to db/backup/<collection>.json.
//
// Canonical EJSON (relaxed: false), sorted by _id, two-space indent: the
// output is deterministic, so committing db/backup after a content batch
// produces a readable diff instead of a reshuffled blob. That committed
// backup is the second copy of the content — the first being the scripts.
//
// Also runs automatically before db:migrate, so no schema change is ever the
// first thing to touch a database without a snapshot on disk.
// ===================================================================

const ALL = [
    COLLECTIONS.nodes,
    COLLECTIONS.entries,
    COLLECTIONS.assets,
    COLLECTIONS.progress,
    COLLECTIONS.migrations,
] as const;

/** Writes the backup files. Returns the per-collection document counts. */
export async function runExport(db: Db): Promise<Record<string, number>> {
    await mkdir(BACKUP_DIR, { recursive: true });
    const counts: Record<string, number> = {};

    for (const name of ALL) {
        const docs = await db.collection(name).find({}).toArray();
        docs.sort(byId);
        const file = path.join(BACKUP_DIR, `${name}.json`);
        // EJSON keeps Dates and ObjectIds round-trippable, which plain
        // JSON.stringify would flatten into strings.
        await writeFile(
            file,
            `${EJSON.stringify(docs, undefined, 2, { relaxed: false })}\n`,
            "utf8",
        );
        counts[name] = docs.length;
    }
    return counts;
}

async function main() {
    await withDb(async (db) => {
        log.step("exporting collections");
        const counts = await runExport(db);
        for (const [name, n] of Object.entries(counts)) {
            log.ok(`${name}: ${n} document${n === 1 ? "" : "s"}`);
        }
        log.info(`\nwrote db/backup/ — commit it.`);
    });
}

// Only when run directly; importing this for the pre-migrate backup must not
// open a second connection.
if (process.argv[1]?.includes("export")) {
    void main();
}
