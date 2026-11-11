// ===================================================================
// ROUTES — the single source of truth for internal project URLs.
//
// Every project route lives under /projects/<slug>, which leaves the first
// segment free for siblings (interviews at /interviews/<item>/<page>) and
// keeps the project TYPE out of the URL entirely: a project moving from
// "Web Development" to "Databases" never changes its address.
//
// Nothing outside this module hard-codes a project path. Links are built with
// projectHref / pageHref / anchorHref, and an incoming pathname is read back
// with parseProjectPath, so the scheme changes in one place.
// ===================================================================

/** The segment every project route sits under. */
export const PROJECTS_SEGMENT = "projects";

/** A project landing page: /projects/vue */
export function projectHref(slug: string): string {
    return `/${PROJECTS_SEGMENT}/${slug}`;
}

/** A page inside a project: /projects/vue/writing-composables */
export function pageHref(slug: string, page: string): string {
    return `${projectHref(slug)}/${page}`;
}

/** A section on a page: /projects/vue/writing-composables#the-conventions */
export function anchorHref(
    slug: string,
    page: string,
    sectionId: string,
): string {
    return `${pageHref(slug, page)}#${sectionId}`;
}

/** A project slug, plus the page within it when the path names one. */
export type ProjectPath = { project: string; page?: string };

/**
 * The inverse of the helpers above: reads the project and page back out of a
 * pathname. Returns null for anything outside /projects/, so callers that key
 * behaviour off the project — page search, the add-note button — can never
 * mistake the first segment of an unrelated route for a project slug.
 */
export function parseProjectPath(pathname: string): ProjectPath | null {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== PROJECTS_SEGMENT) return null;
    const project = segments[1];
    if (!project) return null;
    return { project, page: segments[2] };
}

// ===================================================================
// INTERVIEWS — the sibling segment to /projects.
//
// Same shape as the project helpers, one level shallower: an interview item
// owns its pages directly, so the sub-category never appears in the URL (just
// as a project's type never does). /interviews/<item>/<page>.
// ===================================================================

/** The segment every interview route sits under. */
export const INTERVIEWS_SEGMENT = "interviews";

/** An interview item: /interviews/fullstack-questions */
export function interviewItemHref(item: string): string {
    return `/${INTERVIEWS_SEGMENT}/${item}`;
}

/** A page inside an interview item: /interviews/fullstack-questions/http */
export function interviewPageHref(item: string, page: string): string {
    return `${interviewItemHref(item)}/${page}`;
}

/** An interview item, plus the page within it when the path names one. */
export type InterviewPath = { item: string; page?: string };

/**
 * The inverse of interviewItemHref / interviewPageHref. Returns null for
 * anything outside /interviews/, so a caller keyed on the item can never
 * mistake another route's first segment for one.
 */
export function parseInterviewPath(pathname: string): InterviewPath | null {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] !== INTERVIEWS_SEGMENT) return null;
    const item = segments[1];
    if (!item) return null;
    return { item, page: segments[2] };
}

/** Where interview notes are listed. */
export function interviewNotesHref(): string {
    return `/${INTERVIEWS_SEGMENT}/notes`;
}
