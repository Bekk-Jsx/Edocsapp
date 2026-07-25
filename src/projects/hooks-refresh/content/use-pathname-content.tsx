import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UsePathnameDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>The current URL pathname, reactive.</Term>{" "}
                    <Code>usePathname()</Code> returns a string like{" "}
                    <Code>&quot;/hooks-refresh/use-pathname&quot;</Code> and re-renders
                    whenever the user navigates. Requires{" "}
                    <Code>&quot;use client&quot;</Code>; imported from{" "}
                    <Code>&quot;next/navigation&quot;</Code>.
                </p>
                <p>
                    <Term>Pathname only — no query, no hash.</Term> The returned
                    string never contains the search string or the fragment. If
                    you need <Code>?q=…</Code>, that&apos;s{" "}
                    <Code>useSearchParams</Code>; if you need dynamic segment
                    values, that&apos;s <Code>useParams</Code>.
                </p>
                <p>
                    <Term>Perfect for nav highlighting.</Term> Compare against
                    each link&apos;s <Code>href</Code> and toggle an active
                    style. For deeper trees where you want to highlight based on
                    the current <em>segment</em> rather than the full path, use{" "}
                    <Code>useSelectedLayoutSegment</Code> from a layout.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · import path">
                <p>
                    Import from <Code>&quot;next/navigation&quot;</Code>. The old
                    Pages Router exposed <Code>router.pathname</Code> from{" "}
                    <Code>&quot;next/router&quot;</Code> — different API, different
                    return shape (dynamic segments left as{" "}
                    <Code>[slug]</Code> literals instead of the resolved value).
                </p>
            </Callout>

            <DocSection title="no react equivalent — next.js only" tone="accent">
                <p>
                    Plain React has no built-in router, so no <Code>usePathname</Code>.
                    In the App Router, this hook is the standard way for a client
                    component to react to URL changes — cheaper than parsing{" "}
                    <Code>window.location</Code> yourself, and stays in sync with
                    App Router transitions (including{" "}
                    <Code>router.push</Code> and browser back/forward).
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“What does <Code>usePathname</Code> return exactly?”</>}
                    a={
                        <>
                            “The <Term>path portion</Term> of the current URL —
                            no query string, no hash. Dynamic segments come back
                            resolved (the actual value, not the{" "}
                            <Code>[slug]</Code> placeholder).”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“When would you pick <Code>useSelectedLayoutSegment</Code> instead?”</>}
                        a={
                            <>
                                “When I&apos;m building nav highlighting inside a{" "}
                                <Term>shared layout</Term> and only care about the
                                immediate child segment — not the full path.
                                <Code>usePathname</Code> gives you the whole
                                string; the segment hook is scoped to the layout
                                it&apos;s called from.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
