import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseContextDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Context is a delivery mechanism, not state.</Term>{" "}
                    <Code>createContext</Code> makes a channel; the provider carries
                    a value; <Code>useContext</Code> reads whatever the nearest
                    provider currently holds. The state itself still lives in{" "}
                    <Code>useState</Code> / <Code>useReducer</Code> up the tree —
                    context just avoids passing it through every intermediate prop.
                </p>
                <p>
                    <Term>Every consumer re-renders when the value changes.</Term>{" "}
                    React compares the value with <Code>Object.is</Code>. Any
                    component reading via <Code>useContext</Code> re-renders when
                    that comparison fails — even if the specific field it cares
                    about is unchanged.
                </p>
                <p>
                    <Term>React 19 syntax</Term> — the context object itself is the
                    provider: <Code>&lt;MyContext value={"{v}"}&gt;</Code>. The old{" "}
                    <Code>&lt;MyContext.Provider&gt;</Code> still works but is
                    superseded.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · new object every render">
                <p>
                    Writing <Code>&lt;Ctx value={"{{ user, setUser }}"}&gt;</Code>{" "}
                    creates a fresh object identity on every parent render, so every
                    consumer re-renders even when nothing meaningful changed. Wrap
                    the value in <Code>useMemo</Code>, or split into separate
                    contexts for the fields that change at different rates
                    (value vs. dispatch is a common split).
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Term>Providers must be client components.</Term> Context is a
                    runtime React feature — it lives in the client bundle. In the
                    App Router that means a provider component sits at the top of
                    the client tree (a <Code>&quot;use client&quot;</Code>{" "}
                    wrapper), often rendered inside the root layout as{" "}
                    <Code>{"<Providers>{children}</Providers>"}</Code>.
                </p>
                <p>
                    <Term>Server components can&apos;t consume it.</Term> They run
                    once on the server with no React runtime state and no{" "}
                    <Code>useContext</Code>. If a server component needs data a
                    context holds, pass the data as props from a component that has
                    access, or fetch it directly on the server.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you reach for context over props?”</>}
                    a={
                        <>
                            “When several components need the same value and threading
                            it through props gets noisy — auth user, theme, an i18n
                            dictionary. It&apos;s about <Term>delivery</Term>, not
                            state management, so I still keep the state itself in a
                            hook and just expose it through the provider.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why do all my consumers re-render when one field changes?”</>}
                        a={
                            <>
                                “Because context compares the whole value with{" "}
                                <Term>Object.is</Term>. A new object each render fails
                                that check for every consumer. Either memoize the value
                                or split unrelated fields into separate contexts.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
