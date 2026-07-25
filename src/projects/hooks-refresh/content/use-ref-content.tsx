import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseRefDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Two jobs, one hook.</Term> <Code>useRef</Code> returns an
                    object with a <Code>.current</Code> that (a) React attaches to
                    a DOM node when you pass it as <Code>ref</Code>, and (b) you
                    can read/write yourself to keep a mutable value between renders
                    that <em>doesn&apos;t</em> trigger one.
                </p>
                <p>
                    <Term>Not state.</Term> Writing to <Code>ref.current</Code>{" "}
                    doesn&apos;t schedule a re-render. If the UI needs to reflect
                    the value, that value belongs in <Code>useState</Code>. Refs
                    are for things the render output <em>doesn&apos;t</em> depend
                    on — DOM nodes, timer IDs, previous values, controllers.
                </p>
                <p>
                    <Term>The initial value is only used once.</Term>{" "}
                    <Code>useRef(0)</Code> creates the box with{" "}
                    <Code>current = 0</Code> on mount and never resets it. Later
                    renders keep whatever value you&apos;ve written.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · don't touch ref during render">
                <p>
                    Reading or writing <Code>ref.current</Code> in the render body
                    breaks React&apos;s model — the value is undefined during the
                    first render (for DOM refs), and mutating it in render makes
                    output depend on render order. Only touch refs inside event
                    handlers, effects, or callbacks React invokes for you.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same API. The Next.js twist is that refs — especially DOM refs —
                    only make sense in <Code>&quot;use client&quot;</Code>{" "}
                    components. Server components never mount into a real DOM, so
                    there&apos;s no node to reference. If a component needs a ref,
                    that&apos;s the signal to draw the client boundary there.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you use a ref instead of state?”</>}
                    a={
                        <>
                            “When the value shouldn&apos;t <Term>drive rendering</Term>{" "}
                            — a DOM node I need to focus, a timeout ID I need to clear,
                            or a value I want to remember across renders without
                            causing one. If the UI reflects the value, it&apos;s state.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why doesn&apos;t my UI update after I set <Code>ref.current</Code>?”</>}
                        a={
                            <>
                                “Because refs are a <Term>mutable box</Term>, not
                                reactive state. React never subscribes to changes on{" "}
                                <Code>ref.current</Code>. If the render output needs
                                the new value, move it into <Code>useState</Code>.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
