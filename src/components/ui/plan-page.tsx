import PageShell from "@/components/ui/page-shell";
import StatusBadge from "@/components/ui/status-badge";

// A page that has been planned but not written yet. Sits one level below
// EmptyProject: that one stands in for a whole project with no topics, this one
// stands in for a single topic whose parts are already decided.
//
// Everything shown is passed in from the project registry, so the placeholder,
// its sidebar row and its landing card can never drift. The badge is the shared
// StatusBadge on "in-progress", not a bespoke pill — a page in progress and a
// project in progress read the same on purpose.
//
// PageShell without `alerts`: the rail is where a finished page puts its
// takeaways, and there are none to put there yet, so the shell renders its
// single body column.
export default function PlanPage({
    eyebrow,
    name,
    summary,
    parts = [],
}: {
    eyebrow: string;
    name: string;
    summary: string;
    /**
     * The planned sections. Optional: a project page (notes…) is a placeholder
     * with nothing to break into parts, and passing none drops the Planned
     * panel entirely rather than leaving an empty box under the summary.
     */
    parts?: string[];
}) {
    return (
        <PageShell>
            <article className="w-full">
                <header className="mb-8">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        {eyebrow}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold text-[var(--text)]">
                            {name}
                        </h1>
                        <StatusBadge status="in-progress" />
                    </div>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {summary}
                    </div>
                </header>

                {parts.length ? (
                    <section>
                        <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                            Planned
                        </p>
                        {/* Dashed border, like the empty-state panel on the project
                            landing: the same visual grammar for "nothing here yet". */}
                        <ol className="space-y-2 rounded-lg border border-dashed border-[var(--border)] p-5">
                            {parts.map((part, i) => (
                                <li
                                    key={part}
                                    className="flex gap-3 font-mono text-sm text-[var(--text)]"
                                >
                                    <span className="shrink-0 text-[var(--muted)]">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span>{part}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                ) : null}
            </article>
        </PageShell>
    );
}
