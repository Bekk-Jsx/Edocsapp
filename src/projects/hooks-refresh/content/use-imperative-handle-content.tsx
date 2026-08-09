import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). Both flagged sections are ENTIRELY about
// one severity, so the same value is also passed as the section's explicit
// `sectionSeverity` — the two are kept in sync by intent.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The basics) ---
    // inline `note · declarative vs imperative` callout
    "imperative-vs-declarative": ["note"],

    // --- part 2 (When (and why not)) ---
    // inline `tip · try props/state first` callout
    "why-hide-the-dom-encapsulation": ["tip"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-effect, use-layout-effect
// and use-reducer define for their own part dividers.
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
// Part 1 — The basics. What the hook swaps out (the ref's value), and
// the programming style it belongs to (imperative, the exception in a
// declarative library).
// ===================================================================

const WHAT_IT_DOES = `// FancyInput.tsx (child)
"use client";
import { useRef, useImperativeHandle, type Ref } from "react";

export type FancyInputHandle = { focus: () => void; clear: () => void };

export default function FancyInput({ ref, placeholder }:
  { ref?: Ref<FancyInputHandle>; placeholder?: string }) {
  const inputRef = useRef<HTMLInputElement>(null); // real node, private

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => { if (inputRef.current) inputRef.current.value = ""; },
  }));

  return <input ref={inputRef} placeholder={placeholder} />;
}

// Form.tsx (parent)
const inputRef = useRef<FancyInputHandle>(null);

<FancyInput ref={inputRef} />;

inputRef.current?.focus();
inputRef.current?.clear();`;

const IMPERATIVE_VS_DECLARATIVE = `// declarative: describe the RESULT from state -> React updates the DOM
<Modal isOpen={open} />

// imperative: command a specific ACTION now
modalRef.current.open();`;

// ===================================================================
// Part 2 — When (and why not). You don't need the hook to pass a ref,
// so the question is always "should the parent get the raw node?" —
// and the answer is usually no, or better, "don't use a ref at all".
// ===================================================================

const FORWARD_VS_CUSTOMIZE = `// ✅ forward the ref -> parent gets the RAW DOM node (full access)
function Input({ ref }: { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} />;
}

// useImperativeHandle -> parent gets ONLY the methods you expose (no raw node)`;

const ENCAPSULATION = `// raw <video> exposed -> parent can break your component:
videoRef.current.muted = true;
videoRef.current.remove();
videoRef.current.src = "...";

// vs a controlled API that keeps YOUR state in sync:
useImperativeHandle(ref, () => ({ play, pause }));`;

export function UseImperativeHandleDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The basics</PartHeading>
            <div>
                <DocSection title="what it does">
                    <CodeBlock code={WHAT_IT_DOES} lang="tsx" />
                    <p>
                        <Term>
                            It customizes what a component&apos;s REF exposes to its
                            parent.
                        </Term>{" "}
                        Instead of the raw DOM node, the parent&apos;s ref points at a
                        custom object of methods you choose.
                    </p>
                    <p>
                        <Term>The child keeps the real node private.</Term>{" "}
                        <Code>inputRef</Code> stays inside <Code>FancyInput</Code> and is
                        never handed out. The parent holds{" "}
                        <Code>&#123; focus, clear &#125;</Code> and can call only those
                        two things.
                    </p>
                    <p>
                        <Term>
                            React 19: <Code>ref</Code> is a normal prop.
                        </Term>{" "}
                        You declare it in the props type and pass it to{" "}
                        <Code>useImperativeHandle</Code> directly — no{" "}
                        <Code>forwardRef</Code> wrapper, which is how every example
                        written before React 19 looks.
                    </p>
                </DocSection>

                <DocSection
                    title="imperative vs declarative"
                    sectionSeverity="note"
                >
                    <CodeBlock code={IMPERATIVE_VS_DECLARATIVE} lang="tsx" />
                    <p>
                        <Term>
                            DECLARATIVE — you describe WHAT the UI should be for a given
                            state.
                        </Term>{" "}
                        React does the DOM work. <Code>&lt;Modal isOpen=&#123;open&#125;
                        /&gt;</Code> says what should be true; flipping{" "}
                        <Code>open</Code> is the whole interaction. This is React&apos;s
                        normal way: props and state.
                    </p>
                    <p>
                        <Term>
                            IMPERATIVE — you command HOW, step by step, right now.
                        </Term>{" "}
                        <Code>modalRef.current.open()</Code>,{" "}
                        <Code>node.focus()</Code>, <Code>video.play()</Code>: an
                        instruction to perform an action at this moment, not a
                        description of a state.
                    </p>
                    <p>
                        <Term>Declarative is &quot;I want a coffee&quot;;</Term>{" "}
                        imperative is &quot;boil water, grind beans, pour&quot;. Both get
                        you coffee; only one leaves the method up to the kitchen.
                    </p>
                    <p>
                        <Term>
                            <Code>useImperativeHandle</Code> is the imperative escape
                            hatch.
                        </Term>{" "}
                        A parent reaching in to command a child. It is a real tool, but it
                        is the exception in a declarative library — not the default way to
                        wire two components together.
                    </p>

                    <Callout severity="note" label="note · declarative vs imperative">
                        <p>
                            React is declarative: describe UI from state and let React
                            update the DOM. <Code>useImperativeHandle</Code> is the
                            imperative exception — a parent directly commanding a child
                            (focus, play). Reach for it only when an action can&apos;t be
                            expressed as state.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">When (and why not)</PartHeading>
            <div>
                <DocSection title="forward the ref vs customize it">
                    <CodeBlock code={FORWARD_VS_CUSTOMIZE} lang="tsx" />
                    <p>
                        <Term>
                            You don&apos;t need <Code>useImperativeHandle</Code> to pass a
                            ref.
                        </Term>{" "}
                        Put the <Code>ref</Code> prop straight onto the element and the
                        parent gets the raw DOM node — <Code>focus()</Code>,{" "}
                        <Code>select()</Code>, <Code>.value</Code>, <Code>.style</Code>,
                        everything.
                    </p>
                    <p>
                        <Term>The hook exists to RESTRICT and SHAPE what it gets.</Term>{" "}
                        Expose a small <Code>&#123; focus &#125;</Code> instead of the
                        whole node.
                    </p>
                    <p>
                        <Term>The two options, side by side.</Term>{" "}
                        <Code>forward the ref</Code> → the raw node, full access.{" "}
                        <Code>useImperativeHandle</Code> → a curated API, and nothing
                        else. Same ref prop on the parent&apos;s side; entirely different
                        power on the other end of it.
                    </p>
                    <p>
                        <Term>Forwarding is the simpler default.</Term> If the parent
                        genuinely needs a DOM node — a generic <Code>Input</Code> in a
                        design system, say — hand it over. Reach for the hook when handing
                        it over is the problem.
                    </p>
                </DocSection>

                <DocSection
                    title="why hide the dom (encapsulation)"
                    sectionSeverity="tip"
                >
                    <CodeBlock code={ENCAPSULATION} lang="tsx" />
                    <p>
                        <Term>A raw node lets the parent do ANYTHING.</Term> Mute your
                        video, remove the element, swap its <Code>src</Code> — all without
                        your component knowing, so your progress bar and your
                        &quot;is playing&quot; flag now describe something that is no
                        longer true.
                    </p>
                    <p>
                        <Term>1 — Keep internal state consistent.</Term> Your{" "}
                        <Code>play()</Code> updates the DOM and the state together. A
                        parent calling <Code>node.play()</Code> updates only the DOM.
                    </p>
                    <p>
                        <Term>2 — Stay free to change internals.</Term> The exposed
                        methods are a stable contract; what is behind them is yours to
                        rewrite. Swap <Code>&lt;video&gt;</Code> for a player library and
                        no caller notices.
                    </p>
                    <p>
                        <Term>3 — Prevent misuse.</Term> Parents can only do what you
                        allow. Encapsulation: a machine with a few labelled buttons, not
                        exposed wiring.
                    </p>

                    <Callout severity="tip" label="tip · try props/state first">
                        <p>
                            Most &quot;make the child do X&quot; cases are really &quot;the
                            child should reflect state X&quot; — solve them with props
                            (declarative). Reach for <Code>useImperativeHandle</Code> only
                            for genuine imperative actions (focus, scroll, play/pause) with
                            no natural state form, and expose the minimal API.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useImperativeHandle</Code> is identical to React — nothing about
                    the App Router changes it. It is refs and DOM, so it is client-only
                    and needs <Code>&quot;use client&quot;</Code>.
                </p>
                <p>
                    The version difference matters more than the framework one: React 19
                    makes <Code>ref</Code> a normal prop, so no{" "}
                    <Code>forwardRef</Code> is needed. Older examples wrap the component;
                    yours just declares <Code>ref</Code> alongside its other props.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>what&apos;s the difference between declarative and imperative?</>}
                    a={
                        <>
                            &ldquo;Declarative{" "}
                            <Term>describes the result from state</Term> and lets React
                            update the DOM (<Code>&lt;Modal isOpen /&gt;</Code>);
                            imperative <Term>commands a specific action now</Term> (
                            <Code>ref.current.open()</Code>). React favours
                            declarative.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>why not just forward the raw DOM ref?</>}
                        a={
                            <>
                                &ldquo;That gives the parent{" "}
                                <Term>full access to the node</Term>, which can desync your
                                state and lock your internals.{" "}
                                <Code>useImperativeHandle</Code> exposes a minimal,
                                controlled API instead — encapsulation.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
