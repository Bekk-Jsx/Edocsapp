import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import FaqButton from "@/components/ui/faq-button";
import { topicsByChapter, PROJECT_LINKS } from "@/projects/redis-refresh/redis";

// Shell for every /redis-refresh/* route — same chrome as the hooks project.
// No <html>/<body>: those stay in the root layout.
//
// Server Component: `groups` is plain data, so the client Navbar receives it as
// a serialized prop. Nothing project-specific is imported by Navbar itself.
// Chapters arrive in registry order, and so do the topics within each — adding a
// TOPICS entry is the whole of adding a sidebar row.
export default function ProjectLayout({ children }: { children: ReactNode }) {
    const groups = topicsByChapter().map((g) => ({
        heading: g.label,
        items: g.topics.map((t) => ({ id: t.slug, label: t.name })),
    }));

    return (
        <>
            <div className="flex min-h-screen">
                <Navbar
                    groups={groups}
                    // Project pages (notes…) — the separate list above the doc
                    // groups, same optional mechanism the hooks project uses.
                    projectLinks={PROJECT_LINKS.map((l) => ({
                        id: l.slug,
                        label: l.label,
                    }))}
                    mode="route"
                    basePath="/redis-refresh"
                    homeHref="/redis-refresh"
                    brand={{ eyebrow: "redis", sub: "refresh · lab" }}
                    back={{ href: "/", label: "Projects" }}
                />
                <main className="flex-1 px-8 py-10 lg:px-14">{children}</main>
            </div>
            {/* project-only: the global home page deliberately has no FAQ button */}
            <FaqButton />
        </>
    );
}
