import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseInsertionEffectDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Built for CSS-in-JS libraries, not app code.</Term>{" "}
                    <Code>useInsertionEffect</Code> exists so libraries like styled-
                    components, Emotion, and vanilla-extract can inject a{" "}
                    <Code>&lt;style&gt;</Code> tag <em>before</em> React reads
                    layout. In application code you almost never call it directly
                    — you consume a library that does.
                </p>
                <p>
                    <Term>Runs before useLayoutEffect.</Term> The commit order is:{" "}
                    <Code>useInsertionEffect</Code> → DOM mutations →{" "}
                    <Code>useLayoutEffect</Code> → paint →{" "}
                    <Code>useEffect</Code>. Because rules land first, any measurement
                    a <Code>useLayoutEffect</Code> takes reflects the final styles,
                    not the pre-injection layout.
                </p>
                <p>
                    <Term>Refs aren&apos;t attached yet.</Term> At the time this
                    effect fires, React hasn&apos;t written refs to the tree. Don&apos;t
                    read <Code>ref.current</Code>, don&apos;t measure the DOM,
                    don&apos;t call <Code>setState</Code>. Do one thing: append or
                    remove a stylesheet.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · what you cannot do">
                <p>
                    No <Code>setState</Code>, no reading layout, no ref access. React
                    enforces this because the whole hook is a special pre-commit
                    window reserved for style insertion — anything else desyncs the
                    commit phases it&apos;s meant to sit before.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same API. The Next.js relevance is CSS-in-JS on the server: App
                    Router SSR means style libraries have to collect rules on the
                    server and stream them into the initial HTML, then reconcile
                    with <Code>useInsertionEffect</Code> on the client. If you use{" "}
                    <Code>styled-components</Code> or Emotion with the App Router,
                    follow their Next.js setup guide — a plain client-side install
                    will FOUC on hydration. Tailwind and CSS Modules sidestep the
                    hook entirely because their styles are static.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“When would you use <Code>useInsertionEffect</Code>?”</>}
                    a={
                        <>
                            “Almost never in app code — it&apos;s <Term>built for
                                CSS-in-JS libraries</Term> to inject a style tag before
                            React measures the DOM. If I&apos;m writing a component,
                            I&apos;d reach for a stylesheet, a CSS module, or Tailwind
                            instead.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“Why can&apos;t you call <Code>setState</Code> inside it?”</>}
                        a={
                            <>
                                “Because it runs <Term>before refs are attached and before
                                    layout effects</Term>. React reserves that window for
                                inserting styles only; touching state or the DOM there
                                would break the ordering it guarantees to the next
                                phase.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
