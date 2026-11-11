"use client";

import { otherLang } from "./inline";
import { useLang, useSectionLang } from "./lang-provider";

// Flips ONE section to the other language — for reading an answer in German
// without putting the whole page into German.
//
// Sits next to the note icon and matches it exactly: same size, same muted
// hover, same CSS-only tooltip. The override is client state and resets on
// reload (LangProvider), and setting the global language clears it.

export default function SectionLangToggle({
    sectionId,
}: {
    sectionId: string;
}) {
    const { lang, toggleSection } = useLang();
    const sectionLang = useSectionLang(sectionId);
    const target = otherLang(sectionLang);
    const label = target === "de" ? "Show in German" : "Show in English";
    // Only worth a badge when this section disagrees with the page.
    const differs = sectionLang !== lang;

    return (
        <span className="inline-flex items-center gap-1.5">
            {differs ? (
                <span className="rounded border border-[var(--border)] px-1 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--accent)]">
                    {sectionLang}
                </span>
            ) : null}
            <button
                type="button"
                onClick={() => toggleSection(sectionId)}
                aria-label={label}
                aria-pressed={differs}
                className="group relative inline-flex h-[1.35em] w-[1.35em] shrink-0 items-center justify-center rounded text-[var(--muted)] transition-colors duration-150 hover:text-[var(--accent)] focus-visible:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            >
                {/* translate: two overlapping glyph frames */}
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-full w-full"
                >
                    <path d="M4 5h9" />
                    <path d="M8.5 5v1.5c0 3.5-2 6-4.5 7.5" />
                    <path d="M5 10.5c1.5 2 3.5 3.2 6 3.8" />
                    <path d="M12.5 21l4-10 4 10" />
                    <path d="M13.9 17.5h5.2" />
                </svg>

                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[0.65rem] normal-case tracking-normal text-[var(--text)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                    {label}
                </span>
            </button>
        </span>
    );
}
