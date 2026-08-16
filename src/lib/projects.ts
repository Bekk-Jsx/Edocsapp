// Global registry of projects shown on the home page, grouped by type.
// Add a project = add one entry here.

export type ProjectType =
  | "web-dev"
  | "seo"
  | "databases"
  | "devops"
  | "automation"
  | "design"
  | "growth";

// Display order + labels for the type sections / type-nav on the home page.
export const PROJECT_TYPES: { id: ProjectType; label: string }[] = [
  { id: "web-dev", label: "Web Development" },
  { id: "seo", label: "SEO" },
  { id: "databases", label: "Databases" },
  { id: "devops", label: "DevOps" },
  { id: "automation", label: "Automation" },
  { id: "design", label: "Design" },
  { id: "growth", label: "Growth" },
];

// How far along a project is. Rendered as a badge on the HOME CARDS ONLY — the
// navbar and the project layouts deliberately stay free of it, so progress is
// something you read on the index and never chrome you carry into a project.
export type ProjectStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "postponed";

// Label + accent per status, in the same shape as `severityStyle`: the colour is
// a theme var, and the badge derives its tint, border and text from that one
// value. Amber and mint are borrowed from the severity palette; --note's slate
// reads as "parked" without implying a risk level.
export const PROJECT_STATUS: Record<
  ProjectStatus,
  { label: string; color: string }
> = {
  "not-started": { label: "Not started", color: "var(--muted)" },
  "in-progress": { label: "In progress", color: "var(--amber)" },
  completed: { label: "Completed", color: "var(--mint)" },
  postponed: { label: "Postponed", color: "var(--note)" },
};

export interface Project {
  slug: string;          // URL segment -> /<slug>
  title: string;         // card + project heading
  description: string;   // card blurb
  type: ProjectType;     // single type -> which section it lives under
  status: ProjectStatus; // badge on the home card
}

export const PROJECTS: Project[] = [
  {
    slug: "hooks-refresh",
    title: "Hooks, refreshed.",
    description:
      "A hands-on refresh of every React & Next.js hook — live demos, source, and reference notes with traps flagged.",
    type: "web-dev",
    status: "completed",
  },
  {
    slug: "redis-refresh",
    title: "Redis, refreshed.",
    description:
      "Data types, atomicity, persistence, scaling and caching patterns — CLI-first notes with the traps flagged.",
    type: "devops",
    status: "in-progress",
  },
  {
    slug: "sql",
    title: "SQL",
    description:
      "Relational databases — schema design, queries, joins, indexing.",
    type: "databases",
    status: "not-started",
  },
  {
    slug: "mongodb",
    title: "MongoDB",
    description:
      "Document databases with MongoDB — collections, queries, aggregation.",
    type: "databases",
    status: "not-started",
  },
  {
    slug: "couchdb",
    title: "CouchDB",
    description:
      "Document database with CouchDB — documents, revisions, views, replication.",
    type: "databases",
    status: "not-started",
  },
  {
    slug: "typescript",
    title: "TypeScript",
    description:
      "TypeScript for React/Next — types, generics, utility types, inference.",
    type: "web-dev",
    status: "not-started",
  },
  {
    slug: "vue",
    title: "Vue.js",
    description: "Vue fundamentals — reactivity, components, composition API.",
    type: "web-dev",
    status: "not-started",
  },
  {
    slug: "docker",
    title: "Docker",
    description: "Containers with Docker — images, volumes, networks, compose.",
    type: "devops",
    status: "not-started",
  },
  {
    slug: "elasticsearch",
    title: "Elasticsearch",
    description:
      "Search & analytics with Elasticsearch — indices, mapping, queries.",
    type: "devops",
    status: "in-progress",
  },
  {
    slug: "technical-seo",
    title: "Technical SEO",
    description:
      "Technical SEO — crawling, indexing, Core Web Vitals, structured data.",
    type: "growth",
    status: "not-started",
  },
];

export const projectBySlug = (slug: string) =>
  PROJECTS.find((p) => p.slug === slug);

// Only types that actually have at least one project (hide empty sections).
export const projectsByType = () =>
  PROJECT_TYPES.map((t) => ({
    ...t,
    projects: PROJECTS.filter((p) => p.type === t.id),
  })).filter((group) => group.projects.length > 0);
