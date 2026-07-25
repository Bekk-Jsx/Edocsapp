import { DocSection, Code } from "@/components/ui/doc-section";

export function UseStateDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <strong className="text-[var(--text)]">Functional updater.</strong>{" "}
                    Use <Code>setCount(c =&gt; c + 1)</Code> whenever the next value
                    depends on the previous and the update is deferred (async, several in
                    one handler, inside effects). With <Code>count + 1</Code> each closure
                    captured the same <Code>count</Code>, so three fast async clicks
                    settle at +1.
                </p>
                <p>
                    <strong className="text-[var(--text)]">Lazy initializer.</strong> Pass
                    the function — <Code>useState(readInitial)</Code>, not{" "}
                    <Code>useState(readInitial())</Code>. It runs once on mount. Calling it
                    re-runs the expensive work every render (React discards the result but
                    you still paid).
                </p>
                <p>
                    <strong className="text-[var(--text)]">Bail-out.</strong> Setting state
                    to an <Code>Object.is</Code>-equal value skips the re-render. But a{" "}
                    <em>new object reference</em> with identical contents still
                    re-renders — reference identity is what&apos;s compared, not deep
                    equality.
                </p>
                <p>
                    <strong className="text-[var(--text)]">Batching.</strong> React 18+
                    batches every update in a tick — including inside promises, timeouts,
                    and native handlers (React 17 only batched inside React event
                    handlers). Multiple <Code>setState</Code> calls = one render.
                </p>
            </DocSection>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useState</Code> is identical. The only wrinkle is the{" "}
                    <Code>&quot;use client&quot;</Code> requirement: a Server Component
                    can&apos;t hold state. If you reach for <Code>useState</Code> in a
                    server file, ask whether that state belongs on the client at all, or
                    whether it&apos;s server data you should fetch directly.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <div>
                    <p className="text-[var(--text)]">
                        Q: “Why does the counter only go up by one when you click fast?”
                    </p>
                    <p className="mt-1">
                        A: “The handler <strong className="text-[var(--text)]">closes
                            over</strong> a stale <Code>count</Code>, so every queued update
                        writes the same value. The functional updater fixes it because React{" "}
                        <strong className="text-[var(--text)]">feeds it the latest
                            state</strong>.”
                    </p>
                </div>

                <div className="mt-4">
                    <p className="text-[var(--text)]">
                        Q: “Why pass a function to <Code>useState</Code> instead of a value?”
                    </p>
                    <p className="mt-1">
                        A: “To <strong className="text-[var(--text)]">defer</strong> an
                        expensive computation so it runs{" "}
                        <strong className="text-[var(--text)]">once on mount</strong> rather
                        than on every render. It&apos;s called a{" "}
                        <strong className="text-[var(--text)]">lazy initializer</strong>.”
                    </p>
                </div>
            </DocSection>
        </>
    );
}