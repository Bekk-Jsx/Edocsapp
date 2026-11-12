import {
    COLLECTIONS,
    entryLocalizedFields,
    missingGerman,
    nodeLocalizedFields,
    type EntryDoc,
    type NodeDoc,
} from "../../src/server/schema";
import { log, withDb } from "./lib";

// ===================================================================
// db:check-de — what is live but not yet translated.
//
// Reads the database rather than a batch file, and reports the same thing
// db:content refuses on: every published text field with no German. Exits 1
// when anything is missing, so it works as a check in a pipeline as well as a
// report to read.
//
// Scope, deliberately:
//   entries — status "active" only. Planned ones are scaffolding and are
//             English-only by design, so flagging them would be noise.
//   nodes   — everything not hidden, because a planned item or page still
//             shows its name and summary in the sidebar and on a card.
//
// The walk itself lives in src/server/schema.ts, shared with db:content, so
// the two can never disagree about what counts as translatable.
// ===================================================================

type Problem = { where: string; path: string };

async function main() {
    const problems: Problem[] = [];
    let activeEntries = 0;
    let visibleNodes = 0;

    await withDb(async (db) => {
        log.step("active entries");
        const entries = await db
            .collection<EntryDoc>(COLLECTIONS.entries)
            .find({ status: "active" })
            .sort({ page: 1, order: 1 })
            .toArray();
        activeEntries = entries.length;

        for (const entry of entries) {
            const missing = missingGerman(entryLocalizedFields(entry));
            const where = `${entry.page}/${entry.slug}`;
            if (!missing.length) {
                log.ok(`${where} — complete`);
                continue;
            }
            log.warn(`${where} — ${missing.length} missing`);
            for (const path of missing) problems.push({ where, path });
        }
        if (!entries.length) log.detail("none yet");

        log.step("visible nodes (name + summary)");
        const nodes = await db
            .collection<NodeDoc>(COLLECTIONS.nodes)
            .find({ status: { $ne: "hidden" } })
            .sort({ path: 1 })
            .toArray();
        visibleNodes = nodes.length;

        for (const node of nodes) {
            const missing = missingGerman(nodeLocalizedFields(node));
            if (!missing.length) continue;
            log.warn(`${node.path} — ${missing.length} missing`);
            for (const path of missing) problems.push({ where: node.path, path });
        }
    });

    log.step("report");
    log.detail(
        `checked ${activeEntries} active entr${activeEntries === 1 ? "y" : "ies"} and ${visibleNodes} visible node(s)`,
    );

    if (!problems.length) {
        log.ok("every published text field has a German translation");
        return;
    }

    console.error(
        `\n✗ ${problems.length} field(s) without a German translation:`,
    );
    for (const p of problems) console.error(`  · ${p.where} → ${p.path}`);
    console.error(
        `\nAdd them with a content batch (see db/content/README.md).`,
    );
    process.exitCode = 1;
}

void main();
