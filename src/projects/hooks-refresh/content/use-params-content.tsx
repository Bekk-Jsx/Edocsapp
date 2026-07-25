import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseParamsDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Read the current route&apos;s dynamic segment values.</Term>{" "}
                    <Code>useParams()</Code> returns an object keyed by the
                    bracket names in your route folders — <Code>[slug]</Code>{" "}
                    becomes <Code>params.slug</Code>, <Code>[id]</Code> becomes{" "}
                    <Code>params.id</Code>. Client component only; imported from{" "}
                    <Code>&quot;next/navigation&quot;</Code>.
                </p>
                <p>
                    <Term>Segments, not queries.</Term> If your URL is{" "}
                    <Code>/blog/hello-world?tab=comments</Code>, then{" "}
                    <Code>useParams()</Code> returns{" "}
                    <Code>{`{ slug: "hello-world" }`}</Code>. The{" "}
                    <Code>tab</Code> lives on the search params, not the params.
                </p>
                <p>
                    <Term>Server components have a separate mechanism.</Term>{" "}
                    In a Page or Layout on the server, params arrive as a prop:{" "}
                    <Code>{`function Page({ params }: { params: Promise<{ slug: string }> })`}</Code>.
                    <Code>useParams</Code> is the client-side equivalent for
                    reading the same values from a deeply nested client
                    component.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · params vs search params">
                <p>
                    <Code>useParams</Code> is <em>only</em> for dynamic segments
                    from folder names like <Code>[slug]</Code> or{" "}
                    <Code>[...rest]</Code>. Anything after the{" "}
                    <Code>?</Code> in the URL is a search param — that&apos;s{" "}
                    <Code>useSearchParams</Code>. Mixing the two up is one of the
                    most common Next.js bugs.
                </p>
            </Callout>

            <DocSection title="no react equivalent — next.js only" tone="accent">
                <p>
                    Route params only make sense in a framework with routing;
                    plain React has none. The hook exists so a client component
                    nested arbitrarily deep can read its route&apos;s dynamic
                    values without a Page or Layout passing them down as props.
                    Catch-all segments (<Code>[...slug]</Code>) come back as an
                    array; optional catch-all (<Code>[[...slug]]</Code>) can be{" "}
                    <Code>undefined</Code>.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“What&apos;s the difference between <Code>params</Code> and <Code>searchParams</Code>?”</>}
                    a={
                        <>
                            “Params come from the <Term>route folders</Term> —
                            the dynamic segments that shape the URL path. Search
                            params come from the <Term>query string</Term> after
                            the question mark. Two different data sources, two
                            different hooks.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why would I use <Code>useParams</Code> instead of the <Code>params</Code> prop?”</>}
                        a={
                            <>
                                “When the component that needs the value is a{" "}
                                <Term>deeply nested client component</Term>, and I
                                don&apos;t want to thread the prop through every
                                layer. On the Page or Layout itself, I&apos;d just
                                use the <Code>params</Code> prop.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
