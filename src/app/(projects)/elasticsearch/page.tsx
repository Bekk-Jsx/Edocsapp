import Link from "next/link";
import StatusBadge from "@/components/ui/status-badge";
import {
    topicsByChapter,
    TOPICS,
    CHAPTERS,
} from "@/projects/elasticsearch/elasticsearch";

// Project landing. Chapter groups come from the same registry the navbar reads,
// so the two can't drift. `topicsByChapter` drops chapters with no topics, so
// `groups` goes empty only when the registry itself has none — the empty-state
// panel below stands in for the grid then rather than leaving the section blank.
//
// Every page is still a placeholder, hence the badge under the title: the state
// is stated once here instead of being implied by eight empty pages.
export default function Home() {
    const groups = topicsByChapter();

    return (
        <div className="max-w-4xl">
            <p className="font-mono text-xs tracking-widest text-[var(--accent)]">
                elasticsearch · search
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Elasticsearch</h1>
            <p className="mt-3 max-w-xl text-[var(--muted)] leading-relaxed">
                One topic per page: how documents are indexed and analysed, the
                queries and aggregations that read them back, and what it takes to
                keep a search layer in step with the database that owns the data.
            </p>

            <div className="mt-4">
                <StatusBadge status="in-progress" />
            </div>

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
                                            href={`/elasticsearch/${t.slug}`}
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
