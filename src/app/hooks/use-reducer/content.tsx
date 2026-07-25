import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseReducerDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>The reducer must be pure.</Term> Same{" "}
                    <Code>(state, action)</Code> in, same next state out — no
                    mutation, no I/O, no <Code>Date.now()</Code>, no{" "}
                    <Code>crypto.randomUUID()</Code>. Anything non-deterministic
                    goes in the action payload (see the{" "}
                    <Code>id</Code> passed with <Code>add</Code> in the demo).
                    Strict Mode double-invokes the reducer in development to
                    surface impurity — silent bugs become loud ones.
                </p>
                <p>
                    <Term>Discriminated-union actions.</Term> A union like{" "}
                    <Code>{`{ type: "add" } | { type: "toggle" }`}</Code> gives
                    you exhaustive type-checking in the <Code>switch</Code> — TS
                    complains if you add a new action type without handling it,
                    and inside each <Code>case</Code> the payload is narrowed
                    correctly. It&apos;s the shape that makes{" "}
                    <Code>useReducer</Code> nicer than a bag of{" "}
                    <Code>useState</Code>s.
                </p>
                <p>
                    <Term>Dispatch has a stable identity.</Term> React never
                    changes the reference between renders. You can hand it to
                    memoized children, list it in effect deps, or ignore its dep
                    entry entirely — no <Code>useCallback</Code> needed.
                </p>
                <p>
                    <Term>Lazy init runs once.</Term> The third argument{" "}
                    <Code>useReducer(reducer, seed, init)</Code> is a function
                    called once on mount with the seed. Handy for building the
                    initial state from a prop, parsing storage, or any setup you
                    don&apos;t want to redo every render.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · smuggling side effects into the reducer">
                <p>
                    Calling APIs, mutating a ref, or logging from inside a
                    reducer looks harmless — until Strict Mode fires it twice
                    and you send duplicate requests. Push side effects into the
                    event handler (before <Code>dispatch</Code>) or into a{" "}
                    <Code>useEffect</Code> that reacts to the new state. The
                    reducer is a pure state transition, nothing else.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Term>Same hook, needs <Code>&quot;use client&quot;</Code>.</Term>{" "}
                    Reducers live in the client bundle in the App Router — a
                    server component can render a page whose state is managed by
                    a client child using <Code>useReducer</Code>, but the hook
                    itself only runs on the client.
                </p>
                <p>
                    <Term>React 19 lookahead:</Term> <Code>useActionState</Code>{" "}
                    is reducer-shaped — same{" "}
                    <Code>(prev, payload) =&gt; next</Code> signature — but its{" "}
                    &quot;dispatch&quot; is a server action wired to a{" "}
                    <Code>&lt;form action&gt;</Code>. When state transitions
                    live on the server, you reach for that instead. For pure
                    client-side transitions, <Code>useReducer</Code> is still
                    the right primitive.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you pick <Code>useReducer</Code> over <Code>useState</Code>?”</>}
                    a={
                        <>
                            “When the state has <Term>multiple related fields</Term>{" "}
                            or the transitions get complex enough that scattered{" "}
                            <Code>setState</Code> calls become hard to reason
                            about. Centralizing the transition logic in one{" "}
                            <Term>pure, testable function</Term> makes the
                            component thinner and the update rules explicit.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Do you need to <Code>useCallback</Code> <Code>dispatch</Code> before passing it down?”</>}
                        a={
                            <>
                                “No — <Term>dispatch has a stable identity</Term>{" "}
                                by design. React guarantees the reference never
                                changes between renders, so memoized children and
                                effect deps are already happy.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
