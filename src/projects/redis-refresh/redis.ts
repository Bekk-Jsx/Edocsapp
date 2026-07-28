// Single source of truth for the redis navbar + project landing.
// Mirrors the shape of projects/hooks-refresh/hooks.ts so the shared Navbar can
// be fed the same way. One entry per page: adding a topic here is what puts it
// in the sidebar and on the landing grid — array order is render order.

export type RedisChapter = string;

export const CHAPTERS: { id: string; label: string }[] = [
    { id: "environment", label: "Environment" },
    { id: "data-types", label: "Data Types" },
];

export interface RedisTopic {
    slug: string; // URL segment -> /redis-refresh/<slug>
    name: string; // nav + card label
    chapter: string; // CHAPTERS id
    summary: string; // one-line blurb
}

export const TOPICS: RedisTopic[] = [
    // — Environment —
    {
        slug: "first-commands", name: "First Commands", chapter: "environment",
        summary: "redis-cli, SET/GET/DEL, looking around the keyspace, key naming."
    },
    {
        slug: "node-playground", name: "Node Playground", chapter: "environment",
        summary: "ioredis singleton, first routes, watching commands with MONITOR."
    },
    {
        slug: "inspecting-the-keyspace", name: "Inspecting the Keyspace", chapter: "environment",
        summary: "TYPE, TTL and expiry, SCAN over KEYS, OBJECT ENCODING."
    },

    // — Data Types —
    {
        slug: "strings", name: "Strings & Counters", chapter: "data-types",
        summary: "SET options, INCR, JSON blobs and serialization."
    },
    {
        slug: "hashes", name: "Hashes", chapter: "data-types",
        summary: "Objects field by field, flat string maps, field TTL."
    },
    {
        slug: "lists", name: "Lists", chapter: "data-types",
        summary: "Queues and capped feeds, blocking pops from Node."
    },
    {
        slug: "sets", name: "Sets", chapter: "data-types",
        summary: "Membership, tags, uniqueness."
    },
    {
        slug: "sorted-sets", name: "Sorted Sets", chapter: "data-types",
        summary: "Leaderboards, sliding windows, timestamp scores."
    },
    {
        slug: "choosing-a-type", name: "Choosing a Type", chapter: "data-types",
        summary: "Decision table: data shape and access pattern to type."
    },
];

export const topicBySlug = (slug: string) =>
    TOPICS.find((t) => t.slug === slug);

// Only chapters that actually have at least one topic (hide empty chapters).
export const topicsByChapter = () =>
    CHAPTERS.map((c) => ({
        ...c,
        topics: TOPICS.filter((t) => t.chapter === c.id),
    })).filter((g) => g.topics.length > 0);
