import { PROJECT_STATUS, type ProjectStatus } from "@/lib/projects";

// The one renderer for a project's status. Label and colour come from
// PROJECT_STATUS, and the tint / border / text are all derived from that single
// colour — so adding a status is one registry entry and nothing here changes.
//
// Classes and style are deliberately IDENTICAL to the severity badge in
// doc-section.tsx: same pill metrics, same 12% tint, same 40% border mix. A
// status pill and a severity pill are the same object at two sizes of scope, so
// they must not drift — change one and change the other.
//
// Inline styles rather than classes: the tint is a color-mix() over a CSS var
// picked at runtime, which Tailwind cannot express as a static utility.
export default function StatusBadge({ status }: { status: ProjectStatus }) {
    const { label, color } = PROJECT_STATUS[status];

    return (
        <span
            className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest"
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
