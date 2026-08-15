import { deleteNote, updateNote, type NoteInput } from "@/lib/notes-store";

// Single-note endpoints. No GET-one on purpose: the page already holds the whole
// list, so reading one note back would have no caller.

type Ctx = { params: Promise<{ project: string; id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
    const { project, id } = await params;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    try {
        const note = await updateNote(project, id, (body ?? {}) as Partial<NoteInput>);
        if (!note) {
            return Response.json({ error: "Note not found" }, { status: 404 });
        }
        return Response.json(note);
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Could not update note";
        return Response.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(_request: Request, { params }: Ctx) {
    const { project, id } = await params;

    try {
        const removed = await deleteNote(project, id);
        if (!removed) {
            return Response.json({ error: "Note not found" }, { status: 404 });
        }
        return new Response(null, { status: 204 });
    } catch {
        return Response.json({ error: "Invalid project" }, { status: 400 });
    }
}
