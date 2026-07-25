import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseDeferredValueDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>A lagging copy of a value.</Term>{" "}
                    <Code>useDeferredValue(v)</Code> returns a version of{" "}
                    <Code>v</Code> that React is allowed to hold back. During busy
                    updates, the deferred copy sticks to the previous value; when
                    React catches up, it commits the new one.
                </p>
                <p>
                    <Term>You don&apos;t own the state.</Term> That&apos;s the whole
                    reason this hook exists. When the state lives elsewhere — a
                    prop from a parent, a value from a hook you don&apos;t control —
                    you can&apos;t wrap the setter in <Code>startTransition</Code>.
                    <Code>useDeferredValue</Code> defers the value instead.
                </p>
                <p>
                    <Term>Detect staleness with a compare.</Term>{" "}
                    <Code>current !== deferred</Code> tells you the deferred copy
                    is trailing — useful for dimming the stale UI so users know a
                    fresher result is on the way.
                </p>
            </DocSection>

            <Callout tone="amber" label="useTransition vs useDeferredValue">
                <p>
                    <Code>useTransition</Code> wraps the <em>update</em> and needs
                    access to the setter. <Code>useDeferredValue</Code> wraps the{" "}
                    <em>value</em> and works even when you only receive it read-
                    only. Pick based on whether you own the state — not on
                    perceived preference.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same hook. In the App Router, a common pattern is a client
                    component receiving a prop that changes with server data or a
                    URL search param — you can&apos;t wrap that update in a
                    transition because you didn&apos;t call any setter.{" "}
                    <Code>useDeferredValue</Code> lets you smooth the client-side
                    consequences (a heavy filter, a chart re-render) without
                    reaching back up the tree.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you pick <Code>useDeferredValue</Code> over <Code>useTransition</Code>?”</>}
                    a={
                        <>
                            “When I don&apos;t own the state — I&apos;m just
                            receiving a value and I need to <Term>let the expensive
                                render lag behind it</Term>. If I owned the setter,
                            I&apos;d reach for <Code>useTransition</Code>.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“How do you know the UI is stale?”</>}
                        a={
                            <>
                                “Compare the current value to the deferred one. If
                                they differ, React is still catching up — a good
                                moment to <Term>dim the results</Term> so the user
                                sees a fresher answer is coming.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
