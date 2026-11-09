"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { hasIndex } from "@/search/load";
import { BoxFallback } from "./project-search";
import SearchController, { arrive } from "./search-controller";

// Page search for every doc page, mounted by PageShell (only when the page has
// a summary rail — PlanPage placeholders and project pages have none).
//
// Every doc page renders <article><header>…</header>…</article>, but that
// markup lives in each page, not here. So the box is portaled into a slot
// inserted right after the article's header; while results are on screen,
// everything else in the article (lead, parts, sections, demo) is hidden by the
// [data-page-search="on"] rule in globals.css. The rail is outside this wrapper
// and stays.
export default function PageSearch({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const rootRef = useRef<HTMLDivElement>(null);
    const [slot, setSlot] = useState<HTMLElement | null>(null);
    const [active, setActive] = useState(false);

    // "/vue/writing-composables" -> project "vue", page "writing-composables"
    const [project, pageSlug] = pathname.split("/").filter(Boolean);
    const enabled = Boolean(project && pageSlug && hasIndex(project));

    useEffect(() => {
        const root = rootRef.current;
        if (!enabled || !root) return;
        const el = document.createElement("div");
        el.className = "page-search-slot";
        const header = root.querySelector("article > header");
        if (header) header.after(el);
        else root.prepend(el);
        setSlot(el);
        return () => {
            el.remove();
            setSlot(null);
        };
    }, [enabled, pathname]);

    // Arrival from another page (project search, a note): the router already
    // scrolled to the hash; flash the section it landed on.
    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (!id) return;
        const t = window.setTimeout(() => arrive(id, false), 0);
        return () => window.clearTimeout(t);
    }, [pathname]);

    const placeholder = "Search this page…";

    return (
        <div ref={rootRef} data-page-search={active ? "on" : undefined}>
            {children}
            {slot && project && pageSlug
                ? createPortal(
                      <Suspense fallback={<BoxFallback placeholder={placeholder} />}>
                          <SearchController
                              project={project}
                              pageSlug={pageSlug}
                              placeholder={placeholder}
                              onActiveChange={setActive}
                          />
                      </Suspense>,
                      slot,
                  )
                : null}
        </div>
    );
}
