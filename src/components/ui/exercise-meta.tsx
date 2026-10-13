import type { CSSProperties, ReactNode } from "react";
import { BADGE_CLASS } from "./badge-class";

// The one-line header of an exercise: difficulty pill, kind, and the page it
// practises. Generic — any exercises page renders it the same way.
//
// The pill is the shared BADGE_CLASS box, tinted exactly as StatusBadge tints
// it (text colour, 12% background mix, 40% border mix), so a difficulty reads
// as the same object as a project status or a section severity.

export type Difficulty = "easy" | "medium" | "hard";
export type Kind = "predict" | "fix" | "write";

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
    easy: "var(--mint)",
    medium: "var(--amber)",
    hard: "var(--danger)",
};

// Stroke icons in the codebase's style (see @/lib/severity): viewBox 24,
// currentColor, width 2, round caps and joins.
const svgBase = {
    "aria-hidden": true as const,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[1.2em] w-[1.2em] shrink-0",
};

const KIND_ICON: Record<Kind, ReactNode> = {
    // an eye — read the code, say what the compiler will do
    predict: (
        <svg {...svgBase}>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    // a wrench — repair broken code
    fix: (
        <svg {...svgBase}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
        </svg>
    ),
    // a pencil — write it from a description
    write: (
        <svg {...svgBase}>
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    ),
};

const MUTED_MONO =
    "inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]";

export default function ExerciseMeta({
    difficulty,
    kind,
    source,
}: {
    difficulty: Difficulty;
    kind: Kind;
    source: string;
}) {
    const color = DIFFICULTY_COLOR[difficulty];
    const pill: CSSProperties = {
        color,
        background: `color-mix(in srgb, ${color} 12%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${color} 40%, var(--surface))`,
    };

    return (
        <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={BADGE_CLASS} style={pill}>
                {difficulty}
            </span>
            <span className={MUTED_MONO}>
                {KIND_ICON[kind]}
                {kind}
            </span>
            <span className={MUTED_MONO}>· {source}</span>
        </div>
    );
}
