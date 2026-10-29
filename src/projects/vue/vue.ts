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
        summary: "Typed component inputs and outputs.",
        parts: [
            "props with PropType",
            "validation and defaults",
            "typed emits option",
            "$listeners merged into $attrs",
        ],
    },
    {
        slug: "v-model", name: "v-model", chapter: "components",
        summary: "Two-way binding on components.",
        parts: [
            "modelValue / update:modelValue",
            "multiple v-models",
            ".sync removed",
            "custom modifiers",
        ],
    },
    {
        slug: "slots", name: "Slots", chapter: "components",
        summary: "Passing template content into components.",
        parts: [
            "default and named slots",
            "scoped slots",
            "$scopedSlots removed",
            "typing slots",
        ],
    },
    {
        slug: "provide-inject", name: "Provide & Inject", chapter: "components",
        summary: "Passing data deep without props.",
        parts: [
            "provide / inject",
            "reactive provide",
            "InjectionKey typing",
        ],
    },
    {
        slug: "lifecycle-and-attrs", name: "Lifecycle & Attrs", chapter: "components",
        summary: "Hooks, fallthrough attributes and multi-root components.",
        parts: [
            "renamed hooks",
            "attrs fallthrough",
            "inheritAttrs",
            "fragments (multi-root)",
        ],
    },

    // — Script Setup —
    {
        slug: "setup-function", name: "The setup() Function", chapter: "script-setup",
        summary: "Using setup() inside defineComponent.",
        parts: [
            "setup() option",
            "props and context args",
            "no `this`",
            "returning bindings",
        ],
    },
    {
        slug: "script-setup-basics", name: "Script Setup Basics", chapter: "script-setup",
        summary: "The <script setup> syntax and what it compiles to.",
        parts: [
            "top-level bindings in the template",
            "using imported components",
            "compiled output",
        ],
    },
    {
        slug: "compiler-macros", name: "Compiler Macros", chapter: "script-setup",
        summary: "defineProps, defineEmits, defineModel and friends.",
        parts: [
            "typed defineProps + destructure defaults",
            "typed defineEmits",
            "defineModel",
            "defineExpose",
            "defineSlots / defineOptions",
        ],
    },
    {
        slug: "template-refs", name: "Template Refs", chapter: "script-setup",
        summary: "Accessing DOM elements and child components.",
        parts: [
            "ref attribute",
            "useTemplateRef",
            "typing component refs",
        ],
    },

    // — Templates & Rendering —
    {
        slug: "template-changes", name: "Template Changes", chapter: "templates-and-rendering",
        summary: "What changed in template syntax since Vue 2.",
        parts: [
            "v-if / v-for priority",
            "key on <template>",
            "filters removed",
            ".native removed",
        ],
    },
    {
        slug: "built-in-components", name: "Built-in Components", chapter: "templates-and-rendering",
        summary: "Teleport, KeepAlive, Transition, Suspense and async components.",
        parts: [
            "Teleport",
            "KeepAlive",
            "Transition class changes",
            "async components",
            "Suspense",
        ],
    },
    {
        slug: "rendering-under-the-hood", name: "Rendering Under the Hood", chapter: "templates-and-rendering",
        summary: "From template to DOM, kept to the essentials.",
        parts: [
            "template → render function",
            "virtual DOM + patch flags",
            "batched updates and nextTick",
            "Vapor mode (brief)",
        ],
    },

    // — Composables —
    {
        slug: "writing-composables", name: "Writing Composables", chapter: "composables",
        summary: "Reusable logic that replaces mixins.",
        parts: [
            "mixins vs composables",
            "conventions",
            "ref arguments with toValue",
            "using composables from the main syntax",
        ],
    },
    {
        slug: "async-composables", name: "Async Composables", chapter: "composables",
        summary: "Composables with side effects and async data.",
        parts: [
            "lifecycle-bound side effects",
            "async state",
            "effectScope",
        ],
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
