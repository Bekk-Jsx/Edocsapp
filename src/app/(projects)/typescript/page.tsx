import { notFound } from "next/navigation";
import StatusBadge from "@/components/ui/status-badge";
import { projectBySlug } from "@/lib/projects";

const SLUG = "typescript";

// Stub landing — no content yet. Title and status are read from the registry, so
// this page and the home card can never drift.
//
// Not ui/coming-soon: that component renders its own <main> and its own way back
// out, both of which this project's layout already provides (a <main> wrapper
// and the navbar's "← Projects"). Same three elements, centred inside the shell
// instead of replacing it.
export default function Page() {
    const project = projectBySlug(SLUG);
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
