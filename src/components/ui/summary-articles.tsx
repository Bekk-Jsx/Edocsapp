"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
    SeverityIcon,
    severityStyle,
    highestSeverity,
    sortSeverities,
    type Severity,
} from "@/lib/severity";

// `severities` must be derived from the page's SECTION_SEVERITIES map via the
// item's href — never hand-set here, or the card can drift from its section.
// See the convention comment in @/lib/severity.
export type SummaryArticle = {
    href: string;
    text: ReactNode;
    severities?: Severity[];
};

// Compact code token for summary lines — lighter than the doc-prose <Code>
// so a one-line takeaway stays one line.
export function Mono({ children }: { children: ReactNode }) {
    return (
        <code className="font-mono text-[0.92em] text-[var(--text)]">
            {children}
        </code>
    );
}

// Hover/focus borders can't come from an inline style, so each severity gets a
// literal class string Tailwind can see at build time.
const CARD_BASE =
    "group flex items-stretch gap-3 rounded-lg border border-[var(--border)] transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2";
const CARD_PLAIN =
    "bg-[var(--surface)] hover:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]";
const CARD_EDGE: Record<Severity, string> = {
    danger:
        "hover:border-[var(--danger)] focus-visible:border-[var(--danger)] focus-visible:ring-[var(--danger)]",
    trap: "hover:border-[var(--amber)] focus-visible:border-[var(--amber)] focus-visible:ring-[var(--amber)]",
    tip: "hover:border-[var(--mint)] focus-visible:border-[var(--mint)] focus-visible:ring-[var(--mint)]",
    next: "hover:border-[var(--next)] focus-visible:border-[var(--next)] focus-visible:ring-[var(--next)]",
};

// A section counts as "active" once its top passes ~20% down the viewport and
// until it leaves the band at ~30%. threshold 0 = fire on any crossing.
const SPY_MARGIN = "-20% 0px -70% 0px";

/**
 * Marks the article whose section is currently in view.
 * Returns the active section id, or null before the first intersection (which
 * is also the SSR / pre-hydration state — no article is highlighted then).
 */
function useScrollSpy(hrefKey: string) {
    const [active, setActive] = useState<string | null>(null);

    useEffect(() => {
        // Only observe targets that actually exist — an href can outlive a
        // renamed section, and getElementById just returns null for those.
        const targets = hrefKey
            .split("|")
            .map((href) => document.getElementById(href.replace(/^#/, "")))
            .filter((el): el is HTMLElement => el !== null)
            .sort(
                (a, b) =>
                    a.getBoundingClientRect().top - b.getBoundingClientRect().top,
            );
        if (!targets.length) return;

        const visible = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target.id);
                    else visible.delete(entry.target.id);
                }
                // Several sections can share the band; the topmost one wins.
                // When none intersect we keep the last active rather than
                // clearing, so the rail never goes blank mid-scroll.
                const topmost = targets
                    .filter((el) => visible.has(el.id))
                    .sort(
                        (a, b) =>
                            a.getBoundingClientRect().top -
                            b.getBoundingClientRect().top,
                    )[0];
                if (topmost) setActive(topmost.id);
            },
            { rootMargin: SPY_MARGIN, threshold: 0 },
        );
        targets.forEach((el) => observer.observe(el));

        // Fallback for a short final section that never reaches the band:
        // at the very bottom of the page, the last section is the active one.
        const onScroll = () => {
            const atBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 2;
            if (atBottom) setActive(targets[targets.length - 1].id);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", onScroll);
        };
    }, [hrefKey]);

    return active;
}

// Glanceable chapter takeaways. Each card is a plain anchor to its section
// heading, so the jump stays native smooth scroll (see globals.css).
//
// A card shows EVERY severity its section carries (danger, then trap, then tip)
// so the reader sees the full mix at a glance; the bar, tint and active border
// use the highest.
export default function SummaryArticles({ items }: { items: SummaryArticle[] }) {
    const hrefKey = items.map((i) => i.href).join("|");
    const active = useScrollSpy(hrefKey);
    const [clicked, setClicked] = useState<string | null>(null);
    // Optimistic on click, then the observer takes over once the scroll settles.
    const current = clicked ?? active;

    // Hand control back to the observer after the smooth scroll lands. Time-based
    // rather than "wait until active === clicked", because a short section may
    // never reach the spy band — that would strand the override permanently.
    useEffect(() => {
        if (!clicked) return;
        const timer = setTimeout(() => setClicked(null), 700);
        return () => clearTimeout(timer);
    }, [clicked]);

    return (
        <div>
            <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                summary
            </p>
            <div className="flex flex-col gap-2">
                {items.map((item) => {
                    const marks = sortSeverities(item.severities);
                    const top = highestSeverity(item.severities);
                    const mark = top ? severityStyle[top].color : "var(--accent)";
                    const isActive = current === item.href.replace(/^#/, "");

                    const style: CSSProperties = { padding: "0.9rem" };
                    if (top) style.background = severityStyle[top].bg;
                    // Border-only highlight: an inline colour beats the class,
                    // and the ring is a box-shadow so nothing reflows.
                    if (isActive) {
                        style.borderColor = mark;
                        style.boxShadow = `0 0 0 1px ${mark}`;
                    }

                    return (
                        <a
                            key={item.href}
                            href={item.href}
                            style={style}
                            aria-current={isActive ? "true" : undefined}
                            onClick={() => setClicked(item.href.replace(/^#/, ""))}
                            className={`${CARD_BASE} ${
                                top ? CARD_EDGE[top] : CARD_PLAIN
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className="w-[2px] shrink-0 rounded-full opacity-45 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                                style={{
                                    backgroundColor: mark,
                                    opacity: isActive ? 1 : undefined,
                                }}
                            />
                            <span className="min-w-0 flex-1 text-[0.85rem] leading-[1.55] text-[var(--muted)]">
                                {marks.length ? (
                                    <span className="mb-1.5 flex items-center gap-1.5">
                                        {marks.map((s) => (
                                            <SeverityIcon
                                                key={s}
                                                severity={s}
                                                className="h-[0.95rem] w-[0.95rem] shrink-0"
                                                style={{ color: severityStyle[s].color }}
                                            />
                                        ))}
                                        <span className="sr-only">
                                            {marks
                                                .map((s) => severityStyle[s].label)
                                                .join(", ")}{" "}
                                            ·{" "}
                                        </span>
                                    </span>
                                ) : null}
                                {item.text}
                            </span>
                            {/* fixed-width gutter: reserved always, so revealing it shifts nothing */}
                            <span
                                aria-hidden="true"
                                className="w-[3.1rem] shrink-0 self-end text-right font-mono text-[0.62rem] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                                style={{ color: mark }}
                            >
                                ↳ jump
                            </span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
