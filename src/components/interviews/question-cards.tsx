import { SeverityIcon, severityStyle } from "@/lib/severity";
import type { CardType, QuestionCard } from "@/server/schema";
import { Text, type Lang } from "./inline";

// ===================================================================
// QUESTION CARDS — the asides in the margin beside one answer.
//
// A card is not part of the answer's flow: it is a term worth defining, or
// the mistake people make. It therefore sits in its own column (see
// .answer-cols in globals.css) instead of interrupting the prose, and stacks
// under the answer when that column is too narrow to be a margin.
//
// Colour and icon come from the SEVERITY system (src/lib/severity.tsx), the
// same source the doc pages and the inline callouts read — a `note` card in
// the margin and a `note` callout in the body are the same mark, so the page
// has one visual vocabulary rather than two.
//
// Server component: both languages are rendered, and the section's LangPair
// shows one. Switching language therefore changes the cards with no refetch
// and no client rendering.
// ===================================================================

/**
 * The type label above a card's title.
 *
 * TRANSLATED, unlike the rest of the question chrome (badge, buttons,
 * "Short answer"), because the label is the only words on a card that are not
 * the author's: leaving it English would put one English word inside German
 * prose. It is derived from `type` rather than stored, so a card cannot
 * contradict its own label — and being a Record<CardType, …>, adding a card
 * type is a type error until its label exists.
 */
const CARD_LABEL: Record<CardType, Record<Lang, string>> = {
    note: { en: "Note", de: "Hinweis" },
    trap: { en: "Trap", de: "Falle" },
};

/** One card. The icon carries the label for a screen reader, not twice. */
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
                <SeverityIcon
                    severity={card.type}
                    className="h-[1.3em] w-[1.3em] shrink-0"
                />
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
 * The card column for one question, or nothing at all.
 *
 * Returning null for an empty list is what keeps every question written
 * before cards existed rendering exactly as it did: the caller only builds
 * the two-column grid when this has something to show.
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
        <aside className="answer-aside space-y-2.5">
            {cards.map((card, i) => (
                <Card key={i} card={card} lang={lang} />
            ))}
        </aside>
    );
}
