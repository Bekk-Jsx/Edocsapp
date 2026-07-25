import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseLayoutEffectDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Same shape as useEffect, different timing.</Term>{" "}
                    <Code>useLayoutEffect</Code> runs synchronously after React
                    commits DOM mutations but <em>before</em> the browser paints.
                    That gap is the whole point: you can read layout (
                    <Code>getBoundingClientRect</Code>, <Code>offsetHeight</Code>)
                    and write to the DOM without a visible flicker.
                </p>
                <p>
                    <Term>Reach for it only when useEffect flickers.</Term> If your
                    effect just measures then adjusts state, the user sees the pre-
                    adjusted paint for one frame. Move it to{" "}
                    <Code>useLayoutEffect</Code> and the adjustment happens inside
                    the same commit — no flash. For anything the user doesn&apos;t
                    see (network, subscriptions, timers), stay on{" "}
                    <Code>useEffect</Code>.
                </p>
                <p>
                    <Term>It blocks paint.</Term> Heavy work here delays the frame,
                    so keep the body cheap: read a measurement, set a value, return.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · ssr warning">
                <p>
                    <Code>useLayoutEffect</Code> doesn&apos;t run on the server, and
                    React warns when it&apos;s used in components that render during
                    SSR. In the App Router this only fires for{" "}
                    <Code>&quot;use client&quot;</Code> components that get
                    server-rendered for hydration. If you truly need to run only in
                    the browser, guard the layout work behind{" "}
                    <Code>typeof window !== &quot;undefined&quot;</Code> or fall
                    back to <Code>useEffect</Code> and accept the one-frame flash.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same API, same rules. The Next.js angle is SSR: server
                    components never run hooks, and client components that use{" "}
                    <Code>useLayoutEffect</Code> still hydrate — the effect fires
                    once React takes over on the client. If a component only exists
                    to measure the DOM, mark it <Code>&quot;use client&quot;</Code>{" "}
                    and keep it as small as possible so the SSR pass doesn&apos;t
                    ship dead server logic to the client bundle.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you pick <Code>useLayoutEffect</Code> over <Code>useEffect</Code>?”</>}
                    a={
                        <>
                            “When I need to <Term>read layout and adjust the DOM before the browser paints</Term> —
                            like flipping a tooltip that would otherwise render off-screen.
                            Anything the user won&apos;t see between paints stays in <Code>useEffect</Code>.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why does it warn during SSR?”</>}
                        a={
                            <>
                                “Because it runs <Term>synchronously before paint</Term>, and the
                                server has no paint. The effect is skipped on the server, so the
                                warning is just React telling you the layout work won&apos;t exist
                                in the initial HTML.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
