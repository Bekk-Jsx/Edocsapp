import { notFound } from "next/navigation";
import { SortedSetsDocs } from "@/projects/redis-refresh/content/sorted-sets";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Notes-only page: Redis runs on a server, so there is no live demo to frame —
// no DemoFrame, no client boundary. Heading and subtitle are read from the
// registry so the page, the sidebar row and the landing card can never drift.
export default function Page() {
    const topic = topicBySlug("sorted-sets");
    if (!topic) notFound();

    return (
        <article className="max-w-3xl">
            <header className="mb-6">
                <h1 className="text-3xl font-semibold text-[var(--text)]">
                    {topic.name}
                </h1>
                <p className="mt-3 text-[var(--muted)] leading-relaxed">
                    {topic.summary}
                </p>
            </header>

            <SortedSetsDocs />
        </article>
    );
}
