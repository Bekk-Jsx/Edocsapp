import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    CorsAndCachingDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/cors-and-caching";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 5 sections, 5 cards.
//
// This page is written in parts: the caching part arrives in its own prompt as
// a second *_TEXT array and a second group below.
const CROSS_ORIGIN_TEXT = [
    {
        title: "Reading the error",
        href: "#reading-the-error",
        text: (
            <>
                The request was sent; the browser withheld the response; no status
                is exposed.
            </>
        ),
    },
    {
        title: "Why the rule exists",
        href: "#why-the-rule-exists",
        text: (
            <>
                Cookies attach by destination; reads are blocked, side effects are
                not.
            </>
        ),
    },
    {
        title: "Origins, browser and server",
        href: "#origins-browser-and-server",
        text: (
            <>
                <Mono>scheme + host + port</Mono>; the browser enforces, the server
                states the policy.
            </>
        ),
    },
    {
        title: "Cookies across origins",
        href: "#cookies-across-origins",
        text: (
            <>
                Scope is domain and path, not port; the value is never readable.
            </>
        ),
    },
    {
        title: "Wildcards and private data",
        href: "#wildcards-and-private-data",
        text: (
            <>
                A wildcard suits public data only; the third party&apos;s headers
                decide, not yours.
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

const CROSS_ORIGIN: SummaryArticle[] = CROSS_ORIGIN_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("cors-and-caching");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Cross-origin requests", items: CROSS_ORIGIN },
                    ]}
                />
            }
        >
            {/* Same arrangement as the network-panel page: no DemoFrame and no
                "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · Networking
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <CorsAndCachingDocs />
            </article>
        </PageShell>
    );
}
