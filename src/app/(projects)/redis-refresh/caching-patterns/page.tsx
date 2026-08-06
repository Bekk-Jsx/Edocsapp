import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    CachingPatternsDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/caching-patterns";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// "the same commands in Node" footer — the whole page is already node-redis, so
// there is no CLI session for a footer to restate.
const ASIDE_TEXT = [
    {
        title: "The three steps",
        href: "#the-three-steps",
        text: (
            <>
                <Mono>GET</Mono>, miss, query, <Mono>SET</Mono> with a TTL. Redis never
                talks to your database — the application orchestrates.
            </>
        ),
    },
    {
        title: "The shape in code",
        href: "#the-shape-in-code",
        text: (
            <>
                One early return is the hit path. The <Mono>EX</Mono> is what makes it a
                cache rather than a second database nobody maintains.
            </>
        ),
    },
    {
        title: "Why a string and not a hash here",
        href: "#why-a-string-and-not-a-hash-here",
        text: (
            <>
                A cache entry is fetched, replaced and deleted WHOLE, so the JSON-blob
                objection does not apply — until you update one field.
            </>
        ),
    },
];

const TTL_TEXT = [
    {
        title: "The question TTL answers",
        href: "#the-question-ttl-answers",
        text: (
            <>
                &quot;How wrong can this be, for how long, before someone cares?&quot;
                Short means fresher and costlier; there is no correct answer.
            </>
        ),
    },
];

const STAMPEDE_TEXT = [
    {
        title: "What goes wrong",
        href: "#what-goes-wrong",
        text: (
            <>
                One hot key expires and five hundred requests miss at once. The cache
                did not reduce load — it SYNCHRONISED it into a spike.
            </>
        ),
    },
    {
        title: "The lock",
        href: "#the-lock",
        text: (
            <>
                <Mono>SET lock:key 1 NX EX 10</Mono> — one request rebuilds, the rest
                sleep and find the value. The <Mono>EX</Mono> is the crash escape.
            </>
        ),
    },
    {
        title: "Walked through, request by request",
        href: "#walked-through-request-by-request",
        text: (
            <>
                Five hundred requests, one database query. The lock is named after the
                DATA, so they all collide — and collision is the point.
            </>
        ),
    },
];

const INVALIDATION_TEXT = [
    {
        title: "Delete or overwrite",
        href: "#delete-or-overwrite",
        text: (
            <>
                <Mono>DEL</Mono> and let the next read rebuild, or <Mono>SET</Mono> the
                new value. Delete is safer: it cannot cache a wrong one.
            </>
        ),
    },
    {
        title: "The order is a bug waiting to happen",
        href: "#the-order-is-a-bug-waiting-to-happen",
        text: (
            <>
                Cache first, database second lets a concurrent read cache the OLD row —
                with a fresh TTL. Database first, always.
            </>
        ),
    },
    {
        title: "Keys you forgot about",
        href: "#keys-you-forgot-about",
        text: (
            <>
                One update invalidates a list, a count and a fragment too. Derive every
                key in one helper, next to the write.
            </>
        ),
    },
];

const OUTAGE_TEXT = [
    {
        title: "Degrade to slow, not to broken",
        href: "#degrade-to-slow-not-to-broken",
        text: (
            <>
                Catch the cache read, fall through to the database. A limiter or a lock
                is NOT a cache — there the failure must surface.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof ASIDE_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const ASIDE: SummaryArticle[] = ASIDE_TEXT.map(withSeverities);
const TTL: SummaryArticle[] = TTL_TEXT.map(withSeverities);
const STAMPEDE: SummaryArticle[] = STAMPEDE_TEXT.map(withSeverities);
const INVALIDATION: SummaryArticle[] = INVALIDATION_TEXT.map(withSeverities);
const OUTAGE: SummaryArticle[] = OUTAGE_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("caching-patterns");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Cache-Aside", items: ASIDE },
                        { label: "Choosing a TTL", items: TTL },
                        { label: "The Stampede", items: STAMPEDE },
                        { label: "Invalidation on Write", items: INVALIDATION },
                        { label: "When Redis Is Down", items: OUTAGE },
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
                        redis · caching
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <CachingPatternsDocs />
            </article>
        </PageShell>
    );
}
