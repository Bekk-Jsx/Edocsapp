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
    // --- part 1 (Autocomplete) ---
    "autocomplete-why-match-isn-t-enough": ["tip", "note"],
    "search-as-you-type": ["trap", "tip", "note"],

    // --- part 2 (Did You Mean) ---
    "suggesters-did-you-mean": ["trap", "tip", "note"],

    // --- part 3 (Synonyms) ---
    "synonyms-the-problem": ["tip", "note"],
    "the-two-syntaxes": ["note"],

    // --- part 4 (Wiring It Up) ---
    "where-the-list-lives-settings": ["note"],
    "connection-1-filter-into-an-analyzer": ["tip", "note"],
    "connection-2-field-points-at-the-analyzer": ["note"],
    "why-search-analyzer": ["tip", "note"],
};

// Top-level divider between the four parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper the introduction, documents-indices, mappings-analysis,
// queries-structure, search-queries and aggregations content files each define
// for their own part dividers.
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
// 1. A section opens with prose: the reader knows which failure it is about
//    before any request appears.
// 2. Every fragment is introduced by the sentence above it and read by the
//    sentence below it where it has a result. Two fragments never touch.
// 3. A comparison names both sides in plain words and ends in a paragraph
//    saying which one to write and why.
// 4. Every operation appears in both forms — the Node client call and the curl
//    that goes over the wire — client first.
//
// The three features on this page answer three different failures of a search
// box: a word that is not finished yet, a word that is finished and wrong, and a
// word that is finished, right, and not the one the document used.

// ===================================================================
// part 1 — autocomplete
// ===================================================================

const TYPING_NODE = `// the reader has typed three letters so far
await esClient.search({
    index: "movies",
    query: { match: { title: "dar" } },
});   // hits: []`;

const TYPING_CURL = `curl -X GET 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "dar" } } }'
# "hits": { "total": { "value": 0 } }   200 OK`;

const NO_SUCH_TERM = `the index holds COMPLETE words
  "The Dark Knight"  ->  ["dark", "knight"]

the query is analyzed the same way
  "dar"              ->  ["dar"]

lookup "dar"         ->  not a term  ->  0 hits

"dar" is a PREFIX of "dark", and an inverted
index has no notion of a prefix`;

const FUZZY_IS_NOT_IT = `fuzziness AUTO measures edit distance, not prefixes
  "dar" -> "dark"    1 edit    found, by luck
  "kni" -> "knight"  3 edits   never found
  "dar" -> "day"     1 edit    found, and wrong

a typo is a wrong word; a prefix is an unfinished
one — different problems, different solutions`;

const PREFIX_TERMS = `index time: one word, four terms
  "dark"  ->  d, da, dar, dark

search time: whatever has been typed so far is
already a term, so the lookup is an ordinary one

more work and more space when writing,
nothing extra when searching`;

const SAYT_MAPPING_NODE = `await esClient.indices.create({
    index: "movies_v2",
    mappings: {
        properties: {
            title: { type: "search_as_you_type" },
        },
    },
});`;

const SAYT_MAPPING_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": {
          "title": { "type": "search_as_you_type" } } } }'`;

const SAYT_VIEWS = `one value, four indexed views

  title               words      dark / knight / rise
  title._2gram        pairs      "dark knight"
  title._3gram        triples    "dark knight rises"
  title._index_prefix prefixes   d / da / dar / dark ...

you never write to them and never name the last
one — they exist for the query below`;

const SAYT_MULTIFIELD_NODE = `await esClient.indices.create({
    index: "movies_v2",
    mappings: {
        properties: {
            title: {
                type: "text",
                analyzer: "english",   // full search
                fields: {
                    suggest: {
                        type: "search_as_you_type",
                    },
                },
            },
        },
    },
});`;

const SAYT_MULTIFIELD_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": { "title": {
          "type": "text", "analyzer": "english",
          "fields": { "suggest": {
            "type": "search_as_you_type" } } } } } }'`;

const BOOL_PREFIX_NODE = `await esClient.search({
    index: "movies_v2",
    size: 5,   // a dropdown wants a handful
    query: {
        multi_match: {
            query: "dark kni",
            type: "bool_prefix",
            fields: [
                "title",
                "title._2gram",
                "title._3gram",
            ],
        },
    },
});`;

const BOOL_PREFIX_CURL = `curl 'localhost:9200/movies_v2/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "size": 5,
        "query": { "multi_match": {
          "query": "dark kni",
          "type": "bool_prefix",
          "fields": ["title", "title._2gram",
                     "title._3gram"] } } }'`;

const LAST_WORD = `"dark kni"

  dark   complete  ->  matched as a full term
  kni    unfinished->  matched as a prefix

bool_prefix treats every word as a term EXCEPT
the last one — which is exactly how typing works`;

// ===================================================================
// part 2 — did you mean
// ===================================================================

const SUGGEST_NODE = `await esClient.search({
    index: "movies",
    query: { multi_match: { query: userText, fields } },
    suggest: {
        title_suggestion: {          // your label
            text: userText,
            // the suggester, and its parameters
            phrase: { field: "title" },
        },
    },
});`;

const SUGGEST_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "suggest": { "title_suggestion": {
          "text": "drak knight",
          "phrase": { "field": "title" } } } }'`;

const SUGGEST_REPLY = `"suggest": {
  "title_suggestion": [
    { "text": "drak knight", "offset": 0, "length": 11,
      "options": [
        { "text": "dark knight", "score": 0.0031 },
        { "text": "drag knight", "score": 0.0009 }
      ] }
  ]
}`;

const TERM_VS_PHRASE = `term      corrects each word on its own
          "drak" -> dark? drag? drab?  no way to choose

phrase    weighs the words together
          "drak knight" -> "dark knight"
          because "knight" follows, dark wins

a search bar sends sentences, so: phrase`;

const MISSING_FIELD_REPLY = `{
  "error": {
    "type": "illegal_argument_exception",
    "reason": "no mapping found for field [title.trigram]"
  },
  "status": 400
}`;

const SHINGLE_NODE = `await esClient.indices.create({
    index: "movies_v2",
    settings: {
        analysis: {
            filter: {
                shingle_2_3: {
                    type: "shingle",
                    min_shingle_size: 2,
                    max_shingle_size: 3,
                },
            },
            analyzer: {
                trigram: {
                    tokenizer: "standard",
                    filter: ["lowercase", "shingle_2_3"],
                },
            },
        },
    },
    mappings: {
        properties: {
            title: {
                type: "text",
                analyzer: "english",
                fields: {
                    trigram: {
                        type: "text",
                        analyzer: "trigram",
                    },
                },
            },
        },
    },
});`;

const SHINGLE_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "settings": { "analysis": {
    "filter": { "shingle_2_3": { "type": "shingle",
      "min_shingle_size": 2, "max_shingle_size": 3 } },
    "analyzer": { "trigram": { "tokenizer": "standard",
      "filter": ["lowercase", "shingle_2_3"] } } } },
  "mappings": { "properties": { "title": {
    "type": "text", "analyzer": "english",
    "fields": { "trigram": {
      "type": "text", "analyzer": "trigram" } } } } }
}'`;

const SHINGLES = `"The Dark Knight Rises", shingled 2-3

  "dark knight"          pair
  "knight rises"         pair
  "dark knight rises"    triple

word pairs indexed AS TERMS — which is how the
phrase suggester knows what usually follows what`;

const SUGGEST_WIRING_NODE = `const res = await esClient.search({
    index: "movies",
    query,
    suggest: {
        title_suggestion: {
            text: userText,
            phrase: { field: "title.trigram" },
        },
    },
});

const didYouMean =
    res.hits.hits.length === 0
        ? res.suggest?.title_suggestion[0].options[0]?.text
        : undefined;`;

const SUGGEST_WIRING_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "multi_match": {
          "query": "drak knight",
          "fields": ["title^3", "overview"] } },
        "suggest": { "title_suggestion": {
          "text": "drak knight",
          "phrase": { "field": "title.trigram" } } } }'`;

// ===================================================================
// part 3 — synonyms
// ===================================================================

const SYNONYM_MISS_NODE = `// the catalogue calls it a film; the reader typed movie
await esClient.search({
    index: "movies",
    query: { match: { title: "movie" } },
});   // hits: []`;

const SYNONYM_MISS_CURL = `curl 'localhost:9200/movies/_search' \\
  -H 'Content-Type: application/json' \\
  -d '{ "query": { "match": { "title": "movie" } } }'
# "hits": { "total": { "value": 0 } }   200 OK`;

const WORD_GAP = `document  "The Perfect Film"  ->  ["perfect", "film"]
query     "movie"             ->  ["movi"]

both words are correct, complete and well spelled,
and the two sides share no term at all

no edit distance connects them, no prefix helps —
only a human knows the words mean the same thing`;

const SYNTAXES = `equivalence — every form stands for all of them
  "movie, film, picture"
  a query for any one matches all three

one-way (explicit mapping) — left becomes right
  "sci-fi => science fiction"
  "sci-fi" is rewritten; "science fiction" is not
  rewritten back

that is the entire syntax`;

const SHELVES = `PUT /movies_v2
  mappings            the fields, and their types
  settings            how the index WORKS
    refresh_interval  (from Documents & Indices)
    analysis
      filter          pieces  <- the list goes here
      analyzer        machines built from pieces`;

const FILTER_DEF_NODE = `const movieSynonyms = {
    type: "synonym_graph",   // 2. which built-in filter
    synonyms: [              // 3. the content
        "movie, film, picture",
        "sci-fi => science fiction",
    ],
};

await esClient.indices.create({
    index: "movies_v2",
    settings: {
        analysis: {
            // 1. movie_synonyms — the label you invent
            filter: { movie_synonyms: movieSynonyms },
        },
    },
});`;

const FILTER_DEF_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "settings": { "analysis": { "filter": {
          "movie_synonyms": {
            "type": "synonym_graph",
            "synonyms": [
              "movie, film, picture",
              "sci-fi => science fiction" ] } } } } }'`;

const GET_SETTINGS_NODE = `await esClient.indices.getSettings({ index: "movies_v2" });`;

const GET_SETTINGS_CURL = `curl 'localhost:9200/movies_v2/_settings?pretty'
# "analysis": { "filter": { "movie_synonyms": {
#   "type": "synonym_graph", "synonyms": [ ... ] } } }`;

const ANALYZER_DEF_NODE = `analyzer: {
    title_search: {
        tokenizer: "standard",
        // the connection: the filter's own name
        filter: ["lowercase", "movie_synonyms"],
    },
},`;

const ANALYZER_DEF_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "settings": { "analysis": {
    "filter": { "movie_synonyms": {
      "type": "synonym_graph",
      "synonyms": ["movie, film, picture"] } },
    "analyzer": { "title_search": {
      "tokenizer": "standard",
      "filter": ["lowercase", "movie_synonyms"] } }
  } } }'`;

const CHAIN_STEPS = `"Sci-Fi Movie"
      |
      v  tokenizer: standard
[Sci-Fi] [Movie]
      |
      v  filter 1: lowercase
[sci-fi] [movie]
      |
      v  filter 2: movie_synonyms
[science fiction]            sci-fi => rewritten
[movie] [film] [picture]     movie   -> expanded`;

const ANALYZE_NODE = `await esClient.indices.analyze({
    index: "movies_v2",
    analyzer: "title_search",
    text: "movie",
});   // ["movie", "film", "picture"]`;

const ANALYZE_CURL = `curl -X POST 'localhost:9200/movies_v2/_analyze' \\
  -H 'Content-Type: application/json' \\
  -d '{ "analyzer": "title_search", "text": "movie" }'
# tokens: movie, film, picture`;

const FIELD_POINTERS_NODE = `mappings: {
    properties: {
        title: {
            type: "text",
            analyzer: "english",         // documents
            search_analyzer: "title_search",   // queries
        },
    },
},`;

const FIELD_POINTERS_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": { "title": {
          "type": "text",
          "analyzer": "english",
          "search_analyzer": "title_search" } } } }'`;

const TWO_MOMENTS = `indexing a document   value  ->  analyzer
searching             query  ->  search_analyzer

with no search_analyzer, one machine serves both;
setting it is what splits them`;

const FULL_CHAIN = `synonym lines
   |  synonyms: [ ... ]
filter        movie_synonyms
   |  filter: ["lowercase", "movie_synonyms"]
analyzer      title_search
   |  search_analyzer: "title_search"
field         title`;

const INDEX_SIDE_NODE = `mappings: {
    properties: {
        title: { type: "text", analyzer: "title_search" },
    },
},   // one pointer: documents AND queries expand`;

const INDEX_SIDE_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": { "title": {
          "type": "text",
          "analyzer": "title_search" } } } }'`;

const SEARCH_SIDE_NODE = `mappings: {
    properties: {
        title: {
            type: "text",
            analyzer: "english",
            search_analyzer: "title_search",
        },
    },
},   // documents stored plain; only the query expands`;

const SEARCH_SIDE_CURL = `curl -X PUT 'localhost:9200/movies_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "mappings": { "properties": { "title": {
          "type": "text",
          "analyzer": "english",
          "search_analyzer": "title_search" } } } }'`;

const WHERE_THE_LIST_SITS = `index-time    document "film" stored as
              [film] [movie] [picture]
              the list is baked into every document

search-time   document "film" stored as [film]
              query "movie" expands to
              movie OR film OR picture

add one line to the list
  index-time   every stored document is stale
  search-time  the next query already uses it`;

export function SearchUxDocs() {
    return (
        <>
            {/* ---------- part 1 — the word that is not finished ---------- */}
            <PartHeading kicker="part 1">Autocomplete</PartHeading>
            <div>
                <DocSection title="autocomplete: why match isn't enough">
                    <p>
                        Autocomplete is matching words that are not finished yet. The
                        reader types <Code>dar</Code>{" "}and expects to see{" "}
                        <em>The Dark Knight</em>{" "}before the word exists — which is a
                        different question from anything the query DSL has answered so
                        far, and it fails in a way worth understanding before reaching
                        for the feature that fixes it.
                    </p>
                    <p>
                        A plain <Code>match</Code>{" "}on three typed letters returns
                        nothing.
                    </p>
                    <CodeBlock code={TYPING_NODE} lang="ts" />
                    <p>The same request over the wire, with the answer it gets:</p>
                    <CodeBlock code={TYPING_CURL} lang="bash" />
                    <p>The mechanics of that empty result are the whole point:</p>
                    <CodeBlock code={NO_SUCH_TERM} lang="text" />
                    <p>
                        Both sides were analyzed correctly and both did their job. The
                        index contains complete words because complete words are what
                        was indexed, and <Code>dar</Code>{" "}is not one of them.
                    </p>
                    <p>
                        Fuzziness looks like the fix and is not — it measures edits
                        between two complete words, which is a different relationship
                        from one word being the start of another.
                    </p>
                    <CodeBlock code={FUZZY_IS_NOT_IT} lang="text" />
                    <p>
                        It gets <Code>dar</Code>{" "}by accident and never gets{" "}
                        <Code>kni</Code>, because the number of missing letters grows
                        with every word the reader has not finished typing.
                    </p>
                    <p>
                        So the fix belongs on the index side: store the prefixes as
                        terms, and there is nothing left to solve at query time.
                    </p>
                    <CodeBlock code={PREFIX_TERMS} lang="text" />
                    <p>
                        Same inverted index, same lookup, same speed. What changes is
                        that writing costs more time and more space — the Introduction&apos;s
                        trade again, paid once at index time so every keystroke is
                        instant.
                    </p>

                    <Callout severity="tip" label="tip · solve it in the index, not the query">
                        <p>
                            Every query-side attempt at autocomplete —{" "}
                            <Code>wildcard</Code>, <Code>query_string</Code> with a
                            trailing star, a bigger <Code>fuzziness</Code>{" "}— is slower
                            and less correct than making the prefix a term. If a search
                            feature feels like it needs a clever query, check whether the
                            mapping can make it an ordinary one.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · three different failures">
                        <p>
                            This page fixes three of them in turn: a word that is not
                            finished (autocomplete), a word that is finished and
                            misspelled (suggesters), and a word that is finished and
                            correct but not the one the document used (synonyms). They
                            look similar from the outside — an empty result page — and
                            not one of them is solved by the same mechanism as another.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="search_as_you_type">
                    <p>
                        <Code>search_as_you_type</Code>{" "}is the field type that does the
                        prefix work described above. Declaring it changes what is written
                        into the index, and it comes with a query type built to read what
                        it wrote — the two are designed as a pair.
                    </p>
                    <p>The mapping side is one line:</p>
                    <CodeBlock code={SAYT_MAPPING_NODE} lang="ts" />
                    <p>The same index creation over the wire:</p>
                    <CodeBlock code={SAYT_MAPPING_CURL} lang="bash" />
                    <p>
                        Behind that line the field is indexed several ways at once — the
                        multi-field pattern from Mappings &amp; Analysis, generated for
                        you rather than declared:
                    </p>
                    <CodeBlock code={SAYT_VIEWS} lang="text" />
                    <p>
                        The <Code>_2gram</Code> and <Code>_3gram</Code>{" "}sub-fields hold
                        pairs and triples of adjacent words, so a phrase that spans two
                        words is a single term rather than two lookups.
                    </p>
                    <p>
                        When a field has to serve both jobs — full search and
                        autocomplete — the same multi-field pattern is written by hand,
                        with the prefix machinery on a sub-field.
                    </p>
                    <CodeBlock code={SAYT_MULTIFIELD_NODE} lang="ts" />
                    <p>Over the wire, one field with one sub-field:</p>
                    <CodeBlock code={SAYT_MULTIFIELD_CURL} lang="bash" />
                    <p>
                        Searches then run on <Code>title</Code>{" "}as before, and the
                        dropdown queries <Code>title.suggest</Code>{" "}together with{" "}
                        <Code>title.suggest._2gram</Code> and{" "}
                        <Code>title.suggest._3gram</Code>.
                    </p>
                    <p>
                        The query that reads those views is a <Code>multi_match</Code>{" "}
                        with a type of its own.
                    </p>
                    <CodeBlock code={BOOL_PREFIX_NODE} lang="ts" />
                    <p>The same request as curl:</p>
                    <CodeBlock code={BOOL_PREFIX_CURL} lang="bash" />
                    <p>
                        <Code>bool_prefix</Code>{" "}is what makes it feel like typing:
                    </p>
                    <CodeBlock code={LAST_WORD} lang="text" />
                    <p>
                        Every word is matched as a full term except the last, which is
                        matched as a prefix — because the last word is the one still being
                        typed. <Code>size: 5</Code>{" "}is part of the feature rather than a
                        detail: a dropdown wants a handful of rows, not a page of results.
                    </p>
                    <p>
                        <Term>The dropdown and the search are two different
                        queries.</Term>{" "}Keystrokes hit the{" "}
                        <Code>search_as_you_type</Code>{" "}fields with{" "}
                        <Code>bool_prefix</Code>; pressing enter runs the existing{" "}
                        <Code>multi_match</Code>{" "}from Search Queries, with its boosts,
                        filters and fuzziness. Two requests, two jobs, and neither one
                        compromises for the other.
                    </p>

                    <Callout severity="trap" label="trap · the sub-fields are not automatic">
                        <p>
                            With <Code>type: &quot;text&quot;</Code>{" "}nothing extra is
                            created. <Code>title._2gram</Code> and{" "}
                            <Code>title._3gram</Code>{" "}exist only because the type is{" "}
                            <Code>search_as_you_type</Code>{" "}— the type <em>is</em>{" "}the
                            instruction to build them. Point a{" "}
                            <Code>bool_prefix</Code>{" "}query at a plain text mapping and it
                            fails on a field that was never mapped, exactly like the{" "}
                            <Code>title.trigram</Code>{" "}error in the next section.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · debounce, then take the last answer">
                        <p>
                            A keystroke is not a search: fire on a short debounce and
                            ignore replies that arrive after a newer request went out.
                            Elasticsearch answers these in single-digit milliseconds, so
                            the flicker a dropdown suffers from is almost always
                            out-of-order responses rather than slow ones.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · a mapping change, with the usual price">
                        <p>
                            Adding <Code>search_as_you_type</Code>{" "}to a live field is a
                            type change, so it is the procedure from Mappings &amp;
                            Analysis: new index with the new mapping, rebuild it from
                            CouchDB, swap the alias. The feature is one line; shipping it
                            is a rebuild.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the word that is finished and wrong ---------- */}
            <PartHeading kicker="part 2">Did You Mean</PartHeading>
            <div>
                <DocSection title="suggesters: did you mean">
                    <p>
                        A suggester answers the opposite failure from autocomplete: the
                        word is finished, and wrong. Someone types{" "}
                        <Code>drak knight</Code>, presses enter, and gets nothing — and
                        instead of a dead end the interface can offer &ldquo;did you mean
                        dark knight?&rdquo;. What makes that possible is that a suggester
                        compares the input against the terms that actually exist in the
                        index and returns the closest ones.
                    </p>
                    <p>
                        It travels in the <Code>suggest</Code>{" "}slot, beside{" "}
                        <Code>query</Code>, under a label you choose.
                    </p>
                    <CodeBlock code={SUGGEST_NODE} lang="ts" />
                    <p>The suggest slot on its own over the wire:</p>
                    <CodeBlock code={SUGGEST_CURL} lang="bash" />
                    <p>The reply comes back keyed by that label:</p>
                    <CodeBlock code={SUGGEST_REPLY} lang="json" />
                    <p>
                        <Code>options</Code>{" "}is ranked best-first, so{" "}
                        <Code>options[0].text</Code>{" "}is the did-you-mean string to show.
                        An empty <Code>options</Code>{" "}array means the index has nothing
                        close to offer — show the plain no-results page rather than
                        inventing something.
                    </p>
                    <p>
                        Which suggester matters, because the two common ones judge the
                        input differently.
                    </p>
                    <CodeBlock code={TERM_VS_PHRASE} lang="text" />
                    <p>
                        <Code>term</Code>{" "}corrects each word in isolation and has no
                        basis for choosing between candidates;{" "}
                        <Code>phrase</Code>{" "}weighs the words together and knows{" "}
                        <Code>drak</Code> should be <Code>dark</Code>{" "}
                        <em>because</em> <Code>knight</Code>{" "}follows it. A search bar
                        receives sentences, so <Code>phrase</Code>{" "}is the one to use.
                    </p>
                    <p>
                        Judging words in context needs a field that indexed them in
                        context, which is what a shingle sub-field is for — and asking for
                        one the mapping never created fails outright.
                    </p>
                    <CodeBlock code={MISSING_FIELD_REPLY} lang="json" />
                    <p>
                        There are two ways out, and they cost very different amounts. The
                        quick one is the <Code>phrase</Code>{" "}suggester over the existing{" "}
                        <Code>title</Code>{" "}field, which is the first snippet in this
                        section: it works on today&apos;s index with no rebuild, and its
                        quality is limited because <Code>english</Code>{" "}stems are what it
                        has to compare against — a suggestion can come back reading{" "}
                        <Code>movi</Code>.
                    </p>
                    <p>
                        The proper one adds the sub-field: a shingle filter and an
                        analyzer that uses it in <Code>settings</Code>, and a{" "}
                        <Code>title.trigram</Code>{" "}sub-field in the mapping that points
                        at it.
                    </p>
                    <CodeBlock code={SHINGLE_NODE} lang="ts" />
                    <p>The same index definition over the wire:</p>
                    <CodeBlock code={SHINGLE_CURL} lang="bash" />
                    <p>Shingles are word pairs and triples, indexed as terms:</p>
                    <CodeBlock code={SHINGLES} lang="text" />
                    <p>
                        That is what gives the phrase suggester its sense of what usually
                        follows what. Being a mapping change, it ships the usual way: new
                        index, rebuild, alias swap.
                    </p>
                    <p>
                        The last piece is when to ask. The suggestion is only interesting
                        when the search failed, so the wiring is conditional on the hit
                        count.
                    </p>
                    <CodeBlock code={SUGGEST_WIRING_NODE} lang="ts" />
                    <p>
                        Sending both slots in one request is the cheaper shape — they
                        coexist exactly as <Code>aggs</Code>{" "}does:
                    </p>
                    <CodeBlock code={SUGGEST_WIRING_CURL} lang="bash" />
                    <p>
                        One round-trip returns the results and the correction, and the
                        frontend decides which to render. A second request only when the
                        first came back empty is equally correct and saves the suggester
                        the work on every successful search.
                    </p>

                    <Callout severity="trap" label="trap · the field has to exist first">
                        <p>
                            <Code>phrase: {`{ field: "title.trigram" }`}</Code>{" "}is copied
                            from every tutorial, and on an index whose mapping never
                            declared that sub-field it is a <Code>400</Code>:{" "}
                            <Code>no mapping found for field [title.trigram]</Code>.
                            Sub-fields exist only because a mapping created them — there is
                            no naming convention that conjures one.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · suggest only on a failure">
                        <p>
                            A did-you-mean under a full page of good results is noise, and
                            a suggester that runs on every keystroke is wasted work. Ask
                            when the result set is empty or nearly so — that is the only
                            moment the answer changes what the reader sees.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · a suggester is not fuzziness">
                        <p>
                            <Code>fuzziness</Code>{" "}absorbs a typo silently inside the
                            query: the reader never learns they mistyped, and the results
                            may be subtly wrong. A suggester returns the corrected text
                            itself, so the interface can ask. Search Queries uses the
                            first; this page adds the second, and a real search bar carries
                            both.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — the word that is right, but not theirs ---------- */}
            <PartHeading kicker="part 3">Synonyms</PartHeading>
            <div>
                <DocSection title="synonyms: the problem">
                    <p>
                        The third gap has nothing wrong with it at all. The reader&apos;s
                        word is complete and correctly spelled — it is simply not the word
                        the document used. Nothing seen so far can bridge that, and the
                        reason is worth being precise about.
                    </p>
                    <p>
                        The catalogue says <em>film</em>{" "}and the reader types{" "}
                        <em>movie</em>.
                    </p>
                    <CodeBlock code={SYNONYM_MISS_NODE} lang="ts" />
                    <p>Over the wire, the familiar empty answer:</p>
                    <CodeBlock code={SYNONYM_MISS_CURL} lang="bash" />
                    <p>Analyzed, the two sides simply never meet:</p>
                    <CodeBlock code={WORD_GAP} lang="text" />
                    <p>
                        Fuzziness cannot help, because this is not an edit-distance typo —{" "}
                        <Code>movie</Code> and <Code>film</Code>{" "}share almost no letters.
                        Prefixes cannot help either. The equality lives in human
                        vocabulary and nowhere in the data, so the index has to be{" "}
                        <em>told</em>: a list of words that count as each other,
                        mechanically a token filter whose contents are lines you write.
                    </p>

                    <Callout severity="note" label="note · the list is yours to write">
                        <p>
                            Elasticsearch ships no dictionary of English synonyms. Every
                            line is written by hand, or loaded from a file you maintain,
                            and it exists only for your domain — a movie catalogue and a
                            hardware shop share none of it. It is a maintained asset, not
                            configuration you set once.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · grow the list from search logs">
                        <p>
                            The best source of the next line is the log of queries that
                            returned zero hits. Each one is a reader whose word the
                            catalogue does not know, and reading that list weekly turns
                            synonyms from guesswork into a short, evidenced backlog.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the two syntaxes">
                    <p>
                        Synonym lines come in two forms, and the difference is direction.
                        Both are plain strings in a list, and between them they cover
                        everything the feature can express.
                    </p>
                    <p>The two shapes, with what each does to a query:</p>
                    <CodeBlock code={SYNTAXES} lang="text" />
                    <p>
                        A comma-separated line is <em>equivalence</em>: every form stands
                        for all the others, in both directions. An arrow is{" "}
                        <em>one-way</em>: the left-hand form is rewritten to the
                        right-hand one and never the reverse, which is what you want when
                        one spelling is canonical and the others are abbreviations of it.
                    </p>

                    <Callout severity="note" label="note · one-way keeps the canonical form clean">
                        <p>
                            <Code>&quot;sci-fi =&gt; science fiction&quot;</Code>{" "}means a
                            search for the genre&apos;s real name stays exactly that
                            search, while the abbreviation joins it. Written as an
                            equivalence instead, every search for{" "}
                            <em>science fiction</em>{" "}would also match documents that only
                            say <em>sci-fi</em>{" "}— usually fine, occasionally not, and the
                            arrow is how you say which you meant.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — from a list of words to a working field ---------- */}
            <PartHeading kicker="part 4">Wiring It Up</PartHeading>
            <div>
                <DocSection title="where the list lives: settings">
                    <p>
                        A synonym list is not part of the mapping. An index is two halves
                        — the fields it has, and how it works — and every piece of
                        text-processing machinery belongs to the second one. Knowing that
                        layout is what makes the next two sections obvious.
                    </p>
                    <p>Where each half sits in a create request:</p>
                    <CodeBlock code={SHELVES} lang="text" />
                    <p>
                        <Code>settings.analysis</Code>{" "}has two shelves:{" "}
                        <Code>filter</Code>{" "}holds pieces, and{" "}
                        <Code>analyzer</Code>{" "}holds machines assembled from those
                        pieces. A synonym list is a piece, so it is defined as a filter.
                    </p>
                    <CodeBlock code={FILTER_DEF_NODE} lang="ts" />
                    <p>The same definition over the wire:</p>
                    <CodeBlock code={FILTER_DEF_CURL} lang="bash" />
                    <p>
                        Three parts and no more: <Code>movie_synonyms</Code>{" "}is a label
                        you invent and will refer to later,{" "}
                        <Code>type</Code>{" "}names which built-in filter to instantiate, and{" "}
                        <Code>synonyms</Code>{" "}is the content — the lines from the previous
                        section.
                    </p>
                    <p>
                        The list is now part of the index&apos;s own definition, and the
                        cluster will read it back to you.
                    </p>
                    <CodeBlock code={GET_SETTINGS_NODE} lang="ts" />
                    <p>Over the wire, with the shape of the answer:</p>
                    <CodeBlock code={GET_SETTINGS_CURL} lang="bash" />
                    <p>
                        Being stored is not the same as being used, though. At this point
                        the filter is a tool sitting on a shelf: no analyzer mentions it,
                        so no text passes through it and nothing about the search has
                        changed.
                    </p>

                    <Callout severity="note" label="note · synonym_graph, not synonym">
                        <p>
                            <Code>synonym_graph</Code>{" "}is the one to use in a search
                            analyzer: it handles multi-word entries properly, which the
                            older <Code>synonym</Code>{" "}filter mishandles when one side of
                            a line is a phrase — and{" "}
                            <Code>&quot;sci-fi =&gt; science fiction&quot;</Code>{" "}is
                            exactly that case.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="connection 1: filter into an analyzer">
                    <p>
                        The first of two connections puts the filter to work: an analyzer
                        that names it in its chain. This is where the list stops being
                        data and starts being behaviour.
                    </p>
                    <p>
                        The analyzer is defined on the other shelf, and one string is the
                        entire link.
                    </p>
                    <CodeBlock code={ANALYZER_DEF_NODE} lang="ts" />
                    <p>Both shelves in one request, as curl:</p>
                    <CodeBlock code={ANALYZER_DEF_CURL} lang="bash" />
                    <p>What that machine does to a value, step by step:</p>
                    <CodeBlock code={CHAIN_STEPS} lang="text" />
                    <p>
                        <Term>The filter array is a pipeline, in order.</Term>{" "}Each filter
                        receives the tokens the previous one produced, which is why{" "}
                        <Code>lowercase</Code>{" "}comes first: the synonym list is written
                        in lowercase, so <Code>Movie</Code>{" "}has to be lowercased before
                        it can match a line. Reverse the two and the capitalised word
                        sails straight through.
                    </p>
                    <p>
                        The connection itself is nothing more than the string{" "}
                        <Code>movie_synonyms</Code>{" "}in that array — Elasticsearch looks
                        the name up on the filter shelf and plugs the definition in.
                    </p>
                    <p>
                        An analyzer can be tried on its own, before any field points at
                        it, which is the fastest way to confirm the list is doing what you
                        think.
                    </p>
                    <CodeBlock code={ANALYZE_NODE} lang="ts" />
                    <p>The same check over the wire:</p>
                    <CodeBlock code={ANALYZE_CURL} lang="bash" />
                    <p>
                        Three tokens out of one word in means the filter is wired in
                        correctly. Nothing is searching through it yet — that is the
                        second connection.
                    </p>

                    <Callout severity="tip" label="tip · _analyze is the whole debugging story">
                        <p>
                            Every synonym problem is visible here: a line that never fires,
                            a filter placed before <Code>lowercase</Code>, a stemmer that
                            mangled the word before the synonym filter saw it. Run the
                            analyzer on the exact string the reader typed and compare the
                            tokens with what the field holds.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · order is part of the meaning">
                        <p>
                            <Code>[&quot;lowercase&quot;, &quot;movie_synonyms&quot;]</Code>{" "}
                            and{" "}
                            <Code>[&quot;movie_synonyms&quot;, &quot;lowercase&quot;]</Code>{" "}
                            are different analyzers, not two spellings of one. The same
                            applies to stemming: put a stemmer before the synonyms and the
                            list has to be written in stems to match anything.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="connection 2: field points at the analyzer">
                    <p>
                        The second connection is one you have written many times without
                        thinking of it as a connection. <Code>analyzer: &quot;english&quot;</Code>{" "}
                        on a field has always meant &ldquo;every value here passes through
                        the machine called english on its way into the index&rdquo;.
                        Synonyms need that pointer and one more.
                    </p>
                    <p>
                        The field carries two, because analysis happens at two different
                        moments.
                    </p>
                    <CodeBlock code={FIELD_POINTERS_NODE} lang="ts" />
                    <p>The mapping over the wire:</p>
                    <CodeBlock code={FIELD_POINTERS_CURL} lang="bash" />
                    <p>Which pointer applies when:</p>
                    <CodeBlock code={TWO_MOMENTS} lang="text" />
                    <p>
                        Documents are analyzed as they are written and queries are
                        analyzed as they arrive. With only <Code>analyzer</Code>{" "}set, one
                        machine serves both; adding <Code>search_analyzer</Code>{" "}is what
                        splits them, and it is the reason the synonym expansion can apply
                        to queries alone.
                    </p>
                    <p>With both connections made, the chain is complete:</p>
                    <CodeBlock code={FULL_CHAIN} lang="text" />
                    <p>
                        Four links, each one a name referring to the level above it —
                        which is also the order to debug in when a synonym does not fire.
                    </p>

                    <Callout severity="note" label="note · the pointer was always there">
                        <p>
                            Nothing new was introduced for synonyms: a field naming an
                            analyzer is the same mechanism as{" "}
                            <Code>analyzer: &quot;english&quot;</Code> or the{" "}
                            <Code>movie_title</Code>{" "}analyzer in Mappings &amp; Analysis.
                            The only addition is a second slot for the query side of the
                            same idea.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="why search_analyzer">
                    <p>
                        A synonym filter works in either slot, and both find the same
                        documents — so the choice looks arbitrary until the list changes.
                        It changes constantly, and that is what settles the question.
                    </p>
                    <p>
                        <Term>Synonyms in the index analyzer:</Term>{" "}one pointer, so
                        every document is expanded as it is written.
                    </p>
                    <CodeBlock code={INDEX_SIDE_NODE} lang="ts" />
                    <p>The mapping that produces, over the wire:</p>
                    <CodeBlock code={INDEX_SIDE_CURL} lang="bash" />
                    <p>
                        <Term>Synonyms in the search analyzer — what we built:</Term>{" "}
                        documents are stored plainly and the query is what expands.
                    </p>
                    <CodeBlock code={SEARCH_SIDE_NODE} lang="ts" />
                    <p>And the same mapping as curl:</p>
                    <CodeBlock code={SEARCH_SIDE_CURL} lang="bash" />
                    <p>Where the list physically ends up is the whole difference:</p>
                    <CodeBlock code={WHERE_THE_LIST_SITS} lang="text" />
                    <p>
                        <Term>The search analyzer is the one to choose.</Term>{" "}Both
                        arrangements return the same movies today. On the day a line is
                        added — and lines are always added — the index-time version has
                        baked the old list into every stored document, so correcting it
                        means reindexing all of them; the search-time version applies to
                        the very next query. The cost of that flexibility is three term
                        lookups instead of one per synonym group, which for an evolving
                        list is not a close decision.
                    </p>
                    <p>
                        One honest qualification: the list lives in the index settings, so
                        editing it is still a settings update rather than a code change —
                        a brief close and reopen of the index, or a file-based{" "}
                        <Code>updateable</Code>{" "}filter reloaded through{" "}
                        <Code>_reload_search_analyzers</Code>. That is minutes of
                        maintenance, against rebuilding millions of documents.
                    </p>

                    <Callout severity="tip" label="tip · index-time is for what never changes">
                        <p>
                            Index-time expansion is not wrong, it is just for stable
                            vocabularies — unit abbreviations, country codes, a
                            fixed-forever taxonomy — where the reindex is a one-off and the
                            per-query saving is real. A product synonym list is the
                            opposite of stable.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · what the reader never sees">
                        <p>
                            Expansion happens on terms, not on text.{" "}
                            <Code>_source</Code>{" "}is untouched either way, so a document
                            that says <em>film</em>{" "}still displays as{" "}
                            <em>film</em>{" "}however many synonyms matched it — the list
                            changes what is found, never what is shown.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside all four parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            How does the search bar show results while I&apos;m still
                            typing?
                        </>
                    }
                    a={
                        <>
                            &ldquo;The field is indexed as{" "}
                            <Term>search_as_you_type</Term> —{" "}
                            <Term>prefixes become terms</Term>{" "}at index time, and a{" "}
                            <Term>bool_prefix</Term> <Code>multi_match</Code>{" "}treats the
                            last word as a prefix. Prefix matching is solved{" "}
                            <Term>in the index, not the query</Term>.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                Why put synonyms in the search analyzer instead of the
                                index analyzer?
                            </>
                        }
                        a={
                            <>
                                &ldquo;<Term>Search-time synonyms</Term>{" "}expand only the
                                query, so the list stays{" "}
                                <Term>editable without a reindex</Term>.{" "}
                                <Term>Index-time</Term>{" "}bakes the list into every stored
                                document — frozen the moment it ships.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>What&apos;s the difference between fuzziness and a suggester?</>}
                        a={
                            <>
                                &ldquo;<Term>Fuzziness</Term>{" "}silently tolerates typos
                                inside a query; a <Term>suggester</Term>{" "}returns the
                                correction itself so the UI can ask{" "}
                                <Term>did you mean</Term>. One fixes the match, the other
                                fixes the user&apos;s text.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
