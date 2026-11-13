import "server-only";

import { ObjectId } from "mongodb";
import { cache } from "react";
import { getDb } from "./db";
import {
    COLLECTIONS,
    LOCAL_OWNER,
    SCHEMA_VERSION,
    phrasebookSchema,
    type PhraseDoc,
    type PhraseInput,
} from "./schema";

// ===================================================================
// PHRASEBOOK — reads and writes for the EN/DE pairs.
//
// `owner` is fixed to "local" until there are accounts, but every query takes
// it, so adding users later changes a value rather than a shape.
//
// Writes go only through the server actions in ./phrasebook-actions.ts, which
// validate their input first; this module assumes it is already valid and
// re-checks with zod before inserting anyway.
// ===================================================================

/** A phrase as the UI sees it: the id is a string, the dates are strings. */
export type Phrase = {
    id: string;
    en: string;
    de: string;
    link: PhraseDoc["link"];
    createdAt: string;
    updatedAt: string;
};

function toPhrase(doc: PhraseDoc & { _id: ObjectId }): Phrase {
    return {
        id: doc._id.toHexString(),
        en: doc.en,
        de: doc.de,
        link: doc.link,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

/**
 * Every phrase for an item, a page, or one question — oldest first, which is
 * the order they were written in.
 */
export const listPhrases = cache(
    async (filter: {
        item?: string;
        page?: string;
        entry?: string;
    } = {}): Promise<Phrase[]> => {
        const db = await getDb();
        const query: Record<string, unknown> = { owner: LOCAL_OWNER };
        if (filter.item) query["link.item"] = filter.item;
        if (filter.page) query["link.page"] = filter.page;
        if (filter.entry) query["link.entry"] = filter.entry;

        const docs = await db
            .collection<PhraseDoc>(COLLECTIONS.phrasebook)
            .find(query)
            .sort({ createdAt: 1 })
            .toArray();
        return docs.map((doc) => toPhrase(doc));
    },
);

/** Adds a phrase. Returns the stored row. */
export async function createPhrase(input: PhraseInput): Promise<Phrase> {
    const now = new Date();
    const doc: PhraseDoc = {
        schemaVersion: SCHEMA_VERSION,
        owner: LOCAL_OWNER,
        en: input.en,
        de: input.de,
        link: input.link,
        createdAt: now,
        updatedAt: now,
    };
    phrasebookSchema.parse(doc);

    const db = await getDb();
    const result = await db
        .collection<PhraseDoc>(COLLECTIONS.phrasebook)
        .insertOne(doc as PhraseDoc);
    return toPhrase({ ...doc, _id: result.insertedId });
}

/** Changes the two texts. The link stays as it was written. */
export async function updatePhrase(
    id: string,
    fields: { en: string; de: string },
): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    const db = await getDb();
    const result = await db
        .collection<PhraseDoc>(COLLECTIONS.phrasebook)
        .updateOne(
            { _id: new ObjectId(id), owner: LOCAL_OWNER },
            { $set: { en: fields.en, de: fields.de, updatedAt: new Date() } },
        );
    return result.matchedCount === 1;
}

export async function deletePhrase(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    const db = await getDb();
    const result = await db
        .collection<PhraseDoc>(COLLECTIONS.phrasebook)
        .deleteOne({ _id: new ObjectId(id), owner: LOCAL_OWNER });
    return result.deletedCount === 1;
}
