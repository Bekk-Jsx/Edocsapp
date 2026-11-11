import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";
import { projectsByType, type Project } from "@/lib/projects";
import { projectHref } from "@/lib/routes";

// The Projects half of the home main area — moved here from app/page.tsx with
// its markup unchanged, so that switching sections cannot alter how Projects
// look. The page now picks between this and InterviewsContent.

// One project entry. Links to /projects/<slug> — the project landing owned by
// that project's own route folder.
function ProjectCard({
    project,
    typeLabel,
}: {
    project: Project;
    typeLabel: string;
}) {
    return (
        <Link
            href={projectHref(project.slug)}
            className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors duration-150 hover:border-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            {/* Type on the left, status on the right. The badge lives on the card
                and nowhere else — the navbar and the project layouts stay free of
                it, so progress is something you read on the index only. */}
            <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                    {typeLabel}
                </span>
                <StatusBadge status={project.status} />
            </div>
            <h3 className="mt-2 text-lg font-semibold text-[var(--accent)]">
                {project.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {project.description}
            </p>
        </Link>
    );
}

export default function ProjectsContent() {
    const groups = projectsByType();

    return (
        <>
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
                    id={group.id}
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
        </>
    );
}
