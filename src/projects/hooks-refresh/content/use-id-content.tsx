import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Only two sections carry a flag: the SSR section is the react⇄next difference
// that justifies the hook existing, and the keys section is the one real misuse.
// The two plain sections are the API itself — mechanism, not hazard.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The idea) ---
    // inline `react ⇄ next · hydration-safe ids` callout
    "why-it-exists-ssr-hydration": ["next"],
    // --- part 2 (Using it) ---
    // inline `trap · not for keys` callout
    "not-for-list-keys": ["trap"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-effect, use-layout-effect,
// use-memo and use-reducer define for their own part dividers.
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
// Part 1 — The idea. Fragment 1 is the whole API (there is only one
// call and no arguments); fragment 2 is the reason the hook exists at
// all, which is SSR rendering the same component twice.
// ===================================================================

const STABLE_ID = `import { useId } from "react";

const id = useId();

<label htmlFor={id}>Email</label>
<input id={id} />`;

const SSR_MISMATCH = `const id = \`input-\${Math.random()}\`; // ❌ server: "input-0.72", client: "input-0.19" -> mismatch
const id = useId();                   // ✅ server "_R_2p6_" === client "_R_2p6_"`;

// ===================================================================
// Part 2 — Using it. Fragment 3 is the pattern worth internalising
// (one base, suffixed); fragment 4 is the one misuse that comes up
// constantly, and it fails twice over — semantically and as a hook.
// ===================================================================

const ONE_BASE = `const id = useId();

<label htmlFor={\`\${id}-email\`}>Email</label>
<input id={\`\${id}-email\`} aria-describedby={\`\${id}-email-hint\`} />
<p id={\`\${id}-email-hint\`}>We'll never share it.</p>`;

const NOT_KEYS = `// ❌ semantically wrong AND a rules-of-hooks violation (hook in a loop)
{items.map(item => <li key={useId()}>...</li>)}

// ✅ keys come from your DATA
{items.map(item => <li key={item.id}>...</li>)}`;

export function UseIdDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The idea</PartHeading>
            <div>
                <DocSection title="a stable unique id">
                    <CodeBlock code={STABLE_ID} lang="tsx" />
                    <p>
                        <Term>One call returns one stable id per component instance.</Term>{" "}
                        <Code>useId</Code> takes no arguments. The same instance gets the
                        same string on every render, and a second instance of the same
                        component gets a different one — so the pair below can never
                        collide with the pair next to it.
                    </p>
                    <p>
                        <Term>It exists to LINK two elements, not to name one.</Term>{" "}
                        <Code>htmlFor</Code>/<Code>id</Code>,{" "}
                        <Code>aria-describedby</Code>, <Code>aria-labelledby</Code> —
                        anywhere two nodes have to agree on a string for the accessibility
                        tree to connect them.
                    </p>
                    <p>
                        <Term>The value is opaque.</Term> Something like{" "}
                        <Code>_R_2p6_</Code> — not a counter you increment, and not a
                        format to parse or depend on: React 18 emitted{" "}
                        <Code>:r0:</Code> and React 19 does not. Read it, pass it around,
                        never build logic on its shape.
                    </p>
                </DocSection>

                <DocSection
                    title="why it exists — ssr hydration"
                    sectionSeverity="next"
                >
                    <CodeBlock code={SSR_MISMATCH} lang="tsx" />
                    <p>
                        <Term>With SSR a component renders TWICE.</Term> Once on the
                        server to produce HTML, once on the client to hydrate it. Both
                        passes have to arrive at the same markup, or React cannot match
                        what it finds in the document to what it just rendered.
                    </p>
                    <p>
                        <Term>A self-generated id differs across those two passes.</Term>{" "}
                        <Code>Math.random()</Code> returns a new number every call; even a
                        plain module-level counter drifts once streaming or{" "}
                        <Code>Suspense</Code> changes the order work happens in. React
                        warns about the mismatch, and the <Code>htmlFor</Code>/
                        <Code>id</Code> link can end up pointing at nothing.
                    </p>
                    <p>
                        <Term>
                            <Code>useId</Code>{" "}
                            derives the string from the component&apos;s
                            POSITION in the tree.
                        </Term>{" "}
                        Not from randomness, not from a global counter — which is why the
                        server and the client independently produce the identical value
                        without communicating.
                    </p>
                    <p>
                        <Term>
                            Scope: the mismatch it prevents only exists under SSR.
                        </Term>{" "}
                        In a client-only SPA there is a single render, so there is nothing
                        for two passes to disagree about. It is still the recommended
                        default there — it keeps ids unique across instances of the same
                        component, and it is one less thing to get wrong later.
                    </p>

                    <Callout
                        severity="next"
                        label="react ⇄ next · hydration-safe ids"
                    >
                        <p>
                            In the App Router (SSR by default) <Code>useId</Code> is not
                            just hygiene — it prevents real hydration mismatches on
                            label/input and aria links. Never hand-roll ids with{" "}
                            <Code>Math.random</Code> or a counter in server-rendered
                            components.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Using it</PartHeading>
            <div>
                <DocSection title="one base, many related ids">
                    <CodeBlock code={ONE_BASE} lang="tsx" />
                    <p>
                        <Term>Call it once and treat the result as a PREFIX.</Term> Add a
                        suffix per element — <Code>-email</Code>,{" "}
                        <Code>-email-hint</Code> — instead of calling the hook once per
                        attribute.
                    </p>
                    <p>
                        <Term>One base groups a component&apos;s ids together.</Term>{" "}
                        Everything the widget owns shares a visible prefix, which makes the
                        relationship obvious in devtools and leaves one call to trace
                        rather than four.
                    </p>
                    <p>
                        <Term>Several <Code>useId()</Code> calls are fine too.</Term>{" "}
                        Nothing breaks if you prefer one per element; it is only noisier.
                        What matters is that the id comes from the hook rather than a
                        literal that a second instance would duplicate.
                    </p>
                </DocSection>

                <DocSection title="not for list keys" sectionSeverity="trap">
                    <CodeBlock code={NOT_KEYS} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useId</Code> identifies a COMPONENT INSTANCE, not a data
                            item.
                        </Term>{" "}
                        One call yields one id for the whole instance. It knows nothing
                        about the array you are mapping over, so it cannot distinguish one
                        row from another.
                    </p>
                    <p>
                        <Term>Keys must be stable identifiers from your data.</Term> React
                        uses a key to match an item to the same item on the next render —{" "}
                        <Code>item.id</Code>. Feed it something that is not tied to the
                        data and React loses track of which row is which, taking that
                        row&apos;s state and DOM with it.
                    </p>
                    <p>
                        <Term>And the call itself is illegal there.</Term> Hooks must run
                        in the same order on every render; calling one inside{" "}
                        <Code>.map</Code> makes the number of calls depend on the array
                        length. That is a rules-of-hooks violation, and the lint rule
                        catches it.
                    </p>

                    <Callout severity="trap" label="trap · not for keys">
                        <p>
                            Don&apos;t use <Code>useId</Code> for list keys — it is for a11y
                            linking (<Code>htmlFor</Code>/<Code>id</Code>,{" "}
                            <Code>aria-*</Code>). Keys come from your data (
                            <Code>item.id</Code>). <Code>useId</Code> in a loop also
                            violates the rules of hooks.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useId</Code> is identical to React — same call, same no
                    arguments — but its whole reason for existing is SSR. In the App
                    Router, where components are server-rendered by default, it is what
                    keeps linked and <Code>aria-*</Code> ids from causing a hydration
                    mismatch. In a client-only app it still works and is still
                    recommended, there is simply no mismatch left to prevent.
                </p>
                <p>
                    It needs <Code>&quot;use client&quot;</Code> only when the component
                    using it is a client component. Unlike the state and effect hooks,{" "}
                    <Code>useId</Code> is exported from React&apos;s server build, so a
                    Server Component can call it too — in practice it turns up in form and
                    interactive UI, which is usually client code anyway.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            why not generate ids with <Code>Math.random</Code>?
                        </>
                    }
                    a={
                        <>
                            &ldquo;With SSR the server and client renders would produce{" "}
                            <Term>different values</Term> — a hydration mismatch.{" "}
                            <Code>useId</Code>{" "}
                            produces the same id on both sides.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                can I use <Code>useId</Code> for list keys?
                            </>
                        }
                        a={
                            <>
                                &ldquo;No — keys come from your <Term>data</Term> (
                                <Code>item.id</Code>). <Code>useId</Code> is for linking
                                accessibility attributes, and calling it in a loop breaks
                                the rules of hooks.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
