import { BADGE_CLASS } from "@/components/ui/badge-class";
import type { QuestionEntry } from "@/server/interviews";
import { Text, type Lang } from "./inline";
import PriorityBadge from "./priority-badge";

// A question that exists but has no answer yet: the title, its priority, and
// a "coming soon" pill. Deliberately quiet — muted surface, no note button, no
// translate toggle, no body — so a page of them reads as a plan rather than as
// broken content.
//
// It still carries the section id, so a rail card scrolls to it and a link to
// #<slug> lands on it.
export default function PlannedCard({
    entry,
    lang,
}: {
    entry: QuestionEntry;
    lang: Lang;
}) {
    return (
        <div
            id={entry.slug}
            className="doc-section flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 opacity-70"
        >
            <PriorityBadge priority={entry.priority} />
            <h3 className="min-w-0 flex-1 text-[0.95rem] font-medium text-[var(--muted)]">
                <Text text={entry.title} lang={lang} />
            </h3>
            <span
                className={BADGE_CLASS}
                style={{
                    color: "var(--muted)",
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                }}
            >
                coming soon
            </span>
        </div>
    );
}
