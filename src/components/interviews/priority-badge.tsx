import { BADGE_CLASS } from "@/components/ui/badge-class";
import { severityStyle, type Severity } from "@/lib/severity";
import type { Priority } from "@/server/schema";

// A question's priority, as a pill in the same shape as the status and
// severity badges (BADGE_CLASS) — a priority pill and a severity pill are the
// same object at two scopes.
//
// The colours are borrowed from the severity scale rather than invented, so
// the page has one palette: high reads as "the ones that get asked"
// (danger red), medium as "worth knowing" (trap amber), low as a quiet aside
// (note slate).
const AS_SEVERITY: Record<Priority, Severity> = {
    high: "danger",
    medium: "trap",
    low: "note",
};

const LABEL: Record<Priority, string> = {
    high: "high",
    medium: "medium",
    low: "low",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
    const { color } = severityStyle[AS_SEVERITY[priority]];
    return (
        <span
            className={BADGE_CLASS}
            // Tint and border are a color-mix over a runtime CSS var, which
            // Tailwind cannot express as a static utility.
            style={{
                color,
                background: `color-mix(in srgb, ${color} 12%, var(--surface))`,
                borderColor: `color-mix(in srgb, ${color} 40%, var(--surface))`,
            }}
        >
            {LABEL[priority]}
        </span>
    );
}
