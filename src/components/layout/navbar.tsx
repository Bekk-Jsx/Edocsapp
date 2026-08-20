"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** One entry. `id` is a route slug in "route" mode, an element id in "anchor" mode. */
export type NavItem = { id: string; label: string };

/** One labelled block of entries — a chapter, a category, whatever the caller groups by. */
export type NavGroup = { heading: string; items: NavItem[] };

/** A row nested one level under a NavItem. Always a route link. */
export type NavSubItem = { label: string; href: string };

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
    /**
     * Optional: collapsible rows nested under an item, keyed by that item's id.
     * Omit it and not a single attribute of the render changes.
     */
    subItems?: Record<string, NavSubItem[]>;
    /**
     * Optional: project-level pages (about, notes…) listed ABOVE the doc groups
     * and styled apart from them, because they are a different kind of
     * navigation. Route links like the doc rows, so `basePath` applies. Omit it
     * — as every project but hooks-refresh does — and not a single attribute of
     * the render changes.
     */
    projectLinks?: NavItem[];
}

// Active state for anchor mode: the section whose top has passed ~20% down the
// viewport. Always called, never conditionally — `enabled` gates the work, so
// hook order stays stable across route and anchor renders.
//
// Returns a `claim` next to it: the observer alone cannot report a click, because
// the band it watches is only 20%–30% down the viewport. Jump to a section the
// page can't scroll that far up — the last one, or any section on a page that
// doesn't scroll at all — and no threshold is ever crossed, so the highlight
// simply never moves. The click has to say so itself.
function useAnchorSpy(enabled: boolean, idKey: string) {
    const [active, setActive] = useState<string | null>(null);

    // A click decides the highlight outright. The smooth scroll that follows may
    // sweep other sections through the band on its way, so observer updates are
    // ignored briefly afterwards — otherwise a section merely passed through
    // would steal the highlight and keep it.
    const claimedUntil = useRef(0);

    const claim = useCallback((id: string) => {
        claimedUntil.current = Date.now() + 1200;
        setActive(id);
    }, []);

    useEffect(() => {
        if (!enabled) return;
        // Skip ids with no element — an item can outlive the section it targets.
        const targets = idKey
            .split("|")
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);
        if (!targets.length) return;

        const visible = new Set<string>();

        // The band sits 20%–30% down the viewport, so the LAST section of a short
        // page can never enter it — the page runs out of scroll first, and the
        // highlight would stay stuck on the section above while the reader looks
        // at the final one. At the bottom of the page, that final section is what
        // is in view, so it wins.
        //
        // Gated on the page actually scrolling: when everything fits on screen
        // we'd otherwise sit permanently at "bottom" and pin the last row.
        const atBottom = () => {
            const doc = document.documentElement;
            return (
                doc.scrollHeight - window.innerHeight > 8 &&
                window.innerHeight + window.scrollY >= doc.scrollHeight - 2
            );
        };

        const resolve = () => {
            // Still inside a click's claim: the reader chose, not the scroll.
            if (Date.now() < claimedUntil.current) return;
            if (atBottom()) {
                setActive(targets[targets.length - 1].id);
                return;
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
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target.id);
                    else visible.delete(entry.target.id);
                }
                resolve();
            },
            { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
        );
        targets.forEach((el) => observer.observe(el));
        // Arriving at the bottom needn't cross an observer threshold, so the
        // fallback above needs its own signal.
        window.addEventListener("scroll", resolve, { passive: true });

        // Scrolling under their own steam means the reader has moved on from
        // whatever they clicked — hand the highlight straight back to the spy
        // instead of waiting out the claim.
        const release = () => {
            claimedUntil.current = 0;
        };
        const RELEASE_EVENTS = ["wheel", "touchstart", "keydown"] as const;
        RELEASE_EVENTS.forEach((type) =>
            window.addEventListener(type, release, { passive: true }),
        );

        return () => {
            observer.disconnect();
            window.removeEventListener("scroll", resolve);
            RELEASE_EVENTS.forEach((type) =>
                window.removeEventListener(type, release),
            );
        };
    }, [enabled, idKey]);

    return [active, claim] as const;
}

// Trailing slash on one side only would break a raw ===, so every route
// comparison goes through this first.
const norm = (path: string) => path.replace(/\/$/, "");

const ITEM_BASE =
    "block rounded-md px-2 py-1.5 font-mono text-sm transition-colors";
const ITEM_ACTIVE = "bg-[var(--surface-2)] text-[var(--accent)]";
const ITEM_IDLE = "text-[var(--text)] hover:bg-[var(--surface-2)]";

// Project rows are not doc rows, so they don't look like them: proportional
// rather than mono, a notch smaller, and muted until hovered. Same metrics and
// same active treatment as ITEM_* though — a different kind of link, not a
// different design language.
const PROJECT_ITEM_BASE =
    "block rounded-md px-2 py-1.5 text-[0.82rem] transition-colors";
const PROJECT_ITEM_IDLE =
    "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]";

// HOME NAV ONLY, by construction: this is the rail down the left of an item's
// sub-rows, and sub-rows exist only for callers that pass `subItems` — which is
// the home nav and nothing else. Every project nav renders exactly as before.
//
// 2px and rounded, like the accent bars in ui/doc-section and the summary rail,
// rather than a 1px border: same visual language as every other grouping mark in
// the app.
//
// The open/close animation comes from `inset-y-0` alone: the rail's height IS the
// height of the collapsing grid item, which the 0fr -> 1fr transition already
// interpolates, so the line retracts upwards with the rows and needs no animation
// of its own. Deliberately NOT a scale-y-0/100 pair — `scale-*` sets the `scale`
// property in Tailwind v4, which a `transform` transition does not cover, so that
// version snapped instead of animating. Only the colour transitions here.
const SUB_RAIL =
    "pointer-events-none absolute inset-y-0 left-2 w-[2px] rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none";

// Expand/collapse affordance for an item that carries sub-rows. Sits absolutely
// at the right edge of the row so the row's own <a>/<Link> keeps its exact
// classes — including the full-width hover fill — and stays the element it was.
//
// No icon package is installed; the codebase draws its own SVGs (see the back
// chevron above and ui/faq-button), so this matches their attributes.
function Chevron({
    open,
    label,
    onToggle,
}: {
    open: boolean;
    label: string;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${label}`}
            onClick={(e) => {
                // The row underneath navigates on click; the chevron must not.
                e.stopPropagation();
                onToggle();
            }}
            className="absolute right-1 top-[0.3rem] rounded p-0.5 text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:text-[var(--text)] focus-visible:outline-none"
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                // Collapsed points right, expanded points down — 90deg over the
                // same 200ms as the list it controls. Only the easing is dropped
                // under reduced motion; the angle still conveys state.
                className={`h-[0.9em] w-[0.9em] shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-0" : "-rotate-90"}`}
            >
                <path d="M6 9l6 6 6-6" />
            </svg>
        </button>
    );
}

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
    subItems,
    projectLinks,
}: NavbarProps) {
    const pathname = usePathname();
    const isAnchor = mode === "anchor";
    const [activeAnchor, claimAnchor] = useAnchorSpy(
        isAnchor,
        groups.flatMap((g) => g.items.map((i) => i.id)).join("|"),
    );

    // Only ids the reader has actively closed land here, so everything starts
    // expanded without seeding state from props. Local and per-mount by design:
    // no persistence, no URL param.
    const [closed, setClosed] = useState<Record<string, boolean>>({});
    const toggle = (id: string) =>
        setClosed((prev) => ({ ...prev, [id]: !prev[id] }));

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

            {/* Project pages, above the docs and fenced off by a hairline so the
                two lists never read as one. Renders nothing at all when the
                caller passes no links, which is every project but hooks-refresh. */}
            {projectLinks?.length ? (
                <nav className="mb-6 border-b border-[var(--border)] pb-5">
                    <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                        Project
                    </p>
                    <ul className="space-y-0.5">
                        {projectLinks.map((item) => {
                            // Same rule as the doc rows: exact route match.
                            const href = `${basePath}/${item.id}`;
                            const active = norm(pathname) === norm(href);
                            return (
                                <li key={item.id}>
                                    <Link
                                        href={href}
                                        className={`${PROJECT_ITEM_BASE} ${active ? ITEM_ACTIVE : PROJECT_ITEM_IDLE}`}
                                        aria-current={active ? "page" : undefined}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            ) : null}

            <nav className="space-y-6">
                {/* Nothing to list yet — a project can be scaffolded before its
                    pages exist (see redis-refresh). Stand in for the list rather
                    than leaving an empty box under the brand. */}
                {groups.every((g) => g.items.length === 0) ? (
                    <p className={`${ITEM_BASE} text-[var(--muted)]`}>Coming soon</p>
                ) : null}

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
                                // Anchor rows follow the scroll spy (and their own
                                // click); route rows match the URL exactly.
                                const active = isAnchor
                                    ? activeAnchor === item.id
                                    : norm(pathname) === norm(href);
                                const className = `${ITEM_BASE} ${active ? ITEM_ACTIVE : ITEM_IDLE}`;

                                // Empty unless the caller opted in for this item, so
                                // `relative` and everything below it stay off the markup
                                // entirely for every project nav.
                                const subs = subItems?.[item.id] ?? [];
                                const open = subs.length > 0 && !closed[item.id];

                                return (
                                    <li
                                        key={item.id}
                                        className={subs.length ? "relative" : undefined}
                                    >
                                        {isAnchor ? (
                                            // plain <a>: native smooth scroll, no router
                                            // involvement, no prefetch of a non-route.
                                            //
                                            // The click sets the highlight itself; the
                                            // observer can only confirm it once the scroll
                                            // lands, and often it never can.
                                            <a
                                                href={href}
                                                onClick={() => claimAnchor(item.id)}
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

                                        {subs.length ? (
                                            <Chevron
                                                open={open}
                                                label={item.label}
                                                onToggle={() => toggle(item.id)}
                                            />
                                        ) : null}

                                        {subs.length ? (
                                            // Stays mounted so the collapse can animate —
                                            // unmounting would leave nothing to transition.
                                            // A single grid row going 0fr -> 1fr sizes itself
                                            // from the content, so no measuring in JS; the
                                            // clipping comes from overflow-hidden and the
                                            // inner min-h-0.
                                            //
                                            // Closed rows are real links, so `inert` takes
                                            // them out of tab order and the a11y tree while
                                            // they're hidden.
                                            <div
                                                inert={!open}
                                                className={`mt-0.5 grid overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none ${
                                                    open
                                                        ? "grid-rows-[1fr] opacity-100"
                                                        : "grid-rows-[0fr] opacity-0"
                                                }`}
                                            >
                                                {/* One level only — these rows carry no children
                                                    of their own. The gap above lives on the
                                                    outer wrapper: as a margin on the grid ITEM it
                                                    would feed the track's auto-minimum and
                                                    leave a 2px sliver showing when closed. That
                                                    grid item is the div below — hence min-h-0 on
                                                    it rather than on the <ul>. */}
                                                <div className="relative min-h-0 pl-4">
                                                    {/* One line down the left of a type's projects, so a
                                                        glance says which rows hang off the row above.
                                                        It takes the accent while that type is the active
                                                        section, which is the other half of the grouping. */}
                                                    <span
                                                        aria-hidden="true"
                                                        className={`${SUB_RAIL} ${
                                                            active
                                                                ? "bg-[var(--accent)]"
                                                                : "bg-[var(--border)]"
                                                        }`}
                                                    />
                                                    <ul className="space-y-0.5">
                                                        {subs.map((sub) => {
                                                            const here = norm(pathname);
                                                            const target = norm(sub.href);
                                                            // Current on the project's own page AND
                                                            // on any page inside it, so the row
                                                            // stays lit on /hooks-refresh/use-state.
                                                            const subActive =
                                                                here === target ||
                                                                here.startsWith(`${target}/`);
                                                            return (
                                                                <li key={sub.href}>
                                                                    <Link
                                                                        href={sub.href}
                                                                        className={`${ITEM_BASE} ${subActive ? ITEM_ACTIVE : ITEM_IDLE}`}
                                                                        aria-current={
                                                                            subActive
                                                                                ? "page"
                                                                                : undefined
                                                                        }
                                                                    >
                                                                        {sub.label}
                                                                    </Link>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>
                                        ) : null}
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
