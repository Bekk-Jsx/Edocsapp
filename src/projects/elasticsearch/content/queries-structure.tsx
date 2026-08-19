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
    // --- part 1 (The Request Body) ---
    "level-1-the-request-skeleton": ["tip", "note"],

    // --- part 2 (Inside query) ---
    "level-2-bool-the-combiner": ["tip", "note"],
    "level-3-match-and-multi-match": ["trap", "note"],
    "level-3-the-term-level-clauses": ["trap", "note"],

    // --- part 3 (Beyond query) ---
    "level-1-again-the-shape-of-aggs-and-suggest": ["tip", "note"],
};

// Top-level divider between the three parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper the introduction, documents-indices, mappings-analysis
// and search-queries content files each define for their own part dividers.
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
// 1. A section opens with prose. The reader learns what the slot is and what it
//    is for before any fragment appears.
// 2. Every fragment is introduced by the sentence above it and, where it has a
//    consequence, read by the sentence below it. Two fragments never touch.
// 3. A comparison names both sides in plain words and ends in a paragraph
//    saying which one to write and why.
//
// THIS PAGE'S OWN RULE: names are generic — `field_name`, `user_text`,
// `exact_value`, `agg_name`. No movie fields anywhere. What a slot MEANS is the
// business of Search Queries, Aggregations and Search UX; what a slot LOOKS
// LIKE is the business of this page, and a real field name only invites the
// reader to learn the wrong lesson from it.
//
// Fragments are JSON request bodies rather than paired client/curl snippets:
// the Node client takes the same objects, so a second copy of every shape would
// carry no extra information. The intro says so once.

// ===================================================================
// part 1 — the request body
// ===================================================================

const REQUEST_SKELETON = `{
  "query":        { },   // WHO matches — the only filtering slot
  "from":         0,     // how many hits to skip
  "size":         10,    // how many hits to return
  "sort":         [ ],   // replaces the default _score ordering
  "search_after": [ ],   // cursor into that sort, instead of "from"
  "_source":      [ ],   // which fields come back in each hit
  "highlight":    { },   // matched fragments, per field
  "aggs":         { },   // statistics over the matching set
  "suggest":      { }    // did-you-mean / completions
}`;

const REQUEST_NODE = `await esClient.search({
    index: "index_name",   // the only extra — it is the URL
    query: { },
    from: 0,
    size: 10,
    sort: [ ],
    _source: [ ],
});`;

const REQUEST_EMPTY = `{ }

same as
{ "query": { "match_all": { } }, "from": 0, "size": 10 }`;

const REQUEST_AGGS_ONLY = `{
  "size": 0,
  "aggs": { }    // no "query" — the matching set is the whole index
}`;

const REQUEST_SOURCE = `{
  "query":   { },
  "_source": ["field_name", "other_field"]
}`;

// ===================================================================
// part 2 — inside query
// ===================================================================

const BOOL_LOGIC = `must      AND      required, and it scores
filter    AND      required, no score, cacheable
must_not  AND NOT  excluded
should    OR       optional — matching adds score

bool is the WHERE clause; the clauses inside it are the
conditions that WHERE is made of`;

const BOOL_SKELETON = `{
  "query": {
    "bool": {
      "must":     [ { } ],   // clauses that must match, scored
      "filter":   [ { } ],   // clauses that must match, unscored
      "must_not": [ { } ],   // clauses that must not match
      "should":   [ { } ],   // optional clauses
      "minimum_should_match": 1
    }
  }
}`;

const BOOL_PROJECT_SHAPE = `{
  "query": {
    "bool": {
      "must":   [ { } ],   // the reader's text
      "filter": [ { } ]    // the interface's conditions
    }
  }
}`;

const BOOL_ONE_OR_MANY = `"must": { }         accepted — a single clause
"must": [ { } ]     accepted — one clause in an array
"must": [ { }, { } ]  the same slot, two clauses`;

const BOOL_RECURSION = `{
  "bool": {
    "should": [
      { "bool": { "must": [ { }, { } ] } },   // (A AND B)
      { "bool": { "must": [ { }, { } ] } }    // (C AND D)
    ]
  }
}`;

const BOOL_MSM = `should alone            minimum_should_match defaults to 1
                        -> at least one must match (an OR)

should beside must      minimum_should_match defaults to 0
or filter               -> requires nothing, pure score bonus

"minimum_should_match": 2   overrides either default`;

const LEAF_DIRECT = `{
  "query": {
    "match": { "field_name": "user_text" }
  }
}`;

const LEAF_IN_BOOL = `{
  "query": {
    "bool": {
      "must": [ { "match": { "field_name": "user_text" } } ]
    }
  }
}`;

// ===================================================================
// part 2 — leaf clauses
// ===================================================================

const MATCH_SHORT = `{ "match": { "field_name": "user_text" } }`;

const MATCH_OBJECT = `{
  "match": {
    "field_name": {
      "query":     "user_text",
      "operator":  "and",
      "fuzziness": "AUTO"
    }
  }
}`;

const MATCH_PARAMS = `query      required   the text to search for

operator   "or"   default — any analyzed term is a hit,
                  and matching more of them ranks higher
           "and"  every analyzed term has to be present

fuzziness  "AUTO" allow near-miss terms; omit for exact terms`;

const MATCH_INVALID = `{
  "match": {
    "field_name": "user_text",
    "operator": "and"          // read as a SECOND field name
  }
}`;

const MATCH_VALID = `{
  "match": {
    "field_name": {
      "query": "user_text",
      "operator": "and"        // a sibling of the text
    }
  }
}`;

const MULTI_MATCH_SKELETON = `{
  "multi_match": {
    "query":     "user_text",              // required
    "fields":    ["field_name^3", "other_field"],   // required
    "type":      "best_fields",            // how field scores merge
    "operator":  "or",
    "fuzziness": "AUTO"
  }
}`;

const MATCH_SHAPES = `match        { "match": { field_name: { ...options } } }
                          ^ the FIELD is the key

multi_match  { "multi_match": { "query": ..., "fields": [ ] } }
                          ^ no field key — fields is a parameter`;

const TERM_SHAPE = `{ "term": { "field_name": { "value": "exact_value" } } }

short form, identical in effect
{ "term": { "field_name": "exact_value" } }`;

const TERMS_SHAPE = `{ "terms": { "field_name": ["exact_value", "other_value"] } }`;

const RANGE_SHAPE = `{
  "range": {
    "field_name": {
      "gte": 0,               // >=  combine any of gte/gt/lte/lt
      "lt":  100,             // <
      "format": "yyyy-MM-dd"  // dates only: parses the bounds
    }
  }
}`;

const EXISTS_SHAPE = `{ "exists": { "field": "field_name" } }`;

const FOUR_SHAPES = `term    { field_name: exact_value }        one value
terms   { field_name: [ values ] }       a list, no "value" key
range   { field_name: { operators } }    gte / gt / lte / lt
exists  { "field": "field_name" }        the NAME is the value

three wrap the field name as a key — exists does not`;

// ===================================================================
// part 3 — the other level-1 slots
// ===================================================================

const AGGS_SKELETON = `{
  "aggs": {
    "agg_name": {              // level 1 — YOUR label
      "agg_type": {            // level 2 — ES's vocabulary
        "field": "field_name"  //           its parameters
      },
      "aggs": {                // level 3 — optional sub-aggs
        "sub_agg_name": {
          "agg_type": { "field": "other_field" }
        }
      }
    }
  }
}`;

const AGGS_SIBLINGS = `{
  "aggs": {
    "first_agg_name":  { "agg_type": { "field": "field_name" } },
    "second_agg_name": { "agg_type": { "field": "other_field" } }
  }
}`;

const SUGGEST_SKELETON = `{
  "suggest": {
    "suggest_name": {          // level 1 — YOUR label
      "text": "user_text",
      "suggester_type": {      // term | phrase | completion
        "field": "field_name"  // its parameters
      }
    }
  }
}`;

const SHARED_PATTERN = `aggs      agg_name      -> agg_type       -> params
suggest   suggest_name  -> suggester_type -> params

a label you invent, a type from Elasticsearch, its parameters`;

export function QueriesStructureDocs() {
    return (
        <>
            {/* Page lead. Frames what this page is FOR before the first divider:
                the sections below are a reference to be looked things up in, not
                a narrative, and every name in them is deliberately generic. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    This page is the anatomy of a search request. It descends the
                    request tree from the top level down — every slot a body can
                    carry, then the shape of each clause that goes inside them —
                    covering what this project sends plus the essentials around it.
                    It answers &ldquo;where does this parameter go?&rdquo; and
                    &ldquo;why is this a 400?&rdquo;, which are questions of
                    structure rather than of meaning.
                </p>
                <p>
                    The names are deliberately generic: <Code>field_name</Code>,{" "}
                    <Code>user_text</Code>, <Code>exact_value</Code>,{" "}
                    <Code>agg_name</Code>. What each clause <em>means</em>{" "}belongs
                    to Search Queries, Aggregations and Search UX; what it{" "}
                    <em>looks like</em>{" "}belongs here, and a real field name would
                    only invite you to remember the example instead of the shape.
                </p>
                <p>
                    Fragments are JSON request bodies throughout. The Node client
                    takes those same objects — <Code>esClient.search()</Code>{" "}
                    receives the body&apos;s keys as its own, with{" "}
                    <Code>index</Code>{" "}alongside them — so every shape below is
                    already the JavaScript you would write, and nothing on this page
                    needs saying twice.
                </p>
            </div>

            {/* ---------- part 1 — the top level ---------- */}
            <PartHeading kicker="part 1">The Request Body</PartHeading>
            <div>
                <DocSection title="level 1: the request skeleton">
                    <p>
                        A search body is a flat object of independent slots, and{" "}
                        <Code>query</Code>{" "}is one of them rather than the container
                        for the rest. Seeing them side by side is what makes the
                        request readable: each slot answers a different question, and
                        none of them is nested inside another. It is also the fastest
                        way to place an unfamiliar parameter — almost everything you
                        will meet belongs to exactly one of these.
                    </p>
                    <p>
                        Every slot a search request can carry, with the question each
                        one answers:
                    </p>
                    <CodeBlock code={REQUEST_SKELETON} lang="jsonc" />
                    <p>
                        <Term>One slot decides, the rest describe.</Term>{" "}
                        <Code>query</Code>{" "}decides <em>which</em>{" "}documents match —
                        it is the only slot that removes anything from the result set.
                        Everything else shapes what comes back from that set: how many
                        hits (<Code>from</Code>, <Code>size</Code>), in what order (
                        <Code>sort</Code>, <Code>search_after</Code>), which fields (
                        <Code>_source</Code>), and what extras travel beside the hits (
                        <Code>highlight</Code>, <Code>aggs</Code>,{" "}
                        <Code>suggest</Code>).
                    </p>
                    <p>
                        The Node client takes the same slots as named arguments, one
                        level up, with the index alongside them instead of in the URL.
                    </p>
                    <CodeBlock code={REQUEST_NODE} lang="ts" />
                    <p>
                        That correspondence holds for every fragment on this page,
                        which is why the rest of them are shown as JSON only.
                    </p>
                    <p>
                        <Term>Every slot is optional, including the query.</Term>{" "}An
                        empty body is a valid search, and the defaults it falls back to
                        are worth knowing because they explain a lot of surprising
                        responses.
                    </p>
                    <CodeBlock code={REQUEST_EMPTY} lang="jsonc" />
                    <p>
                        No <Code>query</Code>{" "}means <Code>match_all</Code>, and no{" "}
                        <Code>size</Code>{" "}means ten hits — so a request that
                        &ldquo;returns everything, but only ten&rdquo; is usually a
                        body that forgot both.
                    </p>
                    <p>
                        The same default is what makes a statistics-only request work:
                        with no <Code>query</Code>, the set being summarised is the
                        whole index.
                    </p>
                    <CodeBlock code={REQUEST_AGGS_ONLY} lang="jsonc" />
                    <p>
                        <Code>size: 0</Code>{" "}then asks for the numbers without the
                        documents — the aggregation results come back on their own.
                    </p>
                    <p>
                        <Term>
                            <Code>_source</Code>{" "}selects fields for the response, not
                            for the index.
                        </Term>{" "}
                        Listing fields here changes what each hit carries over the
                        network and nothing else: every field stays indexed, stays
                        searchable, and stays sortable.
                    </p>
                    <CodeBlock code={REQUEST_SOURCE} lang="jsonc" />
                    <p>
                        This project uses it in <Code>movies.service.ts</Code>{" "}to keep
                        list responses small while the fields left out remain fully
                        queryable.
                    </p>

                    <Callout severity="tip" label="tip · trim the payload, not the index">
                        <p>
                            A search that returns large documents to render a list of
                            cards is paying for text nobody displays.{" "}
                            <Code>_source</Code>{" "}is the cheapest optimisation on this
                            page, it changes no behaviour, and it is reversible by
                            deleting one line.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · slots are siblings, never nested">
                        <p>
                            <Code>size</Code>, <Code>sort</Code>, <Code>aggs</Code>{" "}
                            and the rest sit <em>beside</em> <Code>query</Code>, not
                            inside it. Putting one of them in the wrong place is the
                            most common structural error in a hand-written body — the
                            request usually parses and then quietly ignores what it
                            could not place.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — inside the query slot ---------- */}
            <PartHeading kicker="part 2">Inside query</PartHeading>
            <div>
                <DocSection title="level 2: bool, the combiner">
                    <p>
                        A leaf query expresses exactly one condition, and no real
                        search is one condition: there is text, a filter or two, an
                        exclusion, a preference. <Code>bool</Code>{" "}is the clause that
                        exists purely to hold other queries and to say how they
                        combine. It matches nothing by itself, which is what makes it
                        the node the rest of the tree hangs from.
                    </p>
                    <p>
                        Its four slots are the boolean operators, each with a scoring
                        behaviour attached:
                    </p>
                    <CodeBlock code={BOOL_LOGIC} lang="text" />
                    <p>
                        The SQL comparison is exact enough to be useful:{" "}
                        <Code>bool</Code>{" "}is the whole <Code>WHERE</Code>{" "}clause,
                        and the queries inside it are the individual conditions that{" "}
                        <Code>WHERE</Code>{" "}is built from.
                    </p>
                    <p>
                        Written out, with the fifth key that governs how many{" "}
                        <Code>should</Code>{" "}clauses have to match:
                    </p>
                    <CodeBlock code={BOOL_SKELETON} lang="jsonc" />
                    <p>
                        <Term>All four slots are optional and freely combined.</Term>{" "}
                        A <Code>bool</Code>{" "}can carry one of them, all of them, or
                        the same one twice over; there is no required slot and no
                        required order. What a service typically sends is two of them.
                    </p>
                    <CodeBlock code={BOOL_PROJECT_SHAPE} lang="jsonc" />
                    <p>
                        <Term>Each slot takes one clause or an array of them.</Term>{" "}
                        Both forms are accepted, and they mean the same thing when
                        there is a single clause.
                    </p>
                    <CodeBlock code={BOOL_ONE_OR_MANY} lang="text" />
                    <p>
                        Write the array anyway. Code that builds a query pushes
                        clauses into a list as conditions are discovered, so the array
                        is the shape it will need the moment a second filter appears —
                        and switching between the two forms mid-file is how a slot ends
                        up silently overwritten.
                    </p>
                    <p>
                        <Term>A clause is any query object, including another
                        bool.</Term>{" "}That recursion is how compound logic is
                        expressed: an OR of two ANDs is a <Code>should</Code>{" "}holding
                        two <Code>bool.must</Code>{" "}clauses.
                    </p>
                    <CodeBlock code={BOOL_RECURSION} lang="jsonc" />
                    <p>
                        Nothing new is introduced at any depth — the same four slots
                        repeat, which is why arbitrarily complex conditions need no
                        additional syntax.
                    </p>
                    <p>
                        <Term>
                            <Code>minimum_should_match</Code>{" "}has two different
                            defaults.
                        </Term>{" "}
                        Which one applies depends on what sits beside{" "}
                        <Code>should</Code>{" "}in the same <Code>bool</Code>.
                    </p>
                    <CodeBlock code={BOOL_MSM} lang="text" />
                    <p>
                        Setting it explicitly removes the ambiguity, and it is worth
                        setting whenever a <Code>should</Code>{" "}clause carries meaning
                        rather than decoration.
                    </p>

                    <p>
                        <Term>query with and without bool.</Term>{" "}Since{" "}
                        <Code>query</Code>{" "}takes any single query object, a leaf can
                        sit there directly — so it is worth being precise about what
                        the wrapper does and does not change.
                    </p>
                    <p>
                        <Term>The leaf sent directly:</Term>{" "}
                        <Code>query</Code>{" "}holds one <Code>match</Code>{" "}and nothing
                        else.
                    </p>
                    <CodeBlock code={LEAF_DIRECT} lang="json" />
                    <p>
                        <Term>The same leaf inside bool.must:</Term>{" "}one level
                        deeper, in a slot that can hold more.
                    </p>
                    <CodeBlock code={LEAF_IN_BOOL} lang="json" />
                    <p>
                        <Term>They return identical documents with identical
                        scores.</Term>{" "}
                        The difference is capacity, not behaviour:{" "}
                        <Code>query</Code>{" "}accepts exactly one query object and wraps
                        nothing automatically, so the direct form has nowhere to put a
                        second condition. The first filter that arrives forces the
                        query to be restructured — which is why services that expect
                        filters start with <Code>bool</Code>{" "}from the first line, even
                        while it holds a single clause.
                    </p>

                    <Callout severity="tip" label="tip · arrays from the first clause">
                        <p>
                            <Code>{`must: [clause]`}</Code>{" "}costs nothing today and
                            saves an edit later.{" "}
                            <Code>{`must: clause`}</Code>{" "}then{" "}
                            <Code>{`must.push(...)`}</Code>{" "}is a type error at best
                            and a lost clause at worst.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · should is a slot, not a query">
                        <p>
                            <Code>must</Code>, <Code>filter</Code>,{" "}
                            <Code>must_not</Code> and <Code>should</Code>{" "}are keys of{" "}
                            <Code>bool</Code>{" "}and exist nowhere else — there is no
                            top-level <Code>should</Code>{" "}query. Leaves like{" "}
                            <Code>match</Code>, <Code>term</Code> and{" "}
                            <Code>range</Code>{" "}are query types that can be sent on
                            their own; the four slots are positions inside the
                            combiner.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="level 3: match and multi_match">
                    <p>
                        The two full-text leaves take the same family of parameters,
                        and the only real difficulty with them is where those
                        parameters are allowed to sit. <Code>match</Code>{" "}has two
                        forms — a short one that holds nothing but the text, and an
                        object form that holds options beside it — while{" "}
                        <Code>multi_match</Code>{" "}has only one. Knowing which shape
                        accepts what turns a puzzling 400 into an obvious typo.
                    </p>
                    <p>
                        The short form maps the field name straight to the text, and
                        that is all it can express.
                    </p>
                    <CodeBlock code={MATCH_SHORT} lang="json" />
                    <p>
                        The object form moves the text into a <Code>query</Code>{" "}key
                        so that options have somewhere to live beside it.
                    </p>
                    <CodeBlock code={MATCH_OBJECT} lang="json" />
                    <p>
                        Three parameters cover essentially all real usage of it:
                    </p>
                    <CodeBlock code={MATCH_PARAMS} lang="text" />
                    <p>
                        <Code>operator</Code>{" "}is about the analyzed terms rather than
                        the string: <Code>&quot;or&quot;</Code>{" "}returns more documents
                        and ranks the ones matching more terms higher, while{" "}
                        <Code>&quot;and&quot;</Code>{" "}returns only documents carrying
                        every term.
                    </p>

                    <p>
                        <Term>Options only exist in the object form.</Term>{" "}The two
                        shapes cannot be mixed, and mixing them is the single most
                        common structural mistake with <Code>match</Code>.
                    </p>
                    <p>
                        <Term>The invalid version — text and option side by
                        side:</Term>{" "}the parser is looking for field names at that
                        level, so it reads <Code>operator</Code>{" "}as a second field to
                        search.
                    </p>
                    <CodeBlock code={MATCH_INVALID} lang="jsonc" />
                    <p>
                        <Term>The valid version — the option inside the field&apos;s
                        object:</Term>{" "}the text and its options are siblings of each
                        other, one level deeper.
                    </p>
                    <CodeBlock code={MATCH_VALID} lang="jsonc" />
                    <p>
                        The rule to carry: under <Code>match</Code>{" "}the keys are field
                        names, and under a field name the keys are options. Text and
                        options never sit at the same level.
                    </p>

                    <p>
                        <Term>
                            <Code>multi_match</Code>{" "}has no short form.
                        </Term>{" "}
                        The fields have to be listed, so there is nothing a short form
                        could abbreviate — it is always a flat object of parameters.
                    </p>
                    <CodeBlock code={MULTI_MATCH_SKELETON} lang="jsonc" />
                    <p>
                        <Code>query</Code> and <Code>fields</Code>{" "}are required, the
                        rest optional. <Code>field_name^3</Code>{" "}is a boost written
                        into the field list, and <Code>type</Code>{" "}decides how the
                        per-field scores are merged into one.
                    </p>
                    <p>
                        <Term>Reading it as an extension of match saves memorising
                        it.</Term>{" "}
                        <Code>multi_match</Code>{" "}is match&apos;s parameters{" "}
                        <em>plus</em> <Code>fields</Code> and <Code>type</Code>:
                        anything valid inside a <Code>match</Code>{" "}object is valid
                        here too, applied to each listed field. What differs is the
                        shape around them.
                    </p>
                    <CodeBlock code={MATCH_SHAPES} lang="text" />
                    <p>
                        In <Code>match</Code>{" "}the field is a key and the options hang
                        under it; in <Code>multi_match</Code>{" "}there is no field key at
                        all, because the fields are themselves a parameter.
                    </p>

                    <Callout severity="trap" label="trap · a second field name, not an option">
                        <p>
                            The mixed form does not always fail loudly. Depending on the
                            option, Elasticsearch may reject the request or may accept
                            it as a query against a field that does not exist — which
                            returns zero hits with no error at all, and looks like a
                            data problem rather than a syntax one.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · one field, several fields">
                        <p>
                            <Code>match</Code>{" "}searches exactly one field, so several
                            fields mean either several clauses in a{" "}
                            <Code>bool</Code>{" "}or one <Code>multi_match</Code>. The
                            second is the same query expressed once — which is a
                            question of maintenance rather than of capability.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="level 3: the term-level clauses">
                    <p>
                        The exact-value leaves are the ones worth learning as shapes
                        rather than as ideas: all four ask a similar question, and all
                        four are written differently. Three wrap the field name as a
                        key and one does not, one takes an object of options and one
                        takes none at all. Mixing them up produces a classic 400, and
                        occasionally something quieter.
                    </p>
                    <p>
                        <Code>term</Code>{" "}wraps the field name around an object
                        holding <Code>value</Code>, and accepts a short form that
                        collapses it.
                    </p>
                    <CodeBlock code={TERM_SHAPE} lang="jsonc" />
                    <p>
                        <Code>terms</Code>{" "}maps the field name straight to an array.
                        There is no <Code>value</Code>{" "}key and no object form to put
                        one in.
                    </p>
                    <CodeBlock code={TERMS_SHAPE} lang="json" />
                    <p>
                        <Code>range</Code>{" "}wraps the field name around an object of
                        operators, any of which can be combined.
                    </p>
                    <CodeBlock code={RANGE_SHAPE} lang="jsonc" />
                    <p>
                        <Code>format</Code>{" "}applies to date fields only and says how
                        the bounds themselves are to be parsed — it does not change how
                        the field is stored.
                    </p>
                    <p>
                        <Code>exists</Code>{" "}is the odd one. There is no field-as-key
                        here at all: the field name is a <em>value</em>, under the
                        literal key <Code>field</Code>.
                    </p>
                    <CodeBlock code={EXISTS_SHAPE} lang="json" />
                    <p>
                        Side by side, the four shapes are easier to keep apart than any
                        description of them:
                    </p>
                    <CodeBlock code={FOUR_SHAPES} lang="text" />
                    <p>
                        <Term>
                            <Code>terms</Code>{" "}carries no options of its own.
                        </Term>{" "}
                        It is pure set membership — a document matches when the field
                        holds any value in the list. Anything that needs per-value
                        behaviour is several <Code>term</Code>{" "}clauses inside a{" "}
                        <Code>bool</Code>, not a parameter on <Code>terms</Code>.
                    </p>

                    <Callout severity="trap" label="trap · exists breaks the pattern">
                        <p>
                            <Code>{`{ "exists": { "field_name": ... } }`}</Code>{" "}is
                            invalid however natural it looks after writing the other
                            three. The key is literally <Code>&quot;field&quot;</Code>{" "}
                            and the field name is the string beside it — the one clause
                            on this page where the field is not a key.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · short forms are conveniences">
                        <p>
                            <Code>term</Code>{" "}has one and <Code>terms</Code>{" "}does not;
                            neither does <Code>range</Code>{" "}or{" "}
                            <Code>exists</Code>. A short form is never required, so a
                            query builder that always emits the long shape is never
                            wrong — which is one fewer decision in generated queries.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — back to the top level ---------- */}
            <PartHeading kicker="part 3">Beyond query</PartHeading>
            <div>
                <DocSection title="level 1 again: the shape of aggs and suggest">
                    <p>
                        Two level-1 slots have a structure of their own, and both are
                        covered in full elsewhere — <Code>aggs</Code>{" "}in
                        Aggregations, <Code>suggest</Code>{" "}in Search UX. What belongs
                        here is only their skeleton, because both are built from a
                        pattern that is easier to learn once, in the abstract, than
                        twice while also learning what the types do.
                    </p>
                    <p>
                        An aggregation is three levels deep, and each level belongs to
                        a different author:
                    </p>
                    <CodeBlock code={AGGS_SKELETON} lang="jsonc" />
                    <p>
                        Level 1 is a name you invent — any name — and it is what keys
                        the aggregation in the response, so it is worth naming for the
                        code that will read it. Level 2 is Elasticsearch&apos;s
                        vocabulary: <Code>terms</Code>, <Code>avg</Code>,{" "}
                        <Code>max</Code>, <Code>histogram</Code>{" "}and the rest, each
                        with its own parameters underneath. Level 3 is optional and is
                        the same structure again — a nested <Code>aggs</Code>{" "}that
                        runs inside each bucket the level above produced, which is what
                        a drill-down like &ldquo;per bucket, a metric&rdquo; is made
                        of.
                    </p>
                    <p>
                        That nesting is the same recursion <Code>bool</Code>{" "}uses:
                        a structure that contains itself, with nothing new introduced
                        at any depth.
                    </p>
                    <p>
                        Several aggregations in one request are siblings under the same{" "}
                        <Code>aggs</Code>, not a list:
                    </p>
                    <CodeBlock code={AGGS_SIBLINGS} lang="json" />
                    <p>
                        Each of them keys its own entry in the response, computed over
                        the same matching set.
                    </p>
                    <p>
                        <Code>suggest</Code>{" "}follows the identical pattern with one
                        extra key: the text being corrected or completed.
                    </p>
                    <CodeBlock code={SUGGEST_SKELETON} lang="jsonc" />
                    <p>
                        The suggester type is one of <Code>term</Code>,{" "}
                        <Code>phrase</Code> or <Code>completion</Code>, and its
                        parameters — starting with the field to draw suggestions from —
                        sit underneath it.
                    </p>
                    <p>
                        <Term>Both slots share one pattern.</Term>{" "}A label you
                        invent, a type from Elasticsearch, and that type&apos;s
                        parameters.
                    </p>
                    <CodeBlock code={SHARED_PATTERN} lang="text" />
                    <p>
                        When the Aggregations and Search UX pages open, the structure
                        will already be familiar and only the types and their
                        parameters will be new.
                    </p>

                    <Callout severity="tip" label="tip · name aggregations for the reader">
                        <p>
                            The label is free-form, so it is the one place in a request
                            where you can be helpful to whoever parses the response.
                            A name that describes the number it produces beats one that
                            repeats the aggregation type, because the type is already
                            written on the next line.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · these slots do not filter">
                        <p>
                            <Code>aggs</Code> and <Code>suggest</Code>{" "}add to the
                            response; they never remove a hit from it. An aggregation
                            summarises whatever <Code>query</Code>{" "}matched, and a
                            suggester works from the text you hand it — so neither can
                            explain a missing document.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
