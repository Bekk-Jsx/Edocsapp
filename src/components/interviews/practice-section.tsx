"use client";

import type { ReactNode } from "react";
import { BADGE_CLASS } from "@/components/ui/badge-class";
import { severityStyle } from "@/lib/severity";
import type { ProgressState } from "@/server/schema";
import { usePractice } from "./practice-provider";

// ===================================================================
// PRACTICE SECTION — one question's wrapper.
//
// It owns the <section> element (so the id, the `doc-section` class, the
// arrival flash and the sibling hairline all stay exactly as on a doc page)
// and decides what of it is visible:
//
//   practice off -> header + body, i.e. the page as it has always looked
//   practice on  -> header only, until "Show answer"; then the body plus
//                   "I know it" / "Again", which record and collapse it again
//
// `header` and `body` arrive as server-rendered subtrees — both language
// versions included — so revealing an answer shows it in whatever language
// that section is currently set to, with no refetch and no client rendering.
// ===================================================================

/** "known" reads as a tip, "again" as a trap — the existing severity palette. */
const STATE_TONE: Record<ProgressState, { color: string; label: string }> = {
    known: { color: severityStyle.tip.color, label: "known" },
    again: { color: severityStyle.trap.color, label: "again" },
};

export function StateChip({ state }: { state: ProgressState }) {
    const { color, label } = STATE_TONE[state];
    return (
        <span
            className={BADGE_CLASS}
            style={{
                color,
                background: `color-mix(in srgb, ${color} 12%, var(--surface))`,
                borderColor: `color-mix(in srgb, ${color} 40%, var(--surface))`,
            }}
        >
            {label}
        </span>
    );
}

const BUTTON =
    "rounded-md border px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1";

/**
 * The state dot on a rail card, and the hook that dims the card.
 *
 * It renders inside the card's `text`, which SummaryArticles accepts as a
 * ReactNode — so the shared rail component needs no new behaviour for this.
 * `data-practice-dim` is what the `:has()` rule in globals.css keys off to fade
 * the whole card; no other page ever sets that attribute.
 */
export function RailState({ slug }: { slug: string }) {
    const { on, hideKnown, progress } = usePractice();
    const state = progress[slug];
    if (!on || !state) return null;

    const { color, label } = STATE_TONE[state];
    const dim = hideKnown && state === "known";
    return (
        <span
            className="inline-flex items-center gap-1.5 font-mono text-[0.7rem]"
            style={{ color }}
            {...(dim ? { "data-practice-dim": "true" } : {})}
        >
            <span
                aria-hidden="true"
                className="inline-block h-[0.45rem] w-[0.45rem] shrink-0 rounded-full"
                style={{ backgroundColor: color }}
            />
            {label}
        </span>
    );
}

export default function PracticeSection({
    slug,
    header,
    body,
}: {
    slug: string;
    header: ReactNode;
    body: ReactNode;
}) {
    const { on, hideKnown, progress, answer, revealed, setRevealed } =
        usePractice();
    const state = progress[slug];
    const isRevealed = revealed[slug] === true;

    // "Hide known" removes the whole section, title included; its rail card is
    // dimmed separately.
    if (on && hideKnown && state === "known") return null;

    // Answering records it and collapses the section back to its title.
    const record = (next: ProgressState) => {
        answer(slug, next);
        setRevealed(slug, false);
    };

    return (
        <section id={slug} className="doc-section">
            {/* Practice off: the header exactly as it was, with no extra
                wrapper, so the page is byte-for-byte what it used to be. */}
            {on ? (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                    <div className="min-w-0 flex-1">{header}</div>
                    {state ? <StateChip state={state} /> : null}
                </div>
            ) : (
                header
            )}

            {on ? (
                isRevealed ? (
                    <div className="mt-3 space-y-4">
                        {body}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => record("known")}
                                className={`${BUTTON} border-[var(--mint)] text-[var(--mint)] hover:bg-[var(--surface-2)] focus-visible:ring-[var(--mint)]`}
                            >
                                I know it
                            </button>
                            <button
                                type="button"
                                onClick={() => record("again")}
                                className={`${BUTTON} border-[var(--amber)] text-[var(--amber)] hover:bg-[var(--surface-2)] focus-visible:ring-[var(--amber)]`}
                            >
                                Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => setRevealed(slug, true)}
                            aria-expanded={false}
                            className={`${BUTTON} border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:ring-[var(--accent)]`}
                        >
                            Show answer
                        </button>
                    </div>
                )
            ) : (
                // Practice off: the body exactly as before, no wrapper of its
                // own beyond the doc-prose the caller already applied.
                body
            )}
        </section>
    );
}
