// The pill shared by the project STATUS badge (status-badge.tsx) and the
// SEVERITY badge on a doc-section title (doc-section.tsx). The two are the same
// object at two scopes, so they are not kept in sync by hand — they read the
// same string, and a change here lands on both by construction.
//
// Only the box lives here. Colour is per badge, applied inline: both tints are a
// color-mix() over a CSS var chosen at runtime, which Tailwind cannot express as
// a static utility.
//
// Why the padding is lopsided — measured on the rendered glyphs, not guessed:
//   Vertical. A line box reserves room for descenders that an all-caps label
//     never uses, so the text rode high in the pill. Centring the line box
//     (inline-flex + items-center + leading-none) recovers most of it; the rest
//     is the descent the em box still carries, hence pt > pb.
//   Horizontal. `tracking-widest` adds its 0.1em after the final letter as well,
//     which pushes the text left of centre; the right padding gives it back.
export const BADGE_CLASS =
    "inline-flex shrink-0 items-center justify-center rounded-full border pt-[5px] pr-[calc(0.5rem-0.1em)] pb-[4px] pl-2 font-mono text-[0.6rem] leading-none uppercase tracking-widest";
