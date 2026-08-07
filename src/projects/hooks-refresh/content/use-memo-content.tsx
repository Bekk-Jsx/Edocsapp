import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header — that is
// the explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic
// is one severity. No section on this page is.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Using it) ---
    // inline `note · useMemo vs React.memo` callout — a value vs a component
    "use-2-stabilize-a-reference": ["note"],
    // inline `tip · don't over-memoize` callout
    "when-it-s-pointless": ["tip"],

    // --- part 2 (Getting it right) ---
    // two inline traps — a missing dep goes stale, an unstable dep never caches
    "the-dependency-array": ["trap"],
    // inline `react ⇄ next · enabling` callout plus `trap · compiler needs pure code`
    "react-compiler": ["trap", "next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-context, use-effect and use-reducer define for
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
// Part 1 — Using it. What the hook caches, and the only two situations
// that justify reaching for it: work that is genuinely expensive, and a
// reference something downstream compares. Every fragment is a slice of
// one running example — a store list with a computed total and a
// memoized child.
// ===================================================================

const WHAT_IT_MEMOIZES = `import { useMemo } from "react";

const sorted = useMemo(() => expensiveSort(items), [items]);
//                     ^^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^
//                     1st arg — the compute fn    2nd arg — the deps
//                     React runs it and keeps     when one of these changes
//                     the RESULT, not the fn      by reference, it runs again`;

const SKIP_EXPENSIVE = `// store.tsx
const [items, setItems] = useState(buildItems);   // built once; stable reference

const total = useMemo(
  () => items.reduce((sum, it) => sum + it.price, 0),
  [items],   // recompute ONLY when the array reference changes
);`;

const STABILIZE_MEMO_CHILD = `// A — a React.memo child compares its props by reference
import { memo, useMemo } from "react";

const MemoizedChild = memo(function Child({ config }: { config: Config }) {
  return <p>{config.taxRate}</p>;
});

const config = useMemo(() => ({ taxRate }), [taxRate]);

<MemoizedChild config={config} />   // same ref -> the child skips its re-render`;

const STABILIZE_EFFECT_DEP = `// B — an effect compares its deps by reference
import { useEffect, useMemo } from "react";

const config = useMemo(() => ({ theme }), [theme]);

useEffect(() => {
  doSomething(config);
}, [config]);   // runs on mount, then only when \`theme\` changes`;

const POINTLESS = `const x = useMemo(() => a + b, [a, b]);   // pointless
const x = a + b;                          // just write this`;

// ===================================================================
// Part 2 — Getting it right. The dependency array is where useMemo
// actually goes wrong, and the compiler is where the whole manual
// exercise is heading.
// ===================================================================

const MISSING_DEP = `// MISSING DEP — the memo never learns that \`rate\` moved
const total = useMemo(
  () => items.reduce((sum, it) => sum + it.price, 0) * rate,
  [items],   // \`rate\` is READ but not listed -> stale total
);`;

const UNSTABLE_DEP = `// UNSTABLE DEP — a fresh object on every render
const filter = { active: true };          // new reference each time

const result = useMemo(
  () => heavyFilter(items, filter),
  [items, filter],   // never Object.is-equal -> recomputes every render
);

// fix — depend on the primitive inside it
const result = useMemo(
  () => heavyFilter(items, { active: true }),
  [items, active],
);`;

// Next 16 promoted this out of `experimental`. Verified against
// node_modules/next/dist/docs/.../next-config-js/reactCompiler.md — keep this
// fragment in step with the installed version, not with older blog posts.
const REACT_COMPILER = `// next.config.ts — stable and TOP-LEVEL since Next 16
// (it was \`experimental.reactCompiler\` before)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,   // opt-in — off by default
};

export default nextConfig;`;

export function UseMemoDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Using it</PartHeading>
            <div>
                <DocSection title="what it memoizes">
                    <CodeBlock code={WHAT_IT_MEMOIZES} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useMemo</Code> caches a COMPUTED VALUE across
                            renders.
                        </Term>{" "}
                        It runs the function on the first render, keeps the result,
                        and hands back that same result on every render after —
                        until a dependency changes.
                    </p>
                    <p>
                        <Term>First argument — the compute function.</Term> React
                        calls it for you and stores what it RETURNS. The function
                        itself is thrown away; only the value is kept (memoizing a
                        function is <Code>useCallback</Code>).
                    </p>
                    <p>
                        <Term>Second argument — the dependency array.</Term> After
                        each render React compares every entry with the previous one
                        by <Code>Object.is</Code> — the same reference check{" "}
                        <Code>useState</Code> uses. All equal → return the cache.
                        Any different → run the function again and store the new
                        result.
                    </p>
                    <p>
                        <Term>Without it, the computation runs every render.</Term>{" "}
                        A plain <Code>const sorted = expensiveSort(items)</Code> is
                        recomputed whenever the component renders, for any reason —
                        an unrelated state update, a parent re-render, a context
                        change.
                    </p>
                    <p>
                        <Term>It changes HOW OFTEN you compute, not WHAT.</Term> The
                        value is identical either way. Removing every{" "}
                        <Code>useMemo</Code> on a page can only make it slower, never
                        wrong — which is why it is an optimization, not a feature.
                    </p>
                </DocSection>

                <DocSection title="use 1 · skip expensive work">
                    <CodeBlock code={SKIP_EXPENSIVE} lang="tsx" />
                    <p>
                        <Term>Skip redoing heavy work on unrelated re-renders.</Term>{" "}
                        A big <Code>reduce</Code>, <Code>sort</Code> or{" "}
                        <Code>filter</Code> over a long list costs the same whether
                        the render was caused by that list or by a counter elsewhere
                        in the component. Memoizing it means the cost is paid when{" "}
                        <Code>items</Code> actually changes.
                    </p>
                    <p>
                        <Term>The dep is the array&apos;s REFERENCE, not its contents.</Term>{" "}
                        React does not walk the list to see whether anything moved.
                        Replace the array (<Code>setItems([...items, next])</Code>)
                        and the memo recomputes; mutate it in place and the memo
                        happily returns a stale total.
                    </p>
                    <p>
                        <Term>The source must be a stable reference.</Term>{" "}
                        <Code>items</Code> here comes from <Code>useState</Code>, so
                        it survives re-renders untouched. Build it inline —{" "}
                        <Code>const items = rows.map(...)</Code> — and it is new
                        every render, so the memo recomputes every render and buys
                        you nothing.
                    </p>
                    <p>
                        <Term>&quot;Expensive&quot; means measured.</Term> Adding two
                        numbers, formatting a string, filtering ten rows — all of it
                        is cheaper than the memo bookkeeping. Profile the render
                        first; memoize what the profiler actually flags.
                    </p>
                </DocSection>

                <DocSection title="use 2 · stabilize a reference">
                    <CodeBlock code={STABILIZE_MEMO_CHILD} lang="tsx" />
                    <p>
                        <Term>An inline object is a NEW reference every render.</Term>{" "}
                        <Code>{"{ taxRate }"}</Code> written in the body creates a
                        fresh object each time, even when <Code>taxRate</Code> has
                        not moved. <Code>useMemo</Code> keeps the SAME object until
                        its deps change.
                    </p>
                    <p>
                        <Term>Here the value being cheap is beside the point.</Term>{" "}
                        Building <Code>{"{ taxRate }"}</Code> costs nothing; the
                        reason to memoize it is that <Code>MemoizedChild</Code>{" "}
                        compares props by reference and would re-render on every
                        parent render without it.
                    </p>

                    <CodeBlock code={STABILIZE_EFFECT_DEP} lang="tsx" />
                    <p>
                        <Term>The same trick unblocks a dependency array.</Term> An
                        object rebuilt every render, used as an effect dep, re-runs
                        that effect every render. Memoizing it makes the effect fire
                        when <Code>theme</Code> changes — which is what the dep array
                        was trying to say.
                    </p>
                    <p>
                        <Term>
                            This only matters when something COMPARES the reference.
                        </Term>{" "}
                        A <Code>React.memo</Code> child, an effect or memo
                        dependency, a context value. Hand the object to plain JSX
                        that reads it and stability buys you nothing.
                    </p>

                    <Callout severity="note" label="note · useMemo vs React.memo">
                        <p>
                            <Code>useMemo</Code> memoizes a VALUE inside a component.{" "}
                            <Code>React.memo</Code> memoizes a COMPONENT&apos;S
                            render, comparing its props by reference. They team up:{" "}
                            <Code>useMemo</Code> and <Code>useCallback</Code> keep
                            props stable so a <Code>React.memo</Code> child can
                            actually skip re-rendering.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="when it's pointless">
                    <CodeBlock code={POINTLESS} lang="tsx" />
                    <p>
                        <Term>
                            Cheap value, no identity consumer — pure overhead.
                        </Term>{" "}
                        If the result is not passed to a memoized child and is not a
                        dependency anywhere, <Code>useMemo</Code> adds work rather
                        than removing it.
                    </p>
                    <p>
                        <Term>The memo is not free.</Term> React stores the value and
                        the dependency array on the fiber, then compares every entry
                        on every render. For <Code>a + b</Code> that costs more than
                        the addition it is avoiding, and it costs it forever.
                    </p>
                    <p>
                        <Term>Don&apos;t wrap everything &quot;to be safe&quot;.</Term>{" "}
                        It also costs readability: each <Code>useMemo</Code> is a dep
                        array to keep correct, and a page full of them hides the two
                        that were load-bearing.
                    </p>

                    <Callout severity="tip" label="tip · don't over-memoize">
                        <p>
                            <Code>useMemo</Code> helps only when the consumer
                            compares identity (a <Code>React.memo</Code> child, or an
                            effect/memo dependency) or the computation is genuinely
                            heavy. Otherwise it&apos;s noise.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Getting it right</PartHeading>
            <div>
                <DocSection title="the dependency array">
                    <CodeBlock code={MISSING_DEP} lang="tsx" />
                    <p>
                        <Term>Deps are compared BY REFERENCE.</Term>{" "}
                        <Code>Object.is</Code> on each entry, in order. Primitives
                        compare by value; objects, arrays and functions compare by
                        identity.
                    </p>
                    <p>
                        <Term>Miss a value you READ and the result goes stale.</Term>{" "}
                        The computation above reads <Code>rate</Code>, but only{" "}
                        <Code>items</Code> is listed — so changing the rate leaves
                        React seeing no dep change and returning the OLD total.
                        Nothing throws; the number on screen is simply wrong.
                    </p>

                    <CodeBlock code={UNSTABLE_DEP} lang="tsx" />
                    <p>
                        <Term>
                            An inline object, array or function AS a dep never
                            matches.
                        </Term>{" "}
                        <Code>filter</Code> is rebuilt every render, so the reference
                        check fails every render and the memo recomputes every
                        render — all of the cost, none of the caching.
                    </p>
                    <p>
                        <Term>
                            Fix: list everything you read, and depend on stable refs
                            or primitives.
                        </Term>{" "}
                        Hoist the constant out of the component, memoize the object,
                        or depend on the primitive inside it —{" "}
                        <Code>[items, filter.active]</Code> instead of{" "}
                        <Code>[items, filter]</Code>. The{" "}
                        <Code>react-hooks/exhaustive-deps</Code> lint rule catches
                        the first mistake; only reading the code catches the second.
                    </p>

                    <Callout severity="trap" label="trap · missing dep">
                        <p>
                            If the computation reads a value not in the deps,{" "}
                            <Code>useMemo</Code> returns the OLD cached result when
                            that value changes — the UI goes stale. Put everything
                            you read in the array.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · unstable dep">
                        <p>
                            An inline object, array or function as a dependency is a
                            new reference every render, so <Code>useMemo</Code>{" "}
                            recomputes every time — pointless. Depend on stable
                            references or primitives.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="react compiler">
                    <CodeBlock code={REACT_COMPILER} lang="ts" />
                    <p>
                        <Term>The React Compiler auto-memoizes at BUILD time.</Term>{" "}
                        It analyses your components and inserts the equivalent of{" "}
                        <Code>useMemo</Code>, <Code>useCallback</Code> and{" "}
                        <Code>React.memo</Code> for you, so values and children stop
                        re-rendering without a single hook written by hand.
                    </p>
                    <p>
                        <Term>It is OPT-IN, not on by default.</Term> You enable it
                        in the config and install the compiler&apos;s Babel plugin
                        (<Code>babel-plugin-react-compiler</Code>). Until you do, none
                        of this happens and your manual memoization is all there is.
                    </p>
                    <p>
                        <Term>With it on, manual memoization is largely redundant.</Term>{" "}
                        Understanding <Code>useMemo</Code> still matters — you will
                        read years of code written before the compiler, and you need
                        to know what it is doing for you — but stop reflexively
                        wrapping new code.
                    </p>
                    <p>
                        <Term>Check the current docs before copying that config.</Term>{" "}
                        The flag has moved: it was{" "}
                        <Code>experimental.reactCompiler</Code> and became top-level{" "}
                        <Code>reactCompiler</Code> when it stabilized in Next 16.
                        Fragments like this one age faster than the concept does.
                    </p>

                    <Callout severity="next" label="react ⇄ next · enabling">
                        <p>
                            In Next.js you enable it in{" "}
                            <Code>next.config</Code> (<Code>reactCompiler: true</Code>
                            , previously <Code>experimental.reactCompiler</Code>) plus
                            the compiler&apos;s Babel plugin. Server Components
                            don&apos;t re-render, so memoization is a client concern.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · compiler needs pure code">
                        <p>
                            The compiler only memoizes what it can PROVE is safe and
                            skips the rest — so it won&apos;t wrongly memoize correct
                            code. But it assumes your components are PURE (no
                            mutation or side effects during render). Impure code can
                            break only WHEN the compiler is on, because it exposes a
                            rule you were already violating — the same principle as
                            Strict Mode&apos;s double-invoke. An ESLint rule flags
                            violations, and you can opt a component out with{" "}
                            <Code>&quot;use no memo&quot;</Code> if needed.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useMemo</Code> is identical to React — same signature, same
                    semantics, nothing about the App Router changes it. The
                    Next-relevant angle is the React Compiler above: Next ships the
                    integration, and enabling it is a config decision rather than a
                    code one.
                </p>
                <p>
                    The other Next-specific point is where the work runs at all. A
                    Server Component renders once and never re-renders, so there is
                    nothing to memoize — heavy data shaping usually belongs there,
                    not in a memo on the client. <Code>useMemo</Code> applies to
                    Client Components, whose inputs change over time.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>when does <Code>useMemo</Code> actually help?</>}
                    a={
                        <>
                            &ldquo;When the computation is{" "}
                            <Term>genuinely expensive</Term>, or when it{" "}
                            <Term>stabilizes a reference</Term> that a{" "}
                            <Code>React.memo</Code> child or an effect dependency
                            compares. Otherwise it&apos;s overhead.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>what happens if a dependency is missing?</>}
                        a={
                            <>
                                &ldquo;<Code>useMemo</Code> returns the{" "}
                                <Term>stale cached value</Term> when that value
                                changes, because it never saw a dep change.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
