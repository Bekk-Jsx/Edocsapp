import { PROJECT_STATUS, type ProjectStatus } from "@/lib/projects";
import { BADGE_CLASS } from "./badge-class";

// The one renderer for a project's status. Label and colour come from
// PROJECT_STATUS, and the tint / border / text are all derived from that single
// colour — so adding a status is one registry entry and nothing here changes.
//
// The box comes from BADGE_CLASS, shared with the severity badge in
// doc-section.tsx: a status pill and a severity pill are the same object at two
// scopes, so they read one string rather than two copies that can drift.
//
// Inline styles rather than classes: the tint is a color-mix() over a CSS var
// picked at runtime, which Tailwind cannot express as a static utility.
export default function StatusBadge({ status }: { status: ProjectStatus }) {
    const { label, color } = PROJECT_STATUS[status];

    return (
        <span
            className={BADGE_CLASS}
            style={{
                color,
                background: `color-mix(in srgb, ${color} 12%, var(--surface))`,
                borderColor: `color-mix(in srgb, ${color} 40%, var(--surface))`,
            }}
        >
            {label}
        </span>
    );
}
