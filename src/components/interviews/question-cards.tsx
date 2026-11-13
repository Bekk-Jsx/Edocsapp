import { Callout } from "@/components/ui/doc-section";
import type { QuestionCard } from "@/server/schema";
import { CARD_LABEL } from "./card-kinds";
import { Text, plain, type Lang } from "./inline";

// ===================================================================
// QUESTION CARDS — the note / trap asides that belong to one question.
//
// A card is not part of the answer's flow: it is a term worth defining, or
// the mistake people make. It therefore comes AFTER the answer's prose rather
// than interrupting it — full width, one under the next, in data order, at
// every screen size.
//
// NO STYLES OF ITS OWN. A card is rendered by Callout from
// components/ui/doc-section — the very component the project doc pages use
// for the same thing — so its icon, colour, tint, border and spacing are the
// project pages', not a second look invented for Interviews. `note` and
// `trap` are severities of that component already, so neither needed adding.
//
// The label follows the convention the doc pages and the content batches
// write by hand, "<kind> · <what it is about>", with the kind translated and
// the title the author's (see CARD_LABEL).
//
// Server component: both languages are rendered, and the section's LangPair
// shows one. Switching language therefore changes the cards with no refetch
// and no client rendering.
// ===================================================================

export default function QuestionCards({
    cards,
    lang,
}: {
    cards: QuestionCard[];
    lang: Lang;
}) {
    // Nothing to place: the caller adds no wrapper either, so a question
    // without cards renders exactly as it did before cards existed.
    if (!cards.length) return null;

    return (
        // The same rhythm as a block list, so a card sits in the answer's
        // flow at the spacing everything else uses.
        <div className="space-y-4">
            {cards.map((card, i) => (
                <Callout
                    key={i}
                    severity={card.type}
                    // Callout's label is a plain string, so the title's inline
                    // markup is flattened here rather than dropped.
                    label={`${CARD_LABEL[card.type][lang]} · ${plain(card.title, lang)}`}
                >
                    <p>
                        <Text text={card.text} lang={lang} />
                    </p>
                </Callout>
            ))}
        </div>
    );
}
