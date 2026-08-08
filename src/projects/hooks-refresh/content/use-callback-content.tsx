import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). Here each of the three flagged sections is
// ENTIRELY about one severity, so the same value is also passed as the section's
// explicit `sectionSeverity` prop — the two are kept in sync by intent.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (What it is) ---
    // inline `tip · don't over-wrap` callout
    "when-it-matters": ["tip"],

    // --- part 2 (Getting it right) ---
    // inline `trap · stale closure` callout
    "stale-closure": ["trap"],
    // inline `react ⇄ next · enabling` callout
    "react-compiler": ["next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-context, use-effect, use-memo and use-reducer
// define for their own part dividers.
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
// Part 1 — What it is. The hook caches a function's IDENTITY, and that
// only buys you something when a specific downstream consumer compares
// that identity. Two fragments for the two consumers that do.
// ===================================================================

const MEMOIZED_FUNCTION = `import { useCallback } from "react";

const handleClick = useCallback(() => doSomething(id), [id]);
//                              ^^^^^^^^^^^^^^^^^^^^^  ^^^^
//                              1st arg — the fn       2nd arg — the deps
//                              React STORES it and    compared by Object.is
//                              returns the SAME one   any change -> a NEW
//                              until a dep changes    function reference`;

const MEMO_CHILD = `// A — a React.memo child compares its props by reference
import { memo, useCallback } from "react";

const Child = memo(function Child({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>go</button>;
});

const handleClick = useCallback(() => doThing(id), [id]);

<Child onClick={handleClick} />;   // stable -> Child skips its re-render`;

const EFFECT_DEP = `// B — an effect compares its deps by reference
import { useCallback, useEffect } from "react";

const load = useCallback(() => fetchData(id), [id]);

useEffect(() => {
  load();
}, [load]);   // stable -> runs on mount, then only when \`id\` changes`;

// ===================================================================
// Part 2 — Getting it right. The dep array is where useCallback goes
// wrong (and it goes wrong harder than useMemo, because the stale
// version is CACHED), and the compiler is where the manual exercise
// is heading.
// ===================================================================

const STALE_CLOSURE = `const [count, setCount] = useState(0);

// BROKEN — the function READS \`count\` but doesn't list it
const log = useCallback(() => console.log(count), []);   // frozen at count = 0

// fix 1 — list what the function reads
const logFixed = useCallback(() => console.log(count), [count]);

// fix 2 — functional updater: closes over nothing, so nothing to list
const inc = useCallback(() => setCount((c) => c + 1), []);`;

// Next 16 promoted this out of `experimental`. Verified against
// node_modules/next/dist/docs/.../next-config-js/reactCompiler.md — keep this
// fragment in step with the installed version, not with older blog posts.
const REACT_COMPILER = `// next.config.ts — top-level and stable since Next 16
// (it was \`experimental.reactCompiler\` before)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,   // opt-in — off by default
};

export default nextConfig;`;

export function UseCallbackDocs() {
    return (
        <>
            <PartHeading kicker="part 1">What it is</PartHeading>
            <div>
                <DocSection title="memoized function">
                    <CodeBlock code={MEMOIZED_FUNCTION} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useCallback</Code> returns the SAME function
                            reference across renders
                        </Term>{" "}
                        unless a dependency changes. That is the whole feature.
                    </p>
                    <p>
                        <Term>Every render normally recreates its functions.</Term>{" "}
                        A function expression written in the component body is a new
                        object each time the component runs — same code, different
                        reference. <Code>useCallback</Code> hands back the cached one
                        instead, until an entry in <Code>[deps]</Code> differs by{" "}
                        <Code>Object.is</Code>.
                    </p>
                    <p>
                        <Term>
                            It is literally <Code>useMemo(() =&gt; fn, deps)</Code>.
                        </Term>{" "}
                        A value memoizer specialized for functions —{" "}
                        <Code>useMemo</Code> caches what its function RETURNS, so
                        returning the function itself is the same thing.{" "}
                        <Code>useCallback</Code> just spares you the extra arrow.
                    </p>
                    <p>
                        <Term>It does not make the function faster.</Term> The body
                        still runs in full every time you call it. What is cached is
                        which function you are holding — <Code>useCallback</Code>{" "}
                        stabilizes IDENTITY, nothing else.
                    </p>
                </DocSection>

                <DocSection title="when it matters" sectionSeverity="tip">
                    <CodeBlock code={MEMO_CHILD} lang="tsx" />
                    <p>
                        <Term>
                            A <Code>React.memo</Code> child compares its props by
                            reference.
                        </Term>{" "}
                        Give it a fresh function every render and the comparison fails
                        every render, so the child re-renders anyway and the{" "}
                        <Code>memo</Code> wrapper buys nothing. A stable{" "}
                        <Code>handleClick</Code> is what lets it actually skip.
                    </p>

                    <CodeBlock code={EFFECT_DEP} lang="tsx" />
                    <p>
                        <Term>
                            An effect or hook dependency compares by reference too.
                        </Term>{" "}
                        A function rebuilt each render, listed in a dep array, re-runs
                        that effect on every render. Memoizing it makes the effect fire
                        when <Code>id</Code> changes — which is what the dep array was
                        trying to say.
                    </p>
                    <p>
                        <Term>
                            No comparer downstream, no benefit — just overhead.
                        </Term>{" "}
                        If the function is neither passed to a memoized child nor used
                        as a dependency, nothing on the page ever looks at its
                        identity. React still stores the function and the dep array and
                        compares every entry on every render, forever, for no one.
                    </p>
                    <p>
                        <Term>
                            Used by exactly one effect? Move it INSIDE the effect.
                        </Term>{" "}
                        That removes the dependency instead of stabilizing it — no
                        hook, no dep array to keep correct, and the function can read
                        whatever it likes without going stale.
                    </p>

                    <Callout severity="tip" label="tip · don't over-wrap">
                        <p>
                            <Code>useCallback</Code> helps only when a{" "}
                            <Code>React.memo</Code> child or an effect/hook dependency
                            compares the function&apos;s identity. Wrapping every
                            handler &quot;to be safe&quot; is noise.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Getting it right</PartHeading>
            <div>
                <DocSection title="stale closure" sectionSeverity="trap">
                    <CodeBlock code={STALE_CLOSURE} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useCallback</Code> freezes the function AND the values
                            it closed over.
                        </Term>{" "}
                        The cached function was created during some earlier render and
                        captured that render&apos;s variables. It keeps them until a
                        dependency changes and React builds a new one.
                    </p>
                    <p>
                        <Term>Omit a value the function reads and it stays old.</Term>{" "}
                        <Code>log</Code> above reads <Code>count</Code> but lists{" "}
                        <Code>[]</Code>, so React never rebuilds it and it logs{" "}
                        <Code>0</Code> forever — however many times you increment.
                        Nothing throws; the behaviour is simply wrong.
                    </p>
                    <p>
                        <Term>Being cached is what makes it stick.</Term> An unmemoized
                        function is at least rebuilt every render, so it reads current
                        values by accident. Memoizing removes that accident: the stale
                        version is the one you keep.
                    </p>
                    <p>
                        <Term>
                            Same trap as <Code>useEffect</Code>, same two fixes.
                        </Term>{" "}
                        List every reactive value the function reads (
                        <Code>react-hooks/exhaustive-deps</Code> catches most of these),
                        or use a functional updater so you never close over the value in
                        the first place — <Code>setCount(c =&gt; c + 1)</Code> needs no
                        dep because it reads <Code>c</Code> from React, not from the
                        closure.
                    </p>

                    <Callout severity="trap" label="trap · stale closure">
                        <p>
                            A missing dependency freezes the values the function closed
                            over — the cached function keeps reading stale values. Add
                            what it reads to the deps, or use a functional updater (
                            <Code>setX(prev =&gt; ...)</Code>) so it doesn&apos;t
                            capture them.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="react compiler" sectionSeverity="next">
                    <CodeBlock code={REACT_COMPILER} lang="ts" />
                    <p>
                        <Term>
                            React 19&apos;s React Compiler auto-memoizes at BUILD time.
                        </Term>{" "}
                        It analyses your components and inserts the equivalent of{" "}
                        <Code>useCallback</Code>, <Code>useMemo</Code> and{" "}
                        <Code>React.memo</Code> for you, so function identity stays
                        stable without a hook written by hand.
                    </p>
                    <p>
                        <Term>It is OPT-IN, not on by default.</Term> You enable it in
                        the config and install the compiler&apos;s Babel plugin (
                        <Code>babel-plugin-react-compiler</Code>). Until you do, none of
                        this happens and your manual memoization is all there is.
                    </p>
                    <p>
                        <Term>With it on, manual useCallback is largely redundant.</Term>{" "}
                        Knowing the hook still matters — you will read years of code
                        written before the compiler, and you need to know what it is
                        doing on your behalf — but stop reflexively wrapping new code.
                    </p>
                    <p>
                        <Term>Check the current docs before copying that config.</Term>{" "}
                        The flag has moved: it was{" "}
                        <Code>experimental.reactCompiler</Code> and became top-level{" "}
                        <Code>reactCompiler</Code> when it stabilized in Next 16.
                        Fragments like this one age faster than the concept does.
                    </p>
                    <p>
                        <Term>
                            The <Code>useMemo</Code> page covers the same mechanism.
                        </Term>{" "}
                        It is one compiler doing both jobs, under one condition: your
                        components must be PURE. See the purity note there rather than
                        having it twice.
                    </p>

                    <Callout severity="next" label="react ⇄ next · enabling">
                        <p>
                            In Next.js you enable it in <Code>next.config</Code> (
                            <Code>reactCompiler: true</Code>, previously{" "}
                            <Code>experimental.reactCompiler</Code>) plus the
                            compiler&apos;s Babel plugin. Server Components don&apos;t
                            re-render, so this is a client concern.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useCallback</Code> is identical to React — same signature,
                    same semantics, nothing about the App Router changes it. It is a
                    hook, so it needs <Code>&quot;use client&quot;</Code>; that is the
                    only mechanical difference.
                </p>
                <p>
                    The Next-relevant angle is the React Compiler above: Next ships the
                    integration, and turning it on is a config decision rather than a
                    code one. Beyond that, a Server Component renders once and never
                    re-renders, so there is no identity to preserve —{" "}
                    <Code>useCallback</Code> only ever applies to Client Components.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>when does <Code>useCallback</Code> actually help?</>}
                    a={
                        <>
                            &ldquo;Only when a <Code>React.memo</Code> child or an
                            effect/hook dependency{" "}
                            <Term>compares the function&apos;s reference</Term> —
                            otherwise it&apos;s overhead.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>why did my memoized callback read an old value?</>}
                        a={
                            <>
                                &ldquo;A <Term>missing dependency</Term> froze the value
                                it closed over; the cached function kept the stale one.
                                Add the dep or use a functional updater.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
