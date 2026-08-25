import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is one
// severity. No section here is, so every callout below is inline only.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The Two Halves) ---
    "the-two-halves-of-an-index": ["tip", "note"],

    // --- part 2 (The Flat Knobs) ---
    "flat-knob-number-of-shards": ["trap", "tip", "note"],
    "flat-knob-number-of-replicas": ["trap", "tip", "note"],
    "flat-knobs-refresh-interval-and-max-result-window": ["tip", "note"],

    // --- part 3 (What Can Change) ---
    "static-vs-dynamic": ["trap", "note"],
    "the-close-open-exception": ["danger", "trap", "note"],

    // --- part 4 (The Analysis Box) ---
    "the-analysis-box-the-shelf-system": ["tip", "note"],
    "shelf-char-filter": ["note"],
    "shelf-tokenizer": ["tip", "note"],
    "shelf-filter": ["trap", "tip", "note"],
    "shelf-analyzer": ["tip", "note"],

    // --- part 5 (In Practice) ---
    "reading-changing-in-practice": ["tip", "note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper the introduction, documents-indices, mappings-analysis,
// search-queries and queries-structure content files each define for their own
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
// 1. A section opens with prose: the reader knows what it is about before any
//    fragment appears.
// 2. Every fragment is introduced by the sentence above it, and read by the
//    sentence below it where it has a result. Two fragments never touch.
// 3. A comparison names both sides in plain words and ends in a paragraph
//    saying which one to write and why.
// 4. Every OPERATION appears in both forms — the Node client call and the curl
//    that goes over the wire — client first. Skeletons and trees are structure
//    rather than requests, so they stand alone; the intro says so once.
//
// THIS PAGE'S OWN RULE: names are generic — `index_name`, `my_filter`,
// `my_analyzer`, `my_tokenizer`. The project's real definitions appear only
// where the subject is what this project actually defines (the filter shelf).
// What a setting MEANS for the search this project runs is the business of
// Documents & Indices, Search UX and Production Essentials; what the settings
// tree LOOKS LIKE is the business of this page.

// ===================================================================
// part 1 — the two halves
// ===================================================================

const TWO_HALVES = `PUT /index_name
{
  "settings": { },   // how the index WORKS
  "mappings": { }    // what the index CONTAINS
}`;

const WHERE_TEST = `describes a FIELD           ->  mappings
    its type, whether it is indexed,
    which analyzer it uses

describes the MACHINERY     ->  settings
    shard count, replica count, refresh cadence,
    result ceiling, and the analyzer definitions themselves`;

const ANALYZER_SPLIT = `{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_analyzer": { }          // DEFINITION — what it is made of
      }
    }
  },
  "mappings": {
    "properties": {
      "field_name": {
        "type": "text",
        "analyzer": "my_analyzer"   // ASSIGNMENT — which field uses it
      }
    }
  }
}`;

const GET_INDEX_TS = `await esClient.indices.get({ index: "index_name" });`;

const GET_INDEX_CURL = `curl 'localhost:9200/index_name'`;

const GET_INDEX_REPLY = `{
  "index_name": {
    "aliases":  { },
    "mappings": { },                      // what you wrote
    "settings": {
      "index": {
        "number_of_shards":   "1",        // what you wrote, as a string
        "number_of_replicas": "1",
        "provided_name": "index_name",    // bookkeeping, from here down
        "creation_date": "1732041600000",
        "uuid":          "xJ2kLm9QTa-8fVnP0wYzAg",
        "version":       { "created": "8512000" }
      }
    }
  }
}`;

const SETTINGS_TREE = `index
├── number_of_shards      flat knob
├── number_of_replicas    flat knob
├── refresh_interval      flat knob
├── max_result_window     flat knob
└── analysis              the box of named definitions
    ├── char_filter   { my_char_filter: { } }
    ├── tokenizer     { my_tokenizer:   { } }
    ├── filter        { my_filter:      { } }
    └── analyzer      { my_analyzer:    { } }

two kinds of content, and nothing else:
    flat knobs         one name, one value
    the analysis box   definitions YOU name`;

// ===================================================================
// part 2 — the flat knobs
// ===================================================================

const SHARD_MODEL = `"index_name"                the logical name you query
     |
     ├── shard 0     a complete, self-contained Lucene index
     ├── shard 1     its own inverted index, its own segments
     └── shard 2     searchable entirely on its own`;

const SHARD_ROUTING = `number_of_shards: 3

hash(_id) % 3 == 0   ->   shard 0
hash(_id) % 3 == 1   ->   shard 1
hash(_id) % 3 == 2   ->   shard 2

"603692"  ->  hash  ->  % 3  ->  shard 1     every time, forever`;

const SHARDS_SET_TS = `await esClient.indices.create({
    index: "index_name",
    settings: {
        number_of_shards: 3,     // decided once, for the index's life
        number_of_replicas: 1,
    },
});`;

const SHARDS_SET_CURL = `curl -X PUT 'localhost:9200/index_name' \\
  -H 'Content-Type: application/json' \\
  -d '{ "settings": {
        "number_of_shards": 3,
        "number_of_replicas": 1 } }'`;

const SHARD_GROWTH = `1 shard,     20k documents   ->   1 shard, small
1 shard,     10M documents   ->   1 shard, large

no split, no new shard, no warning`;

const SHARD_IMMUTABLE = `written with N = 3    hash("603692") % 3 = 1   ->  stored on shard 1
read with    N = 5    hash("603692") % 5 = 4   ->  searched on shard 4

the document is on shard 1, the search goes to shard 4: not found.
every document in the index would be misplaced at once —
so Elasticsearch refuses the change rather than performing it.`;

const RESHARD_TS = `// 1 — a new index with the count you actually want
await esClient.indices.create({
    index: "index_name_v2",
    settings: { number_of_shards: 3 },
    mappings: existingMappings,
});

// 2 — copy every document across, re-routed by the new N
await esClient.reindex({
    source: { index: "index_name_v1" },
    dest:   { index: "index_name_v2" },
});

// 3 — move the alias in one atomic request
await esClient.indices.updateAliases({
    actions: [
        { remove: { index: "index_name_v1", alias: "index_name" } },
        { add:    { index: "index_name_v2", alias: "index_name" } },
    ],
});`;

const RESHARD_CURL = `# 1 — the new index
curl -X PUT 'localhost:9200/index_name_v2' \\
  -H 'Content-Type: application/json' \\
  -d '{ "settings": { "number_of_shards": 3 } }'

# 2 — copy the documents
curl -X POST 'localhost:9200/_reindex' \\
  -H 'Content-Type: application/json' \\
  -d '{ "source": { "index": "index_name_v1" },
        "dest":   { "index": "index_name_v2" } }'

# 3 — one request, so there is no instant without "index_name"
curl -X POST 'localhost:9200/_aliases' \\
  -H 'Content-Type: application/json' \\
  -d '{ "actions": [
    { "remove": { "index": "index_name_v1", "alias": "index_name" } },
    { "add":    { "index": "index_name_v2", "alias": "index_name" } }
  ] }'`;

const REPLICAS_SET_TS = `await esClient.indices.putSettings({
    index: "index_name",
    settings: { number_of_replicas: 0 },   // dynamic — immediate
});`;

const REPLICAS_SET_CURL = `curl -X PUT 'localhost:9200/index_name/_settings' \\
  -H 'Content-Type: application/json' \\
  -d '{ "index": { "number_of_replicas": 0 } }'`;

const REPLICA_TRADE = `more replicas

  +  read capacity        every copy can answer a search
  +  survives node loss   a lost node costs no data

  -  disk                 x (1 + replicas) — full copies, not diffs
  -  write cost           every write done (1 + replicas) times,
                          so indexing gets slower

replicas buy READS. they cost WRITES and disk, and they do
nothing at all for how much data fits — that is shards' job.`;

const REPLICA_FANOUT = `number_of_shards: 1, number_of_replicas: 3

  node A    [shard 0 · primary]   \\
  node B    [shard 0 · replica]    |   4 complete copies
  node C    [shard 0 · replica]    |   of the same data
  node D    [shard 0 · replica]   /

search 1  ->  node A        ONE copy answers each search, round-robin
search 2  ->  node B        primary and replicas are equal for reads
search 3  ->  node C        4 copies  ~  4x search throughput
search 4  ->  node D        the copies are identical, so it never
                            matters which one answered`;

const WRITE_PATH = `index / update / delete / bulk
        |
        v
   PRIMARY               the write is applied here first, always
        |
        ├──>  replica 1   then replicated to every copy
        ├──>  replica 2
        └──>  replica 3
        |
        v
   acknowledged          only once every copy has it`;

const STALE_WINDOW = `t0    update doc 603692        ->  primary has the new version
t1    search  ->  primary      sees the NEW document
t1    search  ->  replica 2    sees the OLD document
t2    search  ->  replica 2    sees the NEW document

two searches milliseconds apart, two different answers`;

const KNOBS_TS = `await esClient.indices.create({
    index: "index_name",
    settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        refresh_interval: "1s",      // buffer -> searchable cadence
        max_result_window: 10000,    // the from + size ceiling
    },
});`;

const KNOBS_CURL = `curl -X PUT 'localhost:9200/index_name' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "settings": {
    "index": {
      "number_of_shards":   1,
      "number_of_replicas": 1,
      "refresh_interval":   "1s",
      "max_result_window":  10000
    }
  }
}'`;

const FLATTEN_FORMS = `nested                          flattened
{ "index": {                    { "index.number_of_shards": 1,
    "number_of_shards": 1,        "index.refresh_interval": "1s" }
    "refresh_interval": "1s"
} }

and inside a create body the prefix can be dropped entirely
{ "number_of_shards": 1, "refresh_interval": "1s" }

all three accepted. GET always answers with the nested form.`;

// ===================================================================
// part 3 — what can change
// ===================================================================

const SETTING_CLASSES = `DYNAMIC — changeable on a live index, applied immediately
    number_of_replicas
    refresh_interval
    max_result_window

STATIC — fixed when the index is created
    number_of_shards
    most of analysis`;

const PUT_SETTINGS_TS = `await esClient.indices.putSettings({
    index: "index_name",
    settings: {
        number_of_replicas: 2,
        refresh_interval: "30s",
    },
});`;

const PUT_SETTINGS_CURL = `curl -X PUT 'localhost:9200/index_name/_settings' \\
  -H 'Content-Type: application/json' \\
  -d '{ "index": {
        "number_of_replicas": 2,
        "refresh_interval": "30s" } }'`;

const STATIC_ERROR = `PUT /index_name/_settings
{ "index": { "number_of_shards": 3 } }

{
  "error": {
    "type":   "illegal_argument_exception",
    "reason": "final index setting [index.number_of_shards],
               not updateable"
  },
  "status": 400
}`;

const DECISION_TREE = `is the setting dynamic?

  yes  ->  PUT /index_name/_settings                  done, seconds

  no   ->  is it a SEARCH-TIME analysis piece?
             yes  ->  _close, PUT /_settings, _open   seconds offline
             no   ->  new index + reindex + alias swap`;

const CLOSE_OPEN_TS = `// 1 — take the index offline
await esClient.indices.close({ index: "index_name" });

// 2 — write the analysis block a live index refuses
await esClient.indices.putSettings({
    index: "index_name",
    settings: {
        analysis: {
            filter: {
                my_filter: {
                    type: "synonym_graph",
                    synonyms: ["movie, film, picture"],
                },
            },
        },
    },
});

// 3 — bring it back
await esClient.indices.open({ index: "index_name" });`;

const CLOSE_OPEN_CURL = `# 1 — offline
curl -X POST 'localhost:9200/index_name/_close'

# 2 — the analysis block, now accepted
curl -X PUT 'localhost:9200/index_name/_settings' \\
  -H 'Content-Type: application/json' \\
  -d '{ "analysis": { "filter": { "my_filter": {
        "type": "synonym_graph",
        "synonyms": ["movie, film, picture"] } } } }'

# 3 — back online
curl -X POST 'localhost:9200/index_name/_open'`;

const CLOSE_BOUNDARY = `SAFE — search-time only

    a search_analyzer's filters
        they run on the query text as it arrives;
        nothing already on disk is involved

UNSAFE — index-time

    an analyzer assigned with "analyzer"
        the edit is ACCEPTED — no error, no warning
        documents already indexed keep their OLD terms
        documents indexed from now on get the NEW ones
        one index, two analyses, matches that are subtly wrong`;

const CLOSE_SCOPE = `_close is INDEX-LEVEL

    close /index_name   ->   every shard AND every replica
                             goes offline together

there is no

    close one shard          no such API
    close one replica        no such API

individual shards are never managed by hand: Elasticsearch
allocates, moves and recovers them. you set counts.`;

// ===================================================================
// part 4 — the analysis box
// ===================================================================

const SHELVES = `analysis
├── char_filter    clean the RAW TEXT    before any splitting
├── tokenizer      HOW TO SPLIT          one string -> many terms
├── filter         transform TERMS       after splitting
└── analyzer       MACHINES              assembled from the three above

the first three are pieces. the fourth is what uses them.`;

const DEFINITION_ANATOMY = `"my_thing": {              1. your label — any name you like
  "type":  "some_type",    2. which built-in kind this is
  "param": "value"         3. that type's own parameters
}

every definition, on every shelf, without exception`;

const LABEL_SCOPE = `char_filter / tokenizer / filter labels

    referenced INSIDE an analyzer definition
    ->  they never leave settings

analyzer labels

    referenced on a FIELD, in mappings
    ->  "analyzer": "my_analyzer"
        "search_analyzer": "my_analyzer"
    ->  the ONLY labels that cross between the two halves

mappings never names a filter or a char_filter directly.`;

const NAME_RESOLUTION = `"filter": ["lowercase", "my_filter"]

for each name, in order:
    1. your own shelf         ->  my_filter found here
    2. the built-in catalog   ->  lowercase found here

your definitions are checked first, so a label of yours
shadows a built-in of the same name. one array mixes both freely.`;

const THREE_FIELDS = `{
  "settings": {
    "analysis": {
      "char_filter": { "dash_strip": { } },
      "analyzer": {
        "my_analyzer": {
          "char_filter": ["dash_strip"],
          "tokenizer": "standard"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      // affected
      "title":    { "type": "text", "analyzer": "my_analyzer" },
      // NOT affected
      "overview": { "type": "text", "analyzer": "english" },
      "tagline":  { "type": "text" }
    }
  }
}`;

const APPLY_CHAIN = `dash_strip
    |   listed in
    v
my_analyzer
    |   assigned to
    v
title — and nothing else

overview uses english, tagline uses the default;
neither of them ever sees dash_strip.`;

const CHAR_FILTER_DEF = `"analysis": {
  "char_filter": {              // the shelf name — fixed spelling
    "dash_strip": {             // your label — any name
      "type": "mapping",        // built-in kind: char replacement
      "mappings": ["- => "]     // that type's own parameter
    }
  }
}`;

const CHAR_FILTER_EFFECT = `in    "Spider-Man"
out   "SpiderMan"

still ONE string. nothing has been split into terms yet.`;

const TOKENIZER_EFFECT = `in    "SpiderMan Movie"          one string
out   [SpiderMan] [Movie]        two terms

standard splits on word boundaries and drops the punctuation`;

const PATH_TOKENIZER_DEF = `"analysis": {
  "tokenizer": {
    "my_tokenizer": {
      "type": "path_hierarchy",
      "delimiter": "/"
    }
  }
}`;

const PATH_EXPANSION = `in    "/movies/action/2024"

out   [/movies]
      [/movies/action]
      [/movies/action/2024]

a filter on "/movies/action" now matches everything beneath it`;

const TOKENIZER_USAGE = `"my_analyzer": {
  "char_filter": ["dash_strip"],    array        — many cleanups
  "tokenizer":   "my_tokenizer",    SINGLE NAME  — one way to split
  "filter":      ["lowercase"]      array        — many transforms
}`;

const FILTER_EFFECT = `changed
    lowercase        [SpiderMan] [Movie]  ->  [spiderman] [movie]

multiplied
    synonym_graph    [movie]              ->  [movie, film, picture]

deleted
    stop             [the] [movie]        ->  [movie]`;

const PROJECT_FILTERS = `"analysis": {
  "filter": {
    "movie_synonyms": {                  // Search UX — recall
      "type": "synonym_graph",
      "synonyms": ["movie, film, picture"]
    },
    "shingle_2_3": {                     // Search UX — autocomplete
      "type": "shingle",
      "min_shingle_size": 2,
      "max_shingle_size": 3
    }
  }
}`;

const FILTER_BUILTINS = `defined by you, on the shelf      used by name, never defined

    movie_synonyms                   lowercase    fold case
    shingle_2_3                      porter_stem  reduce to word stems
                                     stop         drop stopwords`;

const FILTER_ORDER = `"filter": ["lowercase", "movie_synonyms"]

[SpiderMan] -> lowercase -> [spiderman]
            -> movie_synonyms -> synonyms added

"filter": ["movie_synonyms", "lowercase"]

[SpiderMan] -> movie_synonyms -> no match, the list is lowercase
            -> lowercase      -> [spiderman], synonyms already missed

the array is an execution order, not a set`;

const ANALYZER_DEF = `"analysis": {
  "analyzer": {
    "my_analyzer": {
      // optional · array · in order
      "char_filter": ["dash_strip"],
      // REQUIRED · single name
      "tokenizer":   "standard",
      // optional · array · in order
      "filter":      ["lowercase", "movie_synonyms"]
    }
  }
}`;

const PIPELINE = `"Spider-Man Movie"
    |
    v   char_filter: dash_strip
"SpiderMan Movie"                          still one string
    |
    v   tokenizer: standard
[SpiderMan] [Movie]                        now terms
    |
    v   filter: lowercase
[spiderman] [movie]
    |
    v   filter: movie_synonyms
[spiderman] [movie, film, picture]
    |
    v
into the index      when a document is indexed
or into the query   when that field is searched`;

// ===================================================================
// part 5 — in practice
// ===================================================================

const GET_SETTINGS_TS = `await esClient.indices.getSettings({ index: "index_name" });`;

const GET_SETTINGS_CURL = `curl 'localhost:9200/index_name/_settings'`;

const GET_SETTINGS_REPLY = `{
  "index_name": {
    "settings": {
      "index": {
        "number_of_shards":   "1",        // you set this
        "number_of_replicas": "1",        // you set this
        "provided_name": "index_name",    // bookkeeping
        "creation_date": "1732041600000",
        "uuid":          "xJ2kLm9QTa-8fVnP0wYzAg",
        "version":       { "created": "8512000" }
      }
    }
  }
}

no refresh_interval, no max_result_window: never set, so invisible`;

const DEFAULTS_TS = `await esClient.indices.getSettings({
    index: "index_name",
    include_defaults: true,
});`;

const DEFAULTS_CURL = `curl 'localhost:9200/index_name/_settings?include_defaults=true'`;

const DEFAULTS_REPLY = `{
  "index_name": {
    "settings": {
      "index": { "number_of_shards": "1", "number_of_replicas": "1" }
    },
    "defaults": {
      "index": {
        "refresh_interval":  "1s",
        "max_result_window": "10000",
        "analysis": { },
        "...": "every knob you never touched"
      }
    }
  }
}

"settings" — what you set.  "defaults" — everything you did not.`;

const CREATE_FULL_TS = `await esClient.indices.create({
    index: "index_name",

    // half 1 — how the index WORKS
    settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
        refresh_interval: "1s",
        max_result_window: 10000,
        analysis: {
            char_filter: {
                dash_strip: { type: "mapping", mappings: ["- => "] },
            },
            filter: {
                my_filter: {
                    type: "synonym_graph",
                    synonyms: ["movie, film, picture"],
                },
            },
            analyzer: {
                my_analyzer: {
                    char_filter: ["dash_strip"],
                    tokenizer: "standard",
                    filter: ["lowercase", "my_filter"],
                },
            },
        },
    },

    // half 2 — what the index CONTAINS
    mappings: {
        properties: {
            field_name: { type: "text", analyzer: "my_analyzer" },
            other_field: { type: "keyword" },
        },
    },
});`;

const CREATE_FULL_CURL = `curl -X PUT 'localhost:9200/index_name' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "settings": {
    "index": {
      "number_of_shards":   1,
      "number_of_replicas": 1,
      "refresh_interval":   "1s",
      "max_result_window":  10000,
      "analysis": {
        "char_filter": {
          "dash_strip": { "type": "mapping", "mappings": ["- => "] }
        },
        "filter": {
          "my_filter": {
            "type": "synonym_graph",
            "synonyms": ["movie, film, picture"]
          }
        },
        "analyzer": {
          "my_analyzer": {
            "char_filter": ["dash_strip"],
            "tokenizer": "standard",
            "filter": ["lowercase", "my_filter"]
          }
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "field_name":  { "type": "text", "analyzer": "my_analyzer" },
      "other_field": { "type": "keyword" }
    }
  }
}'`;

export function SettingsStructureDocs() {
    return (
        <>
            {/* Page lead. Frames what this page is FOR before the first divider:
                the sections below are a reference to be looked things up in, not
                a narrative, and every name in them is deliberately generic. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    This page is the anatomy of index settings. It walks the
                    settings tree from the top down — every element the block can
                    carry, how each one is filled in, where its value is used, and
                    which of them can still be changed once documents exist. It
                    answers &ldquo;where does this go?&rdquo; and &ldquo;why will
                    Elasticsearch not let me change it?&rdquo;, which are questions
                    of structure and lifecycle rather than of tuning.
                </p>
                <p>
                    The names are deliberately generic: <Code>index_name</Code>,{" "}
                    <Code>my_analyzer</Code>, <Code>my_filter</Code>,{" "}
                    <Code>my_tokenizer</Code>. What a setting <em>means</em>{" "}for
                    the search this project runs belongs to Documents &amp; Indices,
                    Search UX and Production Essentials; what the tree{" "}
                    <em>looks like</em>{" "}belongs here. The one exception is the
                    filter shelf, where the subject is what this project actually
                    defines, so the real definitions are shown.
                </p>
                <p>
                    Operations appear twice — the Node client call first, then the{" "}
                    <Code>curl</Code>{" "}that goes over the wire — because a
                    settings body is reached through a different endpoint than the
                    one that created it, and the URL is half of what there is to
                    learn. Skeletons and trees are structure rather than requests,
                    so those stand alone; the client takes the same objects, with{" "}
                    <Code>index</Code>{" "}alongside them instead of in the URL.
                </p>
            </div>

            {/* ---------- part 1 — the two halves ---------- */}
            <PartHeading kicker="part 1">The Two Halves</PartHeading>
            <div>
                <DocSection title="the two halves of an index">
                    <p>
                        Creating an index is one request carrying two independent
                        bodies. They are siblings, they are both optional, and they
                        answer different questions — which is why almost every
                        &ldquo;where does this key go?&rdquo; has a one-sentence
                        answer once the split is clear.
                    </p>
                    <p>
                        The whole of a create request, reduced to its two halves:
                    </p>
                    <CodeBlock code={TWO_HALVES} lang="jsonc" />
                    <p>
                        <Term>One test decides where anything belongs.</Term>{" "}Read
                        the thing you are about to write and ask what it is a
                        statement about.
                    </p>
                    <CodeBlock code={WHERE_TEST} lang="text" />
                    <p>
                        A field is a column of your data, so anything describing one
                        is <Code>mappings</Code>. Machinery is everything the index
                        does regardless of what is stored in it, so that is{" "}
                        <Code>settings</Code>. The test almost never needs a second
                        look — except for one case that lands in both halves at once.
                    </p>
                    <p>
                        <Term>An analyzer is defined in one half and assigned in
                        the other.</Term>{" "}The definition is machinery: a named
                        assembly of text-processing pieces, belonging to no field in
                        particular. The assignment is a statement about a field.
                    </p>
                    <CodeBlock code={ANALYZER_SPLIT} lang="jsonc" />
                    <p>
                        This is why building a custom analyzer is the one task that
                        touches both halves of the request: <Code>settings</Code>{" "}
                        says what <Code>my_analyzer</Code>{" "}<em>is</em>, and{" "}
                        <Code>mappings</Code>{" "}says which fields <em>use</em> it.
                        Define one and assign it nowhere and it runs on nothing;
                        assign a name that was never defined and the create request
                        fails outright.
                    </p>
                    <p>
                        Both halves are read back with a single call, and the reply
                        is worth looking at before anything else on this page.
                    </p>
                    <CodeBlock code={GET_INDEX_TS} lang="ts" />
                    <p>Over the wire that is a plain GET on the index itself:</p>
                    <CodeBlock code={GET_INDEX_CURL} lang="bash" />
                    <p>
                        What comes back is what you wrote plus what Elasticsearch
                        keeps about the index on its own account:
                    </p>
                    <CodeBlock code={GET_INDEX_REPLY} lang="jsonc" />
                    <p>
                        Three things in that reply catch people out. Numbers you sent
                        as numbers come back as <em>strings</em>, because index
                        settings are stored as text. The bottom half of the{" "}
                        <Code>index</Code>{" "}object —{" "}<Code>uuid</Code>,{" "}
                        <Code>creation_date</Code>, <Code>provided_name</Code>,{" "}
                        <Code>version</Code>{" "}— is bookkeeping you never wrote and
                        cannot set. And <Code>number_of_shards</Code>{" "}appears even
                        on an index created with an empty body, because a handful of
                        defaults are filled in at creation and then stored as if you
                        had asked for them.
                    </p>
                    <p>
                        <Term>The settings tree has exactly two kinds of
                        content.</Term>{" "}Everything the block can carry is either a
                        single named value or a definition inside the analysis box,
                        and telling the two apart is most of knowing your way around.
                    </p>
                    <CodeBlock code={SETTINGS_TREE} lang="text" />
                    <p>
                        The flat knobs are the subject of the next three sections and
                        the analysis box is the subject of part 4. Nothing else lives
                        at this level in a settings block you would write by hand.
                    </p>

                    <Callout severity="tip" label="tip · read the index before changing it">
                        <p>
                            <Code>GET /index_name</Code>{" "}is the cheapest command on
                            this page and answers most questions faster than reasoning
                            about them: what is actually set, which analyzers actually
                            exist, and which half a key ended up in. It is the first
                            move whenever behaviour and expectation disagree.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · both halves are optional">
                        <p>
                            <Code>PUT /index_name</Code>{" "}with an empty body is a
                            valid index. Mappings will then be guessed from the first
                            document written, and the settings will be defaults —
                            which is fine for a scratch index and is how an index ends
                            up with a shard count nobody chose.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the flat knobs ---------- */}
            <PartHeading kicker="part 2">The Flat Knobs</PartHeading>
            <div>
                <DocSection title="flat knob: number_of_shards">
                    <p>
                        This is the one setting that can never be changed, so it is
                        worth understanding before it is set rather than after. It
                        also explains itself only once you know what a shard is,
                        which takes a paragraph.
                    </p>
                    <p>
                        <Term>An index is a logical name; the data lives in
                        shards.</Term>{" "}A shard is not a partition or a slice in
                        any loose sense — one shard is one complete, self-contained
                        Lucene index, with its own inverted index and its own
                        segments on disk.
                    </p>
                    <CodeBlock code={SHARD_MODEL} lang="text" />
                    <p>
                        Searching <Code>index_name</Code>{" "}means searching every one
                        of those shards and merging what they return. Nothing in your
                        query mentions shards, and nothing in the response does
                        either.
                    </p>
                    <p>
                        <Term>The setting decides how documents are divided.</Term>{" "}
                        Placement is a hash of the document id, taken modulo the
                        shard count — no coordination, no lookup table.
                    </p>
                    <CodeBlock code={SHARD_ROUTING} lang="text" />
                    <p>
                        Because the routing is deterministic, a get by id goes
                        straight to the one shard that can hold it, and a document
                        never moves between shards for its whole life in that index.
                    </p>
                    <p>
                        <Term>Shards exist for two reasons.</Term>{" "}They let one
                        index hold more data than one machine can — different shards
                        sit on different nodes — and they let one search use more than
                        one machine, since each shard is searched in parallel and the
                        results are merged. One index of three shards is three
                        searches happening at once.
                    </p>
                    <p>
                        The count is set once, in the create request, alongside the
                        replica count:
                    </p>
                    <CodeBlock code={SHARDS_SET_TS} lang="ts" />
                    <p>The same request over the wire:</p>
                    <CodeBlock code={SHARDS_SET_CURL} lang="bash" />
                    <p>
                        <Term>Nothing about this is automatic.</Term>{" "}You set the
                        number at creation and Elasticsearch never revisits it. There
                        is no threshold at which an index splits itself, no
                        rebalancing of the count as data arrives, and no message
                        suggesting the number is now wrong.
                    </p>
                    <CodeBlock code={SHARD_GROWTH} lang="text" />
                    <p>
                        Twenty thousand documents on one shard and ten million
                        documents on one shard are both one shard — the second is
                        simply a much larger one. Growth changes the size of your
                        shards and never their number.
                    </p>
                    <p>
                        <Term>So the shard count is a capacity bet placed on day
                        one.</Term>{" "}The estimate that matters is not what the index
                        holds this week but what it will hold: more data than one
                        machine should carry means more shards at creation. Getting
                        the bet wrong is not fatal, but the correction is a rebuild
                        rather than an edit.
                    </p>
                    <p>
                        <Term>The reason it can never change is the modulo.</Term>{" "}
                        The shard count is baked into where every document already
                        sits, so changing it does not move data — it changes the
                        arithmetic used to look data up.
                    </p>
                    <CodeBlock code={SHARD_IMMUTABLE} lang="text" />
                    <p>
                        Rather than silently returning nothing for most of the index,
                        Elasticsearch rejects the request. That refusal is the
                        feature; the alternative would be an index that answers
                        wrongly.
                    </p>
                    <p>
                        <Term>Changing the count therefore means a new
                        index.</Term>{" "}The recipe is three steps, and the alias in
                        the third is what keeps the application unaware that anything
                        happened.
                    </p>
                    <CodeBlock code={RESHARD_TS} lang="ts" />
                    <p>
                        The same three steps over the wire, with the swap as the one
                        atomic request it has to be:
                    </p>
                    <CodeBlock code={RESHARD_CURL} lang="bash" />
                    <p>
                        The reindex is what re-routes every document under the new
                        count, which is exactly the work a live change could not do.
                        A dedicated <Code>_split</Code>{" "}API exists as well, but it
                        is an explicit manual operation on a closed index and it can
                        only multiply the count — the mental model stands: you do not
                        change this setting, you build an index that has the value you
                        want.
                    </p>
                    <p>
                        <Term>For this project the answer is one shard.</Term>{" "}
                        Forty-five thousand movies is a fraction of what a single
                        healthy shard carries comfortably, so{" "}
                        <Code>number_of_shards: 1</Code>{" "}is the whole decision. What
                        a healthy shard size actually is, and how to size a count for
                        data that will not fit in one, belongs to Production
                        Essentials.
                    </p>

                    <Callout severity="trap" label="trap · more shards is not more speed">
                        <p>
                            A small index split into many shards is slower, not
                            faster: every search fans out to all of them and waits for
                            the slowest, and each shard carries fixed overhead. The
                            reason to add shards is data that does not fit on one
                            node, not a wish for parallelism.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · alias from the first index">
                        <p>
                            Point the application at an alias rather than at{" "}
                            <Code>index_name_v1</Code>{" "}directly, on day one, before
                            there is any reason to. It costs one request at creation
                            and it is what turns the rebuild above from a deployment
                            into a swap.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · you never address a shard">
                        <p>
                            No API takes a shard number. Elasticsearch decides which
                            node holds which shard, moves them when the cluster
                            changes, and recovers them after a failure. The only
                            shard-level thing you control is how many there are.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="flat knob: number_of_replicas">
                    <p>
                        Where the shard count decides how the data is divided, the
                        replica count decides how many times each of those pieces is
                        duplicated. It defaults to <Code>1</Code>, it is changeable at
                        any time, and it is the one knob on this page whose cost and
                        benefit pull in opposite directions.
                    </p>
                    <p>
                        <Term>A replica is a full copy of a shard.</Term>{" "}
                        <Code>number_of_replicas: 1</Code>{" "}means one copy beside
                        each primary, so two copies of everything;{" "}
                        <Code>3</Code>{" "}means four copies in total. Replicas are
                        placed on different nodes from the primary they copy, which is
                        the point of them — and it is also why a single-node cluster
                        can never allocate them.
                    </p>
                    <p>
                        Because the setting is dynamic, it is changed on a live index
                        rather than at creation:
                    </p>
                    <CodeBlock code={REPLICAS_SET_TS} lang="ts" />
                    <p>The same change over the wire:</p>
                    <CodeBlock code={REPLICAS_SET_CURL} lang="bash" />
                    <p>
                        <Term>What to set depends on how many nodes there
                        are.</Term>{" "}On a single node the honest value is{" "}
                        <Code>0</Code>: there is nowhere for a copy to live, so the
                        default of <Code>1</Code>{" "}leaves a replica permanently
                        unassigned and the cluster permanently yellow. Setting{" "}
                        <Code>0</Code>{" "}turns that into green and loses nothing you
                        had. Keeping the default and living with yellow is equally
                        workable as long as you know why the colour is there — yellow
                        means &ldquo;all data available, redundancy missing&rdquo;,
                        not &ldquo;broken&rdquo;. In production, <Code>1</Code>{" "}is
                        the standard choice, and <Code>2</Code>{" "}or more is worth it
                        only for read traffic heavy enough to need the extra copies
                        answering searches.
                    </p>
                    <p>
                        <Term>Every additional copy is the same trade.</Term>{" "}Both
                        columns move together, which is why the number is a decision
                        rather than a maximum to be filled in.
                    </p>
                    <CodeBlock code={REPLICA_TRADE} lang="text" />
                    <p>
                        The last line is the one to remember, because it is the
                        confusion this setting causes most often: replicas are about
                        serving reads and surviving failure, never about fitting data.
                        An index too large for its nodes needs shards; adding replicas
                        to it makes the problem exactly twice as bad.
                    </p>
                    <p>
                        <Term>How search uses the copies.</Term>{" "}Each copy is a
                        complete, independently searchable shard, and a search is
                        answered by one copy per shard rather than by all of them.
                    </p>
                    <CodeBlock code={REPLICA_FANOUT} lang="text" />
                    <p>
                        Requests are distributed across the copies in turn, and a
                        replica is not a second-class citizen for reads — primary and
                        replica are equal, so four copies means roughly four times the
                        search throughput. Since the copies hold identical data, which
                        one answered is not something you can observe or need to.
                    </p>
                    <p>
                        <Term>Writes travel the other way.</Term>{" "}Reads pick one
                        copy; writes have to reach all of them, and they always start
                        from the same place.
                    </p>
                    <CodeBlock code={WRITE_PATH} lang="text" />
                    <p>
                        Index, update, delete and every operation inside a bulk
                        request go to the primary first and are replicated from there,
                        and the acknowledgement comes back only once every copy has
                        the change. That is the write-side cost in the trade above,
                        stated as a mechanism: more copies is more work per write, and
                        the client waits for it.
                    </p>
                    <p>
                        <Term>Between those two steps there is a window.</Term>{" "}
                        Replication does not block reads, and each copy refreshes on
                        its own cycle — so a search routed to a replica in the middle
                        of an update can legitimately answer from the older version of
                        a document.
                    </p>
                    <CodeBlock code={STALE_WINDOW} lang="text" />
                    <p>
                        Two searches issued milliseconds apart can disagree, and
                        neither of them is wrong. Elasticsearch promises eventual
                        consistency for search and never strong read-after-write — the
                        same near-real-time contract the Introduction describes, only
                        now with a second reason for it. Whatever needs the
                        guaranteed-current version of a document reads the source of
                        truth, which in this project is CouchDB, not the index.
                    </p>

                    <Callout severity="trap" label="trap · do not read your own write from the index">
                        <p>
                            Write a document and immediately search for it and the
                            result may be the old version, the new one, or no hit at
                            all — the refresh cycle and the replica window are two
                            independent reasons for it. Code that writes and then
                            re-reads to confirm belongs against the database that owns
                            the data.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · zero replicas is the honest single-node setting">
                        <p>
                            <Code>number_of_replicas: 0</Code>{" "}on a
                            development cluster removes a permanent yellow that
                            otherwise trains you to ignore cluster health. It is
                            dynamic, so raising it again when there is a second node
                            is one request and no rebuild.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · replicas are copies, not backups">
                        <p>
                            A replica follows its primary, including deletions. It
                            protects against a node disappearing and against nothing
                            else — a delete replicates as faithfully as an index does,
                            so recovering from a mistaken one is the business of
                            snapshots.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="flat knobs: refresh_interval and max_result_window">
                    <p>
                        Two knobs remain at this level, and both are covered in full
                        elsewhere — the first in Documents &amp; Indices, the second
                        in Search Queries. What belongs here is only where they sit in
                        the tree and what shape their values take.
                    </p>
                    <p>
                        <Term>
                            <Code>refresh_interval</Code>{" "}is the cadence at which
                            new documents become searchable.
                        </Term>{" "}
                        Writes land in a buffer and are only visible to search after a
                        refresh; the default is <Code>1s</Code>, and{" "}
                        <Code>-1</Code>{" "}disables refreshing altogether — the trick
                        that makes a bulk import several times faster, then restores
                        the interval and refreshes once by hand.
                    </p>
                    <p>
                        <Term>
                            <Code>max_result_window</Code>{" "}is the ceiling on{" "}
                            <Code>from</Code>{" "}plus <Code>size</Code>.
                        </Term>{" "}
                        The default is <Code>10000</Code>, and asking for hit 10 001
                        through classic pagination is the wall that{" "}
                        <Code>search_after</Code>{" "}exists to get past. Raising the
                        number is possible and is almost always the wrong fix, since
                        deep pagination costs memory on every shard in the index.
                    </p>
                    <p>
                        Both are ordinary members of the flat group, written beside
                        the shard and replica counts:
                    </p>
                    <CodeBlock code={KNOBS_TS} lang="ts" />
                    <p>
                        Over the wire the same body carries an explicit{" "}
                        <Code>index</Code>{" "}level, which is the form the
                        documentation is written in:
                    </p>
                    <CodeBlock code={KNOBS_CURL} lang="bash" />
                    <p>
                        <Term>That <Code>index.</Code>{" "}prefix has three equivalent
                        spellings.</Term>{" "}Every knob on this page is really called{" "}
                        <Code>index.number_of_shards</Code>{" "}and friends, and the
                        prefix can be nested, inlined into the key, or left out.
                    </p>
                    <CodeBlock code={FLATTEN_FORMS} lang="text" />
                    <p>
                        Write whichever form reads best where it sits — the nested
                        object in a <Code>curl</Code>{" "}body, the bare keys in a
                        client call that already has <Code>settings</Code>{" "}as its own
                        argument. The only thing worth knowing is that a{" "}
                        <Code>GET</Code>{" "}answers in the nested form regardless of
                        how you wrote it, so the reply will not look like your request
                        if you used the flattened spelling.
                    </p>

                    <Callout severity="tip" label="tip · leave both alone until something says otherwise">
                        <p>
                            Every value here has a default that is right for a normal
                            index, and each of these two is worth changing for exactly
                            one reason:{" "}<Code>refresh_interval</Code>{" "}for the
                            duration of a bulk import,{" "}
                            <Code>max_result_window</Code>{" "}essentially never. A
                            settings block with fewer keys in it is a settings block
                            with fewer things to explain later.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · both are dynamic">
                        <p>
                            Neither of these needs a rebuild — they are changed on a
                            live index with{" "}
                            <Code>PUT /index_name/_settings</Code>{" "}and take effect
                            at once, which is what makes the import trick practical
                            in the first place.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — what can change ---------- */}
            <PartHeading kicker="part 3">What Can Change</PartHeading>
            <div>
                <DocSection title="static vs dynamic">
                    <p>
                        Every index setting belongs to one of two classes, and the
                        class is not a detail of documentation — it decides the entire
                        lifecycle of that setting. One class is edited with a request;
                        the other is edited by building a new index. Knowing which is
                        which is the difference between a five-second change and an
                        afternoon.
                    </p>
                    <p>
                        The knobs from part 2, sorted into their classes:
                    </p>
                    <CodeBlock code={SETTING_CLASSES} lang="text" />
                    <p>
                        <Term>Dynamic settings are changed on a live index.</Term>{" "}
                        The endpoint is the index plus <Code>_settings</Code>, the
                        body is the same shape as the create request&apos;s{" "}
                        <Code>settings</Code>{" "}half, and the change applies
                        immediately with nothing taken offline.
                    </p>
                    <CodeBlock code={PUT_SETTINGS_TS} lang="ts" />
                    <p>The same request over the wire:</p>
                    <CodeBlock code={PUT_SETTINGS_CURL} lang="bash" />
                    <p>
                        <Term>Static settings are fixed at creation.</Term>{" "}Sending
                        one to the same endpoint is not ignored and does not partially
                        succeed — the request is rejected, and the wording of the
                        rejection is worth recognising on sight.
                    </p>
                    <CodeBlock code={STATIC_ERROR} lang="jsonc" />
                    <p>
                        <Code>final index setting</Code>{" "}and{" "}
                        <Code>not updateable</Code>{" "}together mean exactly one
                        thing: this value was decided when the index was created and
                        no request will change it. A body mixing dynamic and static
                        keys fails as a whole, so the dynamic ones are not applied
                        either.
                    </p>
                    <p>
                        <Term>The split is not arbitrary.</Term>{" "}A static setting
                        shaped how the data already on disk was <em>written</em> —
                        which shard each document was routed to, which terms each text
                        field was analysed into. Changing it would not reorganise that
                        data; it would leave the data as it is and reinterpret it
                        wrongly, which is the failure the previous section showed with
                        the modulo. A dynamic setting shapes behaviour{" "}
                        <em>from now on</em> — how often to refresh, how many copies
                        to keep, how deep a page may go — and nothing already written
                        depends on its old value.
                    </p>
                    <p>
                        That reduces the whole question to one decision with three
                        outcomes:
                    </p>
                    <CodeBlock code={DECISION_TREE} lang="text" />
                    <p>
                        The middle branch is the exception the next section is about;
                        the bottom branch is the recipe from the shard section, which
                        is the general answer for anything static.
                    </p>

                    <Callout severity="trap" label="trap · the error is the first you hear of it">
                        <p>
                            There is no warning at creation that a setting will later
                            be unchangeable, and no list in your own code saying which
                            keys are which. The class is discovered when a change is
                            attempted, usually on the index that is already in
                            production — which is the argument for choosing static
                            values deliberately rather than accepting defaults.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · one endpoint, two outcomes">
                        <p>
                            <Code>PUT /index_name/_settings</Code>{" "}is the only
                            endpoint for changing settings, for both classes. It does
                            not become a different call for static settings — it
                            simply refuses them, which is why the error above is the
                            whole of the static story.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the close/open exception">
                    <p>
                        The analysis box sits awkwardly between the two classes. It is
                        static in the sense that it cannot be changed on a live index,
                        but it does not need a rebuild either: an index can be closed,
                        edited and reopened, which takes seconds and keeps every
                        document where it is. This is the path a synonym list is
                        maintained through, and it comes with a boundary that is easy
                        to cross by accident.
                    </p>
                    <p>
                        <Term>The sequence is three requests.</Term>{" "}Closing an
                        index makes it unavailable for both reads and writes; while it
                        is closed, the settings endpoint accepts what it would
                        otherwise refuse.
                    </p>
                    <CodeBlock code={CLOSE_OPEN_TS} lang="ts" />
                    <p>The same three requests over the wire:</p>
                    <CodeBlock code={CLOSE_OPEN_CURL} lang="bash" />
                    <p>
                        The cost is seconds of unavailability and no reindex at all —
                        which is why editing the synonyms behind{" "}
                        <Code>movie_synonyms</Code>{" "}is an operational task in Search
                        UX rather than a rebuild.
                    </p>
                    <p>
                        <Term>The boundary is index-time versus
                        search-time.</Term>{" "}Whether this path is correct has
                        nothing to do with whether the request succeeds, because it
                        succeeds either way.
                    </p>
                    <CodeBlock code={CLOSE_BOUNDARY} lang="text" />
                    <p>
                        A search-time piece runs on the query text at the moment a
                        search arrives, so replacing it changes the next search and
                        touches nothing on disk. An index-time piece decided what
                        terms went into the index for every document already written,
                        and changing the definition does not revisit them — so the
                        index ends up holding two generations of terms, matching
                        inconsistently depending on when a document happened to be
                        indexed. Nothing reports this. For an index-time change, use
                        the recipe: a new index, a reindex, an alias swap.
                    </p>
                    <p>
                        <Term>Closing is an index-level operation and nothing
                        smaller.</Term>{" "}The unavailability is total for that index
                        while it lasts, which is the fact that decides whether this
                        path is acceptable in production.
                    </p>
                    <CodeBlock code={CLOSE_SCOPE} lang="text" />
                    <p>
                        There is no way to close one shard, one replica, or one field.
                        Shards and replicas are not addressable units in this or any
                        other API — Elasticsearch allocates them, moves them between
                        nodes, and recovers them after a failure, and what you control
                        is how many of each there are. An alias in front of the index
                        does not help here either: the alias points at the index, and
                        the index is what went offline.
                    </p>

                    <Callout severity="danger" label="danger · editing an index-time analyzer leaves a mixed index">
                        <p>
                            The close/open edit is <em>accepted</em> for an index-time
                            analyzer, with no error and no warning, and the result is
                            an index where older documents are analysed one way and
                            newer ones another. Searches then match some documents and
                            not others for reasons nothing in the query explains. If
                            the analyzer is assigned with <Code>analyzer</Code>{" "}
                            rather than <Code>search_analyzer</Code>, rebuild instead.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · a closed index is invisible, not broken">
                        <p>
                            While the index is closed, searches against it fail rather
                            than returning zero hits, and an application without
                            retries will surface that as an outage. The window is
                            short, but it is a real one — schedule the edit rather than
                            running it against live traffic.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · new definitions are always safe to add">
                        <p>
                            Adding a filter or an analyzer that no field references
                            yet changes nothing about how anything is analysed. Only
                            redefining a piece that an existing index-time analyzer
                            already uses creates the mixed index above.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the analysis box ---------- */}
            <PartHeading kicker="part 4">The Analysis Box</PartHeading>
            <div>
                <DocSection title="the analysis box: the shelf system">
                    <p>
                        Everything below <Code>analysis</Code>{" "}works one way, and
                        seeing the pattern once makes the four sub-keys stop looking
                        like four unrelated features. Each of them is a shelf: a
                        place to put definitions that you name, so that something else
                        can refer to them by that name.
                    </p>
                    <p>
                        The four shelves, and what kind of thing each one holds:
                    </p>
                    <CodeBlock code={SHELVES} lang="text" />
                    <p>
                        The order in that list is also the order things happen in, and
                        the last shelf is different in kind from the first three. A
                        char filter, a tokenizer and a token filter are pieces of
                        machinery; an analyzer is a machine assembled from them. That
                        distinction is why the fourth shelf is the only one anything
                        outside <Code>settings</Code>{" "}ever mentions.
                    </p>
                    <p>
                        <Term>Every definition on every shelf has the same three
                        parts.</Term>{" "}There is no second syntax to learn per shelf —
                        the shelf changes what kinds of <Code>type</Code>{" "}are
                        available and nothing else.
                    </p>
                    <CodeBlock code={DEFINITION_ANATOMY} lang="text" />
                    <p>
                        The label is yours and carries no meaning to Elasticsearch;
                        the <Code>type</Code>{" "}is a name from Elasticsearch&apos;s
                        catalogue and decides which parameters are legal beneath it.
                        Getting the type wrong produces a clear error at creation;
                        getting the label &ldquo;wrong&rdquo; is impossible, because
                        it is just a name.
                    </p>
                    <p>
                        <Term>Where a label can be used depends on its
                        shelf.</Term>{" "}This is the rule that decides whether a name
                        you have defined is allowed to appear in{" "}
                        <Code>mappings</Code>, and it is the one thing about the
                        analysis box worth memorising.
                    </p>
                    <CodeBlock code={LABEL_SCOPE} lang="text" />
                    <p>
                        Piece labels are an internal vocabulary: they are referenced
                        from inside an analyzer definition, which is still within{" "}
                        <Code>settings</Code>, and they never appear in the other half
                        of the request. Analyzer labels are the only ones that cross
                        over, through <Code>analyzer</Code>{" "}and{" "}
                        <Code>search_analyzer</Code>{" "}on a field. There is no way to
                        put a filter name on a field, and looking for one is a common
                        early wrong turn.
                    </p>
                    <p>
                        <Term>Names resolve against your shelves first, then the
                        catalogue.</Term>{" "}This is why an array can mix definitions
                        you wrote with built-ins you never mentioned anywhere.
                    </p>
                    <CodeBlock code={NAME_RESOLUTION} lang="text" />
                    <p>
                        In practice this means built-ins need no declaration —{" "}
                        <Code>lowercase</Code>{" "}works with an empty analysis box —
                        and a definition of yours named after a built-in silently
                        replaces it, which is a good reason to keep a prefix or a
                        project word in your labels.
                    </p>
                    <p>
                        <Term>Nothing in the analysis box applies globally.</Term>{" "}
                        A piece never names a field and a field never names a piece.
                        The connection is a chain, and every link has to be present
                        for anything at all to happen.
                    </p>
                    <CodeBlock code={THREE_FIELDS} lang="jsonc" />
                    <p>
                        Three fields, one analyzer, and only the first field is
                        affected:
                    </p>
                    <CodeBlock code={APPLY_CHAIN} lang="text" />
                    <p>
                        <Code>dash_strip</Code>{" "}only ever touches{" "}
                        <Code>title</Code>, and it touches it both when a document is
                        indexed and when that field is queried — the same analyzer runs
                        on both sides unless <Code>search_analyzer</Code>{" "}is set to
                        split them. Defining a piece and forgetting the assignment is
                        the quietest possible mistake here: the create request
                        succeeds, the definition is stored, and it runs on nothing.
                    </p>

                    <Callout severity="tip" label="tip · name for the shelf, not the effect">
                        <p>
                            A label like <Code>dash_strip</Code>{" "}says what the piece
                            does and reads correctly wherever it appears. A label like{" "}
                            <Code>title_filter</Code>{" "}names the field it happens to
                            be used on today, and stops being true the moment a second
                            field uses it.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · an unreferenced definition is not an error">
                        <p>
                            Elasticsearch does not check that your shelves are used.
                            A filter nothing references, an analyzer no field is
                            assigned, a whole analysis box with no corresponding
                            mappings — all of it is accepted and stored, and none of
                            it does anything.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="shelf: char_filter">
                    <p>
                        The first shelf holds pieces that run before anything has been
                        split. Their input is the raw string exactly as it was sent
                        and their output is another string — nothing here knows what a
                        word is, and no terms exist yet.
                    </p>
                    <p>
                        A definition on this shelf, annotated part by part, using the
                        one this project defines:
                    </p>
                    <CodeBlock code={CHAR_FILTER_DEF} lang="jsonc" />
                    <p>
                        <Code>char_filter</Code>{" "}is the shelf name and is spelled
                        exactly that way — singular, which is worth noting because the
                        parameter of the <Code>mapping</Code>{" "}type beneath it is{" "}
                        <Code>mappings</Code>, plural, and has nothing to do with the{" "}
                        <Code>mappings</Code>{" "}half of the index.{" "}
                        <Code>dash_strip</Code>{" "}is the label, chosen freely.{" "}
                        <Code>type: &quot;mapping&quot;</Code>{" "}selects character
                        replacement, and <Code>mappings</Code>{" "}is that type&apos;s
                        parameter — a list of <Code>from =&gt; to</Code>{" "}rules, with
                        an empty right-hand side meaning deletion.
                    </p>
                    <p>
                        Run against a title with a hyphen in it, the whole effect is
                        one character disappearing:
                    </p>
                    <CodeBlock code={CHAR_FILTER_EFFECT} lang="text" />
                    <p>
                        The result is still a single string, and it is important that
                        it is: this ran <em>before</em> the split, which is the only
                        reason it can join{" "}<Code>Spider</Code>{" "}and{" "}
                        <Code>Man</Code>{" "}into one word at all. Once the tokenizer
                        has run, the hyphen is already a boundary and no filter can
                        undo that.
                    </p>
                    <p>
                        The other type worth knowing on this shelf is{" "}
                        <Code>html_strip</Code>, which removes markup and takes no
                        parameters at all — useful when a description field arrives as
                        HTML and you would rather not index the tag names. This shelf
                        is usually empty, and everything on it is optional.
                    </p>

                    <Callout severity="note" label="note · character work only">
                        <p>
                            Anything expressed in terms of words — casing, stemming,
                            synonyms, stopwords — belongs on the token filter shelf,
                            not here. If a rule needs to know where a word starts, it
                            is too early for it at this stage.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="shelf: tokenizer">
                    <p>
                        The second shelf holds the single step that turns one string
                        into many terms. Exactly one tokenizer runs per analyzer, it is
                        required, and it is the moment the unit of work changes from
                        characters to words.
                    </p>
                    <p>
                        What that step does, using the built-in almost everything uses:
                    </p>
                    <CodeBlock code={TOKENIZER_EFFECT} lang="text" />
                    <p>
                        <Term>This shelf is almost never used.</Term>{" "}
                        <Code>standard</Code>{" "}splits on word boundaries by the
                        Unicode rules and discards punctuation, which is the right
                        answer for prose in any language this project deals with. The
                        shelf exists for input that is not prose — identifiers, paths,
                        codes — where word boundaries are not what the text is made
                        of.
                    </p>
                    <p>
                        The clearest example is a tokenizer that treats a path as a
                        hierarchy rather than as text:
                    </p>
                    <CodeBlock code={PATH_TOKENIZER_DEF} lang="jsonc" />
                    <p>
                        Given one path, it emits every prefix of that path as its own
                        term:
                    </p>
                    <CodeBlock code={PATH_EXPANSION} lang="text" />
                    <p>
                        That is what makes a category filter work without any query
                        cleverness: a term query for{" "}
                        <Code>/movies/action</Code>{" "}matches every document filed
                        anywhere beneath it, because the ancestor was indexed as a
                        term of its own.
                    </p>
                    <p>
                        <Term>Usage differs from the other shelves in one
                        way.</Term>{" "}Define a tokenizer only if you need a custom
                        one, then reference it by name — and that reference is a
                        single name rather than an array.
                    </p>
                    <CodeBlock code={TOKENIZER_USAGE} lang="text" />
                    <p>
                        The asymmetry is not arbitrary: there are many ways to clean
                        text and many transformations to apply to terms, but there is
                        exactly one way a given string is split. An array here is a
                        create-time error, and it is the most common mistake in a
                        hand-written analyzer.
                    </p>

                    <Callout severity="tip" label="tip · reach for the built-in first">
                        <p>
                            <Code>standard</Code>{" "}covers nearly every text field
                            you will index, and the built-in language analyzers already
                            wrap it. A custom tokenizer is a decision to be made when
                            the input has a structure prose does not — not a step in
                            building an ordinary analyzer.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · required, even when implicit">
                        <p>
                            A custom analyzer with no <Code>tokenizer</Code>{" "}is
                            rejected at creation. Built-in analyzers like{" "}
                            <Code>standard</Code>{" "}and <Code>english</Code>{" "}are not
                            an exception to this — they simply have their tokenizer
                            chosen for them.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="shelf: filter">
                    <p>
                        The third shelf is the busiest one, and the one most analyzers
                        spend all their configuration on. Its pieces run after the
                        split, so their input and output are terms rather than
                        characters — and a filter is free to change a term, produce
                        several from one, or remove it entirely.
                    </p>
                    <p>
                        Those three behaviours, one built-in each:
                    </p>
                    <CodeBlock code={FILTER_EFFECT} lang="text" />
                    <p>
                        Every operation on words that Elasticsearch performs is a
                        filter on this shelf — case folding, stemming, synonyms,
                        stopwords, n-grams, phonetic matching, length limits. If a
                        feature is described as changing what a word matches, this is
                        where it is configured.
                    </p>
                    <p>
                        This project defines two of them, both for Search UX:
                    </p>
                    <CodeBlock code={PROJECT_FILTERS} lang="jsonc" />
                    <p>
                        <Code>movie_synonyms</Code>{" "}is a{" "}
                        <Code>synonym_graph</Code>{" "}holding the equivalence lists
                        that let one word match another, and{" "}
                        <Code>shingle_2_3</Code>{" "}is a <Code>shingle</Code>{" "}filter
                        producing two- and three-word groups, which is what makes
                        phrase-style autocomplete possible. Both follow the universal
                        anatomy exactly: a label, a type, and that type&apos;s
                        parameters.
                    </p>
                    <p>
                        <Term>Most filters need no definition at all.</Term>{" "}A
                        built-in with no parameters to set is used by name and never
                        appears on your shelf.
                    </p>
                    <CodeBlock code={FILTER_BUILTINS} lang="text" />
                    <p>
                        The rule follows from name resolution: define a filter when it
                        needs parameters — a synonym list, a shingle size, a stopword
                        set of your own — and otherwise write the built-in name
                        directly.
                    </p>
                    <p>
                        <Term>Filters are used as an array, and the array is
                        ordered.</Term>{" "}Each filter receives what the previous one
                        produced, so two correct filters in the wrong order make a
                        broken analyzer.
                    </p>
                    <CodeBlock code={FILTER_ORDER} lang="text" />
                    <p>
                        Put <Code>lowercase</Code>{" "}before{" "}
                        <Code>movie_synonyms</Code>{" "}and the terms are folded before
                        they are compared against a lowercase synonym list, so they
                        match. Reverse the two and the synonym filter sees{" "}
                        <Code>SpiderMan</Code>, finds nothing, and the lowercasing
                        that would have helped happens afterwards. Nothing errors —
                        the analyzer is simply less effective than it looks, which is
                        why ordering is worth checking with the analyze API rather
                        than by reading.
                    </p>

                    <Callout severity="trap" label="trap · a token filter is not a bool filter">
                        <p>
                            The word <Code>filter</Code>{" "}names two unrelated things
                            in Elasticsearch. On this shelf it transforms{" "}
                            <em>terms</em>{" "}while text is being analysed. In a query
                            body, <Code>bool.filter</Code>{" "}holds{" "}
                            <em>conditions</em>{" "}that documents must satisfy without
                            being scored. They share nothing but the noun — settings
                            side means terms, query side means conditions.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · verify order with _analyze">
                        <p>
                            <Code>POST /index_name/_analyze</Code>{" "}with an analyzer
                            name and a sample string prints the terms that come out.
                            It is the only way to see the effect of a filter array
                            without indexing anything, and it turns an ordering
                            question into an observation.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the shelf key is singular">
                        <p>
                            The shelf is <Code>filter</Code>{" "}and the reference
                            inside an analyzer is also <Code>filter</Code>{" "}even
                            though it takes an array.{" "}
                            <Code>filters</Code>{" "}is not a key anywhere in the
                            analysis box.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="shelf: analyzer">
                    <p>
                        The fourth shelf holds machines rather than pieces. An
                        analyzer defines nothing new of its own — it names the pieces
                        from the other three shelves and fixes the order they run in,
                        which is what turns a pile of definitions into something a
                        field can actually use.
                    </p>
                    <p>
                        The definition, with each slot&apos;s rules on it:
                    </p>
                    <CodeBlock code={ANALYZER_DEF} lang="jsonc" />
                    <p>
                        <Code>char_filter</Code>{" "}is optional and an array,{" "}
                        <Code>tokenizer</Code>{" "}is required and a single name, and{" "}
                        <Code>filter</Code>{" "}is optional and an array. The stages
                        always run in that sequence regardless of the order the keys
                        appear in the JSON, and within each array the listed order is
                        the execution order. Names in any of the three slots resolve
                        against your own shelves first and Elasticsearch&apos;s
                        catalogue second, so this is where your definitions and the
                        built-ins are mixed. And this label —{" "}
                        <Code>my_analyzer</Code>{" "}— is the only name from the whole
                        analysis box that <Code>mappings</Code>{" "}is allowed to
                        mention.
                    </p>
                    <p>
                        Assembled, the four shelves are one pipeline, and following a
                        real string through it is the shortest summary of this entire
                        part:
                    </p>
                    <CodeBlock code={PIPELINE} lang="text" />
                    <p>
                        The same pipeline runs on both sides of the system. When a
                        document is indexed, the terms at the bottom are what gets
                        stored in the inverted index; when that field is searched, the
                        query text goes through the identical steps so that it is
                        compared like against like. That symmetry is the reason a
                        query for <Code>spider man</Code>{" "}can find a document
                        written as <Code>Spider-Man</Code>: neither side is matching
                        the original text, and both were reduced the same way.
                    </p>
                    <p>
                        One variant is worth knowing exists: a{" "}
                        <Code>normalizer</Code>{" "}is a fifth, smaller shelf holding
                        the same idea for <Code>keyword</Code>{" "}fields — token
                        filters only, no tokenizer, because a keyword is never split.
                        It is how an exact-match field is made case-insensitive
                        without becoming a text field.
                    </p>

                    <Callout severity="tip" label="tip · one analyzer, both sides, unless you mean otherwise">
                        <p>
                            Assigning only <Code>analyzer</Code>{" "}gives a field the
                            same treatment at index time and query time, which is
                            correct by default and needs no thought.{" "}
                            <Code>search_analyzer</Code>{" "}deliberately breaks that
                            symmetry, and every reason to reach for it — synonym
                            expansion on one side only, autocomplete n-grams — is a
                            Search UX decision, not a structural one.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the assembly is all there is">
                        <p>
                            There is no behaviour in an analyzer beyond the pieces it
                            lists. Two analyzers naming the same char filters,
                            tokenizer and filters in the same order are the same
                            analyzer under two labels — which is why a custom analyzer
                            is understood entirely by reading its three slots.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — in practice ---------- */}
            <PartHeading kicker="part 5">In Practice</PartHeading>
            <div>
                <DocSection title="reading & changing in practice">
                    <p>
                        Everything above is structure; this section is the four moves
                        that structure is used through. They are worth having in one
                        place because each answers a different question, and picking
                        the wrong one is how a settings problem turns into a long
                        afternoon.
                    </p>
                    <p>
                        <Term>Read the settings on their own.</Term>{" "}The full{" "}
                        <Code>GET /index_name</Code>{" "}from part 1 returns both halves;
                        adding <Code>_settings</Code>{" "}narrows it to the one you
                        want.
                    </p>
                    <CodeBlock code={GET_SETTINGS_TS} lang="ts" />
                    <p>The same request over the wire:</p>
                    <CodeBlock code={GET_SETTINGS_CURL} lang="bash" />
                    <p>
                        The reply is narrower than people expect, and the reason is
                        the important part:
                    </p>
                    <CodeBlock code={GET_SETTINGS_REPLY} lang="jsonc" />
                    <p>
                        What comes back is only what was explicitly set, plus the
                        bookkeeping Elasticsearch adds. Defaults are invisible — an
                        index using the standard one-second refresh has no{" "}
                        <Code>refresh_interval</Code>{" "}in this reply at all, and the
                        absence of a key says nothing about the value in effect.
                    </p>
                    <p>
                        <Term>Ask for the defaults when the absence matters.</Term>{" "}
                        One query parameter turns the reply into the full picture.
                    </p>
                    <CodeBlock code={DEFAULTS_TS} lang="ts" />
                    <p>The same, over the wire:</p>
                    <CodeBlock code={DEFAULTS_CURL} lang="bash" />
                    <p>
                        A second block appears beside the first, holding every value
                        you never set:
                    </p>
                    <CodeBlock code={DEFAULTS_REPLY} lang="jsonc" />
                    <p>
                        <Code>settings</Code>{" "}is what you configured and{" "}
                        <Code>defaults</Code>{" "}is everything else, so the effective
                        configuration is the two read together. This is the debugging
                        move whenever behaviour and expectation disagree: the question
                        &ldquo;so what <em>is</em>{" "}my refresh interval?&rdquo; has no
                        answer in the plain reply and an unambiguous one here. It is
                        also a long reply — every internal knob is in it — so it is a
                        deliberate lookup rather than the call you reach for by
                        default.
                    </p>
                    <p>
                        <Term>Change what is dynamic.</Term>{" "}The endpoint from part
                        3, aimed at a live index and applied immediately.
                    </p>
                    <CodeBlock code={PUT_SETTINGS_TS} lang="ts" />
                    <p>The same change over the wire:</p>
                    <CodeBlock code={PUT_SETTINGS_CURL} lang="bash" />
                    <p>
                        A static setting in that body produces the{" "}
                        <Code>illegal_argument_exception</Code>{" "}with{" "}
                        <Code>not updateable</Code>{" "}in the reason, and the whole
                        request is rejected rather than partly applied. From there
                        there are exactly two routes: close, edit and reopen if the
                        change is a search-time analysis piece, or build a new index,
                        reindex into it and swap the alias for anything else.
                    </p>
                    <p>
                        <Term>Set everything at creation.</Term>{" "}This is the move
                        that avoids the other three, and it is one request carrying
                        both halves with each of this page&apos;s elements in its
                        place.
                    </p>
                    <CodeBlock code={CREATE_FULL_TS} lang="ts" />
                    <p>
                        The same index created over the wire, with the explicit{" "}
                        <Code>index</Code>{" "}level the settings half is really nested
                        under:
                    </p>
                    <CodeBlock code={CREATE_FULL_CURL} lang="bash" />
                    <p>
                        Every element on this page appears in that body once: the flat
                        knobs, the analysis box with a definition on three of its four
                        shelves, and a <Code>mappings</Code>{" "}half whose only
                        connection to the first half is the analyzer label it
                        references. Read it top to bottom and it is the settings tree
                        from part 1 with values filled in — which is the whole of what
                        this page describes.
                    </p>

                    <Callout severity="tip" label="tip · put the create body in version control">
                        <p>
                            The index-creation request is the only complete statement
                            of how an index works, and{" "}
                            <Code>GET /index_name</Code>{" "}is not a substitute for it:
                            the reply is reshaped, stringified and mixed with
                            bookkeeping. A file holding this body is what makes the
                            reindex recipe a re-run rather than a reconstruction.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · defaults are not frozen">
                        <p>
                            A default is whatever the current version of Elasticsearch
                            says it is, and it is filled in at creation for a few
                            settings and left unset for the rest. Anything your
                            behaviour actually depends on is worth setting explicitly,
                            so that it appears in the plain{" "}
                            <Code>_settings</Code>{" "}reply and reads as a decision
                            rather than an accident.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
