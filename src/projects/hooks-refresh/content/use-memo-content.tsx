import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseMemoDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Cache a computed value across renders.</Term>{" "}
                    <Code>useMemo(fn, deps)</Code> runs <Code>fn</Code> during the
                    first render, keeps the result, and returns the cached value on
                    later renders unless a dep changed by <Code>Object.is</Code>.
                    The gain is skipping the work; the cost is bookkeeping.
                </p>
                <p>
                    <Term>Two shapes of use.</Term> (1) Skip an expensive
                    computation — filtering, sorting, parsing. (2) Keep an object
                    or array&apos;s identity stable so a memoized child, context
                    value, or effect dep doesn&apos;t see a &quot;new&quot; value
                    every render.
                </p>
                <p>
                    <Term>Only reach for it when profiling justifies it.</Term>{" "}
                    Adding <Code>useMemo</Code> to every derived value slows most
                    apps down — the memo overhead is real. Measure first.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · perf hint, not a guarantee">
                <p>
                    React is allowed to <em>throw the cache away</em> — under memory
                    pressure, across dev remounts, or as a future implementation
                    detail. Never depend on the memoized function running exactly
                    once per dep change for correctness. If a side effect matters,
                    move it into an event handler or <Code>useEffect</Code>.
                </p>
            </Callout>

            <Callout tone="accent" label="react 19 · the compiler is doing this for you">
                <p>
                    The <Term>React Compiler</Term> (stable in React 19) auto-
                    memoizes components and values it can prove are safe. Manual{" "}
                    <Code>useMemo</Code> is increasingly a smell — reach for it only
                    when the compiler can&apos;t optimize (bailouts you&apos;ve
                    verified) or when you specifically need identity stability the
                    compiler doesn&apos;t guarantee.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same hook. In the App Router the bigger perf question is often
                    where the work runs at all: heavy data shaping usually belongs
                    in a server component (no re-render, no client JS shipped),
                    not memoized on the client. <Code>useMemo</Code> is a
                    client-side tool for values whose inputs actually change over
                    time.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you use <Code>useMemo</Code>?”</>}
                    a={
                        <>
                            “When I have a computation that&apos;s{" "}
                            <Term>measurably expensive</Term> and its inputs change
                            less often than the component re-renders — or when I
                            need a <Term>stable identity</Term> for a derived object.
                            Otherwise the bookkeeping usually costs more than the
                            computation.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Can I trust the cache to hold?”</>}
                        a={
                            <>
                                “No — it&apos;s a <Term>perf hint</Term>. React can
                                drop it, so the function may run again even when deps
                                are unchanged. If correctness depends on running (or
                                not running) something, it doesn&apos;t belong in{" "}
                                <Code>useMemo</Code>.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
