import { Suspense } from "react";
import PageShell from "@/components/ui/page-shell";
import NotesBoard, { type NotesChapter } from "@/components/notes/notes-board";
import { hooksByChapter } from "@/projects/hooks-refresh/hooks";
import { listNotes } from "@/lib/notes-store";

// Project page, not a hook page: PageShell with no `alerts`, so no summary rail,
// and no DemoFrame. The registry is read here on the server and handed down as
// plain data, which is what makes the notes group in the navbar's exact order.
const CHAPTERS: NotesChapter[] = hooksByChapter().map((g) => ({
    label: g.chapter,
    items: g.hooks.map((h) => ({ slug: h.slug, name: h.name })),
}));

// The notes file is read per request, not at build time — otherwise the page
// would ship whatever happened to be on disk when it was compiled.
export const dynamic = "force-dynamic";

export default async function Page() {
    const notes = await listNotes("hooks-refresh");
    return (
        <PageShell>
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        hooks · refresh
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        Notes
                    </h1>
                    <div className="mt-3 leading-relaxed text-[var(--muted)]">
                        Your own notes, grouped the way the sidebar is — by chapter,
                        then by hook. Anything without a hook lands under Other.
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
                        project="hooks-refresh"
                        chapters={CHAPTERS}
                        initialNotes={notes}
                    />
                </Suspense>
            </article>
        </PageShell>
    );
}
