import DemoFrame from "@/components/ui/demo-frame";
import UseParamsDemo from "@/projects/hooks-refresh/demos/use-params-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseParamsDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-params-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const HOOK_TEXT = [
    {
        title: "Dynamic route params",
        href: "#dynamic-route-params",
        text: (
            <>
                <Mono>[slug]</Mono> folder + <Mono>/blog/hello</Mono> →{" "}
                <Mono>{`{ slug: "hello" }`}</Mono>. Catch-alls give an array.
            </>
        ),
    },
    {
        title: "Params vs pathname vs search",
        href: "#params-vs-pathname-vs-search",
        text: (
            <>
                Raw path, parsed segments, query string — three hooks, three parts of
                the URL.
            </>
        ),
    },
    {
        title: "Server pages get a prop",
        href: "#server-pages-get-params-as-a-prop",
        text: (
            <>
                A server page already receives <Mono>params</Mono>. The hook is for
                client children that don&apos;t.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const HOOK: SummaryArticle[] = HOOK_TEXT.map((item) => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
}));

export default function Page() {
    return (
        <PageShell
            alerts={<SummaryArticles groups={[{ label: "The hook", items: HOOK }]} />}
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useParams"
                source="next/navigation"
                docs={<UseParamsDocs />}
                description={
                    <>
                        The <Term>dynamic segments</Term> of the current route, parsed
                        into an object: a <Code>[slug]</Code> folder is what makes{" "}
                        <Code>params.slug</Code>{" "}exist, and the URL fills it in. Not the
                        query string — that&apos;s <Code>useSearchParams</Code>. Next-only,
                        and on a server page you read <Code>params</Code>{" "}
                        <Term>as a prop</Term> instead.
                    </>
                }
            >
                <UseParamsDemo />
            </DemoFrame>
        </PageShell>
    );
}
