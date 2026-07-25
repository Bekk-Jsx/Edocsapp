import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseSelectedLayoutSegmentDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>The active child segment, relative to the layout.</Term>{" "}
                    <Code>useSelectedLayoutSegment()</Code> returns the string
                    of the route segment one level below the layout it&apos;s
                    called from — the piece of URL responsible for choosing
                    which child page renders inside the layout&apos;s{" "}
                    <Code>children</Code>. Returns <Code>null</Code> when no
                    child segment is active.
                </p>
                <p>
                    <Term>One-level vs. all-levels.</Term>{" "}
                    <Code>useSelectedLayoutSegment()</Code> returns a single
                    string;{" "}
                    <Code>useSelectedLayoutSegments()</Code> returns the array
                    of every segment below the layout. Use the singular one for
                    &quot;which sibling nav item is active&quot;; the plural one
                    for breadcrumbs.
                </p>
                <p>
                    <Term>Built for shared nav in layouts.</Term> A route group
                    like <Code>/hooks/[slug]</Code> can share a{" "}
                    <Code>hooks/layout.tsx</Code> that highlights whichever hook
                    is currently active — no need to read the full path and
                    parse the last segment yourself. Client component only;
                    imported from <Code>&quot;next/navigation&quot;</Code>.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · segments are relative to the caller">
                <p>
                    The value depends on <em>where</em> you call the hook. Called
                    from the root layout, you get the top-level segment (like{" "}
                    <Code>&quot;hooks&quot;</Code>). Called from a deeper layout,
                    you get whatever sits one level below <em>that</em> layout.
                    If you get <Code>null</Code> when you expected a string,
                    you&apos;re probably calling the hook above (or at) the
                    segment you&apos;re looking for.
                </p>
            </Callout>

            <DocSection title="no react equivalent — next.js only" tone="accent">
                <p>
                    A segment concept only exists in a routing framework. The
                    hook is what makes shared layouts practical: put the nav
                    component in a client child of your layout, call{" "}
                    <Code>useSelectedLayoutSegment()</Code>, and let it
                    highlight the active row without extra prop threading.
                    Parallel routes have a matching{" "}
                    <Code>useSelectedLayoutSegment(parallelRouteKey)</Code>{" "}
                    overload for slot-aware highlighting.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you use this over <Code>usePathname</Code>?”</>}
                    a={
                        <>
                            “When I&apos;m in a <Term>shared layout</Term> and I
                            only care about the immediate child segment — not
                            the full path. It saves me from string-splitting
                            <Code>pathname</Code> and keeps the nav portable
                            across route depths.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“What&apos;s the difference between the singular and plural hook?”</>}
                        a={
                            <>
                                “<Code>useSelectedLayoutSegment</Code> gives you{" "}
                                <Term>one level down</Term>; the plural version
                                gives you the <Term>whole array of segments below</Term>
                                . Singular for sibling nav, plural for breadcrumbs.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
