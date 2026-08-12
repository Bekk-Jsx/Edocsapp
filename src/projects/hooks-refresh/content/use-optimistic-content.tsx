import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Two flags, two different failure modes: calling addOptimistic with no action
// context (it simply doesn't work), and rendering the real state instead of the
// optimistic one (no instant UI at all). The idea, the worked example and the
// auto-rollback are mechanism, not hazard.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (Failure & rules) ---
    // inline `danger · needs an action context` callout
    "must-run-inside-an-action": ["danger"],
    // inline `trap · render the optimistic layer` callout
    "render-the-optimistic-state": ["trap"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-custom-store, use-effect, use-id, use-layout-effect, use-memo,
// use-reducer and use-sync-external-store define for their own parts.
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
// Part 1 — The idea. The signature, then one complete list, then the
// comparison that explains why the hook is worth reaching for at all.
// ===================================================================

const SIGNATURE = `const [optimisticState, addOptimistic] = useOptimistic(actualState, updateFn);`;

const FULL_EXAMPLE = `"use client";
import { useOptimistic, useState } from "react";

const [messages, setMessages] = useState<string[]>(["Hi!"]);

const [optimisticMessages, addOptimistic] = useOptimistic(
  messages,
  (current, newMsg: string) => [...current, \`\${newMsg} (sending…)\`]
);

async function send(formData: FormData) {
  const text = formData.get("text") as string;
  addOptimistic(text);                           // 1. instant
  await new Promise(r => setTimeout(r, 1000));   // 2. real save
  setMessages(prev => [...prev, text]);          // 3. commit real state
}

// <form action={send}> input + button + {optimisticMessages.map(...)}`;

const MANUAL = `// manual: setMessages(add temp) ; on success mark confirmed ;
//         on FAILURE filter it out (catch)`;

// ===================================================================
// Part 2 — Failure & rules. What happens when the action fails (the
// selling point), then the two ways of holding the hook wrong.
// ===================================================================

const FAILURE = `async function send(formData) {
  addOptimistic(text);
  await save(text);                     // if this THROWS -> actualState unchanged
  setMessages(prev => [...prev, text]); // only runs on success
}`;

const ACTION_CONTEXT = `// form: the submission IS the action
<form action={send}>...</form>   // addOptimistic inside send() ✅

// no form: wrap in startTransition
startTransition(async () => { addOptimisticLike(1); await save(); setLikes(x => x + 1); });`;

const RENDER_WHICH = `{messages.map(...)}            // ❌ real state -> no optimistic UI
{optimisticMessages.map(...)}  // ✅ the optimistic layer`;

export function UseOptimisticDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The idea</PartHeading>
            <div>
                <DocSection title="instant ui before the server responds">
                    <CodeBlock code={SIGNATURE} lang="tsx" />
                    <p>
                        <Term>
                            It shows an &ldquo;assume it worked&rdquo; UI immediately.
                        </Term>{" "}
                        While the async action is still pending the user already sees the
                        result; when the real state lands, React reconciles to it.
                    </p>
                    <p>
                        <Term>Two arguments.</Term> <Code>actualState</Code> is the real,
                        confirmed state.{" "}
                        <Code>updateFn(current, optimisticValue)</Code> returns the merged
                        state to show while the action runs — the temporary view.
                    </p>
                    <p>
                        <Term>Two things come back.</Term> <Code>optimisticState</Code> is
                        what you RENDER, and <Code>addOptimistic(value)</Code> adds an
                        optimistic update. The whole flow: click → see the result instantly
                        → the real result confirms in the background.
                    </p>
                </DocSection>

                <DocSection title="full example">
                    <CodeBlock code={FULL_EXAMPLE} lang="tsx" />
                    <p>
                        <Term>Trace it.</Term> <Code>addOptimistic(text)</Code> shows{" "}
                        <Code>text (sending…)</Code> instantly. A second later the real
                        save finishes and <Code>setMessages</Code> updates{" "}
                        <Code>actualState</Code> — React then DROPS the optimistic layer,
                        and the row that remains is the real item, without the{" "}
                        <Code>(sending…)</Code> suffix.
                    </p>
                    <p>
                        <Term>Two layers, and you render the second.</Term>{" "}
                        <Code>messages</Code> holds confirmed items only;{" "}
                        <Code>optimisticMessages</Code> is <Code>messages</Code> plus the
                        pending ones, as computed by <Code>updateFn</Code>. The real list
                        never contains a half-saved entry.
                    </p>
                    <p>
                        <Term>You never remove the optimistic entry.</Term> There is no
                        cleanup step in that action — the layer exists for exactly as long
                        as the action does, and React discards it for you.
                    </p>
                </DocSection>

                <DocSection title="why not just useState">
                    <CodeBlock code={MANUAL} lang="tsx" />
                    <p>
                        <Term>You CAN do this with <Code>useState</Code>.</Term>{" "}
                        Push a temporary item, mark it confirmed on success, and filter it
                        back out in a <Code>catch</Code>. It works.
                    </p>
                    <p>
                        <Term>But you own three fragile things.</Term> The rollback (remove
                        the temp on failure), one array holding confirmed and pending items
                        mixed together, and concurrent actions — two sends in flight, each
                        needing to remove the right entry.
                    </p>
                    <p>
                        <Term>The hook removes all three.</Term> It auto-discards the
                        optimistic layer when <Code>actualState</Code> updates, keeps real
                        and pending SEPARATE, and handles multiple in-flight actions. For a
                        trivial action that never fails the difference is small; for real
                        mutations that can fail, it deletes the bug-prone part.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Failure &amp; rules</PartHeading>
            <div>
                <DocSection title="failure auto-rolls-back">
                    <CodeBlock code={FAILURE} lang="tsx" />
                    <p>
                        <Term>
                            The optimistic value exists only while the action runs.
                        </Term>{" "}
                        That is the entire mechanism. It is not stored anywhere; it is a
                        view layered on top of <Code>actualState</Code> for the lifetime of
                        one pending action.
                    </p>
                    <p>
                        <Term>So failure rolls back by itself.</Term> If{" "}
                        <Code>save</Code> throws, the line after it never runs,{" "}
                        <Code>actualState</Code> never updates, and when the action ends
                        the layer is discarded — the item disappears on its own. ZERO
                        rollback code.
                    </p>
                    <p>
                        <Term>You still catch the error.</Term> Wrap it to show a message,
                        keep the input filled, offer a retry. What you never write is the
                        code that removes the optimistic item.
                    </p>
                </DocSection>

                <DocSection title="must run inside an action" sectionSeverity="danger">
                    <CodeBlock code={ACTION_CONTEXT} lang="tsx" />
                    <p>
                        <Term>
                            <Code>addOptimistic</Code> only works inside an action context.
                        </Term>{" "}
                        A <Code>&lt;form action&gt;</Code>, or{" "}
                        <Code>startTransition(async () =&gt; {"{...}"})</Code>. With a form
                        the submission IS the action, so calling it inside the handler is
                        enough.
                    </p>
                    <p>
                        <Term>Because the value needs a lifetime to attach to.</Term> React
                        keeps the optimistic layer for as long as the pending action lasts
                        — no action, nothing to tie it to, nothing to tell React when to
                        discard it.
                    </p>
                    <p>
                        <Term>A plain event handler is not enough.</Term>{" "}
                        No form, no transition, and the call won&apos;t behave correctly.
                        For a button
                        outside a form, wrap the whole async body in{" "}
                        <Code>startTransition</Code> — as in the second fragment.
                    </p>

                    <Callout severity="danger" label="danger · needs an action context">
                        <p>
                            <Code>addOptimistic</Code> must run inside a{" "}
                            <Code>&lt;form action&gt;</Code> or{" "}
                            <Code>startTransition</Code>. In a plain handler with no action,
                            React has no pending action to tie the optimistic value to — it
                            won&apos;t work.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection
                    title="render the optimistic state"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={RENDER_WHICH} lang="tsx" />
                    <p>
                        <Term>Render <Code>optimisticState</Code>, not{" "}
                        <Code>actualState</Code>.</Term>{" "}
                        Mapping the real state is a silent no-op: the hook works, the
                        action runs, and the user sees nothing instant — because the list
                        being drawn is the one without the pending item.
                    </p>
                    <p>
                        <Term>
                            And <Code>actualState</Code> MUST update on success.
                        </Term>{" "}
                        The layer is dropped when the action ends regardless. If the
                        success path never commits the real value, the optimistic item
                        flashes and then vanishes with nothing replacing it.
                    </p>

                    <Callout severity="trap" label="trap · render the optimistic layer">
                        <p>
                            Render the optimistic value, not the real state, or you see no
                            instant UI. And make sure the success path updates{" "}
                            <Code>actualState</Code>, or the optimistic item flashes then
                            disappears.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useOptimistic</Code> is React 19 and client-only — the component
                    calling it needs <Code>&quot;use client&quot;</Code>. It shines with
                    Server Actions: show the mutation instantly, let the server action
                    confirm it, and on failure let the layer roll back on its own.
                </p>
                <p>
                    Nothing about the hook changes between plain React and Next. What
                    changes is what the <Code>await</Code> in the middle of your action is
                    — a <Code>setTimeout</Code> here, a{" "}
                    <Code>&quot;use server&quot;</Code> function there.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>what happens if the action fails?</>}
                    a={
                        <>
                            &ldquo;<Code>actualState</Code> never updates, so the optimistic
                            layer is <Term>discarded automatically</Term>{" "}
                            — the item rolls back with no manual removal.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                why not just <Code>useState</Code>?
                            </>
                        }
                        a={
                            <>
                                &ldquo;You&apos;d hand-write rollback, mix real and pending
                                state in one place, and manage concurrency yourself.{" "}
                                <Code>useOptimistic</Code> separates the layers and{" "}
                                <Term>auto-reconciles</Term>.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
