import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { projectsByType, type Project } from "@/lib/projects";

// The root layout's metadata still names the hooks project; home overrides it.
export const metadata: Metadata = {
    title: "Projects · learn",
    description: "Hands-on learning projects, grouped by type.",
};

// One project entry. Links to /<slug> — the project landing owned by that
// project's own route group.
function ProjectCard({
    project,
    typeLabel,
}: {
    project: Project;
    typeLabel: string;
}) {
    return (
        <Link
            href={`/${project.slug}`}
            className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors duration-150 hover:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {typeLabel}
            </span>
            <h3 className="mt-2 text-lg font-semibold text-[var(--accent)]">
                {project.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {project.description}
            </p>
        </Link>
    );
}

export default function Home() {
    // Only types that actually have projects — so every type-nav anchor has a
    // section to land on, and empty types never render a dead link. Nav and
    // sections are built from the same list, so their ids can't drift.
    const groups = projectsByType();
    const navGroups = [
        {
            heading: "Projects",
            items: groups.map((g) => ({ id: `type-${g.id}`, label: g.label })),
        },
    ];

    // Each type's projects, hung off that type's nav id. Titles only — the nav
    // stops here and never reaches into a project's own contents. Keyed off the
    // same projectsByType() result as the sections, so the two can't drift.
    const navSubItems = Object.fromEntries(
        groups.map((g) => [
            `type-${g.id}`,
            g.projects.map((p) => ({ label: p.title, href: `/${p.slug}` })),
        ]),
    );

    return (
        <div className="flex min-h-screen">
            <Navbar
                groups={navGroups}
                mode="anchor"
                homeHref="/"
                brand={{ eyebrow: "learn", sub: "projects" }}
                subItems={navSubItems}
            />

            <main className="flex-1 px-8 py-10 lg:px-14">
                <header className="mb-10">
                    <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                        learn
                    </p>
                    <h1 className="mt-1 text-4xl font-semibold text-[var(--text)]">
                        Projects.
                    </h1>
                    <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--muted)]">
                        Hands-on builds, each one a reference you can come back to —
                        grouped by what they teach.
                    </p>
                </header>

                {groups.map((group) => (
                    // scroll-mt-8 = 2rem, so a type-nav jump doesn't land flush
                    // against the top of the viewport.
                    <section
                        key={group.id}
                        id={`type-${group.id}`}
                        className="mt-12 scroll-mt-8 first:mt-0"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="inline-block h-[14px] w-[2px] shrink-0 rounded-full bg-[var(--accent)]"
                            />
                            <h2 className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">
                                {group.label}
                            </h2>
                            <span className="font-mono text-[0.65rem] text-[var(--muted)]">
                                {group.projects.length}
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {group.projects.map((project) => (
                                <ProjectCard
                                    key={project.slug}
                                    project={project}
                                    typeLabel={group.label}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </main>
        </div>
    );
}
