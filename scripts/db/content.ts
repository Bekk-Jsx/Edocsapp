import path from "node:path";
import { existsSync } from "node:fs";
import type { Db } from "mongodb";
import {
    COLLECTIONS,
    SCHEMA_VERSION,
    contentEntrySchema,
    contentItemSchema,
    contentPageSchema,
    type ContentEntry,
    type ContentItem,
    type ContentPage,
    type EntryDoc,
    type NodeDoc,
} from "../../src/server/schema";
import { ROOT, fail, log, sameValue, withDb, type Tally } from "./lib";

// ===================================================================
// db:content <file> — the ONLY way answers enter the database.
//
// A batch file exports `entries: ContentEntry[]` (format in
// db/content/README.md). Every entry is validated with zod first; nothing is
// written unless the whole batch validates, so a typo in entry 40 cannot
// leave entries 1-39 applied.
//
// Each entry is then upserted by { page, slug } with $set on the content
// fields only — order, kind and source stay as the seed wrote them. An entry
// whose stored content already matches is reported as unchanged rather than
// rewritten, so updatedAt does not churn and the export diff stays clean.
//
// A batch can only touch a question the seed already created: a { page, slug }
// that does not exist is reported and skipped, never inserted, because the
// seed owns structure.
// ===================================================================

const CONTENT_FIELDS = [
    "title",
    "shortAnswer",
    "blocks",
    "followUps",
    "tags",
    "status",
    "priority",
] as const;

type Batch = {
    items: ContentItem[];
    pages: ContentPage[];
    entries: ContentEntry[];
};

/** Validates one section of a batch, collecting every problem before failing. */
function parseAll<T>(
    raw: unknown,
    name: string,
    schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: (string | number | symbol)[]; message: string }[] } } },
    problems: string[],
): T[] {
    if (raw === undefined) return [];
    if (!Array.isArray(raw)) {
        problems.push(`\`${name}\` must be an array`);
        return [];
    }
    const out: T[] = [];
    for (const [index, value] of raw.entries()) {
        const result = schema.safeParse(value);
        if (result.success) out.push(result.data);
        else {
            const slug = (value as { slug?: string })?.slug ?? "?";
            for (const issue of result.error.issues) {
                problems.push(
                    `${name} #${index + 1} (${slug}): ${issue.path.join(".")} — ${issue.message}`,
                );
            }
        }
    }
    return out;
}

async function loadBatch(file: string): Promise<Batch> {
    const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
    if (!existsSync(abs)) fail(`No such batch file: ${file}`);

    const mod = (await import(abs)) as {
        items?: unknown;
        pages?: unknown;
        entries?: unknown;
    };
    if (
        mod.entries === undefined &&
        mod.pages === undefined &&
        mod.items === undefined
    ) {
        fail(
            `${file} exports none of \`items\`, \`pages\`, \`entries\``,
            "see db/content/README.md",
        );
    }

    const problems: string[] = [];
    const items = parseAll<ContentItem>(mod.items, "item", contentItemSchema, problems);
    const pages = parseAll<ContentPage>(mod.pages, "page", contentPageSchema, problems);
    const entries = parseAll<ContentEntry>(
        mod.entries,
        "entry",
        contentEntrySchema,
        problems,
    );

    if (problems.length) {
        console.error(`\n✗ ${problems.length} validation problem(s):`);
        for (const p of problems.slice(0, 25)) console.error(`  · ${p}`);
        if (problems.length > 25) console.error(`  … and ${problems.length - 25} more`);
        fail("nothing was written");
    }

    // Addressing the same thing twice would make the result depend on order,
    // so it is refused rather than resolved.
    const dupe = (keys: string[], what: string) => {
        const seen = new Set<string>();
        for (const key of keys) {
            if (seen.has(key)) fail(`batch lists ${what} ${key} twice`);
            seen.add(key);
        }
    };
    dupe(items.map((i) => i.slug), "item");
    dupe(pages.map((p) => `${p.item}/${p.slug}`), "page");
    dupe(entries.map((e) => `${e.page}/${e.slug}`), "entry");

    return { items, pages, entries };
}

/** Sets an item's status. The seed owns the item itself, so nothing else. */
async function applyItems(db: Db, items: ContentItem[]): Promise<number> {
    if (!items.length) return 0;
    const nodes = db.collection<NodeDoc>(COLLECTIONS.nodes);
    let changed = 0;

    log.step(`items (${items.length})`);
    for (const item of items) {
        const node = await nodes.findOne({ type: "item", slug: item.slug });
        if (!node) {
            log.warn(`no such item: ${item.slug} — skipped (the seed creates items)`);
            continue;
        }
        if (node.status === item.status) {
            log.detail(`${item.slug} already ${item.status}`);
            continue;
        }
        await nodes.updateOne(
            { path: node.path },
            { $set: { status: item.status, updatedAt: new Date() } },
        );
        log.detail(`${item.slug}: ${node.status} -> ${item.status}`);
        changed++;
    }
    return changed;
}

/** Upserts page nodes under their item, so a new page arrives with its batch. */
async function applyPages(db: Db, pages: ContentPage[]): Promise<Tally> {
    const tally: Tally = { created: 0, updated: 0, unchanged: 0 };
    if (!pages.length) return tally;
    const nodes = db.collection<NodeDoc>(COLLECTIONS.nodes);

    log.step(`pages (${pages.length})`);
    for (const page of pages) {
        const item = await nodes.findOne({ type: "item", slug: page.item });
        if (!item) {
            log.warn(`no such item: ${page.item} — page ${page.slug} skipped`);
            continue;
        }
        const path = `${item.path}/${page.slug}`;
        const now = new Date();
        const structure = {
            schemaVersion: SCHEMA_VERSION,
            type: "page" as const,
            path,
            parent: item.path,
            slug: page.slug,
            name: page.name,
            ...(page.summary ? { summary: page.summary } : {}),
            order: page.order,
        };

        const existing = await nodes.findOne({ path });
        const result = await nodes.updateOne(
            { path },
            {
                // `status` is $set here, unlike in the seed: a batch that
                // brings a page is also what publishes or hides it.
                $set: { ...structure, status: page.status, updatedAt: now },
                $setOnInsert: { createdAt: now },
            },
            { upsert: true },
        );

        if (result.upsertedCount) {
            tally.created++;
            log.detail(`created ${path}`);
        } else if (
            existing &&
            sameValue(
                { ...structure, status: page.status },
                {
                    schemaVersion: existing.schemaVersion,
                    type: existing.type,
                    path: existing.path,
                    parent: existing.parent,
                    slug: existing.slug,
                    name: existing.name,
                    ...(existing.summary ? { summary: existing.summary } : {}),
                    order: existing.order,
                    status: existing.status,
                },
            )
        ) {
            tally.unchanged++;
        } else {
            tally.updated++;
            log.detail(`updated ${path}`);
        }
    }
    return tally;
}

async function main() {
    const file = process.argv[2];
    if (!file) {
        fail(
            "db:content needs a batch file.",
            "npm run db:content -- db/content/batch-001-example.ts",
        );
    }

    const batch = await loadBatch(file);
    const { items, pages, entries } = batch;
    log.ok(
        `validated — ${items.length} item(s), ${pages.length} page(s), ${entries.length} entr${entries.length === 1 ? "y" : "ies"}`,
    );

    await withDb(async (db) => {
        // Order matters: an item must be active before its pages are listed,
        // and a page must exist before entries can point at it.
        const itemsChanged = await applyItems(db, items);
        const pageTally = await applyPages(db, pages);

        const collection = db.collection<EntryDoc>(COLLECTIONS.entries);
        const tally: Tally = { created: 0, updated: 0, unchanged: 0 };
        const missing: string[] = [];

        log.step(`applying ${path.basename(file)}`);

        for (const entry of entries) {
            const filter = { page: entry.page, slug: entry.slug };
            const current = await collection.findOne(filter);
            if (!current) {
                missing.push(`${entry.page}/${entry.slug}`);
                continue;
            }

            // Only the fields the batch owns. An omitted field is left alone;
            // an explicit null clears the stored one.
            const update: Record<string, unknown> = {};
            const clear: Record<string, "">[] = [];
            for (const field of CONTENT_FIELDS) {
                const value = entry[field];
                if (value === undefined) continue;
                if (value === null) clear.push({ [field]: "" });
                else update[field] = value;
            }
            const unset = Object.assign({}, ...clear) as Record<string, "">;

            const stored = current as unknown as Record<string, unknown>;
            const changed =
                Object.entries(update).some(
                    ([field, value]) => !sameValue(value, stored[field]),
                ) ||
                Object.keys(unset).some((field) => stored[field] !== undefined);
            if (!changed) {
                tally.unchanged++;
                continue;
            }

            await collection.updateOne(filter, {
                $set: { ...update, updatedAt: new Date() },
                ...(Object.keys(unset).length ? { $unset: unset } : {}),
            });
            tally.updated++;
            log.detail(`updated ${entry.page}/${entry.slug}`);
        }

        if (missing.length) {
            log.warn(
                `${missing.length} entr${missing.length === 1 ? "y" : "ies"} not in the database — skipped (the seed creates questions, a batch only fills them):`,
            );
            for (const key of missing.slice(0, 10)) log.detail(`· ${key}`);
            if (missing.length > 10) log.detail(`· … and ${missing.length - 10} more`);
        }

        log.step("summary");
        if (items.length) log.ok(`items:   ${itemsChanged} changed`);
        if (pages.length) {
            log.ok(
                `pages:   created ${pageTally.created} · updated ${pageTally.updated} · unchanged ${pageTally.unchanged}`,
            );
        }
        log.ok(
            `entries: created ${tally.created} · updated ${tally.updated} · unchanged ${tally.unchanged} · skipped ${missing.length}`,
        );
        log.info("\nrun npm run db:export and commit db/backup/.");
    });
}

void main();
