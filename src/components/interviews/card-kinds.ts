import type { CardType } from "@/server/schema";
import type { Lang } from "./inline";

// ===================================================================
// CARD KINDS — the glyph and the label for each kind of card.
//
// Shared by the cards themselves (a server component) and the marks on a
// rail card (a client one), so the two can never show a question as a note
// and a trap respectively. No "use client" and no JSX here, which is what
// lets both import it.
//
// Both maps are Record<CardType, …>: adding a card type to CARD_TYPES is a
// type error until its glyph and its label exist.
// ===================================================================

/**
 * The glyph for a kind of card.
 *
 * An emoji, not one of the severity SVGs: it is the same mark in the card's
 * label and on its rail card, where an inline SVG would need sizing against
 * the surrounding text at both sizes. The severity COLOUR still frames the
 * card (see severityStyle), so a note still reads blue-neutral and a trap
 * amber — the glyph carries its own colours and is not tinted.
 */
export const CARD_GLYPH: Record<CardType, string> = {
    note: "📝",
    trap: "⚠️",
};

/**
 * The label above a card's title, and the tooltip on a rail mark.
 *
 * TRANSLATED, unlike the rest of the question chrome (badge, buttons,
 * "Short answer"), because the label is the only words on a card that are not
 * the author's: leaving it English would put one English word inside German
 * prose. It is derived from `type` rather than stored, so a card cannot
 * contradict its own label.
 */
export const CARD_LABEL: Record<CardType, Record<Lang, string>> = {
    note: { en: "Note", de: "Hinweis" },
    trap: { en: "Trap", de: "Falle" },
};
