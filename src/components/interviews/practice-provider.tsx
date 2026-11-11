"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { saveProgress } from "@/server/progress-actions";
import type { ProgressState } from "@/server/schema";

// ===================================================================
// PRACTICE — the shared state behind practice mode.
//
// Off on every load, deliberately: nothing is persisted about the MODE, only
// about the answers. The progress map arrives from the server (read from
// MongoDB) and is updated optimistically from here, so a click does not wait
// for a round trip; a failed write rolls the entry back and surfaces one short
// error line.
//
// This provider is the extra client piece the two components in the spec need
// to share state — the toggle shows the count and the sections report answers,
// and neither can own it alone.
// ===================================================================

type PracticeContext = {
    /** Whether practice mode is on. Never persisted. */
    on: boolean;
    setOn: (on: boolean) => void;
    /** Hide sections already marked "known". Only meaningful while `on`. */
    hideKnown: boolean;
    setHideKnown: (hide: boolean) => void;
    /** entry slug -> saved state, as currently believed by the client. */
    progress: Record<string, ProgressState>;
    /** Records an answer. Optimistic; rolls back on failure. */
    answer: (slug: string, state: ProgressState) => void;
    /** Which sections currently have their answer revealed. */
    revealed: Record<string, boolean>;
    /** Reveals one section's answer, or collapses it again. */
    setRevealed: (slug: string, revealed: boolean) => void;
    /** The last write error, or null. */
    error: string | null;
    /** Active questions on this page, for "Known X / Y". */
    total: number;
    /** How many of them are currently "known". */
    known: number;
};

const Ctx = createContext<PracticeContext | null>(null);

export function usePractice(): PracticeContext {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("usePractice must be used inside <PracticeProvider>");
    return ctx;
}

export default function PracticeProvider({
    pagePath,
    initialProgress,
    total,
    children,
}: {
    /** The page node's path; the entry key is `${pagePath}/${slug}`. */
    pagePath: string;
    /** Read on the server from the progress collection. */
    initialProgress: Record<string, ProgressState>;
    total: number;
    children: ReactNode;
}) {
    const [on, setOnState] = useState(false);
    const [hideKnown, setHideKnown] = useState(false);
    const [revealed, setRevealedMap] = useState<Record<string, boolean>>({});

    // Reveal state lives here, not in each section, so that leaving practice
    // mode can clear it in one place — and in an event handler rather than an
    // effect. Turning the mode back on therefore always starts collapsed.
    const setOn = useCallback((next: boolean) => {
        setOnState(next);
        setRevealedMap({});
    }, []);

    const setRevealed = useCallback((slug: string, next: boolean) => {
        setRevealedMap((prev) => ({ ...prev, [slug]: next }));
    }, []);
    const [progress, setProgress] =
        useState<Record<string, ProgressState>>(initialProgress);
    const [error, setError] = useState<string | null>(null);

    const answer = useCallback(
        (slug: string, state: ProgressState) => {
            const previous = progress[slug];
            // Optimistic: the chip changes now, the write catches up.
            setProgress((prev) => ({ ...prev, [slug]: state }));
            setError(null);

            void saveProgress({ entry: `${pagePath}/${slug}`, state }).then(
                (result) => {
                    if (result.ok) return;
                    // Roll back to exactly what was there before, including
                    // "nothing", so a failed first answer leaves no chip.
                    setProgress((prev) => {
                        const next = { ...prev };
                        if (previous === undefined) delete next[slug];
                        else next[slug] = previous;
                        return next;
                    });
                    setError(result.error);
                },
                (cause) => {
                    console.error("[practice] save failed", cause);
                    setProgress((prev) => {
                        const next = { ...prev };
                        if (previous === undefined) delete next[slug];
                        else next[slug] = previous;
                        return next;
                    });
                    setError("Could not save");
                },
            );
        },
        [pagePath, progress],
    );

    const known = useMemo(
        () => Object.values(progress).filter((s) => s === "known").length,
        [progress],
    );

    const value = useMemo(
        () => ({
            on,
            setOn,
            hideKnown,
            setHideKnown,
            progress,
            answer,
            revealed,
            setRevealed,
            error,
            total,
            known,
        }),
        [
            on,
            setOn,
            hideKnown,
            progress,
            answer,
            revealed,
            setRevealed,
            error,
            total,
            known,
        ],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
