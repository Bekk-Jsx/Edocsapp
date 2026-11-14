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
    // --- part 1 (The component inspector) ---
    // inline `tip · the selected component in the Console` + `note · development
    // builds only`
    "tree-props-and-setup-state": ["tip", "note"],
    // inline `trap · edits stay on the client` + `trap · an edited prop is
    // overwritten` — one entry, the rail shows one icon per severity
    "editing-state-live": ["trap"],

    // --- part 2 (Choosing a tool) ---
    // "which-panel-answers-which-question" carries no callout, so it has no entry.
    // inline `note · measure production-like builds`
    "timelines-and-performance": ["note"],
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
// 2. Every claim arrives next to its artifact — a state group, a question, a
//    comparison row. No paragraph runs longer than three rendered lines.
// 3. Tables carry the comparisons, lists carry the sequences, callouts carry
//    the traps.
// 4. PURPOSE FIRST per section: what goes wrong, then the tool, then the detail.
// 5. Every fragment declares its language: ts here, text for a diagram.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 7. Extension labels and panel names move between versions, so every panel is
//    described by what it answers rather than by an exact menu path.

// ===================================================================
// part 2 — choosing a tool
// ===================================================================

const PERFORMANCE_FLAG = `app.config.performance = true`;

export function VueDevtoolsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. Two sentences, nothing more. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    The Elements panel shows the DOM, and a breakpoint shows one
                    paused moment; neither answers which component rendered a node
                    or what its state currently holds.
                </p>
                <p>
                    This page covers the component inspector, editing state while
                    the application runs, and which panel answers which question.
                </p>
            </div>

            {/* ---------- part 1 — the component inspector ---------- */}
            <PartHeading kicker="part 1">The component inspector</PartHeading>
            <div>
                <DocSection title="Tree, props and setup state">
                    <p>
                        The inspector shows Vue&apos;s own component tree, not the
                        DOM, so a component that renders nothing still appears and
                        one component may own many nodes.
                    </p>
                    <p>Selecting a component lists its state in groups.</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Group", "Contains"]}
                        rows={[
                            ["props", "what the parent passed, with types"],
                            [
                                "setup",
                                "refs, reactive objects and computed values from <script setup>",
                            ],
                            [
                                "provide / inject",
                                "what the component provides, and what it injected from above",
                            ],
                            [
                                "attrs",
                                "the fallthrough attributes described on Lifecycle & Attrs",
                            ],
                        ]}
                    />
                    <p>
                        Computed values appear with their current result, so a
                        wrong getter is visible without reading its code.
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            Selecting a DOM node in Elements and switching to the
                            component inspector selects the component that owns
                            it.
                        </li>
                        <li>
                            Selecting a component highlights its elements on the
                            page.
                        </li>
                    </ul>

                    <Callout
                        severity="tip"
                        label="tip · the selected component in the Console"
                    >
                        <p>
                            Recent versions expose the selected component to the
                            Console as <Code>$vm</Code>, so <Code>$vm.items</Code>
                            , <Code>$vm.total</Code> or{" "}
                            <Code>$vm.addOne(...)</Code> work directly — a REPL on
                            a live component, with no breakpoint.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · development builds only"
                    >
                        <p>
                            The inspector relies on a hook that production builds
                            do not register (see the <Code>devtools</Code> flag on
                            Pinia in DevTools). A production build exposes nothing.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Editing state live">
                    <p>
                        Reaching an edge case through the interface is slow, and
                        some states cannot be produced by clicking at all.
                    </p>
                    <p>
                        Values in the inspector are editable, and a change is
                        written through the reactive proxy, so every component
                        bound to it re-renders at once.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["State to reach", "Edit"]}
                        rows={[
                            [
                                "the empty state of a list",
                                "set the array to an empty array",
                            ],
                            ["an error message", "set the error field"],
                            [
                                "a permission-dependent view",
                                "change the role on the user object",
                            ],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · edits stay on the client"
                    >
                        <p>
                            Only the running application changes. A value that
                            comes from a server or from storage returns on the next
                            load or request unless it is changed at its source.
                        </p>
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · an edited prop is overwritten"
                    >
                        <p>
                            Props belong to the parent, so the next parent render
                            replaces an edited value. Lasting changes are made
                            where the state lives, not where it is passed.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — choosing a tool ---------- */}
            <PartHeading kicker="part 2">Choosing a tool</PartHeading>
            <div>
                <DocSection title="Which panel answers which question">
                    <p>
                        Each panel answers a different question, and most
                        debugging time is lost in the wrong one.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Question", "Tool"]}
                        rows={[
                            [
                                "What state does this component hold right now?",
                                "the component inspector",
                            ],
                            [
                                "Why did this component re-render?",
                                "onRenderTriggered (see Breakpoints & Stepping)",
                            ],
                            [
                                "What value does this line see?",
                                "a breakpoint and the Scope panel",
                            ],
                            [
                                "What did the server actually send?",
                                "the Network panel (see The Network Panel)",
                            ],
                            [
                                "What is in a store, and what changed it?",
                                "the Pinia inspector (see Pinia in DevTools)",
                            ],
                            [
                                "Why does the markup look wrong?",
                                "the Elements panel",
                            ],
                            ["Which code is slow?", "the Performance panel"],
                        ]}
                    />
                    <p>
                        The inspector shows state over time, a breakpoint shows
                        one frozen moment in detail — the two are complements
                        rather than alternatives.
                    </p>
                </DocSection>

                <DocSection title="Timelines and performance">
                    <p>
                        Beyond state, two further questions concern sequence and
                        cost.
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            Sequence: which events and mutations happened in what
                            order. Vue DevTools has offered a timeline for
                            component events, emits and store mutations, but its
                            scope differs between extension versions, so what a
                            given build records has to be checked rather than
                            assumed.
                        </li>
                        <li>
                            Cost: which work is slow. The browser&apos;s own
                            Performance panel records a flame chart that includes
                            Vue&apos;s render work and is independent of the
                            extension.
                        </li>
                    </ul>
                    <p>
                        Vue can additionally emit User Timing marks for component
                        init, render and patch, which then appear in that
                        recording.
                    </p>
                    <CodeBlock code={PERFORMANCE_FLAG} lang="ts" />

                    <Callout
                        severity="note"
                        label="note · measure production-like builds"
                    >
                        <p>
                            A development build does extra work — warnings,
                            devtools hooks, no minification — so timings taken
                            from it exaggerate. Performance conclusions come from
                            a production build served with <Code>preview</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
