import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// One flag only: the hook is small and hard to misuse, except for the one thing
// everybody assumes it does — carry the query string. No `next` flag anywhere,
// because there is no React counterpart to differ FROM: routing isn't a React
// feature, so the whole page is Next-only by definition.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The hook) ---
    // inline `trap · no query string` callout
    "path-only-no-query": ["trap"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-effect, use-memo, use-optimistic, use-reducer and use-router define for
// their own parts.
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
// Part 1 — The hook. What it returns, the one thing it's for, and the
// one thing it deliberately leaves out.
// ===================================================================

const CURRENT_PATH = `"use client";
import { usePathname } from "next/navigation";

const pathname = usePathname(); // e.g. "/dashboard/settings"`;

const ACTIVE_LINKS = `const pathname = usePathname();

<Link href="/about" className={pathname === "/about" ? "active" : ""}>About</Link>`;

const NO_QUERY = `// URL: /search?q=react
usePathname();        // "/search"  (no ?q=react)
useSearchParams();    // read ?q=react here`;

export function UsePathnameDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The hook</PartHeading>
            <div>
                <DocSection title="current path">
                    <CodeBlock code={CURRENT_PATH} lang="tsx" />
                    <p>
                        <Term>It returns the current URL PATH as a string</Term>{" "}
                        and re-renders on navigation, so the value is never stale.
                    </p>
                    <p>
                        <Term>The path only.</Term>{" "}
                        <Code>?foo=bar</Code> is NOT included — the query string is{" "}
                        <Code>useSearchParams</Code>&apos; job.
                    </p>
                    <p>
                        <Term>Client-only, and Next-only.</Term> It needs{" "}
                        <Code>&quot;use client&quot;</Code> and comes from{" "}
                        <Code>&quot;next/navigation&quot;</Code>. React Router&apos;s
                        equivalent is <Code>useLocation().pathname</Code>.
                    </p>
                </DocSection>

                <DocSection title="active links">
                    <CodeBlock code={ACTIVE_LINKS} lang="tsx" />
                    <p>
                        <Term>This is what the hook is mostly for.</Term>{" "}
                        Highlight the active nav link by comparing{" "}
                        <Code>pathname</Code> with each link&apos;s{" "}
                        <Code>href</Code>.
                    </p>
                    <p>
                        <Term>The highlight keeps itself current.</Term> Because the
                        hook re-renders on navigation, the class flips as soon as the
                        route changes — nothing to wire up, no effect to write.
                    </p>
                </DocSection>

                <DocSection title="path only, no query" sectionSeverity="trap">
                    <CodeBlock code={NO_QUERY} lang="tsx" />
                    <p>
                        <Term>
                            <Code>usePathname</Code> strips the query string.
                        </Term>{" "}
                        On <Code>/search?q=react</Code> you get{" "}
                        <Code>&quot;/search&quot;</Code> and nothing more.
                    </p>
                    <p>
                        <Term>
                            If you need <Code>?params</Code>, use{" "}
                            <Code>useSearchParams</Code>.
                        </Term>{" "}
                        The two cover different parts of the URL — they are companions,
                        not alternatives.
                    </p>

                    <Callout severity="trap" label="trap · no query string">
                        <p>
                            <Code>usePathname</Code> returns the path only, not the
                            query string. Read <Code>?params</Code> with{" "}
                            <Code>useSearchParams</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Next-only — routing isn&apos;t part of core React, so there is no
                    counterpart to compare against here. React Router&apos;s equivalent
                    is <Code>useLocation().pathname</Code>.
                </p>
                <p>
                    Client-only: the component reading the path needs{" "}
                    <Code>&quot;use client&quot;</Code>.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            does <Code>usePathname</Code> include the query string?
                        </>
                    }
                    a={
                        <>
                            &ldquo;No — it returns the <Term>path only</Term>; use{" "}
                            <Code>useSearchParams</Code> for <Code>?params</Code>.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>what&apos;s it mainly for?</>}
                        a={
                            <>
                                &ldquo;<Term>Active-link highlighting</Term> — compare{" "}
                                <Code>pathname</Code> to each link&apos;s{" "}
                                <Code>href</Code>. It re-renders on navigation, so the
                                highlight stays current.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
