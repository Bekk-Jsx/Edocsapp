"use client";

import type { Lang } from "./inline";
import { useLang } from "./lang-provider";

// The global EN | DE control. Content only — every UI label in the app stays
// English, so this never touches chrome.
//
// Setting it also clears per-section overrides (see LangProvider), so the page
// lands in one consistent language rather than a patchwork.

const OPTIONS: { value: Lang; label: string; title: string }[] = [
    { value: "en", label: "EN", title: "Show content in English" },
    { value: "de", label: "DE", title: "Show content in German" },
];

export default function LangSwitch() {
    const { lang, setLang } = useLang();

    return (
        <div>
            <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                Content language
            </p>
            {/* A radiogroup, not two buttons: it is one choice with two states,
                and arrow keys should move between them. */}
            <div
                role="radiogroup"
                aria-label="Content language"
                className="inline-flex overflow-hidden rounded-md border border-[var(--border)]"
            >
                {OPTIONS.map((option) => {
                    const active = lang === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            title={option.title}
                            onClick={() => setLang(option.value)}
                            className={`px-2.5 py-1 font-mono text-[0.7rem] tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                                active
                                    ? "bg-[var(--surface-2)] text-[var(--accent)]"
                                    : "text-[var(--muted)] hover:text-[var(--text)]"
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
