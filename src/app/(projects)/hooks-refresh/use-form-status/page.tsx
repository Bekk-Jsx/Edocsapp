import DemoFrame from "@/components/ui/demo-frame";
import UseFormStatusDemo from "@/projects/hooks-refresh/demos/use-form-status-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseFormStatusDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-form-status-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const HOOK_TEXT = [
    {
        title: "What it is",
        href: "#what-it-is",
        text: (
            <>
                <Mono>pending</Mono> from the parent form, read by the child —
                imported from <Mono>react-dom</Mono>.
            </>
        ),
    },
    {
        title: "Full example",
        href: "#full-example",
        text: (
            <>
                The button disables itself with no prop passed, so{" "}
                <Mono>&lt;SubmitButton /&gt;</Mono> drops into any form.
            </>
        ),
    },
];

const RULES_TEXT = [
    {
        title: "Must be inside the form",
        href: "#must-be-inside-the-form",
        text: (
            <>
                It walks UP to the nearest form. Called in the owner it finds
                nothing — and says nothing.
            </>
        ),
    },
    {
        title: "Import & scope traps",
        href: "#import-scope-traps",
        text: (
            <>
                <Mono>react-dom</Mono>, not <Mono>react</Mono>. And no surrounding
                form means <Mono>pending</Mono> is always false.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof HOOK_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const HOOK: SummaryArticle[] = HOOK_TEXT.map(withSeverities);
const RULES: SummaryArticle[] = RULES_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The hook", items: HOOK },
                        { label: "The rule & traps", items: RULES },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useFormStatus"
                source="react"
                docs={<UseFormStatusDocs />}
                description={
                    <>
                        The submission status of the <Term>parent form</Term>, read from
                        inside it. A child calls <Code>useFormStatus()</Code> and gets{" "}
                        <Code>pending</Code>{" "}
                        for itself — so a submit button disables during any form&apos;s
                        submit with{" "}
                        <Term>nothing passed down</Term>. Imported from{" "}
                        <Code>react-dom</Code>, and it must be called from a component
                        rendered inside the form.
                    </>
                }
            >
                <UseFormStatusDemo />
            </DemoFrame>
        </PageShell>
    );
}
