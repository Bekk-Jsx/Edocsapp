import type { CSSProperties, ReactNode } from "react";

// ===================================================================
// SEVERITY SYSTEM — single source of truth
//
//   danger (red)    — it breaks: crash, infinite loop, memory leak, wrong data.
//   trap   (amber)  — a subtle gotcha: surprising, but recoverable.
//   tip    (mint)   — best practice / good to know.
//   next   (violet) — a React-vs-Next.js difference. NOT a risk level, which is
//                     why it sorts last and never wins `highestSeverity`.
//                     Reserved for other sections that happen to discuss a
//                     React/Next difference — the dedicated "react vs next.js"
//                     footer section stays plain and unflagged.
//
// CONVENTION
// - SECTION_SEVERITIES (one map per page, keyed by section id) lists everything
//   a section covers. It feeds the summary rail only: a card shows ALL of its
//   section's icons, sorted danger > trap > tip.
// - `sectionSeverity` flags a whole section (icon + badge on the title, any of
//   danger/trap/tip; the title text itself stays its normal tone colour).
//   Inline Callout boxes are for notes WITHIN a section. The two are
//   independent — a section can use either, both, or neither.
// - Section backgrounds are NEVER tinted by severity.
// - `sectionSeverity` is independent of the map: a section can list several
//   severities in SECTION_SEVERITIES without its whole topic being any one of
//   them. Keep the two in sync by intent, not by derivation.
// ===================================================================
export type Severity = "danger" | "trap" | "tip" | "next";

/** Priority, high -> low. Drives both `highestSeverity` and icon order.
 *  "next" is last: it is a note type, not a risk level, so it never outranks
 *  a real severity when picking the highest. */
export const SEVERITY_ORDER: Severity[] = ["danger", "trap", "tip", "next"];

/** A page's section-id -> severities map. Keys are DocSection slugs. */
export type SectionSeverities = Record<string, Severity[]>;

/** The most severe entry present, or undefined for an empty/missing list. */
export function highestSeverity(list: Severity[] = []): Severity | undefined {
    return SEVERITY_ORDER.find((s) => list.includes(s));
}

/** Deduped and ordered danger -> trap -> tip, so icon rows never vary. */
export function sortSeverities(list: Severity[] = []): Severity[] {
    return SEVERITY_ORDER.filter((s) => list.includes(s));
}

type IconProps = { className?: string; style?: CSSProperties };

const svgBase = {
    "aria-hidden": true as const,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

// Outlined ring with an "!" inside. A real <circle>, so the round is exact
// rather than a bezier approximation, and there are no corner joins to turn
// lumpy at the ~13px these actually render at.
// r 9 + stroke 2 => outer edge 22, matching the 2px margin of the other icons.
// The bar + dot span y 6.3..17.65, centred on 12. Do not alter this geometry.
function AlertCircleIcon({ className, style }: IconProps) {
    return (
        <svg {...svgBase} className={className} style={style}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.3v5.7" />
            <circle cx="12" cy="16.5" r="1.15" fill="currentColor" stroke="none" />
        </svg>
    );
}

function TriangleIcon({ className, style }: IconProps) {
    return (
        <svg {...svgBase} className={className} style={style}>
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    );
}

function BulbIcon({ className, style }: IconProps) {
    return (
        <svg {...svgBase} className={className} style={style}>
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5A5.6 5.6 0 0 0 18 8a6 6 0 0 0-12 0c0 1.2.4 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
            <path d="M9.5 18h5" />
            <path d="M10.5 21.5h3" />
        </svg>
    );
}

// Two horizontal arrows pointing opposite ways (a ⇄). Stroke-only like the
// others; ink spans x 2..22 / y 5..19, so it keeps the same ~2px margin and
// sits centred on 12.
function SwapIcon({ className, style }: IconProps) {
    return (
        <svg {...svgBase} className={className} style={style}>
            <path d="M3 9h18" />
            <path d="m18 6 3 3-3 3" />
            <path d="M21 15H3" />
            <path d="m6 12-3 3 3 3" />
        </svg>
    );
}

export const severityStyle: Record<
    Severity,
    { color: string; bg: string; label: string; Icon: (p: IconProps) => ReactNode }
> = {
    danger: {
        color: "var(--danger)",
        bg: "color-mix(in srgb, var(--danger) 10%, var(--surface))",
        label: "danger",
        Icon: AlertCircleIcon,
    },
    trap: {
        color: "var(--amber)",
        bg: "color-mix(in srgb, var(--amber) 12%, var(--surface))",
        label: "trap",
        Icon: TriangleIcon,
    },
    tip: {
        color: "var(--mint)",
        bg: "color-mix(in srgb, var(--mint) 12%, var(--surface))",
        label: "tip",
        Icon: BulbIcon,
    },
    // Not a risk level — marks a React-vs-Next.js difference.
    next: {
        color: "var(--next)",
        bg: "color-mix(in srgb, var(--next) 12%, var(--surface))",
        label: "react ⇄ next",
        Icon: SwapIcon,
    },
};

// The one glyph entry point. Inherits `currentColor` unless `style` sets it, so
// a callout label and a rail card show the same mark.
export function SeverityIcon({
    severity,
    className = "h-[1.05em] w-[1.05em]",
    style,
}: { severity: Severity } & IconProps) {
    const { Icon } = severityStyle[severity];
    return <Icon className={className} style={style} />;
}
