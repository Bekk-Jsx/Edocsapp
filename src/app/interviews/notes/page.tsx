import { Suspense } from "react";
import PhrasebookBoard, {
    type PhrasebookGroup,
} from "@/components/interviews/phrasebook-board";
import { InterviewsUnavailable } from "@/components/home/interviews-content";
import PageShell from "@/components/ui/page-shell";
import { getInterviewTree } from "@/lib/interviews";
import { getItemPages } from "@/server/interviews";
import { listPhrases, type Phrase } from "@/server/phrasebook";

// The PHRASEBOOK: the EN/DE pairs collected while reading questions.
//
// It replaces what was the interview notes page, in the same place and with
// the same grouping and links — one block per item, its pages in sidebar
// order, each phrase linking back to the question it came from. The add button
// on a question section still points here.
//
// Project notes are a different thing entirely and are untouched: they keep
// their own storage (src/data/notes/<project>.json), their own board and their
// own pages under /projects/<project>/notes.
//
// This is a STATIC segment, so it wins over /interviews/[item] and no item may
// be called "notes".

// Phrases live in MongoDB and change as you add them, so the page is read per
// request rather than captured at build time.
export const dynamic = "force-dynamic";

export default async function Page() {
    let phrases: Phrase[] = [];
    let groups: PhrasebookGroup[] = [];
    let reachable = true;

    try {
        phrases = await listPhrases();
        const categories = await getInterviewTree();
        groups = await Promise.all(
            categories
                .flatMap((category) => category.items)
                .map(async (item) => ({
                    label: item.name,
                    pages: (await getItemPages(item.slug)).map((page) => ({
                        slug: page.slug,
                        name: page.name.en,
                    })),
                })),
        );
    } catch (error) {
        console.error("[phrasebook] unavailable", error);
        reachable = false;
    }

    return (
        <PageShell>
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        interviews · section
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        Phrasebook
                    </h1>
                    <div className="mt-3 leading-relaxed text-[var(--muted)]">
                        The phrases you want to be able to say, in both languages,
                        grouped by the page they came from. 🔊 reads each side in
                        its own language.
                    </div>
                </header>

                {reachable ? (
                    // useSearchParams reads request-time data, so the board
                    // renders inside a boundary rather than opting the route
                    // out of static.
                    <Suspense
                        fallback={
                            <p className="font-mono text-xs text-[var(--muted)]">
                                loading phrasebook…
                            </p>
                        }
                    >
                        <PhrasebookBoard
                            initialPhrases={phrases}
                            groups={groups}
                        />
                    </Suspense>
                ) : (
                    <InterviewsUnavailable />
                )}
            </article>
        </PageShell>
    );
}
