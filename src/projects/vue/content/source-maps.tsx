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
    // --- part 1 (What a source map is) ---
    // "mapping-generated-code-back" carries no callout, so it has no entry.
    // inline `trap · a stale map lies` + `note · type errors need no map`
    "maps-in-development": ["trap", "note"],

    // --- part 2 (Production builds) ---
    // inline `note · maps are not a secrecy boundary`
    "the-four-options": ["note"],
    // inline `trap · the release must match` + `note · styles have maps too`
    "hidden-maps-and-error-tracking": ["trap", "note"],
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
// 2. Every claim arrives next to its artifact — a stack trace, a build flag, a
//    comparison row. No paragraph runs longer than three rendered lines.
// 3. Tables carry the comparisons, lists carry the sequences, callouts carry
//    the traps.
// 4. PURPOSE FIRST per section: what goes wrong, then the tool, then the detail.
// 5. Every fragment declares its language: ts, bash, or text for a trace or a
//    bundle comment.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 7. DevTools and build labels shift between versions, so settings are
//    described by what they do rather than by an exact menu path.

// ===================================================================
// part 1 — what a source map is
// ===================================================================

const MINIFIED_TRACE = `TypeError: Cannot read properties of undefined (reading 'toFixed')
    at index-a7f3b2.js:1:48213`;

const SOURCE_MAPPING_URL = `//# sourceMappingURL=index-a7f3b2.js.map`;

// ===================================================================
// part 2 — production builds
// ===================================================================

const HIDDEN_SOURCEMAP = `// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: 'hidden',
  },
})`;

const VERIFY_MAPS = `ls dist/assets/*.map
grep sourceMappingURL dist/assets/*.js`;

export function SourceMapsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. Two sentences, nothing more. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    The browser never runs the code that was written: templates
                    become render functions, types are stripped, and a production
                    build is minified into a few files.
                </p>
                <p>
                    A source map restores the connection, so breakpoints, stack
                    traces and the Sources panel refer to the original files.
                </p>
            </div>

            {/* ---------- part 1 — what a source map is ---------- */}
            <PartHeading kicker="part 1">What a source map is</PartHeading>
            <div>
                <DocSection title="Mapping generated code back">
                    <p>
                        Two transformations separate the source from what
                        executes.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Written", "Executed"]}
                        rows={[
                            [
                                '.vue with a template and <script setup lang="ts">',
                                "plain JavaScript with a render function, types removed",
                            ],
                            [
                                "readable modules under src",
                                "in production, one minified bundle with names such as a, b, e2",
                            ],
                        ]}
                    />
                    <p>
                        Errors and breakpoints therefore point into code that
                        resembles nothing in the project.
                    </p>
                    <CodeBlock code={MINIFIED_TRACE} lang="text" />
                    <p>
                        A source map is a separate file holding the mapping from a
                        generated position to an original file, line, column and
                        name; the bundle names it in a trailing comment.
                    </p>
                    <CodeBlock code={SOURCE_MAPPING_URL} lang="text" />
                    <p>
                        Only the debugger reads the map — the running code is
                        unchanged, which is why a map can be withheld, deleted or
                        served from elsewhere without affecting the application.
                    </p>
                </DocSection>

                <DocSection title="Maps in development">
                    <p>
                        Vite serves maps in development, so <Code>.vue</Code>{" "}
                        files appear in Sources with their original code.
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            The original file is where breakpoints belong.
                        </li>
                        <li>
                            The compiled JavaScript Vite serves for the same path
                            shows what the template became — the render function
                            with the patch flags described on Rendering Under the
                            Hood.
                        </li>
                    </ul>
                    <p>
                        Source map support can also be switched off in the
                        browser&apos;s own settings, which immediately leaves only
                        compiled files in Sources — a useful check when a mapping
                        looks wrong.
                    </p>

                    <Callout severity="trap" label="trap · a stale map lies">
                        <p>
                            A map that no longer matches its code points at the
                            wrong line, often only a few lines off, which is more
                            misleading than no map at all. A hard reload, or
                            disabling the cache, rules it out before the reasoning
                            is doubted.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · type errors need no map"
                    >
                        <p>
                            <Code>vue-tsc</Code> reports its errors against the
                            original files, because it runs before any bundling.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — production builds ---------- */}
            <PartHeading kicker="part 2">Production builds</PartHeading>
            <div>
                <DocSection title="The four options">
                    <p>
                        Without maps a production error is unusable; with public
                        maps the whole source becomes readable in DevTools.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_max-content_1fr]"
                        head={[
                            "build.sourcemap",
                            ".map file",
                            "Reference in the bundle",
                            "Effect",
                        ]}
                        rows={[
                            [
                                "false (default)",
                                "no",
                                "no",
                                "nothing to debug with",
                            ],
                            [
                                "true",
                                "yes",
                                "yes",
                                "anyone with DevTools reads the source",
                            ],
                            [
                                "'hidden'",
                                "yes",
                                "no",
                                "maps exist for tooling, browsers never fetch them",
                            ],
                            [
                                "'inline'",
                                "embedded in the JavaScript",
                                "—",
                                "very large bundle; development or testing only",
                            ],
                        ]}
                    />
                    <CodeBlock code={HIDDEN_SOURCEMAP} lang="ts" />
                    <p>
                        Whether maps were emitted and referenced is verifiable in
                        the build output.
                    </p>
                    <CodeBlock code={VERIFY_MAPS} lang="bash" />

                    <Callout
                        severity="note"
                        label="note · maps are not a secrecy boundary"
                    >
                        <p>
                            The JavaScript ships either way; a map only makes it
                            comfortable to read. Anything that must stay secret
                            does not belong in a frontend bundle, with or without
                            maps.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Hidden maps and error tracking">
                    <p>
                        The common production setup combines hidden maps with a
                        service that resolves stack traces server-side.
                    </p>
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            Build with <Code>sourcemap: &apos;hidden&apos;</Code>{" "}
                            — <Code>dist</Code> contains the maps, the bundle does
                            not mention them.
                        </li>
                        <li>
                            CI uploads the maps to the error tracker together with
                            a release identifier.
                        </li>
                        <li>
                            The maps are excluded from the deployment, or served
                            only behind authentication.
                        </li>
                        <li>
                            A reported error arrives minified and is resolved
                            against the uploaded map, showing the original file
                            and line.
                        </li>
                    </ol>
                    <p>
                        The result is readable production traces without a public
                        source.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the release must match"
                    >
                        <p>
                            A tracker can only resolve a trace with the map of the
                            exact build that produced it. Mismatched release
                            identifiers are the usual reason traces stay minified
                            after maps have been uploaded.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · styles have maps too"
                    >
                        <p>
                            CSS source maps point compiled rules back to the{" "}
                            <Code>&lt;style scoped&gt;</Code> block of their{" "}
                            <Code>.vue</Code> file; Vite enables them for
                            development through <Code>css.devSourcemap</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
