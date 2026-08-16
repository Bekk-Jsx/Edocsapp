import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is one
// severity. No section here is, so every callout below is inline only.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (How It Works) ---
    // inline `tip · test it as raw JSON first` callout — no header treatment
    "what-elasticsearch-is": ["tip"],
    // inline `note · the cost moved, it did not disappear` callout
    "the-inverted-index": ["note"],
    // inline `note · the analogy is rough on purpose` callout
    "terminology-map": ["note"],

    // --- part 2 (What It's For) ---
    // inline `trap · index then search returns nothing` callout
    "near-real-time": ["trap"],
    // inline `danger · Elasticsearch as the only store` callout
    "what-it-s-good-at-bad-at": ["danger"],
    // inline `tip · a disposable index` callout
    "where-it-sits-in-this-stack": ["tip"],
};

// Top-level divider between the two halves of the page — mirrors the
// How It Works / What It's For groups in the summary rail. Deliberately louder
// than a DocSection eyebrow (bold, larger, full-width rule) so the split is
// obvious while scrolling: this is a grouping, not a section.
//
// Same file-local helper the redis first-commands content file defines for its
// own part dividers.
function PartHeading({
    kicker,
    children,
}: {
    kicker: string;
    children: string;
}) {
    return (
        <div className="mt-14 mb-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {kicker}
            </p>
            <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

// The same search, twice. Two fragments rather than one mixed block so each
// keeps its own highlighting — the point is that they are the same request, and
// that only reads if both are legible.
const CLIENT_CALL = `// the form the app uses
const res = await esClient.search({
    index: "movies",
    query: { match_all: {} },
});`;

const CURL_CALL = `# the same request, spelled out over HTTP
curl -X GET 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match_all": {} } }'`;

// Not executable — the shape of the index Lucene builds at write time.
const INVERTED = `"dark"   -> [doc 4, doc 87, doc 912]
"knight" -> [doc 4, doc 87]

search "dark knight"
  lookup "dark"    -> {4, 87, 912}
  lookup "knight"  -> {4, 87}
  intersect        -> {4, 87}      then score and sort`;

// Not executable — a translation table, not a set of equivalents.
const TERMS = `Elasticsearch      SQL database
--------------------------------
index          ~   table
document       ~   row        (JSON, not a tuple)
field          ~   column
mapping        ~   schema`;

const REFRESH = `PUT /movies/_doc/1 -d '{ "title": "Dune" }'
# { "result": "created" }        indexed, not yet searchable
GET /movies/_search
# "hits": []                     the refresh has not run

# ~1s later (index.refresh_interval, default 1s)
GET /movies/_search
# "hits": [ { "_id": "1", ... } ]

POST /movies/_refresh            # force one — tests only`;

// Not executable — the two columns are the whole decision. Lines are kept
// inside the frame on purpose: every other fragment on this page fits without
// scrolling, and this is the one a reader compares top to bottom.
const FIT = `good   full-text search   relevance, fuzziness, analyzers
       aggregations       facets, counts, stats
       read scale         replicas serve reads in parallel

bad    transactions       none across docs, no rollback
       reads              near real-time, no read-your-own-write
       updates            immutable segments -> delete + reindex
       recovery           derived data — rebuilt from the database`;

const STACK = `CouchDB  =  source of truth   (writes go here)
   |
   |  changes feed
   v
Elasticsearch  =  search layer  (derived, disposable, rebuildable)`;

export function IntroductionDocs() {
    return (
        <>
            {/* ---------- part 1 — the engine and the index under it ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">How It Works</PartHeading>
            <div>
                <DocSection title="what elasticsearch is">
                    <CodeBlock code={CLIENT_CALL} lang="ts" />
                    <CodeBlock code={CURL_CALL} lang="bash" />
                    <p>
                        <Term>
                            Elasticsearch is a distributed search and analytics engine
                            built on Apache Lucene.
                        </Term>{" "}
                        Lucene does the indexing and the scoring; Elasticsearch makes it a
                        server — sharded, replicated, and spoken to over the network.
                    </p>
                    <p>
                        <Term>Every operation is an HTTP call with a JSON body.</Term>{" "}
                        Searching, indexing, changing a mapping, checking cluster health:
                        all of it is a request to a URL. The Node client is a typed wrapper
                        that builds exactly that request.
                    </p>

                    <Callout severity="tip" label="tip · test it as raw JSON first">
                        <p>
                            Anything unclear in the client can be sent as raw JSON with{" "}
                            <Code>curl</Code>{" "}
                            or in Kibana&apos;s Dev Tools, then translated back. The error messages come from the server either way, and
                            the documentation is written in the HTTP form.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the inverted index">
                    <CodeBlock code={INVERTED} lang="text" />
                    <p>
                        <Term>
                            A database answers <Code>LIKE &apos;%dark%&apos;</Code> by
                            scanning rows
                        </Term>{" "}
                        — it reads the column value by value, because a B-tree index on
                        that column cannot help a match that starts in the middle of the
                        text.
                    </p>
                    <p>
                        <Term>Lucene does the work at index time instead.</Term> Text is{" "}
                        tokenized into terms as the document is written, and each term
                        stores the list of documents containing it. A search is a term
                        lookup, an intersection of the lists, and a scoring pass — never a
                        scan.
                    </p>

                    <Callout severity="note" label="note · the cost moved, it did not disappear">
                        <p>
                            Reads are fast because writes are expensive: every indexed
                            document is analysed, split into terms, and merged into the
                            index. Elasticsearch shifts the cost from read time to write
                            time, which is a bargain for data read far more often than it
                            is written.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="terminology map">
                    <CodeBlock code={TERMS} lang="text" />
                    <p>
                        <Term>
                            An index holds documents, a document is a JSON object, its keys
                            are fields, and the mapping declares how each field is stored.
                        </Term>{" "}
                        That is the whole vocabulary; the rest of the API is built on those
                        four words.
                    </p>

                    <Callout severity="note" label="note · the analogy is rough on purpose">
                        <p>
                            An index is not a table — a document is a nested JSON tree, not
                            a flat tuple, and a mapping is inferred on first write rather
                            than declared up front. The analogy is still how everyone
                            speaks, so it is worth having, as long as it is not trusted
                            past the first conversation.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — what the trade gets you, and what it costs ---------- */}
            <PartHeading kicker="part 2">What It&apos;s For</PartHeading>
            <div>
                <DocSection title="near real-time">
                    <CodeBlock code={REFRESH} lang="bash" />
                    <p>
                        <Term>
                            An indexed document becomes searchable at the next refresh, not
                            at the moment it is written.
                        </Term>{" "}
                        The refresh runs every second by default, so the usual delay is
                        under a second — near real-time, not real-time.
                    </p>
                    <p>
                        <Term>The delay buys write throughput.</Term> A refresh opens a new
                        Lucene segment; doing it per document would mean a segment per
                        document. Batching that work is what makes bulk indexing viable.
                    </p>

                    <Callout severity="trap" label="trap · index, search, zero hits">
                        <p>
                            The classic failing test: index a document, search for it on the
                            next line, get nothing back. Nothing is broken — the refresh has
                            not run. Pass <Code>refresh: &quot;wait_for&quot;</Code> on the
                            write, or call <Code>POST /index/_refresh</Code> in the test.
                            Never force a refresh per write in production.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="what it's good at / bad at">
                    <CodeBlock code={FIT} lang="text" />
                    <p>
                        <Term>Good at reading text and summarising it.</Term> Relevance
                        ranking, fuzziness, per-language analysis and multi-field matching
                        are the core; aggregations answer the counts, facets and statistics
                        a search UI is built from; replicas scale reads by serving them in
                        parallel.
                    </p>
                    <p>
                        <Term>Bad at being the system of record.</Term> There are no
                        multi-document transactions and no rollback. Reads are near
                        real-time, so read-your-own-write is not guaranteed. Lucene segments
                        are immutable, so an update is a delete plus a reindex of the whole
                        document — changing one field rewrites all of them.
                    </p>

                    <Callout severity="danger" label="danger · elasticsearch as the only store">
                        <p>
                            Elasticsearch is a derived store: the recovery plan for a broken
                            or badly mapped index is to rebuild it from the real database.
                            If Elasticsearch <em>is</em> the database, there is nothing to
                            rebuild from — the mapping mistake and the data loss are the
                            same event.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="where it sits in this stack">
                    <CodeBlock code={STACK} lang="text" />
                    <p>
                        <Term>CouchDB owns the data; Elasticsearch owns the search.</Term>{" "}
                        Writes go to CouchDB, and its changes feed drives an indexing
                        pipeline that projects those documents into Elasticsearch. Queries
                        that need relevance, facets or fuzziness go to the index; everything
                        authoritative comes from the database.
                    </p>
                    <p>
                        <Term>The same engine is used well beyond product search</Term> —
                        log analytics (the ELK stack), metrics and APM, geo queries, and
                        vector search for semantic matching.
                    </p>

                    <Callout severity="tip" label="tip · a disposable index">
                        <p>
                            The index script can wipe and rebuild the whole index from
                            CouchDB at any time, and that is the design rather than a
                            workaround. It is what makes a mapping change, a bad deploy or a
                            corrupted index an inconvenience instead of an incident.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside both parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            Why is Elasticsearch faster than a database for text search?
                        </>
                    }
                    a={
                        <>
                            &ldquo;Because it queries an <Term>inverted index</Term> — text
                            is <Term>tokenized</Term> at index time, so a search is a{" "}
                            <Term>term lookup</Term>, not a table scan. We shift the cost
                            from read time to write time.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                Why don&apos;t you just store everything in Elasticsearch and
                                drop CouchDB?
                            </>
                        }
                        a={
                            <>
                                &ldquo;Elasticsearch is a <Term>derived store</Term>, not a{" "}
                                <Term>system of record</Term> — no transactions, and updates
                                rewrite whole documents because segments are immutable. We
                                keep the database as the <Term>source of truth</Term> and
                                treat the index as <Term>disposable</Term>{" "}
                                and rebuildable.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
