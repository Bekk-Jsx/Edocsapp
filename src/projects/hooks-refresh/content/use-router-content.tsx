import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseRouterDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Programmatic navigation for App Router client
                        components.</Term> <Code>useRouter()</Code> gives you an
                    object with <Code>push</Code>, <Code>replace</Code>,{" "}
                    <Code>back</Code>, <Code>forward</Code>, <Code>refresh</Code>,
                    and <Code>prefetch</Code>. Requires{" "}
                    <Code>&quot;use client&quot;</Code>.
                </p>
                <p>
                    <Term>Prefer <Code>&lt;Link&gt;</Code> when you can.</Term>{" "}
                    Declarative links handle prefetching, scroll restoration, and
                    accessibility out of the box. Reach for{" "}
                    <Code>useRouter</Code> when navigation follows an event that
                    isn&apos;t a click — after a form mutation, in response to a
                    state change, or gated on some condition.
                </p>
                <p>
                    <Term><Code>router.refresh()</Code> is the interesting one.</Term>{" "}
                    It re-fetches the current route&apos;s Server Component payload
                    (server data) and merges it into the existing client tree
                    <em> without</em> losing input state, scroll position, or
                    running effects. Use it after a client-side mutation that
                    invalidates something the server rendered.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · import path">
                <p>
                    Import from <Code>&quot;next/navigation&quot;</Code>. The
                    similarly-named <Code>&quot;next/router&quot;</Code> belongs
                    to the old Pages Router — different object, different methods,
                    different behavior. Mixing them silently breaks in ways that
                    look like &quot;the router just doesn&apos;t work&quot;.
                </p>
            </Callout>

            <DocSection title="no react equivalent — next.js only" tone="accent">
                <p>
                    This hook doesn&apos;t exist in plain React. It&apos;s
                    Next.js&apos;s bridge between client components and the App
                    Router&apos;s route tree. The same is true for{" "}
                    <Code>usePathname</Code>, <Code>useParams</Code>,{" "}
                    <Code>useSearchParams</Code>, and{" "}
                    <Code>useSelectedLayoutSegment</Code> — all live in{" "}
                    <Code>&quot;next/navigation&quot;</Code>, all require{" "}
                    <Code>&quot;use client&quot;</Code>.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you use <Code>useRouter</Code> instead of <Code>&lt;Link&gt;</Code>?”</>}
                    a={
                        <>
                            “When the navigation isn&apos;t a click on an anchor —
                            after a save, on a validation success, from a
                            conditional. For anything that <Term>looks like a
                                link</Term> to the user, I keep{" "}
                            <Code>&lt;Link&gt;</Code>.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“What&apos;s <Code>router.refresh()</Code> for?”</>}
                        a={
                            <>
                                “<Term>Re-fetching server data</Term> for the current
                                route without a full navigation. Client state stays
                                put; only what the server produced gets replayed.
                                Perfect after a client-side mutation that
                                invalidates a server-rendered list.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
