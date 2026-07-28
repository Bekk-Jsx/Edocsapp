// Single source of truth for the redis navbar + project landing.
// Mirrors the shape of projects/hooks-refresh/hooks.ts so the shared Navbar can
// be fed the same way. Scaffolding step: deliberately empty — every topic and
// chapter gets added here, one entry per page.

export type RedisChapter = string;

export const CHAPTERS: { id: string; label: string }[] = [];

export interface RedisTopic {
    slug: string; // URL segment -> /redis-refresh/<slug>
    name: string; // nav + card label
    chapter: string; // CHAPTERS id
    summary: string; // one-line blurb
}

export const TOPICS: RedisTopic[] = [];

export const topicBySlug = (slug: string) =>
    TOPICS.find((t) => t.slug === slug);

// Only chapters that actually have at least one topic (hide empty chapters).
export const topicsByChapter = () =>
    CHAPTERS.map((c) => ({
        ...c,
        topics: TOPICS.filter((t) => t.chapter === c.id),
    })).filter((g) => g.topics.length > 0);
