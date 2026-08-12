import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Two dangers, and they are the two ways a hand-built store breaks at runtime:
// forgetting to notify (UI silently stale) and an unstable snapshot (infinite
// loop). The build-up sections are unflagged — they are mechanism, not hazard.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (Building the store) ---
    // inline `danger · change without notifying = stale UI` callout
    "emit-notifying": ["danger"],
    // --- part 3 (Connecting to React) ---
    // inline `danger · new object each read = infinite loop` callout
    "stable-snapshot": ["danger"],
    // inline `react ⇄ next · getServerSnapshot` callout
    "ssr-snapshot": ["next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-effect, use-id,
// use-layout-effect, use-memo and use-reducer define for their own part dividers.
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
// Part 1 — What & why. The data alone, before any machinery: a module
// variable is already "shared state outside React". Everything that
// follows exists only to tell React when it moves.
// ===================================================================

const WHAT_A_STORE_IS = `// counterStore.ts — plain JS module, no React
let state = 0; // shared data, lives OUTSIDE React`;

// ===================================================================
// Part 2 — Building the store. Three fragments, each adding one piece
// and each useless without the next: a listener list nobody calls, a
// notification with no value to read, a value nobody is told about.
// ===================================================================

const SUBSCRIBE = `const listeners = new Set();

export const counterStore = {
  subscribe(callback) {
    listeners.add(callback);
    // the return value IS the unsubscribe (cleanup)
    return () => listeners.delete(callback);
  },
};`;

const EMIT = `function emit() { listeners.forEach((cb) => cb()); }

increment() { state = state + 1; emit(); } // change, THEN notify`;

const GET_SNAPSHOT = `getSnapshot() { return state; } // current value`;

// ===================================================================
// Part 3 — Connecting to React. The store is finished and framework
// -agnostic; these three are about the bridge and the two ways it
// blows up (unstable snapshot, missing server snapshot).
// ===================================================================

const BRIDGE = `"use client";
import { useSyncExternalStore } from "react";
import { counterStore } from "./counterStore";

function Counter() {
  const count = useSyncExternalStore(
    counterStore.subscribe,  // how React listens
    counterStore.getSnapshot, // how React reads
  );
  return (
    <>
      <p>{count}</p>
      <button onClick={() => counterStore.increment()}>
        +1
      </button>
    </>
  );
}`;

const STABLE_SNAPSHOT = `// ❌ a new object every call -> infinite loop
getSnapshot() { return { count: state }; }

// ✅ a primitive (or the stored reference)
getSnapshot() { return state; }`;

// Wrapped one-arg-per-line: as a single line it overflows the code frame and
// hides the third argument, which is the entire point of this fragment.
const SSR_SNAPSHOT = `const count = useSyncExternalStore(
  store.subscribe,
  store.getSnapshot,
  () => 0, // 3rd arg — the server snapshot
);`;

export function CustomStoreDocs() {
    return (
        <>
            <PartHeading kicker="part 1">What &amp; why</PartHeading>
            <div>
                <DocSection title="what a store is">
                    <CodeBlock code={WHAT_A_STORE_IS} lang="ts" />
                    <p>
                        <Term>A store is shared state that lives OUTSIDE React.</Term>{" "}
                        It sits in a plain module, so any number of components read the
                        same data — unlike <Code>useState</Code>, which is trapped in the
                        one component that called it and has to be passed down by hand.
                    </p>
                    <p>
                        <Term>A CUSTOM store is one you build yourself.</Term> No Redux,
                        no Zustand — a module, an object and a few functions. Worth doing
                        once, because it is what those libraries are underneath.
                    </p>
                    <p>
                        <Term>It needs three things.</Term> The data, a way to change it,
                        and a way to NOTIFY React when it changes. That third one is the
                        whole difficulty: React cannot see state outside itself, so the
                        store has to tell it.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Building the store</PartHeading>
            <div>
                <DocSection title="subscribe — listening">
                    <CodeBlock code={SUBSCRIBE} lang="ts" />
                    <p>
                        <Term>Components register a listener to be told about changes.</Term>{" "}
                        <Code>subscribe</Code> takes a callback, adds it to a{" "}
                        <Code>Set</Code>, and hands back a function that removes it again.
                    </p>
                    <p>
                        <Term>The return value is the cleanup.</Term> Whoever subscribed
                        calls it to unsubscribe — a <Code>Set</Code> makes both the add and
                        the delete trivial and keeps duplicates out for free.
                    </p>
                    <p>
                        <Term>The callback is not ours.</Term>{" "}
                        <Code>useSyncExternalStore</Code>{" "}
                        passes React&apos;s OWN callback
                        in here. We never write it and never look inside it — we store it
                        and call it later.
                    </p>
                </DocSection>

                <DocSection title="emit — notifying" sectionSeverity="danger">
                    <CodeBlock code={EMIT} lang="ts" />
                    <p>
                        <Term>A listener list is useless until something calls it.</Term>{" "}
                        <Code>emit()</Code>{" "}
                        runs every registered listener. It carries no
                        data — it is purely the signal &ldquo;something changed,
                        re-check&rdquo;.
                    </p>
                    <p>
                        <Term>
                            Every method that changes state must call <Code>emit()</Code>.
                        </Term>{" "}
                        Change first, notify second: the listeners will immediately go and
                        read the value, so it has to be the new one by the time they run.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · change without notifying = stale UI"
                    >
                        <p>
                            If a method changes state but doesn&apos;t call{" "}
                            <Code>emit()</Code>, listeners never fire, React never
                            re-renders, and the UI silently goes stale. Changing the data
                            and emitting are always a pair.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="getSnapshot — reading">
                    <CodeBlock code={GET_SNAPSHOT} lang="ts" />
                    <p>
                        <Term>Subscribing says WHEN; this says WHAT.</Term>{" "}
                        <Code>emit()</Code> tells a listener that something moved,
                        and <Code>getSnapshot()</Code> is how it finds out the value now.
                        Two separate jobs, deliberately.
                    </p>
                    <p>
                        <Term>The full flow is those pieces in order.</Term> A method
                        changes <Code>state</Code> → <Code>emit()</Code> fires the
                        listeners → each one re-reads <Code>getSnapshot()</Code> → it gets
                        the new value.
                    </p>
                    <p>
                        <Term>The store is now complete.</Term> Data,{" "}
                        <Code>subscribe</Code>, <Code>emit</Code>,{" "}
                        <Code>getSnapshot</Code> and a change method — and not one line of
                        React so far. It would work identically in Vue, or in no framework
                        at all.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 3">Connecting to React</PartHeading>
            <div>
                <DocSection title="useSyncExternalStore bridge">
                    <CodeBlock code={BRIDGE} lang="tsx" />
                    <p>
                        <Term>One hook joins the two halves.</Term> Hand{" "}
                        <Code>useSyncExternalStore</Code> the store&apos;s{" "}
                        <Code>subscribe</Code> (how React listens) and{" "}
                        <Code>getSnapshot</Code> (how React reads). It returns the current
                        value and keeps it current.
                    </p>
                    <p>
                        <Term>React supplies the callback we designed for.</Term> It calls{" "}
                        <Code>subscribe</Code> with its own function, which lands in our{" "}
                        <Code>listeners</Code> Set, and re-reads{" "}
                        <Code>getSnapshot</Code> whenever that function is called.
                    </p>
                    <p>
                        <Term>Trace one click.</Term> <Code>increment()</Code> →{" "}
                        <Code>state + 1</Code> → <Code>emit()</Code> → React&apos;s
                        callback fires → React re-reads <Code>getSnapshot</Code> → the
                        value differs → <Code>Counter</Code> re-renders.
                    </p>
                    <p>
                        <Term>And because the store is shared, so is the re-render.</Term>{" "}
                        EVERY component subscribed to it re-reads on that same change — no
                        props, no context, no common parent.
                    </p>
                </DocSection>

                <DocSection title="stable snapshot" sectionSeverity="danger">
                    <CodeBlock code={STABLE_SNAPSHOT} lang="ts" />
                    <p>
                        <Term>
                            React calls <Code>getSnapshot</Code> on every render and
                            compares with <Code>Object.is</Code>.
                        </Term>{" "}
                        That comparison is how it decides whether anything actually moved.
                    </p>
                    <p>
                        <Term>A fresh object always fails that comparison.</Term>{" "}
                        <Code>{"{ count: state }"}</Code> is a new reference each call, so
                        it never equals the last one: re-render → <Code>getSnapshot</Code>{" "}
                        → new object → re-render, without end.
                    </p>
                    <p>
                        <Term>Return a primitive, or a STORED reference.</Term> Keep the
                        object in the module and return that same one; build a new
                        reference only inside the change methods, with a spread. Reads stay
                        stable, and only real changes produce a new identity.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · new object each read = infinite loop"
                    >
                        <p>
                            <Code>getSnapshot</Code> returning a fresh object every call
                            makes React re-render endlessly. Return a primitive or the
                            stored reference; create a new reference only when the data
                            actually changes.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="ssr snapshot" sectionSeverity="next">
                    <CodeBlock code={SSR_SNAPSHOT} lang="tsx" />
                    <p>
                        <Term>On the server there is no client store to read.</Term> Pass a
                        THIRD argument — the server snapshot — returning a safe default for
                        the SSR pass. Without it, the server render errors or the two
                        passes disagree on hydration.
                    </p>
                    <p>
                        <Term>In the App Router this is not optional.</Term> Components are
                        server-rendered by default, so a component reading a store must be{" "}
                        <Code>&quot;use client&quot;</Code> — and that still gets an SSR
                        pass, which the server snapshot is there to cover.
                    </p>

                    <Callout severity="next" label="react ⇄ next · getServerSnapshot">
                        <p>
                            In SSR (Next), pass a <Code>getServerSnapshot</Code> (3rd arg)
                            returning a safe default — the client store doesn&apos;t exist
                            on the server, and skipping it causes a hydration mismatch.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    The store itself is framework-agnostic plain JavaScript — a module, a{" "}
                    <Code>Set</Code>{" "}
                    and some functions, identical in any environment. Only
                    the BRIDGE is React&apos;s: <Code>useSyncExternalStore</Code> is
                    client-only and the component calling it needs{" "}
                    <Code>&quot;use client&quot;</Code>. In Next, always provide{" "}
                    <Code>getServerSnapshot</Code>.
                </p>
                <p>
                    This is also exactly how libraries like Zustand work internally. See
                    the <Code>useSyncExternalStore</Code>{" "}
                    page for the hook&apos;s full
                    mechanics, and the Redux page for the batteries-included alternative.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            why does a custom store need to &ldquo;notify&rdquo; React?
                        </>
                    }
                    a={
                        <>
                            &ldquo;The state lives <Term>outside React</Term>, so React
                            can&apos;t see it change. The store calls its listeners (
                            <Code>emit</Code>), and <Code>useSyncExternalStore</Code>{" "}
                            re-reads <Code>getSnapshot</Code> to re-render.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                why must <Code>getSnapshot</Code> return a stable value?
                            </>
                        }
                        a={
                            <>
                                &ldquo;React compares snapshots with{" "}
                                <Code>Object.is</Code>. A new object each read looks{" "}
                                <Term>perpetually changed</Term>, which causes an infinite
                                render loop.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
