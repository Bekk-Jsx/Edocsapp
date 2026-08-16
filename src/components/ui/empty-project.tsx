import { notFound } from "next/navigation";
import StatusBadge from "@/components/ui/status-badge";
import { projectBySlug } from "@/lib/projects";

// The one empty-project landing, extracted verbatim from what was
// app/(projects)/typescript/page.tsx. Every project that has no content yet
// renders this and nothing else, so "scaffolded but empty" looks the same
// everywhere by construction rather than by eight copies staying in step.
//
// Title and status are read from the registry for `slug`, so this page and the
// home card can never drift; an unknown slug 404s rather than rendering a blank
// page.
//
// It renders no <main> and no way back out on purpose: a project's layout
// already provides both (a <main> wrapper and the navbar's "← Projects"). The
// ui/coming-soon component this replaced supplied its own, because the projects
// using it had no layout at all — they have one now, so it is gone.
export function EmptyProject({ slug }: { slug: string }) {
    const project = projectBySlug(slug);
    if (!project) notFound();

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
            <h1 className="text-4xl font-semibold text-[var(--text)]">
                {project.title}
            </h1>
            <p className="font-mono text-sm text-[var(--muted)]">Coming soon</p>
            <StatusBadge status={project.status} />
        </div>
    );
}

export default EmptyProject;
