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
    // --- part 1 (Taking over the DOM) ---
    // inline `trap · createApp silently discards the HTML` + `note · onMounted
    // runs after hydration`
    "adopting-instead-of-rebuilding": ["trap", "note"],

    // --- part 2 (Mismatches) ---
    // inline `note · newer warnings name the difference`
    "what-a-mismatch-costs": ["note"],
    // inline `trap · time and random values belong outside setup`
    "what-causes-one": ["trap"],

    // --- part 3 (Debugging and delaying) ---
    // inline `trap · not a permanent setting`
    "finding-the-cause": ["trap"],
    // inline `note · async components only`
    "delaying-hydration": ["note"],
    // "keeping-both-renders-equal" carries no callout, so it has no entry.
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
// 2. Every claim arrives next to its artifact — the adopted HTML, a cause row,
//    a debugging step. No paragraph runs longer than three rendered lines.
// 3. Tables carry the comparisons, lists carry the sequences, callouts carry
//    the traps.
// 4. PURPOSE FIRST per section: what goes wrong, then the mechanism, then the
//    detail.
// 5. Every fragment declares its language: ts, vue, or text for a diagram.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 7. DevTools labels shift between versions, so panels and settings are
//    described by what they do rather than by an exact menu path.

// ===================================================================
// part 1 — taking over the DOM
// ===================================================================

const ADOPT_DIAGRAM = `server HTML:   <button class="primary">Count: 3</button>

hydration:     walk the existing nodes, match them to the vnodes,
               attach listeners, bind refs — create nothing`;

// ===================================================================
// part 2 — mismatches
// ===================================================================

const INVALID_NESTING = `<p><div>count: {{ count }}</div></p>`;

// ===================================================================
// part 3 — debugging and delaying
// ===================================================================

const PROD_MISMATCH_FLAG = `// vite.config.ts
define: {
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
}`;

const LAZY_HYDRATION = `import { defineAsyncComponent, hydrateOnVisible, hydrateOnIdle } from 'vue'

const Comments = defineAsyncComponent({
  loader: () => import('./Comments.vue'),
  hydrate: hydrateOnVisible(), // when it scrolls into view
})

const Analytics = defineAsyncComponent({
  loader: () => import('./Analytics.vue'),
  hydrate: hydrateOnIdle(), // when the main thread is idle
})`;

export function HydrationDocs() {
    return (
        <>
            {/* Page lead — before the first divider. Two sentences, nothing more. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Hydration is the browser pass that takes over server-rendered
                    HTML: Vue walks the existing DOM, matches it to its own render
                    output and attaches the behaviour, instead of building the
                    page again.
                </p>
                <p>
                    This page covers what that pass does, why the two renders
                    must agree, what happens when they do not, and how hydration
                    can be delayed.
                </p>
            </div>

            {/* ---------- part 1 — taking over the DOM ---------- */}
            <PartHeading kicker="part 1">Taking over the DOM</PartHeading>
            <div>
                <DocSection title="Adopting instead of rebuilding">
                    <p>
                        Rendering normally in the browser would discard the
                        server&apos;s HTML and rebuild an identical DOM — wasted
                        work and a visible flash.
                    </p>
                    <p>
                        Mounting an app created with <Code>createSSRApp</Code>{" "}
                        adopts what is already there.
                    </p>
                    <CodeBlock code={ADOPT_DIAGRAM} lang="text" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Hydration does", "Hydration does not"]}
                        rows={[
                            [
                                "run setup() again, in the browser",
                                "re-create the DOM",
                            ],
                            [
                                "walk the server DOM, matching vnodes",
                                "verify that the HTML is correct",
                            ],
                            [
                                "attach event listeners",
                                "repeat server-only work",
                            ],
                            [
                                "fill template refs",
                                "call onMounted before it has finished",
                            ],
                        ]}
                    />
                    <p>
                        The second column&apos;s middle row is the important one:
                        Vue trusts that the client render reproduces the
                        server&apos;s tree, because checking the whole document
                        would cost as much as rendering it.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · createApp silently discards the HTML"
                    >
                        <p>
                            <Code>createApp().mount()</Code> replaces the
                            container&apos;s content, while{" "}
                            <Code>createSSRApp().mount()</Code> hydrates it. Using
                            the first one on server HTML still looks correct and
                            throws the server&apos;s work away.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · onMounted runs after hydration"
                    >
                        <p>
                            DOM access in <Code>onMounted</Code> therefore sees
                            the final, hydrated tree.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — mismatches ---------- */}
            <PartHeading kicker="part 2">Mismatches</PartHeading>
            <div>
                <DocSection title="What a mismatch costs">
                    <p>
                        Hydration assumes the first client render equals the
                        server&apos;s HTML; when it does not, Vue is walking a
                        tree that disagrees with its vnodes.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Development", "Production"]}
                        rows={[
                            [
                                "Console",
                                "a mismatch warning naming the node",
                                "nothing",
                            ],
                            [
                                "The DOM",
                                "the mismatched subtree is discarded and rendered again on the client",
                                "the same",
                            ],
                        ]}
                    />
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            A mismatch is not a crash, which is why it survives
                            into production unnoticed.
                        </li>
                        <li>
                            The affected subtree is rendered twice, so the work
                            SSR saved is paid again.
                        </li>
                        <li>
                            The user can briefly see the server&apos;s version
                            before it is replaced.
                        </li>
                    </ol>

                    <Callout
                        severity="note"
                        label="note · newer warnings name the difference"
                    >
                        <p>
                            Vue 3.4 and later report what differed — text, class,
                            style or an attribute — and print both values, which
                            usually identifies the cause without further
                            investigation.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="What causes one">
                    <p>
                        Every cause is a variation of the same thing: the two
                        renders had different inputs.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Cause", "Example"]}
                        rows={[
                            [
                                "Browser-only data read in setup()",
                                "ref(localStorage.getItem('theme'))",
                            ],
                            [
                                "Non-deterministic values",
                                "Date.now(), Math.random()",
                            ],
                            [
                                "Timezone or locale differences",
                                "a server in UTC formatting a date for a user in UTC+1",
                            ],
                            [
                                "Missing state transfer",
                                "the server rendered fetched data, the client started empty",
                            ],
                            [
                                "Invalid HTML nesting",
                                "<p><div>…</div></p>, or a <div> directly inside <table>",
                            ],
                            [
                                "Browser extensions",
                                "nodes injected before Vue hydrates",
                            ],
                        ]}
                    />
                    <p>
                        The nesting case is the one where nothing in the source
                        looks wrong.
                    </p>
                    <CodeBlock code={INVALID_NESTING} lang="vue" />
                    <p>
                        The HTML parser restructures invalid markup while parsing
                        — here it closes the paragraph early — so Vue compares its
                        vnodes against a DOM the browser rewrote, and the warning
                        points at a node nobody wrote.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · time and random values belong outside setup"
                    >
                        <p>
                            Compute them in <Code>onMounted</Code>, so the server
                            renders a placeholder, or send the server&apos;s value
                            through the state transfer so both renders use the
                            same one (see How SSR Works).
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — debugging and delaying ---------- */}
            <PartHeading kicker="part 3">Debugging and delaying</PartHeading>
            <div>
                <DocSection title="Finding the cause">
                    <p>
                        The warning says where, not why — and the two things worth
                        comparing are not both visible in the Elements panel,
                        which always shows the current DOM.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Step", "How"]}
                        rows={[
                            [
                                "1. Read the warning",
                                "recent versions name what differed and print both values",
                            ],
                            [
                                "2. Get the server's HTML",
                                "view page source, or curl the URL — never Elements",
                            ],
                            [
                                "3. Get the client's version",
                                "Elements, after hydration",
                            ],
                            [
                                "4. Isolate",
                                "comment out subtrees, or gate suspects behind a mounted flag, until the warning disappears",
                            ],
                            [
                                "5. Check the usual suspects",
                                "dates, random values, storage reads in setup(), missing payload, invalid nesting",
                            ],
                        ]}
                    />
                    <p>
                        Disabling JavaScript in DevTools and reloading is a faster
                        version of step two: what remains on screen is the server
                        render, in the browser&apos;s own layout.
                    </p>
                    <p>
                        Mismatches are silent in production, and a deployed build
                        can be made to report them temporarily.
                    </p>
                    <CodeBlock code={PROD_MISMATCH_FLAG} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · not a permanent setting"
                    >
                        <p>
                            The flag ships the detailed warnings in a production
                            bundle. It belongs on staging while a mismatch is
                            being chased, not in a release.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Delaying hydration">
                    <p>
                        By default everything hydrates at load, so a page of
                        widgets pays for all of them at once, including sections
                        the user never reaches.
                    </p>
                    <p>
                        Since Vue 3.5, an async component can declare when it
                        hydrates.
                    </p>
                    <CodeBlock code={LAZY_HYDRATION} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Strategy", "Hydrates when"]}
                        rows={[
                            [
                                "hydrateOnVisible()",
                                "the element enters the viewport",
                            ],
                            ["hydrateOnIdle()", "the main thread goes idle"],
                            [
                                "hydrateOnInteraction('click')",
                                "the user first interacts with it",
                            ],
                            [
                                "hydrateOnMediaQuery('(min-width: 768px)')",
                                "the query matches",
                            ],
                        ]}
                    />
                    <p>
                        Until then the server HTML stays on screen, visible but
                        inert — which suits content that is read more often than
                        clicked.
                    </p>

                    <Callout
                        severity="note"
                        label="note · async components only"
                    >
                        <p>
                            The <Code>hydrate</Code> option belongs to{" "}
                            <Code>defineAsyncComponent</Code>, so a lazily
                            hydrated component is also a separately loaded chunk
                            (see Built-in Components). Nuxt exposes the same
                            strategies through its own delayed-hydration API.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Keeping both renders equal">
                    <p>
                        Everything on this page reduces to one rule and four
                        habits.
                    </p>
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            The first client render must produce exactly what the
                            server sent; changes belong after it.
                        </li>
                        <li>
                            Read browser APIs in <Code>onMounted</Code>, never in{" "}
                            <Code>setup()</Code>.
                        </li>
                        <li>
                            Transfer server-fetched state into the client instead
                            of refetching it.
                        </li>
                        <li>
                            Keep markup valid, so the parser does not rewrite the
                            DOM underneath Vue.
                        </li>
                        <li>
                            Treat a mismatch warning as a bug, not as noise — in
                            production it goes silent, not away.
                        </li>
                    </ol>
                </DocSection>
            </div>
        </>
    );
}
