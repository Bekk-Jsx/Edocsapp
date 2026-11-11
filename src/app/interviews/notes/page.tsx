import { Suspense } from "react";
import NotesBoard, { type NotesChapter } from "@/components/notes/notes-board";
import PageShell from "@/components/ui/page-shell";
import { listNotes } from "@/lib/notes-store";
import { getInterviewTree } from "@/lib/interviews";
import { getItemPages } from "@/server/interviews";

// Interview notes, the same board the projects use.
//
// Notes taken on an interview section are stored under the "interviews" key
// (src/data/notes/interviews.json), grouped by the page they came from, and
// each keeps the full path plus its anchor — so "open →" lands back on the
// question. The add-note button on a question section links here.
//
// This is a STATIC segment, so it wins over /interviews/[item] and no item
// may be called "notes".

// The notes file is read per request, not at build time — otherwise the page
// would ship whatever happened to be on disk when it was compiled.
export const dynamic = "force-dynamic";

export default async function Page() {
    const notes = await listNotes("interviews");

    // One chapter per item, its pages standing in for topics — the same shape
    // the board gets from a project registry.
    let chapters: NotesChapter[] = [];
    try {
        const categories = await getInterviewTree();
        chapters = await Promise.all(
            categories
                .flatMap((category) => category.items)
                .map(async (item) => ({
                    label: item.name,
                    items: (await getItemPages(item.slug)).map((page) => ({
                        slug: page.slug,
                        name: page.name.en,
                    })),
                })),
        );
    } catch (error) {
        // Without the tree the board still lists every note, just all under
        // "Other" — far better than failing the page.
        console.error("[interviews] notes chapters unavailable", error);
    }

    return (
        <PageShell>
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        interviews · section
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        Notes
                    </h1>
                    <div className="mt-3 leading-relaxed text-[var(--muted)]">
                        Your own notes on interview questions, grouped by the page
                        they came from. Anything without a page lands under Other.
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
                        project="interviews"
                        chapters={chapters}
                        initialNotes={notes}
                    />
                </Suspense>
            </article>
        </PageShell>
    );
}
