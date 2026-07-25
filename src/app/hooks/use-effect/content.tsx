import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseEffectDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Effects synchronize, they don&apos;t compute.</Term> An effect
                    connects React to an external system — DOM, subscriptions, network,
                    timers. If you&apos;re only deriving a value from props/state, you
                    don&apos;t need an effect; compute it during render.
                </p>
                <p>
                    <Term>Cleanup runs before every re-sync, not just unmount.</Term>{" "}
                    Before React re-runs the effect (deps changed) it runs the previous
                    cleanup first. So the lifecycle is setup → cleanup → setup →
                    cleanup, keeping each run paired with its own teardown.
                </p>
                <p>
                    <Term>Dependency array = when to re-sync.</Term> Every reactive value
                    the effect reads (props, state, functions from render) belongs in it.
                    Omitting deps to &quot;run less&quot; is the usual source of stale
                    closures — fix the cause (move the value, memoize, or use a functional
                    update), don&apos;t suppress the lint.
                </p>
                <p>
                    <Term>Empty array runs once</Term> on mount (twice in dev Strict
                    Mode). No array runs after <em>every</em> render — almost always a
                    mistake.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · setState in effect body">
                <p>
                    Calling <Code>setState</Code> <em>synchronously</em> inside an effect
                    body triggers cascading renders and now warns in dev. It signals the
                    effect is computing state rather than syncing. Either derive the value
                    in render instead, or — when the write truly targets an external sink
                    (like the activity log in this demo) — defer it off the synchronous
                    path with <Code>queueMicrotask</Code>.
                </p>
            </Callout>

            <DocSection title="ssr & strict mode" tone="accent">
                <p>
                    <Term>Effects never run on the server.</Term> During SSR/RSC the effect
                    is skipped entirely — it fires only after hydration on the client. So
                    anything an effect sets up (measuring the DOM, reading{" "}
                    <Code>window</Code>) is absent on the first server-rendered HTML.
                    Don&apos;t rely on an effect to produce content the initial paint
                    needs.
                </p>
                <p>
                    <Term>Strict Mode double-invokes</Term> setup + cleanup in dev only.
                    The test it enforces: your cleanup must fully undo your setup, so
                    running the pair twice is harmless. If double-mount breaks something,
                    the effect isn&apos;t idempotent yet.
                </p>
            </DocSection>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same hook. The Next.js weight is the SSR angle above: in the App Router
                    most components are server components where effects don&apos;t exist at
                    all. An effect that reads <Code>window</Code> or{" "}
                    <Code>localStorage</Code> forces the component to be a client component
                    and only runs post-hydration — often a sign the work belongs on the
                    server (data fetching) rather than in an effect.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“What&apos;s the difference between the effect body and its cleanup?”</>}
                    a={
                        <>
                            “The body <Term>sets up</Term> the synchronization; the returned
                            cleanup <Term>tears it down</Term>. React runs the cleanup before
                            re-syncing and on unmount, so setup and teardown always stay
                            paired.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why does my effect run twice on mount?”</>}
                        a={
                            <>
                                “That&apos;s <Term>Strict Mode</Term> in development
                                double-invoking it to check the cleanup is symmetric. It
                                doesn&apos;t happen in production.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}