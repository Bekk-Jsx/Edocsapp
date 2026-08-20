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
    // --- part 1 (The Idea) ---
    "what-aggregations-are": ["tip", "note"],

    // --- part 2 (The Two Families) ---
    "terms-the-facet-agg": ["trap", "note"],
    "metrics-compute-a-number": ["tip", "note"],
    "intervals-histogram-and-range": ["tip", "note"],

    // --- part 3 (Composing) ---
    "sub-aggregations-a-metric-per-bucket": ["tip", "note"],
    "aggregating-nested-fields": ["trap", "tip", "note"],

    // --- part 4 (In the App) ---
    "faceted-search-one-request": ["tip", "note"],
};

// Top-level divider between the four parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper the introduction, documents-indices, mappings-analysis,
// queries-structure and search-queries content files each define for their own
// part dividers.
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
// 1. A section opens with prose. The reader learns what the aggregation is for
//    before any request appears.
// 2. Every fragment is introduced by the sentence above it and, where it has a
//    consequence, read by the sentence below it. Two fragments never touch.
// 3. A comparison names both sides in plain words and ends in a paragraph
//    saying which one to write and why.
// 4. Every operation is shown twice — the Node client and the same request as
//    curl. Aggregations are the part of the DSL people reach for from a shell
//    first, so the wire form is not an afterthought here.
//
// Field names are this project's real mapping throughout: `original_language`
// and `genres.name` are keywords, `vote_average` is a float, `release_date` is a
// date. Queries Structure covers the abstract shape of the `aggs` slot with
// generic names; this page covers what the types inside it actually do.

// ===================================================================
// part 1 — the idea
// ===================================================================

const BUCKET_WALKTHROUGH = `5 documents                     sorted by value
--------------------------      ------------------
{ original_language: "en" }     en  <- 1, 3, 4
{ original_language: "fr" }     fr  <- 2
{ original_language: "en" }     ja  <- 5
{ original_language: "en" }
{ original_language: "ja" }     result
                                en: 3   fr: 1   ja: 1

group by value, count per group`;

const THREE_DECISIONS = `{
  "aggs": {
    "by_language": {                        // 1. LABEL — any name you like
      "terms": {                            // 2. OPERATION — the agg type
        "field": "original_language"        // 3. FIELD — what to read
      }
    }
  }
}`;

// ===================================================================
// part 2 — the two families
// ===================================================================

const TERMS_NODE = `await esClient.search({
    index: "movies",
    size: 0,                    // no hits — the aggregation is the answer
    aggs: {
        by_language: {
            terms: { field: "original_language", size: 5 },
        },
    },
});`;

const TERMS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "by_language": {
          "terms": { "field": "original_language", "size": 5 } } } }'`;

const TERMS_RESPONSE = `{
  "hits": { "total": { "value": 45000 }, "hits": [] },
  "aggregations": {
    "by_language": {
      "doc_count_error_upper_bound": 0,
      "sum_other_doc_count": 7581,
      "buckets": [
        { "key": "en", "doc_count": 31402 },
        { "key": "fr", "doc_count": 2314 },
        { "key": "es", "doc_count": 1502 },
        { "key": "ja", "doc_count": 1180 },
        { "key": "de", "doc_count": 1021 }
      ]
    }
  }
}`;

const TERMS_ON_TEXT_NODE = `// title is text (english analyzer) — not a keyword
await esClient.search({
    index: "movies",
    size: 0,
    aggs: { by_title: { terms: { field: "title" } } },
});   // ResponseError: illegal_argument_exception`;

const TERMS_ON_TEXT_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "by_title": { "terms": { "field": "title" } } } }'
# 400 "Text fields are not optimised for operations that
#      require per-document field data ... use a keyword
#      field instead"`;

const AVG_NODE = `await esClient.search({
    index: "movies",
    size: 0,
    aggs: {
        average_rating: {
            avg: { field: "vote_average" },
        },
    },
});`;

const AVG_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "average_rating": {
          "avg": { "field": "vote_average" } } } }'`;

const AVG_RESPONSE = `{
  "aggregations": {
    "average_rating": { "value": 6.28 }
  }
}`;

const STATS_NODE = `await esClient.search({
    index: "movies",
    size: 0,
    aggs: {
        rating_stats: {
            stats: { field: "vote_average" },
        },
    },
});`;

const STATS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "rating_stats": {
          "stats": { "field": "vote_average" } } } }'`;

const STATS_RESPONSE = `{
  "aggregations": {
    "rating_stats": {
      "count": 45000,
      "min":   0.0,
      "max":   10.0,
      "avg":   6.28,
      "sum":   282600.0
    }
  }
}`;

const TWO_FAMILIES = `bucket aggs    terms, histogram, range, nested
               group documents, count each group
               ->  "buckets": [ { key, doc_count }, ... ]

metric aggs    avg, min, max, sum, stats
               compute a number over the documents
               ->  "value": n        (stats: count/min/max/avg/sum)

the response shape tells you which family you used`;

const HISTOGRAM_NODE = `await esClient.search({
    index: "movies",
    size: 0,
    aggs: {
        rating_spread: {
            histogram: { field: "vote_average", interval: 2 },
        },
    },
});`;

const HISTOGRAM_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "rating_spread": {
          "histogram": { "field": "vote_average", "interval": 2 } } } }'`;

const HISTOGRAM_RESPONSE = `{
  "aggregations": {
    "rating_spread": {
      "buckets": [
        { "key": 0.0,  "doc_count": 1204 },    // 0.0 <= rating < 2.0
        { "key": 2.0,  "doc_count": 2610 },
        { "key": 4.0,  "doc_count": 12880 },
        { "key": 6.0,  "doc_count": 24150 },
        { "key": 8.0,  "doc_count": 4050 },
        { "key": 10.0, "doc_count": 106 }
      ]
    }
  }
}`;

const RANGE_NODE = `await esClient.search({
    index: "movies",
    size: 0,
    aggs: {
        rating_bands: {
            range: {
                field: "vote_average",
                ranges: [
                    { to: 4 },            // everything below 4
                    { from: 4, to: 7 },   // 4 <= rating < 7
                    { from: 7 },          // 7 and up
                ],
            },
        },
    },
});`;

const RANGE_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "rating_bands": {
          "range": { "field": "vote_average",
            "ranges": [ { "to": 4 },
                        { "from": 4, "to": 7 },
                        { "from": 7 } ] } } } }'`;

const RANGE_RESPONSE = `{
  "aggregations": {
    "rating_bands": {
      "buckets": [
        { "key": "*-4.0",   "to": 4.0,               "doc_count": 3814 },
        { "key": "4.0-7.0", "from": 4.0, "to": 7.0,  "doc_count": 28960 },
        { "key": "7.0-*",   "from": 7.0,             "doc_count": 12226 }
      ]
    }
  }
}`;

// ===================================================================
// part 3 — composing
// ===================================================================

const SUBAGG_ANNOTATED = `{
  "aggs": {
    "by_language": {                          // the GROUP BY
      "terms": { "field": "original_language" },
      "aggs": {                               // <- INSIDE the bucket agg
        "avg_rating": {                       // what to compute per group
          "avg": { "field": "vote_average" }
        }
      }
    }
  }
}`;

const SUBAGG_NODE = `await esClient.search({
    index: "movies",
    size: 0,
    aggs: {
        by_language: {
            terms: { field: "original_language", size: 5 },
            aggs: {
                avg_rating: { avg: { field: "vote_average" } },
            },
        },
    },
});`;

const SUBAGG_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "by_language": {
          "terms": { "field": "original_language", "size": 5 },
          "aggs": { "avg_rating": {
            "avg": { "field": "vote_average" } } } } } }'`;

const SUBAGG_RESPONSE = `{
  "aggregations": {
    "by_language": {
      "buckets": [
        { "key": "en", "doc_count": 31402,
          "avg_rating": { "value": 6.51 } },
        { "key": "fr", "doc_count": 2314,
          "avg_rating": { "value": 6.72 } },
        { "key": "es", "doc_count": 1502,
          "avg_rating": { "value": 6.63 } }
      ]
    }
  }
}`;

const SUBAGG_RECURSION = `terms   original_language     per language
  terms   release_date          -> per year
    avg   vote_average          -> its average rating

the same move repeated — a bucket agg, then what to
compute inside each bucket it produced`;

const NESTED_PLAIN_NODE = `// genres is a nested field — this reads the OUTER documents
await esClient.search({
    index: "movies",
    size: 0,
    aggs: { by_genre: { terms: { field: "genres.name" } } },
});`;

const NESTED_PLAIN_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "by_genre": {
          "terms": { "field": "genres.name" } } } }'
# 200 OK
# "by_genre": { "buckets": [] }     <- empty, and no error`;

const NESTED_AGG_NODE = `await esClient.search({
    index: "movies",
    size: 0,
    aggs: {
        genres_scope: {
            nested: { path: "genres" },   // step inside the hidden docs
            aggs: {
                by_genre: {               // the real aggregation
                    terms: { field: "genres.name", size: 5 },
                },
            },
        },
    },
});`;

const NESTED_AGG_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 0,
        "aggs": { "genres_scope": {
          "nested": { "path": "genres" },
          "aggs": { "by_genre": {
            "terms": { "field": "genres.name", "size": 5 } } } } } }'`;

const NESTED_AGG_RESPONSE = `{
  "aggregations": {
    "genres_scope": {
      "doc_count": 98214,              // GENRE ENTRIES, not movies
      "by_genre": {
        "buckets": [
          { "key": "Drama",    "doc_count": 20265 },
          { "key": "Comedy",   "doc_count": 13182 },
          { "key": "Thriller", "doc_count": 7624 },
          { "key": "Action",   "doc_count": 7130 },
          { "key": "Romance",  "doc_count": 6735 }
        ]
      }
    }
  }
}`;

const NESTED_PAIRING = `nested query   filters movies by a value inside genres
nested agg     counts values inside genres

same reason (hidden sub-documents), same "path",
same wrapper-then-inner structure`;

// ===================================================================
// part 4 — in the app
// ===================================================================

const FACETS_NODE = `await esClient.search({
    index: "movies",
    size: 20,                                   // the page of results
    query: {
        bool: {
            must: [
                {
                    multi_match: {
                        query: "space",
                        fields: ["title^3", "overview", "tagline"],
                        fuzziness: "AUTO",
                    },
                },
            ],
            filter: [{ range: { vote_average: { gte: 6 } } }],
        },
    },
    aggs: {                                     // the sidebar
        by_language: {
            terms: { field: "original_language", size: 5 },
        },
        genres_scope: {
            nested: { path: "genres" },
            aggs: {
                by_genre: { terms: { field: "genres.name", size: 5 } },
            },
        },
    },
});`;

const FACETS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 20,
        "query": { "bool": {
          "must": [ { "multi_match": { "query": "space",
            "fields": ["title^3","overview","tagline"],
            "fuzziness": "AUTO" } } ],
          "filter": [ { "range": { "vote_average": { "gte": 6 } } } ] } },
        "aggs": {
          "by_language": {
            "terms": { "field": "original_language", "size": 5 } },
          "genres_scope": {
            "nested": { "path": "genres" },
            "aggs": { "by_genre": {
              "terms": { "field": "genres.name", "size": 5 } } } } } }'`;

const FACETS_RESPONSE = `{
  "hits": {
    "total": { "value": 128 },
    "hits": [ { "_source": { "title": "..." } }, ... ]   // 20 of them
  },
  "aggregations": {
    "by_language": {
      "buckets": [
        { "key": "en", "doc_count": 119 },
        { "key": "fr", "doc_count": 5 },
        { "key": "ja", "doc_count": 4 }
      ]
    },
    "genres_scope": {
      "doc_count": 287,
      "by_genre": {
        "buckets": [
          { "key": "Science Fiction", "doc_count": 61 },
          { "key": "Adventure",       "doc_count": 44 },
          { "key": "Drama",           "doc_count": 38 }
        ]
      }
    }
  }
}`;

const CINEVERSE_UPGRADE = `// movies.service.ts — searchMovies, as it already is
const response = await esClient.search({
    index: "movies",
    from: (page - 1) * limit,
    size: limit,
    query: { bool: { must, filter } },
    _source: ["title", "overview", "vote_average", "release_date", "genres"],

    // the whole upgrade: one aggs block beside the existing bool
    aggs: {
        by_language: { terms: { field: "original_language", size: 10 } },
        genres_scope: {
            nested: { path: "genres" },
            aggs: { by_genre: { terms: { field: "genres.name", size: 20 } } },
        },
    },
});

return {
    data: mapped,                          // unchanged
    total: totalCount,                     // unchanged
    facets: response.aggregations,         // new, same round-trip
};`;

export function AggregationsDocs() {
    return (
        <>
            {/* Page lead. Frames the shift from "which documents?" to "what does
                the data look like?" before the first divider, and says once that
                every operation below is shown as both Node and curl. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Every query on the previous page answered the same question:{" "}
                    <em>which documents match?</em>{" "}This page answers a different
                    one — <em>what does the data look like?</em>{" "}An aggregation
                    reads the matching documents and hands back a summary of them
                    instead of the documents themselves: how many films per genre,
                    the average rating per year, the spread of scores across the
                    catalogue.
                </p>
                <p>
                    The page descends through the two families every aggregation
                    belongs to, then composes them — a metric inside a bucket, a
                    bucket inside a nested field — and ends where a real search page
                    ends: one request that returns a page of results and the sidebar
                    counts beside it.
                </p>
                <p>
                    Every operation appears twice, as the Node client call and as the
                    same request over the wire. Aggregations are the part of the DSL
                    most people first poke at from a shell, so the curl form is shown
                    beside the client rather than left to be inferred.
                </p>
            </div>

            {/* ---------- part 1 — the idea ---------- */}
            <PartHeading kicker="part 1">The Idea</PartHeading>
            <div>
                <DocSection title="what aggregations are">
                    <p>
                        An aggregation is Elasticsearch&apos;s{" "}
                        <Code>GROUP BY</Code>{" "}with its statistical functions
                        attached, computed in a single pass over the set of documents
                        the query matched. It is what every facet sidebar you have
                        ever used is made of — the{" "}
                        <Code>Action (1,204) · Drama (987)</Code>{" "}column beside a
                        list of results is one aggregation, rendered.
                    </p>
                    <p>
                        The mechanism is worth seeing at a size you can count. Five
                        documents go in, each carrying a language; they are sorted
                        into a group per distinct value, and each group is counted:
                    </p>
                    <CodeBlock code={BUCKET_WALKTHROUGH} lang="text" />
                    <p>
                        <Term>What comes back is buckets, not documents.</Term>{" "}
                        Nothing in that result is a film. The five inputs were read
                        and discarded, and what survives is three groups and three
                        numbers — which is why an aggregation can summarise a million
                        documents into a sidebar without ever sending a million
                        documents anywhere.
                    </p>
                    <p>
                        <Term>Building one — three decisions.</Term>{" "}Every
                        aggregation on this page, however deep it eventually nests, is
                        assembled from exactly three choices: a{" "}
                        <Term>label</Term>{" "}you invent, which keys the result in the
                        response; an <Term>operation</Term>, which is the aggregation
                        type; and the <Term>field</Term>{" "}it reads.
                    </p>
                    <CodeBlock code={THREE_DECISIONS} lang="jsonc" />
                    <p>
                        The label is free-form —{" "}
                        <Code>by_language</Code>{" "}could have been{" "}
                        <Code>languages</Code>{" "}or <Code>x</Code>{" "}— and it is the
                        key your code will read the answer out of, which is the whole
                        argument for naming it after the number it produces. Only the
                        middle line, the operation, comes from
                        Elasticsearch&apos;s vocabulary.
                    </p>
                    <p>
                        Everything remaining in this chapter is those same three
                        decisions with a different operation in the middle. Learning
                        aggregations is mostly learning that vocabulary; the shape
                        around it never changes.
                    </p>

                    <Callout severity="tip" label="tip · name the label for the reader">
                        <p>
                            The label is the one place in the request where you can be
                            useful to whoever parses the response.{" "}
                            <Code>avg_rating</Code>{" "}tells the next reader what the
                            number is; <Code>avg</Code>{" "}only repeats the line
                            underneath it, which already says so.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · aggs is a sibling of query">
                        <p>
                            <Code>aggs</Code>{" "}sits beside <Code>query</Code>{" "}at the
                            top level of the body, never inside it — Queries Structure
                            covers that slot in full. An aggregation adds to the
                            response and never removes a hit from it, so it can never
                            be the reason a document is missing.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the two families ---------- */}
            <PartHeading kicker="part 2">The Two Families</PartHeading>
            <div>
                <DocSection title="terms: the facet agg">
                    <p>
                        <Code>terms</Code>{" "}is the aggregation a facet sidebar is
                        built from, and the one worth knowing first. It groups the
                        matching documents by the distinct values of a field and
                        counts each group — one bucket per value, sorted by count.
                        Point it at a language field and you get the language filter;
                        point it at a status field and you get the status filter.
                    </p>
                    <p>
                        Asking for the five commonest languages in the index, with no
                        hits in the response at all:
                    </p>
                    <CodeBlock code={TERMS_NODE} lang="ts" />
                    <p>The same request as curl:</p>
                    <CodeBlock code={TERMS_CURL} lang="bash" />
                    <p>
                        The answer arrives under your own label, and the shape of it
                        is the point:
                    </p>
                    <CodeBlock code={TERMS_RESPONSE} lang="json" />
                    <p>
                        <Term>That buckets array is the facet UI.</Term>{" "}Each entry
                        is a <Code>key</Code>{" "}and a <Code>doc_count</Code>, already
                        sorted by count descending, which is the order a sidebar wants
                        to render them in. Mapping it to a list of checkboxes with
                        counts beside them is a{" "}
                        <Code>.map()</Code>{" "}and nothing more —{" "}
                        <Code>aggregations.by_language.buckets</Code>{" "}is the whole
                        data source.
                    </p>
                    <p>
                        <Term>Two different parameters are both called size.</Term>{" "}
                        They sit at different levels and do unrelated things, which is
                        the first thing to get straight about this aggregation.
                    </p>
                    <p>
                        The top-level <Code>size: 0</Code>{" "}asks for zero hits, so
                        the response carries the aggregations alone. It is not a
                        cosmetic choice: it skips fetching and decompressing{" "}
                        <Code>_source</Code>{" "}for the documents entirely, and a
                        facet-only request has no use for them. The{" "}
                        <Code>size</Code>{" "}inside <Code>terms</Code>{" "}is a different
                        parameter — how many buckets to return, defaulting to ten.
                    </p>
                    <p>
                        <Term>
                            <Code>terms</Code>{" "}gives you the top N, not the full
                            list.
                        </Term>{" "}
                        That default of ten is a cut-off, and the response says as
                        much: <Code>sum_other_doc_count</Code>{" "}is how many matching
                        documents fell into buckets you did not ask for — 7,581 above.
                        A field with forty languages returns ten buckets and no
                        warning beyond that number, so reading a{" "}
                        <Code>terms</Code>{" "}result as &ldquo;all the values&rdquo; is
                        how a facet quietly goes incomplete.
                    </p>
                    <p>
                        <Term>The field has to be a keyword.</Term>{" "}Buckets are
                        grouped by exact value, and an analyzed field has no exact
                        values to group by — only the stems the analyzer produced.
                        Pointing <Code>terms</Code>{" "}at <Code>title</Code>{" "}fails
                        the same way sorting on it does:
                    </p>
                    <CodeBlock code={TERMS_ON_TEXT_NODE} lang="ts" />
                    <p>And over the wire, with the error it returns:</p>
                    <CodeBlock code={TERMS_ON_TEXT_CURL} lang="bash" />
                    <p>
                        This is the same <Code>400</Code>{" "}that sorting on a{" "}
                        <Code>text</Code>{" "}field produces, and for the same reason —
                        both operations need per-document values that an analyzed
                        field does not keep. It is also why{" "}
                        <Code>original_language</Code>{" "}and{" "}
                        <Code>genres.name</Code>{" "}are mapped as{" "}
                        <Code>keyword</Code>{" "}in this project: they exist to be
                        filtered and counted, never to be searched as prose.
                    </p>

                    <Callout severity="trap" label="trap · a terms agg on a text field is a 400">
                        <p>
                            <Code>Text fields are not optimised for operations that
                            require per-document field data ... use a keyword field
                            instead</Code>{" "}
                            names its own fix. If the field has a{" "}
                            <Code>.raw</Code>{" "}sub-field, aggregate that; if it does
                            not, the mapping is what needs changing, and that means a
                            reindex. Unlike a{" "}
                            <Code>term</Code>{" "}query on the same field, this one at
                            least fails loudly.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · why counts can be slightly off">
                        <p>
                            <Code>doc_count_error_upper_bound</Code>{" "}exists because
                            each shard returns its own top N before the results are
                            merged, so a value that ranks eleventh everywhere can be
                            undercounted. It is <Code>0</Code>{" "}on a single-shard
                            index like this one, and worth raising{" "}
                            <Code>size</Code>{" "}for when it is not.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <div>
                <DocSection title="metrics: compute a number">
                    <p>
                        The second family does not group anything. Where a bucket
                        aggregation sorts documents into piles and counts them, a
                        metric aggregation reads a field across the whole matching set
                        and returns one number: an average, a maximum, a total.
                        &ldquo;How many films per language&rdquo; is a bucket
                        question; &ldquo;what is the average rating&rdquo; is a metric
                        one.
                    </p>
                    <p>
                        The three decisions are unchanged, and only the operation in
                        the middle is different — <Code>avg</Code>{" "}where the last
                        section had <Code>terms</Code>:
                    </p>
                    <CodeBlock code={AVG_NODE} lang="ts" />
                    <p>The same request as curl:</p>
                    <CodeBlock code={AVG_CURL} lang="bash" />
                    <p>
                        The response is where the family shows itself — there is no
                        buckets array anywhere in it:
                    </p>
                    <CodeBlock code={AVG_RESPONSE} lang="json" />
                    <p>
                        One label, one <Code>value</Code>. That is the entire result:
                        the average rating across all 45,000 matching films.
                    </p>
                    <p>
                        <Term>
                            <Code>avg</Code>, <Code>min</Code>, <Code>max</Code> and{" "}
                            <Code>sum</Code>{" "}are the same aggregation with a
                            different word.
                        </Term>{" "}
                        Each takes a <Code>field</Code>, each returns a{" "}
                        <Code>value</Code>, and swapping between them is a one-word
                        edit. There is nothing further to learn about any of them once
                        you have written one.
                    </p>
                    <p>
                        When you want several of those numbers at once, asking four
                        times is wasteful and unnecessary —{" "}
                        <Code>stats</Code>{" "}computes them in one pass:
                    </p>
                    <CodeBlock code={STATS_NODE} lang="ts" />
                    <p>And the same, over the wire:</p>
                    <CodeBlock code={STATS_CURL} lang="bash" />
                    <p>
                        It returns the whole set of them under one label, with the
                        document count included:
                    </p>
                    <CodeBlock code={STATS_RESPONSE} lang="json" />
                    <p>
                        <Code>count</Code>{" "}here is how many documents actually had a
                        value for the field, which is a genuinely useful number beside
                        the average — an <Code>avg</Code>{" "}over 400 documents out of
                        45,000 means something quite different from one over all of
                        them.
                    </p>
                    <p>
                        <Term>Two families, two response shapes.</Term>{" "}Everything
                        on this page belongs to one or the other, and you can tell
                        which from the answer alone:
                    </p>
                    <CodeBlock code={TWO_FAMILIES} lang="text" />
                    <p>
                        That is worth holding onto, because it is what the next
                        section is built on: the two families are not alternatives to
                        choose between, and the interesting questions need both at
                        once.
                    </p>

                    <Callout severity="tip" label="tip · reach for stats before writing three aggs">
                        <p>
                            <Code>stats</Code>{" "}costs about what a single{" "}
                            <Code>avg</Code>{" "}costs, so a request that already wants
                            an average and a maximum should ask for it instead. There
                            is also{" "}
                            <Code>extended_stats</Code>{" "}when you need variance and
                            standard deviation, with the same shape again.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · missing values are skipped, not zeroed">
                        <p>
                            A document with no value for the field is left out of a
                            metric rather than counted as{" "}
                            <Code>0</Code>, which is why{" "}
                            <Code>count</Code>{" "}can be lower than{" "}
                            <Code>hits.total</Code>. Pass{" "}
                            <Code>missing</Code>{" "}on the aggregation to substitute a
                            value instead, if a gap genuinely means zero for your data.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <div>
                <DocSection title="intervals: histogram and range">
                    <p>
                        A <Code>terms</Code>{" "}aggregation on a rating would produce a
                        bucket for 6.4, another for 6.5, another for 6.6 — technically
                        correct and useless as a filter. Continuous numbers need
                        grouping into intervals before they mean anything, and there
                        are two bucket aggregations for it: one where the intervals
                        are regular, one where you choose them yourself.
                    </p>
                    <p>
                        <Term>
                            <Code>histogram</Code>{" "}is fixed-width, and you give the
                            step.
                        </Term>{" "}
                        Elasticsearch works out how many buckets that implies from the
                        data it finds:
                    </p>
                    <CodeBlock code={HISTOGRAM_NODE} lang="ts" />
                    <p>The same request as curl:</p>
                    <CodeBlock code={HISTOGRAM_CURL} lang="bash" />
                    <p>
                        Each bucket is keyed by its lower edge, and the interval is
                        half-open — a document sits in the bucket whose key it is at
                        least, and whose key plus interval it is below:
                    </p>
                    <CodeBlock code={HISTOGRAM_RESPONSE} lang="jsonc" />
                    <p>
                        So <Code>key: 6.0</Code>{" "}holds every rating from 6.0 up to
                        but not including 8.0, and a film rated exactly 8.0 is in the
                        next bucket rather than this one. That half-open rule is what
                        makes the buckets tile the range without overlapping.
                    </p>
                    <p>
                        <Term>
                            <Code>range</Code>{" "}is hand-picked bands, and they need
                            not be even.
                        </Term>{" "}
                        You list the boundaries you actually care about, which is
                        usually what a UI wants: &ldquo;poor, decent,
                        excellent&rdquo; are not three equal widths.
                    </p>
                    <CodeBlock code={RANGE_NODE} lang="ts" />
                    <p>And the same bands over the wire:</p>
                    <CodeBlock code={RANGE_CURL} lang="bash" />
                    <p>
                        Each band comes back keyed by its own bounds, with{" "}
                        <Code>from</Code>{" "}inclusive and <Code>to</Code>{" "}exclusive —
                        the same half-open convention as the histogram:
                    </p>
                    <CodeBlock code={RANGE_RESPONSE} lang="json" />
                    <p>
                        <Term>The rule of thumb is short.</Term>{" "}Regular steps —
                        every 2 points, every 10 minutes of runtime — call for{" "}
                        <Code>histogram</Code>. Bands you chose for a reason call for{" "}
                        <Code>range</Code>. Where a histogram would work, prefer it,
                        because it needs no maintenance as the data shifts.
                    </p>
                    <p>
                        Both are bucket aggregations in the full sense, which matters
                        more than it sounds: everything the last two sections
                        established applies unchanged. They return a{" "}
                        <Code>buckets</Code>{" "}array, they count only the documents the
                        query matched, and they take sub-aggregations — a histogram of
                        ratings where each bar also carries its average revenue is the
                        next section&apos;s move applied here.
                    </p>
                    <p>
                        Dates have their own version. <Code>date_histogram</Code>{" "}
                        with <Code>calendar_interval: &quot;year&quot;</Code>{" "}on{" "}
                        <Code>release_date</Code>{" "}is the films-per-year facet, and it
                        understands that months and years have unequal lengths in a
                        way a fixed millisecond interval cannot.
                    </p>

                    <Callout severity="tip" label="tip · let the interval follow the filter">
                        <p>
                            A histogram over a range the user has already narrowed
                            produces one bar, which reads as broken. Either derive the{" "}
                            <Code>interval</Code>{" "}from the current bounds, or use{" "}
                            <Code>auto_date_histogram</Code>{" "}for dates, which takes a
                            target bucket count and picks the interval itself.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · empty buckets are omitted by default">
                        <p>
                            A histogram skips intervals with no documents, so a chart
                            drawn straight from the buckets can show a gap as though it
                            were adjacent data. <Code>min_doc_count: 0</Code>{" "}keeps
                            the empty buckets in the response, and{" "}
                            <Code>extended_bounds</Code>{" "}holds the axis to a fixed
                            span regardless of what matched.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — putting the families together ---------- */}
            <PartHeading kicker="part 3">Composing</PartHeading>
            <div>
                <DocSection title="sub-aggregations: a metric per bucket">
                    <p>
                        &ldquo;What is the average rating per language?&rdquo; is the
                        question that needs both families, and neither one answers it
                        alone. A <Code>terms</Code>{" "}aggregation on the language gives
                        counts and no ratings. An <Code>avg</Code>{" "}on the rating gives
                        one number for the entire index, with the languages collapsed
                        into it. What the question asks for is the metric computed once
                        per group.
                    </p>
                    <p>
                        The answer is an <Code>aggs</Code>{" "}block placed{" "}
                        <em>inside</em>{" "}the bucket aggregation rather than beside it:
                    </p>
                    <CodeBlock code={SUBAGG_ANNOTATED} lang="jsonc" />
                    <p>
                        Mechanically, the order is what makes it work: documents fall
                        into their buckets first, and the metric then runs separately
                        inside each one, over that bucket&apos;s documents only. The
                        English bucket&apos;s average is computed from English films
                        and nothing else.
                    </p>
                    <p>
                        The same request through the client, with both{" "}
                        <Code>size</Code>{" "}parameters in place:
                    </p>
                    <CodeBlock code={SUBAGG_NODE} lang="ts" />
                    <p>And the nesting, over the wire:</p>
                    <CodeBlock code={SUBAGG_CURL} lang="bash" />
                    <p>
                        The response mirrors the request&apos;s nesting exactly — each
                        bucket keeps its <Code>key</Code>{" "}and{" "}
                        <Code>doc_count</Code>, and now carries the sub-aggregation
                        under its own label as well:
                    </p>
                    <CodeBlock code={SUBAGG_RESPONSE} lang="json" />
                    <p>
                        Read the first bucket aloud and the shape stops being
                        abstract: there are 31,402 English-language films in the
                        matching set, and they average 6.51. The second says 2,314
                        French films average 6.72 — a comparison the request produced
                        in one pass, which two separate requests could not have made
                        safely.
                    </p>
                    <p>
                        <Term>
                            The bucket agg is the <Code>GROUP BY</Code>; the sub-agg is
                            what to compute per group.
                        </Term>{" "}
                        That sentence is the whole concept, and it maps onto SQL
                        closely enough to be worth keeping —{" "}
                        <Code>GROUP BY original_language</Code>{" "}with{" "}
                        <Code>AVG(vote_average)</Code>{" "}in the select list is the same
                        statement.
                    </p>
                    <p>
                        And it recurses. A sub-aggregation is an ordinary aggregation,
                        so it can be another bucket agg with a metric inside{" "}
                        <em>it</em>, as deep as the question requires:
                    </p>
                    <CodeBlock code={SUBAGG_RECURSION} lang="text" />
                    <p>
                        Nothing new is introduced at any level — it is the same move
                        repeated, exactly as <Code>bool</Code>{" "}nests inside{" "}
                        <Code>bool</Code>{" "}on the queries side. Per language, per
                        year, its average rating is three lines of the same idea.
                    </p>

                    <Callout severity="tip" label="tip · put the metric where the question puts it">
                        <p>
                            An <Code>avg</Code>{" "}beside <Code>terms</Code>{" "}and an{" "}
                            <Code>avg</Code>{" "}inside it are both valid requests with
                            entirely different answers — one global number against one
                            per bucket. When a result looks suspiciously identical
                            across every bucket, check which side of the brace the
                            metric ended up on.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · sub-aggs multiply the work">
                        <p>
                            A metric inside a bucket agg runs once per bucket, so
                            depth costs real time:{" "}
                            <Code>terms</Code>{" "}at size 50 holding{" "}
                            <Code>terms</Code>{" "}at size 50 is 2,500 groups before any
                            metric runs. Keep each level&apos;s{" "}
                            <Code>size</Code>{" "}to what the interface actually renders.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <div>
                <DocSection title="aggregating nested fields">
                    <p>
                        The genre facet — the one filter every film interface has — is
                        a <Code>terms</Code>{" "}aggregation on{" "}
                        <Code>genres.name</Code>. That field sits inside a{" "}
                        <Code>nested</Code>{" "}mapping, and the rule established on the
                        query side applies here without modification: nested objects
                        are indexed as separate hidden documents, and nothing reaches
                        them without a wrapper naming the path.
                    </p>
                    <p>
                        <Term>A plain terms on the nested field.</Term>{" "}The obvious
                        request, aimed straight at the field as written in the
                        mapping:
                    </p>
                    <CodeBlock code={NESTED_PLAIN_NODE} lang="ts" />
                    <p>And over the wire, with what it returns:</p>
                    <CodeBlock code={NESTED_PLAIN_CURL} lang="bash" />
                    <p>
                        <Code>200 OK</Code>, well-formed JSON, and{" "}
                        <Code>buckets: []</Code>. There is no error, because nothing
                        invalid was asked: the aggregation ran over the outer
                        documents, and the outer documents genuinely have no{" "}
                        <Code>genres.name</Code>{" "}values — those live in sub-documents
                        it never looked at.
                    </p>
                    <p>
                        <Term>Wrapped in a nested agg.</Term>{" "}The fix is an outer
                        aggregation whose only job is stepping inside the path, with
                        the real <Code>terms</Code>{" "}as its sub-aggregation:
                    </p>
                    <CodeBlock code={NESTED_AGG_NODE} lang="ts" />
                    <p>The same wrapper-then-inner structure as curl:</p>
                    <CodeBlock code={NESTED_AGG_CURL} lang="bash" />
                    <p>
                        The response goes one level deeper to match, following the
                        nesting of the request — your scope label, then your terms
                        label inside it:
                    </p>
                    <CodeBlock code={NESTED_AGG_RESPONSE} lang="jsonc" />
                    <p>
                        <Term>
                            Wrapped is the version to write; there is no case for the
                            plain one.
                        </Term>{" "}
                        The plain form is not a cheaper variant with a caveat — it
                        returns nothing at all, and it does so silently, which is
                        strictly worse than the <Code>400</Code>{" "}a{" "}
                        <Code>text</Code>{" "}field would have given you.
                    </p>
                    <p>
                        <Term>Those doc_counts are counting nested documents.</Term>{" "}
                        This is the part that misleads people who got the wrapper
                        right. Inside a <Code>nested</Code>{" "}scope the unit being
                        counted is the sub-document, not the film: a movie with three
                        genres contributes one entry to each of its three buckets, so
                        the bucket counts sum to well beyond the number of films.
                    </p>
                    <p>
                        The scope&apos;s own <Code>doc_count</Code>{" "}says the same
                        thing plainly — 98,214 is the number of genre entries across
                        the index, not the 45,000 films that own them. For a facet
                        sidebar that is exactly the number you want:{" "}
                        <Code>Drama (20,265)</Code>{" "}means 20,265 films are tagged
                        Drama, and a film being tagged Drama and Thriller both is not
                        double-counting, it is two true statements. It stops being the
                        number you want the moment you try to read it as a total.
                    </p>
                    <p>
                        <Term>The pairing to memorise:</Term>{" "}nested query and
                        nested agg are the same wrapper for the same reason, one
                        filtering and one counting.
                    </p>
                    <CodeBlock code={NESTED_PAIRING} lang="text" />
                    <p>
                        If a filter on a nested field needs the wrapper, its facet
                        needs it too — and the <Code>path</Code>{" "}is identical in
                        both. Getting one right and forgetting the other is how a
                        working genre filter ends up beside an empty genre sidebar.
                    </p>

                    <Callout severity="trap" label="trap · the empty facet with no error">
                        <p>
                            A missing <Code>nested</Code>{" "}wrapper produces{" "}
                            <Code>buckets: []</Code>{" "}and a{" "}
                            <Code>200</Code>, so the request looks healthy in every log
                            and monitor you have. It is normally found when someone
                            notices the genre filter has been empty since launch —
                            same silent-failure family as a{" "}
                            <Code>term</Code>{" "}query on a <Code>text</Code>{" "}field.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · check the mapping before the query">
                        <p>
                            Whether a field needs the wrapper is decided by the
                            mapping and nothing else. In this project{" "}
                            <Code>genres</Code>{" "}and <Code>keywords</Code>{" "}are{" "}
                            <Code>nested</Code>{" "}and their facets need it, while{" "}
                            <Code>original_language</Code>{" "}is a top-level{" "}
                            <Code>keyword</Code>{" "}and must not have it — a{" "}
                            <Code>nested</Code>{" "}agg on a non-nested path returns
                            nothing just as quietly.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · getting back to movie counts">
                        <p>
                            When you genuinely need films rather than genre entries, a{" "}
                            <Code>reverse_nested</Code>{" "}sub-aggregation inside the
                            bucket climbs back out to the parent document and counts
                            those instead. A facet sidebar does not need it; a report
                            that must add up does.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — what the app actually sends ---------- */}
            <PartHeading kicker="part 4">In the App</PartHeading>
            <div>
                <DocSection title="faceted search: one request">
                    <p>
                        A real search page shows results and a sidebar of counts, and
                        it fires one request to get both. This is where the two
                        top-level slots finally work together: <Code>query</Code>{" "}
                        decides which films the page lists, and{" "}
                        <Code>aggs</Code>{" "}describes that same set of films for the
                        filters beside it. Nothing new is introduced here — it is the
                        query from the previous chapter and the aggregations from this
                        one, in one body.
                    </p>
                    <p>
                        This project&apos;s search, written out in full: a{" "}
                        <Code>bool</Code>{" "}with the reader&apos;s text in{" "}
                        <Code>must</Code>{" "}and a rating floor in{" "}
                        <Code>filter</Code>, two aggregations beside it, and a page of
                        twenty hits:
                    </p>
                    <CodeBlock code={FACETS_NODE} lang="ts" />
                    <p>The same request as curl, query slot and aggs slot together:</p>
                    <CodeBlock code={FACETS_CURL} lang="bash" />
                    <p>
                        <Term>
                            The rule that makes this work: aggregations run over the
                            query&apos;s matching set.
                        </Term>{" "}
                        Not over the whole index — over exactly the documents the{" "}
                        <Code>query</Code>{" "}matched. It is the single most useful fact
                        on this page, because it is what makes the sidebar numbers
                        trustworthy: they are computed from the same set, in the same
                        pass, as the results the reader is looking at.
                    </p>
                    <p>
                        The response carries both, side by side, and they agree by
                        construction:
                    </p>
                    <CodeBlock code={FACETS_RESPONSE} lang="jsonc" />
                    <p>
                        There are 128 matches, of which 20 came back as hits; the
                        language buckets add up to 128 because every match has exactly
                        one language. The genre scope reports 287, which is genre
                        entries again rather than films — the reading trap from the
                        last section, in the response the search page actually
                        receives.
                    </p>
                    <p>
                        <Term>What this means for cineverse.</Term>{" "}
                        <Code>searchMovies</Code>{" "}in{" "}
                        <Code>movies.service.ts</Code>{" "}already builds the{" "}
                        <Code>bool</Code>{" "}shown above, clause by clause, from the
                        filters it is handed. Adding facets is one block beside it and
                        one more field on the way out:
                    </p>
                    <CodeBlock code={CINEVERSE_UPGRADE} lang="ts" />
                    <p>
                        The existing <Code>from</Code>, <Code>size</Code>,{" "}
                        <Code>query</Code>{" "}and <Code>_source</Code>{" "}are untouched,
                        the mapped hits still return as they did, and the facet counts
                        ride along on the request that was already being made. No
                        extra round-trip, and no second code path that could disagree
                        with the first.
                    </p>
                    <p>
                        One consequence is worth naming before it surprises you:
                        because aggregations honour the query, clicking a facet
                        narrows the results <em>and</em>{" "}shrinks the other facets&apos;
                        counts — so selecting a genre can leave the language filter
                        showing options the reader can no longer widen back to. The
                        fix is <Code>post_filter</Code>{" "}for the selected facet, or a{" "}
                        <Code>global</Code>{" "}aggregation to escape the query scope.
                        Neither is needed for what this project does today, and
                        knowing the names is enough until it is.
                    </p>

                    <Callout severity="tip" label="tip · size 20 for the page, size 0 for a refresh">
                        <p>
                            The facets and the hits do not have to travel together
                            forever. When a reader pages through results the facets
                            have not changed, so page two can skip the{" "}
                            <Code>aggs</Code>{" "}block entirely — and a request that
                            only needs to refresh counts can send{" "}
                            <Code>size: 0</Code>. Same body, two cheaper variants of
                            it.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · filter context and cached facets">
                        <p>
                            Conditions in <Code>filter</Code>{" "}are unscored and
                            cacheable, and they still narrow the set the aggregations
                            see. A rating floor or a language filter therefore makes
                            the facets cheaper rather than more expensive — which is
                            another reason binary conditions belong in{" "}
                            <Code>filter</Code>{" "}rather than <Code>must</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside all four parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>How do you get the facet counts for the sidebar?</>}
                    a={
                        <>
                            &ldquo;Same request as the search — an{" "}
                            <Term>aggs block next to the query</Term>. Aggregations
                            run <Term>over the matching set</Term>, so the counts
                            always <Term>agree with the results</Term>; one pass, no
                            extra round-trip.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>Why is your genre facet empty?</>}
                        a={
                            <>
                                &ldquo;The field lives in a{" "}
                                <Term>nested mapping</Term>{" "}— a plain{" "}
                                <Code>terms</Code>{" "}agg can&apos;t see the hidden
                                docs. It needs a <Term>nested agg</Term>{" "}with the{" "}
                                <Code>path</Code>, with the{" "}
                                <Code>terms</Code>{" "}as its{" "}
                                <Term>sub-aggregation</Term>.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
