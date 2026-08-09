import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). Both flagged sections are ENTIRELY about
// one severity, so the same value is also passed as the section's explicit
// `sectionSeverity` — the two are kept in sync by intent.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (Using it right) ---
    // inline `trap · don't wrap the urgent update` callout
    "keep-the-urgent-update-outside": ["trap"],
    // inline `trap · not for async/network` callout
    "it-prioritizes-rendering-not-fetching": ["trap"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-effect, use-layout-effect
// and use-reducer define for their own part dividers.
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
// Part 1 — The idea. Two priorities of state update, and the one
// problem that distinction exists to fix.
// ===================================================================

const URGENT_VS_NON_URGENT = `import { useTransition } from "react";

const [isPending, startTransition] = useTransition();

startTransition(() => { setResults(filterHugeList(query)); }); // marked non-urgent`;

const THE_PROBLEM = `// ❌ both urgent — typing waits for the heavy filter
setQuery(v);
setResults(filter(bigList, v));

// ✅ input urgent, filter non-urgent
setQuery(v);
startTransition(() => setResults(filter(bigList, v)));`;

// ===================================================================
// Part 2 — Using it right. The pending flag, and the two ways people
// reach for the hook and get nothing back: wrapping the wrong update,
// and expecting it to help with the network.
// ===================================================================

const IS_PENDING = `const [isPending, startTransition] = useTransition();

<input value={query} onChange={onChange} />            // instant
<ul style={{ opacity: isPending ? 0.5 : 1 }}>...</ul>  // dim while updating`;

const KEEP_URGENT_OUTSIDE = `// ❌ input update is now non-urgent too -> typing lags again
startTransition(() => { setQuery(v); setResults(filter(v)); });

// ✅ input outside (urgent), heavy update inside (non-urgent)
setQuery(v);
startTransition(() => setResults(filter(v)));`;

const NOT_FOR_ASYNC = `// ❌ the async part escapes the transition
startTransition(async () => {
  const data = await fetch(...);
  setResults(data);
});`;

export function UseTransitionDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The idea</PartHeading>
            <div>
                <DocSection title="urgent vs non-urgent">
                    <CodeBlock code={URGENT_VS_NON_URGENT} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useTransition</Code> marks a state update as NON-URGENT.
                        </Term>{" "}
                        A transition is an update React is allowed to take its time over,
                        so it doesn&apos;t block the updates that can&apos;t wait.
                    </p>
                    <p>
                        <Term>React splits work into two priorities.</Term> URGENT —
                        typing, clicking, anything that must feel instant. NON-URGENT —
                        re-rendering a big list from that input, which can lag slightly
                        without anyone minding.
                    </p>
                    <p>
                        <Term>It returns a pair.</Term>{" "}
                        <Code>startTransition(fn)</Code> marks the updates inside{" "}
                        <Code>fn</Code> low-priority; <Code>isPending</Code> is{" "}
                        <Code>true</Code> while that transition is still running.
                    </p>
                </DocSection>

                <DocSection title="the problem it solves">
                    <CodeBlock code={THE_PROBLEM} lang="tsx" />
                    <p>
                        <Term>
                            Filtering a huge list on every keystroke makes typing feel
                            frozen.
                        </Term>{" "}
                        Both updates are urgent, so the heavy re-render sits between you
                        and the character you just typed.
                    </p>
                    <p>
                        <Term>Split it by priority.</Term> The input update stays outside
                        — urgent, so the character appears instantly. The heavy list
                        update goes inside <Code>startTransition</Code> — low priority,
                        allowed to lag, and interruptible.
                    </p>
                    <p>
                        <Term>WITHOUT — typing &quot;avatar&quot;:</Term>{" "}
                        <Code>a</Code> waits for a full 10k filter, then{" "}
                        <Code>v</Code> waits for another, then <Code>a</Code>, and so on.
                        Six letters, six blocking re-renders — the input stutters behind
                        your fingers.
                    </p>
                    <p>
                        <Term>WITH — the same six letters:</Term> each one paints
                        immediately. React starts filtering after <Code>a</Code>, then
                        ABANDONS that work when <Code>v</Code> arrives, and again at each
                        keystroke. The list only fully updates once you pause — which is
                        the only moment its result was ever going to be looked at.
                    </p>
                    <p>
                        <Term>This is NOT debounce.</Term> Debounce delays STARTING the
                        work by a fixed timer. A transition starts immediately at low
                        priority and is interruptible — no timer, and no guessing at how
                        long to wait.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Using it right</PartHeading>
            <div>
                <DocSection title="isPending feedback">
                    <CodeBlock code={IS_PENDING} lang="tsx" />
                    <p>
                        <Term>
                            <Code>isPending</Code> is true while the transition is
                            processing.
                        </Term>{" "}
                        It is the hook&apos;s answer to &quot;how do I show that something
                        is happening&quot; without blocking anything to show it.
                    </p>
                    <p>
                        <Term>Use it for non-blocking feedback.</Term> A spinner, or
                        dimming the stale list. The list fades while it catches up, then
                        snaps back to full opacity — and the input never freezes at any
                        point.
                    </p>
                    <p>
                        <Term>Keep the flag off the expensive subtree.</Term> Passing{" "}
                        <Code>isPending</Code> INTO a memoized list re-renders it on every
                        keystroke and undoes the split. Put the dimming on a wrapper
                        around it instead.
                    </p>
                </DocSection>

                <DocSection
                    title="keep the urgent update outside"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={KEEP_URGENT_OUTSIDE} lang="tsx" />
                    <p>
                        <Term>
                            The update that must feel instant MUST stay outside.
                        </Term>{" "}
                        <Code>setQuery</Code> is what puts the character on screen. Inside{" "}
                        <Code>startTransition</Code> it becomes low-priority like
                        everything else in there.
                    </p>
                    <p>
                        <Term>Wrapping it reintroduces exactly the lag you removed.</Term>{" "}
                        The typing now waits its turn behind the filter again, and the
                        hook has bought you nothing — the code merely looks like it was
                        optimized.
                    </p>
                    <p>
                        <Term>The rule is one line long.</Term> Urgent update outside,
                        heavy update inside. If you can&apos;t say which of your two
                        updates is which, the hook is not what you need yet.
                    </p>

                    <Callout severity="trap" label="trap · don't wrap the urgent update">
                        <p>
                            Only the heavy, non-urgent update goes inside{" "}
                            <Code>startTransition</Code>. Keep the input/state that must
                            feel instant OUTSIDE it, or you make the very thing you wanted
                            responsive laggy.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection
                    title="it prioritizes rendering, not fetching"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={NOT_FOR_ASYNC} lang="tsx" />
                    <p>
                        <Term>
                            <Code>startTransition</Code> marks the SYNCHRONOUS state
                            updates inside it.
                        </Term>{" "}
                        It is a rendering-priority tool. There is no mechanism here for
                        making a network request non-urgent, because the request was never
                        competing for the main thread.
                    </p>
                    <p>
                        <Term>The await escapes it.</Term> The callback returns at the{" "}
                        <Code>await</Code>, and the <Code>setResults</Code> that runs a
                        second later is a separate, ordinary update. For async data reach
                        for Suspense, <Code>useDeferredValue</Code>, or a data library.
                    </p>
                    <p>
                        <Term>
                            It helps when the bottleneck is a heavy SYNCHRONOUS re-render.
                        </Term>{" "}
                        Big lists, expensive filter/sort, deep trees. It does nothing
                        useful for a slow network request — or for a small list that was
                        never slow to begin with.
                    </p>

                    <Callout severity="trap" label="trap · not for async/network">
                        <p>
                            <Code>useTransition</Code> prioritizes RENDERING work, not
                            fetching. Awaiting inside <Code>startTransition</Code>{" "}
                            doesn&apos;t make the request non-urgent. Use it for heavy
                            synchronous re-renders; use Suspense/data libraries for slow
                            network.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useTransition</Code> is identical to React — nothing about the
                    App Router changes it. It is a concurrent-rendering feature for keeping
                    the CLIENT UI responsive, so it needs{" "}
                    <Code>&quot;use client&quot;</Code> and has no effect on server
                    rendering.
                </p>
                <p>
                    React 19 improved async transitions, but the model is unchanged:
                    transitions prioritize rendering, not the network. If your slowness is
                    a request rather than a re-render, this is the wrong hook regardless of
                    framework.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            how is <Code>useTransition</Code> different from debounce?
                        </>
                    }
                    a={
                        <>
                            &ldquo;Debounce <Term>delays starting</Term> the work by a
                            fixed timer; <Code>useTransition</Code> starts immediately at
                            low priority and is <Term>interruptible</Term> — intermediate
                            updates are abandoned when newer input arrives, so the list
                            updates on a pause.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                what must stay outside <Code>startTransition</Code>?
                            </>
                        }
                        a={
                            <>
                                &ldquo;The <Term>urgent update that must feel instant</Term>{" "}
                                — the input value. Only the heavy, non-urgent update goes
                                inside.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
