import Link from "next/link";
import { topicsByChapter, TOPICS, CHAPTERS } from "@/projects/typescript/typescript";

// Project landing. Chapter groups come from the same registry the navbar reads,
// so the two can't drift. `topicsByChapter` drops chapters with no topics, so
// `groups` goes empty only when the registry itself has none — the empty-state
// panel below stands in for the grid then rather than leaving the section blank.
//
// This replaced ui/empty-project once the registry had topics: same swap the
// elasticsearch and redis landings made, and the same markup they both use, so
// a project with pages looks the same everywhere.
export default function Home() {
    const groups = topicsByChapter();

    return (
        <div className="max-w-4xl">
            <p className="font-mono text-xs tracking-widest text-[var(--accent)]">
                typescript · types
            </p>
            <h1 className="mt-2 text-4xl font-semibold">TypeScript</h1>
            <p className="mt-3 max-w-xl text-[var(--muted)] leading-relaxed">
                One topic per page: how a type is written and how it is read, the
                generics and utility types the standard library already gives you,
                and what any of it looks like once React and Next are involved.
            </p>

            <div className="mt-6 flex gap-6 font-mono text-xs text-[var(--muted)]">
                <span>
                    <span className="text-[var(--text)]">{TOPICS.length}</span> topics
                </span>
                <span>
                    <span className="text-[var(--text)]">{CHAPTERS.length}</span>{" "}
                    chapters
                </span>
            </div>

            <section className="mt-10">
                <p className="mb-3 font-mono text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">
                    Chapters
                </p>

                {groups.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center font-mono text-sm text-[var(--muted)]">
                        Coming soon — chapters land here as we build them.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {groups.map(({ id, label, topics }) => (
                            <div key={id}>
                                <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                                    {label}
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {topics.map((t) => (
                                        <Link
                                            key={t.slug}
                                            href={`/typescript/${t.slug}`}
                                            className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
                                        >
                                            <p className="font-mono text-sm text-[var(--accent)]">
                                                {t.name}
                                            </p>
                                            <p className="mt-1 text-sm text-[var(--muted)]">
                                                {t.summary}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
