import type { ReactNode } from "react";

type Tone = "muted" | "mint" | "accent" | "amber";

const toneColor: Record<Tone, string> = {
    muted: "var(--muted)",
    mint: "var(--mint)",
    accent: "var(--accent)",
    amber: "var(--amber)",
};

// Titled doc block. Used for refresh notes, react-vs-next, q&a, etc.
export function DocSection({
    title,
    tone = "muted",
    children,
}: {
    title: string;
    tone?: Tone;
    children: ReactNode;
}) {
    return (
        <section className="mt-8">
            <p
                className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest"
                style={{ color: toneColor[tone] }}
            >
                {title}
            </p>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--muted)]">
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