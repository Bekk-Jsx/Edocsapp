import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { EJSON } from "bson";
import { BACKUP_DIR, fail, log, withDb } from "./lib";

// ===================================================================
// db:restore --confirm — upserts db/backup/*.json back into the database.
//
// NEVER deletes: a document present in the database but absent from the
// backup is left exactly as it is. So this restores lost or rolled-back
// documents without ever being a way to lose current ones.
//
// --confirm is required because this does write to every collection.
// ===================================================================

type Doc = { _id: unknown } & Record<string, unknown>;

async function main() {
    if (!process.argv.includes("--confirm")) {
        fail(
            "db:restore needs --confirm.",
            "npm run db:restore -- --confirm (upserts db/backup/*.json; deletes nothing)",
        );
    }

    let files: string[];
    try {
        files = (await readdir(BACKUP_DIR)).filter((f) => f.endsWith(".json")).sort();
    } catch {
        fail(`No backup directory at db/backup`, "run npm run db:export first");
    }
    if (!files.length) fail("db/backup is empty — nothing to restore");

    await withDb(async (db) => {
        for (const file of files) {
            const name = path.basename(file, ".json");
            const raw = await readFile(path.join(BACKUP_DIR, file), "utf8");
            const parsed: unknown = EJSON.parse(raw, { relaxed: false });
            if (!Array.isArray(parsed)) {
                log.warn(`${file}: not an array — skipped`);
                continue;
            }
            const docs = parsed as Doc[];

            log.step(`${name}: ${docs.length} document(s)`);
            let written = 0;
            for (const doc of docs) {
                const { _id, ...rest } = doc;
                if (_id === undefined) {
                    log.warn("document without _id — skipped");
                    continue;
                }
                await db
                    .collection(name)
                    // $set, not replaceOne: a field the backup does not know
                    // about (added by a later migration) survives.
                    .updateOne({ _id } as never, { $set: rest }, { upsert: true });
                written++;
            }
            log.ok(`${written} upserted (0 deleted — restore never deletes)`);
        }
    });
}

void main();
