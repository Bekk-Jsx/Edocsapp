// ===================================================================
// SCHEMA — the single source of truth for every document in the database.
//
// Zod schemas first, TypeScript types inferred from them: there is no
// hand-written interface for a stored shape anywhere, so a type and its
// validator can never drift. Imported by BOTH the app (read path) and the
// scripts (write path) — which is why this module must stay free of
// `server-only` and of any Node-only import.
//
// SCHEMA EVOLUTION (see the Database section in AGENTS.md)
// Every document carries `schemaVersion`. A shape change is never applied by
// editing this file alone: it is a new numbered migration that upgrades the
// stored documents in place and bumps their version. Readers therefore accept
// any version >= 1 and tolerate missing optional fields.
// ===================================================================

import { z } from "zod";

/** Current version written by this build of the app. */
export const SCHEMA_VERSION = 1;

// A stored version is only ever read, never trusted to equal SCHEMA_VERSION:
// an older document that has not been migrated yet must still parse.
const schemaVersion = z.number().int().min(1);

// -------------------------------------------------------------------
// localized text
// -------------------------------------------------------------------

// Every translatable string. `de` is written later by content batches, so a
// reader falls back to `en` whenever it is missing (see localized()).
export const localizedTextSchema = z.object({
    en: z.string(),
    de: z.string().optional(),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** The text for a locale, falling back to English when a translation is absent. */
export function localized(text: LocalizedText, locale: "en" | "de" = "en") {
    return locale === "de" ? (text.de ?? text.en) : text.en;
}

// -------------------------------------------------------------------
// blocks
// -------------------------------------------------------------------
//
// A discriminated union on `type`. Inline text carries a tiny markup —
// `code`, **bold**, [label](url) — which is parsed at RENDER time, not here:
// as far as the database is concerned these are plain strings.

export const BLOCK_SEVERITIES = [
    "danger",
    "trap",
    "difference",
    "tip",
    "note",
] as const;

/** One row of a list, which may nest further lists of the same shape. */
export type ListItem = { text: LocalizedText; children?: ListItem[] };

const listItemSchema: z.ZodType<ListItem> = z.lazy(() =>
    z.object({
        text: localizedTextSchema,
        children: z.array(listItemSchema).optional(),
    }),
);

export type ParagraphBlock = { type: "paragraph"; text: LocalizedText };
export type HeadingBlock = {
    type: "heading";
    level: 3 | 4;
    text: LocalizedText;
};
export type ListBlock = {
    type: "list";
    ordered: boolean;
    items: ListItem[];
};
export type TableBlock = {
    type: "table";
    columns: LocalizedText[];
    rows: LocalizedText[][];
    caption?: LocalizedText;
};
export type CodeBlock = {
    type: "code";
    lang: string;
    /** Never translated — it is source, not prose. */
    code: string;
    caption?: LocalizedText;
};
export type CalloutBlock = {
    type: "callout";
    severity: (typeof BLOCK_SEVERITIES)[number];
    label: LocalizedText;
    text: LocalizedText;
};
/** Alt text is NOT here: it belongs to the asset, so one file is described once. */
export type ImageBlock = {
    type: "image";
    assetId: string;
    caption?: LocalizedText;
};
export type ComparePane = { label: LocalizedText; blocks: Block[] };
export type CompareBlock = {
    type: "compare";
    left: ComparePane;
    right: ComparePane;
};

export type Block =
    | ParagraphBlock
    | HeadingBlock
    | ListBlock
    | TableBlock
    | CodeBlock
    | CalloutBlock
    | ImageBlock
    | CompareBlock;

// `compare` nests blocks, so the union has to be lazy. The factory runs on the
// first parse, by which point every const below is initialised.
export const blockSchema: z.ZodType<Block> = z.lazy(() =>
    z.discriminatedUnion("type", [
        z.object({ type: z.literal("paragraph"), text: localizedTextSchema }),
        z.object({
            type: z.literal("heading"),
            level: z.union([z.literal(3), z.literal(4)]),
            text: localizedTextSchema,
        }),
        z.object({
            type: z.literal("list"),
            ordered: z.boolean(),
            items: z.array(listItemSchema),
        }),
        z.object({
            type: z.literal("table"),
            columns: z.array(localizedTextSchema),
            rows: z.array(z.array(localizedTextSchema)),
            caption: localizedTextSchema.optional(),
        }),
        z.object({
            type: z.literal("code"),
            lang: z.string(),
            code: z.string(),
            caption: localizedTextSchema.optional(),
        }),
        z.object({
            type: z.literal("callout"),
            severity: z.enum(BLOCK_SEVERITIES),
            label: localizedTextSchema,
            text: localizedTextSchema,
        }),
        z.object({
            type: z.literal("image"),
            assetId: z.string().min(1),
            caption: localizedTextSchema.optional(),
        }),
        z.object({
            type: z.literal("compare"),
            left: comparePaneSchema,
            right: comparePaneSchema,
        }),
    ]),
);

const comparePaneSchema: z.ZodType<ComparePane> = z.object({
    label: localizedTextSchema,
    blocks: z.array(blockSchema),
});

/**
 * Read path: parse a stored block array, DROPPING anything invalid rather than
 * throwing. One bad block — written by an older build, or by a migration still
 * to come — must never take a page down; it is skipped and reported once on the
 * server. Writes use blockSchema directly and do throw.
 */
export function safeBlocks(input: unknown, where: string): Block[] {
    if (!Array.isArray(input)) {
        if (input !== undefined) {
            console.warn(`[schema] ${where}: blocks is not an array — ignored`);
        }
        return [];
    }
    const out: Block[] = [];
    for (const [index, raw] of input.entries()) {
        const parsed = blockSchema.safeParse(raw);
        if (parsed.success) out.push(parsed.data);
        else {
            console.warn(
                `[schema] ${where}: dropped invalid block #${index} — ${parsed.error.issues[0]?.message ?? "unknown"}`,
            );
        }
    }
    return out;
}

// -------------------------------------------------------------------
// shared enums
// -------------------------------------------------------------------

/** active = published; planned = scaffolded, not written yet; hidden = never served. */
export const statusSchema = z.enum(["active", "planned", "hidden"]);
export type Status = z.infer<typeof statusSchema>;

export const prioritySchema = z.enum(["high", "medium", "low"]);
export type Priority = z.infer<typeof prioritySchema>;

// -------------------------------------------------------------------
// nodes — the navigation tree
// -------------------------------------------------------------------
//
// Deliberately generic: `type` spans area/category/item/page so that projects
// and any later content can move into the same tree without a second shape.
// `path` is the identity ("interviews/preparation/fullstack-questions/react")
// and `parent` is the parent's path, so a subtree is one indexed query.

export const nodeTypeSchema = z.enum(["area", "category", "item", "page"]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

export const nodeSchema = z.object({
    schemaVersion,
    type: nodeTypeSchema,
    path: z.string().min(1),
    parent: z.string().min(1).nullable(),
    slug: z.string().min(1),
    name: localizedTextSchema,
    summary: localizedTextSchema.optional(),
    order: z.number().int(),
    status: statusSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type NodeDoc = z.infer<typeof nodeSchema>;

// -------------------------------------------------------------------
// entries — content units
// -------------------------------------------------------------------
//
// For Interviews an entry is one question. `kind` exists so projects can add
// their own units later without a new collection.

export const entryKindSchema = z.enum(["question"]);
export type EntryKind = z.infer<typeof entryKindSchema>;

export const entrySchema = z.object({
    schemaVersion,
    kind: entryKindSchema,
    /** The page node's path this entry belongs to. */
    page: z.string().min(1),
    slug: z.string().min(1),
    title: localizedTextSchema,
    /** The ~30-second spoken answer. */
    shortAnswer: localizedTextSchema.optional(),
    blocks: z.array(blockSchema),
    /** Follow-up questions an interviewer is likely to ask next. */
    followUps: z.array(localizedTextSchema).optional(),
    priority: prioritySchema,
    status: statusSchema,
    order: z.number().int(),
    tags: z.array(z.string()),
    source: z.object({ name: z.string(), url: z.string().url() }).optional(),
    /** Slug (or "page/slug") this duplicates — kept, never deleted. */
    duplicateOf: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export type EntryDoc = z.infer<typeof entrySchema>;

// -------------------------------------------------------------------
// assets — metadata only; the bytes live behind the storage adapter
// -------------------------------------------------------------------

export const assetSchema = z.object({
    schemaVersion,
    /** Opaque storage key, resolved by the storage adapter. */
    key: z.string().min(1),
    fileName: z.string().min(1),
    mime: z.string().min(1),
    bytes: z.number().int().nonnegative(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt: localizedTextSchema,
    createdAt: z.date(),
});
export type AssetDoc = z.infer<typeof assetSchema>;

// -------------------------------------------------------------------
// progress — practice state, one document per entry per owner
// -------------------------------------------------------------------
//
// `owner` is fixed to "local" for now. It exists so that real users can be
// added later without a migration that reshapes every document: the unique
// index is already { owner, entry }.

/** The single owner until there are accounts. */
export const LOCAL_OWNER = "local";

export const progressStateSchema = z.enum(["known", "again"]);
export type ProgressState = z.infer<typeof progressStateSchema>;

export const progressSchema = z.object({
    schemaVersion,
    owner: z.string().min(1),
    /** The entry's page path plus its slug: "<page path>/<slug>". */
    entry: z.string().min(1),
    state: progressStateSchema,
    /** How many times it has been answered, in total. */
    reviews: z.number().int().nonnegative(),
    lastReviewedAt: z.date(),
});
export type ProgressDoc = z.infer<typeof progressSchema>;

/** The id a progress document uses for one question. */
export function entryKey(pagePath: string, slug: string): string {
    return `${pagePath}/${slug}`;
}

// -------------------------------------------------------------------
// migrations — one document per applied migration
// -------------------------------------------------------------------

export const migrationSchema = z.object({
    _id: z.string().min(1),
    appliedAt: z.date(),
});
export type MigrationDoc = z.infer<typeof migrationSchema>;

// -------------------------------------------------------------------
// content batches — the only way content enters the database
// -------------------------------------------------------------------
//
// What a db/content/batch-*.ts file exports. Everything the seed owns
// (order, kind, source, timestamps) is absent on purpose: a batch writes
// content, never structure.

// `null` on an optional field means CLEAR IT; omitting the field means leave
// whatever is stored alone. Without that distinction a batch could only ever
// overwrite an optional field, never empty one again — so taking an answer
// back down to "planned" would leave its short answer behind.
//
// This is a batch-input shape, not a stored one: nothing in `entries` ever
// holds null, so no migration is involved.
export const contentEntrySchema = z.object({
    page: z.string().min(1),
    slug: z.string().min(1),
    title: localizedTextSchema,
    shortAnswer: localizedTextSchema.nullable().optional(),
    blocks: z.array(blockSchema),
    followUps: z.array(localizedTextSchema).nullable().optional(),
    tags: z.array(z.string()).optional(),
    priority: prioritySchema.optional(),
    status: statusSchema,
});
export type ContentEntry = z.infer<typeof contentEntrySchema>;

// A batch may also create the PAGE it writes into, and flip an item from
// "planned" to "active" — so a new item's first batch can bring its whole
// structure with it. The seed still owns the items themselves; a batch only
// changes their status.
export const contentPageSchema = z.object({
    /** The item's slug, e.g. "about-me". The path is resolved from it. */
    item: z.string().min(1),
    slug: z.string().min(1),
    name: localizedTextSchema,
    summary: localizedTextSchema.optional(),
    order: z.number().int(),
    status: statusSchema,
});
export type ContentPage = z.infer<typeof contentPageSchema>;

export const contentItemSchema = z.object({
    slug: z.string().min(1),
    status: statusSchema,
});
export type ContentItem = z.infer<typeof contentItemSchema>;

// -------------------------------------------------------------------
// translation coverage
// -------------------------------------------------------------------
//
// Walks every LocalizedText a document carries, so "is this fully
// translated?" is answered in ONE place: db:content enforces it before a
// write, db:check-de reports it for what is already stored. Keeping the walk
// here means a block type added to the union above cannot quietly escape the
// check — the switch below has to grow with it.

/** One translatable field, with the path that identifies it in a report. */
export type LocalizedField = { path: string; text: LocalizedText };

/**
 * True when nothing is left to translate.
 *
 * A usable German string counts, and so does an EMPTY English one: a
 * deliberately blank cell — the header above a table's row-label column — has
 * nothing to translate and must not be reported as missing. Otherwise an
 * empty or whitespace-only `de` is missing.
 */
export function hasGerman(text: LocalizedText): boolean {
    if (text.en.trim().length === 0) return true;
    return typeof text.de === "string" && text.de.trim().length > 0;
}

function listFields(items: ListItem[], base: string): LocalizedField[] {
    const out: LocalizedField[] = [];
    items.forEach((item, i) => {
        out.push({ path: `${base}[${i}].text`, text: item.text });
        if (item.children?.length) {
            out.push(...listFields(item.children, `${base}[${i}].children`));
        }
    });
    return out;
}

/** Every translatable field inside a block array, recursively. */
export function blockLocalizedFields(
    blocks: Block[],
    base = "blocks",
): LocalizedField[] {
    const out: LocalizedField[] = [];
    blocks.forEach((block, i) => {
        const p = `${base}[${i}]:${block.type}`;
        switch (block.type) {
            case "paragraph":
                out.push({ path: `${p}.text`, text: block.text });
                break;
            case "heading":
                out.push({ path: `${p}.text`, text: block.text });
                break;
            case "list":
                out.push(...listFields(block.items, `${p}.items`));
                break;
            case "table":
                block.columns.forEach((c, ci) =>
                    out.push({ path: `${p}.columns[${ci}]`, text: c }),
                );
                block.rows.forEach((row, ri) =>
                    row.forEach((cell, ci) =>
                        out.push({ path: `${p}.rows[${ri}][${ci}]`, text: cell }),
                    ),
                );
                if (block.caption) {
                    out.push({ path: `${p}.caption`, text: block.caption });
                }
                break;
            case "code":
                // `code` itself is source and never translated; its caption is.
                if (block.caption) {
                    out.push({ path: `${p}.caption`, text: block.caption });
                }
                break;
            case "callout":
                out.push({ path: `${p}.label`, text: block.label });
                out.push({ path: `${p}.text`, text: block.text });
                break;
            case "image":
                // alt text belongs to the asset, not the block.
                if (block.caption) {
                    out.push({ path: `${p}.caption`, text: block.caption });
                }
                break;
            case "compare":
                out.push({ path: `${p}.left.label`, text: block.left.label });
                out.push(
                    ...blockLocalizedFields(block.left.blocks, `${p}.left.blocks`),
                );
                out.push({ path: `${p}.right.label`, text: block.right.label });
                out.push(
                    ...blockLocalizedFields(block.right.blocks, `${p}.right.blocks`),
                );
                break;
        }
    });
    return out;
}

/** Shared by a stored entry and a batch entry — both carry these fields. */
export type LocalizedEntrySource = {
    title: LocalizedText;
    shortAnswer?: LocalizedText | null;
    blocks: Block[];
    followUps?: LocalizedText[] | null;
};

/** Every translatable field of one question. */
export function entryLocalizedFields(
    entry: LocalizedEntrySource,
): LocalizedField[] {
    const out: LocalizedField[] = [{ path: "title", text: entry.title }];
    if (entry.shortAnswer) {
        out.push({ path: "shortAnswer", text: entry.shortAnswer });
    }
    (entry.followUps ?? []).forEach((text, i) =>
        out.push({ path: `followUps[${i}]`, text }),
    );
    out.push(...blockLocalizedFields(entry.blocks));
    return out;
}

/** Every translatable field of a tree node (area, category, item, page). */
export function nodeLocalizedFields(node: {
    name: LocalizedText;
    summary?: LocalizedText;
}): LocalizedField[] {
    const out: LocalizedField[] = [{ path: "name", text: node.name }];
    if (node.summary) out.push({ path: "summary", text: node.summary });
    return out;
}

/** The fields of `fields` that have no German yet. */
export function missingGerman(fields: LocalizedField[]): string[] {
    return fields.filter((f) => !hasGerman(f.text)).map((f) => f.path);
}

// -------------------------------------------------------------------
// collection names — one place, so a typo is a type error
// -------------------------------------------------------------------

export const COLLECTIONS = {
    nodes: "nodes",
    entries: "entries",
    assets: "assets",
    progress: "progress",
    migrations: "migrations",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
