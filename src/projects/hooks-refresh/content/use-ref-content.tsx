import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header — that is
// the explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic
// is one severity. No section on this page is.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The mutable box) ---
    // inline `trap · refs in render` callout — purity, and stale reads
    "don-t-touch-during-render": ["trap"],

    // --- part 2 (DOM refs) ---
    // inline `trap · null during render` plus `react ⇄ next · client only`
    "attaching-timing": ["trap", "next"],
    // inline `note · forwardRef is legacy` callout
    "passing-a-ref-to-your-component-react-19": ["note"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-context, use-effect and use-reducer define for
// their own part dividers.
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
// Part 1 — The mutable box. What the hook actually returns, how it
// differs from state, and the one rule that makes refs go wrong.
// ===================================================================

const WHAT_IT_IS = `import { useRef } from "react";

const ref = useRef(0);   // -> { current: 0 }
//                 ^^^
//                 the INITIAL .current, read on mount and never again

ref.current++;           // change it freely — NO re-render`;

const REF_VS_STATE = `const [count, setCount] = useState(0);   // change -> re-render
const ref = useRef(0);                   // change -> NO re-render

setCount(count + 1);   // schedules a render; the screen updates
ref.current += 1;      // silent; the screen keeps whatever it last drew`;

const IN_RENDER = `function C() {
  const ref = useRef(0);

  ref.current++;            // wrong: writing during render (impure)
  const x = ref.current;    // wrong: reading during render (unreliable)

  return <p>{x}</p>;
}`;

// ===================================================================
// Part 2 — DOM refs. The second job: a handle on a real node, which
// only exists after React commits, and how that handle reaches a
// component you wrote yourself.
// ===================================================================

const ATTACHING = `import { useEffect, useRef } from "react";

function Field() {
  const inputRef = useRef<HTMLInputElement>(null);
  //                      ^^^^^^^^^^^^^^^^  ^^^^
  //                      the node type     initial .current — no node yet

  console.log(inputRef.current);   // null during render

  useEffect(() => {
    inputRef.current?.focus();     // set by now: the node is in the DOM
  }, []);

  return <input ref={inputRef} />;   // React fills .current after commit
}`;

const REF_AS_PROP = `// React 18 — forwardRef required, ref arrives as a SECOND argument
import { forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, Props>(function Input(props, ref) {
  return <input ref={ref} placeholder={props.placeholder} />;
});

// React 19 — ref is a normal prop, destructured like any other
import type { Ref } from "react";

function Input({ placeholder, ref }: { placeholder?: string; ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} placeholder={placeholder} />;
}

// Parent — IDENTICAL in both versions
const inputRef = useRef<HTMLInputElement>(null);

<Input ref={inputRef} placeholder="type here" />;
inputRef.current?.focus();   // reaches the <input> inside Input`;

export function UseRefDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The mutable box</PartHeading>
            <div>
                <DocSection title="what it is">
                    <CodeBlock code={WHAT_IT_IS} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useRef</Code> returns a mutable box:{" "}
                            <Code>{"{ current }"}</Code>.
                        </Term>{" "}
                        React hands you the SAME object on every render, and you own
                        what is inside it. There is no setter — you assign to{" "}
                        <Code>.current</Code> directly.
                    </p>
                    <p>
                        <Term>Changing <Code>.current</Code> NEVER re-renders.</Term>{" "}
                        React does not watch the box. The value persists across
                        renders exactly like state, but nothing reacts to it — that
                        difference is the entire hook.
                    </p>
                    <p>
                        <Term>The argument is the initial <Code>.current</Code>.</Term>{" "}
                        <Code>useRef(0)</Code> creates the box with{" "}
                        <Code>current = 0</Code> on mount and ignores the argument on
                        every render after, the same mount-only rule as{" "}
                        <Code>useState</Code>.
                    </p>
                    <p>
                        <Term>Two jobs.</Term> (1) Stash a value that must survive
                        renders without causing updates — a render counter, a previous
                        value, a <Code>setTimeout</Code> id you need to clear later.
                        (2) Hold a DOM node, which is part 2.
                    </p>
                </DocSection>

                <DocSection title="ref vs state">
                    <CodeBlock code={REF_VS_STATE} lang="tsx" />
                    <p>
                        <Term>The question is whether the UI must REACT.</Term> Change
                        state and React re-renders; change a ref and nothing happens.
                        Both survive renders — only one is wired to the screen.
                    </p>
                    <p>
                        <Term>
                            Ref = remember. State = react.
                        </Term>{" "}
                        A timer id, the last scroll position, whether a one-off has
                        already fired: remembered, never rendered — that is a ref. A
                        value the output reads is state, and putting it in a ref means
                        the screen silently shows an old value.
                    </p>
                    <p>
                        <Term>Refs also skip the queue entirely.</Term>{" "}
                        <Code>ref.current</Code> updates SYNCHRONOUSLY — the next line
                        already sees the new value, where <Code>setState</Code>{" "}
                        schedules a render and the variable stays put until then. That
                        immediacy is why refs suit values read back inside the same
                        handler.
                    </p>
                </DocSection>

                <DocSection title="don't touch during render">
                    <CodeBlock code={IN_RENDER} lang="tsx" />
                    <p>
                        <Term>Rendering must be PURE.</Term> Same props and state in,
                        same JSX out, no side effects. Writing to{" "}
                        <Code>.current</Code> in the component body is a side effect:
                        the output starts depending on how many times React chose to
                        render.
                    </p>
                    <p>
                        <Term>Reading during render is unreliable.</Term> For a DOM ref
                        the answer is <Code>null</Code> — the node does not exist yet.
                        For a value ref it is whatever the last commit happened to
                        leave, which is not something the render can reason about.
                    </p>
                    <p>
                        <Term>Strict Mode makes it visible.</Term> React double-invokes
                        components in development, so a counter incremented in the body
                        climbs by two and the bug surfaces on your machine rather than
                        in production.
                    </p>
                    <p>
                        <Term>Touch refs in EFFECTS and EVENT HANDLERS.</Term> Both run
                        after render, when the node exists and the extra work costs
                        nothing in purity. The narrow exception is lazily filling a
                        still-empty box —{" "}
                        <Code>if (!ref.current) ref.current = expensive()</Code> — which
                        is idempotent, so a second render pass changes nothing.
                    </p>

                    <Callout severity="trap" label="trap · refs in render">
                        <p>
                            Reading or writing <Code>ref.current</Code> during render
                            breaks purity and can read stale values. Do it in effects
                            or event handlers — after render, not during it.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">DOM refs</PartHeading>
            <div>
                <DocSection title="attaching + timing">
                    <CodeBlock code={ATTACHING} lang="tsx" />
                    <p>
                        <Term>
                            Attach with the <Code>ref</Code> attribute.
                        </Term>{" "}
                        Pass the box to a host element and React fills{" "}
                        <Code>.current</Code> with the real DOM node — the same object
                        you would get from <Code>document.querySelector</Code>, with no
                        query to write and no chance of matching the wrong element.
                    </p>
                    <p>
                        <Term>The lifecycle is render → commit → effect.</Term> During
                        render <Code>.current</Code> is <Code>null</Code>, because the
                        node does not exist yet. React creates it, commits it to the
                        DOM, and sets <Code>.current</Code>. Only then do effects run —
                        so by the time your effect body executes, the node is there.
                    </p>
                    <p>
                        <Term>
                            Which is why DOM work goes in an effect.
                        </Term>{" "}
                        <Code>focus()</Code>, <Code>scrollIntoView()</Code>,{" "}
                        <Code>getBoundingClientRect()</Code> — all of it needs a real
                        node. In the render body they would throw or silently no-op on{" "}
                        <Code>null</Code>.
                    </p>
                    <p>
                        <Term>On unmount React sets <Code>.current</Code> back to null.</Term>{" "}
                        The box outlives the node, so a cleanup or a late callback that
                        still holds the ref reads <Code>null</Code> rather than a
                        detached element — one more reason for the{" "}
                        <Code>?.</Code> in <Code>inputRef.current?.focus()</Code>.
                    </p>

                    <Callout severity="trap" label="trap · null during render">
                        <p>
                            A DOM ref is <Code>null</Code> during render — the node
                            isn&apos;t created yet. Read it in an effect (after
                            commit), never in the render body.
                        </p>
                    </Callout>

                    <Callout severity="next" label="react ⇄ next · client only">
                        <p>
                            The DOM doesn&apos;t exist on the server, so a component
                            using a DOM ref must be{" "}
                            <Code>&quot;use client&quot;</Code>, and the ref stays{" "}
                            <Code>null</Code> through SSR until hydration. Don&apos;t
                            rely on a measured ref value for server-rendered output.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="passing a ref to your component (React 19)">
                    <CodeBlock code={REF_AS_PROP} lang="tsx" />
                    <p>
                        <Term>
                            <Code>ref</Code> is not an ordinary prop in React 18.
                        </Term>{" "}
                        React intercepts it, so a function component never sees it in{" "}
                        <Code>props</Code>. <Code>forwardRef</Code> was the opt-in that
                        handed it over — hence the unusual two-argument signature,{" "}
                        <Code>(props, ref)</Code>.
                    </p>
                    <p>
                        <Term>React 19 makes it a normal prop.</Term> Drop the wrapper,
                        destructure <Code>ref</Code> alongside everything else, and
                        attach it. One less concept, and the component reads like every
                        other component you write.
                    </p>
                    <p>
                        <Term>The PARENT is identical in both.</Term>{" "}
                        <Code>useRef</Code>, pass it as <Code>ref</Code>, call methods
                        on <Code>.current</Code>. Only the CHILD got simpler, so
                        migrating is a change inside the component, invisible at every
                        call site.
                    </p>
                    <p>
                        <Term>
                            Type it as <Code>Ref&lt;HTMLInputElement&gt;</Code>.
                        </Term>{" "}
                        The generic is the node the ref will point at — the same type
                        the parent used in <Code>useRef&lt;HTMLInputElement&gt;</Code>,
                        which is what makes <Code>.current?.focus()</Code> type-check
                        at the call site.
                    </p>

                    <Callout severity="note" label="note · forwardRef is legacy">
                        <p>
                            In React 19, <Code>ref</Code> is a regular prop —{" "}
                            <Code>forwardRef</Code> is no longer needed. Existing code
                            using <Code>forwardRef</Code> still works.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useRef</Code> itself is identical to React — same signature,
                    same semantics, nothing about the App Router changes it.
                </p>
                <p>
                    DOM refs are client-only, because there is no DOM on the server. A
                    component holding one must be <Code>&quot;use client&quot;</Code>,
                    and the ref is <Code>null</Code> all the way through SSR until the
                    effect runs after hydration — so nothing in the server-rendered
                    markup can depend on a measured value. Needing a ref is often the
                    signal for where the client boundary belongs.
                </p>
                <p>
                    The ref-as-prop change is a React 19 feature, not a Next one. It
                    arrives with the React version, and Next 16 ships React 19.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>what&apos;s the difference between a ref and state?</>}
                    a={
                        <>
                            &ldquo;Changing state <Term>re-renders</Term>; changing a
                            ref does not — a ref <Term>remembers</Term> a value the UI
                            doesn&apos;t need to react to.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>why is a DOM ref null at first?</>}
                        a={
                            <>
                                &ldquo;React only sets <Code>.current</Code>{" "}
                                <Term>after it commits</Term> the element to the DOM,
                                so during render the node doesn&apos;t exist yet — read
                                it in an effect.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
