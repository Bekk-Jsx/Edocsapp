import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import FaqButton from "@/components/ui/faq-button";
import { topicsByChapter } from "@/projects/vue/vue";

// Shell for every /vue/* route — same chrome as the typescript, hooks and
// redis projects. No <html>/<body>: those stay in the root layout.
//
// Server Component: `groups` is plain data, so the client Navbar receives it as
// a serialized prop. Nothing project-specific is imported by Navbar itself.
// The registry is still empty, so `groups` is [] and the Navbar renders its
// "Coming soon" stand-in — adding a TOPICS entry is the whole of adding a row.
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
                    mode="route"
                    basePath="/vue"
                    homeHref="/vue"
                    brand={{ eyebrow: "vue", sub: "reactivity · lab" }}
                    back={{ href: "/", label: "Projects" }}
                />
                <main className="flex-1 px-8 py-10 lg:px-14">{children}</main>
            </div>
            {/* project-only: the global home page deliberately has no FAQ button */}
            <FaqButton />
        </>
    );
}
