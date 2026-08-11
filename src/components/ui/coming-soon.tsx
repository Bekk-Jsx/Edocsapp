import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/ui/status-badge";
import { projectBySlug } from "@/lib/projects";

// Landing for a project that is in the registry but has no content yet.
// Title and status are read from the registry, so the stub and its home card
// can never drift; an unknown slug 404s rather than rendering a blank page.
//
// No navbar: chrome is per-section (see the root layout), and a project with no
// topics has nothing to put in a sidebar. The only chrome is the way back out.
export default function ComingSoon({ slug }: { slug: string }) {
    const project = projectBySlug(slug);
    if (!project) notFound();

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-8 py-10 text-center">
            <h1 className="text-4xl font-semibold text-[var(--text)]">
                {project.title}
            </h1>
            <p className="font-mono text-sm text-[var(--muted)]">Coming soon</p>
            <StatusBadge status={project.status} />
            <Link
                href="/"
                className="mt-6 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
            >
                ← Projects
            </Link>
        </main>
    );
}
