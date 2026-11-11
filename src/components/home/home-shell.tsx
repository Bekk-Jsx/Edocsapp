"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar, { type NavSubItem } from "@/components/layout/navbar";
import InterviewsContent from "@/components/home/interviews-content";
import ProjectsContent from "@/components/home/projects-content";
import type { InterviewCategory } from "@/lib/interviews";
import { projectsByType } from "@/lib/projects";
import { projectHref } from "@/lib/routes";

// ===================================================================
// HOME SHELL — the sidebar + main area of `/`, and the only place that knows
// the two are linked.
//
// The sidebar has two sections, each a NavGroup whose items are the
// sub-categories (a project type, an interview sub-category) with the real
// links nested underneath:
//
//   Projects    -> Web Development -> Hooks, refreshed. …
//   Interviews  -> Preparation     -> Full-Stack Questions
//
// THE URL IS THE SINGLE SOURCE OF TRUTH:
//
//   ?section=interviews  which half the main area shows (absent = Projects)
//   #<slug>              which sub-category is selected
//
// The shown section is DERIVED from useSearchParams on every render — there is
// no local `section` state to fall out of step with the URL, which is what
// made switching back to Projects fail before. Open groups are local UI state,
// seeded from the selection.
//
// A sub-category NAME and its CHEVRON are two separate buttons with two
// separate jobs (see Navbar): the name selects (opens + switches section +
// rewrites the URL + scrolls), the chevron only expands or collapses.
// ===================================================================

type Section = "projects" | "interviews";

/** The id used by the sidebar row, the content block and the URL hash. */
type GroupId = string;

export default function HomeShell({
    initialSection,
    interviews,
}: {
    /**
     * Resolved on the server from ?section=, so the first paint is already the
     * right half. After hydration the URL itself takes over.
     */
    initialSection: Section;
    /**
     * Read from MongoDB by the server page. null means the database could not
     * be reached: the Interviews half shows an error state and Projects, which
     * are files, carry on exactly as before.
     */
    interviews: { summary: string; categories: InterviewCategory[] } | null;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const types = projectsByType();
    const categories = interviews?.categories ?? [];

    // Ids are the bare slugs, because they are also the URL hash and the
    // content block's id. (A project type and an interview sub-category would
    // collide if they ever shared a slug; none do today.)
    const projectIds: GroupId[] = types.map((t) => t.id);
    const interviewIds: GroupId[] = categories.map((c) => c.slug);
    const isInterviewId = (id: GroupId) => interviewIds.includes(id);

    // Every valid group id as one stable string. The registries are fresh
    // arrays on every render, so they cannot be effect dependencies; this key
    // only changes when the ids themselves do.
    const idKey = [...projectIds, ...interviewIds].join("|");

    // DERIVED, never stored: ?section is the truth, and it updates on every
    // router.replace below.
    const section: Section =
        searchParams.get("section") === "interviews" ? "interviews" : "projects";

    // First selection: the section's first sub-category — Web Development for
    // Projects. Only used to seed state, so it is read once.
    const initialSelected: GroupId =
        initialSection === "interviews"
            ? (interviewIds[0] ?? "")
            : (projectIds[0] ?? "");

    // The hash never reaches the server, so selection starts at that default
    // and the mount effect below corrects it when the URL carries one.
    const [selected, setSelected] = useState<GroupId>(initialSelected);
    const [open, setOpen] = useState<Record<GroupId, boolean>>(() => ({
        [initialSelected]: true,
    }));

    // Set to a group id when a scroll is owed; the effect below performs it
    // once that group's content is actually in the DOM.
    const [pendingScroll, setPendingScroll] = useState<GroupId | null>(null);

    // --- the URL hash, which exists only on the client ---
    //
    // On load, /?section=interviews#preparation and /#databases must both land
    // selected, open and scrolled. The reader lives inside the effect so it
    // needs no dependency list of its own, and the first call is scheduled for
    // the next frame rather than run in the effect body — that keeps the state
    // updates out of the render pass and gives the content a frame to mount.
    useEffect(() => {
        const known = idKey.split("|");
        const read = () => {
            const hash = decodeURIComponent(window.location.hash.slice(1));
            // Ignore a fragment that names no sub-category, so a stray hash
            // cannot blank the selection.
            if (!hash || !known.includes(hash)) return;
            setSelected(hash);
            setOpen((prev) => ({ ...prev, [hash]: true }));
            setPendingScroll(hash);
        };

        const frame = requestAnimationFrame(read);
        // Back/forward, or any other change of the fragment.
        window.addEventListener("hashchange", read);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("hashchange", read);
        };
    }, [idKey]);

    // --- the owed scroll ---
    useEffect(() => {
        if (!pendingScroll) return;
        let frame = 0;
        let tries = 0;
        // Switching section re-renders the main area; the target block may not
        // exist for a frame or two, so this waits for it rather than giving up.
        const run = () => {
            const el = document.getElementById(pendingScroll);
            if (el) {
                const reduce = window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                ).matches;
                // The offset is the block's own scroll-mt-8, which
                // scrollIntoView honours.
                el.scrollIntoView({
                    behavior: reduce ? "auto" : "smooth",
                    block: "start",
                });
                setPendingScroll(null);
                return;
            }
            if (tries++ < 20) frame = requestAnimationFrame(run);
            else setPendingScroll(null);
        };
        frame = requestAnimationFrame(run);
        return () => cancelAnimationFrame(frame);
    }, [pendingScroll, section]);

    // --- clicking a sub-category NAME ---
    const onSelect = (id: GroupId) => {
        const nextSection: Section = isInterviewId(id)
            ? "interviews"
            : "projects";

        // Opens, and never closes: selecting an already-open group leaves it
        // open, and other groups are untouched.
        setOpen((prev) => ({ ...prev, [id]: true }));
        setSelected(id);
        setPendingScroll(id);

        // replace, not push: browsing the sidebar must not fill the history.
        // scroll: false because the effect above owns scrolling — and it waits
        // for the new section's content, which the router cannot.
        const query = nextSection === "interviews" ? "?section=interviews" : "";
        router.replace(`/${query}#${id}`, { scroll: false });
    };

    // Two sections, built from the two registries. Items are the collapsible
    // sub-categories; their links hang off subItems, keyed by the same ids.
    const groups = [
        {
            heading: "Projects",
            items: types.map((t) => ({ id: t.id, label: t.label })),
        },
        {
            heading: "Interviews",
            items: categories.map((c) => ({ id: c.slug, label: c.name })),
            // With no tree there are no groups to list, so the section says why
            // instead of rendering an empty heading.
            note: interviews ? undefined : "database not reachable",
        },
    ];

    const subItems: Record<string, NavSubItem[]> = {
        ...Object.fromEntries(
            types.map((t) => [
                t.id,
                t.projects.map((p) => ({
                    label: p.title,
                    href: projectHref(p.slug),
                })),
            ]),
        ),
        ...Object.fromEntries(
            categories.map((c) => [
                c.slug,
                c.items.map((item) => ({ label: item.name, href: item.href })),
            ]),
        ),
    };

    return (
        <div className="flex min-h-screen">
            <Navbar
                groups={groups}
                mode="anchor"
                homeHref="/"
                brand={{ eyebrow: "learn", sub: "projects" }}
                subItems={subItems}
                openGroups={open}
                onOpenGroupsChange={setOpen}
                selectedId={selected}
                onSelect={onSelect}
            />

            <main className="flex-1 px-8 py-10 lg:px-14">
                {section === "interviews" ? (
                    <InterviewsContent
                        summary={interviews?.summary ?? ""}
                        categories={interviews?.categories ?? null}
                    />
                ) : (
                    <ProjectsContent />
                )}
            </main>
        </div>
    );
}
