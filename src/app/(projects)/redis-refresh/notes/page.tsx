import { Suspense } from "react";
import PageShell from "@/components/ui/page-shell";
import NotesBoard, { type NotesChapter } from "@/components/notes/notes-board";
import { topicsByChapter } from "@/projects/redis-refresh/redis";
import { listNotes } from "@/lib/notes-store";

// Same page as the hooks project's, fed from this project's own registry —
// chapters carry a label here and topics stand in for hooks, so the board sees
// the identical shape either way.
const CHAPTERS: NotesChapter[] = topicsByChapter().map((g) => ({
    label: g.label,
    items: g.topics.map((t) => ({ slug: t.slug, name: t.name })),
}));

// The notes file is read per request, not at build time — otherwise the page
// would ship whatever happened to be on disk when it was compiled.
export const dynamic = "force-dynamic";

export default async function Page() {
    const notes = await listNotes("redis-refresh");
    return (
        <PageShell>
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        redis · refresh
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        Notes
                    </h1>
                    <div className="mt-3 leading-relaxed text-[var(--muted)]">
                        Your own notes, grouped the way the sidebar is — by chapter,
                        then by topic. Anything without a topic lands under Other.
                    </div>
                </header>

                {/* useSearchParams reads request-time data, so the board renders
                    inside a boundary rather than opting the route out of static. */}
                <Suspense
                    fallback={
                        <p className="font-mono text-xs text-[var(--muted)]">
                            loading notes…
                        </p>
                    }
                >
                    <NotesBoard
                        project="redis-refresh"
                        chapters={CHAPTERS}
                        initialNotes={notes}
                    />
                </Suspense>
            </article>
        </PageShell>
    );
}
