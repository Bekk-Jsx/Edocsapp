import Link from "next/link";
import type { NoteHit } from "@/search/notes";
import Highlight from "../highlight";
import type { NavigateHandler } from "./title-result";

// A note, in the NotesBoard card's shape and colours: title, a short snippet
// around the match, and where the note is attached.
export default function NoteResult({
    hit,
    query,
    onNavigate,
}: {
    hit: NoteHit;
    query: string;
    onNavigate: NavigateHandler;
}) {
    return (
        <Link
            href={hit.href}
            onClick={(e) => onNavigate(e, hit.href)}
            className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            <h3 className="text-[0.95rem] font-semibold text-[var(--text)]">
                <Highlight text={hit.note.title} query={query} />
            </h3>
            {hit.snippet ? (
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                    <Highlight text={hit.snippet} query={query} />
                </p>
            ) : null}
            <p className="mt-3 font-mono text-[0.65rem] text-[var(--muted)]">
                {hit.location.join(" › ")}
                <span className="ml-2 text-[var(--accent)]">open →</span>
            </p>
        </Link>
    );
}
