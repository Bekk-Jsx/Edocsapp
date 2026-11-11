import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    NavigationAndParamsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/navigation-and-params";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 4 sections, 4 cards.
const DYNAMIC_ROUTES_TEXT = [
    {
        title: "Dynamic segments",
        href: "#dynamic-segments",
        text: (
            <>
                <Mono>:id</Mono> in the path; links by name;{" "}
                <Mono>route.params</Mono> in the component.
            </>
        ),
    },
    {
        title: "Params are strings",
        href: "#params-are-strings",
        text: (
            <>
                Convert once with <Mono>Number()</Mono> in a computed.
            </>
        ),
    },
];

const PARAM_CHANGES_TEXT = [
    {
        title: "Same component, new param",
        href: "#same-component-new-param",
        text: (
            <>
                Reused instance: watch the param, don&apos;t rely on{" "}
                <Mono>onMounted</Mono>.
            </>
        ),
    },
];

const PARAMS_VS_QUERY_TEXT = [
    {
        title: "Params vs query",
        href: "#params-vs-query",
        text: (
            <>
                Params say which, query says how; writable computed +{" "}
                <Mono>replace</Mono> for search.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: {
    title: string;
    href: string;
    text: React.ReactNode;
}): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const DYNAMIC_ROUTES: SummaryArticle[] = DYNAMIC_ROUTES_TEXT.map(withSeverities);
const PARAM_CHANGES: SummaryArticle[] = PARAM_CHANGES_TEXT.map(withSeverities);
const PARAMS_VS_QUERY: SummaryArticle[] = PARAMS_VS_QUERY_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("navigation-and-params");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Dynamic routes and params", items: DYNAMIC_ROUTES },
                        { label: "Param changes", items: PARAM_CHANGES },
                        { label: "Params vs query", items: PARAMS_VS_QUERY },
                    ]}
                />
            }
        >
            {/* Same arrangement as the app-instance page: no DemoFrame and no
                "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · Router
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <NavigationAndParamsDocs />
            </article>
        </PageShell>
    );
}
