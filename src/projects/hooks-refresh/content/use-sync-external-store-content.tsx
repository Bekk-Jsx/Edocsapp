import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseSyncExternalStoreDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>The correct primitive for reading non-React state.</Term>{" "}
                    <Code>useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)</Code>{" "}
                    lets a component subscribe to any external source —{" "}
                    <Code>window</Code>, a Redux store, a media query, a browser
                    API — and re-render whenever that source notifies of a change.
                </p>
                <p>
                    <Term>Three pieces do the whole job.</Term>{" "}
                    <Code>subscribe(cb)</Code> attaches a listener and returns an
                    unsubscribe function. <Code>getSnapshot()</Code> reads the
                    current value synchronously — must be cheap and return the{" "}
                    <em>same reference</em> when the underlying data hasn&apos;t
                    changed (or React will re-render on every check).{" "}
                    <Code>getServerSnapshot()</Code> is the value used during SSR
                    and the initial client render.
                </p>
                <p>
                    <Term>Tear-free by design.</Term> This is the hook that
                    replaced the old <Code>useEffect</Code> +{" "}
                    <Code>useState</Code> subscription pattern precisely because
                    that pattern could show inconsistent values across components
                    during a concurrent render.{" "}
                    <Code>useSyncExternalStore</Code> guarantees every component in
                    a render pass sees the same snapshot.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · skip getServerSnapshot and you get a mismatch">
                <p>
                    Omit <Code>getServerSnapshot</Code> in a component that renders
                    on the server and React throws during SSR. Provide a value
                    that&apos;s <em>safe on the server</em> — a stable default that
                    matches the shape of your data. If the real value can only be
                    known on the client, return a sentinel and render a
                    &quot;detecting…&quot; state until the subscription takes
                    over.
                </p>
            </Callout>

            <Callout tone="amber" label="trap · new object per snapshot">
                <p>
                    Returning a fresh <Code>{"{ x, y }"}</Code> from{" "}
                    <Code>getSnapshot</Code> on every call triggers a re-render
                    every check, because React compares with <Code>Object.is</Code>.
                    Cache the snapshot inside the store, or read primitives out
                    with separate hook calls (as this demo does with{" "}
                    <Code>online</Code> and <Code>width</Code>).
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Term>The <Code>getServerSnapshot</Code> arg exists for the App
                        Router.</Term> Client components are SSRed by default in
                    Next.js, and any component reading a browser-only value would
                    otherwise crash the server render. Provide the third argument
                    with a hydration-safe default and the component works in both
                    passes. State-management libraries (Zustand, Redux, Jotai,
                    TanStack Query) all sit on top of{" "}
                    <Code>useSyncExternalStore</Code> — you rarely call it
                    directly, but everything reactive in a Next.js app runs
                    through it.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you reach for <Code>useSyncExternalStore</Code>?”</>}
                    a={
                        <>
                            “When the state I care about <Term>lives outside React</Term>{" "}
                            — a browser API, a global store, a media query. I give
                            it a way to subscribe, a way to read, and a safe value
                            for the server, and my component re-renders when the
                            source changes.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why not just do <Code>useEffect</Code> + <Code>useState</Code>?”</>}
                        a={
                            <>
                                “That pattern <Term>tears under concurrent rendering</Term>{" "}
                                — different components can end up reading different
                                values in the same paint. <Code>useSyncExternalStore</Code>{" "}
                                exists specifically to keep every reader consistent in
                                a single render pass.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
