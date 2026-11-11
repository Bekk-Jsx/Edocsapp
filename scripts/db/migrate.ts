import { readdirSync } from "node:fs";
import path from "node:path";
import type { Db } from "mongodb";
import { COLLECTIONS, type MigrationDoc } from "../../src/server/schema";
import { MIGRATIONS_DIR, fail, log, withDb } from "./lib";
import { runExport } from "./export";

// ===================================================================
// db:migrate — applies pending db/migrations/* in filename order.
//
// ALWAYS exports first: a schema change never runs against a database that
// has no snapshot on disk. Then each unapplied migration runs and is recorded
// in `migrations`, so a second run reports "nothing to migrate".
//
// Migrations are additive and idempotent by rule (AGENTS.md > Database) —
// nothing here drops or rebuilds anything.
// ===================================================================

/** The shape every db/migrations/*.ts must export. */
type Migration = {
    id: string;
    description?: string;
    up: (db: Db) => Promise<string[] | void>;
};

function migrationFiles(): string[] {
    try {
        return readdirSync(MIGRATIONS_DIR)
            .filter((f) => f.endsWith(".ts"))
            .sort(); // 0001-, 0002-, … so filename order IS apply order
    } catch {
        fail(`No migrations directory at db/migrations`);
    }
}

async function load(file: string): Promise<Migration> {
    const mod: unknown = await import(path.join(MIGRATIONS_DIR, file));
    const m = mod as Partial<Migration>;
    if (typeof m.id !== "string" || typeof m.up !== "function") {
        fail(`db/migrations/${file} must export \`id\` and \`up(db)\``);
    }
    return { id: m.id, description: m.description, up: m.up };
}

async function main() {
    await withDb(async (db) => {
        // --- automatic backup, before anything is touched ---
        log.step("backup before migrating");
        const counts = await runExport(db);
        log.ok(
            Object.entries(counts)
                .map(([n, c]) => `${n}:${c}`)
                .join(" · ") || "empty database",
        );

        const applied = new Set(
            (
                await db
                    .collection<MigrationDoc>(COLLECTIONS.migrations)
                    .find({})
                    .toArray()
            ).map((d) => d._id),
        );

        const files = migrationFiles();
        const pending: Migration[] = [];
        for (const file of files) {
            const migration = await load(file);
            if (!applied.has(migration.id)) pending.push(migration);
        }

        if (!pending.length) {
            log.step("nothing to migrate");
            log.detail(`${files.length} migration(s) already applied`);
            return;
        }

        log.step(`applying ${pending.length} migration(s)`);
        for (const migration of pending) {
            log.info(`  ${migration.id}${migration.description ? ` — ${migration.description}` : ""}`);
            const steps = (await migration.up(db)) ?? [];
            for (const step of steps) log.detail(`· ${step}`);
            await db
                .collection<MigrationDoc>(COLLECTIONS.migrations)
                .updateOne(
                    { _id: migration.id },
                    { $setOnInsert: { appliedAt: new Date() } },
                    { upsert: true },
                );
            log.ok(`${migration.id} applied`);
        }
    });
}

void main();
