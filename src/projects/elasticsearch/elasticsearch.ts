// Single source of truth for the elasticsearch navbar + project landing.
// Mirrors projects/redis-refresh/redis.ts so the shared Navbar can be fed the
// same way. One entry per page: adding a topic here is what puts it in the
// sidebar and on the landing grid — array order is render order.
//
// SCAFFOLD STAGE: every page is a placeholder. `parts` is the chapter plan each
// page renders while it has no content, so the plan lives beside the nav entry
// rather than in eight page files that would drift from it.

export const CHAPTERS: { id: string; label: string }[] = [
    { id: "foundations", label: "Foundations" },
    { id: "searching", label: "Searching" },
    { id: "in-an-app", label: "Making It Work in an App" },
];

export interface ElasticsearchTopic {
    slug: string; // URL segment -> /elasticsearch/<slug>
    name: string; // nav + card label
    chapter: string; // CHAPTERS id
    summary: string; // one-line blurb
    /**
     * Planned sections, rendered by the placeholder page. Dropped once the page
     * is written — a topic with no `parts` is one that no longer needs a plan.
     */
    parts?: string[];
}

export const TOPICS: ElasticsearchTopic[] = [
    // — Foundations —
    {
        slug: "introduction", name: "Introduction", chapter: "foundations",
        summary: "What Elasticsearch is, the problem the inverted index solves, and where a search layer sits next to a database.",
        // WRITTEN — no `parts`, and no placeholder badge: see
        // app/(projects)/elasticsearch/introduction/page.tsx.
    },
    {
        slug: "documents-indices", name: "Documents & Indices", chapter: "foundations",
        summary: "The unit of storage and the container it lives in — writing, versioning and moving documents in bulk.",
        // WRITTEN — no `parts`, and no placeholder badge: see
        // app/(projects)/elasticsearch/documents-indices/page.tsx.
    },
    {
        slug: "mappings-analysis", name: "Mappings & Analysis", chapter: "foundations",
        summary: "How a field is typed and how its text is broken up — the decisions you cannot take back without a reindex.",
        // WRITTEN — no `parts`, and no placeholder badge: see
        // app/(projects)/elasticsearch/mappings-analysis/page.tsx.
    },

    // — Searching —
    {
        slug: "queries-structure", name: "Queries Structure", chapter: "searching",
        summary: "The shape of a search request before any query type: what a query is sent as, what comes back, and the vocabulary the rest of the chapter uses.",
        // No `parts` yet: the plan for this one is still to be decided, so the
        // placeholder shows the badge and the blurb and nothing else — a `parts`
        // list would be inventing a chapter plan the page does not have.
    },
    {
        slug: "search-queries", name: "Search Queries", chapter: "searching",
        summary: "The query DSL: matching text, filtering on exact values, combining the two, and ordering what comes back.",
        // WRITTEN — no `parts`, and no placeholder badge: see
        // app/(projects)/elasticsearch/search-queries/page.tsx.
    },
    {
        slug: "aggregations", name: "Aggregations", chapter: "searching",
        summary: "Summarising the matches instead of listing them — counts, metrics, and the facets a search UI is built from.",
        parts: [
            "Terms and metrics aggregations",
            "Nested and sub-aggregations",
            "Faceted search (search + aggs in one request)",
        ],
    },
    {
        slug: "search-ux", name: "Search UX", chapter: "searching",
        summary: "The features a search box is judged on — completing, correcting and broadening what the reader typed.",
        parts: [
            "Autocomplete (search_as_you_type)",
            "Suggesters (did-you-mean)",
            "Synonyms",
        ],
    },

    // — Making It Work in an App —
    {
        slug: "couchdb-sync", name: "CouchDB Sync", chapter: "in-an-app",
        summary: "Keeping the search layer honest about a database it does not own — feeding it changes and rebuilding it without downtime.",
        parts: [
            "Changes feed to indexing pipeline",
            "Deletes, retries, idempotency",
            "Zero-downtime reindex with aliases",
        ],
    },
    {
        slug: "production", name: "Production Essentials", chapter: "in-an-app",
        summary: "What the cluster is doing, why a query is slow, and the mistakes that only show up once there is real data.",
        parts: [
            "Shards, replicas, cluster health",
            "Slow queries and the profile API",
            "Common mistakes checklist",
        ],
    },
];

// Project-level pages that are NOT documentation — kept apart from TOPICS on
// purpose, exactly as the redis project does it: these never appear in the
// landing grid or the chapter nav, only in the navbar's own project list above
// the docs. Notes is a page ABOUT working through the chapters, not one of them,
// so it carries no chapter and no plan.
export type ProjectLink = { slug: string; label: string };

export const PROJECT_LINKS: ProjectLink[] = [
    { slug: "notes", label: "Notes" },
];

export const topicBySlug = (slug: string) =>
    TOPICS.find((t) => t.slug === slug);

// Only chapters that actually have at least one topic (hide empty chapters).
export const topicsByChapter = () =>
    CHAPTERS.map((c) => ({
        ...c,
        topics: TOPICS.filter((t) => t.chapter === c.id),
    })).filter((g) => g.topics.length > 0);
