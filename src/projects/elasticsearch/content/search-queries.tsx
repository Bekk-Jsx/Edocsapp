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
    "match-the-full-text-workhorse": ["tip", "note"],
    "multi-match-searching-several-fields": ["tip", "note"],
    "merging-field-scores-type": ["tip", "note"],
    "fuzziness-surviving-typos": ["trap", "tip", "note"],

    // --- part 2 (Term-Level Queries) ---
    "term-terms-exact-lookup": ["trap", "tip", "note"],
    "range-numbers-and-dates": ["tip", "note"],
    "exists-presence-not-value": ["trap", "note"],

    // --- part 3 (Combining) ---
    "bool-composing-a-real-query": ["trap", "note"],
    "query-context-vs-filter-context": ["trap", "tip", "note"],

    // --- part 4 (Paging & Ordering) ---
    "pagination-from-size-and-the-10k-wall": ["danger", "note"],
    "search-after-cursor-pagination": ["danger", "tip"],
    sorting: ["trap", "note"],

    // --- part 5 (Relevance) ---
    "what-score-is-bm25": ["tip", "note"],
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

// PAGE RULES, applied to every section below.
//
// 1. A section opens with prose. The reader learns what the concept is and what
//    problem it solves before any code appears.
// 2. Every fragment is introduced by the sentence above it and, where it has a
//    result, read by the sentence below it. Two fragments never touch.
// 3. Every operation appears twice — the Node client call and the curl that goes
//    over the wire. Client first.
// 4. A comparison names both sides in plain words ("without multi_match" /
//    "the same search with multi_match"), shows BOTH codes, and ends in a
//    paragraph saying which one to write and why.

// ===================================================================
// part 1 — full-text queries
// ===================================================================

const MATCH_NODE = `await esClient.search({
    index: "movies",
    query: { match: { title: "dark knight rises" } },
});`;

const MATCH_CURL = `curl -X GET 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "dark knight rises" } } }'`;

// The query text goes through the FIELD'S analyzer before anything is looked up.
const MATCH_PIPELINE = `"dark knight rises"        the string as typed
        |
        v   the analyzer mapped on "title" — english
["dark", "knight", "rise"]  lowercased, stemmed terms
        |
        v   looked up in the inverted index
documents holding any of those three terms`;

const MATCH_OR_NODE = `// the default: any one term is enough to be a hit
await esClient.search({
    index: "movies",
    query: { match: { title: "dark knight rises" } },
});`;

const MATCH_AND_NODE = `// operator "and": every term has to be present
await esClient.search({
    index: "movies",
    query: {
        match: {
            title: { query: "dark knight rises", operator: "and" },
        },
    },
});`;

const MATCH_AND_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": {
          "query": "dark knight rises",
          "operator": "and" } } } }'`;

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

const MANUAL_FIELDS_NODE = `const text = "dark knight";

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

const MANUAL_FIELDS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": { "should": [
          { "match": { "title": {
              "query": "dark knight", "boost": 3 } } },
          { "match": { "overview": "dark knight" } },
          { "match": { "tagline": "dark knight" } }
        ] } } }'`;

const MULTI_MATCH_NODE = `await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: text,
            fields: ["title^3", "overview", "tagline"],
        },
    },
});`;

const MULTI_MATCH_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "multi_match": {
          "query": "dark knight",
          "fields": ["title^3", "overview", "tagline"] } } }'`;

const PARAM_QUERY = `query: "dark knight rises"

the raw text, analyzed once PER FIELD
  title    english analyzer  -> ["dark", "knight", "rise"]
  tagline  standard analyzer -> ["dark", "knight", "rises"]

one string in, different terms out, depending on the field`;

const PARAM_FIELDS = `fields: ["title", "overview", "tagline"]

no ^ anywhere -> all three weigh exactly the same
a film TITLED "Dark Knight" and a film whose plot summary
mentions it are ranked as equally good answers`;

const PARAM_BOOST = `fields: ["title^3", "overview", "tagline"]

^3 multiplies the score this field produces by three
"the title matters most" — written as ranking, not as prose`;

const TYPE_BEST_NODE = `await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: "war",
            type: "best_fields",   // the default
            fields: ["title^3", "overview", "tagline"],
        },
    },
});`;

const TYPE_BEST_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "multi_match": { "query": "war",
          "type": "best_fields",
          "fields": ["title^3", "overview", "tagline"] } } }'`;

const TYPE_MOST_NODE = `await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: "war",
            type: "most_fields",   // one word changed
            fields: ["title^3", "overview", "tagline"],
        },
    },
});`;

const TYPE_MOST_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "multi_match": { "query": "war",
          "type": "most_fields",
          "fields": ["title^3", "overview", "tagline"] } } }'`;

// Same two documents, same field scores, two different winners.
const TYPE_FLIP = `                title  overview  tagline | best   most
Movie A  title only   9.0      -         -    |  9.0    9.0
Movie B  everywhere   4.0     3.0       3.0   |  4.0   10.0

best_fields  ->  highest single field  ->  Movie A first
most_fields  ->  the fields summed     ->  Movie B first`;

const NO_FUZZ_NODE = `await esClient.search({
    index: "movies",
    query: { match: { title: "dark knihgt" } },
});   // hits: []`;

const NO_FUZZ_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "dark knihgt" } } }'
# "hits": { "total": { "value": 0 } }   200 OK`;

const FUZZ_NODE = `await esClient.search({
    index: "movies",
    query: {
        multi_match: {
            query: "dark knihgt",
            fields: ["title^3", "overview", "tagline"],
            fuzziness: "AUTO",
        },
    },
});   // The Dark Knight`;

const FUZZ_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "multi_match": {
          "query": "dark knihgt",
          "fields": ["title^3", "overview", "tagline"],
          "fuzziness": "AUTO" } } }'`;

const FUZZ_DISTANCE = `edit distance = the number of single-character changes
  insert       knigt  -> knight
  delete       knighht-> knight
  substitute   knivht -> knight
  swap         knihgt -> knight   (two adjacent letters)

"knihgt" reaches "knight" in one swap -> distance 1

applied AFTER analysis: the candidate terms are compared
against the STEMS in the index, not against your raw string`;

const FUZZ_AUTO = `a fixed number is wrong at some length
  fuzziness: 2 on "war"  -> war, car, bar, ear, wax, ...
  fuzziness: 1 on "extraterrestrial" -> one slip still fails

AUTO reads the term length and picks the distance
  1-2 chars   0 edits   "up" stays exact
  3-5 chars   1 edit    "wars" also reaches "mars"
  6+  chars   2 edits   "knihgt" reaches "knight"`;

// ===================================================================
// part 2 — term-level queries
// ===================================================================

const TERM_NODE = `// original_language is a plain keyword — send the value as is
await esClient.search({
    index: "movies",
    query: { term: { original_language: "en" } },
});`;

const TERM_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "term": { "original_language": "en" } } }'`;

const NESTED_TERM_NODE = `// genres.name is a keyword INSIDE a nested field — same
// term query, wrapped in the nested clause naming the path
await esClient.search({
    index: "movies",
    query: {
        nested: {
            path: "genres",
            query: { term: { "genres.name": "Action" } },
        },
    },
});`;

const NESTED_TERM_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "nested": { "path": "genres",
          "query": { "term": {
            "genres.name": "Action" } } } } }'`;

// Which query a field takes is decided by the mapping, not by the value.
const TERM_MAPPING = `original_language   keyword         ->  term, on its own
genres              nested
  genres.name       keyword         ->  term, inside nested
title               text (english)  ->  match, never term`;

const TERMS_NODE = `await esClient.search({
    index: "movies",
    query: {
        terms: { original_language: ["en", "fr", "de"] },
    },
});`;

const TERMS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "terms": {
          "original_language": ["en", "fr", "de"] } } }'`;

const TERM_ON_TEXT_NODE = `await esClient.search({
    index: "movies",
    query: { term: { title: "The Dark Knight" } },
});   // hits: []`;

const TERM_ON_TEXT_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "term": { "title": "The Dark Knight" } } }'
# "hits": { "total": { "value": 0 } }   200 OK, no error`;

const TEXT_INDEX_CONTENTS = `_source                     "The Dark Knight"
terms in the index          ["dark", "knight"]
the term the query sent     "The Dark Knight"

no term in that list equals the string that was sent`;

const RANGE_RATING_NODE = `await esClient.search({
    index: "movies",
    query: { range: { vote_average: { gte: 7.5 } } },
});`;

const RANGE_RATING_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "range": {
          "vote_average": { "gte": 7.5 } } } }'`;

const RANGE_YEAR_NODE = `await esClient.search({
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

const RANGE_YEAR_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "range": { "release_date": {
          "gte": "2020-01-01", "lte": "2020-12-31" } } } }'`;

const DATE_MATH = `resolved by Elasticsearch, at query time
  { "gte": "now-1y" }    the last year
  { "gte": "now-30d" }   the last thirty days
  { "gte": "now/d" }     today, rounded down to midnight`;

const BARE_YEAR = `{ "gte": "2020", "lte": "2020" }

a bare year is read against the field's date format and
expands to cover it — the same filter, in one line`;

const EXISTS_NODE = `await esClient.search({
    index: "movies",
    query: { exists: { field: "tagline" } },
});`;

const EXISTS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "exists": { "field": "tagline" } } }'`;

const MISSING_NODE = `await esClient.search({
    index: "movies",
    query: {
        bool: { must_not: [{ exists: { field: "tagline" } }] },
    },
});`;

const MISSING_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": { "must_not": [
          { "exists": { "field": "tagline" } } ] } } }'`;

const EXISTS_TABLE = `"tagline": "A hero rises"   one term indexed    -> passes
"tagline": ""              an empty term indexed -> passes
"tagline": null            nothing indexed       -> fails
"tagline": []              nothing indexed       -> fails
no "tagline" key at all    nothing indexed       -> fails

the last three are one state to the index, not three`;

// ===================================================================
// part 3 — combining
// ===================================================================

const BOOL_SLOTS = `must      has to match, and it scores
filter    has to match, no score, cacheable
must_not  has to NOT match, no score
should    optional — matching raises the score`;

const BOOL_SKELETON = `// what cineverse sends: text scored, conditions filtered
query: {
    bool: {
        must: [ /* the search box */ ],
        filter: [ /* language, year, rating, genre */ ],
    },
}`;

const BOOL_PARTS_NODE = `const search = {
    multi_match: {
        query: "dark knight",
        fields: ["title^3", "overview", "tagline"],
    },
};

const conditions = [
    { range: { release_date: { gte: "2008-01-01" } } },
    { range: { vote_average: { gte: 7 } } },
];

const actionGenre = {
    nested: {
        path: "genres",
        query: { term: { "genres.name": "Action" } },
    },
};`;

const BOOL_NODE = `await esClient.search({
    index: "movies",
    query: {
        bool: {
            must: [search],
            filter: conditions,
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

const SHOULD_BEHAVIOURS = `bool with ONLY should clauses
  at least one of them must match — it acts as an OR

should NEXT TO a must or a filter
  it requires nothing — matching only adds score

minimum_should_match: 1   says which one you meant`;

const ALL_MUST_NODE = `await esClient.search({
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

const ALL_MUST_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": { "must": [
          { "multi_match": { "query": "dark knight",
            "fields": ["title^3", "overview"] } },
          { "term": { "original_language": "en" } },
          { "range": { "vote_average": { "gte": 7 } } }
        ] } } }'`;

const SPLIT_NODE = `await esClient.search({
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

const SPLIT_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "bool": {
          "must": [ { "multi_match": { "query": "dark knight",
            "fields": ["title^3", "overview"] } } ],
          "filter": [
            { "term": { "original_language": "en" } },
            { "range": { "vote_average": { "gte": 7 } } } ]
        } } }'`;

// ===================================================================
// part 4 — paging & ordering
// ===================================================================

const PAGE_NODE = `const from = (page - 1) * limit;

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

const PAGE_COST = `from 40,    size 20    collect 60,    discard 40
from 9980,  size 20    collect 10000, discard 9980
from 10000, size 20    400 illegal_argument_exception
                       "Result window is too large"

the work grows with the OFFSET, not with the page size`;

const OFFSET_NODE = `// page 3 by offset — 60 hits collected to show 20
await esClient.search({
    index: "movies",
    from: 40,
    size: 20,
    query: { match_all: {} },
});`;

const OFFSET_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "from": 40, "size": 20,
        "query": { "match_all": {} } }'`;

const CURSOR_P1_NODE = `// page 1 — an explicit sort, and no "from" at all
await esClient.search({
    index: "movies",
    size: 20,
    sort: [{ vote_average: "desc" }, { tmdb_id: "asc" }],
    query: { match_all: {} },
});`;

const CURSOR_P1_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 20,
        "sort": [ { "vote_average": "desc" },
                  { "tmdb_id": "asc" } ],
        "query": { "match_all": {} } }'`;

// Every hit carries the values its sort produced — that array IS the cursor.
const CURSOR_HITS = `"hits": [
  { "_id": "603692", "_score": null,
    "_source": { "vote_average": 7.8, "tmdb_id": 603692 },
    "sort": [7.8, 603692] }
]`;

const CURSOR_P2_NODE = `// page 2 — the same sort, continuing after that position
await esClient.search({
    index: "movies",
    size: 20,
    sort: [{ vote_average: "desc" }, { tmdb_id: "asc" }],
    search_after: [7.8, 603692],
    query: { match_all: {} },
});`;

const CURSOR_P2_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 20,
        "sort": [ { "vote_average": "desc" },
                  { "tmdb_id": "asc" } ],
        "search_after": [7.8, 603692],
        "query": { "match_all": {} } }'`;

const CURSOR_WALK_NODE = `let searchAfter: unknown[] | undefined;

while (true) {
    const res = await esClient.search({
        index: "movies",
        size: 1000,
        sort: [{ vote_average: "desc" }, { tmdb_id: "asc" }],
        search_after: searchAfter,
        query: { match_all: {} },
    });

    const hits = res.hits.hits;
    if (!hits.length) break;

    await handleBatch(hits);
    searchAfter = hits[hits.length - 1].sort;
}`;

const SORT_NODE = `await esClient.search({
    index: "movies",
    sort: [{ vote_average: "desc" }, { release_date: "desc" }],
    query: { match: { title: "war" } },
});`;

const SORT_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "sort": [ { "vote_average": "desc" },
                  { "release_date": "desc" } ],
        "query": { "match": { "title": "war" } } }'`;

const SORT_SCORE_NODE = `// relevance first, rating only as the tiebreaker
await esClient.search({
    index: "movies",
    sort: ["_score", { vote_average: "desc" }],
    query: { match: { title: "war" } },
});`;

const SORT_TEXT_NODE = `await esClient.search({
    index: "movies",
    sort: [{ title: "asc" }],
    query: { match_all: {} },
});   // ResponseError: illegal_argument_exception`;

const SORT_TEXT_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "sort": [ { "title": "asc" } ] }'
# 400 "Text fields are not optimised for operations that
#      require per-document field data ... use a keyword
#      field instead"`;

const SORT_RAW_NODE = `// search the analyzed field, sort its keyword sub-field
await esClient.search({
    index: "movies",
    sort: [{ "title.raw": "asc" }],
    query: { match: { title: "war" } },
});`;

// ===================================================================
// part 5 — relevance
// ===================================================================

const BM25_TF = `term frequency

"war" once in the overview      contributes a little
"war" five times in the same    contributes more

more occurrences of the term IN THIS FIELD -> higher`;

const BM25_IDF = `inverse document frequency

"the"     in every movie    worth almost nothing
"knight"  in 40 movies      worth a lot

the rare term is the one that decides the ranking`;

const BM25_LENGTH = `field length

"War"                        a 1-word title    strong
"war" in a 300-word overview a long field      diluted

the same match counts for more in a shorter field`;

const EXPLAIN_NODE = `await esClient.explain({
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

const HIGHLIGHT_NODE = `await esClient.search({
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

const HIGHLIGHT_TAGS = `highlight: {
    pre_tags: ["<mark>"],
    post_tags: ["</mark>"],
    fields: { title: {}, overview: {} },
}`;

const HIGHLIGHT_FRAGMENTS = `highlight: {
    fields: {
        overview: { fragment_size: 150, number_of_fragments: 2 },
    },
}`;

export function SearchQueriesDocs() {
    return (
        <>
            {/* ---------- part 1 — queries that read words ---------- */}
            <PartHeading kicker="part 1">Full-Text Queries</PartHeading>
            <div>
                <DocSection title="match: the full-text workhorse">
                    <p>
                        <Code>match</Code>{" "}is the query behind every search bar: it takes
                        a string a person typed and finds the documents that talk about it.
                        It is a full-text query, which means it does not look for the
                        sentence you sent — it looks for the words inside it, in the form
                        the index holds them. Everything else on this page either builds on
                        that behaviour or deliberately avoids it.
                    </p>
                    <p>
                        A basic search against the <Code>title</Code>{" "}field is a single
                        clause, with the field name as the key and the reader&apos;s text as
                        the value.
                    </p>
                    <CodeBlock code={MATCH_NODE} lang="ts" />
                    <p>The same request, sent over the wire:</p>
                    <CodeBlock code={MATCH_CURL} lang="bash" />
                    <p>
                        The step that makes it work is invisible in both: the string is run
                        through the analyzer of the field being queried — not a fixed one,
                        that field&apos;s own — and the terms that come out are what gets
                        looked up.
                    </p>
                    <CodeBlock code={MATCH_PIPELINE} lang="text" />
                    <p>
                        <Term>Both sides were built by the same machine, which is why they
                        meet.</Term>{" "}
                        <Code>title</Code>{" "}was indexed with the <Code>english</Code>{" "}
                        analyzer, so the index holds <Code>rise</Code>{" "}rather than{" "}
                        <Code>Rises</Code>; the query text is stemmed the same way and lands
                        on the same term. Change the analyzer on the field and this query
                        changes with it, without a line of it being edited.
                    </p>
                    <p>
                        <Term>The default combination of those terms is OR.</Term>{" "}A
                        document matching a single term is already a hit, so the search
                        below also returns <em>Dark Waters</em>{" "}— it has{" "}
                        <Code>dark</Code>. Matching more of the terms does not decide{" "}
                        <em>whether</em>{" "}a document comes back; it decides how high it
                        scores, which is what puts the film the reader meant at the top and
                        leaves the weak matches below it.
                    </p>
                    <CodeBlock code={MATCH_OR_NODE} lang="ts" />
                    <p>
                        When the loose behaviour is wrong — short fields, where a single
                        shared word means little — <Code>operator: &quot;and&quot;</Code>{" "}
                        requires every term instead.
                    </p>
                    <CodeBlock code={MATCH_AND_NODE} lang="ts" />
                    <p>
                        The same switch in curl, which is also where the long form of{" "}
                        <Code>match</Code>{" "}becomes visible: the field maps to an object
                        rather than a bare string as soon as it takes parameters.
                    </p>
                    <CodeBlock code={MATCH_AND_CURL} lang="bash" />
                    <p>
                        Only documents carrying <Code>dark</Code>, <Code>knight</Code>{" "}and{" "}
                        <Code>rise</Code>{" "}now come back — a shorter list, and every entry
                        on it defensible.
                    </p>

                    <p>
                        <Term>Reading the response.</Term>{" "}Every search answers with the
                        same envelope, and knowing its four parts is most of what a frontend
                        needs.
                    </p>
                    <CodeBlock code={MATCH_HITS} lang="json" />
                    <p>
                        <Code>took</Code>{" "}is the milliseconds spent.{" "}
                        <Code>hits.total.value</Code>{" "}is how many documents{" "}
                        <em>match</em>, with <Code>relation</Code>{" "}saying whether that count
                        is exact (<Code>eq</Code>) or a lower bound (<Code>gte</Code>).{" "}
                        <Code>hits.hits</Code>{" "}is the array actually returned — each entry
                        carrying <Code>_id</Code>, its <Code>_score</Code>, and the{" "}
                        <Code>_source</Code>{" "}document as you indexed it. The array arrives
                        sorted by <Code>_score</Code>{" "}descending, so the order in the JSON
                        is the order to render, and it holds ten entries unless you say
                        otherwise.
                    </p>

                    <Callout severity="note" label="note · total.value is not what came back">
                        <p>
                            Forty-two documents match; ten are in the array, because{" "}
                            <Code>size</Code>{" "}defaults to 10. That is the number for
                            &ldquo;42 results&rdquo; in the interface and for computing how
                            many pages there are — never the length of{" "}
                            <Code>hits.hits</Code>. Once a count gets expensive Elasticsearch
                            stops counting early and says so through{" "}
                            <Code>relation: &quot;gte&quot;</Code>.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · between OR and AND">
                        <p>
                            <Code>operator: &quot;and&quot;</Code>{" "}is strict, and on a long
                            query string it can return nothing at all.{" "}
                            <Code>minimum_should_match: &quot;75%&quot;</Code>{" "}sits between
                            the two — most of the terms, not all of them — which is usually
                            the honest reading of a multi-word search.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="multi_match: searching several fields">
                    <p>
                        A reader typing into one box has no idea which field their words
                        live in: <em>dark knight</em>{" "}could be a title, a phrase in a plot
                        summary, or a tagline. <Code>multi_match</Code>{" "}runs one piece of
                        text against several fields at once and lets you say how much each
                        field is worth. It is the query cineverse&apos;s search endpoint
                        actually sends, and it replaces a shape that is easy to write by
                        hand and easy to get wrong.
                    </p>
                    <p>
                        <Term>Without multi_match — three match queries combined
                        manually:</Term>{" "}one clause per field inside a{" "}
                        <Code>bool.should</Code>, with the title boosted so a title hit
                        outweighs the others.
                    </p>
                    <CodeBlock code={MANUAL_FIELDS_NODE} lang="ts" />
                    <p>The same request as curl, with the text spelled out three times:</p>
                    <CodeBlock code={MANUAL_FIELDS_CURL} lang="bash" />
                    <p>
                        <Term>The same search with multi_match:</Term>{" "}one clause, the text
                        written once, and the boost moved into the field list.
                    </p>
                    <CodeBlock code={MULTI_MATCH_NODE} lang="ts" />
                    <p>And over the wire, where the whole query fits on two lines:</p>
                    <CodeBlock code={MULTI_MATCH_CURL} lang="bash" />
                    <p>
                        <Term>The second form is the one to write.</Term>{" "}
                        <Code>multi_match</Code>{" "}is shorthand: internally it expands into
                        very nearly the manual query above, so nothing is lost — but the
                        reader&apos;s text appears once instead of three times, and a
                        repeated variable is a place for two of the three copies to drift
                        apart during a later edit. The boosts live in one list instead of
                        three separate clauses, and switching how the fields combine is one
                        parameter rather than a rewrite. The manual form keeps its place for
                        a different requirement — when the fields need{" "}
                        <em>different</em>{" "}query text, or different query types — which is
                        not what a single search box is.
                    </p>

                    <p>
                        <Term>The parameters, one at a time.</Term>{" "}
                        <Code>query</Code>{" "}is the raw text as typed, unescaped and
                        untouched by the application — and it is analyzed once per field, by
                        that field&apos;s own analyzer.
                    </p>
                    <CodeBlock code={PARAM_QUERY} lang="text" />
                    <p>
                        <Code>fields</Code>{" "}is where to look. Left plain, every field
                        counts the same, and that is rarely what anyone means.
                    </p>
                    <CodeBlock code={PARAM_FIELDS} lang="text" />
                    <p>
                        The caret fixes it: <Code>^3</Code>{" "}multiplies the score that field
                        produces, so the film <em>titled</em>{" "}Dark Knight beats the film
                        whose plot summary mentions one.
                    </p>
                    <CodeBlock code={PARAM_BOOST} lang="text" />
                    <p>
                        Those three lines are cineverse&apos;s production query in{" "}
                        <Code>movies.service.ts</Code>: the search box text,{" "}
                        <Code>title</Code>, <Code>overview</Code> and{" "}
                        <Code>tagline</Code>, and a title worth three times the rest.
                    </p>

                    <Callout severity="note" label="note · one string, different terms per field">
                        <p>
                            In cineverse <Code>title</Code> and <Code>overview</Code>{" "}are{" "}
                            <Code>english</Code> while <Code>tagline</Code> is{" "}
                            <Code>standard</Code>, so a single query string can become{" "}
                            <Code>[&quot;rise&quot;]</Code>{" "}against two fields and{" "}
                            <Code>[&quot;rises&quot;]</Code>{" "}against the third. Nothing is
                            broken when that happens — but it is the explanation for a field
                            that stubbornly refuses to match while its neighbours do.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · write the reader's text once">
                        <p>
                            Every duplicated copy of the user&apos;s input inside a query
                            builder is somewhere for the copies to disagree later.{" "}
                            <Code>multi_match</Code>{" "}removes the duplication rather than
                            documenting it, which is the real argument for using it even on
                            two fields.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="merging field scores: type">
                    <p>
                        A document that matches in three fields has produced three scores,
                        and the response shows one. The <Code>type</Code>{" "}parameter is the
                        rule that turns several into one, and it is not a formatting detail:
                        the same documents with the same field scores rank in a different
                        order depending on which rule is in force. Knowing the two common
                        ones is enough to explain most surprising rankings on a multi-field
                        search.
                    </p>
                    <p>
                        <Term>best_fields — the highest single field score wins:</Term>{" "}
                        the document is judged by its strongest field, and the others are
                        ignored. It is the default, so cineverse&apos;s query says nothing
                        about it.
                    </p>
                    <CodeBlock code={TYPE_BEST_NODE} lang="ts" />
                    <p>The same request as curl:</p>
                    <CodeBlock code={TYPE_BEST_CURL} lang="bash" />
                    <p>
                        <Term>most_fields — the field scores are added up:</Term>{" "}a
                        document that matches a little in every field accumulates more than
                        one that matches strongly in a single field.
                    </p>
                    <CodeBlock code={TYPE_MOST_NODE} lang="ts" />
                    <p>Over the wire it is the same request with one word changed:</p>
                    <CodeBlock code={TYPE_MOST_CURL} lang="bash" />
                    <p>
                        With two documents the consequence is easy to see, and it is a
                        reversal rather than a nudge.
                    </p>
                    <CodeBlock code={TYPE_FLIP} lang="text" />
                    <p>
                        Movie A scores 9.0 in the title and nothing elsewhere; Movie B
                        scores 4.0, 3.0 and 3.0. Under <Code>best_fields</Code>{" "}A is first
                        with 9.0 against B&apos;s 4.0; under <Code>most_fields</Code>{" "}B is
                        first with 10.0 against A&apos;s 9.0. Same data, same query text,
                        opposite winner.
                    </p>
                    <p>
                        <Term>Which to use follows from where the answer lives.</Term>{" "}When
                        the thing the reader is looking for is named in <em>one</em>{" "}field —
                        a movie title — <Code>best_fields</Code>{" "}is right, and it is the
                        right default here: a strong title match should not be diluted by an
                        unrelated word in a long overview. When the same text is indexed
                        several ways — <Code>title</Code>, <Code>title.english</Code>,{" "}
                        <Code>title.ngram</Code>{" "}— <Code>most_fields</Code>{" "}is right,
                        because agreement across those fields is real evidence.{" "}
                        <Code>cross_fields</Code>{" "}is the third: it treats the listed fields
                        as one virtual field, which is how <Code>first_name</Code>{" "}and{" "}
                        <Code>last_name</Code>{" "}together match a full name that neither
                        field contains on its own.
                    </p>

                    <Callout severity="tip" label="tip · leaving type out is a decision">
                        <p>
                            Omitting <Code>type</Code>{" "}gives <Code>best_fields</Code>, which
                            is the correct behaviour for a movie search box — so the absence
                            of the parameter in production code is deliberate, not an
                            oversight. Write it explicitly the day there is a reason to, and
                            do not switch to <Code>most_fields</Code>{" "}because it sounds more
                            thorough.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · boosts are not part of the merge">
                        <p>
                            <Code>^3</Code>{" "}applies to the field&apos;s own score before{" "}
                            <Code>type</Code>{" "}ever sees it. The two knobs are independent:
                            the boost says how much a field is worth, and{" "}
                            <Code>type</Code>{" "}says what to do with the several values that
                            result.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="fuzziness: surviving typos">
                    <p>
                        Term lookup is exact, so a single mistyped letter means the reader
                        asked for a word that is in no index anywhere and gets an empty
                        page. <Code>fuzziness</Code>{" "}widens each term to the words that are
                        nearly it, trading a little precision for tolerance. On a public
                        search box that trade is almost always worth making, and knowing
                        what it costs is what makes it a decision rather than a habit.
                    </p>
                    <p>
                        <Term>Without fuzziness — the typo is not a term:</Term>{" "}
                        <Code>knihgt</Code>{" "}is looked up as sent, nothing in the index
                        equals it, and the response is a valid, empty one.
                    </p>
                    <CodeBlock code={NO_FUZZ_NODE} lang="ts" />
                    <p>The same request as curl, with the answer it returns:</p>
                    <CodeBlock code={NO_FUZZ_CURL} lang="bash" />
                    <p>
                        <Term>With fuzziness AUTO — the typo is forgiven:</Term>{" "}one
                        parameter added to the production <Code>multi_match</Code>, and the
                        film comes back.
                    </p>
                    <CodeBlock code={FUZZ_NODE} lang="ts" />
                    <p>Over the wire, exactly where it sits in the real query:</p>
                    <CodeBlock code={FUZZ_CURL} lang="bash" />
                    <p>
                        The second form is what cineverse sends. Nothing about the fields or
                        the boosts changes — <Code>fuzziness</Code>{" "}is a sibling of{" "}
                        <Code>query</Code>{" "}and <Code>fields</Code>, applied to every term
                        the query produces.
                    </p>

                    <p>
                        <Term>How it measures closeness.</Term>{" "}The rule is Levenshtein
                        edit distance: the number of single-character edits that turn one
                        term into another, counting the transposition of two adjacent
                        letters as one edit — which is the typo people actually make.
                    </p>
                    <CodeBlock code={FUZZ_DISTANCE} lang="text" />
                    <p>
                        Note the last line: fuzziness is applied <em>after</em>{" "}analysis. The
                        text is analyzed into terms first, and each of those terms is then
                        expanded to its neighbours, so on an <Code>english</Code>{" "}field the
                        comparison happens against stems rather than against the words as
                        typed.
                    </p>
                    <p>
                        <Term>Why AUTO rather than a number.</Term>{" "}
                        <Code>fuzziness</Code>{" "}accepts an integer, and any integer is wrong
                        at some word length.
                    </p>
                    <CodeBlock code={FUZZ_AUTO} lang="text" />
                    <p>
                        <Code>AUTO</Code>{" "}makes that decision per term instead of once for
                        the whole query, and gets it right at every length — which is why
                        the practical advice is to write <Code>AUTO</Code>{" "}and stop thinking
                        about the numbers.
                    </p>
                    <p>
                        <Term>What it costs.</Term>{" "}Each fuzzy term becomes many candidate
                        term lookups rather than one, and that is visible on a large index
                        with several fuzzy fields. Precision pays too:{" "}
                        <Code>MARS</Code>{" "}and <Code>WARS</Code>{" "}are one substitution apart,
                        so a search for Mars can return <em>Star Wars</em>. For a movie
                        search bar that is the right trade — an empty page is worse than an
                        extra result — and it is the wrong one for a field meant for exact
                        lookup.
                    </p>

                    <Callout severity="trap" label="trap · tolerance runs in both directions">
                        <p>
                            Fuzziness cannot tell a typo from a different real word, because
                            to the engine they are the same thing: a term one edit away. The
                            symptom is a plausible but unrelated film near the top of a
                            correctly spelled search, and the cause is a distance that was
                            granted to the whole query rather than to the terms that needed
                            it.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · AUTO, never a number">
                        <p>
                            <Code>fuzziness: 2</Code>{" "}is a decision taken without knowing
                            the term it will apply to.{" "}
                            <Code>fuzziness: &quot;AUTO&quot;</Code>{" "}takes the same decision
                            per term, correctly, for nothing.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · fuzzy, the word">
                        <p>
                            In everyday English <em>fuzzy</em>{" "}means blurry, out of focus,
                            imprecise. <em>Fuzzy matching</em>{" "}is therefore matching where
                            close enough counts, as opposed to an <em>exact match</em>{" "}— the
                            same idea as the fuzzy search in an editor, where{" "}
                            <Code>Ctrl+P</Code> and <Code>movserv</Code>{" "}find{" "}
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
                    <p>
                        The second family of queries skips analysis completely: the value
                        you send is looked up exactly as sent. That is precisely right for
                        fields that were never analyzed either — keywords, numbers, dates —
                        because both sides stay raw and therefore meet. Every filter in a
                        real search interface is built from this family, which is why it
                        matters as much as <Code>match</Code>{" "}does.
                    </p>
                    <p>
                        <Code>original_language</Code>{" "}is a plain <Code>keyword</Code>{" "}
                        field, so a bare <Code>term</Code>{" "}is the whole query: the term in
                        the index is <Code>en</Code>{" "}and the term being asked for is{" "}
                        <Code>en</Code>.
                    </p>
                    <CodeBlock code={TERM_NODE} lang="ts" />
                    <p>The same request as curl:</p>
                    <CodeBlock code={TERM_CURL} lang="bash" />
                    <p>
                        The genre filter looks for the same kind of value but has to travel
                        differently, because <Code>genres</Code>{" "}is a <Code>nested</Code>{" "}
                        field: the <Code>term</Code>{" "}clause is identical, wrapped in a{" "}
                        <Code>nested</Code>{" "}clause naming the path it applies to.
                    </p>
                    <CodeBlock code={NESTED_TERM_NODE} lang="ts" />
                    <p>And over the wire, wrapper and all:</p>
                    <CodeBlock code={NESTED_TERM_CURL} lang="bash" />
                    <p>
                        Neither shape is a preference — the mapping decides both, and it is
                        worth reading before writing a filter.
                    </p>
                    <CodeBlock code={TERM_MAPPING} lang="text" />
                    <p>
                        A <Code>keyword</Code>{" "}at the top level takes a bare{" "}
                        <Code>term</Code>. A <Code>keyword</Code>{" "}inside a{" "}
                        <Code>nested</Code>{" "}field takes the same <Code>term</Code>{" "}inside
                        the wrapper, because its values live in hidden documents of their
                        own. And a <Code>text</Code>{" "}field takes neither — that is the trap
                        below.
                    </p>
                    <p>
                        <Term>
                            <Code>terms</Code>{" "}is the same query against a list.
                        </Term>{" "}
                        A document matches when the field holds any one of the values,
                        which is SQL&apos;s <Code>IN</Code>{" "}and the natural shape for a
                        multi-select filter in a UI.
                    </p>
                    <CodeBlock code={TERMS_NODE} lang="ts" />
                    <p>The same list, over the wire:</p>
                    <CodeBlock code={TERMS_CURL} lang="bash" />
                    <p>
                        Three languages, one clause — and no scoring difference between
                        them, since a term-level query only ever answers yes or no.
                    </p>

                    <p>
                        <Term>term on a text field.</Term>{" "}The most common way to lose an
                        afternoon with Elasticsearch is to point a <Code>term</Code>{" "}query
                        at an analyzed field, because the request is valid and the answer is
                        empty.
                    </p>
                    <p>
                        <Term>The query — a full title string sent as one term:</Term>{" "}it
                        looks like the obvious way to find a known film.
                    </p>
                    <CodeBlock code={TERM_ON_TEXT_NODE} lang="ts" />
                    <p>Over the wire, with the response it produces:</p>
                    <CodeBlock code={TERM_ON_TEXT_CURL} lang="bash" />
                    <p>
                        <Term>What the index actually contains:</Term>{" "}
                        <Code>title</Code>{" "}is <Code>text</Code>, so it was analyzed into
                        lowercase stems, and the stopword was dropped.
                    </p>
                    <CodeBlock code={TEXT_INDEX_CONTENTS} lang="text" />
                    <p>
                        The unanalyzed string meets nothing in that list, so the result is
                        zero hits with <Code>200 OK</Code>{" "}and no explanation anywhere —
                        the same silent failure family as a missing{" "}
                        <Code>nested</Code>{" "}wrapper. The rule that avoids both:{" "}
                        <Code>term</Code> and <Code>terms</Code>{" "}for{" "}
                        <Code>keyword</Code>{" "}fields, numbers and dates;{" "}
                        <Code>match</Code>{" "}for <Code>text</Code>.
                    </p>

                    <Callout severity="trap" label="trap · a valid query with an empty answer">
                        <p>
                            Nothing about this failure looks like a failure: the status is{" "}
                            <Code>200</Code>, the JSON is well formed, and{" "}
                            <Code>hits</Code>{" "}is simply empty. It is usually found by
                            accident, after the feature has shipped and someone reports that
                            a filter &ldquo;never returns anything&rdquo;.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · which query for which type">
                        <p>
                            <Code>term</Code>/<Code>terms</Code> for{" "}
                            <Code>keyword</Code>, numbers and dates.{" "}
                            <Code>match</Code> for <Code>text</Code>. Two sentences, and most
                            of the zero-hit mysteries in a young project never happen at all.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the value never tells you">
                        <p>
                            <Code>&quot;Action&quot;</Code> and{" "}
                            <Code>&quot;The Dark Knight&quot;</Code>{" "}are both strings, so
                            nothing about the data says which query it takes.{" "}
                            <Code>GET /movies</Code>{" "}answers it, and reading the mapping is
                            the first move whenever a filter behaves oddly.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="range: numbers and dates">
                    <p>
                        <Code>range</Code>{" "}is the comparison query: greater than, less
                        than, and the intervals built from them. It is how thresholds and
                        time windows are expressed — &ldquo;rated 7.5 or better&rdquo;,
                        &ldquo;released in 2020&rdquo;, &ldquo;added in the last month&rdquo;
                        — and two of cineverse&apos;s production filters are exactly this
                        query. On dates it can also do arithmetic itself, which removes a
                        surprising amount of application code.
                    </p>
                    <p>
                        The four bounds are <Code>gte</Code>, <Code>gt</Code>,{" "}
                        <Code>lte</Code> and <Code>lt</Code>, and they combine freely: one
                        bound is an open range, two make an interval. The rating filter uses
                        a single one.
                    </p>
                    <CodeBlock code={RANGE_RATING_NODE} lang="ts" />
                    <p>The same threshold as curl:</p>
                    <CodeBlock code={RANGE_RATING_CURL} lang="bash" />
                    <p>
                        The year filter uses two, because a year on a{" "}
                        <Code>date</Code>{" "}field is an interval rather than a value —
                        cineverse builds both ends from the year with template strings.
                    </p>
                    <CodeBlock code={RANGE_YEAR_NODE} lang="ts" />
                    <p>With the year filled in, that is what reaches the cluster:</p>
                    <CodeBlock code={RANGE_YEAR_CURL} lang="bash" />
                    <p>
                        Everything from the first of January to the thirty-first of
                        December, inclusive at both ends.
                    </p>
                    <p>
                        <Term>On a date field the bounds understand date math.</Term>{" "}
                        Elasticsearch resolves these expressions itself, at query time,
                        against its own clock.
                    </p>
                    <CodeBlock code={DATE_MATH} lang="text" />
                    <p>
                        That is what &ldquo;recently added&rdquo; and &ldquo;this
                        week&rdquo; features are made of, with no dates computed in the
                        application and nothing to get wrong about time zones or the length
                        of a month.
                    </p>
                    <p>
                        Dates also expand: a bare year is read against the field&apos;s date
                        format and covers the whole of it.
                    </p>
                    <CodeBlock code={BARE_YEAR} lang="text" />
                    <p>
                        Both versions of the year filter are correct. Production keeps the
                        explicit interval, which says what it means to a reader who does not
                        know the expansion rules.
                    </p>

                    <Callout severity="tip" label="tip · date math instead of computed dates">
                        <p>
                            <Code>&quot;now-30d&quot;</Code>{" "}is just a string in the query;
                            computing that date in the application means a clock, a time zone
                            and a serialisation format, each of which can disagree with the
                            cluster. Let Elasticsearch do arithmetic against its own idea of
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

                <DocSection title="exists: presence, not value">
                    <p>
                        Sometimes the question is not what a field contains but whether it
                        contains anything at all: movies that actually have a tagline,
                        records still missing a poster. <Code>exists</Code>{" "}answers exactly
                        that. What counts as &ldquo;nothing&rdquo; is decided by the index
                        rather than by your JSON, and that is where the surprise lives for
                        anyone arriving from a document database.
                    </p>
                    <p>
                        The query names a field and nothing else — a document passes when at
                        least one value was indexed under that name.
                    </p>
                    <CodeBlock code={EXISTS_NODE} lang="ts" />
                    <p>The same question as curl:</p>
                    <CodeBlock code={EXISTS_CURL} lang="bash" />
                    <p>
                        There is no <Code>missing</Code>{" "}query for the opposite. You negate
                        this one inside <Code>bool.must_not</Code>, which is the standard
                        way to express absence.
                    </p>
                    <CodeBlock code={MISSING_NODE} lang="ts" />
                    <p>And the negated form over the wire:</p>
                    <CodeBlock code={MISSING_CURL} lang="bash" />
                    <p>
                        <Term>
                            <Code>exists</Code>{" "}never reads the value.
                        </Term>{" "}
                        It cannot compare, it cannot test for emptiness — it asks only
                        whether at least one indexed term sits under the field name. Which
                        makes the following table the whole behaviour.
                    </p>
                    <CodeBlock code={EXISTS_TABLE} lang="text" />
                    <p>
                        <Term>The null surprise.</Term>{" "}
                        <Code>null</Code>, an empty array, and a field that is absent from
                        the JSON entirely all <em>fail</em>{" "}the query — because
                        Elasticsearch indexes terms, and all three produce none. From the
                        index&apos;s point of view they are one state, not three. An empty
                        string goes the other way and <em>passes</em>:{" "}
                        <Code>&quot;&quot;</Code>{" "}is a value, it gets indexed, and the field
                        therefore exists.
                    </p>

                    <Callout severity="trap" label="trap · null, [] and absent are one state">
                        <p>
                            So <Code>exists</Code>{" "}cannot answer &ldquo;which movies were
                            given an explicit null?&rdquo; — that distinction does not survive
                            indexing. If it matters, index something: a boolean flag or a
                            sentinel value. And note the asymmetry that catches people in
                            tests — <Code>&quot;&quot;</Code> and <Code>null</Code>{" "}feel
                            equally empty and behave in opposite ways.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · CouchDB draws this line differently">
                        <p>
                            In CouchDB a document with <Code>tagline: null</Code>{" "}and one
                            without the key are two different documents, and a view can tell
                            them apart. Push both through the sync pipeline and Elasticsearch
                            flattens the difference away — the nulls simply vanish from its
                            view. Nothing is broken; the search layer just has a coarser
                            notion of absence than the store it mirrors.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — putting clauses together ---------- */}
            <PartHeading kicker="part 3">Combining</PartHeading>
            <div>
                <DocSection title="bool: composing a real query">
                    <p>
                        Every query so far answers one question, and no interface asks only
                        one: there is search text, a few filters, an exclusion, and a
                        preference. <Code>bool</Code>{" "}is the clause that holds all of them
                        together, and it is where a production query actually lives. Its
                        four slots each mean something different, and reading a query
                        correctly is mostly a matter of knowing which slot decides what.
                    </p>
                    <p>Those four slots, one line each:</p>
                    <CodeBlock code={BOOL_SLOTS} lang="text" />
                    <p>
                        <Code>must</Code>{" "}is a requirement that participates in ranking;{" "}
                        <Code>filter</Code>{" "}is a requirement that does not;{" "}
                        <Code>must_not</Code>{" "}removes documents; and{" "}
                        <Code>should</Code>{" "}expresses a preference. Cineverse uses the
                        first two, which is the skeleton nearly every search endpoint ends
                        up with.
                    </p>
                    <CodeBlock code={BOOL_SKELETON} lang="ts" />
                    <p>
                        Filling it in is easier to read when the clauses are built
                        separately first — a search, a list of conditions, and the genre
                        clause with its nested wrapper.
                    </p>
                    <CodeBlock code={BOOL_PARTS_NODE} lang="ts" />
                    <p>
                        Assembled, the query reads as one sentence: movies about the dark
                        knight, released from 2008, rated 7 or better, not in French, with
                        Action films preferred.
                    </p>
                    <CodeBlock code={BOOL_NODE} lang="ts" />
                    <p>The whole thing over the wire, slot by slot:</p>
                    <CodeBlock code={BOOL_CURL} lang="bash" />
                    <p>
                        <Term>The rule for reading any bool query.</Term>{" "}
                        <Code>must</Code>, <Code>filter</Code> and <Code>must_not</Code>{" "}
                        decide <em>who</em>{" "}is in the result set;{" "}
                        <Code>should</Code>{" "}— when it has neighbours — only decides{" "}
                        <em>in what order</em>. Deleting the <Code>should</Code>{" "}clause
                        above changes the ranking and returns the same films.
                    </p>

                    <Callout severity="note" label="note · should is a slot, not a query">
                        <p>
                            There is no top-level <Code>should</Code>{" "}query to send on its
                            own. <Code>match</Code>, <Code>term</Code> and{" "}
                            <Code>range</Code>{" "}are query types;{" "}
                            <Code>must</Code>, <Code>filter</Code>, <Code>must_not</Code>{" "}
                            and <Code>should</Code>{" "}are the four keys of{" "}
                            <Code>bool</Code>{" "}and mean nothing outside it —{" "}
                            <Code>bool</Code>{" "}is the combiner, and they are the slots it
                            combines.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · should has two behaviours">
                        <p>
                            A <Code>bool</Code> holding <em>only</em>{" "}
                            <Code>should</Code>{" "}clauses requires at least one of them to
                            match, so it behaves as an OR. Put a <Code>must</Code> or a{" "}
                            <Code>filter</Code>{" "}beside it and the identical clause suddenly
                            requires nothing at all — it becomes a pure score bonus. One
                            clause, two meanings, decided by its neighbours, which is how a
                            genre preference silently turns into a genre requirement the day
                            the rest of the query is emptied.
                        </p>
                        <CodeBlock code={SHOULD_BEHAVIOURS} lang="text" />
                        <p className="mt-3">
                            <Code>minimum_should_match</Code>{" "}removes the ambiguity by
                            saying how many <Code>should</Code>{" "}clauses have to match,
                            whatever else is in the query.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="query context vs filter context">
                    <p>
                        <Code>must</Code> and <Code>filter</Code>{" "}both mean &ldquo;this has
                        to match&rdquo;, and a query written entirely with one returns the
                        same documents as the same query written with the other. The engine
                        nonetheless treats them completely differently, and that difference
                        governs scoring, caching and where every clause you write belongs.
                        It is the single most useful thing to be able to explain about a
                        production query.
                    </p>
                    <p>
                        <Term>Everything in must — every condition is scored:</Term>{" "}the
                        text search, the language and the rating threshold sit side by side
                        as equals.
                    </p>
                    <CodeBlock code={ALL_MUST_NODE} lang="ts" />
                    <p>Over the wire — three clauses, three scores to compute:</p>
                    <CodeBlock code={ALL_MUST_CURL} lang="bash" />
                    <p>
                        <Term>Split between must and filter — the production shape:</Term>{" "}
                        the reader&apos;s text stays in <Code>must</Code>{" "}and the two binary
                        conditions move to <Code>filter</Code>.
                    </p>
                    <CodeBlock code={SPLIT_NODE} lang="ts" />
                    <p>The same split as curl — one score, two filter clauses:</p>
                    <CodeBlock code={SPLIT_CURL} lang="bash" />
                    <p>
                        <Term>Both return the same movies; only the second is right.</Term>{" "}
                        <Code>must</Code>{" "}puts its clauses in <em>query context</em>, where
                        every clause computes a relevance score that is folded into{" "}
                        <Code>_score</Code>. <Code>filter</Code>{" "}puts them in{" "}
                        <em>filter context</em>, where the only question is yes or no:
                        scoring is skipped entirely, and the set of matching documents can be
                        kept as a bitset and reused by the next query that asks the same
                        thing.
                    </p>
                    <p>
                        <Term>Which is why the split is worth making.</Term>{" "}&ldquo;How
                        relevantly is this movie in English?&rdquo; is not a question — the
                        answer is yes or no, and feeding it into the score adds noise to the
                        ranking, spends computation on a decision already taken, and gives up
                        the cache. Thousands of readers share{" "}
                        <Code>language=en</Code> and <Code>rating&gt;=7</Code>{" "}while each
                        types something different: in the split version the shared parts
                        become cached bitsets and only the text is scored fresh, on every
                        request.
                    </p>
                    <p>
                        <Term>The placement rule is one question.</Term>{" "}Does this clause
                        deserve to influence ranking? The reader&apos;s text does —{" "}
                        <Code>must</Code>. Language, year, rating and genre are binary
                        conditions and do not — <Code>filter</Code>. That is exactly the
                        split in <Code>movies.service.ts</Code>, and it is the answer to
                        &ldquo;why is your query built this way?&rdquo;.
                    </p>

                    <Callout severity="trap" label="trap · scoring a binary condition is ranking noise">
                        <p>
                            A <Code>term</Code> in <Code>must</Code>{" "}contributes a score like
                            any other clause, and that score varies with how common the value
                            is — so a rare language can quietly outrank a good title match.
                            The symptom is an order nobody can explain from the search text,
                            and the cause is a filter that was never written as one.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · the question that sorts must from filter">
                        <p>
                            Ask it clause by clause while building the query, not afterwards:
                            anything the reader typed belongs in <Code>must</Code>, and
                            anything the interface decided — a checkbox, a dropdown, a slider
                            — belongs in <Code>filter</Code>.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · must_not is filter context too">
                        <p>
                            Exclusions never score: there is no such thing as being relevantly
                            not-French. <Code>must_not</Code>{" "}lives in filter context
                            alongside <Code>filter</Code>, which is why moving an exclusion
                            around a <Code>bool</Code>{" "}never changes the order of the
                            results.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — how much comes back, and in what order ---------- */}
            <PartHeading kicker="part 4">Paging &amp; Ordering</PartHeading>
            <div>
                <DocSection title="pagination: from/size and the 10k wall">
                    <p>
                        Search results arrive ten at a time unless you ask for more, and{" "}
                        <Code>from</Code>/<Code>size</Code>{" "}is how you ask. It is offset
                        pagination — skip N, take M — which is stateless, trivial to drive
                        from a page number, and the correct choice for an interface with
                        numbered pages. It also has a cost that grows quietly with depth and
                        then stops being quiet: at ten thousand it becomes a hard error.
                    </p>
                    <p>
                        Cineverse turns a page number into an offset and passes the page size
                        straight through.
                    </p>
                    <CodeBlock code={PAGE_NODE} lang="ts" />
                    <p>Page 3 of 20 results, as it goes over the wire:</p>
                    <CodeBlock code={PAGE_CURL} lang="bash" />
                    <p>
                        Nothing is remembered between requests, which is what makes a
                        bookmarked page-4 URL work.
                    </p>
                    <p>
                        <Term>The hidden cost is in what gets thrown away.</Term>{" "}To return
                        hits 10,000 to 10,020, every shard has to collect and sort its top
                        10,020 candidates so the coordinating node can discard the first
                        10,000 of them.
                    </p>
                    <CodeBlock code={PAGE_COST} lang="text" />
                    <p>
                        Page 2 is cheap and page 500 is the same query doing five hundred
                        times the sorting for the same twenty rows. Past the limit it is not
                        slow but refused: <Code>from + size &gt; 10000</Code>{" "}returns a{" "}
                        <Code>400</Code> reading{" "}
                        <Code>Result window is too large</Code>, set by{" "}
                        <Code>index.max_result_window</Code>.
                    </p>
                    <p>
                        <Term>In practice the wall is not a human problem.</Term>{" "}Nobody
                        clicks page 500 — cap the pager and invite the reader to refine their
                        search, which is what they were going to do anyway. The limit bites
                        on a different job entirely: exports, syncs, and anything that has to
                        process every matching document. That job has its own tool, which is
                        the next section.
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

                    <Callout severity="note" label="note · the limit counts from + size">
                        <p>
                            It is the sum that is checked, not the offset — so{" "}
                            <Code>from: 9990, size: 20</Code>{" "}already fails while{" "}
                            <Code>from: 9990, size: 10</Code>{" "}is the last page that works.
                            A pager that computes its last page from the total count has to
                            respect the same arithmetic, or the final page 400s.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="search_after: cursor pagination">
                    <p>
                        When code rather than a person has to walk through every result, the
                        10k wall is a real obstacle. <Code>search_after</Code>{" "}changes the
                        question from &ldquo;skip the first N&rdquo; to &ldquo;continue after
                        this position&rdquo;, which costs the same whether the position is
                        page 2 or page 5,000. It is how exports, syncs and reindex jobs read
                        a full result set.
                    </p>
                    <p>
                        <Term>Offset — collect and discard:</Term>{" "}page 3 asks the cluster
                        to produce sixty ordered hits so twenty can be returned, and the
                        number grows with every page.
                    </p>
                    <CodeBlock code={OFFSET_NODE} lang="ts" />
                    <p>The same offset request as curl:</p>
                    <CodeBlock code={OFFSET_CURL} lang="bash" />
                    <p>
                        <Term>Cursor — continue after the last position:</Term>{" "}the first
                        page carries an explicit <Code>sort</Code>{" "}and no{" "}
                        <Code>from</Code>{" "}at all.
                    </p>
                    <CodeBlock code={CURSOR_P1_NODE} lang="ts" />
                    <p>Over the wire, the sort is the only addition:</p>
                    <CodeBlock code={CURSOR_P1_CURL} lang="bash" />
                    <p>
                        Because the sort is explicit, every hit comes back carrying the
                        values it sorted on — and that little array is the cursor.
                    </p>
                    <CodeBlock code={CURSOR_HITS} lang="json" />
                    <p>
                        Page 2 repeats the same sort and passes the last hit&apos;s{" "}
                        <Code>sort</Code>{" "}array as <Code>search_after</Code>, meaning
                        &ldquo;the next twenty after this position&rdquo;.
                    </p>
                    <CodeBlock code={CURSOR_P2_NODE} lang="ts" />
                    <p>The cursor request as curl:</p>
                    <CodeBlock code={CURSOR_P2_CURL} lang="bash" />
                    <p>
                        <Term>The cursor version is the one that scales.</Term>{" "}
                        Elasticsearch seeks straight past the position instead of counting to
                        it, so the cost per page is constant and the 10k limit never applies
                        — it only ever governs <Code>from + size</Code>.
                    </p>
                    <p>
                        Walking the whole index is that request in a loop: search, handle the
                        batch, keep the last hit&apos;s <Code>sort</Code>{" "}as the next
                        cursor, and stop when a page comes back empty.
                    </p>
                    <CodeBlock code={CURSOR_WALK_NODE} lang="ts" />
                    <p>
                        The first iteration sends <Code>search_after: undefined</Code>, which
                        is simply page 1 — so the loop needs no special case for the start.
                    </p>
                    <p>
                        <Term>Two things become mandatory.</Term>{" "}An explicit{" "}
                        <Code>sort</Code>, because the cursor <em>is</em>{" "}a list of sort
                        values and there is nothing to continue after without one; and a
                        unique tiebreaker as the last sort key — here{" "}
                        <Code>tmdb_id</Code>{" "}— because ties make a position ambiguous.
                    </p>
                    <p>
                        <Term>The trade is direction.</Term>{" "}
                        <Code>search_after</Code>{" "}goes forward only: there is no jumping to
                        page 47, because reaching it means walking there. So the split falls
                        by caller — people clicking page numbers get{" "}
                        <Code>from</Code>/<Code>size</Code>, and machines walking every
                        document get <Code>search_after</Code>.
                    </p>

                    <Callout severity="danger" label="danger · a cursor without a unique tiebreaker">
                        <p>
                            Sort by <Code>vote_average</Code>{" "}alone across a hundred movies
                            rated exactly 7.8 and &ldquo;after 7.8&rdquo; does not identify a
                            row. The walk continues, the counts look plausible, and the export
                            quietly misses documents or writes some of them twice — with no
                            error anywhere. Always end the sort with something unique per
                            document.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · which one for which caller">
                        <p>
                            Do not migrate a page-number UI to cursors: it cannot express what
                            the interface needs, and the wall it avoids is one that interface
                            will never reach. Add <Code>search_after</Code>{" "}beside the
                            existing pagination, for the jobs that read everything.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="sorting">
                    <p>
                        Results come back ordered by relevance until you ask for something
                        else, and asking replaces relevance rather than adjusting it. That is
                        the whole of sorting in one sentence, and it is also the mistake:
                        a sort added for a &ldquo;top rated&rdquo; toggle silently changes
                        what the search box does. The other thing worth knowing is that
                        sorting on the wrong field type is an error, and that error explains
                        a mapping pattern from earlier.
                    </p>
                    <p>
                        Several sort keys act as tiebreakers in order, exactly like SQL&apos;s{" "}
                        <Code>ORDER BY</Code>: rating first, and among equal ratings the
                        newest release.
                    </p>
                    <CodeBlock code={SORT_NODE} lang="ts" />
                    <p>The same two keys over the wire:</p>
                    <CodeBlock code={SORT_CURL} lang="bash" />
                    <p>
                        <Term>The silent replacement.</Term>{" "}Sorted by rating, a 9.1 film
                        that barely mentions the word <em>war</em>{" "}in its overview now
                        outranks <em>War</em>{" "}itself at 7.0. The search still chose the
                        right documents — the order simply no longer reflects the search at
                        all, and nobody files a bug for that; they just stop trusting the
                        results.
                    </p>
                    <p>
                        When both matter, put <Code>_score</Code>{" "}in the sort explicitly and
                        let the field break ties, or leave the order to relevance and boost
                        by rating instead.
                    </p>
                    <CodeBlock code={SORT_SCORE_NODE} lang="ts" />
                    <p>
                        One more detail follows from a field sort: hits come back with{" "}
                        <Code>&quot;_score&quot;: null</Code>. Nothing is broken — scoring
                        was skipped because nothing asked for it, which is also a small
                        saving.
                    </p>
                    <p>
                        <Term>The text trap.</Term>{" "}Sorting on an analyzed field is not a
                        subtle failure like the others on this page — it is a loud one.
                    </p>
                    <CodeBlock code={SORT_TEXT_NODE} lang="ts" />
                    <p>Over the wire, the cluster says exactly what is wrong:</p>
                    <CodeBlock code={SORT_TEXT_CURL} lang="bash" />
                    <p>
                        The index holds terms, not values, so there is nothing to order by —
                        and <em>this</em>{" "}error is the entire reason the{" "}
                        <Code>title.raw</Code>{" "}keyword sub-field exists. Search the analyzed
                        field, sort the keyword one.
                    </p>
                    <CodeBlock code={SORT_RAW_NODE} lang="ts" />
                    <p>
                        Same field, same document, two indexed forms — the multi-field
                        pattern from Mappings &amp; Analysis, earning its place.
                    </p>

                    <Callout severity="trap" label="trap · sorting silently replaces relevance">
                        <p>
                            The zero-hit traps at least look wrong. This one returns a full
                            page of plausible results in an order that has nothing to do with
                            what the reader typed. Whenever a <Code>sort</Code>{" "}is added to a
                            query that has a search box, decide explicitly where{" "}
                            <Code>_score</Code>{" "}goes.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the error names its own fix">
                        <p>
                            <Code>Text fields are not optimised for operations that require
                            per-document field data ... use a keyword field instead</Code>{" "}
                            is one of the more helpful messages in Elasticsearch: it names the
                            cause and the remedy. Reading it as &ldquo;you meant{" "}
                            <Code>title.raw</Code>&rdquo; turns a 400 into a one-word fix.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — why that order, and showing it ---------- */}
            <PartHeading kicker="part 5">Relevance</PartHeading>
            <div>
                <DocSection title="what _score is: BM25">
                    <p>
                        Every &ldquo;why is this film first?&rdquo; ends at the same place:
                        BM25, the ranking function Elasticsearch scores with by default. It
                        combines three measurements, and once those are familiar most
                        rankings stop being mysterious. There is also an API that prints the
                        arithmetic for a single document, which beats guessing at boosts.
                    </p>
                    <p>
                        The first input is how often the term appears in the field being
                        searched.
                    </p>
                    <CodeBlock code={BM25_TF} lang="text" />
                    <p>
                        The second is how rare the term is across the whole index, which is
                        what stops common words from deciding anything.
                    </p>
                    <CodeBlock code={BM25_IDF} lang="text" />
                    <p>
                        In a two-word search it is usually the rare term that fixes the
                        order, and the common one barely participates.
                    </p>
                    <p>
                        The third is the length of the field the match was found in.
                    </p>
                    <CodeBlock code={BM25_LENGTH} lang="text" />
                    <p>
                        That is why an exact title match beats a passing mention in a
                        three-hundred-word overview even when both contain the term once.
                        Field length lives <em>inside</em>{" "}BM25 and is separate from the{" "}
                        <Code>^3</Code>{" "}boost, which multiplies on top of the finished
                        field score.
                    </p>
                    <p>
                        <Term>_explain is the debugger of search.</Term>{" "}Give it one
                        document id and the query, and it returns that document&apos;s score
                        as a tree rather than a number.
                    </p>
                    <CodeBlock code={EXPLAIN_NODE} lang="ts" />
                    <p>The same call as curl — note the id sits in the path:</p>
                    <CodeBlock code={EXPLAIN_CURL} lang="bash" />
                    <p>The response is the score, taken apart term by term:</p>
                    <CodeBlock code={EXPLAIN_OUT} lang="json" />
                    <p>
                        Each branch names a term and what it contributed —{" "}
                        <Code>freq</Code> for term frequency, <Code>idf</Code>{" "}for rarity,
                        and the length ratio <Code>dl / avgdl</Code>. It is unreadably
                        verbose the first time and invaluable the first time a ranking makes
                        no sense.
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
                            <Code>11.2</Code>{" "}for &ldquo;dark knight&rdquo; and{" "}
                            <Code>3.1</Code>{" "}for &ldquo;matrix&rdquo; say nothing about which
                            result is better: IDF depends on the terms, so every query has its
                            own scale. A <Code>_score</Code>{" "}orders documents{" "}
                            <em>within one query</em>{" "}and means nothing outside it — never
                            build a threshold, a badge or a &ldquo;good match&rdquo; feature
                            on the absolute number.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="highlighting">
                    <p>
                        A search interface does more than list results: it shows the reader
                        why each one is there, by marking the words that matched.
                        Elasticsearch does this itself, returning fragments of the matched
                        fields with the matched terms wrapped in tags. It computes them from
                        the same analyzed terms the search ran on, which is the part no
                        frontend can reproduce.
                    </p>
                    <p>
                        Highlighting is a sibling of <Code>query</Code>{" "}in the request body,
                        listing the fields to mark up — here the production{" "}
                        <Code>multi_match</Code>{" "}with two of its three fields highlighted.
                    </p>
                    <CodeBlock code={HIGHLIGHT_NODE} lang="ts" />
                    <p>The same request over the wire:</p>
                    <CodeBlock code={HIGHLIGHT_CURL} lang="bash" />
                    <p>
                        Each hit then carries a <Code>highlight</Code>{" "}object beside its{" "}
                        <Code>_source</Code>, which is still the untouched document.
                    </p>
                    <CodeBlock code={HIGHLIGHT_OUT} lang="json" />
                    <p>
                        Every field in that object maps to an <em>array</em>{" "}of fragments,
                        including short fields that produce exactly one — so the frontend
                        reads both cases the same way.
                    </p>
                    <p>
                        <Term>The markup is yours to choose.</Term>{" "}
                        <Code>&lt;em&gt;</Code>{" "}is the default;{" "}
                        <Code>pre_tags</Code> and <Code>post_tags</Code>{" "}swap in{" "}
                        <Code>&lt;mark&gt;</Code>{" "}or a tag carrying your own class.
                    </p>
                    <CodeBlock code={HIGHLIGHT_TAGS} lang="ts" />
                    <p>
                        <Term>Fragment size is too.</Term>{" "}A fragment is a window of
                        roughly a hundred characters around a match, so a long{" "}
                        <Code>overview</Code>{" "}comes back as excerpts rather than in full;{" "}
                        <Code>fragment_size</Code> and <Code>number_of_fragments</Code>{" "}set
                        how big each one is and how many you get.
                    </p>
                    <CodeBlock code={HIGHLIGHT_FRAGMENTS} lang="ts" />
                    <p>
                        A short field like <Code>title</Code>{" "}fits inside one fragment and
                        comes back whole regardless.
                    </p>
                    <p>
                        <Term>The part you cannot rebuild in the browser.</Term>{" "}
                        Highlighting marks the terms the query actually matched, so a search
                        for <Code>rises</Code>{" "}highlights the word{" "}
                        <Code>Rising</Code>{" "}in the text — both sides stemmed to the same
                        root, exactly as the match itself worked. An{" "}
                        <Code>indexOf</Code>{" "}or a regular expression over the raw{" "}
                        <Code>_source</Code>{" "}has no idea those two words are related, and
                        getting it right in the frontend would mean reimplementing every
                        stem, stopword and analyzer detail in JavaScript.
                    </p>

                    <Callout severity="note" label="note · a field only appears if it matched">
                        <p>
                            The <Code>highlight</Code>{" "}object contains a key for a field only
                            when that field contributed a match. A hit found through{" "}
                            <Code>overview</Code>{" "}alone has no <Code>highlight.title</Code>,
                            so the frontend renders the fragment when the key is there and
                            falls back to the plain <Code>_source</Code>{" "}value when it is not
                            — that fallback is the normal path for most fields, not an edge
                            case.
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
