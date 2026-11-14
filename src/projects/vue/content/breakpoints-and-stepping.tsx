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
    // --- part 1 (Setting breakpoints) ---
    // inline `trap · debugger is a statement, not a comment`
    "three-ways-to-pause": ["trap"],
    // "logpoints" carries no callout, so it has no entry.

    // --- part 2 (Stepping through code) ---
    // "the-four-controls" carries no callout, so it has no entry.
    // inline `tip · the Console evaluates in the paused scope` + `tip · hide
    // framework frames` — one entry, the rail shows one icon per severity
    "scope-call-stack-and-watch": ["tip"],

    // --- part 3 (Debugging a Vue app) ---
    // "templates-are-not-steppable" carries no callout, so it has no entry.
    // inline `note · development only`
    "why-did-it-re-render": ["note"],
    // inline `trap · an un-awaited promise escapes error handling`
    "async-code-and-the-call-stack": ["trap"],
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
// 2. Every claim arrives next to its artifact — a code fragment, a diagram, a
//    comparison row. No paragraph runs longer than three rendered lines.
// 3. Tables carry the comparisons, lists carry the sequences, callouts carry
//    the traps.
// 4. PURPOSE FIRST per section: what goes wrong, then the tool, then the detail.
// 5. Every fragment declares its language: ts, or text for a diagram.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 7. DevTools labels shift between Chrome versions, so controls are described
//    by what they do rather than by an exact menu path.

// ===================================================================
// part 1 — setting breakpoints
// ===================================================================

const DEBUGGER_STATEMENT = `function total(items: Item[]) {
  debugger // execution stops here while DevTools is open
  return items.reduce((sum, i) => sum + i.price, 0)
}`;

const BREAKPOINT_CONDITIONS = `item.id === 42   // pause for one item only
sum > 1000       // pause once the value goes wrong`;

const LOGPOINT_EXPRESSION = `'item', item.id, item.price`;

// ===================================================================
// part 3 — debugging a vue app
// ===================================================================

const RENDER_HOOKS = `import { onRenderTracked, onRenderTriggered } from 'vue'

onRenderTracked((e) => {
  console.log('tracked', e.key, e)      // a dependency was READ during render
})

onRenderTriggered((e) => {
  console.log('triggered by', e.key, e) // a dependency CHANGED → re-render
})`;

const TRACKED_VS_TRIGGERED = `first render
  ├─ reads items         → tracked
  ├─ reads item.qty      → tracked
  └─ reads discountCode  → tracked

item.qty changes
  └─ triggered (key: qty, type: set, 1 → 2)   ← the cause
         ↓
re-render → tracked fires again for every dependency`;

const WATCH_INSTRUMENTATION = `watch(source, callback, {
  onTrack: (e) => console.log('track', e.key),
  onTrigger: (e) => console.log('trigger', e.key),
})`;

const ASYNC_STACK = `synchronous                      async
───────────                      ─────
addOne()                         loadCart()
 └ lineTotal()                    └ await fetchItems()   ← returns here,
   └ ← error: full stack             the stack is now empty
                                 …later, from the task queue:
                                 (rest of loadCart)      ← no caller above it`;

const RETHROW_WITH_CAUSE = `catch (e) {
  throw new Error(\`loadCart failed for user \${id}\`, { cause: e })
}`;

export function BreakpointsAndSteppingDocs() {
    return (
        <>
            {/* Page lead — before the first divider. Two sentences, nothing more. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A breakpoint pauses the program and exposes everything in
                    scope at that moment, which a log statement cannot.
                </p>
                <p>
                    This page covers setting breakpoints and logpoints, stepping
                    with Scope and Call stack, and the three cases that behave
                    differently in a Vue app: templates, re-render causes and
                    async code.
                </p>
            </div>

            {/* ---------- part 1 — setting breakpoints ---------- */}
            <PartHeading kicker="part 1">Setting breakpoints</PartHeading>
            <div>
                <DocSection title="Three ways to pause">
                    <p>
                        Logging shows only what was anticipated, costs a reload
                        per guess, and leaves statements behind in the source.
                    </p>
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            A <Code>debugger</Code> statement in the code —
                            fastest to type, but it ships with the bundle.
                        </li>
                        <li>
                            A click on a line number in the Sources panel — no
                            code change; files appear under the dev
                            server&apos;s origin.
                        </li>
                        <li>
                            A conditional breakpoint — right-clicking a line
                            number offers one; it pauses only when an expression
                            is true.
                        </li>
                    </ol>
                    <CodeBlock code={DEBUGGER_STATEMENT} lang="ts" />
                    <p>
                        A condition turns an unusable breakpoint in a long loop
                        into a precise one.
                    </p>
                    <CodeBlock code={BREAKPOINT_CONDITIONS} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · debugger is a statement, not a comment"
                    >
                        <p>
                            It does nothing without DevTools open, but it is real
                            code in the bundle. Remove it before committing; the{" "}
                            <Code>no-debugger</Code> ESLint rule catches the ones
                            that slip through.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Logpoints">
                    <p>
                        A logpoint prints an expression on every hit without
                        pausing and without touching the source — the same
                        information as a log statement, with none of its costs.
                    </p>
                    <CodeBlock code={LOGPOINT_EXPRESSION} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr_1fr]"
                        head={["", "console.log", "Logpoint", "Breakpoint"]}
                        rows={[
                            ["Changes the source", "yes", "no", "no"],
                            ["Needs a reload to change", "yes", "no", "no"],
                            ["Pauses execution", "no", "no", "yes"],
                            ["Shows everything in scope", "no", "no", "yes"],
                        ]}
                    />
                    <p>
                        Logpoints suit loops and high-frequency handlers, where
                        pausing would be unusable.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — stepping through code ---------- */}
            <PartHeading kicker="part 2">Stepping through code</PartHeading>
            <div>
                <DocSection title="The four controls">
                    <p>
                        A breakpoint reports one line; most bugs live between two
                        lines, where a value is still correct here and wrong
                        three calls later.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Control", "Key", "Does"]}
                        rows={[
                            ["Resume", "F8", "run until the next breakpoint"],
                            [
                                "Step over",
                                "F10",
                                "run this line, calls included, and stop on the next one",
                            ],
                            [
                                "Step into",
                                "F11",
                                "enter the function called on this line",
                            ],
                            [
                                "Step out",
                                "Shift+F11",
                                "finish this function and stop at its caller",
                            ],
                        ]}
                    />
                    <p>
                        The usual rhythm is stepping over until a value goes
                        wrong, then repeating the run and stepping into the call
                        that produced it.
                    </p>
                </DocSection>

                <DocSection title="Scope, Call stack and Watch">
                    <p>
                        Three panels answer three different questions while
                        execution is paused.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Panel", "Answers"]}
                        rows={[
                            [
                                "Scope",
                                "which values exist here — Local, Closure, Global",
                            ],
                            [
                                "Call stack",
                                "who called whom; clicking a frame shows that frame's scope",
                            ],
                            [
                                "Watch",
                                "expressions evaluated at every pause, surviving steps and reloads",
                            ],
                        ]}
                    />
                    <p>
                        In a Vue component, refs and props appear under Closure
                        rather than Local, because the <Code>setup</Code>{" "}
                        function captured them.
                    </p>
                    <p>
                        Scope values are editable: changing one and resuming tests
                        a hypothesis without changing code.
                    </p>

                    <Callout
                        severity="tip"
                        label="tip · the Console evaluates in the paused scope"
                    >
                        <p>
                            While paused, typing <Code>items.value</Code> or{" "}
                            <Code>lineTotal(item)</Code> in the Console runs it in
                            that frame — often faster than adding a Watch
                            expression.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · hide framework frames">
                        <p>
                            A Vue call stack is mostly internals. Adding those
                            scripts to the ignore list, or ignoring{" "}
                            <Code>node_modules</Code>, leaves only application
                            frames — and stops &quot;step into&quot; from
                            disappearing into the framework.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — debugging a vue app ---------- */}
            <PartHeading kicker="part 3">Debugging a Vue app</PartHeading>
            <div>
                <DocSection title="Templates are not steppable">
                    <p>
                        A template compiles into a render function, so there is no
                        line of source to pause on inside it.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["To inspect", "Put the breakpoint in"]}
                        rows={[
                            [
                                "a value rendered in the template",
                                "the computed that produces it",
                            ],
                            [
                                "what a click does",
                                "the first line of the handler function",
                            ],
                            [
                                'an inline handler such as @click="count++"',
                                "extract it into a function first",
                            ],
                        ]}
                    />
                    <p>
                        That constraint is also a design hint: logic worth
                        debugging rarely belongs inline in a template.
                    </p>
                </DocSection>

                <DocSection title="Why did it re-render?">
                    <p>
                        Two development-only hooks answer the two halves of that
                        question.
                    </p>
                    <CodeBlock code={RENDER_HOOKS} lang="ts" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "onRenderTracked", "onRenderTriggered"]}
                        rows={[
                            [
                                "Fires",
                                "during a render, on every reactive read",
                                "before a re-render, on the change that caused it",
                            ],
                            [
                                "How often",
                                "once per dependency, so many times per render",
                                "once per change",
                            ],
                            [
                                "Answers",
                                "what this component depends on",
                                "why it is re-rendering now",
                            ],
                        ]}
                    />
                    <CodeBlock code={TRACKED_VS_TRIGGERED} lang="text" />
                    <p>
                        The event carries <Code>key</Code>, <Code>type</Code> and
                        the old and new values, so a <Code>debugger</Code>{" "}
                        statement inside <Code>onRenderTriggered</Code> pauses at
                        the cause, with the mutation visible in the call stack.
                    </p>
                    <p>
                        Watchers and computeds take the same instrumentation as
                        options.
                    </p>
                    <CodeBlock code={WATCH_INSTRUMENTATION} lang="ts" />

                    <Callout severity="note" label="note · development only">
                        <p>
                            These hooks and options are removed from production
                            builds. <Code>onRenderTracked</Code> is deliberately
                            noisy and is only useful when the dependency list
                            itself is the problem — for example a component that
                            re-renders on an apparently unrelated change.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Async code and the call stack">
                    <p>
                        At an <Code>await</Code> the function returns and the
                        JavaScript stack unwinds; the rest runs later, from an
                        empty stack.
                    </p>
                    <CodeBlock code={ASYNC_STACK} lang="text" />
                    <p>
                        DevTools reconstructs the chain and shows the originating
                        frames below an async marker; those frames can be
                        inspected but not stepped back into.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Situation", "Effect on debugging"]}
                        rows={[
                            [
                                "await someCall()",
                                "the chain is kept; errors reach the surrounding try/catch",
                            ],
                            [
                                "someCall() without await",
                                "the chain breaks; errors surface as unhandled rejections with a thin trace",
                            ],
                            [
                                "long .then() chains",
                                "traces get shallower the further the chain runs",
                            ],
                            [
                                "setTimeout(fn, 0)",
                                "the timer breaks the chain by design",
                            ],
                        ]}
                    />
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            Await or catch every promise; a floating promise is
                            the usual cause of an error with no origin.
                        </li>
                        <li>
                            Breakpoint the line after an <Code>await</Code> rather
                            than stepping over it, because stepping hands control
                            to the browser first.
                        </li>
                        <li>
                            Add context when rethrowing, so the message does not
                            depend on the stack.
                        </li>
                    </ol>
                    <CodeBlock code={RETHROW_WITH_CAUSE} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · an un-awaited promise escapes error handling"
                    >
                        <p>
                            An error in an async handler only reaches{" "}
                            <Code>errorCaptured</Code> or{" "}
                            <Code>app.config.errorHandler</Code> when the promise
                            is returned or awaited (see Lifecycle &amp; Attrs).
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
