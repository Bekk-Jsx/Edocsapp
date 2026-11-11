import DemoFrame from "@/components/ui/demo-frame";
import UseIdDemo from "@/projects/hooks-refresh/demos/use-id-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseIdDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-id-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const IDEA_TEXT = [
    {
        title: "A stable unique id",
        href: "#a-stable-unique-id",
        text: (
            <>
                One <Mono>useId()</Mono> call = one stable, opaque id per component
                instance. For linking elements, not naming them.
            </>
        ),
    },
    {
        title: "Why it exists — SSR",
        href: "#why-it-exists-ssr-hydration",
        text: (
            <>
                SSR renders twice, so a <Mono>Math.random()</Mono> id mismatches on
                hydration. <Mono>useId</Mono> agrees on both sides.
            </>
        ),
    },
];

const USING_TEXT = [
    {
        title: "One base, many ids",
        href: "#one-base-many-related-ids",
        text: (
            <>
                Call it once and suffix the result — <Mono>{"${id}-email"}</Mono>,{" "}
                <Mono>{"${id}-email-hint"}</Mono> — rather than once per attribute.
            </>
        ),
    },
    {
        title: "Not for list keys",
        href: "#not-for-list-keys",
        text: (
            <>
                One id per INSTANCE, not per data item. Keys come from{" "}
                <Mono>item.id</Mono>; a hook in <Mono>.map</Mono> is illegal anyway.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof IDEA_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const IDEA: SummaryArticle[] = IDEA_TEXT.map(withSeverities);
const USING: SummaryArticle[] = USING_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The idea", items: IDEA },
                        { label: "Using it", items: USING },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useId"
                source="react"
                docs={<UseIdDocs />}
                description={
                    <>
                        A <Term>stable, unique id string</Term> per component instance,
                        for the attributes that link two elements together —{" "}
                        <Code>htmlFor</Code>/<Code>id</Code>,{" "}
                        <Code>aria-describedby</Code>. It exists because SSR renders a
                        component twice: a self-generated id would differ between those
                        passes and break hydration, while this one is{" "}
                        <Term>identical on the server and the client</Term>. Use one call
                        as a base and suffix it — never for list keys.
                    </>
                }
            >
                <UseIdDemo />
            </DemoFrame>
        </PageShell>
    );
}
