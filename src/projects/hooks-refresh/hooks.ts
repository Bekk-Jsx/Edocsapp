// Single source of truth for the navbar + dashboard.
// Every React/Next hook we'll build is already listed. The only additions are
// PATTERN pages (e.g. the "Custom Hooks" chapter) — a real hook is never added
// here.

// Where the page's API is imported from — shown as the eyebrow on the page and
// as the hover badge on the dashboard. Not every entry is a React hook anymore:
// the "State Libraries" chapter covers third-party state tools.
export type Source = "react" | "next/navigation" | "@reduxjs/toolkit";

export interface HookMeta {
    slug: string; // URL segment under /hooks
    name: string; // hook identifier
    source: Source; // where it's imported from — shown as the eyebrow
    chapter: string; // grouping label in the nav
    summary: string; // one-line description
}

export const CHAPTERS = [
    "State",
    "Effects",
    "Context & Refs",
    "Performance",
    "Utility",
    "React 19",
    "Navigation",
    // Not a built-in API: the pattern of writing your own hooks. Sits after the
    // built-in chapters and before the third-party stores.
    "Custom Hooks",
    "State Libraries",
] as const;

export const HOOKS: HookMeta[] = [
    // — State —
    {
        slug: "use-state", name: "useState", source: "react", chapter: "State",
        summary: "Local state with functional updates and lazy init."
    },
    {
        slug: "use-reducer", name: "useReducer", source: "react", chapter: "State",
        summary: "Centralized state transitions via pure reducer + dispatch."
    },

    // — Effects —
    {
        slug: "use-effect", name: "useEffect", source: "react", chapter: "Effects",
        summary: "Synchronize with external systems after render."
    },
    {
        slug: "use-layout-effect", name: "useLayoutEffect", source: "react", chapter: "Effects",
        summary: "Read/mutate layout synchronously before paint."
    },
    {
        slug: "use-insertion-effect", name: "useInsertionEffect", source: "react", chapter: "Effects",
        summary: "Inject styles before layout — CSS-in-JS internals."
    },

    // — Context & Refs —
    {
        slug: "use-context", name: "useContext", source: "react", chapter: "Context & Refs",
        summary: "Read context value without prop drilling."
    },
    {
        slug: "use-ref", name: "useRef", source: "react", chapter: "Context & Refs",
        summary: "Mutable box + DOM node access, no re-render."
    },
    {
        slug: "use-imperative-handle", name: "useImperativeHandle", source: "react", chapter: "Context & Refs",
        summary: "Expose a controlled imperative API via ref."
    },

    // — Performance —
    {
        slug: "use-memo", name: "useMemo", source: "react", chapter: "Performance",
        summary: "Memoize an expensive computed value."
    },
    {
        slug: "use-callback", name: "useCallback", source: "react", chapter: "Performance",
        summary: "Memoize a function identity across renders."
    },
    {
        slug: "use-transition", name: "useTransition", source: "react", chapter: "Performance",
        summary: "Mark updates non-urgent to keep UI responsive."
    },
    {
        slug: "use-deferred-value", name: "useDeferredValue", source: "react", chapter: "Performance",
        summary: "Defer a value to avoid blocking urgent updates."
    },

    // — Utility —
    {
        slug: "use-id", name: "useId", source: "react", chapter: "Utility",
        summary: "Stable SSR-safe unique IDs for a11y attributes."
    },
    {
        slug: "use-sync-external-store", name: "useSyncExternalStore", source: "react", chapter: "Utility",
        summary: "Subscribe to an external store, tear-free + SSR-safe."
    },

    // — React 19 —
    {
        slug: "use", name: "use", source: "react", chapter: "React 19",
        summary: "Read a promise or context; unwraps async in render."
    },
    {
        slug: "use-action-state", name: "useActionState", source: "react", chapter: "React 19",
        summary: "Reducer-shaped state driven by a (server) action."
    },
    {
        slug: "use-form-status", name: "useFormStatus", source: "react", chapter: "React 19",
        summary: "Read the parent <form>'s pending/submit state."
    },
    {
        slug: "use-optimistic", name: "useOptimistic", source: "react", chapter: "React 19",
        summary: "Show optimistic UI while an action is pending."
    },

    // — Navigation (next/navigation) —
    {
        slug: "use-router", name: "useRouter", source: "next/navigation", chapter: "Navigation",
        summary: "Programmatic navigation: push, replace, refresh."
    },
    {
        slug: "use-pathname", name: "usePathname", source: "next/navigation", chapter: "Navigation",
        summary: "Current URL pathname, re-renders on change."
    },
    {
        slug: "use-params", name: "useParams", source: "next/navigation", chapter: "Navigation",
        summary: "Dynamic route segment params for the current URL."
    },
    {
        slug: "use-search-params", name: "useSearchParams", source: "next/navigation", chapter: "Navigation",
        summary: "Read the current query string reactively."
    },
    {
        slug: "use-selected-layout-segment", name: "useSelectedLayoutSegment", source: "next/navigation", chapter: "Navigation",
        summary: "Active route segment below a layout — for nav UI."
    },

    // — Custom Hooks —
    {
        slug: "custom-hooks", name: "Custom Hooks", source: "react", chapter: "Custom Hooks",
        summary: "Build your own hooks — reuse stateful logic; useFetch, useLocalStorage, useAuth."
    },

    // — State Libraries —
    {
        slug: "redux", name: "Redux", source: "@reduxjs/toolkit", chapter: "State Libraries",
        summary: "Global store with Redux Toolkit — slices, selectors, thunks."
    },
    {
        slug: "custom-store", name: "Custom Store", source: "react", chapter: "State Libraries",
        summary: "Hand-built external store bridged to React via useSyncExternalStore."
    },
];

// Short badge for the dashboard cards. The page eyebrow prints the full `source`
// (an import path); this is the one-word version. A Record rather than a ternary
// so TypeScript forces a decision here whenever `Source` gains a member.
export const SOURCE_BADGE: Record<Source, string> = {
    react: "react",
    "next/navigation": "next",
    "@reduxjs/toolkit": "redux",
};

// Project-level pages that are NOT documentation — about, notes, and whatever
// else belongs to the project rather than to a hook. Kept apart from HOOKS on
// purpose: these never appear in the dashboard grid or the chapter nav, only in
// the navbar's own project list above the docs.
//
// Optional per project: a project that exports nothing here simply gets no such
// list, and its navbar renders exactly as before.
export type ProjectLink = { slug: string; label: string };

export const PROJECT_LINKS: ProjectLink[] = [
    { slug: "about-next-version", label: "About next version" },
    { slug: "notes", label: "Notes" },
];

export const hookBySlug = (slug: string) => HOOKS.find((h) => h.slug === slug);

export const hooksByChapter = () =>
    CHAPTERS.map((chapter) => ({
        chapter,
        hooks: HOOKS.filter((h) => h.chapter === chapter),
    })).filter((g) => g.hooks.length > 0);