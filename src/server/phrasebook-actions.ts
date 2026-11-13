"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    createPhrase,
    deletePhrase,
    updatePhrase,
    type Phrase,
} from "./phrasebook";
import { phraseInputSchema } from "./schema";

// ===================================================================
// The only way phrases are written.
//
// Everything arriving here comes from the browser, so it is untrusted: the
// shape, the trimming and the 1–500 character limits are all enforced by zod
// (phraseInputSchema) before anything reaches the database. Both languages
// are required — a half pair is not a phrase.
//
// Each action revalidates the phrasebook page so a reload shows the database's
// state rather than a cached render.
// ===================================================================

const PHRASEBOOK_PATH = "/interviews/notes";

export type PhraseResult =
    | { ok: true; phrase: Phrase }
    | { ok: false; error: string };

export type PhraseOk = { ok: true } | { ok: false; error: string };

const idSchema = z.string().regex(/^[0-9a-f]{24}$/, "Invalid id");

const editSchema = z.object({
    id: idSchema,
    en: z.string().trim().min(1).max(500),
    de: z.string().trim().min(1).max(500),
});

/** Validation messages the form can show as-is. */
function firstIssue(error: z.ZodError): string {
    const issue = error.issues[0];
    if (!issue) return "Invalid input";
    const field = issue.path.join(".");
    return field ? `${field}: ${issue.message}` : issue.message;
}

export async function addPhrase(input: unknown): Promise<PhraseResult> {
    const parsed = phraseInputSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: firstIssue(parsed.error) };
    }
    try {
        const phrase = await createPhrase(parsed.data);
        revalidatePath(PHRASEBOOK_PATH);
        return { ok: true, phrase };
    } catch (error) {
        console.error("[phrasebook] add failed", error);
        return { ok: false, error: "Could not save — database unreachable" };
    }
}

export async function editPhrase(input: unknown): Promise<PhraseOk> {
    const parsed = editSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: firstIssue(parsed.error) };
    }
    try {
        const { id, en, de } = parsed.data;
        const done = await updatePhrase(id, { en, de });
        if (!done) return { ok: false, error: "No such phrase" };
        revalidatePath(PHRASEBOOK_PATH);
        return { ok: true };
    } catch (error) {
        console.error("[phrasebook] edit failed", error);
        return { ok: false, error: "Could not save — database unreachable" };
    }
}

export async function removePhrase(input: unknown): Promise<PhraseOk> {
    const parsed = idSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid id" };
    try {
        const done = await deletePhrase(parsed.data);
        if (!done) return { ok: false, error: "No such phrase" };
        revalidatePath(PHRASEBOOK_PATH);
        return { ok: true };
    } catch (error) {
        console.error("[phrasebook] delete failed", error);
        return { ok: false, error: "Could not delete — database unreachable" };
    }
}
