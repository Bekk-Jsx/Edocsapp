import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// ===================================================================
// NOTES STORE — the only module that knows how notes are persisted.
//
// Today: one JSON file per project at src/data/notes/<project>.json, created on
// demand and defaulting to []. Swapping in a database later means rewriting the
// four exported functions and nothing else — routes, pages and components only
// ever see `Note` objects.
//
// Server-only by construction (node:fs). A read parses the whole file and a
// write rewrites it, which is fine at lab scale for a single-user app.
// ===================================================================

export type Note = {
    id: string;
    title: string; // required
    description?: string;
    link?: string; // internal ("/…") or external ("http…")
    titleDe?: string;
    descriptionDe?: string;
    hookSlug?: string; // grouping key; empty => "Other" chapter
    createdAt: string; // ISO, set here
    updatedAt: string; // ISO, set here
};

/** Everything a caller may set. The rest of `Note` is owned by this module. */
export type NoteInput = Omit<Note, "id" | "createdAt" | "updatedAt">;

const DATA_DIR = path.join(process.cwd(), "src", "data", "notes");

// Project slugs arrive from the URL, so they never reach the filesystem
// unshaped: anything but [a-z0-9-] is refused before a path is built from it.
const SAFE_SLUG = /^[a-z0-9-]+$/;

function fileFor(project: string) {
    if (!SAFE_SLUG.test(project)) {
        throw new Error(`Invalid project slug: ${project}`);
    }
    return path.join(DATA_DIR, `${project}.json`);
}

async function readAll(project: string): Promise<Note[]> {
    try {
        const raw = await readFile(fileFor(project), "utf8");
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as Note[]) : [];
    } catch (err) {
        // No file yet is the normal first-run state, not a failure; a corrupt
        // file reads as empty rather than taking the page down with it.
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
        if (err instanceof SyntaxError) return [];
        throw err;
    }
}

async function writeAll(project: string, notes: Note[]) {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(
        fileFor(project),
        `${JSON.stringify(notes, null, 2)}\n`,
        "utf8",
    );
}

const FIELDS = [
    "title",
    "description",
    "link",
    "titleDe",
    "descriptionDe",
    "hookSlug",
] as const;

// Keep only the fields a caller owns, trimmed. An optional field submitted
// empty becomes undefined, so clearing it in the form drops it from the record
// instead of persisting "".
function clean(data: Partial<NoteInput>): Partial<NoteInput> {
    const out: Partial<NoteInput> = {};
    for (const key of FIELDS) {
        const value = data[key];
        if (typeof value !== "string") continue;
        const trimmed = value.trim();
        if (trimmed) out[key] = trimmed;
        else if (key !== "title") out[key] = undefined;
    }
    return out;
}

export async function listNotes(project: string): Promise<Note[]> {
    return readAll(project);
}

export async function addNote(
    project: string,
    data: Partial<NoteInput>,
): Promise<Note> {
    const fields = clean(data);
    if (!fields.title) throw new Error("title is required");

    const now = new Date().toISOString();
    const note: Note = {
        id: crypto.randomUUID(),
        title: fields.title,
        description: fields.description,
        link: fields.link,
        titleDe: fields.titleDe,
        descriptionDe: fields.descriptionDe,
        hookSlug: fields.hookSlug,
        createdAt: now,
        updatedAt: now,
    };

    const notes = await readAll(project);
    notes.push(note);
    await writeAll(project, notes);
    return note;
}

export async function updateNote(
    project: string,
    id: string,
    data: Partial<NoteInput>,
): Promise<Note | null> {
    const notes = await readAll(project);
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const fields = clean(data);
    // An empty title is a no-op rather than a way to erase a required field.
    if ("title" in fields && !fields.title) delete fields.title;

    const updated: Note = {
        ...notes[index],
        ...fields,
        updatedAt: new Date().toISOString(),
    };
    notes[index] = updated;
    await writeAll(project, notes);
    return updated;
}

export async function deleteNote(project: string, id: string): Promise<boolean> {
    const notes = await readAll(project);
    const rest = notes.filter((n) => n.id !== id);
    if (rest.length === notes.length) return false;
    await writeAll(project, rest);
    return true;
}
