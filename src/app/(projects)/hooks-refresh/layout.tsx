import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import FaqButton from "@/components/ui/faq-button";
import { hooksByChapter, PROJECT_LINKS } from "@/projects/hooks-refresh/hooks";

// Shell for every /hooks-refresh/* route. This markup used to live in the root
// layout; it moved here so the global home page can define its own chrome.
// No <html>/<body> — those stay in the root layout.
//
// Server Component: `groups` is plain data, so the client Navbar receives it as
// a serialized prop. Nothing project-specific is imported by Navbar itself.
export default function ProjectLayout({ children }: { children: ReactNode }) {
    const groups = hooksByChapter().map((g) => ({
        heading: g.chapter,
        items: g.hooks.map((h) => ({ id: h.slug, label: h.name })),
    }));

    return (
        <>
            <div className="flex min-h-screen">
                <Navbar
                    groups={groups}
                    // Project pages (about, notes…) — a separate list above the
                    // doc groups. Only this project passes them today.
                    projectLinks={PROJECT_LINKS.map((l) => ({
                        id: l.slug,
                        label: l.label,
                    }))}
                    mode="route"
                    basePath="/hooks-refresh"
                    homeHref="/hooks-refresh"
                    brand={{ eyebrow: "hooks", sub: "refresh · lab" }}
                    back={{ href: "/", label: "Projects" }}
                />
                <main className="flex-1 px-8 py-10 lg:px-14">{children}</main>
            </div>
            {/* project-only: the global home page deliberately has no FAQ button */}
            <FaqButton />
        </>
    );
}
