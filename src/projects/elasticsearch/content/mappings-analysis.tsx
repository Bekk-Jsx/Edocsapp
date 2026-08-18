import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is one
// severity. Exactly one section here is: "object arrays: the flattening problem",
// whose whole subject is the trap. See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Field Types) ---
    // inline `trap · case matters on a keyword` and `tip · the question that decides it`
    "text-vs-keyword": ["trap", "tip"],
    // inline `note · why the suffix is everywhere`, `trap · ignore_above drops long
    // values` and `tip · the multi-field worth declaring`
    "the-keyword-sub-field": ["trap", "tip", "note"],

    // --- part 2 (Analysis) ---
    // inline `tip · _analyze before you debug a query` and `note · one name, three slots`
    "analyzers-and-analyze": ["tip", "note"],
    // inline `trap · stemming is blunt` and `note · stems are not words`
    "the-english-analyzer": ["trap", "note"],
    // inline `danger · an analyzer is fixed at creation` and `tip · compose, verify, then index`
    "custom-analyzers": ["danger", "tip"],

    // --- part 3 (Objects & Nested) ---
    // header-flagged `trap` — the whole section is the trap — plus an inline
    // `danger · the false positive is silent` and `note · there is no array type`
    "object-arrays-the-flattening-problem": ["trap", "danger", "note"],
    // inline `trap · a plain term query returns zero hits` and `note · the price is
    // paid everywhere`
    "nested-separate-hidden-documents": ["trap", "note"],
    // inline `danger · one movie, twenty-one documents`, `tip · let the UI decide`
    // and `note · where cineverse stands`
    "when-not-to-use-nested": ["danger", "tip", "note"],

    // --- part 4 (Changing a Mapping) ---
    // inline `danger · there is no in-place type change` and `note · adding is not
    // backfilling`
    "mappings-can-t-change": ["danger", "note"],
    // inline `trap · check failures, not the status code`, `tip · the alias is what
    // makes it invisible` and `note · where cineverse stands`
    "reindex-alias-swap": ["trap", "tip", "note"],
};

// Top-level divider between the four parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper the introduction and documents-indices content files
// each define for their own part dividers.
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

// PROJECT RULE, applied throughout this file: every operation appears in both
// forms — the Node client call and the curl that goes over the wire — as a pair
// of fragments. Client first, except where the wire form is the canonical
// document (creating an index with an analysis block).

const TYPES_TS = `// cineverse's movies mapping — the two lines that matter
await esClient.indices.create({
    index: "movies",
    mappings: {
        properties: {
            title: { type: "text", analyzer: "english" },
            status: { type: "keyword" },
        },
    },
});`;

const TYPES_CURL = `curl -X PUT 'localhost:9200/movies' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": {
          "title":  { "type": "text", "analyzer": "english" },
          "status": { "type": "keyword" } } } }'`;

// The whole decision, in what each type leaves in the index.
const TERMS_SPLIT = `"The Dark Knight"
      |
      |-- text     -> ["the", "dark", "knight"]   match inside
      '-- keyword  -> ["The Dark Knight"]         exact, whole`;

const DEMO_TS = `// inside the value — analyzed on both sides
await esClient.search({
    index: "movies",
    query: { match: { title: "dark" } },
});   // 1 hit: The Dark Knight

// the whole value — analyzed on neither side
await esClient.search({
    index: "movies",
    query: { term: { status: "Released" } },
});   // 1 hit

await esClient.search({
    index: "movies",
    query: { term: { status: "released" } },
});   // 0 hits — a different term`;

const DEMO_CURL = `curl -X GET 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "dark" } } }'
# 1 hit: The Dark Knight

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "term": { "status": "Released" } } }'
# 1 hit

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "term": { "status": "released" } } }'
# 0 hits — a different term`;

// What dynamic mapping writes when a string arrives and nobody said what it is.
const GUESSED = `{
  "status": {
    "type": "text",
    "fields": {
      "keyword": { "type": "keyword", "ignore_above": 256 }
    }
  }
}`;

// The suffix is a path in the mapping, not a property of the type — which is why
// it exists under a guessed mapping and does not under an explicit one.
const SUBFIELD_PATHS = `"Released" indexed twice, into two structures

  guessed    status          text      ->  ["released"]
             status.keyword  keyword   ->  ["Released"]

  explicit   status          keyword   ->  ["Released"]
             status.keyword            ->  does not exist`;

const SUBFIELD_TS = `// analyzed side — the main field's own name
await esClient.search({
    index: "movies",
    query: { match: { status: "released" } },
});

// exact side — parent.subname
await esClient.search({
    index: "movies",
    query: { term: { "status.keyword": "Released" } },
    aggs: { by_status: { terms: { field: "status.keyword" } } },
});`;

const SUBFIELD_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "status": "released" } } }'

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "term": { "status.keyword": "Released" } },
        "aggs": { "by_status": {
          "terms": { "field": "status.keyword" } } } }'`;

const MULTIFIELD_TS = `// one field, searched one way and sorted another
await esClient.indices.create({
    index: "movies",
    mappings: {
        properties: {
            title: {
                type: "text",
                analyzer: "english",
                fields: { raw: { type: "keyword" } },
            },
        },
    },
});

await esClient.search({
    index: "movies",
    query: { match: { title: "knight" } },
    sort: [{ "title.raw": "asc" }],
});`;

const MULTIFIELD_CURL = `curl -X PUT 'localhost:9200/movies' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": { "title": {
          "type": "text", "analyzer": "english",
          "fields": { "raw": { "type": "keyword" } } } } } }'

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "match": { "title": "knight" } },
        "sort": [ { "title.raw": "asc" } ] }'`;

const ANALYZE_TS = `await esClient.indices.analyze({
    analyzer: "standard",
    text: "The Dark Knight Rises",
});`;

const ANALYZE_CURL = `curl -X POST 'localhost:9200/_analyze' \\
  -H 'Content-Type: application/json' \\
  -d '{ "analyzer": "standard",
        "text": "The Dark Knight Rises" }'`;

const ANALYZE_OUT = `{ "tokens": [
  { "token": "the",    "position": 0 },
  { "token": "dark",   "position": 1 },
  { "token": "knight", "position": 2 },
  { "token": "rises",  "position": 3 }
] }`;

// Three slots, always in this order. An analyzer name is a preset for all three.
const PIPELINE = `"The Dark Knight Rises"
      |
      v
[ char filters ]    clean the raw string     standard: none
      |
      v
[ tokenizer ]       split into tokens        standard tokenizer
      |
      v
[ token filters ]   transform each token     lowercase
      |
      v
["the", "dark", "knight", "rises"]`;

const ENGLISH_TS = `await esClient.indices.analyze({
    analyzer: "english",
    text: "The Dark Knight Rises",
});   // ["dark", "knight", "rise"]`;

const ENGLISH_CURL = `curl -X POST 'localhost:9200/_analyze' \\
  -H 'Content-Type: application/json' \\
  -d '{ "analyzer": "english",
        "text": "The Dark Knight Rises" }'`;

const ENGLISH_DIFF = `standard   ->  ["the", "dark", "knight", "rises"]
english    ->  [       "dark", "knight", "rise" ]
                ^ stopword gone            ^ stemmed

"running" -> ["run"]      "movies" -> ["movi"]`;

// Why a query nobody indexed still finds the document.
const MEET = `index time   "The Dark Knight Rises"  ->  ... "rise" ...
query time   "rising"                 ->      "rise"
                                              ^ same term`;

const CUSTOM_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "settings": {
    "analysis": {
      "char_filter": {
        "dash_strip": { "type": "mapping", "mappings": ["- => "] }
      },
      "analyzer": {
        "movie_title": {
          "type": "custom",
          "char_filter": ["dash_strip"],
          "tokenizer": "standard",
          "filter": ["lowercase", "porter_stem"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": { "type": "text", "analyzer": "movie_title" }
    }
  }
}'`;

const CUSTOM_TS = `await esClient.indices.create({
    index: "movies_v2",
    settings: {
        analysis: {
            char_filter: {
                dash_strip: {
                    type: "mapping",
                    mappings: ["- => "],
                },
            },
            analyzer: {
                movie_title: {
                    type: "custom",
                    char_filter: ["dash_strip"],
                    tokenizer: "standard",
                    filter: ["lowercase", "porter_stem"],
                },
            },
        },
    },
    mappings: {
        properties: {
            title: { type: "text", analyzer: "movie_title" },
        },
    },
});`;

const CUSTOM_TEST_TS = `// index-scoped: the analyzer only exists inside movies_v2
await esClient.indices.analyze({
    index: "movies_v2",
    analyzer: "movie_title",
    text: "Spider-Man Rises",
});   // ["spiderman", "rise"]`;

const CUSTOM_TEST_CURL = `curl -X POST 'localhost:9200/movies_v2/_analyze' \\
  -H 'Content-Type: application/json' \\
  -d '{ "analyzer": "movie_title",
        "text": "Spider-Man Rises" }'
# { "tokens": [ { "token": "spiderman" }, { "token": "rise" } ] }`;

const GENRE_DOC = `{
  "title": "The Matrix",
  "genres": [
    { "id": 28,  "name": "Action" },
    { "id": 878, "name": "Science Fiction" }
  ]
}`;

// No "type" line: that is an object field, and it is also what dynamic mapping
// writes on its own.
const OBJECT_MAPPING = `"genres": {
  "properties": {
    "id":   { "type": "integer" },
    "name": { "type": "keyword" }
  }
}`;

const FLATTENED = `sent      [ { 28, "Action" }, { 878, "Science Fiction" } ]

stored    genres.id:   [28, 878]
          genres.name: ["Action", "Science Fiction"]

          two parallel arrays — which id went with
          which name is gone`;

const FLAT_BUG_TS = `// "a movie whose genre 28 is called Science Fiction" — nonsense
await esClient.search({
    index: "movies",
    query: {
        bool: {
            must: [
                { term: { "genres.id": 28 } },
                { term: { "genres.name": "Science Fiction" } },
            ],
        },
    },
});   // 1 hit: The Matrix`;

const FLAT_BUG_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": { "must": [
          { "term": { "genres.id": 28 } },
          { "term": { "genres.name": "Science Fiction" } }
        ] } } }'
# 1 hit — 200 OK, no warning, wrong answer`;

const NESTED_MAPPING = `"genres": {
  "type": "nested",
  "properties": {
    "id":   { "type": "integer" },
    "name": { "type": "keyword" }
  }
}`;

const HIDDEN_DOCS = `The Matrix                                 visible document
  |
  |-- { id: 28,  name: "Action" }           hidden sub-doc
  '-- { id: 878, name: "Science Fiction" }  hidden sub-doc

each pair is indexed together, so it stays a pair`;

const NESTED_TS = `// both clauses must be true of the SAME hidden document
const pair = (id: number, name: string) => ({
    nested: {
        path: "genres",
        query: {
            bool: {
                must: [
                    { term: { "genres.id": id } },
                    { term: { "genres.name": name } },
                ],
            },
        },
    },
});

await esClient.search({
    index: "movies",
    query: pair(28, "Science Fiction"),
});   // 0 hits — the wrong pair, correctly

await esClient.search({
    index: "movies",
    query: pair(878, "Science Fiction"),
});   // 1 hit: The Matrix`;

const NESTED_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "nested": {
          "path": "genres",
          "query": { "bool": { "must": [
            { "term": { "genres.id": 878 } },
            { "term": { "genres.name": "Science Fiction" } }
          ] } } } } }'
# 1 hit. The same query with "genres.id": 28 -> 0 hits`;

const NESTED_COST = `The Matrix with 20 nested keywords
  = 1 parent + 20 hidden documents = 21 Lucene documents

change the vote_average  ->  all 21 written again
filter on genres.*       ->  a join, on every query`;

const DENORM_TS = `// two flat arrays: pairing lost, and never needed
const doc = {
    title: "The Matrix",
    genre_ids: [28, 878],
    genre_names: ["Action", "Science Fiction"],
};

// the genre dropdown sends ids — one field, no join
await esClient.search({
    index: "movies",
    query: { term: { genre_ids: 28 } },
});`;

const DENORM_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "term": { "genre_ids": 28 } } }'
# every movie with the Action id, correctly, on a flat field`;

const CHANGE_TS = `await esClient.indices.putMapping({
    index: "movies",
    properties: { status: { type: "text" } },
});   // ResponseError: illegal_argument_exception`;

const CHANGE_CURL = `curl -X PUT 'localhost:9200/movies/_mapping' \\
  -H 'Content-Type: application/json' \\
  -d '{ "properties": { "status": { "type": "text" } } }'`;

const CHANGE_REPLY = `{
  "error": {
    "type": "illegal_argument_exception",
    "reason": "mapper [status] cannot be changed from type
               [keyword] to [text]"
  },
  "status": 400
}`;

const ADD_TS = `// additive: a field that was never mapped before
await esClient.indices.putMapping({
    index: "movies",
    properties: { imdb_rating: { type: "float" } },
});   // { acknowledged: true }`;

const ADD_CURL = `curl -X PUT 'localhost:9200/movies/_mapping' \\
  -H 'Content-Type: application/json' \\
  -d '{ "properties": { "imdb_rating": { "type": "float" } } }'
# { "acknowledged": true }`;

const REINDEX_TS = `await esClient.reindex({
    source: { index: "movies_v1" },
    dest: { index: "movies_v2" },
    refresh: true,
});

// big index: hand it off and poll instead of waiting
const { task } = await esClient.reindex({
    source: { index: "movies_v1" },
    dest: { index: "movies_v2" },
    wait_for_completion: false,
});
await esClient.tasks.get({ task_id: task });`;

const REINDEX_CURL = `curl -X POST 'localhost:9200/_reindex' \\
  -H 'Content-Type: application/json' \\
  -d '{ "source": { "index": "movies_v1" },
        "dest":   { "index": "movies_v2" } }'

curl -X POST -d '{ ... }' \\
'localhost:9200/_reindex?wait_for_completion=false'
# { "task": "oTUltX4IQMOUUVeiohTt8A:124" }
curl 'localhost:9200/_tasks/oTUltX4IQMOUUVeiohTt8A:124'`;

const REINDEX_REPLY = `{
  "took": 3941,
  "created": 12042,
  "updated": 0,
  "version_conflicts": 0,
  "failures": [
    { "id": "603692", "status": 400,
      "cause": { "type": "document_parsing_exception",
                 "reason": "failed to parse [imdb_rating]" } }
  ]
}`;

const RECIPE = `1  alias movies -> movies_v1     the app says "movies"
2  create movies_v2              new mapping, new analyzers
3  _reindex v1 -> v2             re-analyzed on the way in
4  _aliases remove v1, add v2    one request, so it is atomic
5  delete movies_v1              once nothing is reading it`;

export function MappingsAnalysisDocs() {
    return (
        <>
            {/* ---------- part 1 — the decision you make once ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Field Types</PartHeading>
            <div>
                <DocSection title="text vs keyword">
                    <CodeBlock code={TYPES_TS} lang="ts" />
                    <CodeBlock code={TYPES_CURL} lang="bash" />
                    <CodeBlock code={TERMS_SPLIT} lang="text" />
                    <p>
                        <Term>
                            This is the single most important decision in a mapping.
                        </Term>{" "}
                        Both types store a string and both come back identically in{" "}
                        <Code>_source</Code>. They part ways at index time, in what they
                        leave behind in the inverted index — and that is what every query
                        against the field can then do.
                    </p>
                    <p>
                        <Term>
                            A <Code>text</Code>{" "}field goes through an analyzer.
                        </Term>{" "}
                        <Code>&quot;The Dark Knight&quot;</Code>{" "}is not stored as a value
                        to be found; it is broken into the terms{" "}
                        <Code>[&quot;the&quot;, &quot;dark&quot;, &quot;knight&quot;]</Code>
                        , each pointing back at the document. That is what full-text search
                        is: matching <em>inside</em>{" "}a value, on words the reader typed.
                    </p>
                    <p>
                        <Term>
                            A <Code>keyword</Code>{" "}field is stored as one exact term,
                            untouched.
                        </Term>{" "}
                        No splitting, no lowercasing — <Code>&quot;Released&quot;</Code>{" "}
                        goes in and <Code>&quot;Released&quot;</Code>{" "}is the term. That is
                        what exact matching, filtering, sorting and aggregating need: one
                        value per field, comparable to another value.
                    </p>
                    <CodeBlock code={DEMO_TS} lang="ts" />
                    <CodeBlock code={DEMO_CURL} lang="bash" />
                    <p>
                        <Term>Each type is unable to do the other&apos;s job.</Term>{" "}You
                        cannot sort or aggregate on <Code>text</Code>: the index holds
                        terms, not values, and there is nothing sensible to order or count{" "}
                        <em>by</em>{" "}— Elasticsearch refuses outright rather than guess. And
                        you cannot match inside a <Code>keyword</Code>: there is one term
                        and no parts to it, so &ldquo;knight&rdquo; will never find{" "}
                        <Code>&quot;The Dark Knight&quot;</Code>.
                    </p>

                    <Callout severity="trap" label="trap · case matters on a keyword">
                        <p>
                            A <Code>term</Code>{" "}query is not analyzed either, so the string
                            you send must equal the stored term byte for byte.{" "}
                            <Code>&quot;released&quot;</Code> against a{" "}
                            <Code>keyword</Code> holding <Code>&quot;Released&quot;</Code>{" "}
                            is not a near miss — it is zero hits, with no error and nothing
                            in the log. The usual fix is to normalise before indexing, so
                            the stored form and the filter form are decided in one place.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · the question that decides it">
                        <p>
                            Will anyone ever type words into this field?{" "}
                            <Code>text</Code>. Is it a category, an id, a status, a tag —
                            something you filter, group or sort by? <Code>keyword</Code>.
                            Titles, plot summaries and cast names are <Code>text</Code>;{" "}
                            <Code>status</Code>, <Code>tmdb_id</Code> and{" "}
                            <Code>genre_ids</Code> are <Code>keyword</Code>{" "}or a number.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the .keyword sub-field">
                    <CodeBlock code={GUESSED} lang="json" />
                    <CodeBlock code={SUBFIELD_PATHS} lang="text" />
                    <p>
                        <Term>
                            Dynamic mapping cannot tell prose from a category, so it
                            hedges.
                        </Term>{" "}
                        A string arrives, nobody declared the field, and there is no way to
                        know whether the next value will be a plot summary or the word{" "}
                        <Code>Released</Code>. So it indexes it as both, through a
                        multi-field: <Code>text</Code> for the main field, with a{" "}
                        <Code>keyword</Code>{" "}sub-field beside it.
                    </p>
                    <p>
                        <Term>The value is indexed twice, into two structures.</Term>{" "}
                        Query <Code>status</Code>{" "}and you are talking to the analyzed side;
                        query <Code>status.keyword</Code>{" "}and you are talking to the exact
                        side. Same value, same document, two entirely separate sets of
                        terms.
                    </p>
                    <CodeBlock code={SUBFIELD_TS} lang="ts" />
                    <CodeBlock code={SUBFIELD_CURL} lang="bash" />
                    <p>
                        <Term>
                            <Code>fields</Code>{" "}never stands alone.
                        </Term>{" "}
                        It always hangs underneath a main type, and that is what fixes the
                        two names: the main field is queried by its own name, the sub-field
                        by <Code>parent.subname</Code>. The name{" "}
                        <Code>&quot;keyword&quot;</Code>{" "}in the mapping above is just the
                        label dynamic mapping chose — call the sub-field{" "}
                        <Code>&quot;raw&quot;</Code> and you query{" "}
                        <Code>status.raw</Code>{" "}instead. Nothing about the suffix is
                        reserved.
                    </p>
                    <p>
                        <Term>The suffix is a path, not a type.</Term> It is not something a{" "}
                        <Code>keyword</Code> field <em>has</em>. In an explicit mapping
                        where <Code>status</Code> is itself a <Code>keyword</Code>, the
                        exact terms live on the main field: you filter, sort and aggregate
                        on plain <Code>status</Code>, and <Code>status.keyword</Code>{" "}does
                        not exist at all — a query naming it silently finds nothing.
                    </p>

                    <Callout severity="note" label="note · why the suffix is everywhere">
                        <p>
                            Half the answers on Stack Overflow aggregate on{" "}
                            <Code>something.keyword</Code>, which reads like a convention
                            and is not one: it only exists because those indices were
                            created by dynamic mapping. Whether you need the suffix is
                            answered by <Code>GET /movies</Code>{" "}— read the mapping and the
                            path is right there.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · ignore_above drops long values">
                        <p>
                            Keeping the hedge is not free. Every string is analyzed and
                            indexed twice, for a field where one of the two sides is usually
                            meaningless. Worse, the generated sub-field carries{" "}
                            <Code>ignore_above: 256</Code>: any value longer than that is
                            simply not indexed into the <Code>keyword</Code>{" "}side — no
                            error, no rejection, the document is stored and searchable, but
                            it is missing from every <Code>term</Code>{" "}query and every
                            aggregation on <Code>.keyword</Code>.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · the multi-field worth declaring">
                        <p>
                            Multi-fields earn their keep when you genuinely need both sides
                            of one field: search the title as prose <em>and</em>{" "}sort a list
                            by it alphabetically. Declare it on purpose —{" "}
                            <Code>title</Code> as <Code>text</Code> with{" "}
                            <Code>fields: {`{ raw: keyword }`}</Code> — then match on{" "}
                            <Code>title</Code> and sort on <Code>title.raw</Code>.
                        </p>
                    </Callout>

                    <CodeBlock code={MULTIFIELD_TS} lang="ts" />
                    <CodeBlock code={MULTIFIELD_CURL} lang="bash" />
                </DocSection>
            </div>

            {/* ---------- part 2 — what happens to a string on the way in ---------- */}
            <PartHeading kicker="part 2">Analysis</PartHeading>
            <div>
                <DocSection title="analyzers and _analyze">
                    <CodeBlock code={ANALYZE_TS} lang="ts" />
                    <CodeBlock code={ANALYZE_CURL} lang="bash" />
                    <CodeBlock code={ANALYZE_OUT} lang="json" />
                    <p>
                        <Term>
                            An analyzer turns a text value into terms, and{" "}
                            <Code>_analyze</Code>{" "}shows you exactly which.
                        </Term>{" "}
                        It takes an analyzer and a string and answers with the tokens,
                        without indexing anything. There is no reason to guess what a field
                        does with its input when one request tells you.
                    </p>
                    <p>
                        <Term>
                            Those tokens are literally what enters the inverted index.
                        </Term>{" "}
                        The four above are the entries that will point at this document —
                        which is the whole explanation for the section before this one.{" "}
                        <Code>match</Code> on <Code>&quot;dark&quot;</Code> hits because{" "}
                        <Code>dark</Code> is a term. Case never matters on a{" "}
                        <Code>text</Code> field because <Code>lowercase</Code>{" "}ran on the
                        way in and runs again on the way out.
                    </p>
                    <CodeBlock code={PIPELINE} lang="text" />
                    <p>
                        <Term>Every analyzer is three slots in a fixed order.</Term>{" "}Char
                        filters work on the raw string before it is split — stripping HTML,
                        replacing characters. The tokenizer does the splitting, and there is
                        exactly one. Token filters then transform the tokens one at a time,
                        in the order listed.
                    </p>

                    <Callout severity="note" label="note · one name, three slots">
                        <p>
                            <Code>&quot;standard&quot;</Code>{" "}is not a fourth kind of thing;
                            it is a preset for the three: no char filter, the standard
                            tokenizer, and a <Code>lowercase</Code>{" "}token filter. It is the
                            default for every <Code>text</Code> field you do not give an{" "}
                            <Code>analyzer</Code>, and it splits on word boundaries rather
                            than on spaces — which is why punctuation disappears without
                            anyone asking.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · _analyze before you debug a query">
                        <p>
                            When a query that should match returns nothing, the fastest
                            check is not the query — it is <Code>_analyze</Code>{" "}on both
                            sides. Run the indexed value and the search string through the
                            field&apos;s analyzer and compare the terms. If no term is
                            shared, the query was never going to match, and the mapping is
                            what needs changing.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the english analyzer">
                    <CodeBlock code={ENGLISH_TS} lang="ts" />
                    <CodeBlock code={ENGLISH_CURL} lang="bash" />
                    <CodeBlock code={ENGLISH_DIFF} lang="text" />
                    <p>
                        <Term>
                            The same sentence, one analyzer along, and two things have
                            happened.
                        </Term>{" "}
                        <Code>&quot;the&quot;</Code>{" "}is gone — stopword removal drops the
                        words that appear in nearly every document and therefore
                        distinguish nothing. And <Code>&quot;rises&quot;</Code> has become{" "}
                        <Code>rise</Code> — stemming cuts each word back to a root, so{" "}
                        <Code>running</Code> becomes <Code>run</Code> and{" "}
                        <Code>movies</Code> becomes <Code>movi</Code>.
                    </p>
                    <CodeBlock code={MEET} lang="text" />
                    <p>
                        <Term>
                            The payoff is that the query is analyzed by the same analyzer as
                            the field.
                        </Term>{" "}
                        A reader types <Code>&quot;rising&quot;</Code>; it is stemmed to{" "}
                        <Code>rise</Code>; the document stored <Code>rise</Code>{" "}when it was
                        indexed, and the two meet on one term in the inverted index. No
                        fuzziness, no wildcards, no clever query — both sides were simply
                        reduced to the same root.
                    </p>

                    <Callout severity="note" label="note · stems are not words">
                        <p>
                            <Code>movi</Code>{" "}looks like a bug and is not. Stemming is
                            crude string surgery, not a dictionary — it only has to be
                            consistent, and it is: the query <Code>&quot;movie&quot;</Code>{" "}
                            becomes <Code>movi</Code>{" "}too, so they meet. Stems exist only
                            inside the index; <Code>_source</Code>{" "}is stored exactly as you
                            sent it, so what the reader sees is untouched and no user ever
                            lays eyes on a stem.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · stemming is blunt">
                        <p>
                            The same crudeness cuts the other way: unrelated words can
                            collapse onto one root — <Code>universe</Code> and{" "}
                            <Code>university</Code> both stem to <Code>univers</Code>{" "}— and
                            that is a match nobody wanted. Stopword removal has its own
                            edge: the film <em>The Who</em>{" "}analyzes down to almost nothing.
                            A language analyzer is right for prose and wrong for names and
                            codes, which is exactly what <Code>keyword</Code>{" "}is for.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="custom analyzers">
                    <CodeBlock code={CUSTOM_CURL} lang="bash" />
                    <CodeBlock code={CUSTOM_TS} lang="ts" />
                    <p>
                        <Term>
                            A custom analyzer is defined in the index settings, under{" "}
                            <Code>analysis</Code>, and referenced from the mapping by name.
                        </Term>{" "}
                        Those are two separate halves of the same create request: the
                        settings declare the pieces and assemble them, and the mapping says
                        which field uses the result.
                    </p>
                    <p>
                        <Term>Each of the three slots is filled explicitly.</Term>{" "}
                        <Code>dash_strip</Code> is a <Code>mapping</Code>{" "}char filter that
                        rewrites <Code>&quot;-&quot;</Code>{" "}to nothing before any splitting
                        happens; the tokenizer stays <Code>standard</Code>; the token
                        filters are <Code>lowercase</Code> then <Code>porter_stem</Code>.
                        The purpose is one concrete problem — with the dash removed before
                        tokenizing, <Code>&quot;Spider-Man&quot;</Code>{" "}becomes the single
                        term <Code>spiderman</Code>, and the reader who types{" "}
                        <Code>&quot;spiderman&quot;</Code>{" "}finds the film.
                    </p>
                    <CodeBlock code={CUSTOM_TEST_TS} lang="ts" />
                    <CodeBlock code={CUSTOM_TEST_CURL} lang="bash" />
                    <p>
                        <Term>
                            Test it with an index-scoped <Code>_analyze</Code>{" "}before a
                            single document goes in.
                        </Term>{" "}
                        A custom analyzer only exists inside the index that defines it, so
                        the request goes to <Code>/movies_v2/_analyze</Code>{" "}rather than the
                        cluster-wide endpoint. The tokens come back, you read them, and only
                        then does indexing start.
                    </p>

                    <Callout severity="tip" label="tip · compose, verify, then index">
                        <p>
                            The workflow is always the same three steps: compose the pieces
                            in settings, verify the output with <Code>_analyze</Code>,
                            index. Skipping the middle step means finding out from a query
                            that returns nothing, days later, with a full index to rebuild
                            before you can try the fix.
                        </p>
                    </Callout>

                    <Callout
                        severity="danger"
                        label="danger · an analyzer is fixed at creation"
                    >
                        <p>
                            Analysis settings are set when the index is created. You cannot
                            edit <Code>movie_title</Code>{" "}on a live index, because the terms
                            it produced are already written into the segments — changing the
                            recipe would leave old documents analyzed one way and new ones
                            another. Changing an analyzer means a new index and a reindex,
                            which is the subject of part 4.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — objects, and the pairing you lose ---------- */}
            <PartHeading kicker="part 3">Objects &amp; Nested</PartHeading>
            <div>
                <DocSection
                    title="object arrays: the flattening problem"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={GENRE_DOC} lang="json" />
                    <CodeBlock code={OBJECT_MAPPING} lang="json" />
                    <CodeBlock code={FLATTENED} lang="text" />
                    <p>
                        <Term>
                            The mapping above declares an object, and the missing line is
                            the point.
                        </Term>{" "}
                        There is no <Code>&quot;type&quot;</Code> in it — just{" "}
                        <Code>properties</Code>, which makes <Code>genres</Code>{" "}an object
                        implicitly. It is also exactly what dynamic mapping writes when this
                        document arrives with no mapping at all, so most people meet this
                        behaviour without ever choosing it.
                    </p>
                    <p>
                        <Term>
                            Elasticsearch flattens the array into parallel lists of leaf
                            values.
                        </Term>{" "}
                        The document you sent had two objects; what Lucene stores is{" "}
                        <Code>genres.id: [28, 878]</Code> and{" "}
                        <Code>genres.name: [&quot;Action&quot;, &quot;Science
                        Fiction&quot;]</Code>. Every value is still there and searchable —
                        but the pairing between <Code>28</Code> and{" "}
                        <Code>&quot;Action&quot;</Code>{" "}has been destroyed. The index knows
                        the movie has those ids and those names; it no longer knows which
                        went with which.
                    </p>
                    <CodeBlock code={FLAT_BUG_TS} lang="ts" />
                    <CodeBlock code={FLAT_BUG_CURL} lang="bash" />
                    <p>
                        <Term>So a query for an impossible pair matches.</Term> Genre{" "}
                        <Code>28</Code> is Action and <Code>878</Code>{" "}is Science Fiction;
                        no object in that document pairs <Code>28</Code> with{" "}
                        <Code>&quot;Science Fiction&quot;</Code>. But both clauses are
                        checked against the flattened arrays independently, both find their
                        term, and <Code>bool must</Code>{" "}is satisfied. The Matrix comes
                        back.
                    </p>

                    <Callout severity="note" label="note · there is no array type">
                        <p>
                            Nothing in the mapping mentions an array, because Elasticsearch
                            does not have one: any field accepts a single value or many of
                            them, and the mapping only describes the type of one. That is
                            what makes this easy to miss — the array is invisible in the
                            mapping, so the decision about how its objects are indexed never
                            looks like a decision.
                        </p>
                    </Callout>

                    <Callout
                        severity="danger"
                        label="danger · the false positive is silent"
                    >
                        <p>
                            The request is a <Code>200</Code>, the response is well formed,
                            and the hit count is plausible. Nothing anywhere reports that
                            the question you asked cannot be answered by this index. Filters
                            like this quietly over-match for as long as nobody checks a
                            result by hand.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="nested: separate hidden documents">
                    <CodeBlock code={NESTED_MAPPING} lang="json" />
                    <CodeBlock code={HIDDEN_DOCS} lang="text" />
                    <p>
                        <Term>The fix is one line.</Term>{" "}
                        <Code>&quot;type&quot;: &quot;nested&quot;</Code> above{" "}
                        <Code>properties</Code>, and the flattening stops. Each object in
                        the array is indexed as its own hidden Lucene document, with its own
                        <Code> id</Code> and <Code>name</Code>{" "}terms kept together, and the
                        parent movie holds them. The pairing survives because the objects
                        were never merged in the first place.
                    </p>
                    <CodeBlock code={NESTED_TS} lang="ts" />
                    <CodeBlock code={NESTED_CURL} lang="bash" />
                    <p>
                        <Term>The price is that ordinary queries cannot see inside.</Term>{" "}
                        Those hidden documents are not part of the parent as far as the
                        query layer is concerned, so anything touching{" "}
                        <Code>genres.*</Code> has to go through the <Code>nested</Code>{" "}
                        wrapper: a <Code>path</Code>{" "}saying which nested field to descend
                        into, and a <Code>query</Code>{" "}that is evaluated against one hidden
                        document at a time. That last part is the whole point — both{" "}
                        <Code>must</Code> clauses now have to be true of the{" "}
                        <em>same</em>{" "}object, so the wrong pair returns zero hits and the
                        right pair returns the film.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · a plain term query returns zero hits"
                    >
                        <p>
                            The trap runs in reverse too. Send a plain{" "}
                            <Code>term</Code> query at <Code>genres.name</Code> on a{" "}
                            <Code>nested</Code>{" "}field and you get zero hits — not an error
                            explaining that the field is nested, just an empty result, as
                            though no movie had that genre. If a filter on{" "}
                            <Code>genres.*</Code> mysteriously returns nothing, a missing{" "}
                            <Code>nested</Code>{" "}wrapper is the first thing to check.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the price is paid everywhere">
                        <p>
                            The wrapper is not only for queries: sorting, aggregating and
                            highlighting on a nested field each need their nested form too,
                            and the <Code>path</Code>{" "}has to be repeated in every one. One
                            line in the mapping changes the shape of every request that ever
                            touches the field.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="when NOT to use nested">
                    <CodeBlock code={NESTED_COST} lang="text" />
                    <p>
                        <Term>Nested objects are real documents, and they are not free.</Term>{" "}
                        A movie with twenty nested keywords is twenty-one Lucene documents,
                        not one. Every update to the parent reindexes the parent and all of
                        its hidden documents, because they are written as one block. And
                        every query that reaches into them pays for a join between the two
                        levels.
                    </p>
                    <p>
                        <Term>
                            So the decision rule is one question: do you ever query two
                            fields of the same object together?
                        </Term>{" "}
                        If yes, there is no choice — flat indexing cannot answer that
                        question correctly, and <Code>nested</Code>{" "}is the only option. If
                        no, and you only ever filter on one field at a time, flat is correct
                        and cheaper.
                    </p>
                    <CodeBlock code={DENORM_TS} lang="ts" />
                    <CodeBlock code={DENORM_CURL} lang="bash" />
                    <p>
                        <Term>
                            There is a pragmatic middle path, and it is denormalisation.
                        </Term>{" "}
                        Store <Code>genre_ids: [28, 878]</Code> and{" "}
                        <Code>genre_names: [...]</Code>{" "}as two flat arrays and stop
                        pretending the index holds objects. The pairing is lost — and it was
                        never needed, because the pairing lives in CouchDB, which is where
                        the application reads a genre&apos;s name from anyway.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · one movie, twenty-one documents"
                    >
                        <p>
                            The multiplier is what bites at scale: nest a field with a
                            hundred entries and a hundred-thousand-movie index becomes ten
                            million Lucene documents, with the write amplification to match
                            — a one-field update rewrites the whole block. Elasticsearch
                            caps the count per document for a reason. Nest small,
                            genuinely-paired collections; never nest a long list because the
                            JSON happened to arrive that way.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · let the UI decide">
                        <p>
                            Look at what the interface actually sends. A genre dropdown
                            sends ids and nothing else, and a flattened{" "}
                            <Code>genres.id</Code>{" "}answers that perfectly. It is only when
                            two fields of one object have to be true together — a rating
                            from a specific source, a translated title in a specific
                            language — that nesting becomes the requirement rather than a
                            precaution.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · where cineverse stands">
                        <p>
                            cineverse maps <Code>genres</Code> as <Code>nested</Code>, which
                            is correct and arguably over-engineered: nothing in the app
                            currently queries an id and a name together, so two flat arrays
                            would serve the genre filter at a fraction of the cost. It is
                            kept because the pairing is real in the source data — but it is
                            worth knowing it is a choice, not a necessity.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the part you cannot undo ---------- */}
            <PartHeading kicker="part 4">Changing a Mapping</PartHeading>
            <div>
                <DocSection title="mappings can't change">
                    <CodeBlock code={CHANGE_TS} lang="ts" />
                    <CodeBlock code={CHANGE_CURL} lang="bash" />
                    <CodeBlock code={CHANGE_REPLY} lang="json" />
                    <p>
                        <Term>
                            Ask for the change and Elasticsearch refuses, in as many words.
                        </Term>{" "}
                        <Code>status</Code> is a <Code>keyword</Code>; asking{" "}
                        <Code>PUT /_mapping</Code> to make it <Code>text</Code> is a{" "}
                        <Code>400 illegal_argument_exception</Code> —{" "}
                        <Code>mapper [status] cannot be changed</Code>. There is no force
                        flag and no migration mode.
                    </p>
                    <p>
                        <Term>The reason is that the data is already written.</Term>{" "}Those
                        values were analyzed as keywords when they were indexed and are
                        baked into immutable Lucene segments in that form. Accepting the new
                        type would leave the mapping claiming one thing and the terms saying
                        another, so Elasticsearch refuses rather than silently rewrite your
                        data — or worse, not rewrite it and lie about the field.
                    </p>
                    <CodeBlock code={ADD_TS} lang="ts" />
                    <CodeBlock code={ADD_CURL} lang="bash" />
                    <p>
                        <Term>
                            What <Code>PUT /_mapping</Code>{" "}can do is add.
                        </Term>{" "}
                        A field that has never been mapped has no terms in any segment, so
                        there is nothing to contradict: mapping <Code>imdb_rating</Code>{" "}as
                        a <Code>float</Code>{" "}is always allowed, and documents indexed from
                        that moment on use it. The additive list is short — new fields, new
                        sub-fields under an existing one, and a handful of harmless
                        parameters.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · there is no in-place type change"
                    >
                        <p>
                            An existing field&apos;s type, its analyzer and its
                            nested-ness are fixed for the life of the index. Every real
                            mapping change is therefore the same operation: create a new
                            index with the mapping you wanted, copy the documents into it,
                            and move the readers across. Plan for that instead of hoping for
                            an update API that does not exist.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · adding is not backfilling">
                        <p>
                            A newly added field applies to writes, not to what is already
                            there. The twelve thousand movies indexed yesterday have no{" "}
                            <Code>imdb_rating</Code>{" "}and will not grow one — the field is
                            mapped and empty until each document is written again.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="_reindex + alias swap">
                    <CodeBlock code={REINDEX_TS} lang="ts" />
                    <CodeBlock code={REINDEX_CURL} lang="bash" />
                    <CodeBlock code={REINDEX_REPLY} lang="json" />
                    <p>
                        <Term>
                            <Code>_reindex</Code>{" "}copies documents from one index into
                            another, re-analyzing them on the way.
                        </Term>{" "}
                        It reads <Code>_source</Code> out of <Code>movies_v1</Code>{" "}and
                        indexes it into <Code>movies_v2</Code>, where the destination
                        mapping decides how each field is typed and which analyzer runs. The
                        old index is untouched, so a failed rebuild costs nothing but time.
                    </p>
                    <p>
                        <Term>The response is a server-side bulk, and reads like one.</Term>{" "}
                        <Code>created</Code>, <Code>updated</Code>,{" "}
                        <Code>version_conflicts</Code> and — the one that matters —{" "}
                        <Code>failures</Code>, which is where every document that does not
                        fit the new mapping ends up. A stricter type in the destination is
                        the usual cause: a value that dynamic mapping accepted as text
                        cannot become a <Code>float</Code>.
                    </p>
                    <p>
                        <Term>On a large index, do not hold the connection open.</Term>{" "}
                        <Code>?wait_for_completion=false</Code>{" "}returns a task id
                        immediately and the copy continues in the background; poll{" "}
                        <Code>/_tasks/&lt;id&gt;</Code>{" "}for progress and for the same
                        counters at the end.
                    </p>
                    <CodeBlock code={RECIPE} lang="text" />
                    <p>
                        <Term>
                            Those five steps are the whole zero-downtime mapping change.
                        </Term>{" "}
                        The application only ever names the alias, so steps 2 and 3 happen
                        entirely out of sight, however long they take. Step 4 is one{" "}
                        <Code>_aliases</Code>{" "}request carrying both the remove and the add,
                        which is what makes the cutover atomic — there is no instant without
                        a <Code>movies</Code>{" "}to search.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · check failures, not the status code"
                    >
                        <p>
                            <Code>_reindex</Code> answers <Code>200</Code>{" "}having copied
                            twelve thousand documents and dropped one, and the count in{" "}
                            <Code>created</Code>{" "}is the only place that shows. Treat the
                            reply exactly like a bulk reply: read <Code>failures</Code>,
                            compare the document counts of the two indices, and only then
                            swap the alias.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · the alias is what makes it invisible">
                        <p>
                            <Code>_reindex</Code>{" "}is the copy; the alias is the deploy.
                            Without one, step 4 becomes a code change and a release, and the
                            rebuild is only zero-downtime on paper. This is the pay-off for
                            aliasing from day one, in Documents &amp; Indices.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · where cineverse stands">
                        <p>
                            With CouchDB as the source of truth, step 3 is often skipped
                            entirely: create <Code>movies_v2</Code>, run the existing
                            indexing script against it, swap the alias. Re-running the
                            pipeline rebuilds from the authoritative data and picks up any
                            change to the transform at the same time. <Code>_reindex</Code>{" "}
                            is for when Elasticsearch is the only place the data lives, or
                            when a copy inside the cluster is genuinely faster than a
                            rebuild from source.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside all four parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>How does searching &ldquo;running&rdquo; match a document saying &ldquo;run&rdquo;?</>}
                    a={
                        <>
                            &ldquo;The field uses a <Term>language analyzer</Term>{" "}— both the
                            document and the query are <Term>stemmed</Term>{" "}to the same
                            root, so they <Term>meet in the inverted index</Term>.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                Can you change a field from keyword to text on a live index?
                            </>
                        }
                        a={
                            <>
                                &ldquo;No — existing values are already{" "}
                                <Term>baked into the segments</Term>. Mapping changes are{" "}
                                <Term>additive only</Term>; a type change means a new index
                                plus <Term>_reindex</Term>, swapped in behind an{" "}
                                <Term>alias</Term>.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>Why did your genre filter return zero results?</>}
                        a={
                            <>
                                &ldquo;The field is mapped <Term>nested</Term>{" "}— its objects
                                are <Term>hidden sub-documents</Term>, so a plain{" "}
                                <Code>term</Code> query can&apos;t see them. It needs the{" "}
                                <Term>nested query wrapper</Term> with the right{" "}
                                <Code>path</Code>.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
