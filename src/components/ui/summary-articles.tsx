import type { ReactNode } from "react";

export type SummaryArticle = { href: string; text: ReactNode };

// Compact code token for summary lines — lighter than the doc-prose <Code>
// so a one-line takeaway stays one line.
export function Mono({ children }: { children: ReactNode }) {
    return (
        <code className="font-mono text-[0.92em] text-[var(--text)]">
            {children}
        </code>
    );
}

// Glanceable chapter takeaways. Each card is a plain anchor to its section
// heading, so the jump is native smooth scroll (see globals.css) and the
// component stays server-rendered.
export default function SummaryArticles({ items }: { items: SummaryArticle[] }) {
    return (
        <div>
            <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                summary
            </p>
            <div className="flex flex-col gap-2">
                {items.map((item) => (
                    <a
                        key={item.href}
                        href={item.href}
                        style={{ padding: "0.9rem" }}
                        className="group flex items-stretch gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors duration-150 hover:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <span
                            aria-hidden="true"
                            className="w-[2px] shrink-0 rounded-full bg-[var(--accent)] opacity-45 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                        <span className="min-w-0 flex-1 text-[0.85rem] leading-[1.55] text-[var(--muted)]">
                            {item.text}
                        </span>
                        {/* fixed-width gutter: reserved always, so revealing it shifts nothing */}
                        <span
                            aria-hidden="true"
                            className="w-[3.1rem] shrink-0 self-end text-right font-mono text-[0.62rem] text-[var(--accent)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                        >
                            ↳ jump
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
}
