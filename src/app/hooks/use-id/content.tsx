import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseIdDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>A unique ID that survives SSR hydration.</Term>{" "}
                    <Code>useId()</Code> returns a stable string that&apos;s
                    guaranteed to be the same on the server and the client for the
                    same component tree position. That matches the two renders
                    byte-for-byte and avoids hydration mismatches on{" "}
                    <Code>id</Code>/<Code>htmlFor</Code>/<Code>aria-*</Code>{" "}
                    attributes.
                </p>
                <p>
                    <Term>One call, many derived IDs.</Term> Call it once per widget
                    and build related IDs by string concat:{" "}
                    <Code>&#96;$&#123;id&#125;-desc&#96;</Code>,{" "}
                    <Code>&#96;$&#123;id&#125;-err&#96;</Code>. Multiple instances
                    of the same widget get independent bases, so IDs never
                    collide.
                </p>
                <p>
                    <Term>Not for list keys.</Term> React keys need to identify
                    <em> data</em> across renders (so items reorder correctly).{" "}
                    <Code>useId</Code> is positional, not data-bound — use the
                    item&apos;s own identifier as the key instead.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · not for anything but attribute IDs">
                <p>
                    <Code>useId</Code> is <em>only</em> for HTML attributes that
                    need a unique string across renders — <Code>id</Code>,{" "}
                    <Code>htmlFor</Code>, <Code>aria-labelledby</Code>,{" "}
                    <Code>aria-describedby</Code>. Not for CSS selectors, not for
                    keys, not for state seeds. React reserves the right to change
                    the format at any time.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Term>This hook exists because of SSR.</Term> Before it,
                    generating an ID with <Code>Math.random</Code> or a module-level
                    counter meant server and client produced different strings —
                    guaranteed hydration mismatch on any labelled input. The App
                    Router SSRs client components by default, so every accessible
                    form widget in a Next.js app relies on <Code>useId</Code>{" "}
                    (directly or through a library) to stay hydration-safe.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“Why not just use a module counter?”</>}
                    a={
                        <>
                            “Because <Term>server and client are separate processes</Term>{" "}
                            — the counter&apos;s order isn&apos;t guaranteed to match.
                            <Code>useId</Code> derives the string from the tree
                            position, so both renders land on the same value.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Can I use <Code>useId</Code> as a key for a list?”</>}
                        a={
                            <>
                                “No — keys need to <Term>identify the data</Term>, so
                                React can move DOM nodes when items reorder.{" "}
                                <Code>useId</Code> is tied to render position, not to
                                a data row. Key by the item&apos;s own id instead.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
