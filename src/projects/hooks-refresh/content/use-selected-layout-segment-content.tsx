import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Nothing here breaks or surprises — the hook is read-only and returns null
// rather than throwing. The single `note` marks the aside that qualifies the
// rule the rest of the page teaches: there is a second, plural version. No
// `next` flag: routing isn't a React feature, so the page is Next-only by
// definition and has no React counterpart to differ FROM.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (Singular vs plural) ---
    // inline `note · singular vs plural` callout
    "useselectedlayoutsegments-plural": ["note"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-effect, use-memo, use-optimistic, use-params, use-pathname, use-reducer,
// use-router and use-search-params define for their own parts.
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
// Part 1 — The idea. What a segment is, what the hook returns, and the
// one property that makes it worth using: it is relative to the caller.
// ===================================================================

const SEGMENT = `// /dashboard/settings/security  ->  "dashboard", "settings", "security"
// static or dynamic both count: /user/address and /user/[id] -> each slice is a segment`;

const ACTIVE_CHILD = `"use client";
import { useSelectedLayoutSegment } from "next/navigation";

// app/dashboard/layout.tsx
const segment = useSelectedLayoutSegment();
// /dashboard           -> null
// /dashboard/settings  -> "settings"
// /dashboard/billing   -> "billing"`;

const RELATIVE = `// structure: dashboard/layout.tsx, dashboard/settings/layout.tsx, .../settings/profile/page.tsx
// URL: /dashboard/settings/profile
// dashboard layout -> "settings"   (its immediate child)
// settings layout  -> "profile"    (its immediate child)`;

// ===================================================================
// Part 2 — Singular vs plural. The same call, one level vs all levels.
// ===================================================================

const PLURAL = `import { useSelectedLayoutSegments } from "next/navigation";

// URL: /dashboard/settings/profile, called in the dashboard layout:
useSelectedLayoutSegment();   // "settings"               (immediate child only)
useSelectedLayoutSegments();  // ["settings", "profile"]  (ALL segments below, as an array)`;

export function UseSelectedLayoutSegmentDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The idea</PartHeading>
            <div>
                <DocSection title="what a segment is">
                    <CodeBlock code={SEGMENT} lang="tsx" />
                    <p>
                        <Term>A segment is one slice of the URL path</Term> between
                        slashes.
                    </p>
                    <p>
                        <Term>Static or dynamic makes no difference.</Term>{" "}
                        <Code>user/address</Code> and <Code>user/[id]</Code> are both
                        segments — each piece between two slashes counts as one.
                    </p>
                </DocSection>

                <DocSection title="the active child segment">
                    <CodeBlock code={ACTIVE_CHILD} lang="tsx" />
                    <p>
                        <Term>
                            It returns the segment DIRECTLY BELOW the layout that calls
                            it
                        </Term>{" "}
                        — one string — or <Code>null</Code>{" "}when you are on that
                        layout&apos;s own index, where there is no active child.
                    </p>
                    <p>
                        <Term>It never looks deeper than one level.</Term> The value is
                        RELATIVE to the calling layout, not to the root.
                    </p>
                    <p>
                        <Term>Built for nav UI in shared layouts.</Term>{" "}
                        Active-link highlighting is the case it exists for. It is
                        client-only, comes from{" "}
                        <Code>&quot;next/navigation&quot;</Code>, and is Next-only.
                    </p>
                </DocSection>

                <DocSection title="relative to the calling layout">
                    <CodeBlock code={RELATIVE} lang="tsx" />
                    <p>
                        <Term>Each layout sees exactly one step below itself.</Term> On{" "}
                        <Code>/dashboard/settings/profile</Code> the dashboard layout
                        returns <Code>&quot;settings&quot;</Code> — anything deeper is
                        invisible to it — while a layout inside{" "}
                        <Code>settings</Code> returns{" "}
                        <Code>&quot;profile&quot;</Code>.
                    </p>
                    <p>
                        <Term>The deeper you call it, the deeper the segment.</Term>{" "}
                        Same URL, different answers, always relative to the caller.
                    </p>
                    <p>
                        <Term>
                            Which is why it beats parsing <Code>usePathname</Code>{" "}
                            yourself.
                        </Term>{" "}
                        Every nested layout gets its own active segment with no
                        string-slicing and no index arithmetic to keep correct.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Singular vs plural</PartHeading>
            <div>
                <DocSection
                    title="useSelectedLayoutSegments (plural)"
                    sectionSeverity="note"
                >
                    <CodeBlock code={PLURAL} lang="tsx" />
                    <p>
                        <Term>The plural version returns ALL segments below</Term> the
                        layout, as an array — not just the immediate child.
                    </p>
                    <p>
                        <Term>Singular for active-link highlighting</Term> — which
                        section is active. <Term>Plural for breadcrumbs,</Term> or
                        whenever you need the full nested path below the layout.
                    </p>

                    <Callout severity="note" label="note · singular vs plural">
                        <p>
                            <Code>useSelectedLayoutSegment</Code> = the immediate child
                            segment (a string, or <Code>null</Code> at the index).{" "}
                            <Code>useSelectedLayoutSegments</Code> = all segments below,
                            as an array — for breadcrumbs / full paths.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Next-only — routing isn&apos;t part of core React, and this hook
                    goes further still: it reflects the App Router&apos;s nested LAYOUT
                    tree, something core React has no concept of at all.
                </p>
                <p>
                    Client-only (<Code>&quot;use client&quot;</Code>). Its job is active
                    navigation state in a shared layout, without parsing the pathname by
                    hand.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            what does <Code>useSelectedLayoutSegment</Code> return?
                        </>
                    }
                    a={
                        <>
                            &ldquo;The active route segment{" "}
                            <Term>directly below the layout that calls it</Term> (a
                            string), or <Code>null</Code>{" "}when you&apos;re on that
                            layout&apos;s own index.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>singular vs plural?</>}
                        a={
                            <>
                                &ldquo;Singular returns the{" "}
                                <Term>immediate child</Term> segment; plural returns{" "}
                                <Term>all segments below</Term>{" "}the layout as an array —
                                for breadcrumbs, or the full nested path.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
