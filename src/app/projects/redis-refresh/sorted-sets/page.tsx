import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SortedSetsDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/sorted-sets";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "the same commands in Node", which always renders last and is
// deliberately NOT in the rail: it restates the CLI above rather than adding an idea.
const SCORE_TEXT = [
    {
        title: "ZADD",
        href: "#zadd",
        text: (
            <>
                Score first, then member — and re-adding a member updates its score instead
                of duplicating it, so the reply counts only what was created.
            </>
        ),
    },
    {
        title: "The score is a float",
        href: "#the-score-is-a-float",
        text: (
            <>
                <Mono>ZSCORE</Mono> comes back as a string, like <Mono>INCRBYFLOAT</Mono>;
                ties are broken lexicographically.
            </>
        ),
    },
    {
        title: "ZINCRBY",
        href: "#zincrby",
        text: (
            <>
                Returns the new score and re-positions the member in the same atomic command
                — one command per point scored, no re-sorting.
            </>
        ),
    },
];

const POSITION_TEXT = [
    {
        title: "ZRANGE and REV",
        href: "#zrange-and-rev",
        text: (
            <>
                Ascending by default, <Mono>REV</Mono> for descending, and{" "}
                <Mono>LRANGE</Mono>&apos;s index syntax — <Mono>0 2 REV</Mono> is the top
                three.
            </>
        ),
    },
    {
        title: "WITHSCORES",
        href: "#withscores",
        text: (
            <>
                A flat member, score, member, score list — the same shape as{" "}
                <Mono>HGETALL</Mono>, and a whole leaderboard in one command.
            </>
        ),
    },
    {
        title: "ZRANK and ZREVRANK",
        href: "#zrank-and-zrevrank",
        text: (
            <>
                Zero-based rank from the bottom or the top; a missing member is{" "}
                <Mono>(nil)</Mono>, and rank <Mono>0</Mono> is the leader.
            </>
        ),
    },
];

const BYSCORE_TEXT = [
    {
        title: "BYSCORE",
        href: "#byscore",
        text: (
            <>
                One keyword decides whether <Mono>200 400</Mono> means indexes or scores —
                and the wrong reading returns an empty array, not an error.
            </>
        ),
    },
    {
        title: "Bounds",
        href: "#bounds",
        text: (
            <>
                <Mono>-inf</Mono> and <Mono>+inf</Mono> are valid, and a leading{" "}
                <Mono>(</Mono> makes a bound exclusive.
            </>
        ),
    },
    {
        title: "LIMIT",
        href: "#limit",
        text: (
            <>
                <Mono>LIMIT offset count</Mono> pages a score range — invalid with plain
                index ranges, and deep offsets get slower.
            </>
        ),
    },
];

const WINDOW_TEXT = [
    {
        title: "ZREMRANGEBYSCORE",
        href: "#zremrangebyscore",
        text: (
            <>
                Deletes every member in a score range and reports how many went — one command
                for &quot;everything below this line&quot;.
            </>
        ),
    },
    {
        title: "Rate limiting, worked through",
        href: "#rate-limiting-worked-through",
        text: (
            <>
                Timestamps as scores: trim what aged out, <Mono>ZCARD</Mono> what remains,
                record the new request. The set never grows.
            </>
        ),
    },
    {
        title: "Other things the score can be",
        href: "#other-things-the-score-can-be",
        text: (
            <>
                Points, a timestamp, a priority, a geohash — the type never changes, only
                what the number means.
            </>
        ),
    },
];

const LIMITS_TEXT = [
    {
        title: "Cost",
        href: "#cost",
        text: (
            <>
                O(log N) writes and rank lookups on a skiplist — but{" "}
                <Mono>ZRANGE 0 -1</Mono> on a large one is the <Mono>SMEMBERS</Mono> mistake
                again.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof SCORE_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const SCORE: SummaryArticle[] = SCORE_TEXT.map(withSeverities);
const POSITION: SummaryArticle[] = POSITION_TEXT.map(withSeverities);
const BYSCORE: SummaryArticle[] = BYSCORE_TEXT.map(withSeverities);
const WINDOW: SummaryArticle[] = WINDOW_TEXT.map(withSeverities);
const LIMITS: SummaryArticle[] = LIMITS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("sorted-sets");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Score and Member", items: SCORE },
                        { label: "Reading by Position", items: POSITION },
                        { label: "Reading by Score", items: BYSCORE },
                        { label: "Sliding Windows", items: WINDOW },
                        { label: "Limits", items: LIMITS },
                    ]}
                />
            }
        >
            {/* No DemoFrame: Redis runs on a server, so this page has no live demo to
                frame and no client boundary. The header DemoFrame would otherwise
                supply is inlined with the same markup, so the page keeps the rhythm
                of the hooks pages — every fragment is introduced and explained by
                its own DocSection instead of a whole-module source panel.
                Heading and subtitle come from the registry, so this page, its
                sidebar row and its landing card can never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        redis · sorted sets
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <SortedSetsDocs />
            </article>
        </PageShell>
    );
}
