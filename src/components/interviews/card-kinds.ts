import type { CardType } from "@/server/schema";
import type { Lang } from "./inline";

// ===================================================================
// CARD KINDS — what to call each kind of card, in each language.
//
// There is deliberately no glyph here: a card and its mark on the rail both
// draw their icon from the SEVERITY system (SeverityIcon in
// src/lib/severity.tsx), the same one the project doc pages use, so the whole
// site has one set of marks and Interviews introduces none of its own.
//
// Shared by the cards (a server component) and the rail (a client one). No
// "use client" and no JSX here, which is what lets both import it.
//
// A Record<CardType, …>: adding a card type to CARD_TYPES is a type error
// until its label exists.
// ===================================================================

/**
 * What a kind of card is called: part of the callout's label, and the
 * tooltip on its mark in the rail.
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
