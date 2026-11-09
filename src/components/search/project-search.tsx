"use client";

import { Suspense, useState, type ReactNode } from "react";
import { projectBySlug } from "@/lib/projects";
import { hasIndex } from "@/search/load";
import SearchController from "./search-controller";

// Project search for a landing page. Wraps the chapter grid: the box sits right
// above it, and while results are on screen the chapters are hidden (kept in
// the DOM, so clearing the search brings them back without a re-render).
//
// The controller reads ?q= with useSearchParams, so it sits in its own Suspense
// boundary — the chapters passed as children stay in the prerendered HTML.
export default function ProjectSearch({
    project,
    children,
}: {
    project: string;
    children: ReactNode;
}) {
    const [active, setActive] = useState(false);
    if (!hasIndex(project)) return <>{children}</>;

    const name = projectBySlug(project)?.title ?? project;
    const placeholder = `Search ${name}…`;

    return (
        <>
            <div className="mt-8">
                <Suspense fallback={<BoxFallback placeholder={placeholder} />}>
                    <SearchController
                        project={project}
                        placeholder={placeholder}
                        onActiveChange={setActive}
                    />
                </Suspense>
            </div>
            <div hidden={active}>{children}</div>
        </>
    );
}

/** Same footprint as the real box, so nothing shifts when it mounts. */
export function BoxFallback({ placeholder }: { placeholder: string }) {
    return (
        <div className="flex items-center gap-2" aria-hidden="true">
            <div className="flex h-[38px] flex-1 items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--muted)]">
                {placeholder}
            </div>
            <div className="h-[38px] w-[72px] rounded-md border border-[var(--border)] bg-[var(--surface)]" />
        </div>
    );
}
