import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    HowSsrWorksDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/how-ssr-works";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 7 sections, 7 cards.
//
// The page is written in three parts; each one is a *_TEXT array here and one
// group in the rail, in the same order as the parts in the content file.
const RECEIVES_TEXT = [
    {
        title: "An empty div, or the page",
        href: "#an-empty-div-or-the-page",
        text: (
            <>
                CSR ships a shell; SSR ships content but not earlier
                interactivity.
            </>
        ),
    },
    {
        title: "The application renders twice",
        href: "#the-application-renders-twice",
        text: (
            <>
                <Mono>renderToString</Mono> produces HTML without a browser;
                listeners come later.
            </>
        ),
    },
];

const UNIVERSAL_TEXT = [
    {
        title: "The same component runs in both places",
        href: "#the-same-component-runs-in-both-places",
        text: (
            <>
                No server-only components; <Mono>onMounted</Mono> never runs on
                the server.
            </>
        ),
    },
    {
        title: "When the HTML needs browser data",
        href: "#when-the-html-needs-browser-data",
        text: (
            <>
                Render a placeholder and fill it after mount, or send the value
                with the request.
            </>
        ),
    },
];

const PER_REQUEST_TEXT = [
    {
        title: "Module state is shared on the server",
        href: "#module-state-is-shared-on-the-server",
        text: (
            <>
                One process serves many users; build app, stores and router per
                request.
            </>
        ),
    },
    {
        title: "Transferring the state",
        href: "#transferring-the-state",
        text: (
            <>
                Serialise the rendered state into the HTML and adopt it before
                mounting; escape it.
            </>
        ),
    },
    {
        title: "Turning SSR on",
        href: "#turning-ssr-on",
        text: (
            <>
                Nuxt by default, or two entries, two builds and a Node server.
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

const RECEIVES: SummaryArticle[] = RECEIVES_TEXT.map(withSeverities);
const UNIVERSAL: SummaryArticle[] = UNIVERSAL_TEXT.map(withSeverities);
const PER_REQUEST: SummaryArticle[] = PER_REQUEST_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("how-ssr-works");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "What the browser receives", items: RECEIVES },
                        { label: "Universal components", items: UNIVERSAL },
                        { label: "One app per request", items: PER_REQUEST },
                    ]}
                />
            }
        >
            {/* Same arrangement as the vue-devtools page: no DemoFrame and no
                "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · SSR
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <HowSsrWorksDocs />
            </article>
        </PageShell>
    );
}
