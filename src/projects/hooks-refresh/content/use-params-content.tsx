import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// The one flag is a `next`, not a risk: on a Server Component page the params
// arrive as a PROP and the hook is simply the wrong tool — a framework
// difference, not a bug. (Nothing here is flagged `next` for "React does this
// differently": React has no routing at all.)
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The hook) ---
    // inline `react ⇄ next · prop vs hook` callout
    "server-pages-get-params-as-a-prop": ["next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-effect, use-memo, use-optimistic, use-pathname, use-reducer and
// use-router define for their own parts.
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
// Part 1 — The hook. What a param IS, how it differs from the two
// neighbouring URL hooks, and when not to reach for it at all.
// ===================================================================

const DYNAMIC_PARAMS = `// route: app/blog/[slug]/page.tsx   URL: /blog/hello-world
"use client";
import { useParams } from "next/navigation";

const params = useParams(); // { slug: "hello-world" }`;

const THREE_VIEWS = `usePathname();      // "/blog/hello-world"      (raw path)
useParams();        // { slug: "hello-world" }  (parsed segments)
useSearchParams();  // ?page=2                  (query string)`;

const SERVER_PROP = `// app/blog/[slug]/page.tsx — Server Component
export default function Page({ params }: { params: { slug: string } }) {
  return <p>{params.slug}</p>; // params as a PROP, no hook
}`;

export function UseParamsDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The hook</PartHeading>
            <div>
                <DocSection title="dynamic route params">
                    <CodeBlock code={DYNAMIC_PARAMS} lang="tsx" />
                    <p>
                        <Term>It returns the DYNAMIC route parameters</Term> — the
                        values filling the <Code>[bracket]</Code> segments of the
                        current route.
                    </p>
                    <p>
                        <Term>Names come from folders, values from the URL.</Term> A
                        folder called <Code>[slug]</Code> is what makes{" "}
                        <Code>params.slug</Code>{" "}exist; the URL decides what is in it.
                    </p>
                    <p>
                        <Term>The mapping.</Term> <Code>[slug]</Code> on{" "}
                        <Code>/blog/hello</Code> →{" "}
                        <Code>{`{ slug: "hello" }`}</Code>.{" "}
                        <Code>[category]/[id]</Code> on <Code>/shop/tech/42</Code> →{" "}
                        <Code>{`{ category: "tech", id: "42" }`}</Code>.{" "}
                        <Code>[...tags]</Code> on <Code>/a/b/c</Code> →{" "}
                        <Code>{`{ tags: ["a", "b", "c"] }`}</Code> — a catch-all gives
                        you an ARRAY.
                    </p>
                    <p>
                        <Term>Client-only, and Next-only.</Term> It needs{" "}
                        <Code>&quot;use client&quot;</Code> and comes from{" "}
                        <Code>&quot;next/navigation&quot;</Code>.
                    </p>
                </DocSection>

                <DocSection title="params vs pathname vs search">
                    <CodeBlock code={THREE_VIEWS} lang="tsx" />
                    <p>
                        <Term>Three views of the same URL.</Term>{" "}
                        <Code>usePathname</Code> is the RAW path string,{" "}
                        <Code>useParams</Code> is the parsed dynamic SEGMENTS, and{" "}
                        <Code>useSearchParams</Code> is the QUERY string.
                    </p>
                    <p>
                        <Term>Params are not search params.</Term> Params are route
                        segments (<Code>/blog/[slug]</Code>); search params are{" "}
                        <Code>?page=2</Code>. Different parts of the URL, different
                        hooks.
                    </p>
                </DocSection>

                <DocSection
                    title="server pages get params as a prop"
                    sectionSeverity="next"
                >
                    <CodeBlock code={SERVER_PROP} lang="tsx" />
                    <p>
                        <Term>On a Server Component page you don&apos;t need the hook.</Term>{" "}
                        The page receives <Code>params</Code> as a PROP, directly — no
                        import, no <Code>&quot;use client&quot;</Code>.
                    </p>
                    <p>
                        <Term>The hook is for client components BELOW the page.</Term>{" "}
                        A nested client component that needs the params but doesn&apos;t
                        get them passed down is exactly the case{" "}
                        <Code>useParams</Code> exists for.
                    </p>
                    <p>
                        <Term>So: prop on server pages, hook in client children.</Term>{" "}
                        Reaching for the hook on a page you could have read a prop from
                        turns a server page into a client one for nothing.
                    </p>

                    <Callout severity="next" label="react ⇄ next · prop vs hook">
                        <p>
                            Server Component pages get <Code>params</Code> as a prop —
                            use that. Reach for the <Code>useParams</Code>{" "}hook only in
                            client components that don&apos;t receive params as props.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Next-only — dynamic routing is a framework feature, not part of
                    core React, so there is no counterpart to compare against here.
                    React Router has its own <Code>useParams</Code>, doing the same job
                    for its own route definitions.
                </p>
                <p>
                    Client-only (<Code>&quot;use client&quot;</Code>); server pages read
                    the <Code>params</Code> prop instead.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>params vs search params?</>}
                    a={
                        <>
                            &ldquo;Params are dynamic route <Term>SEGMENTS</Term> (
                            <Code>/blog/[slug]</Code>); search params are the{" "}
                            <Term>QUERY string</Term> (<Code>?page=2</Code>) — different
                            parts of the URL.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                do server pages need <Code>useParams</Code>?
                            </>
                        }
                        a={
                            <>
                                &ldquo;No — they receive <Code>params</Code>{" "}
                                <Term>as a prop</Term>; the hook is for client
                                components nested below that don&apos;t get the
                                prop.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
