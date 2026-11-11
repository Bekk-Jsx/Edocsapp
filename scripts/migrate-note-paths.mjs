#!/usr/bin/env node
// ===================================================================
// MIGRATE NOTE PATHS — one-time, idempotent.
//
//   node scripts/migrate-note-paths.mjs            apply
//   node scripts/migrate-note-paths.mjs --dry-run  report only
//
// Notes live in src/data/notes/<project>.json (see src/lib/notes-store.ts) and
// a note's optional `link` holds an internal path such as
// /hooks-refresh/use-state#arrays. Projects moved to /projects/<slug>, so those
// stored paths need the new prefix.
//
// Idempotent by construction: only a link whose first segment is a known
// project slug is rewritten. A link already under /projects/, an external
// http(s) link, and anything pointing outside the projects are all left
// untouched, so re-running changes nothing and reports 0.
// ===================================================================

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOTES_DIR = path.join(ROOT, "src", "data", "notes");
const DRY_RUN = process.argv.includes("--dry-run");

// Must match PROJECTS_SEGMENT in src/lib/routes.ts.
const PROJECTS_SEGMENT = "projects";

/** The project slugs, read straight from the registry — no duplicate list. */
function projectSlugs() {
    const file = path.join(ROOT, "src", "lib", "projects.ts");
    const src = readFileSync(file, "utf8");
    const slugs = [...src.matchAll(/^\s*slug:\s*"([a-z0-9-]+)"/gm)].map(
        (m) => m[1],
    );
    if (!slugs.length) throw new Error(`No project slugs found in ${file}`);
    return new Set(slugs);
}

/**
 * Returns the migrated link, or null when it needs no change.
 * Only the first segment is inspected; the page, the hash and any query
 * survive untouched.
 */
function migrateLink(link, slugs) {
    if (typeof link !== "string" || !link.startsWith("/")) return null;
    const [, first] = link.split("/");
    if (first === PROJECTS_SEGMENT) return null; // already migrated
    if (!slugs.has(first)) return null; // not a project path
    return `/${PROJECTS_SEGMENT}${link}`;
}

const slugs = projectSlugs();

if (!existsSync(NOTES_DIR)) {
    console.log(`No notes directory at ${path.relative(ROOT, NOTES_DIR)} — nothing to migrate.`);
    process.exit(0);
}

let notesSeen = 0;
let notesChanged = 0;
let filesChanged = 0;

for (const name of readdirSync(NOTES_DIR).filter((f) => f.endsWith(".json"))) {
    const file = path.join(NOTES_DIR, name);
    let notes;
    try {
        notes = JSON.parse(readFileSync(file, "utf8"));
    } catch {
        console.warn(`  skipped ${name} — not valid JSON`);
        continue;
    }
    if (!Array.isArray(notes)) {
        console.warn(`  skipped ${name} — not an array of notes`);
        continue;
    }

    let changedHere = 0;
    for (const note of notes) {
        notesSeen++;
        const next = migrateLink(note?.link, slugs);
        if (!next) continue;
        console.log(`  ${name}: ${note.link}  ->  ${next}`);
        note.link = next;
        changedHere++;
    }

    if (changedHere) {
        // Same shape notes-store.ts writes: 2-space JSON, trailing newline.
        if (!DRY_RUN) writeFileSync(file, `${JSON.stringify(notes, null, 2)}\n`, "utf8");
        notesChanged += changedHere;
        filesChanged++;
    }
}

const verb = DRY_RUN ? "would change" : "changed";
console.log(
    `\n${verb} ${notesChanged} note${notesChanged === 1 ? "" : "s"} in ${filesChanged} file${filesChanged === 1 ? "" : "s"} (${notesSeen} notes checked).`,
);
if (DRY_RUN && notesChanged) console.log("Dry run — nothing was written.");
