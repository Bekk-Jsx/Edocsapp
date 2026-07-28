// Single source of truth for the navbar + dashboard.
// Every React/Next hook we'll build is already listed. The only additions are
// custom-hook PATTERN pages (e.g. useAuth) — a real hook is never added here.

export type Source = "react" | "next/navigation";

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
        slug: "use-auth", name: "useAuth", source: "react", chapter: "Context & Refs",
        summary: "Custom hook wrapping useContext with a provider guard."
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
];

export const hookBySlug = (slug: string) => HOOKS.find((h) => h.slug === slug);

export const hooksByChapter = () =>
    CHAPTERS.map((chapter) => ({
        chapter,
        hooks: HOOKS.filter((h) => h.chapter === chapter),
    })).filter((g) => g.hooks.length > 0);