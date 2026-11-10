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
    // --- part 1 (Protected routes) ---
    // inline `vue 2 → 3 · next() is optional` + `note · guards need current state first`
    "signed-in-only": ["difference", "note"],

    // --- part 2 (Role-based routes) ---
    // inline `tip · rules as data`
    "admin-only": ["tip"],

    // --- part 3 (Leave guards) ---
    // inline `vue 2 → 3 · component guard names`
    "unsaved-changes": ["difference"],
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
// part 1 — protected routes
// ===================================================================

const PROTECTED_ROUTE = `{ path: '/users', name: 'users', component: UsersView, meta: { requiresAuth: true } },`;

const BEFORE_EACH_AUTH = `// router/index.ts
import { session } from '@/stores/session'

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !session.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})`;

const LOGIN_VIEW = `<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/stores/session'

const route = useRoute()
const router = useRouter()

function onLogin() {
  login('Ada', 'user')
  router.push((route.query.redirect as string) ?? '/')
}
</script>`;

// ===================================================================
// part 2 — role-based routes
// ===================================================================

const ADMIN_ROUTE = `{ path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, role: 'admin' } },`;

const BEFORE_EACH_ROLE = `router.beforeEach((to) => {
  if (to.meta.requiresAuth && !session.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.role && session.user?.role !== to.meta.role) {
    return { name: 'home' }
  }
})`;

const ROUTE_META_TYPES = `declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    role?: 'admin'
  }
}`;

const BEFORE_ENTER = `{
  path: '/admin',
  component: AdminView,
  meta: { requiresAuth: true },
  beforeEnter: () => {
    if (session.user?.role !== 'admin') {
      return { name: 'home' }
    }
  },
},`;

// ===================================================================
// part 3 — leave guards
// ===================================================================

const ON_BEFORE_ROUTE_LEAVE = `<script setup lang="ts">
import { computed, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const saved = ref('dark')
const theme = ref(saved.value)
const dirty = computed(() => theme.value !== saved.value)

onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('Discard unsaved changes?')) {
    return false
  }
})
</script>`;

const AFTER_EACH = `router.afterEach((to) => {
  document.title = \`\${String(to.name)} · App\`
})`;

export function GuardsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Term>Navigation guards</Term> run before a route renders. They are
                    where routes get protected: signed-in only, role-restricted, or
                    guarded against leaving with unsaved changes.
                </p>
                <p>
                    This page covers the global <Code>beforeEach</Code> with route{" "}
                    <Code>meta</Code>, role-based access, and component leave guards.
                </p>
            </div>

            {/* ---------- part 1 — protected routes ---------- */}
            <PartHeading kicker="part 1">Protected routes</PartHeading>
            <div>
                <DocSection title="Signed-in only">
                    <p>
                        A route like <Code>/users</Code> must not exist for signed-out
                        visitors. Hiding the link is no protection — URLs can be typed.
                        The check has to run before the route renders, in one place, not
                        in every protected view.
                    </p>
                    <p>
                        Protected routes are marked with <Code>meta</Code>:
                    </p>
                    <CodeBlock code={PROTECTED_ROUTE} lang="ts" />
                    <p>One global guard enforces it:</p>
                    <CodeBlock code={BEFORE_EACH_AUTH} lang="ts" />
                    <p>
                        <Code>beforeEach</Code> runs on every navigation, including the
                        first URL load, so a directly typed <Code>/users</Code> is
                        caught. <Code>to</Code> is the target route;{" "}
                        <Code>to.meta</Code> merges the meta of all matched records, so
                        a flag on a parent covers its children. The protected view
                        itself contains no auth code.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Guard returns", "Effect"]}
                        rows={[
                            ["undefined or true", "navigation proceeds"],
                            ["false", "cancelled — URL and view stay"],
                            ["a route location ({ name: 'login' })", "redirect there instead"],
                        ]}
                    />
                    <p>
                        <Code>{"query: { redirect: to.fullPath }"}</Code> preserves the
                        original target, including params. The login view sends the user
                        back after signing in:
                    </p>
                    <CodeBlock code={LOGIN_VIEW} lang="vue" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · next() is optional"
                    >
                        <p>
                            Vue 2 guards had to call <Code>next()</Code> in every branch
                            — a forgotten call froze navigation forever. Vue Router 4
                            guards return their decision instead; <Code>next</Code>{" "}
                            still exists, but returning is the recommended form.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · guards need current state first"
                    >
                        <p>
                            The session store reads <Code>localStorage</Code> at module
                            load, before the first guard runs, so a reload keeps the
                            user signed in.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — role-based routes ---------- */}
            <PartHeading kicker="part 2">Role-based routes</PartHeading>
            <div>
                <DocSection title="Admin only">
                    <p>
                        Some routes need more than a signed-in user —{" "}
                        <Code>/admin</Code> requires the <Code>admin</Code> role. The
                        rule should stay data, not become copied code.
                    </p>
                    <p>
                        The role goes into <Code>meta</Code> next to{" "}
                        <Code>requiresAuth</Code>:
                    </p>
                    <CodeBlock code={ADMIN_ROUTE} lang="ts" />
                    <p>
                        The same global guard enforces both, layered: signed in first,
                        then the role.
                    </p>
                    <CodeBlock code={BEFORE_EACH_ROLE} lang="ts" />
                    <p>
                        Redirecting is friendlier than returning <Code>false</Code>: on
                        a direct URL load, <Code>false</Code> leaves a blank stay, while
                        the redirect lands somewhere meaningful. Hiding the admin link
                        in the nav (
                        <Code>{"v-if=\"session.user?.role === 'admin'\""}</Code>) is UX;
                        the guard is the protection.
                    </p>
                    <p>
                        <Code>meta</Code> is untyped by default. Augmenting{" "}
                        <Code>RouteMeta</Code> types the flags, so a misspelled role
                        fails to compile — the same module augmentation as{" "}
                        <Code>ComponentCustomProperties</Code> on The App Instance:
                    </p>
                    <CodeBlock code={ROUTE_META_TYPES} lang="ts" />
                    <p>
                        The alternative for one-off rules on a single route is{" "}
                        <Code>beforeEnter</Code>, a guard on the route record itself. It
                        runs after the global <Code>beforeEach</Code> and only when the
                        route is entered — not on param-only changes within it:
                    </p>
                    <CodeBlock code={BEFORE_ENTER} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "meta + global guard", "beforeEnter per route"]}
                        rows={[
                            ["Rules visible", "in one place", "spread across routes"],
                            ["Adding a protected route", "add meta flags", "write a guard again"],
                            ["The rule is", "data (role: 'admin')", "code"],
                            ["Fits", "uniform rules: auth, roles", "one-off rules for one route"],
                        ]}
                    />

                    <Callout severity="tip" label="tip · rules as data">
                        <p>
                            For auth and roles, prefer <Code>meta</Code> flags with one
                            enforcing guard; reach for <Code>beforeEnter</Code> only for
                            rules unique to one route.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — leave guards ---------- */}
            <PartHeading kicker="part 3">Leave guards</PartHeading>
            <div>
                <DocSection title="Unsaved changes">
                    <p>
                        Half-filled forms die on a misclicked nav link.{" "}
                        <Code>onUnmounted</Code> cannot help — when it runs, the
                        navigation has already happened.
                    </p>
                    <p>
                        <Code>onBeforeRouteLeave</Code> registers a guard in the
                        component that can veto navigations away from its route:
                    </p>
                    <CodeBlock code={ON_BEFORE_ROUTE_LEAVE} lang="vue" />
                    <p>
                        It registers like a lifecycle hook — top level of{" "}
                        <Code>{"<script setup>"}</Code>, same rules as{" "}
                        <Code>onMounted</Code> — and uses the same return values as
                        every guard: <Code>false</Code> cancels, URL and view stay. Only
                        router navigations are caught; closing the tab is the
                        browser&apos;s native <Code>beforeunload</Code> event.
                    </p>
                    <p>
                        <Code>onBeforeRouteUpdate</Code> is the sibling for param-only
                        changes (<Code>/users/2</Code> → <Code>/users/3</Code>) — the
                        guard-flavored alternative to watching <Code>route.params</Code>{" "}
                        (see Navigation &amp; Params). The global <Code>afterEach</Code>{" "}
                        runs after a completed navigation and can cancel nothing — the
                        place for document titles and analytics:
                    </p>
                    <CodeBlock code={AFTER_EACH} lang="ts" />

                    <Callout
                        severity="difference"
                        label="vue 2 → 3 · component guard names"
                    >
                        <p>
                            The Options API options <Code>beforeRouteLeave</Code> and{" "}
                            <Code>beforeRouteUpdate</Code> are unchanged; new are the
                            setup composables <Code>onBeforeRouteLeave</Code> and{" "}
                            <Code>onBeforeRouteUpdate</Code>.{" "}
                            <Code>beforeRouteEnter</Code> has no composable — before
                            entering, the component does not exist yet;{" "}
                            <Code>beforeEnter</Code> or data loading in the view covers
                            its job.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
