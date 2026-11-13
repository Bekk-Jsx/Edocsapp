"use client";

import SummaryArticles, {
    type SummaryGroup,
} from "@/components/ui/summary-articles";
import { CARD_LABEL } from "./card-kinds";
import { useLang } from "./lang-provider";

// ===================================================================
// QUESTION RAIL — the summary rail of a question page.
//
// It is the SHARED SummaryArticles, unchanged: same background, same card
// styles, same spacing, same hover and active states, same severity marks as
// every project page's rail. This wrapper adds exactly one thing — the names
// of those marks in the language the reader chose — because a tooltip is a
// string attribute and cannot be a component.
//
// The names follow the GLOBAL switch. A single section flipped to the other
// language keeps its card's title in that language (RailCardTitle) while its
// mark is named in the page's language; a tooltip is not worth a client
// component per mark.
// ===================================================================

export default function QuestionRail({ groups }: { groups: SummaryGroup[] }) {
    const { lang } = useLang();
    return (
        <SummaryArticles
            groups={groups}
            markLabels={{
                note: CARD_LABEL.note[lang],
                trap: CARD_LABEL.trap[lang],
            }}
        />
    );
}
