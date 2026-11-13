import { severityStyle } from "@/lib/severity";
import type { QuestionCard } from "@/server/schema";
import { CARD_GLYPH, CARD_LABEL } from "./card-kinds";
import { Text, type Lang } from "./inline";

// ===================================================================
// QUESTION CARDS — the asides in the margin beside one answer.
//
// A card is not part of the answer's flow: it is a term worth defining, or
// the mistake people make. It therefore comes AFTER the answer's prose rather
// than interrupting it — full width, one card under the next, in data order,
// at every screen size.
//
// The frame colour comes from the SEVERITY system (src/lib/severity.tsx), the
// same source the doc pages and the inline callouts read, so a `note` card
// and a `note` callout are the same blue-neutral and a trap the same amber.
// The glyph is the card's own (see CARD_GLYPH).
//
// Server component: both languages are rendered, and the section's LangPair
// shows one. Switching language therefore changes the cards with no refetch
// and no client rendering.
// ===================================================================

/** One card. The glyph is decorative — the label beside it is the text. */
function Card({ card, lang }: { card: QuestionCard; lang: Lang }) {
    const { color, bg } = severityStyle[card.type];
    const label = CARD_LABEL[card.type][lang];

    return (
        <div
            className="rounded-lg border p-3"
            style={{ borderColor: color, background: bg }}
        >
            <p
                className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest"
                style={{ color }}
            >
                <span aria-hidden="true" className="text-[1.15em] leading-none">
                    {CARD_GLYPH[card.type]}
                </span>
                {label}
            </p>
            <p className="text-[0.85rem] font-semibold leading-snug text-[var(--text)]">
                <Text text={card.title} lang={lang} />
            </p>
            {/* `callout-<type>` carries no styling of its own: it is the hook
                the `.callout-* .code-token` rules in globals.css use, so an
                inline `code` token inside a card is tinted exactly as one
                inside a Callout of the same severity. */}
            <p
                className={`callout-${card.type} mt-1.5 text-[0.8rem] leading-[1.6] text-[var(--muted)]`}
            >
                <Text text={card.text} lang={lang} />
            </p>
        </div>
    );
}

/**
 * The cards for one question, or nothing at all.
 *
 * Returning null for an empty list is what keeps every question written
 * before cards existed rendering exactly as it did — the caller adds no
 * wrapper of its own.
 */
export default function QuestionCards({
    cards,
    lang,
}: {
    cards: QuestionCard[];
    lang: Lang;
}) {
    if (!cards.length) return null;
    return (
        <div className="space-y-3">
            {cards.map((card, i) => (
                <Card key={i} card={card} lang={lang} />
            ))}
        </div>
    );
}
