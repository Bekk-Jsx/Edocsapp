import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Three flags: the hook is reached for as a data loader and never fires (trap),
// the action can run on the server (a framework difference), and the native
// form action keeps working before JS loads (tip). The signature, the worked
// example and the reducer comparison are mechanism, not hazard.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The hook) ---
    // inline `trap · not for fetching on load` callout
    "it-s-for-submits-not-fetches": ["trap"],
    // --- part 2 (Server Actions) ---
    // inline `react ⇄ next · server actions` callout
    "server-actions": ["next"],
    // inline `tip · works without JS` callout
    "progressive-enhancement": ["tip"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-custom-store, use-effect,
// use-id, use-layout-effect, use-memo, use-reducer and use-sync-external-store
// define for their own parts.
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
// Part 1 — The hook. The signature first, then one complete form, then
// the two things the shape invites you to get wrong: reaching for it
// as a data loader, and reading it as "just useReducer".
// ===================================================================

const SIGNATURE = `const [state, formAction, isPending] = useActionState(action, initialState);
// action: (prevState, formData) => newState`;

const FULL_FORM = `"use client";
import { useActionState } from "react";

type FormState = { error?: string; success?: boolean };

async function subscribeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string;
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };
  await new Promise(r => setTimeout(r, 800)); // simulate API
  return { success: true };
}

export default function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(subscribeAction, {});
  return (
    <form action={formAction}>
      <input name="email" type="email" />
      <button disabled={isPending}>{isPending ? "Submitting…" : "Subscribe"}</button>
      {state.error && <p>{state.error}</p>}
      {state.success && <p>Subscribed ✅</p>}
    </form>
  );
}`;

const NOT_A_FETCH = `// ❌ does NOT fetch on load — the action never runs until triggered
const [users, fetchAction] = useActionState(getUsersAction, []);`;

const REDUCER_SHAPE = `// useReducer:      (state, action) => newState ; dispatch(action)
// useActionState:  (prevState, formData) => newState ; submit the form`;

// ===================================================================
// Part 2 — Server Actions. The pairing the hook was designed for, and
// the property that pairing buys for free.
// ===================================================================

const SERVER_ACTION = `// actions.ts
"use server";

export async function subscribe(prevState, formData) {
  const email = formData.get("email");
  if (!email?.includes("@")) return { error: "Invalid email." };
  await db.subscribers.create({ email }); // runs on the SERVER
  return { success: true };
}

// form (client)
const [state, formAction, isPending] = useActionState(subscribe, {});`;

const PROGRESSIVE = `<form action={formAction}> {/* native action + server action -> works before JS loads */}`;

export function UseActionStateDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The hook</PartHeading>
            <div>
                <DocSection title="what it is">
                    <CodeBlock code={SIGNATURE} lang="tsx" />
                    <p>
                        <Term>
                            useActionState manages the form state produced by an ACTION.
                        </Term>{" "}
                        You give it a function and a starting value; it gives you back the
                        latest result, something to hand the form, and a pending flag.
                    </p>
                    <p>
                        <Term>The action is (previousState, formData) =&gt; newState.</Term>{" "}
                        It does the work — validate, mutate, save — and returns the new
                        state. <Code>initialState</Code> is what <Code>state</Code> holds
                        before the first run.
                    </p>
                    <p>
                        <Term>Three things come back.</Term> <Code>state</Code> is whatever
                        the action returned last; <Code>formAction</Code> goes straight
                        into <Code>&lt;form action={"{formAction}"}&gt;</Code>; and{" "}
                        <Code>isPending</Code> is <Code>true</Code>{" "}
                        while the action runs. The &quot;dispatch&quot; here is the form
                        submission.
                    </p>
                </DocSection>

                <DocSection title="full form example">
                    <CodeBlock code={FULL_FORM} lang="tsx" />
                    <p>
                        <Term>Trace one submit.</Term>{" "}
                        The user submits → React calls the action with the previous state
                        and the form&apos;s{" "}
                        <Code>FormData</Code> → <Code>isPending</Code> flips true → the
                        action returns <Code>{"{ error }"}</Code> or{" "}
                        <Code>{"{ success: true }"}</Code> → that becomes{" "}
                        <Code>state</Code> and the messages update →{" "}
                        <Code>isPending</Code> goes back to false.
                    </p>
                    <p>
                        <Term>
                            No <Code>useState</Code> for error, success or loading.
                        </Term>{" "}
                        All three come out of the hook: the first two live in the returned
                        state, the third is <Code>isPending</Code>. Nothing to keep in sync
                        by hand.
                    </p>
                    <p>
                        <Term>FormData, not controlled inputs.</Term> The input has a{" "}
                        <Code>name</Code> and no <Code>value</Code> — the form is
                        uncontrolled and the action reads{" "}
                        <Code>formData.get(&quot;email&quot;)</Code> at submit time. No
                        keystroke re-renders, no state per field.
                    </p>
                </DocSection>

                <DocSection
                    title="it's for submits, not fetches"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={NOT_A_FETCH} lang="tsx" />
                    <p>
                        <Term>The action only runs when TRIGGERED.</Term> A form submit, or
                        calling the returned action yourself. It does not run on mount, so
                        the code above renders an empty list forever and never touches the
                        server.
                    </p>
                    <p>
                        <Term>So it is for submits and mutations</Term> — save, delete,
                        subscribe — not for reading data on load. To get all users: fetch
                        in a Server Component (<Code>await</Code>), or{" "}
                        <Code>use()</Code> with Suspense, or a data library.
                    </p>
                    <p>
                        <Term>
                            Forcing it with a <Code>useEffect</Code> abuses the hook.
                        </Term>{" "}
                        Firing the action on mount to load data throws away every reason it
                        exists — forms, <Code>FormData</Code>, Server Actions, progressive
                        enhancement — and leaves you with a worse{" "}
                        <Code>useState</Code>.
                    </p>

                    <Callout severity="trap" label="trap · not for fetching on load">
                        <p>
                            <Code>useActionState</Code> is triggered by an action
                            (submit/click), never on mount. Use it for mutations, not for
                            loading data — fetch reads in a Server Component,{" "}
                            <Code>use()</Code>, or a data library instead.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="reducer connection">
                    <CodeBlock code={REDUCER_SHAPE} lang="tsx" />
                    <p>
                        <Term>It is reducer-shaped.</Term>{" "}
                        <Code>(prevState, input) =&gt; newState</Code>, same as{" "}
                        <Code>useReducer</Code>. Three things differ: the input is{" "}
                        <Code>FormData</Code> (or your own argument), the dispatch is the
                        form submission, and the function can be <Term>async</Term> — a
                        reducer cannot.
                    </p>
                    <p>
                        <Term>An async reducer whose dispatch is a submit.</Term> That is
                        the whole idea. And because React runs the action as a transition,
                        it flips <Code>isPending</Code> for you while it is in flight —
                        automatic loading state, no manual <Code>useState</Code>.
                    </p>
                    <p>
                        <Term>The returned action can be called directly</Term> —{" "}
                        <Code>onClick={"{() => action(arg)}"}</Code> — for non-form cases.
                        But the hook is built for forms; outside one,{" "}
                        <Code>useReducer</Code> or <Code>useState</Code> +{" "}
                        <Code>useTransition</Code> usually fit better.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Server Actions (Next.js)</PartHeading>
            <div>
                <DocSection title="server actions" sectionSeverity="next">
                    <CodeBlock code={SERVER_ACTION} lang="tsx" />
                    <p>
                        <Term>The action can be a SERVER ACTION.</Term> A function marked{" "}
                        <Code>&quot;use server&quot;</Code> runs on the server. On submit,
                        React sends the <Code>FormData</Code> over, runs the function
                        there, and returns the result.
                    </p>
                    <p>
                        <Term>No API route, no fetch.</Term> You call a server function
                        directly from a form. The database write and the secrets it needs
                        stay server-side — none of it ships to the browser.
                    </p>
                    <p>
                        <Term>The client half does not change.</Term>{" "}
                        <Code>useActionState</Code> tracks the returned state and{" "}
                        <Code>isPending</Code> exactly as before. This pairing is the whole
                        reason the hook exists.
                    </p>

                    <Callout severity="next" label="react ⇄ next · server actions">
                        <p>
                            Mark the action <Code>&quot;use server&quot;</Code> and it runs
                            on the server, called straight from the form — no API route.{" "}
                            <Code>useActionState</Code> tracks its result and pending on the
                            client.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="progressive enhancement" sectionSeverity="tip">
                    <CodeBlock code={PROGRESSIVE} lang="tsx" />
                    <p>
                        <Term>
                            The form uses the native <Code>action</Code> attribute.
                        </Term>{" "}
                        Pointed at a Server Action, that means it works before — and
                        without — JavaScript: the browser does a plain HTML form POST to
                        the server action, and the submit still goes through.
                    </p>
                    <p>
                        <Term>Once JS is ready, React enhances it.</Term> The submit is
                        handled on the client instead: no full page reload, and{" "}
                        <Code>isPending</Code> starts reporting. Same markup, better
                        experience.
                    </p>
                    <p>
                        <Term>Old client-only forms have no such floor.</Term> An{" "}
                        <Code>onSubmit</Code> handler needs the bundle to exist before the
                        button does anything. This degrades gracefully instead.
                    </p>

                    <Callout severity="tip" label="tip · works without JS">
                        <p>
                            With a native{" "}
                            <Code>&lt;form action={"{formAction}"}&gt;</Code> + Server
                            Action, submission works before JS loads (plain HTML POST), then
                            React enhances it. Progressive enhancement for free.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useActionState</Code> is React 19 and works in plain React, but
                    its reason for existing is the pairing with Server Actions in Next:
                    call a <Code>&quot;use server&quot;</Code> function straight from a
                    form, no API route, with progressive enhancement thrown in.
                </p>
                <p>
                    In the App Router, prefer this for mutations — and fetch your reads in
                    Server Components instead, where <Code>await</Code> needs no hook at
                    all.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            what triggers the action in <Code>useActionState</Code>?
                        </>
                    }
                    a={
                        <>
                            &ldquo;A <Term>form submission</Term>{" "}
                            — or calling the returned action. It never runs on mount, so
                            it&apos;s for submits and mutations, not for fetching on
                            load.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                how does it relate to <Code>useReducer</Code>?
                            </>
                        }
                        a={
                            <>
                                &ldquo;Same{" "}
                                <Code>(prevState, input) =&gt; newState</Code> shape, but the
                                input is <Code>FormData</Code>, the dispatch is the form
                                submit, and the action can be <Term>async</Term>.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
