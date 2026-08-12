import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Two flags, and both fail the same quiet way — `pending` simply stays false:
// calling the hook in the form's owner instead of a child (danger, because
// nothing tells you), and the wrong import / no surrounding form (trap). The
// signature and the worked example are mechanism, not hazard.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (The rule & traps) ---
    // inline `danger · owner call reads nothing (silent)` callout
    "must-be-inside-the-form": ["danger"],
    // inline `trap · wrong import / no form` callout
    "import-scope-traps": ["trap"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-custom-store, use-effect, use-id, use-layout-effect, use-memo,
// use-optimistic, use-reducer and use-sync-external-store define for their own
// parts.
function PartHeading({
    kicker,
    children,
}: {
    kicker: string;
    children: string;
}) {
    return (
        <div className="mt-14 mb-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {kicker}
            </p>
            <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

// ===================================================================
// Part 1 — The hook. The signature is almost the whole story; the value
// only becomes visible in the full example, where the button reads the
// form's state with nothing passed down to it.
// ===================================================================

const SIGNATURE = `import { useFormStatus } from "react-dom"; // note: react-dom, not react

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "Submitting…" : "Submit"}</button>;
}`;

const FULL_EXAMPLE = `"use client";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Submitting…" : "Subscribe"}</button>;
}

async function subscribeAction(_prev, formData) {
  const email = formData.get("email");
  if (!email?.includes("@")) return { error: "Enter a valid email." };
  await new Promise(r => setTimeout(r, 1000));
  return { success: true };
}

export default function NewsletterForm() {
  const [state, formAction] = useActionState(subscribeAction, {});
  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <SubmitButton />
      {state.error && <p>{state.error}</p>}
      {state.success && <p>Subscribed ✅</p>}
    </form>
  );
}`;

// ===================================================================
// Part 2 — The rule & traps. One rule (call it from a child), and the
// two ways of breaking it. All three failures look identical from the
// outside: a button that never disables.
// ===================================================================

const INSIDE_THE_FORM = `// ❌ called in the OWNER — no <form> ABOVE this call -> pending always false
function Form() { const { pending } = useFormStatus(); return <form action={a}>...</form>; }

// ✅ called in a CHILD inside the form
function SubmitButton() { const { pending } = useFormStatus(); ... }

<form action={a}><SubmitButton /></form>`;

const IMPORT_TRAP = `import { useFormStatus } from "react-dom"; // ✅  (from "react" ❌ fails)`;

export function UseFormStatusDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The hook</PartHeading>
            <div>
                <DocSection title="what it is">
                    <CodeBlock code={SIGNATURE} lang="tsx" />
                    <p>
                        <Term>
                            It reads the submission status of the PARENT{" "}
                            <Code>&lt;form&gt;</Code>.
                        </Term>{" "}
                        Mainly <Code>pending</Code> — is it submitting? — plus{" "}
                        <Code>data</Code> (the <Code>FormData</Code>),{" "}
                        <Code>method</Code> and <Code>action</Code>.
                    </p>
                    <p>
                        <Term>So a child can reflect the form&apos;s state itself.</Term>{" "}
                        A submit button knows whether the form is submitting without the
                        parent passing <Code>isPending</Code> down to it.
                    </p>
                    <p>
                        <Term>
                            The import is <Code>react-dom</Code>.
                        </Term>{" "}
                        Not <Code>react</Code>. And it&apos;s client-only, so the component
                        calling it needs <Code>&quot;use client&quot;</Code>.
                    </p>
                </DocSection>

                <DocSection title="full example">
                    <CodeBlock code={FULL_EXAMPLE} lang="tsx" />
                    <p>
                        <Term>Trace one submit.</Term>{" "}
                        The user submits → the action runs →{" "}
                        <Code>useFormStatus().pending</Code> flips true inside{" "}
                        <Code>SubmitButton</Code> → the button shows{" "}
                        <Code>Submitting…</Code> and disables itself, with no prop passed →
                        the action finishes → <Code>pending</Code> is false again.
                    </p>
                    <p>
                        <Term>
                            The payoff over <Code>useActionState</Code>.
                        </Term>{" "}
                        That hook&apos;s <Code>isPending</Code> lives in the form OWNER, so
                        reaching the button means prop-drilling it down.{" "}
                        <Code>useFormStatus</Code> lets the CHILD read{" "}
                        <Code>pending</Code> for itself.
                    </p>
                    <p>
                        <Term>Which makes the button reusable.</Term> Drop{" "}
                        <Code>&lt;SubmitButton /&gt;</Code>{" "}
                        into ANY form and it auto-disables during that form&apos;s
                        submission — zero wiring, no
                        props, nothing for the parent to remember.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">The rule &amp; traps</PartHeading>
            <div>
                <DocSection title="must be inside the form" sectionSeverity="danger">
                    <CodeBlock code={INSIDE_THE_FORM} lang="tsx" />
                    <p>
                        <Term>The hook walks UP to the nearest parent form.</Term> So it
                        has to be called from a component rendered INSIDE the form — that
                        is the whole rule, and everything else follows from it.
                    </p>
                    <p>
                        <Term>In the owner there is no form above the call.</Term> The{" "}
                        <Code>&lt;form&gt;</Code> is BELOW it, in the returned JSX. Nothing
                        is found, so <Code>pending</Code> stays false.
                    </p>
                    <p>
                        <Term>And it fails SILENTLY.</Term> No error, no warning — the
                        button just never disables. Which is exactly why this one is easy
                        to miss: the code looks right and the hook looks broken.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · owner call reads nothing (silent)"
                    >
                        <p>
                            <Code>useFormStatus</Code>{" "}
                            reads the nearest PARENT form. Call it in the form&apos;s owner
                            and it finds no form above it —{" "}
                            <Code>pending</Code> stays false forever, with no error. Put it in
                            a child rendered inside <Code>&lt;form&gt;</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="import & scope traps" sectionSeverity="trap">
                    <CodeBlock code={IMPORT_TRAP} lang="tsx" />
                    <p>
                        <Term>
                            Import from <Code>react-dom</Code>, not <Code>react</Code>.
                        </Term>{" "}
                        Importing it from <Code>react</Code> fails — the hook lives in the
                        DOM package, alongside the other form primitives.
                    </p>
                    <p>
                        <Term>And it only reports a real native form submission.</Term> With
                        no <Code>&lt;form&gt;</Code> around it, <Code>pending</Code> is
                        always false. It is built for native submits, which is why it pairs
                        so naturally with Server Actions and{" "}
                        <Code>useActionState</Code>.
                    </p>
                    <p>
                        <Term>
                            <Code>pending</Code> is the one you use.
                        </Term>{" "}
                        The hook also returns <Code>data</Code>, <Code>method</Code> and{" "}
                        <Code>action</Code>, but roughly 95% of real usage is the pending
                        flag.
                    </p>

                    <Callout severity="trap" label="trap · wrong import / no form">
                        <p>
                            Import <Code>useFormStatus</Code> from <Code>react-dom</Code>{" "}
                            (not <Code>react</Code>). It only works for a real{" "}
                            <Code>&lt;form&gt;</Code> submission — outside a form,{" "}
                            <Code>pending</Code> is always false.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useFormStatus</Code> comes from <Code>react-dom</Code> and is
                    client-only — the component calling it needs{" "}
                    <Code>&quot;use client&quot;</Code>. It is designed for shared form
                    controls that reflect submission state.
                </p>
                <p>
                    That pays off most with Server Actions: a reusable{" "}
                    <Code>&lt;SubmitButton /&gt;</Code> auto-disables during any
                    server-action submit, in any form, with no prop wiring at the call
                    site.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            why is <Code>pending</Code> always false?
                        </>
                    }
                    a={
                        <>
                            &ldquo;<Code>useFormStatus</Code>{" "}
                            reads the nearest PARENT form, so it must be in a component
                            rendered <Term>inside</Term> <Code>&lt;form&gt;</Code>{" "}
                            — not the one that owns the form.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                <Code>useFormStatus</Code> vs{" "}
                                <Code>useActionState</Code> pending?
                            </>
                        }
                        a={
                            <>
                                &ldquo;<Code>useActionState</Code>&apos;s{" "}
                                <Code>isPending</Code> is in the form{" "}
                                <Term>owner</Term>;{" "}
                                <Code>useFormStatus</Code>&apos;s <Code>pending</Code> is
                                for a <Term>child</Term>{" "}
                                inside the form — a reusable submit button.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
