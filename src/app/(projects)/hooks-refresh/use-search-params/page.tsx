import { Suspense } from "react";
import DemoFrame from "@/components/ui/demo-frame";
import UseSearchParamsDemo from "@/projects/hooks-refresh/demos/use-search-params-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseSearchParamsDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-search-params-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const READ_TEXT = [
    {
        title: "Read the query string",
        href: "#read-the-query-string",
        text: (
            <>
                A read-only <Mono>URLSearchParams</Mono> —{" "}
                <Mono>.get()</Mono> / <Mono>.getAll()</Mono> / <Mono>.has()</Mono>, and
                it re-renders on change.
            </>
        ),
    },
];

const WRITE_TEXT = [
    {
        title: "Copy, modify, navigate",
        href: "#copy-modify-navigate",
        text: (
            <>
                <Mono>new URLSearchParams(searchParams)</Mono> →{" "}
                <Mono>.set()</Mono> → <Mono>router.replace()</Mono>.
            </>
        ),
    },
    {
        title: "Don't mutate the current params",
        // "don't" slugs to "don-t" — the apostrophe is a separator.
        href: "#don-t-mutate-the-current-params",
        text: (
            <>
                <Mono>let x = searchParams</Mono> is the same read-only object, not a
                copy.
            </>
        ),
    },
    {
        title: "Wrap in Suspense",
        href: "#wrap-in-suspense",
        text: (
            <>
                Request-time data: with no boundary the WHOLE route is forced dynamic
                and Next warns.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof READ_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const READ: SummaryArticle[] = READ_TEXT.map(withSeverities);
const WRITE: SummaryArticle[] = WRITE_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Reading the query", items: READ },
                        { label: "Updating the query", items: WRITE },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useSearchParams"
                source="next/navigation"
                docs={<UseSearchParamsDocs />}
                description={
                    <>
                        The <Term>query string</Term> (<Code>?key=value</Code>) as a
                        read-only <Code>URLSearchParams</Code>, re-read on every change.
                        Updating it is a copy → modify → navigate cycle, never a
                        mutation. Next-only —{" "}
                        <Term>routing isn&apos;t a React feature</Term> — and it needs a{" "}
                        <Code>&lt;Suspense&gt;</Code> boundary, as the demo below has.
                    </>
                }
            >
                {/* The boundary this page's own DANGER section is about: the demo
                    reads request-time data, so it renders inside <Suspense> and the
                    rest of the route stays statically renderable. */}
                <Suspense
                    fallback={
                        <p className="font-mono text-xs text-[var(--muted)]">
                            loading query…
                        </p>
                    }
                >
                    <UseSearchParamsDemo />
                </Suspense>
            </DemoFrame>
        </PageShell>
    );
}
