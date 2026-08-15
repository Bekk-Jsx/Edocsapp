import { addNote, listNotes, type NoteInput } from "@/lib/notes-store";

// Collection endpoints for one project's notes. HOW they are stored lives in
// @/lib/notes-store — this file only speaks HTTP.
//
// `params` is a promise in the App Router, so it is awaited before use.

type Ctx = { params: Promise<{ project: string }> };

export async function GET(_request: Request, { params }: Ctx) {
    const { project } = await params;
    try {
        return Response.json(await listNotes(project));
    } catch {
        return Response.json({ error: "Invalid project" }, { status: 400 });
    }
}

export async function POST(request: Request, { params }: Ctx) {
    const { project } = await params;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const data = (body ?? {}) as Partial<NoteInput>;
    if (typeof data.title !== "string" || !data.title.trim()) {
        return Response.json({ error: "title is required" }, { status: 400 });
    }

    try {
        return Response.json(await addNote(project, data), { status: 201 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Could not add note";
        return Response.json({ error: message }, { status: 400 });
    }
}
