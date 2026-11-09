// Single source of truth for the vue navbar + project landing.
// Mirrors the shape of projects/typescript/typescript.ts so the shared Navbar can
// be fed the same way. One entry per page: adding a topic here is what puts it
// in the sidebar and on the landing grid — array order is render order.
//
// PLAN STAGE: every page is a placeholder. `parts` is the chapter plan each
// page renders while it has no content, so the plan lives beside the nav entry
// rather than in thirty-five page files that would drift from it. Same
// arrangement the typescript registry uses for its unwritten pages.

export type VueChapter = string;

export const CHAPTERS: { id: string; label: string }[] = [
    { id: "getting-started", label: "Getting Started" },
    { id: "reactivity", label: "Reactivity" },
    { id: "components", label: "Components" },
    { id: "script-setup", label: "Script Setup" },
    { id: "templates-and-rendering", label: "Templates & Rendering" },
    { id: "composables", label: "Composables" },
    { id: "router", label: "Router" },
    { id: "state", label: "State" },
    { id: "networking", label: "Networking" },
    { id: "debugging", label: "Debugging" },
    { id: "ssr", label: "SSR" },
];

export interface VueTopic {
    slug: string; // URL segment -> /vue/<slug>
    name: string; // nav + card label
    chapter: string; // CHAPTERS id
    summary: string; // one-line blurb
    /**
     * Planned sections, rendered by the placeholder page. Dropped once the page
     * is written — a topic with no `parts` is one that no longer needs a plan.
     */
    parts?: string[];
}

export const TOPICS: VueTopic[] = [
    // — Getting Started —
    {
        slug: "app-instance", name: "The App Instance", chapter: "getting-started",
        summary: "createApp, app-scoped registration, mount and global properties — the Vue 3 replacements for the global Vue API.",
    },
    {
        slug: "single-file-components", name: "Single-File Components", chapter: "getting-started",
        summary: "Typing components with defineComponent, how .vue files are type-checked, scoped styles and component state in CSS.",
    },

    // — Reactivity —
    {
        slug: "refs-and-reactive", name: "Refs & Reactive", chapter: "reactivity",
        summary: "Reactive state outside components with reactive() and ref(), their rules and limits, typing them, and which one to use.",
    },
    {
        slug: "computed-and-watchers", name: "Computed & Watchers", chapter: "reactivity",
        summary: "Derived state with computed(), reacting to changes with watch and watchEffect, their options, and cleaning up stale async work.",
    },

    // — Components —
    {
        slug: "props-and-emits", name: "Props & Emits", chapter: "components",
        summary: "Typed props, component events and the emits option, fallthrough listeners, function props and calling child methods.",
    },
    {
        slug: "v-model", name: "v-model", chapter: "components",
        summary: "Two-way binding on components: the modelValue contract, multiple v-models with arguments, and forwarding v-model to inner inputs.",
    },
    {
        slug: "slots", name: "Slots", chapter: "components",
        summary: "Passing template content into components: default and named slots, scoped slots that send data to the parent, and typing slots with SlotsType.",
    },
    {
        slug: "provide-inject", name: "Provide & Inject", chapter: "components",
        summary: "Passing values to deep descendants without props: provide and inject, keeping provided values reactive, and typing them with InjectionKey.",
    },
    {
        slug: "lifecycle-and-attrs", name: "Lifecycle & Attrs", chapter: "components",
        summary: "Renamed and lesser-known lifecycle hooks, fallthrough attributes with inheritAttrs and $attrs, and multi-root components.",
    },

    // — Script Setup —
    {
        slug: "setup-function", name: "The setup() Function", chapter: "script-setup",
        summary: "Writing component logic grouped by feature with setup(): returned bindings, lifecycle hook functions, and the props and context arguments.",
    },
    {
        slug: "script-setup-basics", name: "Script Setup Basics", chapter: "script-setup",
        summary: "The <script setup> syntax: top-level bindings without a return, components used directly, and why such components are closed by default.",
    },
    {
        slug: "compiler-macros", name: "Compiler Macros", chapter: "script-setup",
        summary: "defineProps, defineEmits, defineModel, defineExpose, defineOptions and defineSlots — declaring a <script setup> component's API with types.",
    },
    {
        slug: "template-refs", name: "Template Refs", chapter: "script-setup",
        summary: "Accessing DOM elements and child components from <script setup> with useTemplateRef: when refs are filled, typing component refs, and refs in v-for.",
    },

    // — Templates & Rendering —
    {
        slug: "template-changes", name: "Template Changes", chapter: "templates-and-rendering",
        summary: "Template syntax that changed since Vue 2: v-if before v-for, filters replaced by functions, and new key rules for <template v-for> and v-if branches.",
    },
    {
        slug: "built-in-components", name: "Built-in Components", chapter: "templates-and-rendering",
        summary: "Teleport for modals, KeepAlive for cached views, async components for on-demand loading, and the renamed Transition classes.",
    },
    {
        slug: "rendering-under-the-hood", name: "Rendering Under the Hood", chapter: "templates-and-rendering",
        summary: "Why DOM updates are batched and when nextTick is needed, and how a template becomes DOM: render function, virtual DOM and patching.",
    },

    // — Composables —
    {
        slug: "writing-composables", name: "Writing Composables", chapter: "composables",
        summary: "Reusable reactive logic as plain functions: why composables replace mixins, the conventions, flexible arguments with toValue, and when not to write one.",
    },
    {
        slug: "async-composables", name: "Async Composables", chapter: "composables",
        summary: "One composable for async state: data, loading and error refs, re-fetching when a reactive source changes, and aborting stale requests.",
    },

    // — Router —
    {
        slug: "router-setup", name: "Router Setup", chapter: "router",
        summary: "Vue Router 4 and what changed from v3.",
        parts: [
            "createRouter + history modes",
            "RouterView / RouterLink",
            "this.$route vs useRoute / useRouter",
        ],
    },
    {
        slug: "navigation-and-params", name: "Navigation & Params", chapter: "router",
        summary: "Params, query, programmatic navigation and lazy routes.",
        parts: [
            "params and query",
            "programmatic navigation",
            "typed params",
            "lazy-loaded routes",
        ],
    },
    {
        slug: "guards", name: "Guards", chapter: "router",
        summary: "Controlling navigation.",
        parts: [
            "global guards",
            "per-route guards",
            "in-component guards",
            "next() optional",
        ],
    },

    // — State —
    {
        slug: "pinia-basics", name: "Pinia Basics", chapter: "state",
        summary: "Typed stores with Pinia, and how they compare to Vuex.",
        parts: [
            "Pinia vs Vuex",
            "options store",
            "typed state / getters / actions",
            "using stores in the main syntax",
        ],
    },
    {
        slug: "setup-stores", name: "Setup Stores", chapter: "state",
        summary: "Stores written like composables.",
        parts: [
            "setup store",
            "storeToRefs",
            "stores using stores",
        ],
    },
    {
        slug: "persist-and-plugins", name: "Persisting & Plugins", chapter: "state",
        summary: "Keeping store data and extending Pinia.",
        parts: [
            "persisting to localStorage",
            "$subscribe",
            "$reset",
            "plugins",
        ],
    },
    {
        slug: "pinia-devtools", name: "Pinia in DevTools", chapter: "state",
        summary: "Inspecting stores with the Vue DevTools extension.",
        parts: [
            "store inspector",
            "editing state live",
            "timeline",
            "time travel",
        ],
    },

    // — Networking —
    {
        slug: "fetching-data", name: "Fetching Data", chapter: "networking",
        summary: "Calling a real API with typed responses.",
        parts: [
            "typed fetch",
            "loading / error state",
            "where to fetch",
            "aborting requests",
        ],
    },
    {
        slug: "network-panel", name: "The Network Panel", chapter: "networking",
        summary: "Watching requests and responses in Chrome DevTools.",
        parts: [
            "request list + filters",
            "headers / payload / response",
            "status codes",
            "timing waterfall",
            "throttling and preserve log",
        ],
    },
    {
        slug: "cors-and-caching", name: "CORS & Caching", chapter: "networking",
        summary: "Why requests get blocked or served from cache.",
        parts: [
            "CORS",
            "preflight (OPTIONS)",
            "cache headers + 304",
        ],
    },

    // — Debugging —
    {
        slug: "breakpoints-and-stepping", name: "Breakpoints & Stepping", chapter: "debugging",
        summary: "Pausing and walking through code in the Sources panel.",
        parts: [
            "debugger statement",
            "breakpoints",
            "step over / into / out",
            "scope, watch and call stack",
            "conditional breakpoints + logpoints",
        ],
    },
    {
        slug: "source-maps", name: "Source Maps", chapter: "debugging",
        summary: "How .vue code maps back from what the browser runs.",
        parts: [
            "what source maps are",
            "Vite source maps for .vue files",
        ],
    },
    {
        slug: "vue-devtools", name: "Vue DevTools", chapter: "debugging",
        summary: "Inspecting components, events and reactivity.",
        parts: [
            "component tree",
            "editing props / state",
            "events timeline",
            "onRenderTracked / onRenderTriggered",
        ],
    },

    // — SSR —
    {
        slug: "how-ssr-works", name: "How SSR Works", chapter: "ssr",
        summary: "Rendering on the server and taking over in the browser.",
        parts: [
            "server render to HTML",
            "client hydration",
            "CSR vs SSR",
        ],
    },
    {
        slug: "hydration", name: "Hydration", chapter: "ssr",
        summary: "Hydration mismatches and how to debug them.",
        parts: [
            "what hydration does",
            "mismatches",
            "debugging mismatches",
            "lazy hydration",
        ],
    },
    {
        slug: "ssr-safe-code", name: "SSR-Safe Code", chapter: "ssr",
        summary: "Writing components that run on server and client.",
        parts: [
            "browser-only APIs",
            "lifecycle on the server",
            "per-request state",
            "server data fetching + state transfer",
        ],
    },
];

// Project-level pages that are NOT documentation — kept apart from TOPICS on
// purpose: these never appear in the landing grid or the chapter nav, only in
// the navbar's own project list above the docs. Same shape, and the same
// optional treatment, as the redis project's PROJECT_LINKS.
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
