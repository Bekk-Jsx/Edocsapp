#!/usr/bin/env node
// ===================================================================
// DB PING — checks that the MongoDB connection in .env.local works.
//
//   npm run db:ping
//
// Loads .env.local the way Next.js itself does, with loadEnvConfig from
// @next/env (which ships with Next, so no dotenv dependency), then runs a
// single `ping` command against MONGODB_DB.
//
// The URI carries the password, so it is NEVER printed: success reports the
// database name and the host only, and failures report the driver's message.
// ===================================================================

import path from "node:path";
import { fileURLToPath } from "node:url";
// @next/env is CommonJS, so it has no named ESM exports — take the default.
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";

const { loadEnvConfig } = nextEnv;

// Resolved from this file, not from cwd, so the script works from anywhere.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(ROOT);

const URI = process.env.MONGODB_URI;
const DB = process.env.MONGODB_DB;

/** Config problem: report it and stop before opening a connection. */
function fail(message, hint) {
    console.error(`MongoDB ping failed — ${message}`);
    console.error(`  hint: ${hint}`);
    process.exit(1);
}

if (!URI) {
    fail(
        "MONGODB_URI is not set.",
        "copy .env.example to .env.local and fill in the connection string",
    );
}
if (URI.includes("<PASSWORD>")) {
    fail(
        "MONGODB_URI still contains the <PASSWORD> placeholder.",
        "replace <PASSWORD> in .env.local with the database user's real password",
    );
}
if (!DB) {
    fail(
        "MONGODB_DB is not set.",
        "add MONGODB_DB to .env.local (see .env.example)",
    );
}

/** Host alone — never the URI, which holds the credentials. */
function hostOf(uri) {
    try {
        // mongodb: and mongodb+srv: are non-special schemes; swapping in https
        // lets the URL parser extract the authority reliably.
        return new URL(uri.replace(/^mongodb(\+srv)?:/, "https:")).hostname;
    } catch {
        return "unknown host";
    }
}

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 10_000 });

try {
    await client.connect();
    await client.db(DB).command({ ping: 1 });
    console.log(`MongoDB OK — ${DB} @ ${hostOf(URI)}`);
} catch (error) {
    console.error(`MongoDB ping failed — ${error.message}`);
    console.error(
        "  hint: check Network Access in Atlas and the password in .env.local",
    );
    process.exitCode = 1;
} finally {
    // Runs on success and failure alike, so no handle is left open.
    await client.close();
}
