import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    HashesDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/hashes";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the pinned footer
// section, "the same commands in Node", which always renders last and is
// deliberately NOT in the rail: it restates the CLI above rather than adding an idea.
const WRITING_TEXT = [
    {
        title: "HSET",
        href: "#hset",
        text: (
            <>
                The reply counts <em>new</em> fields, not written ones — and unlike{" "}
                <Mono>SET</Mono> on a string it adds a field instead of replacing the hash.
            </>
        ),
    },
    {
        title: "The command family",
        href: "#the-command-family",
        text: (
            <>
                Everything applying to a hash starts with <Mono>H</Mono>; three of the
                seven read, and choosing between them is the rest of the page.
            </>
        ),
    },
];

const READING_TEXT = [
    {
        title: "HGET and the ambiguous nil",
        href: "#hget-and-the-ambiguous-nil",
        text: (
            <>
                A missing field and a missing key both return <Mono>(nil)</Mono> — use{" "}
                <Mono>EXISTS</Mono> or <Mono>HEXISTS</Mono> when the difference matters.
            </>
        ),
    },
    {
        title: "HGETALL",
        href: "#hgetall",
        text: (
            <>
                A flat alternating list the client pairs into an object, and every value
                arrives as a string — <Mono>age: &apos;30&apos;</Mono>, never <Mono>30</Mono>.
            </>
        ),
    },
    {
        title: "HMGET",
        href: "#hmget",
        text: (
            <>
                One reply slot per field asked for, in order, with <Mono>(nil)</Mono>{" "}
                holding the place of the missing ones.
            </>
        ),
    },
    {
        title: "Why HMGET when HGETALL exists",
        href: "#why-hmget-when-hgetall-exists",
        text: (
            <>
                A full fetch transfers and parses fields you never use; a projection asks
                for what you need. The same argument as <Mono>SCAN</Mono> over{" "}
                <Mono>KEYS</Mono>.
            </>
        ),
    },
];

const DELETING_TEXT = [
    {
        title: "HDEL",
        href: "#hdel",
        text: (
            <>
                The reply counts fields actually removed — and deleting the last one
                deletes the key, taking any TTL on it along.
            </>
        ),
    },
    {
        title: "HEXISTS",
        href: "#hexists",
        text: (
            <>
                A yes/no question with no value crossing the wire, which beats fetching a
                field in order to test whether it is there.
            </>
        ),
    },
];

const ATOMIC_TEXT = [
    {
        title: "HINCRBY",
        href: "#hincrby",
        text: (
            <>
                One atomic step replaces read-modify-write, so no lost update — but the
                field still has to parse as an integer.
            </>
        ),
    },
];

const TTL_TEXT = [
    {
        title: "Expiring a single field",
        href: "#expiring-a-single-field",
        text: (
            <>
                Per-field TTL instead of all-or-nothing at the key level, and{" "}
                <Mono>FIELDS</Mono> wants the field count before the names.
            </>
        ),
    },
    {
        title: "Reading and removing field TTL",
        href: "#reading-and-removing-field-ttl",
        text: (
            <>
                <Mono>HTTL</Mono> answers per field with the same three values as{" "}
                <Mono>TTL</Mono>; <Mono>HPERSIST</Mono> drops the expiry and keeps the
                field.
            </>
        ),
    },
];

const LIMITS_TEXT = [
    {
        title: "Hashes do not nest",
        href: "#hashes-do-not-nest",
        text: (
            <>
                A field holds a plain string and nothing else, so nesting means flattening
                into a key of its own — <Mono>user:1:address</Mono>.
            </>
        ),
    },
    {
        title: "Wide hashes",
        href: "#wide-hashes",
        text: (
            <>
                <Mono>HGETALL</Mono> on 100,000 fields blocks the single thread; walk it
                with <Mono>HSCAN</Mono> or name the fields with <Mono>HMGET</Mono>.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof WRITING_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const WRITING: SummaryArticle[] = WRITING_TEXT.map(withSeverities);
const READING: SummaryArticle[] = READING_TEXT.map(withSeverities);
const DELETING: SummaryArticle[] = DELETING_TEXT.map(withSeverities);
const ATOMIC: SummaryArticle[] = ATOMIC_TEXT.map(withSeverities);
const TTL: SummaryArticle[] = TTL_TEXT.map(withSeverities);
const LIMITS: SummaryArticle[] = LIMITS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("hashes");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Writing", items: WRITING },
                        { label: "Reading", items: READING },
                        { label: "Deleting and Testing", items: DELETING },
                        { label: "Atomic Field Updates", items: ATOMIC },
                        { label: "Field TTL (7.4+)", items: TTL },
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
                        redis · hashes
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <HashesDocs />
            </article>
        </PageShell>
    );
}
