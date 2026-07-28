import type { ReactNode } from "react";
import { SeverityIcon, severityStyle, type Severity } from "@/lib/severity";

type Tone = "muted" | "mint" | "accent" | "amber";

const toneColor: Record<Tone, string> = {
    muted: "var(--muted)",
    mint: "var(--mint)",
    accent: "var(--accent)",
    amber: "var(--amber)",
};

// Stable anchor id from a section title:
//   "say it right — english" -> "say-it-right-english"
//   "render & persistence"   -> "render-persistence"
export function slug(title: string) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// Titled doc block. Used for refresh notes, react-vs-next, q&a, etc.
// The tone color drives the heading + accent bar so titles read as the anchor
// when scanning; sibling sections are separated by a hairline (see globals.css).
// The id makes every section a link target (summary cards, the FAQ button).
//
// `sectionSeverity` flags a whole section (icon + badge on the title, any of the
// five severities). Inline callouts are for notes within a section. Article
// severities come from the shared SECTION_SEVERITIES map — keep them in sync.
//
// Only the icon and badge take the severity colour; the title TEXT keeps its
// normal tone. Section backgrounds are never tinted by severity. Flagging a
// whole section and carrying inline callouts are independent — a section can do
// either, both, or neither.
export function DocSection({
    title,
    tone = "accent",
    sectionSeverity,
    children,
}: {
    title: string;
    tone?: Tone;
    sectionSeverity?: Severity;
    children: ReactNode;
}) {
    const color = toneColor[tone];
    const flag = sectionSeverity ? severityStyle[sectionSeverity] : null;
    return (
        <section id={slug(title)} className="doc-section">
            <div className="mb-3 flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        aria-hidden="true"
                        className="inline-block h-[14px] w-[2px] shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    {flag && sectionSeverity ? (
                        <SeverityIcon
                            severity={sectionSeverity}
                            className="h-[1.05em] w-[1.05em] shrink-0 self-center"
                            style={{ color: flag.color }}
                        />
                    ) : null}
                    <p
                        className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest"
                        style={{ color }}
                    >
                        {title}
                    </p>
                </div>
                {flag ? (
                    <span
                        className="shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest"
                        style={{
                            color: flag.color,
                            background: `color-mix(in srgb, ${flag.color} 12%, var(--surface))`,
                            borderColor: `color-mix(in srgb, ${flag.color} 40%, var(--surface))`,
                        }}
                    >
                        {flag.label}
                    </span>
                ) : null}
            </div>
            <div className="doc-prose space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                {children}
            </div>
        </section>
    );
}

// Inline code token for doc prose. Layout/typography stay Tailwind utilities;
// only the COLORS live in the .code-token class (globals.css) so a Callout can
// override them by descendant rule — `.callout-danger .code-token` etc. A
// utility class would sit in Tailwind's @layer and be harder to beat cleanly.
// Outside a callout the token keeps its default --surface-2 look.
export function Code({ children }: { children: ReactNode }) {
    return (
        <code className="code-token rounded px-1.5 py-0.5 font-mono text-[0.8em]">
            {children}
        </code>
    );
}

// Emphasis lead-in for a bullet-like paragraph ("Functional updater. ...").
export function Term({ children }: { children: ReactNode }) {
    return <strong className="text-[var(--text)]">{children}</strong>;
}

// Boxed callout, driven by the same severity scale as DocSection — any of
// danger/trap/next/tip/note, each supplying its own colour, label and icon.
// `tone` is the legacy prop kept for the ~20 hook pages still passing it:
// amber -> trap, accent -> tip. Prefer `severity` in new code.
export function Callout({
    severity,
    tone,
    label,
    children,
}: {
    severity?: Severity;
    tone?: "amber" | "accent";
    label: string;
    children: ReactNode;
}) {
    const level: Severity = severity ?? (tone === "accent" ? "tip" : "trap");
    const { color, bg } = severityStyle[level];
    return (
        // `callout-<level>` is the hook globals.css uses to retint nested code:
        // inline tokens via `.callout-* .code-token`, and block-level <pre> /
        // Shiki frames via `.callout-* pre`. Nothing outside a callout is affected.
        <div
            className={`callout callout-${level} rounded-lg border p-4`}
            style={{ borderColor: color, background: bg }}
        >
            <p
                className="mb-1 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest"
                style={{ color }}
            >
                <SeverityIcon
                    severity={level}
                    className="h-[1.4em] w-[1.4em] shrink-0"
                />
                {label}
            </p>
            <div className="text-sm leading-relaxed text-[var(--muted)]">
                {children}
            </div>
        </div>
    );
}

// Q&A pair — keeps english practice visually consistent everywhere.
export function QA({ q, a }: { q: ReactNode; a: ReactNode }) {
    return (
        <div>
            <p className="text-[var(--text)]">Q: {q}</p>
            <p className="mt-1">A: {a}</p>
        </div>
    );
}