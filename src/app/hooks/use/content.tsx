import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>A hook that reads resources.</Term> <Code>use(x)</Code>{" "}
                    accepts a <em>Context</em> or a <em>Promise</em>. For a
                    context it returns the current value like{" "}
                    <Code>useContext</Code>. For a promise it suspends the
                    component until resolution and returns the resolved value —
                    integrating async data with Suspense boundaries.
                </p>
                <p>
                    <Term>Rules of Hooks don&apos;t apply.</Term> Unlike every
                    other hook, <Code>use</Code> can be called inside{" "}
                    <Code>if</Code> branches, loops, and early returns. That&apos;s
                    the point — it lets components conditionally consume a resource
                    without hoisting the read to the top.
                </p>
                <p>
                    <Term>Never create the promise inside the reader.</Term>{" "}
                    A new promise every render suspends forever. Create it once
                    somewhere stable — a server component prop, a cache, or a piece
                    of state — and pass the same reference down.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · suspends until resolved">
                <p>
                    Calling <Code>use</Code> on a pending promise throws to the
                    nearest <Code>&lt;Suspense&gt;</Code> boundary. Without one,
                    the suspension bubbles up until React finds a boundary or the
                    root — which produces an error in production. Every promise
                    read needs a Suspense parent close enough to actually hold the
                    fallback UI you want.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Term>The App Router pattern is server-creates, client-reads.</Term>{" "}
                    A server component starts the fetch (no <Code>await</Code>{" "}
                    needed for the whole tree — just pass the promise down as a
                    prop) and a client component calls <Code>use(promise)</Code>{" "}
                    inside a Suspense boundary. The server streams the pending
                    HTML, the browser fetches concurrently, and React swaps the
                    fallback for the resolved UI when the promise settles.
                    The demo above simulates the promise client-side so it runs in
                    isolation; the CODE panel shows the real flow.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“What&apos;s the difference between <Code>use</Code> and <Code>useContext</Code>?”</>}
                    a={
                        <>
                            “Both can read a context, but <Code>use</Code> is{" "}
                            <Term>allowed inside conditionals</Term>. It also reads
                            promises, which <Code>useContext</Code> can&apos;t.
                            Think of it as the general resource-reading primitive.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Where should I create the promise <Code>use</Code> reads?”</>}
                        a={
                            <>
                                “Anywhere <Term>stable across renders</Term> — a
                                server component prop is best, then state or a cache.
                                Never inline inside the reader, or it will suspend
                                forever because you keep making a new promise.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
