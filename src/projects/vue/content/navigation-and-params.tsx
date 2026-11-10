import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > difference > tip > note). It is NOT what flags a
// section header — that is the explicit `sectionSeverity` prop, and no section
// here is wholly one severity, so every callout below is inline only.
// Keys are slug(title) — the id DocSection gives the section.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Dynamic routes and params) ---
    // "dynamic-segments" carries no callout, so it has no entry.
    // inline `tip · typed routes`
    "params-are-strings": ["tip"],

    // --- part 2 (Param changes) ---
    // inline `trap · onMounted misses param changes`
    "same-component-new-param": ["trap"],

    // --- part 3 (Params vs query) ---
    // inline `trap · the query object replaces, not merges`
    "params-vs-query": ["trap"],
};

// Top-level divider between the parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in the typescript content files.
function PartHeading({
    kicker,
    children,
}: {
    kicker: string;
    children: string;
}) {
    return (
        <div className="mt-14 mb-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {kicker}
            </p>
            <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

// The grid table the typescript pages use, copied unchanged.
// `cols` is a literal grid-template-columns utility so Tailwind sees it at build time.
function GridTable({
    cols,
    head,
    rows,
}: {
    cols: string;
    head: string[];
    rows: string[][];
}) {
    const cell = "px-3 py-2";
    const ruled = `${cell} border-b border-[var(--border)]`;
    return (
        <div
            className={`grid ${cols} overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[0.75rem]`}
        >
            {head.map((h) => (
                <div key={h} className={`${ruled} text-[var(--text)]`}>
                    {h}
                </div>
            ))}
            {rows.map((row, r) =>
                row.map((value, c) => (
                    <div
                        key={`${r}-${c}`}
                        // last row keeps the outer border as its only rule
                        className={`${r === rows.length - 1 ? cell : ruled} ${
                            c === 0 ? "text-[var(--accent)]" : "text-[var(--muted)]"
                        }`}
                    >
                        {value}
                    </div>
                )),
            )}
        </div>
    );
}

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. Every fragment declares its language: ts or vue. Component examples use
//    <script setup lang="ts">.
// 4. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — dynamic routes and params
// ===================================================================

const DYNAMIC_ROUTE = `// router/index.ts
{
  path: '/users/:id',
  name: 'user-detail',
  component: () => import('@/views/UserDetailView.vue'),
},`;

const DYNAMIC_LINK = `<RouterLink :to="{ name: 'user-detail', params: { id: u.id } }">
  {{ u.name }}
</RouterLink>`;

const READ_PARAM = `const route = useRoute()
route.params.id // '2' for /users/2`;

const PARAM_STRING_BROKEN = `fetchUser(route.params.id)
// ❌ string is not assignable to parameter of type 'number'`;

const PARAM_STRING_FIXED = `const userId = computed(() => Number(route.params.id))`;

// ===================================================================
// part 2 — param changes
// ===================================================================

const ON_MOUNTED_FETCH = `const route = useRoute()
const user = ref<User | null>(null)

onMounted(async () => {
  user.value = await fetchUser(Number(route.params.id))
  // ❌ runs once; a param change never refetches
})`;

const WATCH_PARAM = `const userId = computed(() => Number(route.params.id))

watch(userId, async (id) => {
  user.value = await fetchUser(id)
}, { immediate: true })`;

const KEYED_VIEW = `<RouterView :key="route.fullPath" />`;

// ===================================================================
// part 3 — params vs query
// ===================================================================

const QUERY_SEARCH = `<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const q = computed({
  get: () => (route.query.q as string) ?? '',
  set: (value) => {
    router.replace({ query: value ? { q: value } : {} })
  },
})

const filtered = computed(() =>
  users.filter((u) => u.name.toLowerCase().includes(q.value.toLowerCase())),
)
</script>

<template>
  <input v-model="q" placeholder="Search users…" />
</template>`;

export function NavigationAndParamsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A <Term>dynamic route</Term> turns one route definition into a
                    detail page for every resource. The captured segments arrive as{" "}
                    <Term>params</Term>; options such as search and sort travel as the{" "}
                    <Term>query</Term>.
                </p>
                <p>
                    This page covers dynamic routes, the string nature of params,
                    reacting to param changes in a reused component, and choosing
                    between params and query.
                </p>
            </div>

            {/* ---------- part 1 — dynamic routes and params ---------- */}
            <PartHeading kicker="part 1">Dynamic routes and params</PartHeading>
            <div>
                <DocSection title="Dynamic segments">
                    <p>
                        A detail page per user cannot be one route per user — users
                        come from data. One route must match <Code>/users/1</Code>,{" "}
                        <Code>/users/2</Code>, … and tell the component which id it
                        received.
                    </p>
                    <p>A dynamic segment with a colon captures part of the path:</p>
                    <CodeBlock code={DYNAMIC_ROUTE} lang="ts" />
                    <p>Links pass the param by route name:</p>
                    <CodeBlock code={DYNAMIC_LINK} lang="vue" />
                    <p>The component reads it from the reactive route:</p>
                    <CodeBlock code={READ_PARAM} lang="ts" />
                    <p>
                        The router matches the URL against the patterns in{" "}
                        <Code>routes</Code> and fills <Code>route.params</Code> with the
                        captured segments. A path may contain several segments (
                        <Code>/users/:id/posts/:postId</Code>). Reloading a dynamic URL
                        restores the same view: the URL carries the state. Lazy loading
                        of route components is covered on Router Setup.
                    </p>
                </DocSection>

                <DocSection title="Params are strings">
                    <p>The URL is text, so every param is a string:</p>
                    <CodeBlock code={PARAM_STRING_BROKEN} lang="ts" />
                    <p>Convert once, at the edge, into a typed reactive value:</p>
                    <CodeBlock code={PARAM_STRING_FIXED} lang="ts" />
                    <p>
                        <Code>route.params.id</Code> is typed{" "}
                        <Code>{"string | string[]"}</Code> — arrays come from
                        repeatable segments such as <Code>:id+</Code>. For a normal
                        segment, <Code>Number(route.params.id)</Code> suffices; strict
                        code writes <Code>Number(route.params.id as string)</Code>.
                    </p>

                    <Callout severity="tip" label="tip · typed routes">
                        <p>
                            <Code>unplugin-vue-router</Code> generates literal types per
                            route name (typed params on <Code>push</Code>) with
                            file-based routing — a different setup from a manual{" "}
                            <Code>routes</Code> array.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — param changes ---------- */}
            <PartHeading kicker="part 2">Param changes</PartHeading>
            <div>
                <DocSection title="Same component, new param">
                    <p>
                        Navigating <Code>/users/1</Code> → <Code>/users/2</Code> matches
                        the same route, so the router reuses the component instance —
                        no unmount, no remount. Data fetched in{" "}
                        <Code>onMounted</Code> goes stale: the URL and reactive route
                        update, but <Code>onMounted</Code> already ran and nothing
                        refetches. Entered from outside, the page is correct (a fresh
                        mount); switching inside, it shows the previous user&apos;s
                        data:
                    </p>
                    <CodeBlock code={ON_MOUNTED_FETCH} lang="ts" />
                    <p>
                        React to the param instead of the lifecycle: watch it, with an
                        immediate first run.
                    </p>
                    <CodeBlock code={WATCH_PARAM} lang="ts" />
                    <p>
                        An async composable with a reactive source —{" "}
                        <Code>{"useAsyncData(userId, (id, signal) => fetchUser(id, signal))"}</Code>{" "}
                        — is the same watch packaged with loading, error and aborting of
                        stale requests (see Async Composables).
                    </p>
                    <p>
                        The blunt alternative forces a remount by keying the view: a
                        changed key destroys and recreates the component (see Template
                        Changes), so mounted logic runs again — at the cost of all view
                        state and a refetch of everything on every param change:
                    </p>
                    <CodeBlock code={KEYED_VIEW} lang="vue" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "watch / source", ':key="route.fullPath"']}
                        rows={[
                            ["Refetches", "only what watches the param", "everything in the view"],
                            ["Keeps view state (scroll, inputs)", "yes", "no"],
                            ["Where the change lives", "in the view", "one attribute on RouterView"],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · onMounted misses param changes"
                    >
                        <p>
                            A reused route component never remounts. Fetch logic must
                            watch the param, not run once on mount.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — params vs query ---------- */}
            <PartHeading kicker="part 3">Params vs query</PartHeading>
            <div>
                <DocSection title="Params vs query">
                    <p>
                        A search box on a list view needs its text somewhere. In a ref,
                        the filter dies on reload and the filtered view cannot be shared
                        or bookmarked. In the path it would change the resource&apos;s
                        identity — <Code>/users/ada</Code> means the user ada, not a
                        search.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Params", "Query"]}
                        rows={[
                            ["In the URL", "/users/2", "/users?q=ada&sort=name"],
                            ["Answers", "which resource", "how to view it"],
                            ["Declared in routes", "yes (:id)", "no — every route accepts any query"],
                            ["Missing", "route does not match", "fine, optional by nature"],
                            ["Typical values", "ids, slugs", "search, filters, sort, page"],
                        ]}
                    />
                    <p>
                        A writable computed (see v-model) makes the URL the single owner
                        of the search state: <Code>get</Code> reads the query,{" "}
                        <Code>set</Code> navigates.
                    </p>
                    <CodeBlock code={QUERY_SEARCH} lang="vue" />
                    <p>
                        Typing navigates, the URL updates to <Code>/users?q=…</Code>,
                        the reactive route feeds the computed back, and the filter
                        survives reloads and works in a shared link.
                    </p>
                    <p>
                        <Code>replace</Code> instead of <Code>push</Code> — every
                        keystroke navigates, and <Code>push</Code> would add one history
                        entry per character, so Back would walk through{" "}
                        <Code>a</Code>, <Code>ad</Code>, <Code>ada</Code>;{" "}
                        <Code>replace</Code> overwrites the current entry. Query values
                        are strings (<Code>{"string | string[] | null"}</Code>),
                        converted like params:{" "}
                        <Code>Number(route.query.page ?? 1)</Code>.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the query object replaces, not merges"
                    >
                        <p>
                            <Code>{"{ query: { q: value } }"}</Code> drops every other
                            query key. To keep them:{" "}
                            <Code>{"{ query: { ...route.query, q: value } }"}</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
