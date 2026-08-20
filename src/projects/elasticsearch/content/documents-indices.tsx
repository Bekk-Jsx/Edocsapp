import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is one
// severity. Exactly one section here is: "bulk: 200 but failed", whose whole
// subject is the trap. See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Documents) ---
    // inline `danger · an id you already used`, `trap · the doc wrapper`
    // and `note · the path chooses the operation` callouts
    "document-crud": ["danger", "trap", "note"],
    // inline `trap · the body ends with a newline` and `note · one line, one op`
    "bulk-the-wire-format": ["trap", "note"],
    // header-flagged `trap` — the whole section is the trap — plus an inline
    // `danger · a dropped document looks like a success` callout
    "bulk-200-but-failed": ["trap", "danger"],
    // inline `note · what retries and what does not` and `tip · which one to reach for`
    "helpers-bulk-the-production-way": ["tip", "note"],
    // inline `trap · bigger batches are not faster` and `danger · raising the queue`
    "batch-sizing-429": ["danger", "trap"],

    // --- part 2 (Indices) ---
    // inline `note · get is not search` and `tip · refresh in tests`
    "refresh-explained": ["tip", "note"],
    // inline `trap · the refresh you forgot` callout
    "imports-switch-refresh-off": ["trap"],
    // inline `danger · dynamic mapping in production` and `note · two PUTs`
    "index-lifecycle": ["danger", "note"],
    // inline `tip · alias from day one` and `note · where cineverse stands`
    aliases: ["tip", "note"],
};

// Top-level divider between the two halves of the page — mirrors the
// Documents / Indices groups in the summary rail. Deliberately louder than a
// DocSection eyebrow (bold, larger, full-width rule) so the split is obvious
// while scrolling: this is a grouping, not a section.
//
// Same file-local helper the other elasticsearch content files each define for
// their own part dividers.
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

// PAGE RULES, applied to every section below.
//
// 1. A section opens with prose: the reader knows what it is about before any
//    fragment appears.
// 2. Every fragment is introduced by the sentence above it and read by the
//    sentence below it where it has a result. Two fragments never touch.
// 3. Every operation appears in both forms — the Node client call and the curl
//    that goes over the wire — client first, except where the wire format is
//    itself the subject. `helpers.bulk` is the one operation with no curl
//    equivalent, because it is client-side orchestration rather than a request;
//    that is stated where it occurs.

const WRITE_ID_TS = `await esClient.index({
    index: "movies",
    id: "603692",
    document: {
        title: "John Wick: Chapter 4",
        vote_average: 7.7,
    },
});`;

const WRITE_ID_CURL = `curl -X PUT 'localhost:9200/movies/_doc/603692' \\
  -H 'Content-Type: application/json' \\
  -d '{ "title": "John Wick: Chapter 4", "vote_average": 7.7 }'`;

const WRITE_AUTO_TS = `await esClient.index({ index: "movies", document: movie });`;

const WRITE_AUTO_CURL = `curl -X POST 'localhost:9200/movies/_doc' \\
  -H 'Content-Type: application/json' \\
  -d '{ ... }'
# "_id": "kLm4pIgBv2QhT1z9" — generated`;

const CREATE_TS = `await esClient.create({
    index: "movies",
    id: "603692",
    document: movie,
});`;

const CREATE_CURL = `curl -X PUT 'localhost:9200/movies/_create/603692' \\
  -H 'Content-Type: application/json' \\
  -d '{ ... }'
# 409 version_conflict_engine_exception if 603692 exists`;

const GET_TS = `await esClient.get({ index: "movies", id: "603692" });`;

const GET_CURL = `curl -X GET 'localhost:9200/movies/_doc/603692'`;

// The reply to a get: the document, wrapped in the metadata the index keeps
// about it.
const GET_REPLY = `{
  "_index": "movies",
  "_id": "603692",
  "_version": 3,
  "found": true,
  "_source": {
    "title": "John Wick: Chapter 4",
    "vote_average": 8.0
  }
}`;

const UPDATE_TS = `await esClient.update({
    index: "movies",
    id: "603692",
    doc: { vote_average: 8.0 },   // the merge patch
});`;

const UPDATE_CURL = `curl -X POST 'localhost:9200/movies/_update/603692' \\
  -H 'Content-Type: application/json' \\
  -d '{ "doc": { "vote_average": 8.0 } }'`;

const DELETE_TS = `await esClient.delete({ index: "movies", id: "603692" });`;

const DELETE_CURL = `curl -X DELETE 'localhost:9200/movies/_doc/603692'
# 404 not_found if it was never there`;

const VERSION_TS = `await esClient.index({
    index: "movies",
    id: "603692",
    document: movie,
    if_seq_no: 12,
    if_primary_term: 1,
});`;

const VERSION_CURL = `curl -X PUT -d '{ ... }' \\
'localhost:9200/movies/_doc/603692?if_seq_no=12&if_primary_term=1'
# 409 if anything wrote to the document since seq_no 12`;

// NDJSON, not JSON. Every line is a complete document, and the body ends with
// a newline — the blank last line here is that newline, not a typo.
const BULK_CURL = `curl -X POST 'localhost:9200/_bulk' \\
  -H 'Content-Type: application/x-ndjson' \\
  --data-binary '
{"index":{"_index":"movies","_id":"603692"}}
{"title":"John Wick: Chapter 4","vote_average":7.7}
{"index":{"_index":"movies","_id":"693134"}}
{"title":"Dune: Part Two","vote_average":8.2}
{"delete":{"_index":"movies","_id":"11"}}
'`;

const BULK_TS = `// one array element = one line on the wire
const operations = movies.flatMap((m) => [
    { index: { _index: "movies", _id: String(m.tmdb_id) } },
    m,
]);

const result = await esClient.bulk({ operations });`;

const BULK_REPLY = `{
  "took": 42,
  "errors": true,
  "items": [
    { "index": { "_id": "603692", "status": 201,
                 "result": "created" } },
    { "index": { "_id": "693134", "status": 400,
                 "error": {
                   "type": "document_parsing_exception",
                   "reason": "failed to parse [vote_average]"
                 } } }
  ]
}`;

const BULK_CHECK = `const result = await esClient.bulk({ operations });

if (result.errors) {
    for (const item of result.items) {
        if (!item.index?.error) continue;
        console.error(item.index._id, item.index.error.reason);
    }
}`;

const HELPERS_TS = `const summary = await esClient.helpers.bulk({
    datasource: movies,      // raw docs, no action lines
    onDocument: (m) => ({
        index: { _index: "movies", _id: String(m.tmdb_id) },
    }),
    flushBytes: 5_000_000,   // cut a request every ~5MB
    retries: 3,              // 429s only
    onDrop: ({ document, error }) => {
        console.error("DROPPED", document.tmdb_id, error.reason);
    },
});`;

const HELPERS_OUT = `DROPPED 693134 failed to parse field [vote_average]

{ total: 3, successful: 2, failed: 1,
  retry: 0, time: 84, bytes: 1462 }`;

// One request, two outcomes — this is the shape a rejection arrives in.
const REJECT_REPLY = `"items": [
  { "index": { "_id": "603692", "status": 201 } },
  { "index": { "_id": "693134", "status": 429,
               "error": {
                 "type": "es_rejected_execution_exception",
                 "reason": "rejected execution, queue full"
               } } }
]`;

const REJECT_TS = `await esClient.helpers.bulk({
    datasource: movies,
    onDocument: toIndexAction,
    flushBytes: 5_000_000,   // payload size, not a count
    concurrency: 1,          // fewer requests in flight
    retries: 3,
});`;

const REFRESH_FLOW = `index a document
      |
      v
[ in-memory buffer ]     written, invisible to search
      |
      |  refresh — every 1s by default
      v
[ lucene segment ]       searchable`;

const REFRESH_TS = `const write = { index: "movies", id, document };

// false — the default: searchable at the next refresh
await esClient.index(write);

// true — cut a segment now. Tests.
await esClient.index({ ...write, refresh: true });

// "wait_for" — return once the next refresh has run
await esClient.index({ ...write, refresh: "wait_for" });`;

const REFRESH_CURL = `curl -X PUT 'localhost:9200/movies/_doc/1?refresh=true' \\
  -d '{ ... }'
curl -X PUT 'localhost:9200/movies/_doc/1?refresh=wait_for' \\
  -d '{ ... }'
curl -X POST 'localhost:9200/movies/_refresh'`;

const IMPORT_TS = `await esClient.indices.putSettings({
    index: "movies",
    settings: { refresh_interval: "-1" },
});

await importEveryMovie();

await esClient.indices.putSettings({
    index: "movies",
    settings: { refresh_interval: "1s" },
});
await esClient.indices.refresh({ index: "movies" });`;

const IMPORT_CURL = `# 1 — stop refreshing
curl -X PUT 'localhost:9200/movies/_settings' \\
  -H 'Content-Type: application/json' \\
  -d '{ "index": { "refresh_interval": "-1" } }'

# 2 — import: bulk, bulk, bulk...

# 3 — restore, then refresh once by hand
curl -X PUT 'localhost:9200/movies/_settings' \\
  -d '{ "index": { "refresh_interval": "1s" } }'
curl -X POST 'localhost:9200/movies/_refresh'`;

const IMPORT_TIMELINE = `20s import, refresh_interval 1s
  |--r--r--r--r--r--r--r--r--r--r--|   ~20 refreshes

20s import, refresh_interval -1
  |---------------------------------r|  one, at the end`;

const LIFECYCLE_TS = `if (!(await esClient.indices.exists({ index: "movies" }))) {
    await esClient.indices.create({
        index: "movies",
        mappings: {
            properties: {
                title: { type: "text" },
                vote_average: { type: "float" },
            },
        },
    });
}

await esClient.indices.delete({ index: "movies" });`;

const LIFECYCLE_CURL = `curl -I 'localhost:9200/movies'   # 200 exists / 404 missing

curl -X PUT 'localhost:9200/movies' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": {
          "title": { "type": "text" },
          "vote_average": { "type": "float" } } } }'

curl -X DELETE 'localhost:9200/movies'`;

const INSPECT_TS = `await esClient.indices.get({ index: "movies" });   // mappings + settings
await esClient.cat.indices({ v: true, format: "txt" });`;

const INSPECT_CURL = `curl 'localhost:9200/movies'      # mappings + settings
curl 'localhost:9200/_cat/indices?v'`;

const CAT_OUT = `health status index   docs.count  store.size
yellow open   movies        12043       6.1mb`;

const ALIAS_ADD_TS = `await esClient.indices.create({ index: "movies_v1" });

await esClient.indices.updateAliases({
    actions: [{ add: { index: "movies_v1", alias: "movies" } }],
});`;

const ALIAS_ADD_CURL = `curl -X PUT 'localhost:9200/movies_v1'

curl -X POST 'localhost:9200/_aliases' \\
  -H 'Content-Type: application/json' \\
  -d '{ "actions": [
    { "add": { "index": "movies_v1", "alias": "movies" } }
  ] }'`;

const ALIAS_SWAP_TS = `await esClient.indices.updateAliases({
    actions: [
        { remove: { index: "movies_v1", alias: "movies" } },
        { add: { index: "movies_v2", alias: "movies" } },
    ],
});`;

const ALIAS_SWAP_CURL = `# one request, so there is no instant without "movies"
curl -X POST 'localhost:9200/_aliases' \\
  -H 'Content-Type: application/json' \\
  -d '{ "actions": [
    { "remove": { "index": "movies_v1", "alias": "movies" } },
    { "add":    { "index": "movies_v2", "alias": "movies" } }
  ] }'`;

const ALIAS_USE_TS = `// every API takes the alias where it takes an index name
await esClient.search({
    index: "movies",
    query: { match_all: {} },
});`;

const ALIAS_USE_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match_all": {} } }'`;

export function DocumentsIndicesDocs() {
    return (
        <>
            {/* ---------- part 1 — one document, then a great many ---------- */}
            <PartHeading kicker="part 1">Documents</PartHeading>
            <div>
                <DocSection title="document crud">
                    <p>
                        Writing, reading, changing and deleting a single document is the
                        whole document API, and it holds two surprises worth knowing
                        before the first import: an index write replaces rather than
                        merges, and the id you choose decides whether re-running a script
                        is safe. Everything the sync pipeline does is built from these
                        calls.
                    </p>
                    <p>
                        The common write names the id itself — here the movie&apos;s TMDB
                        id.
                    </p>
                    <CodeBlock code={WRITE_ID_TS} lang="ts" />
                    <p>The same request over the wire:</p>
                    <CodeBlock code={WRITE_ID_CURL} lang="bash" />
                    <p>
                        <Term>
                            Indexing with an id you have already used is a full replace.
                        </Term>{" "}
                        The stored <Code>_source</Code>{" "}is thrown away and written again
                        from what you sent — fields you left out are not kept, because
                        nothing is merged.
                    </p>
                    <p>
                        Leaving the id out is the other form: Elasticsearch invents one.
                    </p>
                    <CodeBlock code={WRITE_AUTO_TS} lang="ts" />
                    <p>Over the wire that is a POST to the collection, not a PUT:</p>
                    <CodeBlock code={WRITE_AUTO_CURL} lang="bash" />
                    <p>
                        <Term>Generated ids suit data that has none.</Term>{" "}That is logs,
                        where every line is new. It is wrong for anything synced from
                        another store: run the import twice and every movie is in the
                        index twice. A deterministic id — cineverse uses the{" "}
                        <Code>tmdb_id</Code>{" "}— makes the write idempotent, so
                        re-indexing overwrites instead of duplicating.
                    </p>
                    <p>
                        When a write must never overwrite, <Code>create</Code>{" "}is the
                        same operation with a guard.
                    </p>
                    <CodeBlock code={CREATE_TS} lang="ts" />
                    <p>The path changes, and so does the failure mode:</p>
                    <CodeBlock code={CREATE_CURL} lang="bash" />
                    <p>
                        It behaves identically to <Code>index</Code>{" "}while the id is
                        free, and answers <Code>409 version_conflict</Code>{" "}once it is
                        taken.
                    </p>

                    <Callout severity="danger" label="danger · an id you already used">
                        <p>
                            There is no partial write and no warning. Indexing{" "}
                            <Code>{`{ vote_average: 8.0 }`}</Code>{" "}against an existing
                            movie leaves a document with one field — the title, the poster
                            and everything else are gone. Send the whole document, or use
                            the update API.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the path chooses the operation">
                        <p>
                            The HTTP verb does not decide what happens; the path does.{" "}
                            <Code>_doc</Code> versus <Code>_create</Code>{" "}is the
                            operation — replace-allowed versus create-only.{" "}
                            <Code>PUT</Code> versus <Code>POST</Code>{" "}is only whether you
                            named the id or left it to Elasticsearch.
                        </p>
                    </Callout>

                    <p>
                        Reading one document back is a get by id, which is a different
                        path from search entirely.
                    </p>
                    <CodeBlock code={GET_TS} lang="ts" />
                    <p>Over the wire it is the same URL the write used:</p>
                    <CodeBlock code={GET_CURL} lang="bash" />
                    <p>
                        <Term>A get bypasses search and is real-time.</Term>{" "}It reads
                        the document straight out of the index, so there is no refresh
                        delay — a document is gettable the instant it is written, long
                        before a search can find it.
                    </p>
                    <p>What comes back is the document wrapped in its metadata:</p>
                    <CodeBlock code={GET_REPLY} lang="json" />
                    <p>
                        <Code>_index</Code>, <Code>_id</Code> and <Code>_version</Code>{" "}
                        are the index&apos;s own bookkeeping;{" "}
                        <Code>_source</Code>{" "}is the JSON you originally sent, stored
                        verbatim.
                    </p>
                    <p>
                        Changing one field without resending the document is the update
                        API, whose body is a merge patch.
                    </p>
                    <CodeBlock code={UPDATE_TS} lang="ts" />
                    <p>The patch travels under a wrapper, which curl makes obvious:</p>
                    <CodeBlock code={UPDATE_CURL} lang="bash" />
                    <p>
                        <Term>Update merges; the engine still rewrites.</Term>{" "}The patch
                        is applied to <Code>_source</Code>, but the result is indexed as a
                        new document and the old one is marked deleted — Lucene segments
                        are immutable, so there is no such thing as editing a field in
                        place.
                    </p>
                    <p>Deleting is the same story, addressed by id.</p>
                    <CodeBlock code={DELETE_TS} lang="ts" />
                    <p>And over the wire, with the answer for a document never stored:</p>
                    <CodeBlock code={DELETE_CURL} lang="bash" />

                    <Callout severity="trap" label="trap · the doc wrapper">
                        <p>
                            The update body is <Code>{`{ "doc": { ... } }`}</Code>, not the
                            fields on their own. Sending the fields bare is a{" "}
                            <Code>400</Code>{" "}— and the Node client is no protection
                            here, since <Code>document</Code>{" "}(index) and{" "}
                            <Code>doc</Code>{" "}(update) are one letter apart.
                        </p>
                    </Callout>

                    <p>
                        <Term>Every write bumps <Code>_version</Code>.</Term>{" "}To make a
                        write conditional on nobody having changed the document first,
                        send the sequence numbers from the copy you read.
                    </p>
                    <CodeBlock code={VERSION_TS} lang="ts" />
                    <p>Over the wire they are query parameters:</p>
                    <CodeBlock code={VERSION_CURL} lang="bash" />
                    <p>
                        A mismatch is a <Code>409</Code>. It is optimistic locking, the
                        same bargain as CouchDB&apos;s <Code>_rev</Code>, and it rarely
                        comes up while a single pipeline owns the writes.
                    </p>
                </DocSection>

                <DocSection title="bulk: the wire format">
                    <p>
                        One request per document is death by round-trips:{" "}
                        <Code>_bulk</Code>{" "}packs many operations into a single request,
                        and an import that took minutes as individual writes takes
                        seconds. Its body is the part worth reading carefully, because it
                        is not JSON and the client&apos;s convenient array hides that.
                    </p>
                    <p>
                        This is the format on the wire — the one place on this page where
                        curl comes first, because the shape of the body is the subject.
                    </p>
                    <CodeBlock code={BULK_CURL} lang="bash" />
                    <p>
                        <Term>The body is NDJSON, not JSON.</Term>{" "}Each operation is an
                        action line and — for everything except <Code>delete</Code>{" "}— a
                        source line under it. No commas, no wrapping array: the newline is
                        the separator, and the body ends with one.
                    </p>
                    <p>
                        In the client the same payload is a flat array, where each element
                        becomes one line.
                    </p>
                    <CodeBlock code={BULK_TS} lang="ts" />
                    <p>
                        The <Code>flatMap</Code>{" "}emits the action line and the document
                        as two adjacent elements, which is exactly the pairing the wire
                        format requires.
                    </p>

                    <Callout severity="trap" label="trap · the body ends with a newline">
                        <p>
                            A body whose last line has no newline is a <Code>400</Code>:{" "}
                            <Code>
                                The bulk request must be terminated by a newline
                            </Code>
                            . Build the payload by joining every line with{" "}
                            <Code>\n</Code>{" "}and appending one more.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · one line, one operation">
                        <p>
                            The action line is the single-document URL folded into JSON:{" "}
                            <Code>
                                {`{"index":{"_index":"movies","_id":"603692"}}`}
                            </Code>{" "}
                            carries exactly what <Code>PUT /movies/_doc/603692</Code>{" "}
                            carried, and the line under it is the body you would have sent
                            alone. In the <Code>flatMap</Code> above, <Code>m</Code>{" "}
                            <em>is</em>{" "}that body line — one array element becomes one
                            line on the wire. In Postman or any client, send it as raw text
                            with the <Code>x-ndjson</Code>{" "}header; a JSON array is
                            refused.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="bulk: 200 but failed" sectionSeverity="trap">
                    <p>
                        A bulk request reports on the request, not on its contents:{" "}
                        <Code>200</Code>{" "}means the batch was accepted and processed, and
                        says nothing about whether the documents inside it were written.
                        This is the failure mode that quietly loses records, and avoiding
                        it is four lines of code.
                    </p>
                    <p>
                        The reply carries one entry per operation, in the order they were
                        sent:
                    </p>
                    <CodeBlock code={BULK_REPLY} lang="json" />
                    <p>
                        One movie was created and one was rejected — a string sent into a{" "}
                        <Code>float</Code> field, a{" "}
                        <Code>document_parsing_exception</Code>. Note{" "}
                        <Code>errors: true</Code>{" "}at the top: it is the only global
                        signal, and the client throws nothing.
                    </p>
                    <p>
                        So every bulk call needs the check the status code cannot give
                        you.
                    </p>
                    <CodeBlock code={BULK_CHECK} lang="ts" />
                    <p>
                        Logging the id with the reason is what turns a silent gap in the
                        index into a line you can act on.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · a dropped document looks like a success"
                    >
                        <p>
                            Skip the <Code>result.errors</Code>{" "}check and the missing
                            movies surface weeks later as &ldquo;search is
                            incomplete&rdquo;, with no log line to explain it. Check it on
                            every bulk call and log the id with the reason.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="helpers.bulk: the production way">
                    <p>
                        Raw <Code>bulk</Code>{" "}leaves the whole pipeline to you: building
                        action lines, choosing where to cut the payload, inspecting every
                        item, retrying what deserves it.{" "}
                        <Code>helpers.bulk</Code>{" "}is the client&apos;s answer to all
                        four, and it is what an import or a sync should use.
                    </p>
                    <p>
                        It takes raw documents and a function that turns each one into its
                        action line.
                    </p>
                    <CodeBlock code={HELPERS_TS} lang="ts" />
                    <p>
                        From there it generates the pairs, splits them into as many
                        requests as <Code>flushBytes</Code>{" "}implies, retries what is
                        retryable, and calls <Code>onDrop</Code>{" "}for each document it
                        gives up on — which replaces the manual error check from the
                        section above.
                    </p>
                    <p>What it prints and what it returns when one document is bad:</p>
                    <CodeBlock code={HELPERS_OUT} lang="text" />
                    <p>
                        The summary is the report an import should log:{" "}
                        <Code>successful</Code> and <Code>failed</Code>{" "}per run, with{" "}
                        <Code>retry</Code>{" "}showing how hard the cluster was pushed.
                    </p>

                    <Callout severity="note" label="note · what retries and what does not">
                        <p>
                            A <Code>400</Code>{" "}is a data bug: the same document will fail
                            the same way for ever, so it is never retried and goes straight
                            to <Code>onDrop</Code>. Only <Code>429</Code>{" "}rejections are
                            retried — <Code>retries</Code>{" "}defaults to 3, and the backoff
                            between attempts spans enough time for a full write queue to
                            drain. After that the document is dropped and the decision is
                            yours.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · which one to reach for">
                        <p>
                            A one-off script that writes a handful of documents: raw{" "}
                            <Code>bulk</Code>. An import or a sync pipeline:{" "}
                            <Code>helpers.bulk</Code>. There is no curl equivalent of this
                            one — the batching, retrying and dropping are client-side
                            orchestration, and on the wire it is simply several{" "}
                            <Code>_bulk</Code>{" "}requests.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="batch sizing & 429">
                    <p>
                        Two questions decide whether an import finishes: how much to put
                        in one request, and what to do when the cluster says no. Both have
                        settled answers, and both are easy to get wrong in the direction
                        that feels faster.
                    </p>
                    <p>
                        A rejection does not arrive as a failed request — it arrives
                        inside a successful one, per item:
                    </p>
                    <CodeBlock code={REJECT_REPLY} lang="json" />
                    <p>
                        <Term>
                            <Code>429 es_rejected_execution_exception</Code>{" "}is
                            backpressure, not an error in your data.
                        </Term>{" "}
                        The write queue is full and the cluster is refusing work. The same
                        request can report three hundred documents created and two hundred
                        rejected.
                    </p>
                    <p>
                        The two knobs that answer it are the request size and how many
                        requests are in flight.
                    </p>
                    <CodeBlock code={REJECT_TS} lang="ts" />
                    <p>
                        <Term>Size a batch by payload, not by document count.</Term>{" "}Five
                        to fifteen megabytes per request is the working range — which is
                        why the knob is <Code>flushBytes</Code>{" "}and not a number of
                        documents. A thousand log lines and a thousand movies with plot
                        summaries are not the same request.
                    </p>

                    <Callout severity="trap" label="trap · bigger batches are not faster">
                        <p>
                            Past the working range a batch risks a <Code>413</Code>{" "}and
                            hogs the write queue while it is processed, which pushes
                            everything else into rejection. Throughput comes from steady
                            batches, not enormous ones.
                        </p>
                    </Callout>

                    <Callout severity="danger" label="danger · raising the queue">
                        <p>
                            The tempting fix — enlarging the cluster&apos;s write queue —
                            deletes the signal and keeps the problem: more work is accepted
                            than can be done, and the rejection is replaced by memory
                            pressure. The correct reaction to a <Code>429</Code>{" "}is to
                            back off and retry, which the helper already does. Sustained
                            rejections mean you are outpacing the cluster: shrink the
                            batches or the concurrency.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the container, and when it shows its contents ---------- */}
            <PartHeading kicker="part 2">Indices</PartHeading>
            <div>
                <DocSection title="refresh, explained">
                    <p>
                        A written document is not a searchable document yet. Between the
                        two sits the refresh, and understanding that step explains the
                        near real-time behaviour from the Introduction from the write
                        side — plus the two parameters that override it.
                    </p>
                    <p>The path a document takes from the write call to search:</p>
                    <CodeBlock code={REFRESH_FLOW} lang="text" />
                    <p>
                        <Term>Refreshing per write would be ruinous.</Term>{" "}Cutting a
                        segment costs real work, and one segment per document would leave
                        the index with thousands of tiny ones to merge. Batching a second
                        of writes into a single segment is the trade that makes indexing
                        fast.
                    </p>
                    <p>
                        The write call can override the schedule, with three behaviours
                        worth telling apart.
                    </p>
                    <CodeBlock code={REFRESH_TS} lang="ts" />
                    <p>
                        On the wire they are a query parameter, plus the manual refresh of
                        a whole index:
                    </p>
                    <CodeBlock code={REFRESH_CURL} lang="bash" />
                    <p>
                        <Code>true</Code>{" "}makes the cluster do extra work now;{" "}
                        <Code>wait_for</Code>{" "}only delays your response until the next
                        scheduled refresh, which costs the cluster nothing.
                    </p>

                    <Callout severity="note" label="note · get is not search">
                        <p>
                            A get by id sees the document immediately; only search waits
                            for the refresh. A document that is gettable but not findable
                            is not a bug — it is the second that has not elapsed yet.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · refresh in tests, not in routes">
                        <p>
                            <Code>refresh: true</Code>{" "}forces a refresh now and is right
                            in tests: index the fixture, search for it on the next line, no
                            flake. <Code>refresh: &quot;wait_for&quot;</Code>{" "}waits for
                            the next scheduled refresh instead — read-your-own-search
                            without making the cluster do extra work. In production routes
                            leave it <Code>false</Code>: the reader is served from CouchDB
                            anyway, so the index catching up a second later is invisible.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="imports: switch refresh off">
                    <p>
                        During a bulk import there is nobody searching the index, so every
                        refresh in those minutes is wasted work — and it leaves behind
                        hundreds of small segments to merge. Turning refreshing off for
                        the duration is a three-step pattern that belongs in the import
                        script itself.
                    </p>
                    <p>The three steps in the client — off, import, back on:</p>
                    <CodeBlock code={IMPORT_TS} lang="ts" />
                    <p>The same sequence over the wire:</p>
                    <CodeBlock code={IMPORT_CURL} lang="bash" />
                    <p>
                        <Code>refresh_interval: &quot;-1&quot;</Code>{" "}disables the
                        schedule; restoring it to <Code>1s</Code>{" "}and calling{" "}
                        <Code>_refresh</Code>{" "}once makes everything just imported
                        visible in one step.
                    </p>
                    <p>What that saves, drawn over a twenty-second import:</p>
                    <CodeBlock code={IMPORT_TIMELINE} lang="text" />
                    <p>
                        Twenty-odd segment cuts become one, and the import writes into few
                        large segments instead of a hundred small ones.
                    </p>

                    <Callout severity="trap" label="trap · the refresh you forgot">
                        <p>
                            Skip the final refresh and everything looks healthy: the import
                            reports success, the document count climbs, and search returns
                            the old results. If search is stale straight after an import,
                            check <Code>refresh_interval</Code>{" "}before anything else.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="index lifecycle">
                    <p>
                        An index can come into existence by accident — the first write to
                        a name that does not exist creates it, with field types guessed
                        from that document. Creating it deliberately instead is the whole
                        of this section, along with the two commands for looking at what
                        exists.
                    </p>
                    <p>
                        The pattern the indexer uses: check, then create with explicit
                        mappings, and delete when rebuilding.
                    </p>
                    <CodeBlock code={LIFECYCLE_TS} lang="ts" />
                    <p>The same three operations over the wire:</p>
                    <CodeBlock code={LIFECYCLE_CURL} lang="bash" />
                    <p>
                        <Term>
                            Auto-create plus dynamic mapping is a hazard in production.
                        </Term>{" "}
                        A typo in an index name silently produces a second, junk index, and
                        a field that arrives as <Code>&quot;7.7&quot;</Code>{" "}is typed as
                        text for ever. Deleting an index is instant and irreversible, and
                        here that is normal rather than alarming: the index is derived, so
                        the development loop is delete, create, re-run the indexer from
                        CouchDB.
                    </p>
                    <p>
                        Two calls answer &ldquo;what is in this cluster?&rdquo; — one for
                        code, one for eyes.
                    </p>
                    <CodeBlock code={INSPECT_TS} lang="ts" />
                    <p>And their curl equivalents, which are what you type by hand:</p>
                    <CodeBlock code={INSPECT_CURL} lang="bash" />
                    <p>The table is the daily glance:</p>
                    <CodeBlock code={CAT_OUT} lang="text" />
                    <p>
                        <Code>docs.count</Code> and <Code>store.size</Code>{" "}are what you
                        actually check after an import. A <Code>yellow</Code>{" "}health on a
                        single node is normal — replicas have nowhere to go — and is
                        unpacked in Production Essentials.
                    </p>

                    <Callout severity="danger" label="danger · dynamic mapping in production">
                        <p>
                            A guessed mapping cannot be corrected in place: fixing the type
                            of one field means building a new index and reindexing into it.
                            Create indices explicitly and let the guess happen nowhere but
                            a scratch index.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · two PUTs, two different things">
                        <p>
                            <Code>PUT /movies</Code>{" "}creates an index.{" "}
                            <Code>PUT /movies/_doc/1</Code>{" "}creates a document. One
                            segment of path separates a container from its contents.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="aliases">
                    <p>
                        An alias is a movable pointer to an index: the application talks
                        to <Code>movies</Code>{" "}while the physical index behind it is{" "}
                        <Code>movies_v1</Code>. That one indirection is what makes a
                        mapping change possible without downtime, which is the reason this
                        section exists at all.
                    </p>
                    <p>
                        Setting one up is a create plus an <Code>add</Code>{" "}action.
                    </p>
                    <CodeBlock code={ALIAS_ADD_TS} lang="ts" />
                    <p>The same two requests over the wire:</p>
                    <CodeBlock code={ALIAS_ADD_CURL} lang="bash" />
                    <p>
                        Moving the alias to a new index is a remove and an add in the same{" "}
                        <Code>actions</Code>{" "}array.
                    </p>
                    <CodeBlock code={ALIAS_SWAP_TS} lang="ts" />
                    <p>Over the wire, where the single request is the whole point:</p>
                    <CodeBlock code={ALIAS_SWAP_CURL} lang="bash" />
                    <p>
                        <Term>One array is what makes the swap atomic.</Term>{" "}There is no
                        instant without a <Code>movies</Code>{" "}to search, and searches
                        already in flight finish against <Code>movies_v1</Code>. Once the
                        new index is serving, the old one is deleted.
                    </p>
                    <p>
                        Nothing in the application changes, because every API takes an
                        alias wherever it takes an index name.
                    </p>
                    <CodeBlock code={ALIAS_USE_TS} lang="ts" />
                    <p>
                        The request it produces is indistinguishable from one against a
                        real index:
                    </p>
                    <CodeBlock code={ALIAS_USE_CURL} lang="bash" />
                    <p>
                        <Term>This is the answer to a mapping you cannot change.</Term>{" "}
                        Build <Code>movies_v2</Code>{" "}with the corrected mappings,
                        reindex into it, swap the alias, drop <Code>movies_v1</Code>{" "}— a
                        mapping change with no downtime and no code release.
                    </p>

                    <Callout severity="tip" label="tip · alias from day one">
                        <p>
                            Adding an alias later means a deploy that changes the index
                            name in the application; adding it at creation costs one extra
                            request and buys every future reindex. Create{" "}
                            <Code>movies_v1</Code>, alias it to <Code>movies</Code>, and
                            never name a physical index in application code again.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · where cineverse stands">
                        <p>
                            The project currently points at the real index rather than an
                            alias — the zero-downtime rebuild that fixes it is the subject
                            of the CouchDB Sync chapter.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside both parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>What happens if you index a document with an existing id?</>}
                    a={
                        <>
                            &ldquo;It&apos;s a <Term>full replace</Term>, not a merge — the
                            previous <Code>_source</Code> is gone. For partial changes we
                            use the <Term>update API</Term>, which merges but still
                            reindexes the whole document under the hood.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>Your import returned 200 but movies are missing — why?</>}
                        a={
                            <>
                                &ldquo;Bulk is <Term>partially successful</Term> by design —
                                failures are <Term>per item</Term>. We check{" "}
                                <Code>result.errors</Code> and handle{" "}
                                <Term>dropped documents</Term>{" "}
                                instead of trusting the status code.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>How big should bulk batches be?</>}
                        a={
                            <>
                                &ldquo;We size by <Term>payload, not count</Term> — around 5
                                to 15MB. On <Code>429</Code> rejections we{" "}
                                <Term>back off and retry</Term>; sustained rejections mean
                                we&apos;re <Term>outpacing the cluster</Term>.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>How do you change a mapping without downtime?</>}
                        a={
                            <>
                                &ldquo;The app talks to an <Term>alias</Term>, never a
                                physical index. We build the new index, reindex into it, then{" "}
                                <Term>swap the alias atomically</Term>{" "}
                                — one request, no gap.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
