import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseImperativeHandleDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Choose the API a parent gets through a ref.</Term> By
                    default, passing <Code>ref</Code> to a native element gives the
                    parent the raw DOM node. <Code>useImperativeHandle</Code> lets
                    a custom component expose a curated object instead — a small
                    surface the parent can call methods on without touching
                    internals.
                </p>
                <p>
                    <Term>An escape hatch, not a communication channel.</Term>{" "}
                    Reach for it when a parent needs to trigger something the
                    child owns — focus, scroll, play/pause, imperative animation.
                    For data flow, stay on props and callbacks; imperative APIs
                    fight React&apos;s render-driven model.
                </p>
                <p>
                    <Term>Deps control identity.</Term> The second argument returns
                    the handle; the third array decides when the handle is rebuilt.
                    Leave it empty for a stable handle, or list values that make
                    the exposed methods change behavior.
                </p>
            </DocSection>

            <Callout tone="accent" label="react 19 — ref is a normal prop">
                <p>
                    You no longer need <Code>forwardRef</Code>. A function
                    component can accept <Code>ref</Code> as a plain prop and pass
                    it straight to <Code>useImperativeHandle(ref, ...)</Code>. The{" "}
                    <Code>forwardRef</Code> wrapper still works but is
                    superseded — new code should just declare{" "}
                    <Code>ref?: Ref&lt;Handle&gt;</Code> alongside the other props.
                </p>
            </Callout>

            <Callout tone="amber" label="trap · leaking the DOM node">
                <p>
                    Exposing the underlying element (e.g.{" "}
                    <Code>() =&gt; inputRef.current</Code>) undoes the whole point.
                    Every consumer can now poke at the DOM directly, so the child
                    can&apos;t refactor its internals without breaking callers.
                    Expose <em>verbs</em> — <Code>focus</Code>, <Code>clear</Code>,{" "}
                    <Code>scrollToBottom</Code> — not nouns.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same API. Imperative handles are a client-side concern —
                    they&apos;re about method calls that happen at runtime — so any
                    component using <Code>useImperativeHandle</Code> is a{" "}
                    <Code>&quot;use client&quot;</Code> component. Server
                    components can render such a child, but the imperative handoff
                    only happens on the client after hydration.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you use <Code>useImperativeHandle</Code>?”</>}
                    a={
                        <>
                            “When a parent needs to <Term>trigger something the child
                                owns</Term> — focus an input, play a video, scroll a
                            list. I expose a small named API through the ref instead
                            of leaking the DOM node.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Do I still need <Code>forwardRef</Code> in React 19?”</>}
                        a={
                            <>
                                “No — <Term>ref is just a prop</Term> now. I declare it
                                on the props type and pass it into{" "}
                                <Code>useImperativeHandle</Code>. Old{" "}
                                <Code>forwardRef</Code> code keeps working, but new
                                components don&apos;t need the wrapper.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
