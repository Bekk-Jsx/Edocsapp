"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
    getSpeakingKey,
    getSpeakingKeyServer,
    getVoice,
    isSpeechSupported,
    speak,
    stop,
    subscribeSpeaking,
    subscribeVoices,
    voicesLoaded,
} from "@/lib/speech";
import type { LocalizedText } from "@/server/schema";
import { plainText, resolve } from "./inline";
import { useSectionLang } from "./lang-provider";

// ===================================================================
// LISTEN — reads ONE piece of text aloud, in the language that section is
// currently showing.
//
// Three things are readable: a question TITLE, its SHORT ANSWER, and each
// individual LIST ITEM. Every button is handed exactly the text it may read
// and nothing more, so paragraphs, headings, callouts, follow-ups, captions,
// TABLES and CODE are never passed to the speech API at all — there is no
// path by which this component could say them.
//
// `sectionId` and `speechKey` are deliberately separate:
//   - the language override is per SECTION, so every button in a section
//     follows that section's toggle;
//   - "who is speaking" is per BUTTON, so only the one actually playing shows
//     its stop state.
//
// Which key is speaking lives in @/lib/speech, so the two copies of a section
// (one per language) and every button on the page agree — starting any one of
// them stops whatever was playing, by construction.
// ===================================================================

/**
 * Support AND voice-list readiness as one value.
 *
 * Read through useSyncExternalStore with a server snapshot of "unsupported",
 * so the server and the first client render agree (no hydration mismatch) and
 * the button appears a tick later — the same shape as AddNoteButton. A plain
 * `typeof window` check in render would mismatch.
 *
 * It returns a string, which is stable between calls; an object would make
 * the store re-render forever.
 */
type SpeechState = "unsupported" | "loading" | "ready";

function speechSnapshot(): SpeechState {
    if (!isSpeechSupported()) return "unsupported";
    return voicesLoaded() ? "ready" : "loading";
}

const serverSnapshot = (): SpeechState => "unsupported";

export default function ListenButton({
    sectionId,
    text,
    speechKey,
    what = "question",
    subtle = false,
}: {
    /** The question's slug — the key for its language override. */
    sectionId: string;
    /** The text this button may read, and nothing more. */
    text: LocalizedText;
    /** Unique per button. Defaults to this section's title. */
    speechKey?: string;
    /** The noun in "Listen to the …". */
    what?: string;
    /**
     * List items: smaller, muted, and revealed on hover or focus so a long
     * list is not a column of icons. Always keyboard-reachable, and always
     * visible where there is no hover (touch) — see .listen-subtle in
     * globals.css.
     */
    subtle?: boolean;
}) {
    // The section's current language — global switch plus its own override.
    const lang = useSectionLang(sectionId);
    const key = speechKey ?? `${sectionId}:title`;

    // Re-render when the browser finishes loading its voice list.
    const state = useSyncExternalStore(
        subscribeVoices,
        speechSnapshot,
        serverSnapshot,
    );
    const speakingKey = useSyncExternalStore(
        subscribeSpeaking,
        getSpeakingKey,
        getSpeakingKeyServer,
    );
    const speaking = speakingKey === key;

    // Switching this section's language mid-sentence would leave the wrong
    // language playing, so it stops. Unmounting stops it too — which is also
    // what collapses a revealed answer in practice mode.
    useEffect(() => {
        return () => {
            if (getSpeakingKey() === key) stop();
        };
    }, [key, lang]);

    // Nothing to offer without the API: render nothing at all rather than a
    // button that cannot work.
    if (state === "unsupported") return null;

    // Before the voice list arrives, assume it will work; once it is known,
    // a missing language is reported instead of failing silently on click.
    const missing = state === "ready" && !getVoice(lang);
    const language = lang === "de" ? "German" : "English";
    const label = missing
        ? `No ${language} voice installed on this system`
        : speaking
          ? "Stop"
          : `Listen to the ${what}`;

    const onClick = () => {
        if (speaking) {
            stop();
            return;
        }
        // Resolved the same way the text is displayed (German falls back to
        // English), then stripped of markup so no backticks are read out.
        const { value } = resolve(text, lang);
        speak(key, plainText(value), lang);
    };

    const size = subtle
        ? "h-[1.1em] w-[1.1em] ml-1.5 align-[-0.1em]"
        : "h-[1.35em] w-[1.35em]";
    // Hidden until the row is hovered or something inside it has focus; the
    // focus-visible rule keeps it reachable by keyboard alone.
    const reveal = subtle
        ? "listen-subtle opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100 focus-visible:opacity-100"
        : "";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={missing}
            aria-label={label}
            aria-pressed={speaking}
            className={`group relative inline-flex ${size} ${reveal} shrink-0 items-center justify-center rounded text-[var(--muted)] transition-colors duration-150 hover:text-[var(--accent)] focus-visible:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-[var(--muted)]`}
        >
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
                {speaking ? (
                    <rect x="6" y="6" width="12" height="12" rx="1.5" />
                ) : (
                    <>
                        {/* speaker cone + two waves */}
                        <path d="M4 9.5h3L11 6v12l-4-3.5H4Z" />
                        <path d="M15 9.2a4 4 0 0 1 0 5.6" />
                        <path d="M17.6 6.8a7.5 7.5 0 0 1 0 10.4" />
                    </>
                )}
            </svg>

            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[0.65rem] normal-case tracking-normal text-[var(--text)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
                {label}
            </span>
        </button>
    );
}
