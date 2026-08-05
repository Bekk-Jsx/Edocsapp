import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    SetsDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/sets";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "the same commands in Node", which always renders last and is
// deliberately NOT in the rail: it restates the CLI above rather than adding an idea.
const UNIQUE_TEXT = [
    {
        title: "SADD and silent deduplication",
        href: "#sadd-and-silent-deduplication",
        text: (
            <>
                A duplicate is dropped, not rejected, and the integer says whether the
                member was new — so you never <Mono>SISMEMBER</Mono> before adding.
            </>
        ),
    },
    {
        title: "The order is not yours",
        href: "#the-order-is-not-yours",
        text: (
            <>
                <Mono>SMEMBERS</Mono> returns internal table order, which is neither
                insertion nor sorted and can change between calls.
            </>
        ),
    },
    {
        title: "There is no empty set",
        href: "#there-is-no-empty-set",
        text: (
            <>
                <Mono>SADD</Mono> creates the key and the last <Mono>SREM</Mono> deletes it;
                a missing set reads as <Mono>(empty array)</Mono>.
            </>
        ),
    },
];

const QUESTIONS_TEXT = [
    {
        title: "SISMEMBER",
        href: "#sismember",
        text: (
            <>
                O(1) at ten members or ten million — the &quot;is X in the group?&quot; that
                sets exist for.
            </>
        ),
    },
    {
        title: "SCARD",
        href: "#scard",
        text: (
            <>
                Cardinality from a stored count, O(1) — never <Mono>SMEMBERS</Mono> and
                count in the application.
            </>
        ),
    },
    {
        title: "SREM",
        href: "#srem",
        text: (
            <>
                Reports how many members were <em>really</em> removed, the same rule as{" "}
                <Mono>HDEL</Mono> — and <Mono>0</Mono> is not an error.
            </>
        ),
    },
];

const ALGEBRA_TEXT = [
    {
        title: "Two sets to work with",
        href: "#two-sets-to-work-with",
        text: (
            <>
                Two skill sets overlapping in one member, so every answer in this part is
                checkable by eye.
            </>
        ),
    },
    {
        title: "SINTER, SUNION, SDIFF",
        href: "#sinter-sunion-sdiff",
        text: (
            <>
                Intersection, union and difference — and <Mono>SDIFF</Mono> is the only one
                where argument order changes the answer.
            </>
        ),
    },
    {
        title: "Why this beats doing it in the application",
        href: "#why-this-beats-doing-it-in-the-application",
        text: (
            <>
                Server-side instead of two full transfers and your own loop; all three take
                any number of keys.
            </>
        ),
    },
    {
        title: "The STORE variants",
        href: "#the-store-variants",
        text: (
            <>
                <Mono>SINTERSTORE</Mono> writes the result to a key so nothing crosses the
                wire — overwritten destination, and no TTL of its own.
            </>
        ),
    },
    {
        title: "SINTERCARD",
        href: "#sintercard",
        text: (
            <>
                The size of the intersection without the members; state the key count first,
                and <Mono>LIMIT</Mono> caps the work.
            </>
        ),
    },
];

const INDEX_TEXT = [
    {
        title: "The problem",
        href: "#the-problem",
        text: (
            <>
                There is no <Mono>SELECT * FROM users</Mono>, and deriving the list from key
                names scans everything and matches <Mono>user:1:sessions</Mono> too.
            </>
        ),
    },
    {
        title: "The right way",
        href: "#the-right-way",
        text: (
            <>
                One <Mono>SADD</Mono> beside the <Mono>HSET</Mono> and the set <em>is</em>{" "}
                your index — exact, instant, nothing scanned.
            </>
        ),
    },
    {
        title: "The cost",
        href: "#the-cost",
        text: (
            <>
                You maintain it: a delete is <Mono>DEL</Mono> plus <Mono>SREM</Mono>, and
                forgetting the second leaves a dangling reference.
            </>
        ),
    },
];

const LIMITS_TEXT = [
    {
        title: "SMEMBERS is KEYS-shaped",
        href: "#smembers-is-keys-shaped",
        text: (
            <>
                A million members in one blocking reply — <Mono>SSCAN</Mono>,{" "}
                <Mono>SCARD</Mono> or <Mono>SISMEMBER</Mono> instead.
            </>
        ),
    },
    {
        title: "Intersection has a real cost",
        href: "#intersection-has-a-real-cost",
        text: (
            <>
                O(N*M), started from the smallest set — cheap against a huge key, slow
                between two large ones.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof UNIQUE_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const UNIQUE: SummaryArticle[] = UNIQUE_TEXT.map(withSeverities);
const QUESTIONS: SummaryArticle[] = QUESTIONS_TEXT.map(withSeverities);
const ALGEBRA: SummaryArticle[] = ALGEBRA_TEXT.map(withSeverities);
const INDEX: SummaryArticle[] = INDEX_TEXT.map(withSeverities);
const LIMITS: SummaryArticle[] = LIMITS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("sets");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Uniqueness and Unorderedness", items: UNIQUE },
                        { label: "The O(1) Questions", items: QUESTIONS },
                        { label: "Set Algebra", items: ALGEBRA },
                        { label: "The Secondary Index", items: INDEX },
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
                        redis · sets
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <SetsDocs />
            </article>
        </PageShell>
    );
}
