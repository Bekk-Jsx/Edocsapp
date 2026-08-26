import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    CouchdbSyncDocs,
    SECTION_SEVERITIES,
} from "@/projects/elasticsearch/content/couchdb-sync";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "say it right — english", which always renders last and is
// deliberately NOT in the rail: it rehearses the page above rather than adding
// an idea to it.
const WHY_TEXT = [
    {
        title: "The problem",
        href: "#the-problem-keeping-two-stores-in-sync",
        text: (
            <>
                Dual writes can&apos;t be atomic across two systems — one writer
                per store, and the feed does the mirroring.
            </>
        ),
    },
];

const FEED_TEXT = [
    {
        title: "The _changes feed",
        href: "#the-changes-feed",
        text: (
            <>
                An ordered log of every write, read as &ldquo;since{" "}
                <Mono>X</Mono>&rdquo; — deletes included, documents optional.
            </>
        ),
    },
];

const SYNC_TEXT = [
    {
        title: "The sync loop",
        href: "#building-the-sync-loop",
        text: (
            <>
                Request, process, remember the position, request again —{" "}
                <Mono>longpoll</Mono> makes the wait free.
            </>
        ),
    },
    {
        title: "Three decisions",
        href: "#handling-each-change-three-decisions",
        text: (
            <>
                Share the id, put routing inside it, project the document — that
                is what makes replays harmless.
            </>
        ),
    },
];

const GAPS_TEXT = [
    {
        title: "Persist the position",
        href: "#production-gap-1-persist-the-position",
        text: (
            <>
                Save <Mono>last_seq</Mono> after each batch, never before — a
                crash should replay work, not skip it.
            </>
        ),
    },
    {
        title: "Retries & poison documents",
        href: "#production-gap-2-retries-and-poison-documents",
        text: (
            <>
                Backoff absorbs a blip; a dead-letter log keeps one permanent
                failure from stalling the pipe.
            </>
        ),
    },
    {
        title: "Catch precisely",
        href: "#production-gap-3-catch-precisely",
        text: (
            <>
                Forgive the expected <Mono>404</Mono> and rethrow the rest — a
                catch without a condition is a blindfold.
            </>
        ),
    },
];

const REBUILD_TEXT = [
    {
        title: "Zero-downtime rebuild",
        href: "#zero-downtime-rebuild",
        text: (
            <>
                Everything speaks to an alias; import into v2, swap atomically,
                then replay the feed from the noted sequence.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof WHY_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const WHY: SummaryArticle[] = WHY_TEXT.map(withSeverities);
const FEED: SummaryArticle[] = FEED_TEXT.map(withSeverities);
const SYNC: SummaryArticle[] = SYNC_TEXT.map(withSeverities);
const GAPS: SummaryArticle[] = GAPS_TEXT.map(withSeverities);
const REBUILD: SummaryArticle[] = REBUILD_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("couchdb-sync");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Why a Separate Process", items: WHY },
                        { label: "The Feed", items: FEED },
                        { label: "The Sync", items: SYNC },
                        { label: "The Production Gaps", items: GAPS },
                        { label: "Rebuilding", items: REBUILD },
                    ]}
                />
            }
        >
            {/* No DemoFrame and no PlanPage: Elasticsearch and CouchDB both run on
                a server and the sync is a standalone Node process, so this page has
                no live demo to frame and no client boundary. The header is inlined
                with the same markup its siblings use, so the page keeps the rhythm
                of the other elasticsearch pages — every fragment is introduced and
                explained by its own DocSection instead of a whole-module source
                panel. Heading and subtitle come from the registry, so this page,
                its sidebar row and its landing card can never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        elasticsearch · in an app
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <CouchdbSyncDocs />
            </article>
        </PageShell>
    );
}
