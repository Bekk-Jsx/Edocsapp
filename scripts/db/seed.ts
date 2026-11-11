import type { Db } from "mongodb";
import {
    COLLECTIONS,
    SCHEMA_VERSION,
    entrySchema,
    nodeSchema,
    type EntryDoc,
    type NodeDoc,
} from "../../src/server/schema";
import {
    AREA,
    CATEGORY,
    EXPECTED_HIDDEN,
    EXPECTED_PER_PAGE,
    EXPECTED_TOTAL,
    EXPECTED_VISIBLE,
    ITEM,
    ITEMS,
    PAGES,
    SOURCE,
    type SeedPage,
} from "../../db/seeds/interviews";
import { fail, log, withDb } from "./lib";

// ===================================================================
// db:seed — structure in, questions in, nothing ever overwritten.
//
// Two different write rules, on purpose (AGENTS.md > Database):
//
//   nodes   — $set on the structural fields (name, summary, order, parent,
//             type, slug) so renaming a page in the seed takes effect, with
//             $setOnInsert for status + createdAt so a page hidden or
//             activated later in the database is not reset by a seed run.
//   entries — $setOnInsert for the WHOLE document. An entry that already
//             exists is never touched: its answer came from a content batch
//             and the seed has no business overwriting it.
//
// The expected counts in db/seeds/interviews.ts are asserted BEFORE any
// write: if a line was lost or duplicated while editing the seed, nothing is
// written at all.
// ===================================================================

function assertCounts() {
    const problems: string[] = [];
    let total = 0;
    let hidden = 0;

    for (const page of PAGES) {
        const expected = EXPECTED_PER_PAGE[page.slug];
        if (expected === undefined) {
            problems.push(`page "${page.slug}" has no entry in EXPECTED_PER_PAGE`);
        } else if (page.questions.length !== expected) {
            problems.push(
                `page "${page.slug}": ${page.questions.length} questions, expected ${expected}`,
            );
        }
        total += page.questions.length;
        hidden += page.questions.filter((q) => q.status === "hidden").length;

        const slugs = new Set<string>();
        for (const question of page.questions) {
            if (slugs.has(question.slug)) {
                problems.push(`page "${page.slug}": duplicate slug "${question.slug}"`);
            }
            slugs.add(question.slug);
        }
    }

    for (const slug of Object.keys(EXPECTED_PER_PAGE)) {
        if (!PAGES.some((p) => p.slug === slug)) {
            problems.push(`EXPECTED_PER_PAGE lists "${slug}", which no page provides`);
        }
    }
    if (total !== EXPECTED_TOTAL) {
        problems.push(`${total} questions in total, expected ${EXPECTED_TOTAL}`);
    }
    if (hidden !== EXPECTED_HIDDEN) {
        problems.push(`${hidden} hidden questions, expected ${EXPECTED_HIDDEN}`);
    }
    if (total - hidden !== EXPECTED_VISIBLE) {
        problems.push(
            `${total - hidden} visible questions, expected ${EXPECTED_VISIBLE}`,
        );
    }

    if (problems.length) {
        console.error("\n✗ seed data does not match its expected totals:");
        for (const p of problems) console.error(`  · ${p}`);
        fail("refusing to write anything", "fix db/seeds/interviews.ts");
    }

    log.ok(
        `seed data checks out — ${total} questions (${total - hidden} visible, ${hidden} hidden) across ${PAGES.length} pages`,
    );
}

/** $set the structure, $setOnInsert what the database owns afterwards. */
async function upsertNode(
    db: Db,
    node: Omit<NodeDoc, "createdAt" | "updatedAt">,
): Promise<"created" | "updated"> {
    const now = new Date();
    // Validate against the schema before writing, timestamps included.
    nodeSchema.parse({ ...node, createdAt: now, updatedAt: now });

    const { status, ...structure } = node;
    const result = await db.collection<NodeDoc>(COLLECTIONS.nodes).updateOne(
        { path: node.path },
        {
            $set: { ...structure, updatedAt: now },
            $setOnInsert: { status, createdAt: now },
        },
        { upsert: true },
    );
    return result.upsertedCount ? "created" : "updated";
}

async function seedTree(db: Db) {
    log.step("tree");

    await upsertNode(db, {
        schemaVersion: SCHEMA_VERSION,
        type: "area",
        path: AREA.path,
        parent: null,
        slug: AREA.slug,
        name: AREA.name,
        summary: AREA.summary,
        order: 0,
        status: "active",
    });
    log.ok(`area ${AREA.path}`);

    await upsertNode(db, {
        schemaVersion: SCHEMA_VERSION,
        type: "category",
        path: CATEGORY.path,
        parent: AREA.path,
        slug: CATEGORY.slug,
        name: CATEGORY.name,
        order: 0,
        status: "active",
    });
    log.ok(`category ${CATEGORY.path}`);

    for (const item of ITEMS) {
        await upsertNode(db, {
            schemaVersion: SCHEMA_VERSION,
            type: "item",
            path: item.path,
            parent: CATEGORY.path,
            slug: item.slug,
            name: item.name,
            summary: item.summary,
            order: item.order,
            status: item.status,
        });
    }
    log.ok(
        `${ITEMS.length} items (${ITEMS.map((i) => `${i.slug}:${i.order}`).join(", ")})`,
    );

    for (const [index, page] of PAGES.entries()) {
        await upsertNode(db, {
            schemaVersion: SCHEMA_VERSION,
            type: "page",
            path: `${ITEM.path}/${page.slug}`,
            parent: ITEM.path,
            slug: page.slug,
            name: page.name,
            order: index + 1,
            status: page.status,
        });
    }
    log.ok(`${PAGES.length} pages`);
}

/** Inserts only. An existing entry is left exactly as it is. */
async function seedQuestions(db: Db, page: SeedPage) {
    const pagePath = `${ITEM.path}/${page.slug}`;
    const now = new Date();
    let inserted = 0;
    let present = 0;

    for (const [index, question] of page.questions.entries()) {
        const doc: EntryDoc = {
            schemaVersion: SCHEMA_VERSION,
            kind: "question",
            page: pagePath,
            slug: question.slug,
            title: question.title,
            blocks: [],
            priority: question.priority,
            status: question.status,
            order: index + 1,
            tags: [],
            source: SOURCE,
            ...(question.duplicateOf ? { duplicateOf: question.duplicateOf } : {}),
            createdAt: now,
            updatedAt: now,
        };
        entrySchema.parse(doc);

        const result = await db
            .collection<EntryDoc>(COLLECTIONS.entries)
            .updateOne(
                { page: pagePath, slug: question.slug },
                { $setOnInsert: doc },
                { upsert: true },
            );
        if (result.upsertedCount) inserted++;
        else present++;
    }

    log.detail(
        `${page.slug.padEnd(18)} inserted ${String(inserted).padStart(3)} · already present ${String(present).padStart(3)}`,
    );
    return { inserted, present };
}

async function main() {
    log.step("checking seed data");
    assertCounts();

    await withDb(async (db) => {
        await seedTree(db);

        log.step("questions");
        let inserted = 0;
        let present = 0;
        for (const page of PAGES) {
            const r = await seedQuestions(db, page);
            inserted += r.inserted;
            present += r.present;
        }

        log.step("summary");
        log.ok(`inserted ${inserted} · already present ${present}`);

        const total = await db.collection(COLLECTIONS.entries).countDocuments({});
        const visible = await db
            .collection(COLLECTIONS.entries)
            .countDocuments({ status: { $ne: "hidden" } });
        log.detail(`database now holds ${total} entries (${visible} visible)`);
        if (total !== EXPECTED_TOTAL) {
            log.warn(
                `expected ${EXPECTED_TOTAL} entries in total — found ${total}. Extra documents are left untouched.`,
            );
        }
    });
}

void main();
