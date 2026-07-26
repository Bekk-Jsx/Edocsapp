import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > tip > next). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop below, which marks a section whose ENTIRE
// topic is one severity. The two are kept in sync by intent: a section can list
// several severities here without its whole topic being any one of them.
// `putting-it-together-…` is the wrapper <section> around the live demo in
// page.tsx. See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // inline `trap · initial mismatch` callout — no header treatment, article only
    "reading-the-code": ["trap"],
    "the-dependency-array": ["danger"],
    "rules-of-hooks": ["danger"],
    "cleanup-the-core-idea": ["tip"],
    "two-ways-to-leak-listeners": ["danger", "trap"],
    "effects-data-fetching": ["danger", "next"],
    "ssr-strict-mode": ["trap"],
    "putting-it-together-dependency-driven-re-sync": ["danger"],
    "reading-the-re-sync": ["danger"],
};

// Shared block style for the small text diagrams (same as the useState page).
const DIAGRAM =
    "overflow-x-auto rounded bg-[var(--surface-2)] px-3 py-2 font-mono text-[0.8em] leading-[1.7] text-[var(--text)]";

// Eyebrow for a code-led part — same marker + mono treatment as a DocSection
// title, so the parts read as one family with the sections beneath them.
// Headings carry no severity styling — severity describes content, not titles.
export function ExampleLabel({
    children,
    tone = "muted",
}: {
    children: string;
    tone?: "muted" | "accent";
}) {
    const color = tone === "accent" ? "var(--accent)" : "var(--muted)";
    return (
        <div className="mb-3 flex items-center gap-2">
            <span
                aria-hidden="true"
                className="inline-block h-[14px] w-[2px] shrink-0 rounded-full"
                style={{ backgroundColor: color }}
            />
            <p
                className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest"
                style={{ color }}
            >
                {children}
            </p>
        </div>
    );
}

// Top-level divider between the two halves of the page — mirrors the
// Basics/Advanced groups in the summary rail. Deliberately louder than a
// DocSection eyebrow (bold, larger, full-width rule) so the split is obvious
// while scrolling: this is a grouping, not a section.
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

const RUN_ONCE = `"use client";
import { useEffect, useState } from "react";

export default function Width() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(window.innerWidth);   // read the browser after mount
  }, []);                          // [] -> run exactly once

  return <p>Width: {width}px</p>;
}`;

const CLEANUP = `"use client";
import { useEffect, useState } from "react";

export default function TrackWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);          // start
    return () => window.removeEventListener("resize", handleResize); // stop
  }, []);

  return <p>Width: {width}px</p>;
}`;

// ===================================================================
// Parts 1 and 2. Each opens with its example, explains that example
// line by line, then widens into the concepts it demonstrates.
// Part 3 (the live chat-room demo) sits at the bottom of page.tsx and
// is documented by UseEffectResyncDocs below.
// ===================================================================
export function UseEffectDocs() {
    return (
        <>
            {/* ---------- part 1 — run once on mount ---------- */}
            {/* No eyebrow label: the section title is the heading, and the code
                sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Basics</PartHeading>
            <div>
                <DocSection title="reading the code">
                    <CodeBlock code={RUN_ONCE} lang="tsx" />
                    <p>
                        <Term>Render first, effect last.</Term> The component renders with{" "}
                        <Code>width = 0</Code>, React commits that to the DOM, and the
                        browser paints it. Only <em>after</em> the paint does the effect
                        run, read <Code>window.innerWidth</Code>, and call{" "}
                        <Code>setWidth</Code> — which schedules a second pass that ends up
                        painting the real number.
                    </p>
                    <pre className={DIAGRAM}>
                        {`render 1  ->  commit  ->  paint (0px)  ->  effect runs  ->  setWidth
render 2  ->  commit  ->  paint (1440px)`}
                    </pre>
                    <p>
                        <Term>
                            Why <Code>window</Code> is read in the effect, not in the body.
                        </Term>{" "}
                        The component body also runs on the server, where{" "}
                        <Code>window</Code> doesn&apos;t exist — reading it there crashes
                        the render. Effects never run on the server, so the effect is the
                        safe place: it only runs on the client, after hydration.
                    </p>
                    <p>
                        <Term>
                            <Code>[]</Code> means &quot;no dependencies&quot;.
                        </Term>{" "}
                        There is nothing that could change, so React has no reason to
                        re-sync: the setup runs once on mount and never again.
                    </p>

                    <Callout severity="trap" label="trap · initial mismatch">
                        <p>
                            <Code>width</Code> is <Code>0</Code> in the server-rendered
                            HTML <em>and</em> in the first client render — it only becomes
                            real once the effect has run. That&apos;s a brief flash of the
                            initial value. Never rely on an effect-set value for the first
                            paint; if the content matters immediately, it belongs in render
                            or on the server.
                        </p>
                        <pre className={`${DIAGRAM} mt-2`}>
                            {`// ❌ DON'T: decide what to render based on an effect-set value
function Nav() {
  const [width, setWidth] = useState(0); // 0 on the server AND first client render

  useEffect(() => {
    setWidth(window.innerWidth); // runs only after paint
  }, []);

  return width > 768 ? <DesktopMenu /> : <MobileMenu />;
}`}
                        </pre>
                    </Callout>
                </DocSection>

                <DocSection title="what an effect is">
                    <p>
                        <Term>An effect synchronizes, it doesn&apos;t compute.</Term> It
                        connects your component to an <em>external system</em> — the DOM,
                        subscriptions, timers, the network. If you&apos;re only deriving a
                        value from props or state, you don&apos;t need an effect at all:
                        compute it during render.
                    </p>
                    <p>
                        <Term>Four phases, and the effect is last.</Term>
                    </p>
                    <pre className={DIAGRAM}>
                        {`render -> commit -> paint -> effect`}
                    </pre>
                    <p>
                        <Term>render.</Term> React calls your component function and
                        computes the JSX — what <em>should</em> be shown. Nothing is on
                        screen yet.
                        <br />
                        <Term>commit.</Term> React writes that result to the actual DOM,
                        creating and updating the nodes.
                        <br />
                        <Term>paint.</Term> The browser draws the pixels — now the user
                        sees it.
                        <br />
                        <Term>effect.</Term> React runs <Code>useEffect</Code>{" "}
                        <em>after</em> paint.
                    </p>
                    <p>
                        <Term>The render schedules the effect</Term> — the effect does not
                        cause the render. A state change restarts the loop from the top:
                    </p>
                    <pre className={DIAGRAM}>
                        {`render -> commit -> paint -> effect -> setState -> re-render -> ...`}
                    </pre>
                </DocSection>

                <DocSection title="the dependency array" sectionSeverity="danger">
                    <p>
                        <Term>The array answers one question: when do we re-sync?</Term>
                    </p>
                    <pre className={DIAGRAM}>
                        {`useEffect(fn, [])      -> setup runs ONCE, on mount
useEffect(fn, [a, b])  -> mount + whenever a or b change
useEffect(fn)          -> after EVERY render        (danger)`}
                    </pre>
                    <p>
                        <Term>Flip the common mistake:</Term> <Code>[]</Code> is the{" "}
                        <em>once</em> case — the restrictive one. <em>No</em> array is the
                        permissive one, and it is the dangerous one.
                    </p>

                    <Callout severity="danger" label="danger · no array = infinite loop">
                        <p>
                            <Code>useEffect(fn)</Code> with{" "}
                            <strong className="text-[var(--text)]">
                                no dependency array at all
                            </strong>{" "}
                            runs after <em>every</em> render. If that effect calls{" "}
                            <Code>setState</Code>, the state change triggers a render, the
                            render triggers the effect, the effect sets state again — an{" "}
                            <strong className="text-[var(--text)]">
                                infinite render loop
                            </strong>{" "}
                            that freezes the tab. Omitting the array is almost never what
                            you meant; <Code>[]</Code> is.
                        </p>
                        <pre className={`${DIAGRAM} mt-2`}>
                            {`render -> effect -> setState -> render -> effect -> ...`}
                        </pre>
                    </Callout>

                    <p>
                        Every reactive value the effect reads belongs in the array.
                        Omitting deps to &quot;run less&quot; is the usual source of stale
                        closures — fix the cause, don&apos;t suppress the lint.
                    </p>
                </DocSection>

                <DocSection title="rules of hooks" sectionSeverity="danger">
                    <p>
                        <Term>
                            Hooks must be called unconditionally, in the same order on
                            every render.
                        </Term>{" "}
                        No <Code>if</Code>, no loop, no early <Code>return</Code> above
                        them.
                    </p>
                    <p>
                        <Term>Breaking that corrupts state.</Term> React has no names to
                        match hooks by — it identifies each one purely by its call{" "}
                        <em>order</em>. Skip one and every hook after it shifts onto the
                        wrong slot: a <Code>useState</Code> starts reading another
                        hook&apos;s value, an effect re-runs against the wrong deps, and
                        React throws{" "}
                        <Code>Rendered fewer hooks than expected</Code>.
                    </p>
                    <p>
                        <Term>The condition goes inside the effect, never around it.</Term>{" "}
                        Call the hook every time and guard the work.
                    </p>
                    <pre className={DIAGRAM}>
                        {`// wrong — the hook itself is conditional
if (user) { useEffect(() => {...}, []) }

// right — the hook always runs, the work is guarded
useEffect(() => {
  if (user) {...}
}, [user])`}
                    </pre>
                </DocSection>
            </div>

            {/* ---------- part 2 — cleanup ---------- */}
            {/* No eyebrow label here: the section title is the heading, and the
                code sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 2">Advanced</PartHeading>
            <div>
                <DocSection title="reading the cleanup">
                    <CodeBlock code={CLEANUP} lang="tsx" />
                    <p>
                        <Term>The effect registers, the browser calls.</Term>{" "}
                        <Code>addEventListener</Code> runs <em>once</em> and all it does is
                        hand <Code>handleResize</Code> to the browser. Every resize after
                        that is the <strong className="text-[var(--text)]">browser</strong>{" "}
                        invoking your callback — <Code>useEffect</Code> itself does not
                        re-run per resize.
                    </p>
                    <p>
                        <Term>The returned function is the cleanup.</Term> Returning it is
                        the entire mechanism — there is no separate API. React holds onto
                        that function and calls it on unmount, and before a re-sync when a
                        dependency changes.
                    </p>
                    <p>
                        <Term>Same reference in, same reference out.</Term>{" "}
                        <Code>removeEventListener</Code> matches listeners by identity, so
                        it must receive the <em>exact</em> function object that was added.
                        Defining <Code>handleResize</Code> inside the effect and closing
                        over it in the cleanup is what guarantees both calls see one
                        reference.
                    </p>
                    <pre className={DIAGRAM}>
                        {`mount    -> addEventListener(fn)    // registered once
resize   -> browser calls fn        // many times, no re-run
unmount  -> removeEventListener(fn) // same fn, so it matches`}
                    </pre>

                    <Callout severity="trap" label="trap · mismatched reference">
                        <p>
                            Passing an inline arrow to both calls creates two{" "}
                            <em>different</em> function objects, so the remove silently
                            matches nothing — no error, and the listener leaks. Name the
                            handler once and pass that name to both.
                        </p>
                        <pre className={`${DIAGRAM} mt-2`}>
                            {`// wrong — two distinct arrows, remove matches nothing
window.addEventListener("resize", () => setWidth(...));
window.removeEventListener("resize", () => setWidth(...));`}
                        </pre>
                    </Callout>
                </DocSection>

                <DocSection title="cleanup — the core idea" sectionSeverity="tip">
                    <p>
                        <Term>If an effect starts something, cleanup stops it.</Term> That
                        is the whole rule: <em>start something → stop it</em>. The
                        mechanism is just a return value — the effect{" "}
                        <em>returns a function</em>, and that returned function is the
                        cleanup.
                    </p>
                    <pre className={DIAGRAM}>
                        {`useEffect(() => {
  window.addEventListener("resize", handleResize);      // start
  return () =>
    window.removeEventListener("resize", handleResize); // stop
}, []);`}
                    </pre>
                    <p>
                        <Term>Rule of thumb.</Term> Write a setup, then immediately ask{" "}
                        <em>&quot;what undoes this?&quot;</em> Subscribed → unsubscribe.
                        Opened → close. Started an interval → clear it. If nothing undoes
                        it, you probably didn&apos;t need an effect.
                    </p>
                </DocSection>

                <DocSection title="setup runs once, the callback runs many">
                    <p>
                        <Term>Two different runners.</Term> With <Code>[]</Code>, the setup
                        runs <em>once</em> and all it does is <em>register</em>{" "}
                        <Code>handleResize</Code>. That callback then fires many times
                        because the{" "}
                        <strong className="text-[var(--text)]">browser</strong> calls it on
                        each resize — not because <Code>useEffect</Code> re-runs.
                    </p>
                    <p>
                        <Term>The phone-number analogy.</Term>{" "}
                        <Code>addEventListener</Code> is giving the browser your phone
                        number once: <em>&quot;call me when it rains.&quot;</em> The
                        browser then calls every time it rains. You don&apos;t re-give your
                        number on each rainfall — and cleanup is{" "}
                        <em>&quot;stop calling me&quot;</em> when you leave.
                    </p>
                    <pre className={DIAGRAM}>
                        {`useEffect  ->  runs once   ->  registers the callback
browser    ->  runs many   ->  calls handleResize`}
                    </pre>
                </DocSection>

                <DocSection title="when cleanup runs">
                    <p>
                        <Term>Two moments, not one.</Term> Cleanup runs on{" "}
                        <strong className="text-[var(--text)]">unmount</strong>, and{" "}
                        <strong className="text-[var(--text)]">
                            before every re-sync
                        </strong>{" "}
                        when a dependency changes. React tears down the old before setting
                        up the new, so each setup stays paired with its own teardown.
                    </p>
                    <pre className={DIAGRAM}>
                        {`mount:       setup
dep change:  cleanup(old) -> setup(new)
unmount:     cleanup`}
                    </pre>
                    <p>
                        With <Code>[]</Code> specifically there are no dep changes, so it
                        collapses to two events for the whole lifetime: setup once on
                        mount, cleanup once on unmount — <em>not</em> per render.
                    </p>
                </DocSection>

                <DocSection title="two ways to leak listeners" sectionSeverity="danger">
                    <p>
                        <Term>Case 1 — registered in the component body.</Term> The body
                        re-runs on <em>every</em> render, so every render adds another
                        listener. <Code>useEffect(fn, [])</Code> fixes this: setup runs
                        once, not per render.
                    </p>
                    <p>
                        <Term>Case 2 — inside the effect, but no cleanup.</Term> Now
                        it&apos;s not per render — but the listener survives unmount, so
                        every leave-and-return stacks another one. Cleanup fixes this:
                        remove on leave, so you don&apos;t stack on return.
                    </p>
                    <div className="grid grid-cols-[max-content_1fr] overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[0.75rem]">
                        <div className="border-b border-[var(--border)] px-3 py-2 text-[var(--amber)]">
                            in body
                        </div>
                        <div className="border-b border-[var(--border)] px-3 py-2 text-[var(--muted)]">
                            stacks per render — render1 → #1, render2 → #2 …
                        </div>
                        <div className="px-3 py-2 text-[var(--amber)]">no cleanup</div>
                        <div className="px-3 py-2 text-[var(--muted)]">
                            stacks per revisit — visit → #1, return → #2 …
                        </div>
                    </div>
                    <p>
                        They&apos;re independent leaks, which is why you need{" "}
                        <strong className="text-[var(--text)]">both</strong> the effect{" "}
                        <em>and</em> its cleanup to keep exactly one listener alive.
                    </p>

                    <Callout severity="trap" label="trap · SPA navigation">
                        <p>
                            In a React/Next SPA, navigating between pages does <em>not</em>{" "}
                            reload the browser — <Code>window</Code> persists across the
                            whole session, so listeners are never wiped for you. If you
                            don&apos;t remove what you added, old listeners keep firing for
                            a component that&apos;s already gone, and they stack up again on
                            every revisit.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="effects & data fetching" sectionSeverity="danger">
                    <p>
                        <Term>Continuous vs one-shot.</Term> A timer is continuous, so its
                        cleanup <em>stops</em> it (<Code>clearInterval</Code>). An API call
                        is one-shot — you can&apos;t un-send it, so its cleanup{" "}
                        <em>ignores or cancels</em> a stale response instead.
                    </p>
                    {/* The race condition is the section-level danger — the header
                        already carries the icon + badge, so it reads as plain prose
                        here rather than a second red box. */}
                    <p>
                        <Term>The race.</Term> Fetch user <Code>1</Code> (slow), then user{" "}
                        <Code>2</Code> (fast). Without cleanup, user 1&apos;s response
                        lands <em>last</em> and overwrites the screen with the wrong data —
                        the UI now shows one user&apos;s details under another&apos;s name,
                        with nothing to signal the mismatch. Guard it with an{" "}
                        <Code>active</Code> flag or an <Code>AbortController</Code>:
                    </p>
                    <pre className={DIAGRAM}>
                        {`useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal })
    .then(...)
    .catch(ignoreAbort);
  return () => controller.abort();   // stale response discarded
}, [id]);`}
                    </pre>

                    <Callout severity="next" label="react ⇄ next · server components">
                        <p>
                            In the App Router, prefer fetching in a Server Component — an{" "}
                            <Code>async</Code> function that awaits directly. No effect, no
                            race, no loading flash. Reach for <Code>useEffect</Code> +{" "}
                            <Code>fetch</Code> only for genuinely client-driven data.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="ssr & strict mode">
                    <p>
                        <Term>Effects never run on the server.</Term> They fire only after
                        hydration on the client, so anything an effect sets up — reading{" "}
                        <Code>window</Code>, measuring the DOM — is simply absent from the
                        first server-rendered HTML. Don&apos;t rely on it for the initial
                        paint.
                    </p>
                    <p>
                        <Term>Strict Mode double-invokes setup + cleanup</Term> in
                        development only. It&apos;s a test: your cleanup must fully reverse
                        your setup, so running the pair twice is harmless. If a double
                        mount breaks something, the cleanup is incomplete.
                    </p>

                    <Callout severity="trap" label="trap · setState in effect body">
                        <p>
                            Calling <Code>setState</Code> <em>synchronously</em> in an
                            effect body triggers cascading renders and warns in dev. It
                            signals the effect is <em>computing</em> state rather than
                            syncing it. Derive the value during render instead — or, for a
                            genuine external sink, defer the write off the synchronous path
                            with <Code>queueMicrotask</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}

// ===================================================================
// Part 3 — passed to the bottom DemoFrame as its `docs`, so it renders
// directly beneath the chat-room source: live demo -> code -> this.
// ===================================================================
export function UseEffectResyncDocs() {
    return (
        <>
            <DocSection title="reading the re-sync" sectionSeverity="danger">
                <p>
                    <Term>
                        <Code>[room]</Code> makes the effect re-syncable.
                    </Term>{" "}
                    Where <Code>[]</Code> pinned the setup to mount, listing{" "}
                    <Code>room</Code> tells React that this effect depends on that value —
                    so re-run it whenever the value changes.
                </p>
                <p>
                    <Term>Old teardown before new setup.</Term> On a change React runs the{" "}
                    <em>previous</em> cleanup first — <Code>conn.disconnect()</Code> for
                    the old room — and only then the new setup,{" "}
                    <Code>createConnection(room)</Code> for the new one. That ordering is
                    the guarantee: you are never connected to two rooms at once.
                </p>
                <pre className={DIAGRAM}>
                    {`room A -> B -> C

setup(A)
cleanup(A) -> setup(B)
cleanup(B) -> setup(C)
cleanup(C)                  // on unmount`}
                </pre>
                <p>
                    <Term>Watch it in the demo above.</Term> Switching rooms logs{" "}
                    <Code>disconnect(old)</Code> immediately followed by{" "}
                    <Code>connect(new)</Code> — never two connects in a row. On the first
                    mount in development you&apos;ll also see{" "}
                    <Code>connect → disconnect → connect</Code>: that&apos;s Strict Mode
                    double-invoking the pair to prove the cleanup is symmetric.
                </p>

                <Callout severity="danger" label="danger · missing dep">
                    <p>
                        Leave <Code>room</Code> out of the array and the effect keeps
                        talking to the room it captured on mount — a{" "}
                        <strong className="text-[var(--text)]">stale closure</strong>. The
                        UI says you&apos;re in room B while the connection is still room A,
                        and no cleanup ever fires to correct it. Every reactive value the
                        effect reads belongs in the deps.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same hook, and it needs <Code>&quot;use client&quot;</Code>. The Next
                    weight is the SSR angle: in the App Router most components are Server
                    Components, where effects don&apos;t exist at all. An effect that reads{" "}
                    <Code>window</Code> or <Code>localStorage</Code> forces the component
                    to be a client component and runs only after hydration — often a sign
                    the work belongs on the server instead.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>does the effect run on every resize?</>}
                    a={
                        <>
                            &ldquo;No — the setup runs <Term>once</Term> and just{" "}
                            <Term>registers</Term> the callback. The <Term>browser</Term>{" "}
                            fires <Code>handleResize</Code> on each resize. Different
                            runners.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>why does a missing cleanup cause duplicate listeners?</>}
                        a={
                            <>
                                &ldquo;The listener <Term>survives unmount</Term>, so each
                                remount adds another — they <Term>stack up</Term> and all
                                fire. Cleanup removes the old one first.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                what&apos;s the difference between the effect body and its
                                cleanup?
                            </>
                        }
                        a={
                            <>
                                &ldquo;The body <Term>sets up</Term> the sync; the returned
                                cleanup <Term>tears it down</Term>. React runs cleanup
                                before re-syncing and on unmount, so setup and teardown stay
                                paired.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
