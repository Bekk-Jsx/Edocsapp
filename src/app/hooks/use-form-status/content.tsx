import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";

export function UseFormStatusDocs() {
    return (
        <>
            <DocSection title="refresh notes">
                <p>
                    <Term>Read the parent form&apos;s submission status.</Term>{" "}
                    <Code>useFormStatus()</Code> returns{" "}
                    <Code>{"{ pending, data, method, action }"}</Code> — the state
                    of the nearest ancestor <Code>&lt;form&gt;</Code>. Meant for
                    reusable widgets like submit buttons or busy indicators that
                    shouldn&apos;t need <Code>isPending</Code> passed as a prop.
                </p>
                <p>
                    <Term>It&apos;s a react-dom hook.</Term> Import from{" "}
                    <Code>&quot;react-dom&quot;</Code>, not <Code>&quot;react&quot;</Code>.
                    It only works in browser/DOM contexts.
                </p>
                <p>
                    <Term>Pairs naturally with useActionState.</Term> One reads
                    the reducer state and pending flag at the form level;
                    <Code>useFormStatus</Code> exposes that same pending flag to
                    any descendant that needs it, without prop-threading.
                </p>
            </DocSection>

            <Callout tone="amber" label="trap · MUST be inside the form">
                <p>
                    The hook reads the <em>nearest ancestor</em>{" "}
                    <Code>&lt;form&gt;</Code>. Calling it in the component that{" "}
                    <em>renders</em> the form (i.e. where the{" "}
                    <Code>&lt;form&gt;</Code> element is a child, not an ancestor)
                    returns the idle state forever. Move the read into a child
                    component that&apos;s rendered inside the form.
                </p>
            </Callout>

            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Same hook, and it earns its keep with Next.js Server Actions.
                    A submit button that reports <Code>pending</Code> works
                    identically whether the form&apos;s <Code>action</Code> is a
                    client function or a <Code>&quot;use server&quot;</Code>{" "}
                    server action — the component doesn&apos;t need to know. The
                    demo here uses a client-side simulated action; drop the
                    <Code>SubmitButton</Code> into any server-action form and it
                    behaves the same.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>“Why can&apos;t I call <Code>useFormStatus</Code> where I define the form?”</>}
                    a={
                        <>
                            “Because it reads the <Term>nearest ancestor</Term>{" "}
                            form. In the component that renders the{" "}
                            <Code>&lt;form&gt;</Code>, that element is a{" "}
                            <em>child</em>, not an ancestor — so there&apos;s no
                            form above the hook to read. Put the read in a child
                            component rendered inside the form.”
                        </>
                    }
                />
                <div className="mt-4">
                    <QA
                        q={<>“How does this pair with <Code>useActionState</Code>?”</>}
                        a={
                            <>
                                “<Code>useActionState</Code> owns the reducer state
                                and the pending flag at the form level;{" "}
                                <Code>useFormStatus</Code> exposes that pending flag
                                to any nested widget that needs it. Together
                                they&apos;re the standard <Term>form + submit-button</Term>{" "}
                                pattern with Server Actions.”
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
