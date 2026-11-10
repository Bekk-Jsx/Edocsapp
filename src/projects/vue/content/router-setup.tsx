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
    // --- part 1 (createRouter) ---
    // inline `vue 2 → 3 · router setup`
    "createrouter-and-history-modes": ["difference"],

    // --- part 2 (RouterLink and RouterView) ---
    // inline `vue 2 → 3 · RouterLink changes`
    "routerlink-and-routerview": ["difference"],

    // --- part 3 (useRouter and useRoute) ---
    // inline `trap · don't destructure route`
    "userouter-and-useroute": ["trap"],
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
// 4. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 5. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — createRouter
// ===================================================================

const ROUTER_INDEX = `// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/users', name: 'users', component: () => import('@/views/UsersView.vue') },
  ],
})`;

const ROUTER_MAIN = `// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')`;

// ===================================================================
// part 2 — RouterLink and RouterView
// ===================================================================

const APP_NAV = `<template>
  <main>
    <nav class="nav">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink :to="{ name: 'users' }">Users</RouterLink>
    </nav>
    <RouterView />
  </main>
</template>`;

const ACTIVE_STYLE = `<style scoped>
.nav a.router-link-active {
  color: var(--accent);
  font-weight: 600;
}
</style>`;

// ===================================================================
// part 3 — useRouter and useRoute
// ===================================================================

const USE_ROUTER_ROUTE = `<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const router = useRouter() // navigate
const route = useRoute()   // read the current location

function onLogin() {
  router.push({ name: 'users' })
}
</script>

<template>
  <p>Current path: <code>{{ route.path }}</code></p>
  <button @click="onLogin">Log in</button>
</template>`;

const DESTRUCTURED_ROUTE = `const { path } = useRoute() // ❌ frozen at the current value`;

export function RouterSetupDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Vue 3 pairs with <Term>Vue Router 4</Term>. The setup follows the
                    app-instance pattern: a router created by a function, registered
                    with <Code>app.use</Code>, with no shared global.
                </p>
                <p>
                    This page covers creating the router, the two navigation
                    components, and the composables that replace{" "}
                    <Code>this.$router</Code> and <Code>this.$route</Code>. Params,
                    guards and protected routes follow on the next pages.
                </p>
            </div>

            {/* ---------- part 1 — createRouter ---------- */}
            <PartHeading kicker="part 1">createRouter</PartHeading>
            <div>
                <DocSection title="createRouter and history modes">
                    <p>
                        Without a router, switching views means <Code>v-if</Code> on
                        local state: the URL never changes, reloading loses the view,
                        back and forward do nothing, and no view is linkable.
                    </p>
                    <p>
                        Vue Router maps URLs to components. The router is created with{" "}
                        <Code>createRouter</Code> and registered on the app. The route
                        table lives in its own module:
                    </p>
                    <CodeBlock code={ROUTER_INDEX} lang="ts" />
                    <p>The entry file registers it on the app instance:</p>
                    <CodeBlock code={ROUTER_MAIN} lang="ts" />
                    <p>
                        <Code>app.use(router)</Code> registers <Code>RouterView</Code>{" "}
                        and <Code>RouterLink</Code> globally and provides the router to
                        every component. The <Code>history</Code> option replaces Vue
                        2&apos;s <Code>mode</Code> string with a function.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Vue 2", "Vue 3", "URL"]}
                        rows={[
                            ["mode: 'history'", "createWebHistory()", "/users"],
                            ["mode: 'hash'", "createWebHashHistory()", "/#/users"],
                        ]}
                    />
                    <p>
                        <Code>createWebHistory()</Code> is the normal choice; the
                        server must answer every path with <Code>index.html</Code> (the
                        Vite dev server does). <Code>createWebHashHistory()</Code> is
                        the fallback without server control, since everything after{" "}
                        <Code>#</Code> never reaches the server.{" "}
                        <Code>{"component: () => import(…)"}</Code> declares a{" "}
                        <Term>lazy route</Term>: the view becomes its own chunk, loaded
                        on first visit — the plain function form, without{" "}
                        <Code>defineAsyncComponent</Code> (see Built-in Components).
                    </p>

                    <Callout severity="difference" label="vue 2 → 3 · router setup">
                        <p>
                            <Code>{"new VueRouter({ mode: 'history' })"}</Code> →{" "}
                            <Code>{"createRouter({ history: createWebHistory() })"}</Code>
                            ; <Code>Vue.use(VueRouter)</Code> →{" "}
                            <Code>app.use(router)</Code>. The <Code>routes</Code> array
                            is unchanged.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — RouterLink and RouterView ---------- */}
            <PartHeading kicker="part 2">RouterLink and RouterView</PartHeading>
            <div>
                <DocSection title="RouterLink and RouterView">
                    <p>
                        A plain <Code>{'<a href="/users">'}</Code> triggers a full page
                        load: the app is thrown away, all JavaScript downloads again,
                        and every store resets.
                    </p>
                    <p>
                        <Code>RouterLink</Code> navigates without a reload;{" "}
                        <Code>RouterView</Code> is the placeholder where the matched
                        component renders. The root component holds both:
                    </p>
                    <CodeBlock code={APP_NAV} lang="vue" />
                    <p>
                        <Code>RouterLink</Code> renders a real <Code>{"<a>"}</Code> but
                        intercepts the click, updates the URL through the History API
                        and lets the router swap the view — state survives, and
                        Ctrl/Cmd-click still opens a new tab. A route change swaps only
                        the <Code>RouterView</Code> spot; everything around it stays
                        mounted. Navigating by name decouples links from paths:
                        renaming a path in the <Code>routes</Code> array updates every
                        link.
                    </p>
                    <p>The link matching the current URL gets CSS classes automatically.</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Class", "Applied when"]}
                        rows={[
                            [
                                "router-link-active",
                                "the URL starts with the target (/users/3 keeps /users active)",
                            ],
                            ["router-link-exact-active", "the URL is exactly the target"],
                        ]}
                    />
                    <p>A scoped style targets the active link through that class:</p>
                    <CodeBlock code={ACTIVE_STYLE} lang="vue" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · RouterLink changes"
                    >
                        <p>
                            The <Code>tag</Code> prop is removed; custom elements use{" "}
                            <Code>
                                {'<RouterLink to="/users" custom v-slot="{ navigate, isActive }">'}
                            </Code>
                            . The <Code>append</Code> prop is gone, and exact matching
                            is expressed by the two classes.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — useRouter and useRoute ---------- */}
            <PartHeading kicker="part 3">useRouter and useRoute</PartHeading>
            <div>
                <DocSection title="useRouter and useRoute">
                    <p>
                        Vue 2 components navigated with <Code>this.$router</Code> and
                        read the URL from <Code>this.$route</Code>.{" "}
                        <Code>{"<script setup>"}</Code> has no <Code>this</Code> — and
                        navigation often starts in code, such as after a successful
                        login.
                    </p>
                    <p>
                        Two composables from <Code>vue-router</Code> take their place:
                    </p>
                    <CodeBlock code={USE_ROUTER_ROUTE} lang="vue" />
                    <p>
                        <Code>router</Code> is the object created in{" "}
                        <Code>router/index.ts</Code>; <Code>push</Code> takes the same
                        values as <Code>to</Code> (a path string or{" "}
                        <Code>{"{ name, params, query }"}</Code>) and adds a history
                        entry — <Code>replace</Code> does not. <Code>RouterLink</Code>{" "}
                        calls <Code>push</Code> internally. <Code>route</Code> is a
                        reactive object describing the current location; read in a
                        template, <Code>computed</Code> or <Code>watch</Code>, it is
                        tracked, and every navigation updates what read it.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Options API", "<script setup>"]}
                        rows={[
                            ["this.$router.push(…)", "useRouter().push(…)"],
                            ["this.$route.params.id", "useRoute().params.id"],
                        ]}
                    />
                    <p>
                        In the Options API, <Code>this.$router</Code> and{" "}
                        <Code>this.$route</Code> remain available unchanged. Destructuring
                        the route, by contrast, reads its fields once:
                    </p>
                    <CodeBlock code={DESTRUCTURED_ROUTE} lang="ts" />

                    <Callout severity="trap" label="trap · don't destructure route">
                        <p>
                            <Code>route</Code> is reactive as an object, like props.
                            Read <Code>route.path</Code> where it is needed, or wrap it
                            in <Code>{"computed(() => route.path)"}</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
