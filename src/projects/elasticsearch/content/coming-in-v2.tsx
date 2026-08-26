import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";

// Roadmap for v2 — a project page, not a docs page: same section and prose
// styles as the chapters, but no severity map, no summary rail and no code,
// because there is nothing here to demonstrate yet. Order is priority order.
//
// Same shape as the hooks project's about-next-version content file, which is
// the template every project's next-version page follows.
export function ComingInV2Docs() {
    return (
        <>
            <DocSection title="sync beyond couchdb (priority)">
                <p>
                    <Term>Change Data Capture.</Term>{" "}CouchDB handed us{" "}
                    <Code>_changes</Code>{" "}for free — an ordered log of every write,
                    exposed over HTTP, with a cursor. No SQL database has that
                    endpoint, so the same pipeline has to be rebuilt on top of what
                    each one does offer, which is the general problem called CDC.
                </p>
                <p>
                    <Term>Postgres.</Term>{" "}Logical replication and the WAL, read
                    either directly through a replication slot or through Debezium.
                    The write-ahead log is the closest thing Postgres has to a changes
                    feed, and the checkpoint becomes an LSN instead of a sequence.
                </p>
                <p>
                    <Term>MySQL.</Term>{" "}The binlog, again usually via Debezium —
                    row-based events, with the same at-least-once delivery and the
                    same need for idempotent processing on the far end.
                </p>
                <p>
                    <Term>MongoDB.</Term>{" "}Change streams, which are the closest
                    relative of CouchDB&apos;s feed: a resumable cursor with a token
                    that plays exactly the role <Code>last_seq</Code>{" "}played in the
                    sync chapter.
                </p>
                <p>
                    <Term>Kafka as the buffer.</Term>{" "}Where the database and the
                    index shouldn&apos;t be coupled directly — a topic between them,
                    so the sync can be down, replayed or forked into a second consumer
                    without the source ever noticing.
                </p>

                <Callout severity="note" label="note · the chapter generalises">
                    <p>
                        Every gap the CouchDB Sync page closed — the persisted
                        checkpoint, idempotent writes, dead-lettering a poison
                        document, catching precisely — is the same in all four. This
                        topic is the existing chapter with its one CouchDB-specific
                        assumption removed.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="hosting & deployment">
                <p>
                    <Term>Where it runs.</Term>{" "}Self-hosted, Elastic Cloud, or
                    OpenSearch — including the fork and the licence change behind it,
                    which is the question actually being asked when someone asks
                    &ldquo;why OpenSearch?&rdquo; in an interview.
                </p>
                <p>
                    <Term>A real multi-node setup.</Term>{" "}Node roles —
                    master-eligible, data, coordinating — and why three
                    master-eligible nodes is the number everyone repeats: a quorum
                    needs an odd count above one, and two nodes cannot tell a dead
                    peer from an unreachable one without risking split brain.
                </p>
                <p>
                    <Term>Memory rules.</Term>{" "}Heap at most half of RAM, so the
                    filesystem cache keeps the other half, and never above roughly
                    32GB, where the JVM loses compressed object pointers and a bigger
                    heap starts holding less.
                </p>
            </DocSection>

            <DocSection title="security">
                <p>
                    <Term>The part v1 skipped entirely.</Term>{" "}Every Docker command
                    in this project runs an open cluster with no authentication,
                    which is fine on a laptop and indefensible anywhere else.
                </p>
                <p>
                    <Term>What it should cover.</Term>{" "}Authentication and built-in
                    users, API keys for service-to-service access, TLS between nodes
                    and to clients, and index-level permissions so the search app
                    cannot delete what it only needs to read.
                </p>
                <p>
                    <Term>And why it matters.</Term>{" "}An exposed{" "}
                    <Code>:9200</Code>{" "}is one of the most famous breach patterns
                    there is — years of open clusters indexed by public scanners,
                    every document readable and deletable by anyone who found the
                    port.
                </p>
            </DocSection>

            <DocSection title="production war stories">
                <p>
                    <Term>Symptom, cause, fix.</Term>{" "}The failures that only happen
                    with real traffic, written in the shape you meet them in: what it
                    looked like first, what was actually wrong, and what fixed it.
                </p>
                <p>
                    <Term>The list.</Term>{" "}Deep pagination melting the heap;
                    mapping explosion from unbounded dynamic fields; split brain in a
                    badly sized cluster; disk watermarks turning a cluster red one
                    node at a time; a reindex run under load and starving the searches
                    beside it.
                </p>
            </DocSection>

            <DocSection title="ilm & index patterns at scale">
                <p>
                    <Term>Indexes that are born and die on a schedule.</Term>{" "}
                    Time-based indexes, rollover on size or age, and the hot/warm/cold
                    and delete phases of Index Lifecycle Management.
                </p>
                <p>
                    <Term>Why it exists.</Term>{" "}Logs and metrics are the workload
                    that made it necessary: yesterday&apos;s index is never written to
                    again and last month&apos;s is deleted whole, which is enormously
                    cheaper than deleting documents. It is the pattern underneath ELK,
                    and the reason an index name so often ends in a date.
                </p>
            </DocSection>

            <DocSection title="vector & semantic search">
                <p>
                    <Term>Where search is going.</Term>{" "}
                    <Code>dense_vector</Code>{" "}fields, kNN retrieval, and hybrid
                    ranking that combines BM25 with vector similarity so that exact
                    terms and semantic closeness both count.
                </p>
                <p>
                    <Term>Scope, honestly.</Term>{" "}One page that explains the
                    mapping, the query and the trade-offs — not a course on
                    embeddings. Enough to know when it is the right tool and what it
                    costs to run.
                </p>
            </DocSection>

            <DocSection title="monitoring">
                <p>
                    <Term>What to watch.</Term>{" "}JVM heap and GC pauses, query
                    latency as percentiles rather than averages, rejected threads in
                    the search and write pools, and disk usage against the watermarks.
                </p>
                <p>
                    <Term>And what to alert on.</Term>{" "}The thresholds that are
                    worth waking someone for, separated from the ones that only matter
                    in a dashboard — the difference between a cluster that is degraded
                    and one that is about to stop answering.
                </p>
            </DocSection>
        </>
    );
}
