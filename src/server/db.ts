import "server-only";

import { MongoClient, type Db } from "mongodb";

// ===================================================================
// DB — the app's single connection to MongoDB.
//
// `server-only` is the guard: importing this from a client component is a
// build error rather than a runtime leak of the connection string. The
// SCRIPTS deliberately do NOT import this module (they would trip that guard
// outside the Next build); they open their own client in scripts/db/lib.ts.
//
// One client per process, cached on globalThis so dev HMR reuses it instead of
// opening a new pool on every edit — the standard Next pattern.
//
// The URI holds the password, so it is never logged: errors name the missing
// variable, and the host alone is exposed through dbHost().
// ===================================================================

const MISSING = (name: string) =>
    new Error(
        `${name} is not set. Copy .env.example to .env.local and fill it in (see scripts/db-ping.mjs).`,
    );

// The cache survives HMR; the type is declared rather than cast to keep strict
// mode honest about what lives on globalThis.
const globalForMongo = globalThis as unknown as {
    __mongoClient?: MongoClient;
    __mongoClientPromise?: Promise<MongoClient>;
};

function clientPromise(): Promise<MongoClient> {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw MISSING("MONGODB_URI");

    if (!globalForMongo.__mongoClientPromise) {
        const client = new MongoClient(uri, {
            // Fail in seconds rather than hanging a render: the home page
            // catches this and shows its "database not reachable" state.
            serverSelectionTimeoutMS: 5_000,
        });
        globalForMongo.__mongoClient = client;
        globalForMongo.__mongoClientPromise = client.connect().catch((error) => {
            // A failed attempt must not be cached, or the process can never
            // recover once Atlas comes back.
            delete globalForMongo.__mongoClient;
            delete globalForMongo.__mongoClientPromise;
            throw error;
        });
    }
    return globalForMongo.__mongoClientPromise;
}

/** The application database named by MONGODB_DB. */
export async function getDb(): Promise<Db> {
    const name = process.env.MONGODB_DB;
    if (!name) throw MISSING("MONGODB_DB");
    const client = await clientPromise();
    return client.db(name);
}

/** Host only — safe to log or show. Never the URI, which carries credentials. */
export function dbHost(): string {
    const uri = process.env.MONGODB_URI;
    if (!uri) return "unknown host";
    try {
        return new URL(uri.replace(/^mongodb(\+srv)?:/, "https:")).hostname;
    } catch {
        return "unknown host";
    }
}
