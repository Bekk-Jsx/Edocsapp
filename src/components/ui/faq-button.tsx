// Global "jump to FAQ" control. Fixed bottom-right, rendered once in the root
// layout so it exists on every hook page. Pure anchor + CSS: the scroll is
// native (html { scroll-behavior: smooth }), the tooltip is a sibling span
// toggled on :hover / :focus-visible. No JS, so this stays a Server Component.
//
// Target: #say-it-right-english — the DocSection slug present on every hook page.
export default function FaqButton() {
    return (
        <a
            href="#say-it-right-english"
            aria-label="Jump to FAQ"
            className="group fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] opacity-80 shadow-sm transition-[transform,box-shadow,border-color,opacity] duration-150 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:opacity-100 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:border-[var(--accent)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0"
        >
            {/* question-mark-in-a-circle */}
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
            >
                <circle cx="12" cy="12" r="9" />
                <path d="M9.4 9.2a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.2-2.6 3.9" />
                <path d="M12 17.2h.01" />
            </svg>

            {/* CSS-only tooltip, sits to the LEFT of the button */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute right-[calc(100%+0.6rem)] whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[0.7rem] text-[var(--text)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
                Jump to FAQ
            </span>
        </a>
    );
}
