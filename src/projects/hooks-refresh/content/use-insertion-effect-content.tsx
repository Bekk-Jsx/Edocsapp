import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). Both flagged sections are ENTIRELY about
// one severity, so the same value is passed as the section's explicit
// `sectionSeverity` — kept in sync by intent.
// This page is deliberately SHORT: the hook is niche and you rarely write it.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (What it is) ---
    // inline `trap · style injection only` callout
    restrictions: ["trap"],

    // --- part 2 (Do you need it) ---
    // inline `note · you almost never write it` callout
    "static-css-vs-runtime-css-in-js": ["note"],
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
// Part 1 — What it is. A third effect slot, earlier than the other
// two, with exactly one job and a matching list of things it can't do.
// ===================================================================

const TIMING_ORDER = `// render -> useInsertionEffect -> (DOM mutated) -> useLayoutEffect -> paint -> useEffect

useInsertionEffect(() => {
  document.head.appendChild(styleTag); // inject <style> before layout
}, [deps]);`;

const RESTRICTIONS = `useInsertionEffect(() => {
  document.head.appendChild(styleTag);   // ✅ inject styles
  // ref.current.getBoundingClientRect(); // ❌ can't read layout yet
  // setState(...);                       // ❌ can't trigger a re-render
}, []);`;

// ===================================================================
// Part 2 — Do you need it. Almost certainly not: the axis that
// matters is static vs runtime-generated CSS, and static wins by
// default.
// ===================================================================

const STATIC_VS_RUNTIME = `// ✅ static styles -> plain CSS file / CSS Modules / Tailwind (SSR-safe, cached, no JS)
import "./box.css";

// runtime-generated styles (CSS-in-JS) — the rule depends on runtime values:
const Box = styled.div\`color: \${p => p.color};\`; // CSS created at render -> injected on the fly`;

export function UseInsertionEffectDocs() {
    return (
        <>
            <PartHeading kicker="part 1">What it is</PartHeading>
            <div>
                <DocSection title="the earliest effect">
                    <CodeBlock code={TIMING_ORDER} lang="tsx" />
                    <p>
                        <Term>A third effect timing, earlier than the other two.</Term>{" "}
                        The order is{" "}
                        <Code>
                            render → useInsertionEffect → (DOM mutated) → useLayoutEffect
                            → paint → useEffect
                        </Code>
                        . It runs before React mutates the DOM and before layout is
                        calculated.
                    </p>
                    <p>
                        <Term>
                            Its single purpose is injecting <Code>&lt;style&gt;</Code>{" "}
                            tags.
                        </Term>{" "}
                        Getting them in first means the rules are already in place by the
                        time <Code>useLayoutEffect</Code> and the browser measure the DOM.
                    </p>
                    <p>
                        <Term>That ordering is the point.</Term> A CSS-in-JS library
                        injecting styles later would change rules that layout had already
                        been computed against, forcing an extra recalculation.{" "}
                        <Code>useInsertionEffect</Code> is the slot that avoids it.
                    </p>
                </DocSection>

                <DocSection title="restrictions" sectionSeverity="trap">
                    <CodeBlock code={RESTRICTIONS} lang="tsx" />
                    <p>
                        <Term>Running that early costs you everything else.</Term> There
                        is no DOM to read yet, so you cannot measure layout — that is{" "}
                        <Code>useLayoutEffect</Code>&apos;s job. Refs are not populated
                        either.
                    </p>
                    <p>
                        <Term>You also cannot call setState.</Term> Triggering a
                        re-render from here is not supported; React is mid-commit and has
                        not finished the work this effect runs ahead of.
                    </p>
                    <p>
                        <Term>Inserting styles is its ONLY legitimate job.</Term> If the
                        code you want to write is not that, one of the other two effects
                        is the right hook.
                    </p>

                    <Callout severity="trap" label="trap · style injection only">
                        <p>
                            <Code>useInsertionEffect</Code> can&apos;t read layout,
                            can&apos;t <Code>setState</Code>, and refs are still{" "}
                            <Code>null</Code>. Use it ONLY to inject{" "}
                            <Code>&lt;style&gt;</Code> tags. If you need to measure, use{" "}
                            <Code>useLayoutEffect</Code>; for anything else,{" "}
                            <Code>useEffect</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Do you need it</PartHeading>
            <div>
                <DocSection
                    title="static css vs runtime css-in-js"
                    sectionSeverity="note"
                >
                    <CodeBlock code={STATIC_VS_RUNTIME} lang="tsx" />
                    <p>
                        <Term>
                            The real question is STATIC vs DYNAMIC styles, not &quot;CSS
                            file vs hook&quot;.
                        </Term>{" "}
                        Styles you know ahead of time belong in CSS files, CSS Modules or
                        Tailwind — shipped in the HTML, present on the server, cached,
                        zero runtime cost. Never inject those at runtime.
                    </p>
                    <p>
                        <Term>
                            <Code>useInsertionEffect</Code> is for RUNTIME-generated CSS.
                        </Term>{" "}
                        CSS-in-JS libraries like Emotion or styled-components build rules
                        that don&apos;t exist until render, from values only known then —
                        those have to become a <Code>&lt;style&gt;</Code> tag, and this
                        hook is when.
                    </p>

                    <Callout severity="note" label="note · you almost never write it">
                        <p>
                            You benefit from <Code>useInsertionEffect</Code> INDIRECTLY —
                            CSS-in-JS libraries use it internally. You rarely call it
                            yourself. The ecosystem is also moving toward zero-runtime
                            styling (Tailwind, CSS Modules, vanilla-extract), especially in
                            the App Router, so the use case is shrinking.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useInsertionEffect</Code> is identical to React and client-only.
                    Like the other effects it does not run on the server, so it needs{" "}
                    <Code>&quot;use client&quot;</Code> and only runs after hydration.
                </p>
                <p>
                    In the App Router, runtime CSS-in-JS is awkward with Server Components
                    — prefer static styling (CSS Modules, Tailwind) and you will rarely
                    need this hook at all.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>why not just import a CSS file?</>}
                    a={
                        <>
                            &ldquo;For static styles you should — CSS files are{" "}
                            <Term>SSR-safe and cached</Term>.{" "}
                            <Code>useInsertionEffect</Code> is only for{" "}
                            <Term>runtime-generated</Term> styles (CSS-in-JS) that
                            don&apos;t exist until render.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                when would you write <Code>useInsertionEffect</Code>{" "}
                                yourself?
                            </>
                        }
                        a={
                            <>
                                &ldquo;Almost never — it&apos;s for{" "}
                                <Term>CSS-in-JS libraries</Term> to inject{" "}
                                <Code>&lt;style&gt;</Code> tags at the right time; app code
                                rarely touches it.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
