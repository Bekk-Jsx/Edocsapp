// Single source of truth for the redis navbar + project landing.
// Mirrors the shape of projects/hooks-refresh/hooks.ts so the shared Navbar can
// be fed the same way. One entry per page: adding a topic here is what puts it
// in the sidebar and on the landing grid — array order is render order.

export type RedisChapter = string;

export const CHAPTERS: { id: string; label: string }[] = [
    { id: "environment", label: "Environment" },
    { id: "data-types", label: "Data Types" },
    // Lookup pages, deliberately last: not part of the learning sequence.
    { id: "reference", label: "Reference" },
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
        summary: "Every key has a type and an internal encoding; how to read them, how to walk the keyspace without blocking the server, and how expiry behaves."
    },

    // — Data Types —
    {
        slug: "strings-and-counters", name: "Strings & Counters", chapter: "data-types",
        summary: "The string is Redis's default type and its most misused one. SET's options make writes atomic, INCR turns a string into a counter, and the choice between a JSON blob and a structured type is the first real modelling decision."
    },
    {
        slug: "hashes", name: "Hashes", chapter: "data-types",
        summary: "HSET / HGET / HGETALL / HDEL / HMGET, HINCRBY, HEXISTS, and field TTL (Redis 7.4+). Your user objects live here."
    },
    {
        slug: "lists", name: "Lists", chapter: "data-types",
        summary: "LPUSH / RPUSH / LPOP / RPOP, LRANGE, LLEN, LTRIM, BRPOP. Queues and capped logs."
    },
    {
        slug: "sets", name: "Sets", chapter: "data-types",
        summary: "SADD / SREM / SMEMBERS / SISMEMBER / SCARD, SINTER / SUNION / SDIFF. Tags, membership, and the secondary index pattern from Inspecting the Keyspace."
    },
    {
        slug: "sorted-sets", name: "Sorted Sets", chapter: "data-types",
        summary: "ZADD / ZSCORE / ZINCRBY, ZRANGE with REV / BYSCORE / LIMIT, ZRANK, ZREMRANGEBYSCORE. Leaderboards and sliding windows."
    },
    {
        slug: "choosing-a-type", name: "Choosing Between Them", chapter: "data-types",
        summary: "The same data modelled four ways — what each type buys you and what it costs you."
    },

    // — Reference —
    {
        slug: "reading-replies", name: "Reading Redis Replies", chapter: "reference",
        summary: "Redis answers in a handful of shapes — a status, a number, a string, a nil, or an array. The number usually means \"how many\", except when it means \"how long\", and the same integer can mean opposite things depending on the command. This page decodes them."
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
