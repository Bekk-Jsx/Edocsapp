import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseActionStateDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Reducer shape, action dispatch.</Term>{" "}
                    <Code>useActionState(reducer, initial)</Code> returns{" "}
                    <Code>[state, formAction, isPending]</Code>. The reducer takes{" "}
                    <Code>(prevState, payload)</Code> and returns the next state —
                    just like <Code>useReducer</Code> — but the &quot;dispatch&quot;
                    is <Code>formAction</Code>, which you pass to a{" "}
                    <Code>&lt;form action&gt;</Code> or call directly.
                </p>
                <p>
                    <Term>Submissions are transitions.</Term> Each invocation runs
                    inside a transition, so <Code>isPending</Code> lights up while
                    the reducer is running (or awaiting a server response) and the
                    UI stays interactive. No manual{" "}
                    <Code>startTransition</Code> needed.
                </p>
                <p>
                    <Term>The payload is a FormData when used with a form.</Term>{" "}
                    If you pass <Code>formAction</Code> to{" "}
                    <Code>&lt;form action&gt;</Code>, React invokes it with{" "}
                    <Code>FormData</Code>. Call it directly and you pass whatever
                    argument you want — the reducer signature adapts.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · the second arg is the payload, not the event">
                <p>
                    Old form patterns pass a synthetic event to{" "}
                    <Code>onSubmit</Code>. Here, the reducer receives the{" "}
                    <Code>FormData</Code> React collected — read fields with{" "}
                    <Code>formData.get(&quot;name&quot;)</Code>. The reducer must
                    return the full next state; there&apos;s no partial-merge
                    shortcut.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Term>Designed to pair with Server Actions.</Term> Mark the
                    reducer with <Code>&quot;use server&quot;</Code> and it runs on
                    the server; React handles the request, awaits the result, and
                    commits the returned state on the client — with progressive
                    enhancement (the form still submits without JavaScript).
                    The demo above simulates the async work with{" "}
                    <Code>setTimeout</Code> so it runs client-only; the CODE panel
                    shows the real{" "}
                    <Code>&quot;use server&quot;</Code> shape and how the same hook
                    consumes it unchanged.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“How is <Code>useActionState</Code> different from <Code>useReducer</Code>?”</>}
                    a={
                        <>
                            “Same reducer shape, different dispatcher. Instead of
                            calling <Code>dispatch(payload)</Code> yourself, you
                            hand <Code>formAction</Code> to a form (or call it
                            directly). Submissions are <Term>transitions</Term> and
                            can be async — so it works naturally with server
                            actions.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“What does <Code>isPending</Code> tell you?”</>}
                        a={
                            <>
                                “That an invocation is in flight — <Term>the reducer
                                    is running or awaiting</Term>. Use it to disable the
                                submit button, show a spinner, or dim the form.
                                It&apos;s the same signal <Code>useTransition</Code>{" "}
                                exposes, just wired to the action.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
