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
    // --- part 1 (Full-Text Queries) ---
    // inline `tip · operator: and when OR is too loose` and `note · total.value is
    // not what came back`
    "match-the-workhorse": ["tip", "note"],
    // inline `tip · write the text once` and `note · one string, different terms
    // per field`
    "multi-match-one-query-several-fields": ["tip", "note"],
    // inline `tip · best_fields is the right default here` and `note · cross_fields,
    // for completeness`
    "how-field-scores-merge-type": ["tip", "note"],
    // inline `trap · fuzziness buys hits and spends precision`, `tip · AUTO, never a
    // number` and `note · saying it in english`
    "fuzziness-typo-tolerance": ["trap", "tip", "note"],

    // --- part 2 (Term-Level Queries) ---
    // inline `trap · term on a text field returns nothing`, `tip · which query for
    // which type` and `note · read the mapping first`
    "term-terms-exact-lookup": ["trap", "tip", "note"],
    // inline `tip · date math instead of computed dates` and `note · what a range
    // can and cannot order`
    range: ["tip", "note"],
    // inline `trap · null, [] and absent are one state` and `note · CouchDB draws
    // this line differently`
    "exists-and-the-null-surprise": ["trap", "note"],

    // --- part 3 (Combining) ---
    // inline `trap · should changes meaning with its neighbours` and `note · should
    // is a slot, not a query`
    "bool-the-four-clauses": ["trap", "note"],
    // inline `trap · scoring a binary condition is ranking noise`, `tip · the
    // question that sorts must from filter` and `note · must_not is filter context`
    "query-context-vs-filter-context": ["trap", "tip", "note"],

    // --- part 4 (Paging & Ordering) ---
    // inline `danger · raising max_result_window` and `note · nobody clicks page 500`
    "pagination-from-size-and-the-10k-wall": ["danger", "note"],
    // inline `danger · a cursor without a unique tiebreaker` and `tip · which one
    // for which caller`
    "search-after-cursor-instead-of-offset": ["danger", "tip"],
    // inline `trap · sorting silently replaces relevance` and `note · the error that
    // explains title.raw`
    sorting: ["trap", "note"],

    // --- part 5 (Relevance) ---
    // inline `tip · _explain instead of guessing` and `note · scores are not
    // comparable across queries`
    "what-score-is-bm25": ["tip", "note"],
    // inline `tip · highlight only what you display` and `note · a field only
    // appears if it matched`
    highlighting: ["tip", "note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper the introduction, documents-indices and
// mappings-analysis content files each define for their own part dividers.
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

// PROJECT RULE 1, applied throughout this file: every operation appears in both
// forms — the Node client call and the curl that goes over the wire. Client
// first.
//
// PROJECT RULE 2: a comparison shows BOTH codes, never the conclusion alone.
// The two sides are named X and Y in the fragments so the prose can point at
// them, and for the bigger comparisons each side gets its own client fragment
// with a single curl fragment carrying both requests underneath.

const MATCH_TS = `await esClient.search({
    index: "movies",
    query: { match: { title: "dark knight rises" } },
});

// every term required instead of any
await esClient.search({
    index: "movies",
    query: {
        match: {
            title: {
                query: "dark knight rises",
                operator: "and",
            },
        },
    },
});`;

const MATCH_CURL = `curl -X GET 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "dark knight rises" } } }'

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "match": { "title": {
          "query": "dark knight rises",
          "operator": "and" } } } }'`;

// The query text goes through the FIELD'S analyzer before anything is looked up.
const MATCH_TERMS = `"dark knight rises"
      |   english analyzer — the one title is mapped with
      v
["dark", "knight", "rise"]

any one term is a hit          "Dark Waters" comes back too
all three, in a short title    scores highest`;

const MATCH_HITS = `{
  "took": 7,
  "hits": {
    "total": { "value": 42, "relation": "eq" },
    "max_score": 11.2,
    "hits": [
      { "_id": "49026", "_score": 11.2,
        "_source": { "title": "The Dark Knight Rises" } },
      { "_id": "155", "_score": 9.4,
        "_source": { "title": "The Dark Knight" } }
    ]
  }
}`;

const SHOULD_TS = `// X — one match per field, the text written three times
const text = "dark knight";

await esClient.search({
    index: "movies",
    query: {
        bool: {
            should: [
                { match: { title: { query: text, boost: 3 } } },
                { match: { overview: text } },
                { match: { tagline: text } },
            ],
        },
    },
});`;

const MULTI_TS = `// Y — the same thing, once. cineverse's production query
await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: text,
            fields: ["title^3", "overview", "tagline"],
        },
    },
});`;

const MULTI_CURL = `# X
curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": { "should": [
          { "match": { "title": {
              "query": "dark knight", "boost": 3 } } },
          { "match": { "overview": "dark knight" } },
          { "match": { "tagline": "dark knight" } }
        ] } } }'

# Y
curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "multi_match": {
          "query": "dark knight",
          "fields": ["title^3", "overview", "tagline"] } } }'`;

const TYPE_BEST_TS = `// X — best_fields: the default, and what cineverse uses
await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: "war",
            type: "best_fields",
            fields: ["title^3", "overview", "tagline"],
        },
    },
});`;

const TYPE_MOST_TS = `// Y — most_fields: one line different, another ranking
await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: "war",
            type: "most_fields",
            fields: ["title^3", "overview", "tagline"],
        },
    },
});`;

const TYPE_CURL = `# X
curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "multi_match": { "query": "war",
          "type": "best_fields",
          "fields": ["title^3", "overview", "tagline"] } } }'

# Y — same request, "type" swapped
curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "multi_match": { "query": "war",
          "type": "most_fields",
          "fields": ["title^3", "overview", "tagline"] } } }'`;

// Same two documents, same field scores, two different winners.
const TYPE_FLIP = `              title  overview  tagline | best   most
A  one field    9.0      -         -    |  9.0    9.0
B  everywhere   4.0     3.0       3.0   |  4.0   10.0

best_fields  ->  highest single field  ->  A wins
most_fields  ->  sum of the fields     ->  B wins`;

const FUZZY_TS = `// X — no fuzziness: "knihgt" is not a term in the index
await esClient.search({
    index: "movies",
    query: { match: { title: "dark knihgt" } },
});   // 0 hits

// Y — one parameter, and the typo is forgiven
await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: "dark knihgt",
            fields: ["title^3", "overview", "tagline"],
            fuzziness: "AUTO",
        },
    },
});   // The Dark Knight`;

const FUZZY_CURL = `# X
curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "dark knihgt" } } }'
# "hits": { "total": { "value": 0 } }

# Y
curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "multi_match": {
          "query": "dark knihgt",
          "fields": ["title^3", "overview", "tagline"],
          "fuzziness": "AUTO" } } }'`;

// AUTO reads the term length and picks the distance. This is why you never
// hard-code a number.
const FUZZY_AUTO = `edit distance = insert | delete | substitute | swap

"knihgt" -> "knight"     one swap of adjacent letters

AUTO, by term length
  1-2 chars   0 edits    "up" stays exact
  3-5 chars   1 edit     "wars" also matches "mars"
  6+  chars   2 edits    "knihgt" reaches "knight"`;

const TERM_TS = `// a plain keyword field — the value is looked up as sent
await esClient.search({
    index: "movies",
    query: { term: { original_language: "en" } },
});

// a keyword INSIDE a nested field — same term, wrapped
await esClient.search({
    index: "movies",
    query: {
        nested: {
            path: "genres",
            query: { term: { "genres.name": "Action" } },
        },
    },
});`;

const TERM_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "term": { "original_language": "en" } } }'

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "nested": { "path": "genres",
          "query": { "term": {
            "genres.name": "Action" } } } } }'`;

// Which query a field takes is decided by the mapping, not by the value.
const TERM_MAPPING = `original_language   keyword           ->  term, bare
genres              nested
  genres.name       keyword           ->  term, inside nested
title               text (english)    ->  match, never term`;

const TERMS_TS = `// terms — any value in the list. SQL's IN
await esClient.search({
    index: "movies",
    query: {
        terms: { original_language: ["en", "fr", "de"] },
    },
});`;

const TERMS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "terms": {
          "original_language": ["en", "fr", "de"] } } }'`;

const TERM_TRAP_TS = `// X — term against a text field
await esClient.search({
    index: "movies",
    query: { term: { title: "The Dark Knight" } },
});   // 0 hits

// Y — the same intent, on the query built for text
await esClient.search({
    index: "movies",
    query: { match: { title: "The Dark Knight" } },
});   // The Dark Knight`;

const TERM_TRAP_CURL = `# X — index holds ["dark", "knight"]; the term sent is
#     "The Dark Knight", whole and unanalyzed
curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "term": { "title": "The Dark Knight" } } }'
# "hits": { "total": { "value": 0 } }   200 OK

# Y
curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "match": { "title": "The Dark Knight" } } }'`;

const RANGE_TS = `await esClient.search({
    index: "movies",
    query: { range: { vote_average: { gte: 7.5 } } },
});

// cineverse's year filter — an explicit date interval
await esClient.search({
    index: "movies",
    query: {
        range: {
            release_date: {
                gte: \`\${year}-01-01\`,
                lte: \`\${year}-12-31\`,
            },
        },
    },
});`;

const RANGE_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "range": {
          "vote_average": { "gte": 7.5 } } } }'

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "range": { "release_date": {
          "gte": "2020-01-01", "lte": "2020-12-31" } } } }'`;

const RANGE_DATES = `date math, resolved by Elasticsearch
  { "gte": "now-1y" }     the last year
  { "gte": "now-30d" }    the last thirty days
  { "gte": "now/d" }      today, rounded down to midnight

the same year filter, in one line
  { "gte": "2020", "lte": "2020" }
      a bare year expands against the date format`;

const EXISTS_TS = `// has this document any indexed value under "tagline"?
await esClient.search({
    index: "movies",
    query: { exists: { field: "tagline" } },
});

// there is no "missing" query — negate exists
await esClient.search({
    index: "movies",
    query: {
        bool: { must_not: [{ exists: { field: "tagline" } }] },
    },
});`;

const EXISTS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "exists": { "field": "tagline" } } }'

curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "bool": { "must_not": [
          { "exists": { "field": "tagline" } } ] } } }'`;

const EXISTS_TABLE = `"tagline": "A hero rises"   one term indexed   -> true
"tagline": ""              a term indexed     -> true
"tagline": null            nothing indexed    -> false
"tagline": []              nothing indexed    -> false
no "tagline" key           nothing indexed    -> false`;

const BOOL_TS = `// one search form, mapped onto the four slots
const search = {
    multi_match: {
        query: "dark knight",
        fields: ["title^3", "overview", "tagline"],
    },
};

const filters = [
    { range: { release_date: { gte: "2008-01-01" } } },
    { range: { vote_average: { gte: 7 } } },
];

const actionGenre = {
    nested: {
        path: "genres",
        query: { term: { "genres.name": "Action" } },
    },
};

await esClient.search({
    index: "movies",
    query: {
        bool: {
            must: [search],
            filter: filters,
            must_not: [{ term: { original_language: "fr" } }],
            should: [actionGenre],
        },
    },
});`;

const BOOL_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": {
    "must": [ { "multi_match": {
      "query": "dark knight",
      "fields": ["title^3", "overview", "tagline"] } } ],
    "filter": [
      { "range": { "release_date": { "gte": "2008-01-01" } } },
      { "range": { "vote_average": { "gte": 7 } } } ],
    "must_not": [ { "term": { "original_language": "fr" } } ],
    "should": [ { "nested": { "path": "genres",
      "query": { "term": { "genres.name": "Action" } } } } ]
  } } }'`;

const BOOL_CLAUSES = `must      must match, and it scores
filter    must match, no score, cacheable
must_not  must not match, no score
should    optional — raises the score of what matches

must + filter + must_not   decide WHO is in the results
should, beside them        only REORDERS them`;

const CONTEXT_X_TS = `// X — every condition in must, so every condition scores
await esClient.search({
    index: "movies",
    query: {
        bool: {
            must: [
                { multi_match: { query: text, fields } },
                { term: { original_language: "en" } },
                { range: { vote_average: { gte: 7 } } },
            ],
        },
    },
});`;

const CONTEXT_Y_TS = `// Y — cineverse's split: text scores, conditions filter
await esClient.search({
    index: "movies",
    query: {
        bool: {
            must: [{ multi_match: { query: text, fields } }],
            filter: [
                { term: { original_language: "en" } },
                { range: { vote_average: { gte: 7 } } },
            ],
        },
    },
});`;

const CONTEXT_CURL = `# X — three clauses, three scores to compute, no cache
curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": { "must": [
          { "multi_match": { "query": "dark knight",
            "fields": ["title^3", "overview"] } },
          { "term": { "original_language": "en" } },
          { "range": { "vote_average": { "gte": 7 } } }
        ] } } }'

# Y — same movies, one score, two cacheable filters
curl 'localhost:9200/movies/_search' \\
  -d '{ "query": { "bool": {
          "must": [ { "multi_match": { "query": "dark knight",
            "fields": ["title^3", "overview"] } } ],
          "filter": [
            { "term": { "original_language": "en" } },
            { "range": { "vote_average": { "gte": 7 } } } ]
        } } }'`;

const PAGE_TS = `// cineverse's pagination — page number in, offset out
const from = (page - 1) * limit;

await esClient.search({
    index: "movies",
    from,
    size: limit,
    query,
});`;

const PAGE_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "from": 40, "size": 20,
        "query": { "match_all": {} } }'`;

const PAGE_WALL = `from 40,    size 20    collect 60,    discard 40
from 9980,  size 20    collect 10000, discard 9980
from 10000, size 20    400 illegal_argument_exception
                       "Result window is too large"

the work grows with the offset, not with the page size
index.max_result_window = 10000, and raising it is a bill`;

const AFTER_X_TS = `// X — offset: page 3 collects 60 hits to show 20
await esClient.search({
    index: "movies",
    from: 40,
    size: 20,
    query: { match_all: {} },
});`;

const AFTER_Y_TS = `// Y — cursor: page 1 sorts explicitly and sets no "from"
await esClient.search({
    index: "movies",
    size: 20,
    sort: [{ vote_average: "desc" }, { tmdb_id: "asc" }],
    query: { match_all: {} },
});

// page 2 — start after the last hit of page 1
await esClient.search({
    index: "movies",
    size: 20,
    sort: [{ vote_average: "desc" }, { tmdb_id: "asc" }],
    search_after: [7.8, 603692],
    query: { match_all: {} },
});`;

const AFTER_CURL = `# X
curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "from": 40, "size": 20,
        "query": { "match_all": {} } }'

# Y — the cursor is the sort values of the last hit
curl 'localhost:9200/movies/_search' \\
  -d '{ "size": 20,
        "sort": [ { "vote_average": "desc" },
                  { "tmdb_id": "asc" } ],
        "search_after": [7.8, 603692],
        "query": { "match_all": {} } }'`;

// Every hit carries the values its sort produced — that array IS the cursor.
const AFTER_HITS = `"hits": [
  { "_id": "603692", "_score": null,
    "_source": { "vote_average": 7.8, "tmdb_id": 603692 },
    "sort": [7.8, 603692] }
]`;

const AFTER_WALK_TS = `let after: unknown[] | undefined;

while (true) {
    const res = await esClient.search({
        index: "movies",
        size: 1000,
        sort: [{ vote_average: "desc" }, { tmdb_id: "asc" }],
        search_after: after,
        query: { match_all: {} },
    });

    const hits = res.hits.hits;
    if (!hits.length) break;

    await handleBatch(hits);
    after = hits[hits.length - 1].sort;
}`;

const SORT_TS = `await esClient.search({
    index: "movies",
    sort: [{ vote_average: "desc" }, { release_date: "desc" }],
    query: { match: { title: "war" } },
});

// relevance first, rating as the tiebreaker
await esClient.search({
    index: "movies",
    sort: ["_score", { vote_average: "desc" }],
    query: { match: { title: "war" } },
});`;

const SORT_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "sort": [ { "vote_average": "desc" },
                  { "release_date": "desc" } ],
        "query": { "match": { "title": "war" } } }'

curl 'localhost:9200/movies/_search' \\
  -d '{ "sort": [ "_score", { "vote_average": "desc" } ],
        "query": { "match": { "title": "war" } } }'`;

const SORT_TRAP_TS = `// X — sorting on the text field
await esClient.search({
    index: "movies",
    sort: [{ title: "asc" }],
    query: { match_all: {} },
});   // ResponseError: illegal_argument_exception

// Y — search the text, sort the keyword sub-field
await esClient.search({
    index: "movies",
    sort: [{ "title.raw": "asc" }],
    query: { match: { title: "war" } },
});`;

const SORT_TRAP_CURL = `# X
curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "sort": [ { "title": "asc" } ] }'
# 400 "Text fields are not optimised for operations that
#      require per-document field data ... use a keyword
#      field instead"

# Y
curl 'localhost:9200/movies/_search' \\
  -d '{ "sort": [ { "title.raw": "asc" } ] }'`;

const BM25 = `score  ~  TF        term appears more in this field
       x  IDF       term is rare across the index
       /  length    a short field beats a long one

"the"     in every movie   IDF ~ 0     decides nothing
"knight"  in 40 movies     IDF high    decides the order

"War" as the whole title       short field, strong
"war" in a 300-word overview   long field, diluted`;

const EXPLAIN_TS = `await esClient.explain({
    index: "movies",
    id: "49026",
    query: { match: { title: "dark knight" } },
});`;

const EXPLAIN_CURL = `curl -X GET 'localhost:9200/movies/_explain/49026' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "dark knight" } } }'`;

const EXPLAIN_OUT = `{
  "matched": true,
  "explanation": {
    "value": 11.2,
    "description": "sum of:",
    "details": [
      { "value": 5.1, "description": "weight(title:dark)",
        "details": [
          { "value": 1.0, "description": "freq, tf" },
          { "value": 3.4, "description": "idf" },
          { "value": 0.7, "description": "dl / avgdl" } ] }
    ]
  }
}`;

const HIGHLIGHT_TS = `await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: "dark knight",
            fields: ["title^3", "overview", "tagline"],
        },
    },
    highlight: {
        fields: { title: {}, overview: {} },
    },
});`;

const HIGHLIGHT_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "multi_match": {
          "query": "dark knight",
          "fields": ["title^3", "overview", "tagline"] } },
        "highlight": { "fields": {
          "title": {}, "overview": {} } } }'`;

// The highlight block sits BESIDE _source, which is still the untouched
// document — one hit carries both.
const HIGHLIGHT_OUT = `"hits": [
  { "_id": "155", "_score": 11.2,
    "_source": {
      "title": "The Dark Knight",
      "overview": "Batman raises the stakes in his war..."
    },
    "highlight": {
      "title": ["The <em>Dark</em> <em>Knight</em>"],
      "overview": [
        "...raises the stakes in his war on crime..."
      ]
    } }
]`;

const HIGHLIGHT_KNOBS = `pre_tags / post_tags   <em> by default, <mark> if you ask
fragment_size          ~100 characters around a match
number_of_fragments    how many pieces per field

a short title comes back whole, a long overview in pieces —
an array of fragments either way`;

export function SearchQueriesDocs() {
    return (
        <>
            {/* ---------- part 1 — queries that read words ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Full-Text Queries</PartHeading>
            <div>
                <DocSection title="match: the workhorse">
                    <CodeBlock code={MATCH_TS} lang="ts" />
                    <CodeBlock code={MATCH_CURL} lang="bash" />
                    <CodeBlock code={MATCH_TERMS} lang="text" />
                    <p>
                        <Term>
                            <Code>match</Code>{" "}is the full-text query, and its defining
                            move is that your input is analyzed too.
                        </Term>{" "}
                        The string is run through the analyzer of the field being queried —
                        not a fixed one, the field&apos;s own — and the terms that come out
                        are what gets looked up in the inverted index. Both sides of the
                        comparison were built by the same machine, which is why they meet.
                    </p>
                    <p>
                        <Term>The default combination of those terms is OR.</Term>{" "}A
                        document matching one term is a hit, so{" "}
                        <Code>&quot;dark knight rises&quot;</Code> also returns{" "}
                        <em>Dark Waters</em> — it has <Code>dark</Code>. Matching more of
                        the terms does not decide <em>whether</em>{" "}a document is returned;
                        it decides how high it scores, which is what puts the film you meant
                        at the top.
                    </p>
                    <CodeBlock code={MATCH_HITS} lang="json" />
                    <p>
                        <Term>The reply is a ranked list, not a set.</Term>{" "}
                        <Code>took</Code> is milliseconds spent,{" "}
                        <Code>hits.hits</Code> is the array — each entry carrying{" "}
                        <Code>_id</Code>, <Code>_score</Code> and the{" "}
                        <Code>_source</Code>{" "}you indexed — and the array is already sorted
                        by <Code>_score</Code>{" "}descending, so the order in JSON is the order
                        to render.
                    </p>

                    <Callout severity="note" label="note · total.value is not what came back">
                        <p>
                            <Code>hits.total.value</Code> counts the documents that{" "}
                            <em>match</em>; the array holds the ten that were{" "}
                            <em>returned</em>, because <Code>size</Code>{" "}defaults to 10.
                            Those forty-two are the number for &ldquo;42 results&rdquo; in
                            the UI, and <Code>relation</Code>{" "}tells you whether it is exact
                            (<Code>eq</Code>) or a lower bound (<Code>gte</Code>), which is
                            what you get once the count is expensive enough that
                            Elasticsearch stops early.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · operator: and when OR is too loose">
                        <p>
                            On a short field like a title, requiring every term is often what
                            the reader meant: <Code>operator: &quot;and&quot;</Code>{" "}turns
                            the OR into an AND without changing anything else. Between the
                            two extremes sits <Code>minimum_should_match: &quot;75%&quot;</Code>{" "}
                            — most of the terms, not all of them.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="multi_match: one query, several fields">
                    <CodeBlock code={SHOULD_TS} lang="ts" />
                    <CodeBlock code={MULTI_TS} lang="ts" />
                    <CodeBlock code={MULTI_CURL} lang="bash" />
                    <p>
                        <Term>One <Code>match</Code> reads one field.</Term>{" "}The text a
                        reader types could belong to any of three: the title, the overview,
                        or the tagline. X is the honest long form of that — a{" "}
                        <Code>bool.should</Code> with one <Code>match</Code>{" "}per field, the
                        title boosted. Y is <Code>multi_match</Code>, which expands into
                        exactly that internally.
                    </p>
                    <p>
                        <Term>Y wins on the things that go wrong later.</Term>{" "}The query
                        text is written once instead of three times — in X it is a variable
                        repeated three times, and the day someone edits two of the three is
                        the day the search goes subtly wrong. The boosts sit in the field
                        list rather than in three separate clauses, and switching how the
                        fields combine is one line. X stays useful when the fields need{" "}
                        <em>different</em>{" "}text or different query types, which is a
                        different requirement, not this one.
                    </p>
                    <p>
                        <Term>Component by component.</Term> <Code>query</Code>{" "}is the raw
                        user text, unescaped and untouched. <Code>fields</Code>{" "}is where to
                        look, with equal weight unless you say otherwise.{" "}
                        <Code>^3</Code> is a boost: a hit in <Code>title</Code>{" "}scores three
                        times what the same hit scores elsewhere. That number is the
                        sentence &ldquo;the title matters most&rdquo; written as ranking —
                        the film <em>titled</em>{" "}Dark Knight must beat the one whose plot
                        summary mentions it, and without the boost it might not.
                    </p>

                    <Callout severity="note" label="note · one string, different terms per field">
                        <p>
                            The same text is analyzed once per field, by that field&apos;s
                            analyzer. In cineverse <Code>title</Code> and{" "}
                            <Code>overview</Code> are <Code>english</Code> while{" "}
                            <Code>tagline</Code> is <Code>standard</Code>, so one string can
                            become <Code>[&quot;rise&quot;]</Code> against two fields and{" "}
                            <Code>[&quot;rises&quot;]</Code>{" "}against the third. Nothing is
                            wrong when that happens — but it explains a field that stubbornly
                            fails to match.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · write the text once">
                        <p>
                            Every duplicated occurrence of the user&apos;s input in a query
                            builder is a place for them to drift apart.{" "}
                            <Code>multi_match</Code>{" "}is the shorthand that removes the
                            duplication, and it is what{" "}
                            <Code>movies.service.ts</Code>{" "}sends in production.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="how field scores merge: type">
                    <CodeBlock code={TYPE_BEST_TS} lang="ts" />
                    <CodeBlock code={TYPE_MOST_TS} lang="ts" />
                    <CodeBlock code={TYPE_CURL} lang="bash" />
                    <CodeBlock code={TYPE_FLIP} lang="text" />
                    <p>
                        <Term>
                            <Code>type</Code>{" "}decides what happens to the per-field scores
                            once they exist.
                        </Term>{" "}
                        <Code>best_fields</Code>{" "}— the default, and what cineverse uses —
                        takes the <em>highest single field score</em>{" "}as the final score. A
                        document that matches one field strongly wins.{" "}
                        <Code>most_fields</Code> <em>sums</em>{" "}them instead, so a document
                        that matches a little everywhere wins.
                    </p>
                    <p>
                        <Term>The table is the whole argument.</Term>{" "}Movie A scores 9.0 in
                        the title and nothing elsewhere; Movie B scores 4.0, 3.0 and 3.0.
                        Under <Code>best_fields</Code>{" "}A is first at 9.0 against B&apos;s
                        4.0. Under <Code>most_fields</Code>{" "}B is first at 10.0 against
                        A&apos;s 9.0. Same documents, same field scores, opposite winner —
                        which is why this parameter is not a detail.
                    </p>
                    <p>
                        <Term>So pick by where the answer lives.</Term>{" "}If the thing the
                        reader is looking for is named in <em>one</em> field —{" "}
                        a movie title — <Code>best_fields</Code>{" "}is right, and a title match
                        should not be diluted by an unrelated word in a long overview. If
                        the same text is indexed several ways —{" "}
                        <Code>title</Code>, <Code>title.english</Code>,{" "}
                        <Code>title.ngram</Code> — <Code>most_fields</Code>{" "}is right, because
                        agreement across those fields is evidence.
                    </p>

                    <Callout severity="tip" label="tip · best_fields is the right default here">
                        <p>
                            Leaving <Code>type</Code> out gives you{" "}
                            <Code>best_fields</Code>, which is the correct behaviour for a
                            movie search box — so cineverse&apos;s query says nothing about
                            it. Write it explicitly the day you have a reason to; do not
                            change it because <Code>most_fields</Code>{" "}sounds more thorough.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · cross_fields, for completeness">
                        <p>
                            The third one you will meet is <Code>cross_fields</Code>, which
                            treats the listed fields as one virtual field: it is how{" "}
                            <Code>first_name</Code> and <Code>last_name</Code>{" "}together
                            match <Code>&quot;john smith&quot;</Code>, where no single field
                            contains both terms. Recognising it is enough — a movie title
                            search does not need it.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="fuzziness: typo tolerance">
                    <CodeBlock code={FUZZY_TS} lang="ts" />
                    <CodeBlock code={FUZZY_CURL} lang="bash" />
                    <CodeBlock code={FUZZY_AUTO} lang="text" />
                    <p>
                        <Term>Without fuzziness a typo is simply not a term.</Term>{" "}X asks
                        for <Code>knihgt</Code>, the index contains{" "}
                        <Code>knight</Code>, and nothing matches — zero hits for a query the
                        reader considers correct. Y adds one parameter and the film comes
                        back.
                    </p>
                    <p>
                        <Term>
                            The mechanism is Levenshtein edit distance: how many
                            single-character edits turn one term into the other.
                        </Term>{" "}
                        Insert, delete, substitute, and — because it is the typo everyone
                        actually makes — swap two adjacent characters.{" "}
                        <Code>knihgt</Code> to <Code>knight</Code>{" "}is one swap, so it is
                        found at distance 1.
                    </p>
                    <p>
                        <Term>
                            <Code>AUTO</Code>{" "}exists because a fixed distance is wrong at
                            some length.
                        </Term>{" "}
                        Allow 2 edits on a three-letter term and it matches most of the
                        dictionary; allow 1 on a fifteen-letter term and a small typo still
                        fails. <Code>AUTO</Code>{" "}scales — 0 edits up to 2 characters, 1 up to
                        5, 2 beyond — and gets it right at every length, which is why you can
                        stop thinking about the numbers.
                    </p>
                    <p>
                        <Term>Fuzziness applies after analysis, not to your raw string.</Term>{" "}
                        The text is analyzed into terms first, and each term is then expanded
                        to its near neighbours — so on an <Code>english</Code>{" "}field the
                        candidate is compared against stems, not against the words you typed.
                    </p>

                    <Callout severity="trap" label="trap · fuzziness buys hits and spends precision">
                        <p>
                            Each fuzzy term becomes many candidate term lookups instead of
                            one, so the query costs more — noticeable on a large index with
                            several fuzzy fields. And the tolerance cuts both ways:{" "}
                            <Code>MARS</Code> matches <Code>WARS</Code> at distance 1, so{" "}
                            <em>Star Wars</em>{" "}answers a search for Mars. For a movie search
                            bar that is the right trade — an empty result is worse than an
                            extra one — but it is a trade, not a free upgrade, and it is the
                            wrong one for an exact-lookup field.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · AUTO, never a number">
                        <p>
                            <Code>fuzziness: 2</Code>{" "}is a decision made without knowing the
                            term it will be applied to. <Code>fuzziness: &quot;AUTO&quot;</Code>{" "}
                            makes that decision per term, correctly, for free.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · saying it in english">
                        <p>
                            <em>Fuzzy</em> means blurry, out of focus, imprecise —{" "}
                            <em>fuzzy matching</em>{" "}is matching where &ldquo;close
                            enough&rdquo; counts, as opposed to <em>exact match</em>. It is
                            the same idea as the fuzzy search in an editor, where{" "}
                            <Code>Ctrl+P</Code> and <Code>movserv</Code> find{" "}
                            <Code>movies.service.ts</Code>. The sentence to have ready:
                            &ldquo;we made the search fuzzy so typos don&apos;t return empty
                            results&rdquo;.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — queries that read values ---------- */}
            <PartHeading kicker="part 2">Term-Level Queries</PartHeading>
            <div>
                <DocSection title="term & terms: exact lookup">
                    <CodeBlock code={TERM_TS} lang="ts" />
                    <CodeBlock code={TERM_CURL} lang="bash" />
                    <CodeBlock code={TERM_MAPPING} lang="text" />
                    <p>
                        <Term>Term-level queries do not analyze anything.</Term>{" "}The value
                        you send is looked up exactly as sent — which is precisely right for
                        a <Code>keyword</Code>{" "}field, because that side was never analyzed
                        either. Both halves stay raw, so both halves meet:{" "}
                        <Code>&quot;en&quot;</Code> is the term in the index and{" "}
                        <Code>&quot;en&quot;</Code>{" "}is the term you asked for.
                    </p>
                    <p>
                        <Term>The mapping tells you which form to send.</Term>{" "}
                        <Code>original_language</Code> is a plain <Code>keyword</Code>, so a
                        bare <Code>term</Code> is the query. <Code>genres</Code> is{" "}
                        <Code>nested</Code> with a <Code>keyword</Code>{" "}inside it, so the
                        identical <Code>term</Code> has to travel inside a{" "}
                        <Code>nested</Code>{" "}wrapper naming its path — the requirement from
                        Mappings &amp; Analysis, met here.
                    </p>
                    <CodeBlock code={TERMS_TS} lang="ts" />
                    <CodeBlock code={TERMS_CURL} lang="bash" />
                    <p>
                        <Term>
                            <Code>terms</Code>{" "}is the same query against a list.
                        </Term>{" "}
                        A document matches when the field holds any one of the values — SQL&apos;s{" "}
                        <Code>IN</Code>, and the natural shape for a multi-select filter in
                        a UI.
                    </p>
                    <CodeBlock code={TERM_TRAP_TS} lang="ts" />
                    <CodeBlock code={TERM_TRAP_CURL} lang="bash" />

                    <Callout severity="trap" label="trap · term on a text field returns nothing">
                        <p>
                            X asks for the term <Code>&quot;The Dark Knight&quot;</Code> in a{" "}
                            <Code>text</Code> field whose index contains{" "}
                            <Code>[&quot;dark&quot;, &quot;knight&quot;]</Code>. The whole
                            unanalyzed string is not one of those terms, so it matches
                            nothing — <Code>200 OK</Code>, zero hits, no explanation. It is
                            the same silent family as the missing <Code>nested</Code>{" "}
                            wrapper: the query is valid, the answer is empty, and nothing
                            points at the cause.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · which query for which type">
                        <p>
                            <Code>term</Code> and <Code>terms</Code> for{" "}
                            <Code>keyword</Code> fields, numbers and dates.{" "}
                            <Code>match</Code> for <Code>text</Code>. Two sentences, and
                            most of the zero-hit mysteries in a young project never happen.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · read the mapping first">
                        <p>
                            Which of the two a field takes is not something you can tell
                            from the value — <Code>&quot;Action&quot;</Code> and{" "}
                            <Code>&quot;The Dark Knight&quot;</Code> are both strings.{" "}
                            <Code>GET /movies</Code>{" "}answers it, and it is the first thing to
                            look at when a filter behaves oddly.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="range">
                    <CodeBlock code={RANGE_TS} lang="ts" />
                    <CodeBlock code={RANGE_CURL} lang="bash" />
                    <p>
                        <Term>
                            <Code>range</Code> takes four bounds — <Code>gte</Code>,{" "}
                            <Code>gt</Code>, <Code>lte</Code>, <Code>lt</Code>{" "}— and you
                            combine them freely.
                        </Term>{" "}
                        One bound is an open range, two is an interval, and the same query
                        shape covers &ldquo;rated 7.5 or better&rdquo; and &ldquo;released
                        in 2020&rdquo;. cineverse&apos;s year filter is the second: a{" "}
                        <Code>gte</Code> on the first of January and an <Code>lte</Code>{" "}on
                        the thirty-first of December, built from the year with template
                        strings.
                    </p>
                    <CodeBlock code={RANGE_DATES} lang="text" />
                    <p>
                        <Term>On a date field the bounds understand date math.</Term>{" "}
                        <Code>now-1y</Code>, <Code>now-30d</Code> and{" "}
                        <Code>now/d</Code>{" "}are resolved by Elasticsearch at query time, which
                        is what &ldquo;recently added&rdquo; and &ldquo;this
                        week&rdquo; features are made of — no dates computed in the
                        application, nothing to get wrong about time zones or month lengths.
                    </p>
                    <p>
                        <Term>A bare year works too, and expands.</Term>{" "}
                        <Code>{`{ "gte": "2020", "lte": "2020" }`}</Code>{" "}is read against the
                        field&apos;s date format and covers the whole year, so the filter
                        fits on one line. Both forms are correct; cineverse keeps the
                        explicit interval, which says what it means without knowing the
                        expansion rules.
                    </p>

                    <Callout severity="tip" label="tip · date math instead of computed dates">
                        <p>
                            <Code>&quot;now-30d&quot;</Code>{" "}is a string in the query;
                            computing that date in the application means a clock, a time
                            zone and a serialisation format, all of which can disagree with
                            the cluster. Let Elasticsearch do arithmetic on its own idea of
                            now.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · what a range can and cannot order">
                        <p>
                            Numbers and dates are the obvious cases; a{" "}
                            <Code>keyword</Code>{" "}range works too and compares
                            alphabetically, which is occasionally what you want. On a{" "}
                            <Code>text</Code>{" "}field a range is meaningless — the index holds
                            analyzed terms, so there is no value to be greater or less than.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="exists and the null surprise">
                    <CodeBlock code={EXISTS_TS} lang="ts" />
                    <CodeBlock code={EXISTS_CURL} lang="bash" />
                    <CodeBlock code={EXISTS_TABLE} lang="text" />
                    <p>
                        <Term>
                            <Code>exists</Code>{" "}asks one question: does this document have
                            any indexed value under this field name?
                        </Term>{" "}
                        It never reads the value and cannot compare it — which makes it the
                        query for &ldquo;movies that actually have a tagline&rdquo;, and the
                        building block for the opposite, since there is no{" "}
                        <Code>missing</Code> query: you negate <Code>exists</Code> inside{" "}
                        <Code>bool.must_not</Code>.
                    </p>
                    <p>
                        <Term>
                            The surprise is what counts as &ldquo;no value&rdquo;.
                        </Term>{" "}
                        <Code>null</Code>, an empty array, and a field that is not in the
                        JSON at all <em>all fail</em> <Code>exists</Code>{" "}— because
                        Elasticsearch indexes terms, and all three produce none. From the
                        index&apos;s point of view they are one state, not three. An empty
                        string, on the other hand, <em>passes</em>: <Code>&quot;&quot;</Code>{" "}
                        is a value, it is indexed, and the field exists.
                    </p>

                    <Callout severity="trap" label="trap · null, [] and absent are one state">
                        <p>
                            So <Code>exists</Code>{" "}cannot answer &ldquo;which movies were
                            given an explicit null?&rdquo; — that information does not
                            survive indexing. If the distinction matters, index it as
                            something: a boolean flag, or a sentinel value. And note the
                            asymmetry that trips people up in tests:{" "}
                            <Code>&quot;&quot;</Code> and <Code>null</Code>{" "}feel equally
                            empty and behave in opposite ways.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · CouchDB draws this line differently">
                        <p>
                            In CouchDB a document with <Code>tagline: null</Code>{" "}and one
                            without the key are two different documents, and a view can tell
                            them apart. Push both through the sync pipeline and
                            Elasticsearch flattens the difference away — the nulls simply
                            vanish. Nothing is broken; the search layer just has a coarser
                            notion of absence than the store it mirrors.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — putting clauses together ---------- */}
            <PartHeading kicker="part 3">Combining</PartHeading>
            <div>
                <DocSection title="bool: the four clauses">
                    <CodeBlock code={BOOL_TS} lang="ts" />
                    <CodeBlock code={BOOL_CURL} lang="bash" />
                    <CodeBlock code={BOOL_CLAUSES} lang="text" />
                    <p>
                        <Term>
                            <Code>bool</Code>{" "}is the combiner, and every real query ends up
                            inside one.
                        </Term>{" "}
                        A search box alone is a <Code>multi_match</Code>; a search box with
                        filters, exclusions and preferences is a <Code>bool</Code>{" "}holding
                        all of them. cineverse builds{" "}
                        <Code>{`{ bool: { must, filter } }`}</Code>{" "}and adds clauses as the
                        UI grows.
                    </p>
                    <p>
                        <Term>Four slots, and each one answers a different question.</Term>{" "}
                        <Code>must</Code>: it has to match, and it contributes to the score.{" "}
                        <Code>filter</Code>: it has to match, and it does not.{" "}
                        <Code>must_not</Code>: it must not match. <Code>should</Code>: it is
                        optional, and matching raises the score. In the example above that
                        reads as one sentence — movies about the dark knight, from 2008 or
                        later, rated 7 or better, not in French, and Action films first.
                    </p>
                    <p>
                        <Term>Which is the rule for reading any bool query.</Term>{" "}
                        <Code>must</Code>, <Code>filter</Code> and <Code>must_not</Code>{" "}
                        decide <em>who</em> is in the results; <Code>should</Code>{" "}— when it
                        has neighbours — only decides <em>in what order</em>. Removing a{" "}
                        <Code>should</Code>{" "}clause changes the ranking and not the result
                        set.
                    </p>

                    <Callout severity="note" label="note · should is a slot, not a query">
                        <p>
                            There is no top-level <Code>should</Code> query.{" "}
                            <Code>match</Code>, <Code>term</Code> and{" "}
                            <Code>range</Code> are query types you can send on their own;{" "}
                            <Code>must</Code>, <Code>filter</Code>,{" "}
                            <Code>must_not</Code> and <Code>should</Code>{" "}are the four keys
                            of <Code>bool</Code>{" "}and mean nothing outside it.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · should changes meaning with its neighbours">
                        <p>
                            A <Code>bool</Code> with <em>only</em>{" "}
                            <Code>should</Code>{" "}clauses requires at least one of them to
                            match — it behaves as an OR. Add a <Code>must</Code> or a{" "}
                            <Code>filter</Code>{" "}beside it and the same clause suddenly
                            requires nothing at all: it becomes a pure score bonus. One
                            clause, two behaviours, decided by what sits next to it — which
                            is why a genre &ldquo;preference&rdquo; can silently turn into a
                            genre requirement when the rest of the query is emptied. Say what
                            you mean with <Code>minimum_should_match</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="query context vs filter context">
                    <CodeBlock code={CONTEXT_X_TS} lang="ts" />
                    <CodeBlock code={CONTEXT_Y_TS} lang="ts" />
                    <CodeBlock code={CONTEXT_CURL} lang="bash" />
                    <p>
                        <Term>Both queries return the same movies.</Term>{" "}X puts the text
                        search, the language term and the rating range in{" "}
                        <Code>must</Code>; Y keeps the text in <Code>must</Code>{" "}and moves
                        the other two into <Code>filter</Code>. Identical result set,
                        different ranking and very different cost.
                    </p>
                    <p>
                        <Term>
                            <Code>must</Code>{" "}is query context: every clause computes a
                            score. <Code>filter</Code>{" "}is filter context: yes or no, and
                            cacheable.
                        </Term>{" "}
                        In filter context Elasticsearch keeps the set of matching documents
                        as a bitset and reuses it for the next query that asks the same
                        thing — nothing to score, nothing to recompute.
                    </p>
                    <p>
                        <Term>Which is why X is wrong even though it works.</Term>{" "}
                        &ldquo;How relevantly is this movie in English?&rdquo; is not a
                        question: the answer is yes or no, and feeding it into the score
                        adds noise to the ranking, spends computation on a decision already
                        made, and gives up the cache. Thousands of readers share{" "}
                        <Code>language=en</Code> and <Code>rating&gt;=7</Code>{" "}while each
                        types something different — in Y the shared parts become cached
                        bitsets and only the text is scored fresh.
                    </p>

                    <Callout severity="tip" label="tip · the question that sorts must from filter">
                        <p>
                            Does this clause deserve to influence ranking? The
                            reader&apos;s text does — <Code>must</Code>. Language, year,
                            rating, genre are binary conditions and do not —{" "}
                            <Code>filter</Code>. That is exactly the split in{" "}
                            <Code>movies.service.ts</Code>, and it is the answer to
                            &ldquo;why is your query built this way?&rdquo;.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · scoring a binary condition is ranking noise">
                        <p>
                            A <Code>term</Code> in <Code>must</Code>{" "}contributes a score
                            like any other clause, and that score varies with how common the
                            value is — so a rare language quietly outranks a good title
                            match. The symptom is a ranking nobody can explain from the
                            search text, and the cause is a filter that was never a filter.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · must_not is filter context too">
                        <p>
                            Exclusions never score: there is no such thing as being
                            relevantly not-French. <Code>must_not</Code>{" "}lives in filter
                            context alongside <Code>filter</Code>, which is why moving an
                            exclusion around a <Code>bool</Code>{" "}never changes the order of
                            results.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — how much comes back, and in what order ---------- */}
            <PartHeading kicker="part 4">Paging &amp; Ordering</PartHeading>
            <div>
                <DocSection title="pagination: from/size and the 10k wall">
                    <CodeBlock code={PAGE_TS} lang="ts" />
                    <CodeBlock code={PAGE_CURL} lang="bash" />
                    <CodeBlock code={PAGE_WALL} lang="text" />
                    <p>
                        <Term>
                            <Code>from</Code> skips and <Code>size</Code>{" "}takes.
                        </Term>{" "}
                        cineverse computes <Code>from</Code> as{" "}
                        <Code>(page - 1) * limit</Code> and passes <Code>limit</Code> as{" "}
                        <Code>size</Code>{" "}— stateless, trivial to build a page-number UI on,
                        and exactly right for the first few pages a human will ever visit.
                    </p>
                    <p>
                        <Term>The cost is hidden and it grows with the offset.</Term>{" "}To
                        return hits 10,000 to 10,020 every shard has to collect and sort its
                        top 10,020 candidates, and then almost all of them are thrown away.
                        Page 2 is cheap; page 500 is the same query doing five hundred times
                        the sorting for the same twenty rows.
                    </p>
                    <p>
                        <Term>So there is a hard stop.</Term>{" "}
                        <Code>from + size &gt; 10000</Code> is a{" "}
                        <Code>400</Code> — <Code>Result window is too large</Code> — set by{" "}
                        <Code>index.max_result_window</Code>. It is a guard rail, not a
                        limitation to route around.
                    </p>

                    <Callout severity="danger" label="danger · raising max_result_window">
                        <p>
                            The setting is editable, and raising it converts a clear error
                            into heap pressure spread across the cluster: every deep request
                            now allocates for tens of thousands of hits per shard, and the
                            failure moves from one request to everybody&apos;s. If deep
                            offsets are genuinely needed, the answer is a different access
                            pattern, not a bigger window.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · nobody clicks page 500">
                        <p>
                            For a human interface the wall is a non-problem: cap the pager
                            and invite the reader to refine the search, which is what they
                            were going to do anyway. The 10k limit only really bites on a
                            different job — exporting, syncing, or processing every matching
                            document — and that job has its own tool, next.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="search_after: cursor instead of offset">
                    <CodeBlock code={AFTER_X_TS} lang="ts" />
                    <CodeBlock code={AFTER_Y_TS} lang="ts" />
                    <CodeBlock code={AFTER_CURL} lang="bash" />
                    <CodeBlock code={AFTER_HITS} lang="json" />
                    <p>
                        <Term>X counts from the beginning; Y remembers where it stopped.</Term>{" "}
                        The offset query collects sixty hits to show twenty. The cursor query
                        sorts explicitly, sends no <Code>from</Code>, and reads the{" "}
                        <Code>sort</Code> array that comes back on every hit —{" "}
                        <Code>[7.8, 603692]</Code> — then hands it to the next request as{" "}
                        <Code>search_after</Code>, meaning &ldquo;the next twenty after this
                        position&rdquo;.
                    </p>
                    <CodeBlock code={AFTER_WALK_TS} lang="ts" />
                    <p>
                        <Term>The cost per page is constant.</Term>{" "}Elasticsearch seeks
                        straight past the cursor instead of counting to it, so page 5,000 is
                        as cheap as page 1 and the 10k wall never comes up. The loop above is
                        the whole pattern: search, handle the batch, keep the last hit&apos;s{" "}
                        <Code>sort</Code>, stop when a page comes back empty.
                    </p>
                    <p>
                        <Term>Two things become mandatory.</Term> An explicit{" "}
                        <Code>sort</Code>, because the cursor <em>is</em>{" "}a list of sort
                        values — and a unique tiebreaker as the last key, here{" "}
                        <Code>tmdb_id</Code>. Without it, ties on{" "}
                        <Code>vote_average</Code>{" "}leave the position ambiguous and the walk
                        can skip documents or repeat them.
                    </p>

                    <Callout severity="danger" label="danger · a cursor without a unique tiebreaker">
                        <p>
                            Sort by <Code>vote_average</Code>{" "}alone across a hundred movies
                            rated exactly 7.8 and &ldquo;after 7.8&rdquo; does not identify a
                            row. The walk continues, the counts look plausible, and the
                            export quietly misses documents or writes some twice — with no
                            error anywhere. Always end the sort with something unique per
                            document.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · which one for which caller">
                        <p>
                            <Code>search_after</Code>{" "}is forward-only: there is no jumping to
                            page 47, because you would have to walk there. So split by
                            caller — humans clicking page numbers get{" "}
                            <Code>from</Code>/<Code>size</Code>, and machines walking the
                            whole result set get <Code>search_after</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="sorting">
                    <CodeBlock code={SORT_TS} lang="ts" />
                    <CodeBlock code={SORT_CURL} lang="bash" />
                    <p>
                        <Term>The default sort is <Code>_score</Code>{" "}descending, and
                        adding <Code>sort</Code> replaces it.</Term>{" "}Several keys act as
                        tiebreakers in order, exactly like SQL&apos;s{" "}
                        <Code>ORDER BY</Code>: rating first, and among equal ratings the
                        newest release.
                    </p>
                    <p>
                        <Term>Which quietly throws relevance away.</Term>{" "}Sorted by rating,
                        a 9.1 film that barely matches the word &ldquo;war&rdquo; in its
                        overview outranks <em>War</em>{" "}itself at 7.0 — the search still
                        chose the right documents, but the order no longer reflects the
                        search at all. If both matter, sort by{" "}
                        <Code>[&quot;_score&quot;, {`{ vote_average: "desc" }`}]</Code>, or
                        leave the order to relevance and boost by rating instead.
                    </p>
                    <p>
                        <Term>With a field sort, hits come back with{" "}
                        <Code>&quot;_score&quot;: null</Code>.</Term>{" "}Nothing is broken —
                        scoring was skipped because nothing asked for it, which is also a
                        small saving.
                    </p>
                    <CodeBlock code={SORT_TRAP_TS} lang="ts" />
                    <CodeBlock code={SORT_TRAP_CURL} lang="bash" />

                    <Callout severity="trap" label="trap · sorting silently replaces relevance">
                        <p>
                            The zero-hit traps at least look wrong. This one returns a full
                            page of plausible results in an order that has nothing to do with
                            what the reader typed, and nobody files a bug — they just stop
                            trusting the search. Whenever a <Code>sort</Code>{" "}is added to a
                            query that has a search box, decide explicitly where{" "}
                            <Code>_score</Code>{" "}goes.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the error that explains title.raw">
                        <p>
                            Sorting on a <Code>text</Code> field is a loud{" "}
                            <Code>400</Code>: <Code>Text fields are not optimised for
                            operations that require per-document field data</Code>, with the
                            advice to use a keyword field instead. The index holds terms, not
                            values, so there is nothing to order by — and that error is the
                            entire reason for the multi-field pattern from Mappings &amp;
                            Analysis: search <Code>title</Code>, sort{" "}
                            <Code>title.raw</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — why that order, and showing it ---------- */}
            {/* Scoring first, then the feature that shows the reader what the
                score was made of. Another section joins at the end of this div,
                ahead of the english footer: one DocSection here, one
                SECTION_SEVERITIES entry above, one rail card in page.tsx. */}
            <PartHeading kicker="part 5">Relevance</PartHeading>
            <div>
                <DocSection title="what _score is: BM25">
                    <CodeBlock code={BM25} lang="text" />
                    <p>
                        <Term>
                            BM25 is the default scoring function, and it has three inputs.
                        </Term>{" "}
                        Term frequency: the more often the term appears in this field, the
                        higher. Inverse document frequency: the rarer the term is across the
                        index, the more a match is worth — <Code>the</Code>{" "}matches
                        everything and therefore decides nothing, while{" "}
                        <Code>knight</Code>{" "}is rare enough to decide the whole ranking. And
                        field length: the same match in a short field beats it in a long one.
                    </p>
                    <p>
                        <Term>Those three answer most &ldquo;why is this first?&rdquo;
                        questions.</Term> <em>War</em> as an entire title scores far above{" "}
                        <Code>war</Code>{" "}buried in a three-hundred-word overview, because the
                        term carries the whole short field in one case and is diluted in the
                        other. Note that field length lives <em>inside</em>{" "}BM25 — it is not
                        the <Code>^3</Code>{" "}boost, which multiplies on top of the finished
                        field score.
                    </p>
                    <CodeBlock code={EXPLAIN_TS} lang="ts" />
                    <CodeBlock code={EXPLAIN_CURL} lang="bash" />
                    <CodeBlock code={EXPLAIN_OUT} lang="json" />
                    <p>
                        <Term>
                            <Code>_explain</Code>{" "}is the debugger of search.
                        </Term>{" "}
                        Give it one document id and the query, and it returns the score as a
                        tree: which terms matched, and what each contributed —{" "}
                        <Code>freq</Code>, <Code>idf</Code>, and the length ratio{" "}
                        <Code>dl / avgdl</Code>. It is unreadably verbose the first time and
                        invaluable the first time a ranking makes no sense.
                    </p>

                    <Callout severity="tip" label="tip · _explain instead of guessing">
                        <p>
                            When the wrong film is first, the fastest route is not tuning
                            boosts — it is <Code>_explain</Code>{" "}on the document that should
                            have won and on the one that did, then reading which term and
                            which field made the difference. Tune afterwards, once you know
                            what you are tuning.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · scores are not comparable across queries">
                        <p>
                            <Code>11.2</Code> for &ldquo;dark knight&rdquo; and{" "}
                            <Code>3.1</Code>{" "}for &ldquo;matrix&rdquo; say nothing about which
                            result is better: IDF depends on the terms, so every query has its
                            own scale. A <Code>_score</Code> orders documents{" "}
                            <em>within one query</em>{" "}and means nothing outside it — never
                            build a threshold, a badge or a &ldquo;good match&rdquo; feature
                            on the absolute number.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="highlighting">
                    <CodeBlock code={HIGHLIGHT_TS} lang="ts" />
                    <CodeBlock code={HIGHLIGHT_CURL} lang="bash" />
                    <CodeBlock code={HIGHLIGHT_OUT} lang="json" />
                    <p>
                        <Term>
                            Highlighting is the feature that shows the reader{" "}
                            <em>why</em>{" "}a result matched.
                        </Term>{" "}
                        Add a <Code>highlight</Code>{" "}block naming the fields, and every hit
                        comes back with a <Code>highlight</Code>{" "}object beside its{" "}
                        <Code>_source</Code>: the matched text, with the matched terms
                        wrapped in tags the interface can style.
                    </p>
                    <CodeBlock code={HIGHLIGHT_KNOBS} lang="text" />
                    <p>
                        <Term>Each field comes back as an array of fragments.</Term>{" "}
                        A
                        fragment is a window of roughly a hundred characters around a match,
                        so a long <Code>overview</Code>{" "}yields excerpts rather than the
                        whole text — <Code>fragment_size</Code>{" "}and{" "}
                        <Code>number_of_fragments</Code>{" "}set how big and how many. A short
                        field like <Code>title</Code>{" "}fits in one fragment and comes back
                        whole, but it is still an array, so the frontend reads it the same
                        way in both cases. The markup is <Code>&lt;em&gt;</Code>{" "}unless you
                        say otherwise: <Code>pre_tags</Code>{" "}and <Code>post_tags</Code>{" "}
                        swap in <Code>&lt;mark&gt;</Code>{" "}or a class of your own.
                    </p>
                    <p>
                        <Term>
                            The part you cannot rebuild in the frontend is that highlighting
                            is analysis-aware.
                        </Term>{" "}
                        It marks up the terms the query actually matched, so a search for{" "}
                        <Code>&quot;rises&quot;</Code>{" "}highlights the word{" "}
                        <Code>Rising</Code>{" "}in the text — both sides stemmed to the same
                        root, exactly as the match itself worked. An{" "}
                        <Code>indexOf</Code>{" "}or a regular expression over the raw{" "}
                        <Code>_source</Code>{" "}has no idea those two words are related, and
                        every stem, stopword and analyzer detail would have to be
                        reimplemented in the browser to get it right.
                    </p>

                    <Callout severity="note" label="note · a field only appears if it matched">
                        <p>
                            The <Code>highlight</Code>{" "}object contains a key for a field
                            only when that field contributed a match. A hit found through{" "}
                            <Code>overview</Code>{" "}alone has no{" "}
                            <Code>highlight.title</Code>, so the frontend renders the
                            highlighted fragment when the key is there and falls back to the
                            plain <Code>_source</Code>{" "}value when it is not — that fallback
                            is not an edge case, it is the normal path for most fields.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · highlight only what you display">
                        <p>
                            Every highlighted field is real work per hit: the field is
                            re-analyzed to locate the matches before the fragments are cut.
                            Listing fields the interface never shows pays that cost for
                            nothing, on every result of every page — so the list in{" "}
                            <Code>highlight.fields</Code>{" "}should read like the list of things
                            actually on screen.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside all five parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>How does your search survive typos?</>}
                    a={
                        <>
                            &ldquo;<Code>fuzziness: AUTO</Code> — terms match within a{" "}
                            <Term>Levenshtein edit distance</Term> that{" "}
                            <Term>scales with term length</Term>, so short words stay exact
                            and longer words tolerate one or two edits.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                Why put the term and range clauses in{" "}
                                <Code>filter</Code> instead of <Code>must</Code>?
                            </>
                        }
                        a={
                            <>
                                &ldquo;They&apos;re <Term>binary conditions</Term>{" "}— they
                                shouldn&apos;t influence ranking.{" "}
                                <Term>Filter context</Term> skips scoring and is{" "}
                                <Term>cacheable as a bitset</Term>, so shared filters get
                                reused while only the search text is scored.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>Why is deep pagination expensive?</>}
                        a={
                            <>
                                &ldquo;Offset pagination must{" "}
                                <Term>collect and sort</Term>{" "}everything up to the offset
                                just to discard it. Past 10k we switch to{" "}
                                <Term>search_after</Term> — a{" "}
                                <Term>cursor over sort values</Term>{" "}with constant cost per
                                page.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>Why is this document ranked first?</>}
                        a={
                            <>
                                &ldquo;<Term>BM25</Term> — <Term>term frequency</Term>,{" "}
                                <Term>inverse document frequency</Term>, and{" "}
                                <Term>field length</Term>. We verify with the{" "}
                                <Term>_explain</Term>{" "}API instead of guessing.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>Why not highlight matches in the frontend with a regex?</>}
                        a={
                            <>
                                &ldquo;The match happened on{" "}
                                <Term>analyzed terms</Term>{" "}
                                — &lsquo;rises&rsquo; matched
                                &lsquo;Rising&rsquo;, which a regex on the raw text
                                can&apos;t know. Elasticsearch returns{" "}
                                <Term>fragments</Term>{" "}with the matched terms marked,{" "}
                                <Term>analysis-aware</Term>.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
