"use client";

import type { CardType } from "@/server/schema";
import { CARD_GLYPH, CARD_LABEL } from "./card-kinds";
import { useSectionLang } from "./lang-provider";

// ===================================================================
// RAIL CARD MARKS — which kinds of card a question carries, on its rail card.
//
// It renders INSIDE the rail card's existing title slot (SummaryArticle.title
// takes a ReactNode), so the rail keeps its structure and its design: no new
// row, no tint, no border colour. A question with no cards renders nothing at
// all.
//
// A client component for one reason: the tooltip follows the language the
// question is showing — the global switch and that section's own override
// alike — exactly as RailCardTitle beside it does. The data comes from the
// entry already loaded for the page, so this costs no request.
// ===================================================================

export default function RailCardMarks({
    sectionId,
    types,
}: {
    /** The entry slug, so the tooltip follows THAT section's language. */
    sectionId: string;
    /** Deduped and ordered by the caller — see cardTypesOf. */
    types: CardType[];
}) {
    const lang = useSectionLang(sectionId);
    if (!types.length) return null;

    return (
        <span className="ml-1.5 inline-flex shrink-0 items-center gap-1 align-middle">
            {types.map((type) => {
                const label = CARD_LABEL[type][lang];
                return (
                    <span
                        key={type}
                        role="img"
                        aria-label={label}
                        title={label}
                        className="text-[0.7rem] leading-none"
                    >
                        {CARD_GLYPH[type]}
                    </span>
                );
            })}
        </span>
    );
}
