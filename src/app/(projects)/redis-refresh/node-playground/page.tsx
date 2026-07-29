import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    NodePlaygroundDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/node-playground";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// footer sections, so the rule holds for all seventeen without exception.
const CLIENT_TEXT = [
    {
        title: "ioredis",
        href: "#ioredis",
        text: (
            <>
                Every Redis command is a lowercase method taking the CLI&apos;s arguments
                in the CLI&apos;s order — and the import must be the named export.
            </>
        ),
    },
    {
        title: "One connection, not a pool",
        href: "#one-connection-not-a-pool",
        text: (
            <>
                A single thread executes one command at a time, so extra connections buy
                no parallelism; module caching makes the exported client the singleton.
            </>
        ),
    },
    {
        title: "Connection options",
        href: "#connection-options",
        text: (
            <>
                <Mono>lazyConnect</Mono>, <Mono>maxRetriesPerRequest</Mono> and{" "}
                <Mono>retryStrategy</Mono> turn a demonstration default into failure
                behaviour a service can survive.
            </>
        ),
    },
    {
        title: "Connection events",
        href: "#connection-events",
        text: (
            <>
                An <Mono>error</Mono> event is not a surrender — reconnection continues —
                but an unhandled one kills the Node process.
            </>
        ),
    },
];

const WRITING_TEXT = [
    {
        title: "Layers",
        href: "#layers",
        text: (
            <>
                Dependencies flow one way: only the repository imports the client, and a
                service reaching for <Mono>req</Mono> marks a leaked boundary.
            </>
        ),
    },
    {
        title: "Key builders",
        href: "#key-builders",
        text: (
            <>
                Every key comes from one builder file, so renaming a namespace is a
                one-file change rather than a search for template literals.
            </>
        ),
    },
    {
        title: "Repository",
        href: "#repository",
        text: (
            <>
                <Mono>hset</Mono> and <Mono>hgetall</Mono> are the commands verbatim;
                relative imports carry the <Mono>.ts</Mono> extension because there is no
                build step.
            </>
        ),
    },
    {
        title: "Serialization",
        href: "#serialization",
        text: (
            <>
                A hash is a flat string-to-string map, so numbers, booleans and dates are
                converted once in the model instead of at each call site.
            </>
        ),
    },
    {
        title: "Null is a normal outcome",
        href: "#null-is-a-normal-outcome",
        text: (
            <>
                An absent key is <Mono>null</Mono>, not an exception; turning that into a
                404 is a service decision, not a repository one.
            </>
        ),
    },
    {
        title: "String or hash",
        href: "#string-or-hash",
        text: (
            <>
                One type per key and one command family per type — JSON in a string is
                opaque to the server, a hash exposes addressable fields.
            </>
        ),
    },
];

const OBSERVING_TEXT = [
    {
        title: "MONITOR",
        href: "#monitor",
        text: (
            <>
                Every command from every client, with timestamp, database and arguments
                on the wire — and roughly half the throughput while attached.
            </>
        ),
    },
    {
        title: "Latency",
        href: "#latency",
        text: (
            <>
                <Mono>redis-cli --latency</Mono> samples round-trip time continuously; a
                rising average points at the server or the network, not the code.
            </>
        ),
    },
];

const JAVASCRIPT_TEXT = [
    {
        title: "Nullish coalescing",
        href: "#nullish-coalescing",
        text: (
            <>
                <Mono>??</Mono> falls back only on <Mono>null</Mono> and{" "}
                <Mono>undefined</Mono>, which is what configuration needs — <Mono>0</Mono>{" "}
                is a legitimate port.
            </>
        ),
    },
    {
        title: "Optional chaining",
        href: "#optional-chaining",
        text: (
            <>
                <Mono>?.</Mono> short-circuits on nullish values and returns{" "}
                <Mono>undefined</Mono>, covering property access, indexing and calls.
            </>
        ),
    },
    {
        title: "Logical assignment",
        href: "#logical-assignment",
        text: (
            <>
                <Mono>??=</Mono> fills in missing configuration,{" "}
                <Mono>&amp;&amp;=</Mono> transforms a value only when one is present.
            </>
        ),
    },
    {
        title: "Falsy and nullish",
        href: "#falsy-and-nullish",
        text: (
            <>
                Eight falsy values, two nullish ones — an empty array is truthy and an
                empty string is real stored data.
            </>
        ),
    },
    {
        title: "const and as const",
        href: "#const-and-as-const",
        text: (
            <>
                <Mono>const</Mono> fixes the binding, <Mono>as const</Mono> is a
                compile-time assertion that is erased at runtime.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof CLIENT_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const CLIENT: SummaryArticle[] = CLIENT_TEXT.map(withSeverities);
const WRITING: SummaryArticle[] = WRITING_TEXT.map(withSeverities);
const OBSERVING: SummaryArticle[] = OBSERVING_TEXT.map(withSeverities);
const JAVASCRIPT: SummaryArticle[] = JAVASCRIPT_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("node-playground");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Client", items: CLIENT },
                        { label: "Writing Data", items: WRITING },
                        { label: "Observing", items: OBSERVING },
                        { label: "JavaScript Notes", items: JAVASCRIPT },
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
                        redis · node
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <NodePlaygroundDocs />
            </article>
        </PageShell>
    );
}
