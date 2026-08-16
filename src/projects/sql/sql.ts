// Single source of truth for the sql navbar + project landing.
// Mirrors the shape of projects/redis-refresh/redis.ts so the shared Navbar can
// be fed the same way. One entry per page: adding a topic here is what puts it
// in the sidebar — array order is render order.
//
// Deliberately EMPTY for now: the project is scaffolded before its pages exist,
// so `topicsByChapter()` returns nothing and the Navbar falls back to its
// "Coming soon" state. Filling CHAPTERS and TOPICS is the whole of starting it.

export type SqlChapter = string;

export const CHAPTERS: { id: string; label: string }[] = [];

export interface SqlTopic {
    slug: string; // URL segment -> /sql/<slug>
    name: string; // nav + card label
    chapter: string; // CHAPTERS id
    summary: string; // one-line blurb
}

export const TOPICS: SqlTopic[] = [];

export const topicBySlug = (slug: string) =>
    TOPICS.find((t) => t.slug === slug);

// Only chapters that actually have at least one topic (hide empty chapters).
export const topicsByChapter = () =>
    CHAPTERS.map((c) => ({
        ...c,
        topics: TOPICS.filter((t) => t.chapter === c.id),
    })).filter((g) => g.topics.length > 0);
