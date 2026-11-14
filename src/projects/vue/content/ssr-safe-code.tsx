import { DocSection, Code, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > difference > tip > note). It is NOT what flags a
// section header — that is the explicit `sectionSeverity` prop, and no section
// here is wholly one severity, so every callout below is inline only.
// Keys are slug(title) — the id DocSection gives the section.
// See the convention comment in @/lib/severity.
//
// THIS PAGE IS WRITTEN IN PARTS. Each part is a block of entries here, a block
// of sections in the component, and one group in the rail — so adding another
// one touches three places and nothing else.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Browser-only APIs) ---
    // inline `danger · store initialisers run on the server too`
    "where-they-are-allowed": ["danger"],
    // inline `trap · a guard in setup still causes a mismatch`
    "the-three-guards": ["trap"],

    // --- part 2 (Lifecycle on the server) ---
    // inline `note · watchers do not drive the server render`
    "what-runs-and-what-does-not": ["note"],
    // inline `danger · a leak is invisible in development`
    "what-leaks-without-unmount": ["danger"],

    // --- part 3 (Libraries and review) ---
    // inline `tip · check for SSR support first`
    "libraries-that-expect-a-browser": ["tip"],
    // "a-review-checklist" carries no callout, so it has no entry.
};

// Top-level divider between the parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in the other vue content files.
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

// PAGE RULES — readability is the point of this page:
//
// 1. Never more than two consecutive sentences of prose; a table, a list, a
//    code block or a callout breaks every run.
// 2. Every claim arrives next to its artifact — the thrown error, a guard, a
//    consequence row. No paragraph runs longer than three rendered lines.
// 3. Tables carry the comparisons, lists carry the sequences, callouts carry
//    the traps.
// 4. PURPOSE FIRST per section: what goes wrong, then the rule, then the detail.
// 5. Every fragment declares its language: ts, vue, or text for a stack trace.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 7. Component examples use <script setup lang="ts">.

// ===================================================================
// part 1 — browser-only APIs
// ===================================================================

const WINDOW_UNDEFINED = `ReferenceError: window is not defined
    at setup (Theme.vue:4:17)`;

const GUARD_ON_MOUNTED = `// 1. onMounted — the default answer
const width = ref(0)

onMounted(() => {
  width.value = window.innerWidth
})`;

const GUARD_TYPEOF = `// 2. a runtime check — for code shared by both sides
if (typeof window !== 'undefined') {
  // browser-only branch
}`;

const GUARD_SSR_FLAG = `// 3. a build-time flag — removed from the other bundle entirely
if (!import.meta.env.SSR) {
  // browser-only branch
}`;

// ===================================================================
// part 2 — lifecycle on the server
// ===================================================================

const SERVER_PREFETCH = `const post = ref<Post | null>(null)

onServerPrefetch(async () => {
  post.value = await getPost(1) // awaited before renderToString resolves
})

onMounted(async () => {
  if (!post.value) post.value = await getPost(1) // client-side navigation
})`;

const LEAKY_SETUP = `// ❌ created on the server, never cleaned up
const timer = setInterval(poll, 1000)
window.addEventListener('resize', update) // also crashes: no window

onUnmounted(() => {
  clearInterval(timer) // never called on the server
})`;

const SAFE_CLEANUP = `// ✅ nothing starts unless there is a browser to stop it
onMounted(() => {
  const timer = setInterval(poll, 1000)
  window.addEventListener('resize', update)

  onUnmounted(() => {
    clearInterval(timer)
    window.removeEventListener('resize', update)
  })
})`;

// ===================================================================
// part 3 — libraries and review
// ===================================================================

const DYNAMIC_IMPORT = `onMounted(async () => {
  const { default: Chart } = await import('some-chart-library')
  new Chart(canvas.value!, options)
})`;

const CLIENT_ONLY_GATE = `<script setup lang="ts">
import { onMounted, ref } from 'vue'

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <MapWidget v-if="mounted" />
  <p v-else>Loading map…</p>
</template>`;

export function SsrSafeCodeDocs() {
    return (
        <>
            {/* Page lead — before the first divider. Two sentences, nothing more. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    On the server there is no <Code>window</Code>, no{" "}
                    <Code>document</Code> and no storage, and no component is ever
                    unmounted — so code that assumes a browser fails the whole
                    request rather than degrading.
                </p>
                <p>
                    This page covers where browser APIs are allowed, which hooks
                    run on the server, what leaks without cleanup, and how to use
                    libraries that expect a browser.
                </p>
            </div>

            {/* ---------- part 1 — browser-only APIs ---------- */}
            <PartHeading kicker="part 1">Browser-only APIs</PartHeading>
            <div>
                <DocSection title="Where they are allowed">
                    <p>
                        Touching a browser global during a server render does not
                        degrade — it throws, for every user of that route.
                    </p>
                    <CodeBlock code={WINDOW_UNDEFINED} lang="text" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Place", "Browser APIs allowed?"]}
                        rows={[
                            [
                                "<script setup> body and setup()",
                                "no — this runs on the server",
                            ],
                            ["a computed getter", "no — evaluated during render"],
                            [
                                "a template expression",
                                "no — evaluated during render",
                            ],
                            [
                                "onMounted, onUpdated, onUnmounted",
                                "yes — browser only",
                            ],
                            [
                                "event handlers",
                                "yes — only a user can trigger them",
                            ],
                            [
                                "a watch callback",
                                "yes in practice — it fires after mount, not during the server render",
                            ],
                        ]}
                    />
                    <p>
                        The rule behind the table: anything that runs before the
                        page is in a browser must not assume a browser.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · store initialisers run on the server too"
                    >
                        <p>
                            A store that reads <Code>localStorage</Code> while
                            creating its state crashes the render exactly like a
                            component does, because its state factory runs during
                            the request (see Pinia Basics).
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="The three guards">
                    <p>
                        Three mechanisms keep browser code out of the server pass,
                        and they are not interchangeable.
                    </p>
                    <CodeBlock code={GUARD_ON_MOUNTED} lang="ts" />
                    <CodeBlock code={GUARD_TYPEOF} lang="ts" />
                    <CodeBlock code={GUARD_SSR_FLAG} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Guard", "Use for", "Note"]}
                        rows={[
                            [
                                "onMounted",
                                "anything a component needs from the browser",
                                "the server renders a placeholder value",
                            ],
                            [
                                "typeof window !== 'undefined'",
                                "utilities imported by both bundles",
                                "the branch still ships in both bundles",
                            ],
                            [
                                "import.meta.env.SSR",
                                "the same, with dead code removed per bundle",
                                "Vite-specific; Nuxt exposes import.meta.client and import.meta.server",
                            ],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · a guard in setup still causes a mismatch"
                    >
                        <p>
                            A guarded read in <Code>setup</Code> does not crash,
                            but it makes the client render something the server
                            did not (see Hydration). Values that affect the markup
                            belong in <Code>onMounted</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — lifecycle on the server ---------- */}
            <PartHeading kicker="part 2">Lifecycle on the server</PartHeading>
            <div>
                <DocSection title="What runs and what does not">
                    <p>
                        The server renders once, so only the hooks that precede a
                        first paint are called.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Hook", "On the server"]}
                        rows={[
                            [
                                "setup() — and beforeCreate, created in the Options API",
                                "runs",
                            ],
                            ["onBeforeMount", "runs"],
                            ["onMounted", "never"],
                            [
                                "onBeforeUpdate, onUpdated",
                                "never — there is no re-render",
                            ],
                            ["onBeforeUnmount, onUnmounted", "never"],
                            ["onServerPrefetch", "runs — server only"],
                        ]}
                    />
                    <p>
                        <Code>onServerPrefetch</Code> exists for awaiting data
                        during the render, so the HTML is complete when it is
                        sent.
                    </p>
                    <CodeBlock code={SERVER_PREFETCH} lang="ts" />
                    <p>
                        Frameworks replace both halves with one call — Nuxt&apos;s{" "}
                        <Code>useAsyncData</Code> and <Code>useFetch</Code> fetch
                        on the server, transfer the result, and skip the second
                        request.
                    </p>

                    <Callout
                        severity="note"
                        label="note · watchers do not drive the server render"
                    >
                        <p>
                            The server render is a single pass, so nothing
                            reactive happens during it; watchers matter only after
                            hydration.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="What leaks without unmount">
                    <p>
                        Because <Code>onUnmounted</Code> never runs on the server,
                        anything started during <Code>setup</Code> is never
                        stopped — and it is started again for every request.
                    </p>
                    <CodeBlock code={LEAKY_SETUP} lang="ts" />
                    <p>
                        One request leaks one interval; a busy route leaks one per
                        hit until the process is restarted.
                    </p>
                    <CodeBlock code={SAFE_CLEANUP} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Started in setup()", "Consequence on the server"]}
                        rows={[
                            [
                                "setInterval, setTimeout",
                                "runs for the process lifetime, once per request",
                            ],
                            [
                                "addEventListener",
                                "crashes — the target does not exist",
                            ],
                            [
                                "a WebSocket or EventSource",
                                "an open connection per request",
                            ],
                            [
                                "a watcher",
                                "harmless — it is bound to the render pass",
                            ],
                        ]}
                    />

                    <Callout
                        severity="danger"
                        label="danger · a leak is invisible in development"
                    >
                        <p>
                            A client-only dev server never shows this, because the
                            browser unmounts normally. It appears as growing
                            memory on the server after deployment.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — libraries and review ---------- */}
            <PartHeading kicker="part 3">Libraries and review</PartHeading>
            <div>
                <DocSection title="Libraries that expect a browser">
                    <p>
                        Some packages read <Code>document</Code> or{" "}
                        <Code>window</Code> when they are imported, so the import
                        itself breaks the render.
                    </p>
                    <p>
                        Loading them inside <Code>onMounted</Code> keeps them out
                        of the server bundle&apos;s execution path.
                    </p>
                    <CodeBlock code={DYNAMIC_IMPORT} lang="ts" />
                    <p>
                        When the component cannot render anything meaningful
                        without that library, the whole subtree is gated instead,
                        with a flag set after mount — the pattern Nuxt provides as
                        a <Code>ClientOnly</Code> component (see How SSR Works).
                    </p>
                    <CodeBlock code={CLIENT_ONLY_GATE} lang="vue" />

                    <Callout
                        severity="tip"
                        label="tip · check for SSR support first"
                    >
                        <p>
                            Many libraries ship an SSR-safe entry point or
                            document the guard they expect. A dynamic import
                            inside <Code>onMounted</Code> is the fallback, not the
                            first choice.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="A review checklist">
                    <p>
                        Most SSR defects are one of six recurring mistakes.
                    </p>
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            A browser global read in <Code>setup</Code>, a
                            computed or a template — move it into{" "}
                            <Code>onMounted</Code>.
                        </li>
                        <li>
                            State created at module level instead of per request —
                            one user&apos;s data renders into another&apos;s page
                            (see How SSR Works).
                        </li>
                        <li>
                            Server-fetched data not transferred, so the client
                            fetches it again and replaces what it just received.
                        </li>
                        <li>
                            A timer, listener or socket started in{" "}
                            <Code>setup</Code> — it leaks once per request.
                        </li>
                        <li>
                            A value that differs between the two renders — dates,
                            random numbers, stored preferences (see Hydration).
                        </li>
                        <li>
                            A library imported at module level that touches the
                            DOM on import.
                        </li>
                    </ol>
                    <p>
                        The single question that catches all six: would this line
                        still work if it ran in Node, once, with no DOM and no
                        unmount?
                    </p>
                </DocSection>
            </div>
        </>
    );
}
