import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    NetworkPanelDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/network-panel";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 6 sections, 6 cards.
const LIST_TEXT = [
    {
        title: "Columns",
        href: "#columns",
        text: (
            <>
                Status, Type, Initiator, Size, Time, Waterfall; duplicates become
                obvious.
            </>
        ),
    },
    {
        title: "Filters and settings",
        href: "#filters-and-settings",
        text: (
            <>
                Fetch/XHR, filter expressions, Preserve log, Disable cache.
            </>
        ),
    },
];

const ONE_REQUEST_TEXT = [
    {
        title: "Headers, Payload and Response",
        href: "#headers-payload-and-response",
        text: <>Metadata, what was sent, what came back raw.</>,
    },
    {
        title: "Status codes worth recognising",
        href: "#status-codes-worth-recognising",
        text: (
            <>
                <Mono>204</Mono> has no body; <Mono>401</Mono> re-authenticates,{" "}
                <Mono>403</Mono> never retries.
            </>
        ),
    },
];

const CONDITIONS_TEXT = [
    {
        title: "Where the time goes",
        href: "#where-the-time-goes",
        text: (
            <>
                TTFB is backend, download is payload, queueing is too many requests.
            </>
        ),
    },
    {
        title: "Throttling, offline and canceled requests",
        href: "#throttling-offline-and-canceled-requests",
        text: (
            <>
                Slow 4G exposes loading states; canceled rows prove an abort worked.
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

const LIST: SummaryArticle[] = LIST_TEXT.map(withSeverities);
const ONE_REQUEST: SummaryArticle[] = ONE_REQUEST_TEXT.map(withSeverities);
const CONDITIONS: SummaryArticle[] = CONDITIONS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("network-panel");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The request list", items: LIST },
                        { label: "Reading one request", items: ONE_REQUEST },
                        { label: "Timing and conditions", items: CONDITIONS },
                    ]}
                />
            }
        >
            {/* Same arrangement as the fetching-data page: no DemoFrame and no
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

                <NetworkPanelDocs />
            </article>
        </PageShell>
    );
}
