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
// so the rule holds for both without exception: 14 sections, 14 cards.
//
// The page is written in four parts; each one is a *_TEXT array here and one
// group in the rail, in the same order as the parts in the content file.
const CROSS_ORIGIN_TEXT = [
    {
        title: "The error",
        href: "#the-error",
        text: (
            <>
                The request was sent; the response was withheld; no status is
                exposed.
            </>
        ),
    },
    {
        title: "What counts as another origin",
        href: "#what-counts-as-another-origin",
        text: (
            <>
                <Mono>scheme + host + port</Mono>; the browser enforces, the server
                states.
            </>
        ),
    },
    {
        title: "Why reading is blocked",
        href: "#why-reading-is-blocked",
        text: (
            <>
                Cookies attach by destination, so a foreign script could read
                private data.
            </>
        ),
    },
    {
        title: "What CORS does not do",
        href: "#what-cors-does-not-do",
        text: (
            <>
                Requests still run; side effects need <Mono>SameSite</Mono> and CSRF
                tokens.
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
        title: "Wildcards, and whose header counts",
        href: "#wildcards-and-whose-header-counts",
        text: (
            <>
                Wildcard for public data only; the responding server decides.
            </>
        ),
    },
];

const PREFLIGHT_TEXT = [
    {
        title: "When the browser asks first",
        href: "#when-the-browser-asks-first",
        text: (
            <>
                Cross-origin and not simple: JSON bodies and auth headers trigger
                it.
            </>
        ),
    },
    {
        title: "The OPTIONS exchange",
        href: "#the-options-exchange",
        text: (
            <>
                Requested method and headers against allowed ones; the server must
                route <Mono>OPTIONS</Mono>.
            </>
        ),
    },
];

const FIXING_TEXT = [
    {
        title: "A proxy, in dev and in production",
        href: "#a-proxy-in-dev-and-in-production",
        text: (
            <>
                One entry point forwards; <Mono>vite.config</Mono> is dev-only, prod
                needs nginx or Node.
            </>
        ),
    },
    {
        title: "CORS on the server",
        href: "#cors-on-the-server",
        text: (
            <>
                List real origins; cookies across domains need subdomains or a
                token.
            </>
        ),
    },
    {
        title: "Why a proxy is not a bypass",
        href: "#why-a-proxy-is-not-a-bypass",
        text: (
            <>
                A hostile proxy carries no session cookie, so it is just{" "}
                <Mono>curl</Mono>.
            </>
        ),
    },
];

const CACHING_TEXT = [
    {
        title: "Two mechanisms",
        href: "#two-mechanisms",
        text: (
            <>
                <Mono>max-age</Mono> skips the request; <Mono>etag</Mono> makes it
                cheap.
            </>
        ),
    },
    {
        title: "The directives",
        href: "#the-directives",
        text: (
            <>
                <Mono>no-cache</Mono> validates, <Mono>no-store</Mono> stores
                nothing, <Mono>immutable</Mono> never revalidates.
            </>
        ),
    },
    {
        title: "What this looks like in an app",
        href: "#what-this-looks-like-in-an-app",
        text: (
            <>
                APIs uncached, hashed assets forever, <Mono>index.html</Mono> fresh.
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
const PREFLIGHT: SummaryArticle[] = PREFLIGHT_TEXT.map(withSeverities);
const FIXING: SummaryArticle[] = FIXING_TEXT.map(withSeverities);
const CACHING: SummaryArticle[] = CACHING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("cors-and-caching");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Cross-origin requests", items: CROSS_ORIGIN },
                        { label: "Preflight", items: PREFLIGHT },
                        { label: "Where CORS gets fixed", items: FIXING },
                        { label: "Caching", items: CACHING },
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
