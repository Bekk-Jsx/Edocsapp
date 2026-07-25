import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseSearchParamsDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Read the query string as a URLSearchParams.</Term>{" "}
                    <Code>useSearchParams()</Code> returns a{" "}
                    <em>read-only</em> URLSearchParams reflecting everything
                    after the <Code>?</Code>. Re-renders when the URL changes.
                    Requires <Code>&quot;use client&quot;</Code>; imported from{" "}
                    <Code>&quot;next/navigation&quot;</Code>.
                </p>
                <p>
                    <Term>To change it, build a new string.</Term> The returned
                    object doesn&apos;t have write methods you can call directly.
                    Clone it with <Code>new URLSearchParams(searchParams)</Code>,
                    mutate the clone, then call <Code>router.push</Code> or{" "}
                    <Code>router.replace</Code> with{" "}
                    <Code>{"`${pathname}?${params.toString()}`"}</Code>. Choose{" "}
                    <Code>replace</Code> for input-driven updates so the back
                    button doesn&apos;t crawl through every keystroke.
                </p>
                <p>
                    <Term>Search params, not route params.</Term> If the URL is{" "}
                    <Code>/blog/hello?tab=comments</Code>, this hook gives you{" "}
                    <Code>{`{ tab: "comments" }`}</Code> — the{" "}
                    <Code>slug</Code> lives in <Code>useParams</Code>.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · opts the route out of static rendering">
                <p>
                    Reading <Code>useSearchParams</Code> anywhere in a route makes
                    the containing tree dynamic — Next.js can&apos;t know the
                    query at build time. Wrap the reader in{" "}
                    <Code>&lt;Suspense&gt;</Code> to keep the boundary tight so
                    the rest of the route can still be prerendered. The demo
                    above does this via an inner{" "}
                    <Code>&lt;SearchBox&gt;</Code> component nested in a{" "}
                    <Code>&lt;Suspense&gt;</Code>.
                </p>
            </Callout>

            <Callout tone="amber" label="trap · read-only, no set method">
                <p>
                    Calling <Code>searchParams.set(...)</Code> on the returned
                    object mutates nothing you can see — the URL doesn&apos;t
                    change. That&apos;s not a bug; the hook returns a snapshot.
                    Always go through the router.
                </p>
            </Callout>

            <DocSection title="no react equivalent — next.js only" tone="accent">
                <p>
                    Reading URL state from a client component is a routing
                    concern; plain React has none. In Next.js, use{" "}
                    <Code>useSearchParams</Code> to read and{" "}
                    <Code>useRouter</Code> to write — with a{" "}
                    <Code>&lt;Suspense&gt;</Code> around the reader so static
                    rendering survives.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“Why is <Code>useSearchParams</Code> read-only?”</>}
                    a={
                        <>
                            “Because the URL is the <Term>source of truth</Term>,
                            not a piece of state you mutate. To change it, I
                            build a new query string and hand it to the router.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why do I need <Code>&lt;Suspense&gt;</Code> around the reader?”</>}
                        a={
                            <>
                                “Because <Code>useSearchParams</Code>{" "}
                                <Term>opts the tree out of static rendering</Term>{" "}
                                — the query isn&apos;t known at build time. A tight
                                Suspense boundary keeps the dynamic part local, so
                                the rest of the route can still be prerendered.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
