import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > tip > next). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop below, which marks a section whose ENTIRE
// topic is one severity. See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Basics) ---
    "state-is-a-snapshot": ["trap"],
    // section flagged `danger` as a whole + inline `trap · snapshot vs pending` callout
    "value-form-vs-function-form": ["danger", "trap"],

    // --- part 2 (Objects & arrays) ---
    // inline `danger · mutation is silent` callout
    "never-mutate-replace": ["danger"],
    // inline `trap · shallow copy` callout
    "nested-objects": ["trap"],
    // inline `danger · mutating array methods` callout
    arrays: ["danger"],
    // inline `trap · stale collection` callout
    "functional-updater-for-objects-arrays": ["trap"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-effect, use-context and use-reducer define for
// their own part dividers.
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
// Part 2 — Objects & arrays. Everything above holds for a number just
// as well; these four sections are about the one extra rule that only
// bites once state stops being a primitive: React compares the
// REFERENCE, so an update has to produce a new one.
// ===================================================================

const REPLACE = `const [user, setUser] = useState({ name: "Sam", age: 30 });

user.age = 31;
setUser(user);                   // mutate -> same reference -> NO re-render

setUser({ ...user, age: 31 });   // new object -> re-render`;

const NESTED = `const [user, setUser] = useState({
  name: "Sam",
  address: { city: "Paris", zip: "75001" },
});

setUser({
  ...user,                                      // copy the top level
  address: { ...user.address, city: "Lyon" },   // new nested object + override
});`;

const ARRAYS = `const [todos, setTodos] = useState<Todo[]>([]);

setTodos([...todos, newTodo]);                                          // add
setTodos(todos.map((t) => (t.id === id ? { ...t, done: true } : t)));   // update
setTodos(todos.filter((t) => t.id !== id));                             // remove`;

const FUNCTIONAL_UPDATER = `setTodos((prev) => [...prev, newTodo]);
setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)));
setUser((prev) => ({ ...prev, age: prev.age + 1 }));   // note the ( )`;

export function UseStateDocs() {
    return (
        <>
            {/* Part 1 needs no wrapper div: the divider above already breaks
                `.doc-section + .doc-section` adjacency, so the hairlines between
                these sections render exactly as before. */}
            <PartHeading kicker="part 1">Basics</PartHeading>
            <DocSection title="render & persistence">
                <p>
                    <Term>Renders re-run the function.</Term> React calls your
                    component again on every render, so a plain <Code>let</Code> or{" "}
                    <Code>const</Code> is reinitialized each time — it can&apos;t
                    persist. <Code>useState</Code> is how a value survives: React keeps
                    it <em>outside</em> the function and hands it back on the next call.
                </p>
                <p>
                    <Term>The argument is a mount-only seed.</Term>{" "}
                    <Code>useState(initial)</Code> reads <Code>initial</Code> only on
                    the first render. On every later render React returns the{" "}
                    <em>stored</em> value and ignores the argument entirely.
                </p>
            </DocSection>

            <DocSection title="state is a snapshot">
                <p>
                    <Term>State is a fixed, read-only value for the whole render.</Term>{" "}
                    <Code>count</Code> doesn&apos;t change mid-render.{" "}
                    <Code>setState</Code> does <em>not</em> mutate the current value — it{" "}
                    <strong className="text-[var(--text)]">schedules</strong> a re-render
                    with the new value; within the current render the variable stays the
                    old value.
                </p>

                <Callout severity="trap" label="trap · snapshot">
                    <p>
                        <Term>State is a read-only snapshot</Term> of the value for the
                        current render. <Code>setY(y + 5)</Code> does{" "}
                        <em>not</em> mutate <Code>y</Code> — within this render{" "}
                        <Code>y</Code> stays the old value. <Code>setState</Code>{" "}
                        <strong className="text-[var(--text)]">schedules</strong> a
                        re-render with the new value; you only see it on the{" "}
                        <em>next</em> render.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="scheduling & bail-out">
                <p>
                    <Term>A set requests a render, it doesn&apos;t guarantee one.</Term>{" "}
                    React <strong className="text-[var(--text)]">bails out</strong> when
                    the new value is <Code>Object.is</Code>-equal to the current one.
                    Caveat: a <em>new</em> object or array reference with identical
                    contents is still &quot;different&quot; — reference identity is
                    compared, not deep equality — so it re-renders.
                </p>
            </DocSection>

            <DocSection title="batching">
                <p>
                    <Term>Multiple sets are batched.</Term> Several{" "}
                    <Code>setState</Code> calls in one tick collapse into a single
                    re-render. React 18+ automatic batching also covers promises,
                    timeouts, and native handlers (React 17 only batched inside React
                    event handlers).
                </p>
                <p>
                    <Term>Only batching is new.</Term> The functional updater and value
                    form both exist since React 16.8; automatic batching is the one
                    React 18 change here.
                </p>
            </DocSection>

            <DocSection title="value form vs function form" sectionSeverity="danger">
                <p>
                    <Term>Value form reads one stale snapshot.</Term>{" "}
                    <Code>count</Code> is a fixed value for the whole render. With{" "}
                    <Code>setCount(count + 1)</Code> ×3, all three read the{" "}
                    <em>same</em> stale <Code>0</Code>, so React queues{" "}
                    <Code>[set→1, set→1, set→1]</Code> — each overwrites the last with
                    the same target and it ends at <Code>1</Code>. This +1 is{" "}
                    <em>not</em> batching: even unbatched it would still land at{" "}
                    <Code>1</Code>, because every update was computed from the same{" "}
                    <Code>0</Code>. (Batching decides how many <em>renders</em>; this
                    decides what value each update computes <em>from</em> — two
                    independent things.)
                </p>
                <p>
                    <Term>Function form threads the queue.</Term> With{" "}
                    <Code>setCount(c =&gt; c + 1)</Code> ×3 you pass <em>functions</em>,
                    not values. React queues{" "}
                    <Code>[c=&gt;c+1, c=&gt;c+1, c=&gt;c+1]</Code> and threads the
                    result through them in order: <Code>0 → 1 → 2 → 3</Code>. Each
                    updater receives the <em>previous result</em>, not the stale{" "}
                    <Code>0</Code> — so <Code>c</Code> is not your snapshot, it&apos;s
                    the <em>pending</em> state React has accumulated in the queue so far.
                    That&apos;s why updates{" "}
                    <strong className="text-[var(--text)]">compound</strong> instead of{" "}
                    <strong className="text-[var(--text)]">clobbering</strong> each
                    other. Rule of thumb: reach for the function form whenever the next
                    value depends on the previous <em>and</em> the update may be deferred
                    or repeated (async, several in one handler, inside effects).
                </p>
                <pre className="overflow-x-auto rounded bg-[var(--surface-2)] px-3 py-2 font-mono text-[0.8em] text-[var(--text)]">
                    {`value:    [set 1, set 1, set 1]  -> 1\nfunction: [+1, +1, +1] over 0   -> 1 -> 2 -> 3`}
                </pre>

                <Callout severity="trap" label="trap · snapshot vs pending">
                    <p>
                        <Code>setCount(count + 1)</Code> reads the render&apos;s stale
                        snapshot; <Code>setCount(c =&gt; c + 1)</Code> reads the pending
                        queued value. Same-looking code, different result:{" "}
                        <strong className="text-[var(--text)]">+1 vs +3</strong>.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="lazy initializer">
                <p>
                    <Term>Pass the function, don&apos;t call it.</Term>{" "}
                    <Code>useState(readInitial)</Code>, not{" "}
                    <Code>useState(readInitial())</Code>. It runs once on mount. Calling
                    it re-runs the expensive work every render (React discards the result
                    but you still paid).
                </p>
            </DocSection>

            <PartHeading kicker="part 2">Objects &amp; arrays</PartHeading>
            <div>
                <DocSection title="never mutate, replace">
                    <CodeBlock code={REPLACE} lang="tsx" />
                    <p>
                        <Term>React compares state BY REFERENCE.</Term> Assigning to a
                        field leaves the same object in place, so{" "}
                        <Code>Object.is(next, current)</Code> is <Code>true</Code> and
                        React bails out. Object and array state needs a NEW reference
                        for the update to land.
                    </p>
                    <p>
                        <Term>Spread copies, then override.</Term>{" "}
                        <Code>{"{ ...user, age: 31 }"}</Code> builds a fresh object
                        with every field of <Code>user</Code>, then replaces{" "}
                        <Code>age</Code> — later keys win. The old object is left
                        untouched, which is exactly what makes the reference check
                        meaningful.
                    </p>
                    <p>
                        <Term>It is the same rule you already know.</Term> A reducer
                        must return a new state object, a context value must be a new
                        reference to notify consumers, a{" "}
                        <Code>useMemo</Code> dep must change reference to invalidate.
                        One comparison, <Code>Object.is</Code>, everywhere.
                    </p>

                    <Callout severity="danger" label="danger · mutation is silent">
                        <p>
                            Mutating state (<Code>user.age = 31</Code>) keeps the same
                            reference, so React skips the render — the UI silently
                            goes stale, no error. Always create a new object or array.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="nested objects">
                    <CodeBlock code={NESTED} lang="tsx" />
                    <p>
                        <Term>Spread is a SHALLOW copy.</Term>{" "}
                        <Code>{"{ ...user }"}</Code> copies the top level only. The new
                        object&apos;s <Code>address</Code> still points at the ORIGINAL
                        nested object, so writing through it mutates the state you were
                        trying to replace.
                    </p>
                    <p>
                        <Term>Spread at every level down to the change.</Term> Changing{" "}
                        <Code>address.city</Code> means a new <Code>user</Code> AND a
                        new <Code>address</Code> — one fresh object per level along the
                        path. Branches you don&apos;t touch keep their old references,
                        which is fine and is what keeps the copy cheap.
                    </p>
                    <p>
                        <Term>Deep nesting is a design signal.</Term> Once the path is
                        three or four levels long the spread chain becomes unreadable
                        and easy to get wrong. Flatten the shape, split it into several
                        <Code>useState</Code> calls, or move the transitions into{" "}
                        <Code>useReducer</Code>.
                    </p>

                    <Callout severity="trap" label="trap · shallow copy">
                        <p>
                            <Code>{"{ ...obj }"}</Code> copies one level only. Updating
                            a nested value while spreading only the top level still
                            mutates the nested object — spread each level along the
                            path.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="arrays">
                    <CodeBlock code={ARRAYS} lang="tsx" />
                    <p>
                        <Term>Return a NEW array, every time.</Term> Arrays are objects
                        — same reference rule, same silent failure. The three
                        non-mutating tools cover almost everything:{" "}
                        <Code>[...arr, x]</Code> to add, <Code>map</Code> to update,{" "}
                        <Code>filter</Code> to remove. Each returns a new array and
                        leaves the old one alone.
                    </p>
                    <p>
                        <Term>Avoid the in-place methods on state.</Term>{" "}
                        <Code>push</Code>, <Code>pop</Code>, <Code>splice</Code>,{" "}
                        <Code>sort</Code> and <Code>reverse</Code> all mutate the
                        receiver and hand back the same reference (or a length), so
                        nothing re-renders. For sorting, copy first —{" "}
                        <Code>[...arr].sort()</Code>.
                    </p>
                    <p>
                        <Term>Updating an ITEM is the nested rule again.</Term>{" "}
                        <Code>map</Code> gives you a new array, but the element you
                        change also needs replacing:{" "}
                        <Code>{"{ ...t, done: true }"}</Code>. The untouched elements
                        are reused by reference, which is what lets a memoized row skip
                        its re-render.
                    </p>

                    <Callout severity="danger" label="danger · mutating array methods">
                        <p>
                            <Code>push</Code>/<Code>splice</Code>/<Code>sort</Code>/
                            <Code>reverse</Code> mutate the array in place → same
                            reference → no re-render. Use <Code>[...arr, x]</Code>,{" "}
                            <Code>map</Code> and <Code>filter</Code>, which return new
                            arrays; copy before <Code>sort</Code>/<Code>reverse</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="functional updater for objects & arrays">
                    <CodeBlock code={FUNCTIONAL_UPDATER} lang="tsx" />
                    <p>
                        <Term>These updates are BUILT from the previous value.</Term>{" "}
                        Unlike <Code>setCount(0)</Code>, every line here spreads what
                        was already there — so which copy of the collection you spread
                        decides whether earlier changes survive.
                    </p>
                    <p>
                        <Term>
                            <Code>prev</Code> is the latest state, not your snapshot.
                        </Term>{" "}
                        Spreading the state variable directly reads the value this
                        render closed over. Under batching, or in an async callback
                        that resolves later, that snapshot can already be out of date —
                        and spreading it writes a collection missing whatever landed in
                        between.
                    </p>
                    <p>
                        <Term>Object returns need parentheses.</Term>{" "}
                        <Code>{"prev => ({ ...prev })"}</Code> — without the{" "}
                        <Code>( )</Code> JavaScript reads the brace as a function body,
                        not an object literal, and the updater returns{" "}
                        <Code>undefined</Code>. Arrays need no wrapper:{" "}
                        <Code>{"prev => [...prev, x]"}</Code> is unambiguous.
                    </p>

                    <Callout severity="trap" label="trap · stale collection">
                        <p>
                            Spreading the state variable directly (
                            <Code>[...todos, x]</Code>) can spread a STALE array under
                            batching or async and drop updates. Use{" "}
                            <Code>setX(prev =&gt; ...)</Code> so <Code>prev</Code> is
                            always the latest.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useState</Code> is identical. The only wrinkle is the{" "}
                    <Code>&quot;use client&quot;</Code> requirement: a Server Component
                    can&apos;t hold state. If you reach for <Code>useState</Code> in a
                    server file, ask whether that state belongs on the client at all, or
                    whether it&apos;s server data you should fetch directly.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>what does the <Code>useState</Code> argument do after the first render?</>}
                    a={
                        <>
                            &ldquo;Nothing — it&apos;s the{" "}
                            <strong className="text-[var(--text)]">initial</strong> value,
                            read only on mount. React{" "}
                            <strong className="text-[var(--text)]">hands back the stored
                                value</strong> afterward.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>does <Code>setState</Code> change the value immediately?</>}
                        a={
                            <>
                                &ldquo;No — state is a{" "}
                                <strong className="text-[var(--text)]">snapshot</strong> for
                                the current render. <Code>setState</Code>{" "}
                                <strong className="text-[var(--text)]">schedules</strong> a
                                re-render, and React{" "}
                                <strong className="text-[var(--text)]">bails out</strong> if
                                the value is unchanged.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>why do three <Code>setCount(count + 1)</Code> calls only add one?</>}
                        a={
                            <>
                                &ldquo;They all read the same{" "}
                                <strong className="text-[var(--text)]">stale snapshot</strong>,
                                so React queues three identical &lsquo;set to 1&rsquo; updates
                                that <strong className="text-[var(--text)]">overwrite</strong>{" "}
                                each other.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>what does the parameter in <Code>setCount(c =&gt; c + 1)</Code> receive?</>}
                        a={
                            <>
                                &ldquo;The <strong className="text-[var(--text)]">pending
                                    state</strong> — the value accumulated so far in the update
                                queue — not the snapshot the render closed over, so updates{" "}
                                <strong className="text-[var(--text)]">compound</strong>.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>&ldquo;Why does the counter only go up by one when you click fast?&rdquo;</>}
                        a={
                            <>
                                &ldquo;The handler{" "}
                                <strong className="text-[var(--text)]">closes over</strong> a
                                stale <Code>count</Code>, so every queued update writes the
                                same value. The functional updater fixes it because React{" "}
                                <strong className="text-[var(--text)]">feeds it the latest
                                    state</strong>.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>&ldquo;Why pass a function to <Code>useState</Code> instead of a value?&rdquo;</>}
                        a={
                            <>
                                &ldquo;To <strong className="text-[var(--text)]">defer</strong>{" "}
                                an expensive computation so it runs{" "}
                                <strong className="text-[var(--text)]">once on mount</strong>{" "}
                                rather than on every render. It&apos;s called a{" "}
                                <strong className="text-[var(--text)]">lazy
                                    initializer</strong>.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
