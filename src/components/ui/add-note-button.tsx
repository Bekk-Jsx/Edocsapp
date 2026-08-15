"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

// "Add a note about THIS section" — shown only on sections backed by a summary
// rail card, which is what marks a section as a documented unit rather than a
// footer aside or a part divider.
//
// The gate is the rail itself: does a card exist with href="#<sectionId>". That
// reads the same truth each page.tsx encodes (its AUDIT RULE: one article per
// non-footer DocSection) without every content file opting in, and it stays
// right on pages that have no rail at all, where nothing here renders.
//
// The DOM is the source, so the check is client-only: useSyncExternalStore with
// a `false` server snapshot renders nothing on the server — existing pages keep
// byte-identical SSR output — and settles once hydrated. The subscribe is a
// no-op because a page's rail is fixed for its lifetime.
const subscribe = () => () => {};

function useIsInRail(sectionId: string) {
    return useSyncExternalStore(
        subscribe,
        () =>
            document.querySelector(`.page-alerts a[href="#${sectionId}"]`) !==
            null,
        () => false,
    );
}

export default function AddNoteButton({ sectionId }: { sectionId: string }) {
    const pathname = usePathname();
    const inRail = useIsInRail(sectionId);

    // ["hooks-refresh", "use-state"] — the project, then the page's own slug.
    // A project landing page has no second segment, and no doc sections either.
    const segments = pathname.split("/").filter(Boolean);
    if (!inRail || segments.length < 2) return null;

    const project = segments[0];
    const hookSlug = segments[segments.length - 1];
    const link = `${pathname}#${sectionId}`;
    const href =
        `/${project}/notes?add=1` +
        `&hookSlug=${encodeURIComponent(hookSlug)}` +
        `&link=${encodeURIComponent(link)}`;

    return (
        <Link
            href={href}
            aria-label="add note here"
            // Muted until hovered, like the other secondary controls here; the
            // tooltip is the same CSS-only sibling span the FAQ button uses.
            className="group relative inline-flex h-[1.35em] w-[1.35em] shrink-0 items-center justify-center rounded text-[var(--muted)] transition-colors duration-150 hover:text-[var(--accent)] focus-visible:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        >
            {/* notepad: page + ruled lines */}
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-full w-full"
            >
                <path d="M6 3h12a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 6 3Z" />
                <path d="M8.5 8h7" />
                <path d="M8.5 12h7" />
                <path d="M8.5 16h3.5" />
            </svg>

            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[calc(100%+0.35rem)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[0.65rem] normal-case tracking-normal text-[var(--text)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
                add note here
            </span>
        </Link>
    );
}
