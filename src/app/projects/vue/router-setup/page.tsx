import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    RouterSetupDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/router-setup";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 3 sections, 3 cards.
const CREATE_ROUTER_TEXT = [
    {
        title: "createRouter and history modes",
        href: "#createrouter-and-history-modes",
        text: (
            <>
                <Mono>createRouter</Mono> + <Mono>createWebHistory</Mono> replace{" "}
                <Mono>new VueRouter</Mono> + <Mono>mode</Mono>; lazy routes via{" "}
                <Mono>{"() => import"}</Mono>.
            </>
        ),
    },
];

const LINK_VIEW_TEXT = [
    {
        title: "RouterLink and RouterView",
        href: "#routerlink-and-routerview",
        text: (
            <>
                Navigation without reload; active classes for free;{" "}
                <Mono>tag</Mono> prop removed.
            </>
        ),
    },
];

const USE_ROUTER_ROUTE_TEXT = [
    {
        title: "useRouter and useRoute",
        href: "#userouter-and-useroute",
        text: (
            <>
                <Mono>push</Mono> to navigate, reactive <Mono>route</Mono> to read;
                never destructure it.
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

const CREATE_ROUTER: SummaryArticle[] = CREATE_ROUTER_TEXT.map(withSeverities);
const LINK_VIEW: SummaryArticle[] = LINK_VIEW_TEXT.map(withSeverities);
const USE_ROUTER_ROUTE: SummaryArticle[] = USE_ROUTER_ROUTE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("router-setup");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "createRouter", items: CREATE_ROUTER },
                        { label: "RouterLink and RouterView", items: LINK_VIEW },
                        { label: "useRouter and useRoute", items: USE_ROUTER_ROUTE },
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

                <RouterSetupDocs />
            </article>
        </PageShell>
    );
}
