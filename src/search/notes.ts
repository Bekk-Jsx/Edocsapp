// Notes adapter. Reads the user's notes exactly the way NotesBoard does — the
// same GET /api/notes/<project> route, backed by @/lib/notes-store — so search
// always sees the live notes and nothing is ever copied into the static index.

import type { Note } from "@/lib/notes-store";
import { fieldScore, matchRanges, type Query } from "./match";
import type { SearchIndex, SearchPage, SearchTitle } from "./types";

export type { Note };

export async function loadNotes(project: string): Promise<Note[]> {
    const res = await fetch(`/api/notes/${encodeURIComponent(project)}`, {
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as Note[]) : [];
}

export type NoteHit = {
    note: Note;
    score: number;
    /** ~80 chars around the match, from the field that matched best. */
    snippet: string;
    /** Where clicking goes: the attached section, or the project's notes page. */
    href: string;
    /** "Writing Composables › The conventions", or just the page / "Notes". */
    location: string[];
};

const NOTE_FIELDS = ["title", "description", "titleDe", "descriptionDe"] as const;
const SNIPPET = 80;

function snippetAround(text: string, query: string): string {
    if (text.length <= SNIPPET) return text;
    const [first] = matchRanges(text, query);
    const center = first ? Math.floor((first[0] + first[1]) / 2) : 0;
    let start = Math.max(0, center - SNIPPET / 2);
    const end = Math.min(text.length, start + SNIPPET);
    start = Math.max(0, end - SNIPPET);
    return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/** Where a note points, resolved against the index for readable labels. */
export function noteTarget(
    note: Note,
    index: SearchIndex,
): { href: string; location: string[]; page?: SearchPage } {
    const notesHref = `${index.project.href}/notes`;
    const link = note.link?.startsWith("/") ? note.link : undefined;
    const [path, hash] = link ? link.split("#") : [undefined, undefined];

    const page =
        index.pages.find((p) => p.slug === note.hookSlug) ??
        (path ? index.pages.find((p) => p.href === path) : undefined);

    if (link && hash) {
        let title: SearchTitle | undefined;
        for (const pg of index.pages) {
            for (const part of pg.parts) {
                title ??= part.titles.find((t) => t.href === link);
            }
        }
        return {
            href: link,
            page,
            location: [page?.name ?? path ?? "", title?.title ?? `#${hash}`].filter(Boolean),
        };
    }
    return { href: notesHref, page, location: page ? [page.name] : ["Notes"] };
}

/** Score notes; with `pageSlug`, only notes attached to that page count. */
export function searchNotes(
    notes: Note[],
    query: Query,
    index: SearchIndex,
    pageSlug?: string,
): NoteHit[] {
    const hits: NoteHit[] = [];
    for (const note of notes) {
        const target = noteTarget(note, index);
        if (pageSlug && target.page?.slug !== pageSlug) continue;

        let best = 0;
        let bestText = "";
        for (const f of NOTE_FIELDS) {
            const text = note[f];
            if (!text) continue;
            const s = fieldScore(query, text, "note");
            if (s > best) {
                best = s;
                bestText = text;
            }
        }
        if (!best) continue;

        // The title is always shown; the snippet comes from the matching
        // field, or from the description when the title itself matched.
        const body =
            bestText === note.title ? (note.description ?? "") : bestText;
        const showBody = body && body !== note.title;
        hits.push({
            note,
            score: best,
            snippet: showBody ? snippetAround(body, query.raw) : "",
            href: target.href,
            location: target.location,
        });
    }
    return hits.sort((a, b) => b.score - a.score);
}
