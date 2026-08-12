import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// One danger (the inline-promise loop, the only way this API bites at runtime),
// one note (the conditional-call exception — a rule, not a hazard) and one
// react⇄next (the server-promise/client-use flow). The rest is mechanism.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Reading promises) ---
    // inline `danger · inline promise loops` callout
    "the-promise-must-be-stable": ["danger"],
    // --- part 2 (Context & the rules) ---
    // inline `note · the one conditional hook` callout
    "callable-conditionally": ["note"],
    // inline `react ⇄ next · server promise, client use` callout
    "next-js-flow": ["next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-custom-store, use-effect,
// use-id, use-layout-effect, use-memo, use-reducer and use-sync-external-store
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
// Part 1 — Reading promises. The value, then where the loading state
// went, then the one way to hold it wrong. Fragments are wrapped and
// comments hoisted above their line: the code frame scrolls past ~80
// columns, and a clipped comment is the part worth reading.
// ===================================================================

const WHAT_USE_DOES = `import { use } from "react";

function Profile({ userPromise }) {
  // unwraps the promise -> the value (suspends while pending)
  const user = use(userPromise);
  return <p>{user.name}</p>;
}`;

const SUSPENSE_ERRORS = `<Suspense fallback={<p>Loading…</p>}>
  <Profile userPromise={userPromise} />
</Suspense>`;

const STABLE_PROMISE = `// ❌ inline -> a NEW promise every render -> suspends forever
const user = use(fetchUser("42"));

// ✅ create once, pass it in
const [userPromise] = useState(() => fetchUser("42"));
const user = use(userPromise);`;

// ===================================================================
// Part 2 — Context & the rules. The other thing it reads, the rule it
// is exempt from, and the shape all of this exists for in Next.
// ===================================================================

const USE_FOR_CONTEXT = `const theme = useContext(ThemeContext); // classic
const theme = use(ThemeContext);        // use — no suspend`;

const CONDITIONAL = `// ❌ useContext / other hooks — breaks the rules of hooks
if (show) { const t = useContext(ThemeContext); }

// ✅ use — the ONE exception, allowed in if/loops
if (show) { const text = use(messagePromise); }`;

const NEXT_FLOW = `// Server Component — start the fetch, DON'T await, pass it down
async function Page() {
  const userPromise = fetchUser("42");
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Profile userPromise={userPromise} />
    </Suspense>
  );
}

// Client child reads it
"use client";
function Profile({ userPromise }) {
  const user = use(userPromise);
  return <p>{user.name}</p>;
}`;

export function UseDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Reading promises</PartHeading>
            <div>
                <DocSection title="what use does">
                    <CodeBlock code={WHAT_USE_DOES} lang="tsx" />
                    <p>
                        <Term>
                            A React 19 API that reads a resource DURING render.
                        </Term>{" "}
                        Two kinds: a Promise, or a Context. For a promise it unwraps the
                        resolved value and SUSPENDS the component while it is pending.
                    </p>
                    <p>
                        <Term>So an async value is just a value.</Term> No{" "}
                        <Code>useState</Code> to hold it, no <Code>useEffect</Code> to
                        fetch it, and no loading branch in this component — the code reads
                        top to bottom as if the data were already there.
                    </p>
                    <p>
                        <Term>It is not a hook, quite.</Term> It reads like one, but it
                        plays by different rules — which is the subject of Part 2, along
                        with reading a Context.
                    </p>
                </DocSection>

                <DocSection title="suspense & errors">
                    <CodeBlock code={SUSPENSE_ERRORS} lang="tsx" />
                    <p>
                        <Term>The nearest boundary owns the fallback.</Term> When{" "}
                        <Code>use</Code> meets a pending promise the component suspends and
                        React shows the closest{" "}
                        <Code>&lt;Suspense&gt;</Code> fallback; when it resolves React
                        retries the component and <Code>use</Code> returns the value.
                    </p>
                    <p>
                        <Term>The loading state moves OUT of the component.</Term> The
                        child reads the value and nothing else; the parent decides what
                        waiting looks like. One fallback can cover several suspending
                        children.
                    </p>
                    <p>
                        <Term>Rejections go to an error boundary.</Term> Not a{" "}
                        <Code>try</Code>/<Code>catch</Code> around the read — a rejected
                        promise throws during render, so the nearest error boundary catches
                        it, exactly as Suspense catches the pending case.
                    </p>
                    <p>
                        <Term>The whole trace:</Term>{" "}
                        <Code>
                            render → use(pending) → suspend → fallback → resolve → retry →
                            value
                        </Code>
                        .
                    </p>
                </DocSection>

                <DocSection
                    title="the promise must be stable"
                    sectionSeverity="danger"
                >
                    <CodeBlock code={STABLE_PROMISE} lang="tsx" />
                    <p>
                        <Term>The promise has to be created ONCE.</Term> It must survive
                        across renders — from a <Code>useState</Code> initializer, or
                        better in Next, created in a Server Component and passed down as a
                        prop.
                    </p>
                    <p>
                        <Term>Inline in render is a loop, not a fetch.</Term>{" "}
                        <Code>use(fetchUser(&quot;42&quot;))</Code> builds a new promise on
                        every pass: React suspends on it, retries the component, the retry
                        builds another promise, and nothing ever settles. A perpetual
                        suspend with a refetch behind it.
                    </p>
                    <p>
                        <Term>Identity is what React tracks.</Term> Not the URL, not the
                        arguments — the promise object itself. Same object across renders
                        means one pending read; a new object means a new read.
                    </p>

                    <Callout severity="danger" label="danger · inline promise loops">
                        <p>
                            <Code>use(fetchUser())</Code> inline creates a new promise every
                            render → perpetual suspend / refetch loop. Create the promise
                            once (a <Code>useState</Code> initializer or a Server Component)
                            and pass it in.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Context &amp; the rules</PartHeading>
            <div>
                <DocSection title="use for context">
                    <CodeBlock code={USE_FOR_CONTEXT} lang="tsx" />
                    <p>
                        <Term>
                            <Code>use(SomeContext)</Code> does what{" "}
                            <Code>useContext</Code> does.
                        </Term>{" "}
                        It reads the nearest provider&apos;s value. Same result, same
                        instant.
                    </p>
                    <p>
                        <Term>Reading a context does NOT suspend.</Term> Suspending is a
                        PROMISE behaviour, not a <Code>use</Code> behaviour — there is
                        nothing pending about a context value, so the two calls are equally
                        immediate.
                    </p>
                    <p>
                        <Term>The difference is the rules.</Term> <Code>use</Code> has
                        fewer of them, as the next section covers. For a plain top-level
                        read the two are interchangeable, and{" "}
                        <Code>useContext</Code> remains the common choice.
                    </p>
                </DocSection>

                <DocSection title="callable conditionally" sectionSeverity="note">
                    <CodeBlock code={CONDITIONAL} lang="tsx" />
                    <p>
                        <Term>Every other hook must be called unconditionally.</Term> No{" "}
                        <Code>if</Code>, no loops, no early return above it — React matches
                        a hook to its state by CALL ORDER, so the order has to be identical
                        on every render.
                    </p>
                    <p>
                        <Term>
                            <Code>use</Code> is the single exception.
                        </Term>{" "}
                        You may call it inside an <Code>if</Code> or a loop, for promises
                        and for contexts alike. It is not tracked by call order, so a
                        skipped call costs nothing.
                    </p>
                    <p>
                        <Term>Which means you read only what you need.</Term> No calling at
                        the top and working around it — ask for the value at the point the
                        component actually wants it.
                    </p>

                    <Callout severity="note" label="note · the one conditional hook">
                        <p>
                            <Code>use</Code> is the only hook-like API you may call
                            conditionally (in <Code>if</Code>/loops).{" "}
                            <Code>useContext</Code> and the others cannot — call those
                            unconditionally at the top.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="next.js flow" sectionSeverity="next">
                    <CodeBlock code={NEXT_FLOW} lang="tsx" />
                    <p>
                        <Term>Start the fetch on the server; unwrap it on the client.</Term>{" "}
                        Create the promise in a Server Component and deliberately do NOT{" "}
                        <Code>await</Code> it, then hand it to a client child that calls{" "}
                        <Code>use</Code>.
                    </p>
                    <p>
                        <Term>That removes the client waterfall.</Term> The request begins
                        while the server is still rendering, rather than after the bundle
                        has downloaded and mounted, and the result streams in through the
                        Suspense boundary.
                    </p>
                    <p>
                        <Term>And the promise is stable by construction.</Term> It was
                        created once, on the server, and arrives as a prop — so the
                        inline-promise loop from Part 1 cannot happen here.
                    </p>

                    <Callout
                        severity="next"
                        label="react ⇄ next · server promise, client use"
                    >
                        <p>
                            Create the promise in a Server Component and pass it to a client
                            child that calls <Code>use()</Code>. The fetch starts on the
                            server and streams in — no client-side loading waterfall, and
                            the promise is stable.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>use</Code> is React 19, not a Next API — but its headline Next
                    pattern is the flow above: start fetching on the server, unwrap on the
                    client, stream through <Code>&lt;Suspense&gt;</Code>.
                </p>
                <p>
                    For data a component fully owns on the server, prefer{" "}
                    <Code>await</Code>-ing it directly in that Server Component — simpler,
                    and no promise crosses the boundary. Reach for{" "}
                    <Code>use</Code> when a CLIENT component needs to unwrap a promise
                    created upstream.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            does <Code>use</Code> always pause rendering?
                        </>
                    }
                    a={
                        <>
                            &ldquo;Only when it reads a{" "}
                            <Term>pending promise</Term> — then it suspends and the nearest{" "}
                            <Code>&lt;Suspense&gt;</Code> fallback shows. Reading a context
                            is instant, like <Code>useContext</Code>.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                why can <Code>use</Code> be called conditionally?
                            </>
                        }
                        a={
                            <>
                                &ldquo;It is the one hook-like API{" "}
                                <Term>not tracked by call order</Term>, so it is allowed
                                inside <Code>if</Code>/loops — unlike{" "}
                                <Code>useContext</Code>{" "}
                                and the other hooks.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
