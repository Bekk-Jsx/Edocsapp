import AddNoteButton from "@/components/ui/add-note-button";
import type { AssetInfo, QuestionEntry } from "@/server/interviews";
import type { Block } from "@/server/schema";
import Blocks from "./blocks";
import { Text, type Lang } from "./inline";
import { LangPair, LangText } from "./lang-provider";
import ListenButton from "./listen-button";
import PracticeSection from "./practice-section";
import PriorityBadge from "./priority-badge";
import QuestionCards from "./question-cards";
import SectionLangToggle from "./section-lang-toggle";

// ===================================================================
// QUESTION SECTION — one answered question, with the doc pages' section look.
//
// The `doc-section` class is what earns the shared behaviour: the hairline
// between siblings and the arrival flash (`.doc-section:target`,
// `.search-arrive`) both hang off it, so a #slug link lands and flashes
// exactly as it does on a project page. The id is the entry SLUG, not a
// slugged title, so the anchor is stable even if the wording changes.
//
// Both languages are rendered here, on the server, and LangPair/LangText pick
// one. The chrome — badge, note button, toggle — is rendered ONCE and is not
// translated: UI stays English. The exceptions are the labels that sit INSIDE
// the author's prose and are rendered per language with the rest of the body:
// a card's kind (see question-cards.tsx), "Show code" (see code-collapse.tsx)
// and the short answer's label below.
//
// A question's cards are stacked full width under its prose and above the
// "Show code" toggle, at every screen size. A question without cards renders
// exactly as it did before cards existed — one Blocks call, no wrapper.
// ===================================================================

/**
 * Splits an answer's blocks at the run of code blocks that ENDS it.
 *
 * The reading order for a question is prose, then its cards, then the code:
 * a trailing code block is a collapsed "Show code" toggle, which belongs at
 * the bottom of the section and not above the cards. A code block in the
 * MIDDLE of an answer is part of the prose flow, so it is left where the
 * author put it and the cards land after everything.
 *
 * Only used when there ARE cards; otherwise the blocks are rendered in one
 * call exactly as before.
 */
function splitTrailingCode(blocks: Block[]): [Block[], Block[]] {
    let cut = blocks.length;
    while (cut > 0 && blocks[cut - 1].type === "code") cut--;
    return [blocks.slice(0, cut), blocks.slice(cut)];
}

/** The divider above a priority part, matching the doc pages' PartHeading. */
export function PartHeading({
    kicker,
    children,
}: {
    kicker: string;
    children: string;
}) {
    return (
        <div className="mt-14 mb-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {kicker}
            </p>
            <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

/**
 * The label on the short answer box.
 *
 * Translated, like the kind of a card and "Show code": it labels the author's
 * own sentence, so an English word there would sit inside German prose. Kept
 * beside the component that renders it, exactly as CodeCollapse keeps its
 * own.
 */
const SHORT_ANSWER_LABEL: Record<Lang, string> = {
    en: "Short answer",
    de: "Kurze Antwort",
};

/** The ~30-second spoken answer: the one thing to say out loud. */
function ShortAnswer({
    entry,
    lang,
}: {
    entry: QuestionEntry;
    lang: Lang;
}) {
    const shortAnswer = entry.shortAnswer;
    if (!shortAnswer) return null;
    return (
        <div
            className="rounded-lg border-l-2 bg-[var(--surface-2)] px-4 py-3"
            style={{ borderLeftColor: "var(--mint)" }}
        >
            <div className="mb-1 flex items-center gap-2">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--mint)]">
                    {SHORT_ANSWER_LABEL[lang]}
                </p>
                {/* Reads the whole short answer, nothing else. In practice
                    mode this box is unmounted until "Show answer", so the
                    button cannot give the answer away early. */}
                <ListenButton
                    sectionId={entry.slug}
                    speechKey={`${entry.slug}:short-answer`}
                    what="short answer"
                    text={shortAnswer}
                />
            </div>
            <p className="text-[0.95rem] leading-[1.65] text-[var(--text)]">
                <Text text={shortAnswer} lang={lang} />
            </p>
        </div>
    );
}

function FollowUps({ entry, lang }: { entry: QuestionEntry; lang: Lang }) {
    if (!entry.followUps?.length) return null;
    return (
        <div>
            <p className="mb-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                Follow-up questions
            </p>
            <ul className="ml-5 list-disc space-y-1 text-[0.9rem] leading-[1.6] text-[var(--muted)] marker:text-[var(--border)]">
                {entry.followUps.map((text, i) => (
                    <li key={i}>
                        <Text text={text} lang={lang} />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function QuestionSection({
    entry,
    assets,
}: {
    entry: QuestionEntry;
    assets: Map<string, AssetInfo>;
}) {
    const hasCards = entry.cards.length > 0;
    // Without cards there is nothing to place, so the blocks stay in ONE
    // Blocks call — the same markup, and the same code-collapse keys, as
    // before cards existed.
    const [prose, trailingCode] = hasCards
        ? splitTrailingCode(entry.blocks)
        : [entry.blocks, []];

    // One language's whole body. Called twice; only one is ever visible.
    const body = (lang: Lang) => (
        <div className="space-y-4">
            <ShortAnswer entry={entry} lang={lang} />
            {/* keyBase is the entry slug, so a code block's open/closed state
                is shared between this section's two language copies. */}
            <Blocks
                blocks={prose}
                ctx={{ lang, assets, keyBase: entry.slug }}
            />
            <QuestionCards cards={entry.cards} lang={lang} />
            {/* `path` keeps these blocks' keys distinct from the prose call's
                indices, so two code blocks can never share a collapse key. */}
            <Blocks
                blocks={trailingCode}
                ctx={{ lang, assets, keyBase: entry.slug }}
                path="tail"
            />
            <FollowUps entry={entry} lang={lang} />
        </div>
    );

    // Both halves are server-rendered and handed to PracticeSection, which
    // owns the <section> and decides how much of it is visible. With practice
    // off it renders exactly these two, in this order, unwrapped.
    const header = (
        <div className="mb-3 flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
                <span
                    aria-hidden="true"
                    className="inline-block h-[14px] w-[2px] shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--accent)" }}
                />
                <p className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">
                    <LangText
                        sectionId={entry.slug}
                        en={<Text text={entry.title} lang="en" />}
                        de={<Text text={entry.title} lang="de" />}
                    />
                </p>
                {/* Reads the TITLE only, in whatever language this section
                    is showing. Stays available in practice mode — saying the
                    question out loud is the point there. */}
                <ListenButton sectionId={entry.slug} text={entry.title} />
                {/* Renders nothing unless this section has a rail card. */}
                <AddNoteButton sectionId={entry.slug} />
                <SectionLangToggle sectionId={entry.slug} />
            </div>
            <PriorityBadge priority={entry.priority} />
        </div>
    );

    return (
        <PracticeSection
            slug={entry.slug}
            header={header}
            body={
                <div className="doc-prose">
                    <LangPair
                        sectionId={entry.slug}
                        en={body("en")}
                        de={body("de")}
                    />
                </div>
            }
        />
    );
}
