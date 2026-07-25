import type { ReactNode } from "react";

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
export function DocSection({
    title,
    tone = "accent",
    children,
}: {
    title: string;
    tone?: Tone;
    children: ReactNode;
}) {
    const color = toneColor[tone];
    return (
        <section id={slug(title)} className="doc-section">
            <div className="mb-3 flex items-center gap-2">
                <span
                    aria-hidden="true"
                    className="inline-block h-[14px] w-[2px] shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <p
                    className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest"
                    style={{ color }}
                >
                    {title}
                </p>
            </div>
            <div className="doc-prose space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                {children}
            </div>
        </section>
    );
}

// Inline code token for doc prose.
export function Code({ children }: { children: ReactNode }) {
    return (
        <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[0.8em] text-[var(--text)]">
            {children}
        </code>
    );
}

// Emphasis lead-in for a bullet-like paragraph ("Functional updater. ...").
export function Term({ children }: { children: ReactNode }) {
    return <strong className="text-[var(--text)]">{children}</strong>;
}

// Boxed callout — amber for traps, accent for notes.
export function Callout({
    tone = "amber",
    label,
    children,
}: {
    tone?: "amber" | "accent";
    label: string;
    children: ReactNode;
}) {
    const color = tone === "amber" ? "var(--amber)" : "var(--accent)";
    return (
        <div
            className="rounded-lg border bg-[var(--surface)] p-4"
            style={{ borderColor: color }}
        >
            <p
                className="mb-1 font-mono text-[0.6rem] uppercase tracking-widest"
                style={{ color }}
            >
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