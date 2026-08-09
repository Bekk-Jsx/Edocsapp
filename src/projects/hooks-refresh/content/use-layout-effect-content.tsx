import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// "cost-ssr" carries TWO callouts, so its card shows two icons while the section
// itself is flagged with the higher of them (trap) — the map and
// `sectionSeverity` are kept in sync by intent, not by derivation.
// Part 1 is unflagged: timing is the mechanism, not a hazard.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (Limits) ---
    // inline `trap · async doesn't block paint` callout
    "sync-only": ["trap"],
    // inline `trap · blocks paint` + `react ⇄ next · no SSR` callouts
    "cost-ssr": ["trap", "next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-effect, use-memo and
// use-reducer define for their own part dividers.
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
// Part 1 — Timing. Same API as useEffect, one difference: it runs
// before the browser paints. Fragment 1 is the order of operations,
// fragment 2 is the one problem that order actually solves.
// ===================================================================

const TIMING_ORDER = `import { useLayoutEffect } from "react";

useLayoutEffect(() => { /* runs BEFORE paint, synchronously */ }, [deps]);

// order: render -> commit (DOM updated) -> useLayoutEffect -> paint -> useEffect`;

const FLICKER_FIX = `const [theme, setTheme] = useState("light");

// ❌ useEffect: paint(light) -> effect -> re-render -> paint(dark) = FLASH
useEffect(() => { setTheme(readConfig().theme); }, []);

// ✅ useLayoutEffect: measure/set BEFORE paint -> paint(dark only) = no flash
useLayoutEffect(() => { setTheme(readConfig().theme); }, []);`;

// ===================================================================
// Part 2 — Limits. Both are the same misreading of "blocks paint":
// it holds the frame for SYNCHRONOUS work only (so async gains
// nothing), and holding the frame is a cost (so heavy work, and the
// server, are out).
// ===================================================================

const SYNC_ONLY = `useLayoutEffect(() => {
  fetchAuth().then(setUser); // async — returns immediately, does NOT hold paint
}, []);

return user ? <ProfileDropdown /> : <LoginButton />;`;

const COST_SSR = `useLayoutEffect(() => { heavyLoop(); }, []); // ❌ blocks paint -> janky first frame`;

export function UseLayoutEffectDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Timing</PartHeading>
            <div>
                <DocSection title="useeffect vs uselayouteffect">
                    <CodeBlock code={TIMING_ORDER} lang="tsx" />
                    <p>
                        <Term>
                            Same API as <Code>useEffect</Code>, different TIMING.
                        </Term>{" "}
                        Same signature, same dependency array, same cleanup function.
                        The only thing that changes is when React runs the body.
                    </p>
                    <p>
                        <Term>
                            <Code>useEffect</Code> runs AFTER paint.
                        </Term>{" "}
                        React commits the DOM, the browser paints that frame, and the
                        effect runs afterwards. If the effect then changes something
                        visual, the user has already seen the frame before the change.
                    </p>
                    <p>
                        <Term>
                            <Code>useLayoutEffect</Code> runs after the DOM update but
                            BEFORE paint, synchronously.
                        </Term>{" "}
                        The DOM is live and measurable, and the browser has not drawn it
                        yet — so the effect can read it, change it, and the user never
                        sees the intermediate state.
                    </p>
                    <p>
                        <Term>The order is the whole hook:</Term>{" "}
                        <Code>
                            render → commit (DOM updated) → useLayoutEffect → paint →
                            useEffect
                        </Code>
                        . Everything else about the two hooks is identical; pick the one
                        whose slot in that line you need.
                    </p>
                </DocSection>

                <DocSection title="the flicker fix">
                    <CodeBlock code={FLICKER_FIX} lang="tsx" />
                    <p>
                        <Term>
                            Reach for it when you must MEASURE or CHANGE the DOM before
                            the user sees it.
                        </Term>{" "}
                        Positioning a tooltip or dropdown against its trigger, applying a
                        theme class, syncing a scroll position — anything where the first
                        painted frame would otherwise be wrong.
                    </p>
                    <p>
                        <Term>
                            With <Code>useEffect</Code> the user sees the wrong frame,
                            then it corrects.
                        </Term>{" "}
                        Above, the light theme paints, the effect runs, React re-renders
                        and paints dark. Two frames, and the first one is a flash of the
                        thing you did not want to show.
                    </p>
                    <p>
                        <Term>
                            With <Code>useLayoutEffect</Code> the correction happens
                            before paint.
                        </Term>{" "}
                        React runs the effect, processes the resulting state update, and
                        paints once — so only the final frame ever reaches the screen.
                    </p>
                    <p>
                        <Term>Everything non-visual stays on useEffect.</Term>{" "}
                        Subscriptions, logging, fetching, timers: none of them affect the
                        frame being painted, so holding the paint for them buys nothing
                        and costs latency. <Code>useEffect</Code> is the default;{" "}
                        <Code>useLayoutEffect</Code> is the exception you justify.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Limits</PartHeading>
            <div>
                <DocSection title="sync only" sectionSeverity="trap">
                    <CodeBlock code={SYNC_ONLY} lang="tsx" />
                    <p>
                        <Term>
                            It blocks paint ONLY for SYNCHRONOUS work.
                        </Term>{" "}
                        React waits for the effect body to RETURN, not for anything that
                        body started. That distinction is the whole trap.
                    </p>
                    <p>
                        <Term>
                            An <Code>await</Code> or <Code>.then()</Code> returns
                            immediately.
                        </Term>{" "}
                        <Code>fetchAuth()</Code> fires the request and hands back a
                        promise; the body finishes on that line and React paints right
                        away with the old state. The result arrives a second later as a
                        separate re-render.
                    </p>
                    <p>
                        <Term>So the flicker still happens.</Term> The Login button
                        paints, sits there for the length of the request, then flips to
                        the profile dropdown — exactly the flash{" "}
                        <Code>useLayoutEffect</Code> was reached for. Moving the call from{" "}
                        <Code>useEffect</Code> changed nothing.
                    </p>
                    <p>
                        <Term>
                            It cannot be async and cannot freeze the page for a promise.
                        </Term>{" "}
                        The effect callback may not be an <Code>async</Code> function
                        (React needs the return value for the cleanup), and there is no
                        mechanism to hold a frame open across a network round trip. For
                        async work it offers NO advantage over <Code>useEffect</Code>.
                    </p>

                    <Callout severity="trap" label="trap · async doesn't block paint">
                        <p>
                            <Code>useLayoutEffect</Code> only prevents flicker for
                            SYNCHRONOUS DOM work. Async work (API calls) resolves after
                            paint regardless — you&apos;ll flash either way. Fix async
                            cases with server-side data or a neutral loading state, not{" "}
                            <Code>useLayoutEffect</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="cost + ssr" sectionSeverity="trap">
                    <CodeBlock code={COST_SSR} lang="tsx" />
                    <p>
                        <Term>Blocking paint is the cost, not just the feature.</Term>{" "}
                        Because the body runs synchronously before paint, the browser
                        WAITS for it. Heavy work there delays the frame, and the user
                        stares at nothing until it finishes.
                    </p>
                    <p>
                        <Term>Keep it to a quick DOM measure and adjust.</Term> Read a
                        rect, set a class or a style, return. Anything non-visual or
                        expensive belongs in <Code>useEffect</Code>, where the frame is
                        already on screen while it runs.
                    </p>
                    <p>
                        <Term>It does NOT run on the server.</Term> There is no layout,
                        no paint and no DOM during SSR, so there is nothing for it to do —
                        React prints a development warning when a server-rendered
                        component calls it.
                    </p>
                    <p>
                        <Term>
                            So whatever it sets is absent from the server HTML.
                        </Term>{" "}
                        A theme class or an auth-dependent layout applied here is missing
                        from the first response, which means the flash you were fixing can
                        still occur on first load. In the App Router the component must be{" "}
                        <Code>&quot;use client&quot;</Code>, and the effect only runs
                        after hydration.
                    </p>

                    <Callout severity="trap" label="trap · blocks paint">
                        <p>
                            <Code>useLayoutEffect</Code> runs synchronously before paint —
                            heavy work inside delays the first frame. Keep it to quick
                            measure/adjust; move anything heavy or non-visual to{" "}
                            <Code>useEffect</Code>.
                        </p>
                    </Callout>

                    <Callout severity="next" label="react ⇄ next · no SSR">
                        <p>
                            <Code>useLayoutEffect</Code> doesn&apos;t run on the server
                            (dev warning if it does). It&apos;s client-only and runs only
                            after hydration, so it can&apos;t prevent a server-render
                            flash. For SSR theme/auth, use server-readable data (cookie) or
                            a pre-hydration script instead.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useLayoutEffect</Code> is identical to React — same signature,
                    same before-paint slot — but client-only in practice. It needs{" "}
                    <Code>&quot;use client&quot;</Code>, it does not run during SSR (React
                    warns if a server-rendered component calls it), and it runs only after
                    hydration.
                </p>
                <p>
                    That bounds what it can fix: synchronous client-side flicker, once the
                    page is interactive. It cannot prevent an SSR flash, because the server
                    HTML was produced before it ever ran. For theme or auth on first load,
                    read the value on the server (a cookie) or run a small pre-hydration
                    script in the document.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            when do you use <Code>useLayoutEffect</Code> over{" "}
                            <Code>useEffect</Code>?
                        </>
                    }
                    a={
                        <>
                            &ldquo;Only for{" "}
                            <Term>synchronous DOM measure-then-adjust</Term> that would
                            otherwise flicker — positioning, applying a class. Everything
                            else stays <Code>useEffect</Code>.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                why didn&apos;t <Code>useLayoutEffect</Code> stop my flash
                                on an API call?
                            </>
                        }
                        a={
                            <>
                                &ldquo;It only blocks paint for{" "}
                                <Term>synchronous work</Term>; an async result arrives
                                after paint, so it flashes either way. Fix it with server
                                data or a loading state.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
