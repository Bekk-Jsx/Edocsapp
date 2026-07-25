import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseCallbackDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term><Code>useCallback</Code> is <Code>useMemo</Code> for
                        functions.</Term> It caches the function&apos;s identity across
                    renders — <Code>useCallback(fn, deps)</Code> is equivalent to{" "}
                    <Code>useMemo(() =&gt; fn, deps)</Code>. The function body still
                    runs whenever you call it; what&apos;s memoized is which
                    function reference you hold.
                </p>
                <p>
                    <Term>Identity matters only to specific consumers.</Term>{" "}
                    Passing a fresh function to a plain child is fine — the child
                    re-renders anyway. Passing it to a{" "}
                    <Code>React.memo</Code> child, or listing it as a dep in{" "}
                    <Code>useEffect</Code>/<Code>useMemo</Code>, is where the
                    identity change causes work — and where{" "}
                    <Code>useCallback</Code> pays off.
                </p>
                <p>
                    <Term>Deps mirror the closure.</Term> Every reactive value the
                    function reads goes in the array. Omitting deps to keep the
                    identity stable creates stale closures — fix the cause (move
                    the value, use a functional updater, or restructure).
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · noise memoization">
                <p>
                    Wrapping every callback in <Code>useCallback</Code>{" "}
                    &quot;just in case&quot; adds cost without benefit. It only
                    helps when the consumer is <Code>React.memo</Code>-wrapped
                    <em> or</em> the function is an effect / memo dependency.
                    Anywhere else, it&apos;s bookkeeping React runs on every render
                    for nothing.
                </p>
            </Callout>

            <Callout tone="accent" label="react 19 · the compiler is doing this for you">
                <p>
                    The <Term>React Compiler</Term> (stable in React 19) preserves
                    function identity automatically wherever it&apos;s safe to do
                    so. In compiler-enabled codebases, manual{" "}
                    <Code>useCallback</Code> is mostly obsolete — reach for it only
                    when you&apos;ve confirmed the compiler bailed out.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same hook, same rules. In the App Router, event handlers live
                    on client components — server components don&apos;t hold
                    function identity across renders (they don&apos;t re-render).
                    So <Code>useCallback</Code> only shows up inside{" "}
                    <Code>&quot;use client&quot;</Code> code.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“What does <Code>useCallback</Code> actually give you?”</>}
                    a={
                        <>
                            “A <Term>stable function identity</Term> between renders.
                            The function body still runs when called; what it caches
                            is the reference. That matters when a memoized child or
                            an effect dep is comparing by identity.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why is wrapping every handler in <Code>useCallback</Code> bad?”</>}
                        a={
                            <>
                                “Because memoization has a cost. If the consumer
                                doesn&apos;t care about identity — a normal child, an
                                inline event — you&apos;re paying to <Term>preserve
                                    something no one reads</Term>. Only reach for it
                                when the identity is actually being compared.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
