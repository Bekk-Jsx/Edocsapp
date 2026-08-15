import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Reading is safe; both flags live on the writing half — mutating the read-only
// object (a gotcha) and the missing Suspense boundary (a real build-level
// regression: the whole route silently stops being static). No `next` flag:
// routing isn't a React feature, so the page is Next-only by definition and
// has no React counterpart to differ FROM.
// NOTE: the id below is the slug of "don't mutate the current params" — the
// apostrophe is a separator, hence `don-t`. Keep the two in step if the title
// ever changes, or the rail card loses its icon.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (Updating the query) ---
    // inline `trap · read-only, copy first` callout
    "don-t-mutate-the-current-params": ["trap"],
    // inline `danger · needs a Suspense boundary` callout
    "wrap-in-suspense": ["danger"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-effect, use-memo, use-optimistic, use-params, use-pathname, use-reducer
// and use-router define for their own parts.
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
// Part 1 — Reading the query. What comes back and what it covers.
// ===================================================================

const READ = `// URL: /search?q=react&page=2
"use client";
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const q = searchParams.get("q");       // "react"
const page = searchParams.get("page"); // "2"`;

// ===================================================================
// Part 2 — Updating the query. The copy -> modify -> navigate cycle,
// then the two ways it goes wrong: mutating the original, and
// rendering it without a boundary.
// ===================================================================

const UPDATE = `const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();

function setPage(page: string) {
  const params = new URLSearchParams(searchParams);    // copy current params (mutable)
  params.set("page", page);                            // change one
  router.replace(\`\${pathname}?\${params.toString()}\`); // navigate to the new URL
}`;

const NO_MUTATE = `let params = searchParams;                        // ❌ same read-only object -> .set() fails
const params = new URLSearchParams(searchParams); // ✅ mutable copy you own`;

const SUSPENSE = `// ❌ no Suspense -> the WHOLE route is forced dynamic (build warning)
// ✅ isolate it:
import { Suspense } from "react";

export default function Page() {
  return <Suspense fallback={<p>Loading…</p>}><Filter /></Suspense>;
}`;

export function UseSearchParamsDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Reading the query</PartHeading>
            <div>
                <DocSection title="read the query string">
                    <CodeBlock code={READ} lang="tsx" />
                    <p>
                        <Term>
                            It returns the query string as a READ-ONLY{" "}
                            <Code>URLSearchParams</Code> object.
                        </Term>{" "}
                        Read it with <Code>.get(&quot;key&quot;)</Code>,{" "}
                        <Code>.getAll(&quot;key&quot;)</Code> and{" "}
                        <Code>.has(&quot;key&quot;)</Code>.
                    </p>
                    <p>
                        <Term>It re-renders when the query changes</Term> — so a
                        component reading <Code>?page</Code> stays in step with the URL
                        without any wiring of your own.
                    </p>
                    <p>
                        <Term>The query, and only the query.</Term> The path is{" "}
                        <Code>usePathname</Code> and the route segments are{" "}
                        <Code>useParams</Code>; this hook covers{" "}
                        <Code>?key=value</Code> and nothing else.
                    </p>
                    <p>
                        <Term>Client-only, and Next-only.</Term> It needs{" "}
                        <Code>&quot;use client&quot;</Code> and comes from{" "}
                        <Code>&quot;next/navigation&quot;</Code>.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Updating the query</PartHeading>
            <div>
                <DocSection title="copy, modify, navigate">
                    <CodeBlock code={UPDATE} lang="tsx" />
                    <p>
                        <Term>Three steps, always the same three.</Term> COPY with{" "}
                        <Code>new URLSearchParams(searchParams)</Code>, MODIFY with{" "}
                        <Code>.set()</Code> / <Code>.delete()</Code> /{" "}
                        <Code>.append()</Code>, then NAVIGATE by pushing or replacing
                        the rebuilt URL.
                    </p>
                    <p>
                        <Term>
                            <Code>replace</Code> rather than <Code>push</Code> for
                            filters.
                        </Term>{" "}
                        Changing a page number or a sort order five times shouldn&apos;t
                        leave five entries the user has to click back through.
                    </p>
                    <p>
                        <Term>Why the copy matters.</Term>{" "}
                        <Code>let params = searchParams</Code>{" "}doesn&apos;t copy
                        anything — it&apos;s a reference to the SAME read-only object,
                        so <Code>.set()</Code>{" "}fails and what you&apos;d be reaching for
                        is current state.
                    </p>
                    <p>
                        <Term>
                            <Code>new URLSearchParams(searchParams)</Code> is a fresh,
                            MUTABLE copy you own.
                        </Term>{" "}
                        It is the <Code>{"{...spread}"}</Code>{" "}equivalent for query
                        params — same rule as state: don&apos;t mutate the current
                        thing, derive a new one.
                    </p>
                </DocSection>

                <DocSection
                    title="don't mutate the current params"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={NO_MUTATE} lang="tsx" />
                    <p>
                        <Term>Never assign-and-mutate.</Term>{" "}
                        <Code>searchParams</Code> is read-only and represents the
                        CURRENT URL — it is not a scratch object.
                    </p>
                    <p>
                        <Term>Always construct a new one from it,</Term> modify the
                        copy, and let the navigation be what changes the URL.
                    </p>

                    <Callout severity="trap" label="trap · read-only, copy first">
                        <p>
                            <Code>searchParams</Code> is read-only.{" "}
                            <Code>let x = searchParams; x.set(...)</Code> fails and
                            mutates current state. Build a copy:{" "}
                            <Code>new URLSearchParams(searchParams)</Code>, modify that,
                            then navigate.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="wrap in Suspense" sectionSeverity="danger">
                    <CodeBlock code={SUSPENSE} lang="tsx" />
                    <p>
                        <Term>The query is only known at REQUEST time.</Term> A
                        component calling <Code>useSearchParams</Code>{" "}therefore
                        can&apos;t be statically rendered — there is nothing to
                        pre-render it with.
                    </p>
                    <p>
                        <Term>
                            Without a <Code>&lt;Suspense&gt;</Code> boundary the ENTIRE
                            route goes dynamic.
                        </Term>{" "}
                        You lose static optimization for the whole page, and Next warns
                        about it at build time.
                    </p>
                    <p>
                        <Term>The boundary is a wall.</Term> Wrap the component that
                        uses the hook, and only that part stays dynamic — the rest of
                        the page can still be static.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · needs a Suspense boundary"
                    >
                        <p>
                            <Code>useSearchParams</Code>{" "}can&apos;t be statically
                            rendered (the query is request-time). Without{" "}
                            <Code>&lt;Suspense&gt;</Code>, the whole route is forced
                            dynamic and Next warns. Wrap the using component in{" "}
                            <Code>&lt;Suspense&gt;</Code> to isolate it.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Next-only — routing isn&apos;t part of core React, so there is no
                    counterpart to compare against here. React Router has a hook by the
                    same name, but it is MUTABLE through a setter and carries no
                    Suspense requirement.
                </p>
                <p>
                    Next&apos;s version is read-only, needs{" "}
                    <Code>&quot;use client&quot;</Code>, and wants a{" "}
                    <Code>&lt;Suspense&gt;</Code>{" "}boundary so the route isn&apos;t
                    opted out of static rendering.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            why copy <Code>searchParams</Code> with{" "}
                            <Code>new URLSearchParams()</Code>?
                        </>
                    }
                    a={
                        <>
                            &ldquo;It&apos;s <Term>read-only</Term>{" "}and represents the
                            current URL — you build a mutable copy, modify that, then
                            navigate, rather than mutating current state.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                why does <Code>useSearchParams</Code> need{" "}
                                <Code>Suspense</Code>?
                            </>
                        }
                        a={
                            <>
                                &ldquo;The query is only known{" "}
                                <Term>at request time</Term>, so it can&apos;t be
                                static; without a Suspense boundary the whole route is
                                forced dynamic.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
