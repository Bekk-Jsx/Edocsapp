import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). All three flagged sections are ENTIRELY
// about one severity, so the same value is also passed as the section's explicit
// `sectionSeverity` — the two are kept in sync by intent.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 3 (Using it right) ---
    // inline `trap · useless (or worse) without memoization` callout
    "pair-it-with-memoization": ["trap"],
    // inline `trap · trivial work & unstable values` callout
    "stale-flag-and-when-to-skip-it": ["trap"],
    // inline `note · which one` callout
    "vs-usetransition": ["note"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-effect, use-layout-effect,
// use-reducer and use-transition define for their own part dividers.
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

// ===================================================================
// Part 1 — The idea. One value at two priorities, and why reading the
// heavy work off the original defeats the point.
// ===================================================================

const LAGGING_COPY = `const [query, setQuery] = useState("");
const deferredQuery = useDeferredValue(query); // a string that lags behind query`;

const NOT_DIRECTLY = `// ❌ heavy work on \`query\` → runs urgently every keystroke → blocks the input
const results = MOVIES.filter(m => m.includes(query));

// ✅ heavy work on \`deferredQuery\` → low priority → input stays instant
const results = MOVIES.filter(m => m.includes(deferredQuery));`;

// ===================================================================
// Part 2 — How it renders. The two-pass shape of a keystroke, and what
// happens to the second pass when you keep typing.
// ===================================================================

const TWO_RENDERS = `// type "a":
// RENDER 1 (urgent):   query="a"  deferredQuery=""(last committed) → input paints instantly
// RENDER 2 (deferred): query="a"  deferredQuery="a"                → heavy work runs (low priority)`;

const ABANDONED = `// fast typing "ava":
// RENDER (urgent): query="av"  deferredQuery=<last committed> → input instant, heavy skipped
// deferred render for a previous value → ABANDONED when the next keystroke arrives
// on PAUSE: the deferred render completes for the final value → list updates once`;

// ===================================================================
// Part 3 — Using it right. The memoization the hook depends on, the
// staleness flag it doesn't give you, and how to choose between this
// and useTransition.
// ===================================================================

const WITH_MEMOIZATION = `// A) expensive work is a computation in THIS component → useMemo on the deferred value
const results = useMemo(
  () => MOVIES.filter(m => m.includes(deferredQuery)),
  [deferredQuery]
);

// B) expensive work is a CHILD → React.memo on the child, pass it the deferred value
const MovieList = memo(function MovieList({ query }: { query: string }) { /* heavy */ });

<MovieList query={deferredQuery} />`;

const STALE_FLAG = `const isStale = query !== deferredQuery; // true while the deferred value is catching up

<ul style={{ opacity: isStale ? 0.5 : 1 }}>...</ul>`;

const VS_TRANSITION = `// useTransition — you own the setState → wrap the UPDATE
startTransition(() => setResults(filter(v)));

// useDeferredValue — you only have the VALUE (e.g. a prop) → defer the VALUE
function List({ query }) { const d = useDeferredValue(query); /* ... */ }`;

export function UseDeferredValueDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The idea</PartHeading>
            <div>
                <DocSection title="a lagging copy of a value">
                    <CodeBlock code={LAGGING_COPY} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useDeferredValue(value)</Code> returns a copy of the
                            SAME value.
                        </Term>{" "}
                        Same type in, same type out — pass a string, get a string. The
                        difference is priority: the copy updates at LOW priority, so it
                        is allowed to fall one step behind while React is busy.
                    </p>
                    <p>
                        <Term>One value, two consumers.</Term> Drive the urgent UI — the
                        input — off the original, and the heavy work off the deferred
                        copy. <Code>query</Code> updates instantly on every keystroke;{" "}
                        <Code>deferredQuery</Code> follows it, but may trail:{" "}
                        <Code>query = &quot;avatar&quot;</Code> while{" "}
                        <Code>deferredQuery</Code> is still{" "}
                        <Code>&quot;avat&quot;</Code>. Then it catches up.
                    </p>
                </DocSection>

                <DocSection title="why not use the value directly">
                    <CodeBlock code={NOT_DIRECTLY} lang="tsx" />
                    <p>
                        <Term>
                            <Code>query</Code> is URGENT, and urgency is contagious.
                        </Term>{" "}
                        Reading the heavy list off it makes the heavy list urgent too, so
                        it lands between you and the character you just typed.
                    </p>
                    <p>
                        <Term>
                            The hook exists to give you a SECOND, low-priority version of
                            the same value
                        </Term>{" "}
                        so the expensive work can hang off that instead. Same value, two
                        priorities: the original for the input, which must be instant; the
                        deferred one for the heavy render, which is allowed to lag.
                    </p>
                    <p>
                        <Term>Use the value directly everywhere and everything is urgent</Term>{" "}
                        — which is another way of saying nothing is prioritized, and the
                        responsiveness you were after is gone.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">How it renders</PartHeading>
            <div>
                <DocSection title="two renders per keystroke">
                    <CodeBlock code={TWO_RENDERS} lang="tsx" />
                    <p>
                        <Term>Every keystroke produces two render passes.</Term> First an
                        URGENT one, where the original value updates and the input paints.
                        Then a LOW-PRIORITY one, which catches{" "}
                        <Code>deferredQuery</Code> up and runs the heavy work.
                    </p>
                    <p>
                        <Term>
                            On the urgent render, <Code>deferredQuery</Code> is the LAST
                            COMMITTED deferred value
                        </Term>{" "}
                        — never the brand-new keystroke. It is deliberately unchanged from
                        the previous render, and that is the whole point: unchanged means
                        the heavy work can be skipped on the fast path.
                    </p>
                </DocSection>

                <DocSection title="interrupted and abandoned">
                    <CodeBlock code={ABANDONED} lang="tsx" />
                    <p>
                        <Term>The low-priority render is interruptible.</Term> Type again
                        before it finishes and React THROWS IT AWAY, restarting with the
                        newest value. Intermediate deferred renders therefore often never
                        complete at all.
                    </p>
                    <p>
                        <Term>
                            The heavy work only runs to completion for a value you PAUSE
                            on
                        </Term>{" "}
                        — usually the final word. Whether a given urgent render sees an
                        old <Code>deferredQuery</Code> or one that has advanced a letter
                        depends purely on whether the previous deferred render managed to
                        commit before your next keystroke landed.
                    </p>
                    <p>
                        <Term>This is NOT debounce.</Term> The deferred render starts
                        immediately at low priority and is interruptible — it is not
                        delayed by a fixed timer.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 3">Using it right</PartHeading>
            <div>
                <DocSection
                    title="pair it with memoization"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={WITH_MEMOIZATION} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useDeferredValue</Code> alone saves nothing.
                        </Term>{" "}
                        All it provides is a lagging value. The saving comes from SKIPPING
                        the expensive work while that value hasn&apos;t changed — and the
                        skipping is done by <Code>useMemo</Code> or{" "}
                        <Code>React.memo</Code>, not by the hook. You need one of them
                        EVERY time.
                    </p>
                    <p>
                        <Term>The mechanism is the urgent render.</Term> On that pass{" "}
                        <Code>deferredQuery</Code> is unchanged, so{" "}
                        <Code>useMemo</Code>&apos;s deps{" "}
                        <Code>[deferredQuery]</Code> are unchanged and the computation is
                        served from cache — or <Code>React.memo</Code> sees the same prop
                        and skips the child subtree entirely. That is what keeps the heavy
                        work off the urgent path.
                    </p>
                    <p>
                        <Term>Which one depends on where the work lives.</Term> A
                        computation in this component → <Code>useMemo</Code> keyed on the
                        deferred value. A child component → <Code>React.memo</Code> around
                        it, with the deferred value as its prop. Genuinely trivial work →
                        neither, and don&apos;t reach for{" "}
                        <Code>useDeferredValue</Code> at all.
                    </p>
                    <p>
                        <Term>Without memoization it hurts instead of helps.</Term> The
                        expensive work reruns on every render, urgent one included, so you
                        pay the cost of the extra deferred pass AND the full cost of the
                        work — twice the rendering for none of the benefit.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · useless (or worse) without memoization"
                    >
                        <p>
                            <Code>useDeferredValue</Code> must be paired with{" "}
                            <Code>useMemo</Code> (your own computation) or{" "}
                            <Code>React.memo</Code> (a child). Alone it reruns the
                            expensive work every render — the deferral overhead with none
                            of the benefit. The React Compiler inserts this memoization
                            automatically when enabled.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection
                    title="stale flag and when to skip it"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={STALE_FLAG} lang="tsx" />
                    <p>
                        <Term>
                            There is no <Code>isPending</Code> here.
                        </Term>{" "}
                        Unlike <Code>useTransition</Code>, staleness is something you
                        derive: compare the original value with the deferred one. Use the
                        result for non-blocking feedback — dimming the list while it
                        catches up, then letting it snap back.
                    </p>
                    <p>
                        <Term>Don&apos;t defer trivial work.</Term> The extra render pass
                        is real; when the work it defers is cheap, that pass is pure
                        overhead bought for no gain.
                    </p>
                    <p>
                        <Term>Feed it a stable value.</Term> Reference identity is what
                        React compares, so deferring a freshly-built object every render
                        makes the deferred value look permanently changed and the
                        mechanism breaks. Defer strings, numbers or stable references —
                        never an inline object.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · trivial work & unstable values"
                    >
                        <p>
                            Don&apos;t defer cheap work (overhead for nothing), and
                            don&apos;t defer a new object each render (
                            <Code>useDeferredValue(&#123;...&#125;)</Code>) — the
                            reference always differs. Defer primitives or stable
                            references.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="vs useTransition" sectionSeverity="note">
                    <CodeBlock code={VS_TRANSITION} lang="tsx" />
                    <p>
                        <Term>Same goal, opposite ends of the same problem.</Term> Both
                        keep the UI responsive during a heavy update.{" "}
                        <Code>useTransition</Code> wraps the UPDATE;{" "}
                        <Code>useDeferredValue</Code> defers the VALUE.
                    </p>
                    <p>
                        <Term>The deciding question is whether you own the update.</Term>{" "}
                        If you call the <Code>setState</Code> yourself, wrap it —{" "}
                        <Code>useTransition</Code>. If all you have is a value handed to
                        you, a prop or the output of a hook you don&apos;t control, there
                        is no setter to wrap and you defer the value instead.
                    </p>
                    <p>
                        <Term>They also differ on feedback.</Term>{" "}
                        <Code>useTransition</Code> hands you <Code>isPending</Code>
                        directly; <Code>useDeferredValue</Code> gives you nothing, so you
                        derive <Code>isStale</Code> by comparing the two values.
                    </p>

                    <Callout severity="note" label="note · which one">
                        <p>
                            Own the <Code>setState</Code> → <Code>useTransition</Code>{" "}
                            (wrap the update). Only have the value, e.g. a prop →{" "}
                            <Code>useDeferredValue</Code> (defer the value).
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useDeferredValue</Code> is identical to React — the App Router
                    changes nothing about it. It is a concurrent-rendering feature for
                    keeping the CLIENT UI responsive, so it needs{" "}
                    <Code>&quot;use client&quot;</Code> and has no effect on server
                    rendering.
                </p>
                <p>
                    The one framework-adjacent detail worth knowing: the React Compiler
                    auto-inserts the <Code>useMemo</Code> / <Code>React.memo</Code>{" "}
                    memoization this hook depends on, so with it enabled the deferral
                    works without you writing the skip by hand.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            how does <Code>useDeferredValue</Code> differ from{" "}
                            <Code>useTransition</Code>?
                        </>
                    }
                    a={
                        <>
                            &ldquo;<Code>useTransition</Code> wraps the{" "}
                            <Term>update</Term> — for when you own the{" "}
                            <Code>setState</Code>. <Code>useDeferredValue</Code> defers
                            the <Term>value</Term> — for when you only receive it, like a
                            prop.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>why must it be paired with memoization?</>}
                        a={
                            <>
                                &ldquo;The lagging value only helps if the expensive work
                                is <Term>skipped while it hasn&apos;t changed</Term> —{" "}
                                <Code>useMemo</Code> or <Code>React.memo</Code> does that
                                skipping. Without one, the work reruns on every
                                render.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
