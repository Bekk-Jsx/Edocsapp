import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseTransitionDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Mark an update as non-urgent.</Term>{" "}
                    <Code>useTransition</Code> returns{" "}
                    <Code>[isPending, startTransition]</Code>. State changes made{" "}
                    <em>inside</em> <Code>startTransition</Code> are labeled as
                    interruptible — React can pause them to keep urgent updates
                    (keystrokes, clicks) responsive.
                </p>
                <p>
                    <Term>Urgent stays urgent; only the expensive follow-up is
                        deferred.</Term> The typical shape: update the tiny input
                    state normally, then wrap the state that drives the heavy list
                    in <Code>startTransition</Code>. React commits the input
                    immediately and interrupts the list re-render if you keep
                    typing.
                </p>
                <p>
                    <Term><Code>isPending</Code> is a UX hint.</Term> Use it to dim
                    stale results or show a subtle indicator — not for correctness.
                    Don&apos;t gate side effects on it.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · putting the input inside the transition">
                <p>
                    If you also wrap <Code>setQuery(input)</Code> in{" "}
                    <Code>startTransition</Code>, the input becomes interruptible
                    too — typing feels laggy under load, defeating the whole point.
                    Keep the urgent update (the keystroke) outside; only the derived
                    state that triggers the heavy render belongs inside.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same hook. In the App Router, <Code>useTransition</Code> also
                    covers the pending state of async transitions triggered by
                    server actions: calling a server action inside{" "}
                    <Code>startTransition</Code> flips <Code>isPending</Code> until
                    the response commits, which is what powers optimistic UI
                    patterns alongside <Code>useOptimistic</Code>.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“What&apos;s the difference between urgent and non-urgent state?”</>}
                    a={
                        <>
                            “Urgent updates <Term>must reflect right away</Term> —
                            typing, clicks. Non-urgent updates are ones the user can
                            wait a beat for — the filtered list, a chart re-render.
                            Wrapping the non-urgent ones in{" "}
                            <Code>startTransition</Code> lets React interrupt them
                            to keep the urgent path fluid.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“When would you show <Code>isPending</Code>?”</>}
                        a={
                            <>
                                “As a <Term>subtle staleness cue</Term> — dim the
                                list, show a small &apos;updating…&apos; label. Not
                                for anything the user has to wait on before
                                interacting.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
