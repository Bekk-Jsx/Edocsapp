import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    InspectingTheKeyspaceDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/inspecting-the-keyspace";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// footer sections, so the rule holds for all twenty-one without exception.
const TYPE_TEXT = [
    {
        title: "Every key has exactly one type",
        href: "#every-key-has-exactly-one-type",
        text: (
            <>
                The type is fixed at creation and <Mono>TYPE</Mono> reports it — a sorted
                set is <Mono>zset</Mono>, a missing key is <Mono>none</Mono> rather than
                an error.
            </>
        ),
    },
    {
        title: "Command families follow the type",
        href: "#command-families-follow-the-type",
        text: (
            <>
                Once the type is known the prefix follows: <Mono>H</Mono> for hashes,{" "}
                <Mono>L</Mono>/<Mono>R</Mono> for lists, <Mono>S</Mono> for sets,{" "}
                <Mono>Z</Mono> for sorted sets.
            </>
        ),
    },
    {
        title: "WRONGTYPE",
        href: "#wrongtype",
        text: (
            <>
                A mismatched command is rejected, never coerced — but <Mono>SET</Mono>{" "}
                overwrites a key of any type and silently changes what it is.
            </>
        ),
    },
    {
        title: "Commands that ignore the type",
        href: "#commands-that-ignore-the-type",
        text: (
            <>
                The generic group works on the key, not the value; <Mono>UNLINK</Mono>{" "}
                frees in the background where <Mono>DEL</Mono> stalls the single thread.
            </>
        ),
    },
];

const TTL_TEXT = [
    {
        title: "Setting expiry",
        href: "#setting-expiry",
        text: (
            <>
                <Mono>EXPIRE</Mono> returns 1 or 0 for what it did, not for what exists;{" "}
                <Mono>SET ... EX</Mono> sets the expiry at write time.
            </>
        ),
    },
    {
        title: "Reading expiry",
        href: "#reading-expiry",
        text: (
            <>
                <Mono>TTL</Mono> has three answers: seconds left, <Mono>-1</Mono> for no
                expiry, <Mono>-2</Mono> for no key.
            </>
        ),
    },
    {
        title: "Losing a TTL",
        href: "#losing-a-ttl",
        text: (
            <>
                A plain <Mono>SET</Mono> discards the expiry without warning —{" "}
                <Mono>KEEPTTL</Mono> preserves it, and <Mono>PERSIST</Mono> is the only
                other way it goes.
            </>
        ),
    },
];

const SCAN_TEXT = [
    {
        title: "Why not KEYS",
        href: "#why-not-keys",
        text: (
            <>
                <Mono>KEYS *</Mono> is O(N) in one reply and freezes every other client;{" "}
                <Mono>SCAN</Mono> returns the same keys in batches.
            </>
        ),
    },
    {
        title: "Seeding a keyspace to scan",
        href: "#seeding-a-keyspace-to-scan",
        text: (
            <>
                A shell loop piped into <Mono>redis-cli --pipe</Mono> mass-inserts 2000
                keys — shell syntax, so it fails inside the CLI prompt.
            </>
        ),
    },
    {
        title: "The cursor",
        href: "#the-cursor",
        text: (
            <>
                A bookmark you hand back unchanged, not an offset or a page number. Start
                at 0, finish at 0 — and only 0 starts a walk.
            </>
        ),
    },
    {
        title: "A full walk",
        href: "#a-full-walk",
        text: (
            <>
                Each reply&apos;s cursor is the next call&apos;s argument; the numbers jump
                around and the keys arrive unsorted.
            </>
        ),
    },
    {
        title: "COUNT, MATCH, TYPE",
        href: "#count-match-type",
        text: (
            <>
                <Mono>COUNT</Mono> is a hint, <Mono>MATCH</Mono> filters after the batch,{" "}
                <Mono>TYPE</Mono> filters during the walk — and an empty batch is not the
                end.
            </>
        ),
    },
    {
        title: "What SCAN guarantees",
        href: "#what-scan-guarantees",
        text: (
            <>
                Keys present throughout are returned at least once, so duplicates are
                normal and there is no point-in-time snapshot.
            </>
        ),
    },
    {
        title: "The CLI shortcut",
        href: "#the-cli-shortcut",
        text: (
            <>
                <Mono>redis-cli --scan</Mono> runs the loop for you and prints one key per
                line, which composes with <Mono>wc -l</Mono> and <Mono>xargs</Mono>.
            </>
        ),
    },
    {
        title: "SCAN in Node",
        href: "#scan-in-node",
        text: (
            <>
                In node-redis v5 the cursor is a string and the reply is{" "}
                <Mono>{"{ cursor, keys }"}</Mono>; <Mono>scanIterator</Mono> now yields a
                batch per iteration.
            </>
        ),
    },
    {
        title: "HSCAN, SSCAN, ZSCAN",
        href: "#hscan-sscan-zscan",
        text: (
            <>
                The same protocol one level down: <Mono>SCAN</Mono> walks keys,{" "}
                <Mono>HSCAN</Mono> walks the fields inside one of them.
            </>
        ),
    },
];

const ENCODING_TEXT = [
    {
        title: "Type versus encoding",
        href: "#type-versus-encoding",
        text: (
            <>
                <Mono>TYPE</Mono> is the interface, <Mono>OBJECT ENCODING</Mono> is the
                structure in memory — and it changes on its own as the value grows.
            </>
        ),
    },
    {
        title: "Why the small form is faster",
        href: "#why-the-small-form-is-faster",
        text: (
            <>
                A listpack is a contiguous block scanned linearly — smaller and faster
                while small, which is why the hashtable only pays off at scale.
            </>
        ),
    },
    {
        title: "The thresholds",
        href: "#the-thresholds",
        text: (
            <>
                128 fields or one 64-byte value flips the whole hash, and the conversion
                is one-way — the key keeps the expensive encoding for life.
            </>
        ),
    },
    {
        title: "Encodings by type",
        href: "#encodings-by-type",
        text: (
            <>
                Each type has a small form and a large one; a set of pure integers gets{" "}
                <Mono>intset</Mono>, the cheapest structure in Redis.
            </>
        ),
    },
    {
        title: "String encodings",
        href: "#string-encodings",
        text: (
            <>
                <Mono>int</Mono>, <Mono>embstr</Mono> up to 44 bytes, then{" "}
                <Mono>raw</Mono> — reference only, with no configurable threshold.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof TYPE_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const TYPE: SummaryArticle[] = TYPE_TEXT.map(withSeverities);
const TTL: SummaryArticle[] = TTL_TEXT.map(withSeverities);
const SCAN: SummaryArticle[] = SCAN_TEXT.map(withSeverities);
const ENCODING: SummaryArticle[] = ENCODING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("inspecting-the-keyspace");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Type", items: TYPE },
                        { label: "TTL", items: TTL },
                        { label: "SCAN", items: SCAN },
                        { label: "Object Encoding", items: ENCODING },
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
                        redis · keyspace
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <InspectingTheKeyspaceDocs />
            </article>
        </PageShell>
    );
}
