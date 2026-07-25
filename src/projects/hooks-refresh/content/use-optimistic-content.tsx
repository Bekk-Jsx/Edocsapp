import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseOptimisticDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Instant UI while the real update lands.</Term>{" "}
                    <Code>useOptimistic(state, updateFn)</Code> returns{" "}
                    <Code>[optimisticState, addOptimistic]</Code>. Call{" "}
                    <Code>addOptimistic(payload)</Code> inside a transition or
                    action and React shows the derived optimistic value until the
                    action settles — then reverts to the real state.
                </p>
                <p>
                    <Term>The optimistic state is derived, not stored.</Term>{" "}
                    It&apos;s a temporary view computed by <Code>updateFn</Code>{" "}
                    on top of the real state. Once the action commits (or throws),
                    React discards the overlay and rerenders with the real state.
                    Nothing to roll back manually.
                </p>
                <p>
                    <Term>Must be called inside a transition or form action.</Term>{" "}
                    Calling <Code>addOptimistic</Code> outside one throws. In
                    practice that means: form <Code>action</Code> handlers,{" "}
                    <Code>startTransition</Code> callbacks, or handlers wrapped
                    with either.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · the overlay is temporary">
                <p>
                    If the action throws, <Code>useOptimistic</Code> automatically
                    reverts — you shouldn&apos;t (and can&apos;t) &quot;persist&quot;
                    the optimistic value. The real state must come from the action
                    result. Show the pending row with a subtle cue{" "}
                    (<Code>sending…</Code>, dimmed opacity) so the user knows it
                    hasn&apos;t committed yet.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Term>Made for Server Actions.</Term> The pattern shines when
                    the &quot;action&quot; is a network round-trip: user clicks
                    like, the count bumps immediately, and the server response
                    replaces the optimistic overlay with the authoritative value.
                    Latency disappears from the user&apos;s perspective without
                    lying about the real state. The demo here simulates the
                    server with <Code>setTimeout</Code>; swap in a{" "}
                    <Code>&quot;use server&quot;</Code> function and nothing else
                    changes.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“How does <Code>useOptimistic</Code> differ from just setting state?”</>}
                    a={
                        <>
                            “Setting state permanently changes it — you&apos;d have
                            to <Term>manually revert</Term> if the action failed.
                            <Code>useOptimistic</Code> layers a temporary view over
                            the real state; when the action settles, the overlay
                            is dropped and the real state is what remains.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“What happens if the action throws?”</>}
                        a={
                            <>
                                “The optimistic overlay is <Term>automatically discarded</Term>,
                                and React renders the pre-action state. You handle the
                                error yourself — show a toast, keep the input filled —
                                but the list state itself needs no rollback logic.”
                        </>
                    }
                />
                </div>
            </DocSection>
        </>
    );
}
