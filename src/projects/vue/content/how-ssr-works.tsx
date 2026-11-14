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
    // --- part 1 (What the browser receives) ---
    // inline `note · SSR moves content, not interactivity` + `note · frameworks
    // do this in practice` — one entry, the rail shows one icon per severity
    "an-empty-div-or-the-page": ["note"],
    // "the-application-renders-twice" carries no callout, so it has no entry.

    // --- part 2 (Universal components) ---
    // inline `danger · never touch the DOM in setup`
    "the-same-component-runs-in-both-places": ["danger"],
    // inline `trap · reading browser state in setup causes a mismatch`
    "when-the-html-needs-browser-data": ["trap"],

    // --- part 3 (One app per request) ---
    // inline `danger · one leak is a data leak`
    "module-state-is-shared-on-the-server": ["danger"],
    // inline `danger · escape the serialised state` + `note · the framework
    // equivalents`
    "transferring-the-state": ["danger", "note"],
    // "turning-ssr-on" carries no callout, so it has no entry.
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
// 2. Every claim arrives next to its artifact — the served HTML, a render
//    output, a comparison row. No paragraph runs longer than three rendered
//    lines.
// 3. Tables carry the comparisons, lists carry the sequences, callouts carry
//    the traps.
// 4. PURPOSE FIRST per section: what goes wrong, then the mechanism, then the
//    detail.
// 5. Every fragment declares its language: html, ts, js, vue, bash, or text for
//    a diagram.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 7. Component examples use <script setup lang="ts">; the two entry files and
//    the standalone render script are the exceptions, being a server entry and
//    a plain Node script.

// ===================================================================
// part 1 — what the browser receives
// ===================================================================

const CSR_SHELL = `<body>
  <div id="app"></div>
  <script type="module" src="/assets/index-a7f3b2.js"></script>
</body>`;

const SSR_HTML = `<body>
  <div id="app"><section class="card"><h2>Cart</h2><ul><li>Keyboard — 79.9 × 1</li></ul></section></div>
  <script type="module" src="/assets/index-a7f3b2.js"></script>
</body>`;

const TWO_PASSES = `request ──▶ server: createSSRApp(App) → renderToString() → HTML string
                     (no DOM, no window — just a string)
        ◀── HTML with content + the JS bundle
browser ──▶ paints the HTML at once (not interactive yet)
        ──▶ loads JS → createSSRApp(App).mount('#app')
                        → Vue adopts the existing DOM and attaches listeners`;

const RENDER_TO_STRING = `import { createSSRApp, h, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

const Counter = {
  setup() {
    const count = ref(3)
    return () =>
      h('section', { class: 'card' }, [
        h('h2', 'Counter'),
        h('p', \`count: \${count.value}\`),
        h('button', { onClick: () => count.value++ }, '+1'),
      ])
  },
}

console.log(await renderToString(createSSRApp(Counter)))`;

const RENDER_OUTPUT = `<section class="card"><h2>Counter</h2><p>count: 3</p><button>+1</button></section>`;

// ===================================================================
// part 2 — universal components
// ===================================================================

const BROWSER_ONLY_COMPONENT = `<script setup lang="ts">
import { onMounted, ref } from 'vue'

const data = ref<string | null>(null) // the server renders this as empty

onMounted(() => {
  data.value = localStorage.getItem('whatever')
})
</script>

<template>
  <p v-if="data">{{ data }}</p>
  <p v-else>Loading…</p>
</template>`;

const MOUNTED_FLAG = `const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})`;

// ===================================================================
// part 3 — one app per request
// ===================================================================

const MODULE_STATE = `export const session = reactive({ user: null }) // one instance for the whole server`;

const SHARED_STATE_RACE = `request A (Ada)   ──▶ session.user = Ada
request B (Grace) ──▶ session.user = Grace
request A renders ──▶ "Hello Grace"   ← A's data was overwritten while it waited`;

const ENTRY_SERVER = `// entry-server.ts
export async function render(url: string) {
  const app = createSSRApp(App)   // a new app
  const pinia = createPinia()     // new stores
  const router = createRouter({ history: createMemoryHistory(), routes })

  app.use(pinia).use(router)
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  return { html, state: pinia.state.value }
}`;

const STATE_SERIALISE = `// server
const payload = JSON.stringify(state).replace(/</g, '\\\\u003c')
const page = template.replace(
  '<!--app-html-->',
  \`\${html}<script>window.__INITIAL_STATE__ = \${payload}</script>\`,
)`;

const ENTRY_CLIENT_STATE = `// entry-client.ts
const pinia = createPinia()
if (window.__INITIAL_STATE__) {
  pinia.state.value = window.__INITIAL_STATE__
}
createSSRApp(App).use(pinia).mount('#app')`;

const ENTRY_CLIENT = `// src/entry-client.ts
createSSRApp(App).mount('#app') // hydrates the server HTML`;

const TWO_BUILDS = `vite build                             # client bundle
vite build --ssr src/entry-server.ts   # server bundle`;

export function HowSsrWorksDocs() {
    return (
        <>
            {/* Page lead — before the first divider. Two sentences, nothing more. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Client-side rendering ships an empty page plus code;
                    server-side rendering ships the finished HTML and then makes
                    it interactive.
                </p>
                <p>
                    This page covers what each sends, how a component renders
                    twice, what &quot;universal&quot; means for everyday
                    component code, and why the server must build a fresh app for
                    every request.
                </p>
            </div>

            {/* ---------- part 1 — what the browser receives ---------- */}
            <PartHeading kicker="part 1">What the browser receives</PartHeading>
            <div>
                <DocSection title="An empty div, or the page">
                    <p>A client-rendered build serves a shell.</p>
                    <CodeBlock code={CSR_SHELL} lang="html" />
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            Nothing is visible until the bundle has downloaded,
                            parsed and run.
                        </li>
                        <li>
                            Crawlers that do not execute JavaScript — many
                            previews and bots — see no content.
                        </li>
                        <li>A single failed chunk leaves no page at all.</li>
                    </ol>
                    <p>
                        Server-side rendering runs the application on the server
                        and sends its output instead.
                    </p>
                    <CodeBlock code={SSR_HTML} lang="html" />
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["", "CSR", "SSR"]}
                        rows={[
                            ["First paint", "after the bundle runs", "immediately"],
                            [
                                "Interactive",
                                "after the bundle runs",
                                "after the bundle runs — the same moment",
                            ],
                            [
                                "Crawlers and link previews",
                                "require JavaScript",
                                "plain HTML",
                            ],
                            [
                                "Server cost",
                                "static hosting",
                                "a Node process per request",
                            ],
                            [
                                "Code constraints",
                                "none",
                                "no browser APIs on the server",
                            ],
                        ]}
                    />

                    <Callout
                        severity="note"
                        label="note · SSR moves content, not interactivity"
                    >
                        <p>
                            Both approaches wait for the same JavaScript before
                            anything responds to a click. What SSR removes is the
                            blank period before the content appears.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · frameworks do this in practice"
                    >
                        <p>
                            Nuxt provides SSR, routing, data fetching and the
                            build setup; Vike is the lighter alternative. The
                            mechanisms below are what makes their errors readable.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="The application renders twice">
                    <p>
                        The same component tree is rendered once on the server as
                        a string and once in the browser to take over the result.
                    </p>
                    <CodeBlock code={TWO_PASSES} lang="text" />
                    <p>
                        A plain Node script shows the server half without any
                        build setup, using render functions so that no
                        single-file component has to be compiled.
                    </p>
                    <CodeBlock code={RENDER_TO_STRING} lang="js" />
                    <CodeBlock code={RENDER_OUTPUT} lang="html" />
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            Real HTML, produced without a browser — no DOM and no{" "}
                            <Code>window</Code> exist.
                        </li>
                        <li>
                            The click handler is gone: listeners cannot be
                            serialised, and attaching them is what the browser
                            pass does.
                        </li>
                        <li>
                            <Code>renderToString</Code> renders once, so nothing
                            reactive happens on the server.
                        </li>
                    </ol>
                    <p>
                        That second pass, adopting server HTML instead of
                        rebuilding it, is hydration (see Hydration).
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — universal components ---------- */}
            <PartHeading kicker="part 2">Universal components</PartHeading>
            <div>
                <DocSection title="The same component runs in both places">
                    <p>
                        Vue has no server-only component kind: every component is
                        universal and runs twice, which is why no marker such as a
                        client directive exists.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["React Server Components", "Vue"]}
                        rows={[
                            [
                                "Server Component, never shipped to the browser",
                                "no equivalent (Nuxt server islands come closest)",
                            ],
                            [
                                "Client Component, marked with a directive",
                                "an ordinary component — it runs in both places",
                            ],
                            ["useEffect for browser-only work", "onMounted"],
                        ]}
                    />
                    <p>
                        What a component may use therefore depends on the phase
                        rather than on a label.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Runs on the server?", ""]}
                        rows={[
                            [
                                "setup() and the <script setup> body",
                                "yes, once",
                            ],
                            ["ref, computed, props, inject", "yes"],
                            ["onMounted, onUpdated, onUnmounted", "never"],
                            ["window, document, localStorage", "not defined"],
                            [
                                "re-renders driven by reactivity",
                                "no — the server renders once",
                            ],
                        ]}
                    />

                    <Callout
                        severity="danger"
                        label="danger · never touch the DOM in setup"
                    >
                        <p>
                            Reading <Code>document</Code> or <Code>window</Code>{" "}
                            while <Code>setup</Code> runs crashes the server
                            render. Browser access belongs in{" "}
                            <Code>onMounted</Code>, which the server never
                            executes.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="When the HTML needs browser data">
                    <p>
                        Some content depends on values that only exist in the
                        browser, and the server cannot produce it.
                    </p>
                    <p>
                        Such a part is simply not server-rendered: the server
                        emits a placeholder, and the value arrives after mount.
                    </p>
                    <CodeBlock code={BROWSER_ONLY_COMPONENT} lang="vue" />
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            The server renders the placeholder, because it has no
                            browser.
                        </li>
                        <li>The browser paints that HTML and hydrates it.</li>
                        <li>
                            <Code>onMounted</Code> runs, the value is set, and Vue
                            updates that spot.
                        </li>
                    </ol>
                    <p>
                        This is safe because the first client render still has the
                        placeholder value, so it matches the server output, and
                        the change is an ordinary update afterwards.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Template", "Server HTML", "After mount"]}
                        rows={[
                            [
                                '<p v-if="data">{{ data }}</p>',
                                "nothing",
                                "the element is created",
                            ],
                            [
                                "<p>{{ data }}</p>",
                                "<p></p> — present but empty",
                                "the text appears inside",
                            ],
                        ]}
                    />
                    <p>
                        A whole subtree that cannot render without the browser is
                        gated the same way, with a flag set in{" "}
                        <Code>onMounted</Code> — the pattern Nuxt provides as a{" "}
                        <Code>ClientOnly</Code> component.
                    </p>
                    <CodeBlock code={MOUNTED_FLAG} lang="ts" />
                    <p>
                        When the server must produce the correct markup rather
                        than a placeholder, the value has to travel with the
                        request instead — a cookie, a client hint or the URL.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · reading browser state in setup causes a mismatch"
                    >
                        <p>
                            <Code>
                                const data = ref(localStorage.getItem(&apos;x&apos;))
                            </Code>{" "}
                            renders empty on the server and filled on the client,
                            so the two renders disagree (see Hydration). The value
                            belongs in <Code>onMounted</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — one app per request ---------- */}
            <PartHeading kicker="part 3">One app per request</PartHeading>
            <div>
                <DocSection title="Module state is shared on the server">
                    <p>
                        Module-level state is created once per process, so on a
                        server it is shared by every request that process handles.
                    </p>
                    <CodeBlock code={MODULE_STATE} lang="ts" />
                    <CodeBlock code={SHARED_STATE_RACE} lang="text" />
                    <p>
                        The same applies to anything request-specific held in a
                        module: a current user, a cache, or an HTTP client
                        carrying an auth header.
                    </p>
                    <p>
                        The server entry builds everything fresh for each request
                        and exports a factory rather than instances.
                    </p>
                    <CodeBlock code={ENTRY_SERVER} lang="ts" />
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            <Code>createSSRApp</Code>, not <Code>createApp</Code>,
                            marks the app as a hydration target.
                        </li>
                        <li>
                            <Code>createMemoryHistory</Code> is used because the
                            server has no browser URL; the route comes from the
                            request.
                        </li>
                        <li>
                            A fresh <Code>createPinia()</Code> per request is the
                            reason Pinia owns the stores rather than the modules
                            (see Pinia Basics).
                        </li>
                    </ol>

                    <Callout
                        severity="danger"
                        label="danger · one leak is a data leak"
                    >
                        <p>
                            Shared module state does not fail loudly: it renders
                            another user&apos;s data into this user&apos;s page.
                            Anything request-specific is created per request or
                            passed explicitly.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Transferring the state">
                    <p>
                        The server already fetched the data it rendered from;
                        without transferring it, the client would fetch it again
                        and replace the content it just received.
                    </p>
                    <p>
                        The state is serialised into the HTML and adopted before
                        mounting.
                    </p>
                    <CodeBlock code={STATE_SERIALISE} lang="ts" />
                    <CodeBlock code={ENTRY_CLIENT_STATE} lang="ts" />
                    <p>
                        The client then starts from the same state the server
                        rendered from, so its first render matches the HTML and
                        nothing is requested twice.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · escape the serialised state"
                    >
                        <p>
                            Data containing <Code>&lt;/script&gt;</Code> would
                            close the script tag early, which is an XSS hole
                            whenever any of that data came from users. Escaping{" "}
                            <Code>&lt;</Code> — or serialising with a library such
                            as <Code>devalue</Code> — is mandatory.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · the framework equivalents"
                    >
                        <p>
                            Nuxt&apos;s <Code>useState</Code>,{" "}
                            <Code>useFetch</Code> and its payload are these three
                            mechanisms: per-request state, fetch once and
                            transfer, and escaped serialisation. Nuxt also
                            resolves data before rendering, which plain{" "}
                            <Code>renderToString</Code> does not do.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Turning SSR on">
                    <p>
                        A <Code>create-vue</Code> project is client-rendered; SSR
                        is opt-in, through a framework or by hand.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Approach", "What it involves"]}
                        rows={[
                            [
                                "Nuxt",
                                "project scaffolding with SSR enabled by default, including routing, data fetching and build setup",
                            ],
                            [
                                "Manual",
                                "two entry files, two builds and a Node server that injects the rendered HTML",
                            ],
                        ]}
                    />
                    <CodeBlock code={ENTRY_CLIENT} lang="ts" />
                    <CodeBlock code={TWO_BUILDS} lang="bash" />
                    <p>
                        The server then imports the built render function, calls
                        it per request, and injects the result into the HTML
                        template.
                    </p>
                </DocSection>
            </div>
        </>
    );
}
