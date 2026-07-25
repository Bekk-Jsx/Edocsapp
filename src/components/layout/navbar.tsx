"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** One entry. `id` is a route slug in "route" mode, an element id in "anchor" mode. */
export type NavItem = { id: string; label: string };

/** One labelled block of entries — a chapter, a category, whatever the caller groups by. */
export type NavGroup = { heading: string; items: NavItem[] };

export interface NavbarProps {
    groups: NavGroup[];
    /** route -> href `${basePath}/${id}` ; anchor -> href `#${id}` (in-page) */
    mode: "route" | "anchor";
    /** Used in "route" mode; ignored in "anchor" mode. */
    basePath?: string;
    homeHref: string;
    brand: { eyebrow: string; sub: string };
    /**
     * Escape hatch out of the current section, pinned above the brand. Omit it
     * (as the home nav does) and nothing renders there.
     */
    back?: { href: string; label: string };
}

// Active state for anchor mode: the section whose top has passed ~20% down the
// viewport. Always called, never conditionally — `enabled` gates the work, so
// hook order stays stable across route and anchor renders.
function useAnchorSpy(enabled: boolean, idKey: string) {
    const [active, setActive] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) return;
        // Skip ids with no element — an item can outlive the section it targets.
        const targets = idKey
            .split("|")
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);
        if (!targets.length) return;

        const visible = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target.id);
                    else visible.delete(entry.target.id);
                }
                // Topmost wins when several share the band; keep the last active
                // when none do, so the nav never goes blank mid-scroll.
                const topmost = targets
                    .filter((el) => visible.has(el.id))
                    .sort(
                        (a, b) =>
                            a.getBoundingClientRect().top -
                            b.getBoundingClientRect().top,
                    )[0];
                if (topmost) setActive(topmost.id);
            },
            { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
        );
        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [enabled, idKey]);

    return active;
}

const ITEM_BASE =
    "block rounded-md px-2 py-1.5 font-mono text-sm transition-colors";
const ITEM_ACTIVE = "bg-[var(--surface-2)] text-[var(--accent)]";
const ITEM_IDLE = "text-[var(--text)] hover:bg-[var(--surface-2)]";

// Shared, data-driven sidebar. It owns no project data — every caller supplies
// its own groups, so the same component fronts the hooks nav (route links) and
// the home type-nav (in-page anchors).
//
// Client component: usePathname and the anchor observer both need the client.
export default function Navbar({
    groups,
    mode,
    basePath = "",
    homeHref,
    brand,
    back,
}: NavbarProps) {
    const pathname = usePathname();
    const isAnchor = mode === "anchor";
    const activeAnchor = useAnchorSpy(
        isAnchor,
        groups.flatMap((g) => g.items.map((i) => i.id)).join("|"),
    );

    return (
        <aside className="nav-scroll sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6">
            {back ? (
                // Escape hatch, separated from the brand by a hairline so it
                // reads as "leave this section" rather than part of the title.
                <div className="mb-5 border-b border-[var(--border)] pb-4">
                    <Link
                        href={back.href}
                        className="group inline-flex items-center gap-1.5 font-mono text-[0.8rem] text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:text-[var(--text)] focus-visible:outline-none"
                    >
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-[0.9em] w-[0.9em] shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 group-focus-visible:-translate-x-0.5 motion-reduce:transform-none"
                        >
                            <path d="M15 6 9 12l6 6" />
                        </svg>
                        {back.label}
                    </Link>
                </div>
            ) : null}

            <Link href={homeHref} className="mb-8 block">
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                    {brand.eyebrow}
                </span>
                <span className="block text-sm text-[var(--muted)]">{brand.sub}</span>
            </Link>

            <nav className="space-y-6">
                {groups.map((group) => (
                    <div key={group.heading}>
                        <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                            {group.heading}
                        </p>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const href = isAnchor
                                    ? `#${item.id}`
                                    : `${basePath}/${item.id}`;
                                const active = isAnchor
                                    ? activeAnchor === item.id
                                    : pathname === href;
                                const className = `${ITEM_BASE} ${active ? ITEM_ACTIVE : ITEM_IDLE}`;

                                return (
                                    <li key={item.id}>
                                        {isAnchor ? (
                                            // plain <a>: native smooth scroll, no
                                            // router involvement, no prefetch of a
                                            // non-route.
                                            <a
                                                href={href}
                                                className={className}
                                                aria-current={active ? "true" : undefined}
                                            >
                                                {item.label}
                                            </a>
                                        ) : (
                                            <Link
                                                href={href}
                                                className={className}
                                                aria-current={active ? "page" : undefined}
                                            >
                                                {item.label}
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
