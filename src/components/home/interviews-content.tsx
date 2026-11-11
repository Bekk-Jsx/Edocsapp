import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";
import { BADGE_CLASS } from "@/components/ui/badge-class";
import type { InterviewCategory, InterviewItem } from "@/lib/interviews";

// The Interviews half of the home main area. Deliberately the same layout
// system as ProjectsContent — identical header shape, identical section
// headings, identical card — because the two are one index seen through two
// filters, not two designs. The card classes are copied rather than shared so
// that a future change to one side cannot silently restyle the other.
//
// The tree arrives as a prop: it is read from MongoDB by the server page,
// through getInterviewTree(), and this component is inside the client shell.

/** One interview item. Same card as a project card, plus its counts. */
function InterviewCard({
    item,
    categoryName,
}: {
    item: InterviewItem;
    categoryName: string;
}) {
    // A scaffolded item reads as a plan, not as broken content: dashed and
    // quiet, like a planned question's card. It still links to its landing.
    return (
        <Link
            href={item.href}
            className={`flex flex-col rounded-lg border p-5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                item.planned
                    ? "border-dashed border-[var(--border)] bg-[var(--surface-2)] opacity-70 hover:border-[var(--muted)] focus-visible:border-[var(--muted)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] focus-visible:border-[var(--accent)]"
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                    {categoryName}
                </span>
                {item.planned ? (
                    <span
                        className={BADGE_CLASS}
                        style={{
                            color: "var(--muted)",
                            background: "var(--surface)",
                            borderColor: "var(--border)",
                        }}
                    >
                        coming soon
                    </span>
                ) : (
                    <StatusBadge status={item.status} />
                )}
            </div>
            <h3
                className={`mt-2 text-lg font-semibold ${
                    item.planned ? "text-[var(--muted)]" : "text-[var(--accent)]"
                }`}
            >
                {item.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {item.summary}
            </p>
            {/* How much there is, and how much is written — the one number a
                planned-content index actually needs. Pointless on an item with
                no pages yet. */}
            {item.planned ? null : (
                <p className="mt-3 font-mono text-[0.65rem] text-[var(--muted)]">
                    {item.questionCount} questions · {item.readyCount} ready
                </p>
            )}
        </Link>
    );
}

/** Shown when the database cannot be reached. Projects are unaffected. */
export function InterviewsUnavailable() {
    return (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-5">
            <p className="font-mono text-[0.8rem] text-[var(--amber)]">
                Interviews are unavailable — database not reachable
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Projects are files on disk and keep working. Check{" "}
                <code className="font-mono text-[0.8em]">MONGODB_URI</code> in{" "}
                <code className="font-mono text-[0.8em]">.env.local</code> and the
                Network Access list in Atlas.
            </p>
        </div>
    );
}

export default function InterviewsContent({
    summary,
    categories,
}: {
    summary: string;
    /** null when the database could not be read. */
    categories: InterviewCategory[] | null;
}) {
    return (
        <>
            <header className="mb-10">
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                    learn
                </p>
                <h1 className="mt-1 text-4xl font-semibold text-[var(--text)]">
                    Interviews.
                </h1>
                {summary ? (
                    <p className="mt-3 max-w-[60ch] leading-relaxed text-[var(--muted)]">
                        {summary}
                    </p>
                ) : null}
            </header>

            {categories === null ? (
                <InterviewsUnavailable />
            ) : (
                categories.map((category) => (
                    // Same anchor contract as the project types: the sidebar group
                    // for this sub-category targets this id.
                    <section
                        key={category.slug}
                        id={category.slug}
                        className="mt-12 scroll-mt-8 first:mt-0"
                    >
                        <div className="mb-4 flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="inline-block h-[14px] w-[2px] shrink-0 rounded-full bg-[var(--accent)]"
                            />
                            <h2 className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">
                                {category.name}
                            </h2>
                            <span className="font-mono text-[0.65rem] text-[var(--muted)]">
                                {category.items.length}
                            </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {category.items.map((item) => (
                                <InterviewCard
                                    key={item.slug}
                                    item={item}
                                    categoryName={category.name}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </>
    );
}
