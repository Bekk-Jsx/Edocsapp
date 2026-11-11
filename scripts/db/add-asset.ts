import path from "node:path";
import { existsSync, statSync } from "node:fs";
import {
    COLLECTIONS,
    SCHEMA_VERSION,
    assetSchema,
    type AssetDoc,
} from "../../src/server/schema";
import { localStorage, mimeForFile } from "../../src/server/storage/local";
import { ROOT, fail, log, withDb } from "./lib";

// ===================================================================
// db:asset <file> --alt-en "…" [--alt-de "…"]
//
// Copies a picture through the storage adapter (today: /storage/assets, which
// is committed), registers it in `assets`, and prints the id to drop into an
// image block. The bytes never go into the database — the collection only
// ever holds metadata and the opaque storage key.
//
// Alt text is required in English: a picture with no description is not
// publishable, so this refuses rather than registering one.
// ===================================================================

function flag(name: string): string | undefined {
    const index = process.argv.indexOf(`--${name}`);
    if (index === -1) return undefined;
    return process.argv[index + 1];
}

async function main() {
    const file = process.argv[2];
    if (!file || file.startsWith("--")) {
        fail(
            "db:asset needs a file.",
            'npm run db:asset -- ./picture.png --alt-en "What it shows"',
        );
    }

    const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
    if (!existsSync(abs)) fail(`No such file: ${file}`);

    const altEn = flag("alt-en");
    if (!altEn) {
        fail(
            "--alt-en is required.",
            'every picture needs a description: --alt-en "What it shows"',
        );
    }
    const altDe = flag("alt-de");

    const fileName = path.basename(abs);
    const mime = mimeForFile(fileName);
    if (!mime) fail(`Unsupported file type: ${fileName}`);

    const bytes = statSync(abs).size;

    await withDb(async (db) => {
        log.step("storing");
        const key = await localStorage.put(abs, fileName);
        log.ok(`storage key ${key}`);

        const doc: Omit<AssetDoc, never> = {
            schemaVersion: SCHEMA_VERSION,
            key,
            fileName,
            mime,
            bytes,
            alt: { en: altEn, ...(altDe ? { de: altDe } : {}) },
            createdAt: new Date(),
        };
        assetSchema.parse(doc);

        const result = await db
            .collection<AssetDoc>(COLLECTIONS.assets)
            .insertOne(doc as AssetDoc);

        log.step("registered");
        log.ok(`asset id ${result.insertedId.toHexString()}`);
        log.detail(`${mime} · ${bytes} bytes`);
        log.info(
            `\nimage block:  { type: "image", assetId: "${result.insertedId.toHexString()}" }`,
        );
        log.info(`served at:    /api/assets/${result.insertedId.toHexString()}`);
        log.info("\nrun npm run db:export and commit db/backup/ and storage/assets/.");
    });
}

void main();
