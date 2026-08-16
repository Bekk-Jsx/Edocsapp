import PlanPage from "@/components/ui/plan-page";

// Project page, not a topic page — hence the PROJECT_LINKS entry rather than a
// TOPICS one, and hence no chapter eyebrow.
//
// PLACEHOLDER for now: the hooks and redis projects serve a real NotesBoard
// here (see app/(projects)/redis-refresh/notes/page.tsx), fed by listNotes()
// and their own registry. This project has no notes to group yet, so it uses
// the same placeholder shell as its chapter pages; swapping in the board is a
// self-contained change to this file when the chapters have content.
//
// No `parts`: there is no plan to break into sections here, so the Planned
// panel drops out and the page is its header alone.
export default function Page() {
    return (
        <PlanPage
            eyebrow="elasticsearch · project"
            name="Notes"
            summary="A running collection of traps, answers to my questions, and key takeaways gathered while working through the chapters."
        />
    );
}
