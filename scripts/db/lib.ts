// ===================================================================
// SCRIPT LIB — what every db script shares: env, connection, logging,
// and the two upsert shapes the rules in AGENTS.md allow.
//
// These scripts run under `tsx`, OUTSIDE the Next build, so they deliberately
// do not import src/server/db.ts (that module is `server-only`). They open
// their own short-lived client and always close it. They DO import
// src/server/schema.ts — the validators are shared with the app by design.
//
// The URI is never printed; the host alone is (see host()).
// ===================================================================

import path from "node:path";
import * as nextEnvModule from "@next/env";
import { MongoClient, type Db } from "mongodb";

// @next/env is CommonJS, and these scripts run through tsx — which emits CJS
// here (package.json has no "type": "module"). Under CJS the named bindings
// are on module.exports; under real ESM they arrive on `default`. Taking
// whichever carries loadEnvConfig keeps the script working either way.
type NextEnv = { loadEnvConfig: (dir: string) => unknown };
const candidate = nextEnvModule as unknown as
    | NextEnv
    | { default?: NextEnv };
const nextEnv: NextEnv =
    "loadEnvConfig" in candidate && typeof candidate.loadEnvConfig === "function"
        ? candidate
        : ((candidate as { default?: NextEnv }).default as NextEnv);

if (!nextEnv?.loadEnvConfig) {
    throw new Error("@next/env did not expose loadEnvConfig");
}
const { loadEnvConfig } = nextEnv;

/** Repo root. npm scripts always run with cwd at the package root. */
export const ROOT = process.cwd();
export const BACKUP_DIR = path.join(ROOT, "db", "backup");
export const MIGRATIONS_DIR = path.join(ROOT, "db", "migrations");

// -------------------------------------------------------------------
// logging — plain, greppable, no dependency
// -------------------------------------------------------------------

export const log = {
    info: (msg: string) => console.log(msg),
    step: (msg: string) => console.log(`\n▸ ${msg}`),
    ok: (msg: string) => console.log(`  ✓ ${msg}`),
    warn: (msg: string) => console.warn(`  ! ${msg}`),
    detail: (msg: string) => console.log(`    ${msg}`),
};

/** Host only — the URI carries the password and is never logged. */
export function host(): string {
    const uri = process.env.MONGODB_URI;
    if (!uri) return "unknown host";
    try {
        return new URL(uri.replace(/^mongodb(\+srv)?:/, "https:")).hostname;
    } catch {
        return "unknown host";
    }
}

/** Exits with a clear message rather than a stack trace. */
export function fail(message: string, hint?: string): never {
    console.error(`\n✗ ${message}`);
    if (hint) console.error(`  hint: ${hint}`);
    process.exit(1);
}

// -------------------------------------------------------------------
// connection
// -------------------------------------------------------------------

/** Loads .env.local the way Next does, then validates what we need. */
function env(): { uri: string; dbName: string } {
    loadEnvConfig(ROOT);
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    if (!uri) {
        fail(
            "MONGODB_URI is not set.",
            "copy .env.example to .env.local and fill in the connection string",
        );
    }
    if (uri.includes("<PASSWORD>")) {
        fail(
            "MONGODB_URI still contains the <PASSWORD> placeholder.",
            "replace <PASSWORD> in .env.local with the real password",
        );
    }
    if (!dbName) fail("MONGODB_DB is not set.", "add it to .env.local");
    return { uri, dbName };
}

/**
 * Runs `work` against the database and always closes the client, so a failing
 * script never leaves a connection open.
 */
export async function withDb<T>(work: (db: Db) => Promise<T>): Promise<T> {
    const { uri, dbName } = env();
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
    try {
        await client.connect();
        log.info(`connected — ${dbName} @ ${host()}`);
        return await work(client.db(dbName));
    } catch (error) {
        if (error instanceof Error && /ECONNREFUSED|ServerSelection|timed out/i.test(error.message)) {
            fail(
                `Cannot reach the database — ${error.message}`,
                "check Network Access in Atlas and the password in .env.local",
            );
        }
        throw error;
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------
// write helpers
// -------------------------------------------------------------------

/** Counts for the summary every script prints. */
export type Tally = {
    created: number;
    updated: number;
    unchanged: number;
};

export const emptyTally = (): Tally => ({
    created: 0,
    updated: 0,
    unchanged: 0,
});

export function tallyLine(t: Tally): string {
    return `created ${t.created} · updated ${t.updated} · unchanged ${t.unchanged}`;
}

/** Shallow structural comparison, enough to tell "unchanged" from "updated". */
export function sameValue(a: unknown, b: unknown): boolean {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Sort key for stable, diff-friendly export files. */
export function byId(a: { _id: unknown }, b: { _id: unknown }): number {
    return String(a._id).localeCompare(String(b._id));
}
