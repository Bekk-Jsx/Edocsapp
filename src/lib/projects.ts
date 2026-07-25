// Global registry of projects shown on the home page, grouped by type.
// Add a project = add one entry here.

export type ProjectType =
  | "web-dev"
  | "seo"
  | "databases"
  | "automation"
  | "design";

// Display order + labels for the type sections / type-nav on the home page.
export const PROJECT_TYPES: { id: ProjectType; label: string }[] = [
  { id: "web-dev", label: "Web Development" },
  { id: "seo", label: "SEO" },
  { id: "databases", label: "Databases" },
  { id: "automation", label: "Automation" },
  { id: "design", label: "Design" },
];

export interface Project {
  slug: string;        // URL segment -> /<slug>
  title: string;       // card + project heading
  description: string; // card blurb
  type: ProjectType;   // single type -> which section it lives under
}

export const PROJECTS: Project[] = [
  {
    slug: "hooks-refresh",
    title: "Hooks, refreshed.",
    description:
      "A hands-on refresh of every React & Next.js hook — live demos, source, and reference notes with traps flagged.",
    type: "web-dev",
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
