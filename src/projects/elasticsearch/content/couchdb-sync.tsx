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
    // --- part 1 (Why a Separate Process) ---
    "the-problem-keeping-two-stores-in-sync": ["danger", "tip", "note"],

    // --- part 2 (The Feed) ---
    "the-changes-feed": ["trap", "tip", "note"],

    // --- part 3 (The Sync) ---
    "building-the-sync-loop": ["trap", "tip", "note"],
    "handling-each-change-three-decisions": ["trap", "tip", "note"],

    // --- part 4 (The Production Gaps) ---
    "production-gap-1-persist-the-position": ["danger", "tip", "note"],
    "production-gap-2-retries-and-poison-documents": ["trap", "tip", "note"],
    "production-gap-3-catch-precisely": ["danger", "trap", "note"],

    // --- part 5 (Rebuilding) ---
    "zero-downtime-rebuild": ["trap", "tip", "note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper the introduction, documents-indices, mappings-analysis,
// search-queries, queries-structure and settings-structure content files each
// define for their own part dividers.
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
//
// THIS PAGE'S OWN RULE: it is a BUILD GUIDE. Every fragment is "here is the
// code you write", never a tour of a module that already exists somewhere else.
// Node is the primary form, because a sync is a Node process; curl appears only
// for the CouchDB HTTP calls the reader can paste into Postman and try by hand.

// ===================================================================
// part 1 — why a separate process
// ===================================================================

const DUAL_WRITES = `// the naive version: the API route writes to both stores itself
export async function POST(req: Request) {
    const movie = await req.json();

    await couchdb.insert(movie);            // write 1 — the database

    await esClient.index({                  // write 2 — what if THIS fails?
        index: "movies",
        id: movie._id,
        document: movie,
    });

    return Response.json({ ok: true });
}`;

const DUAL_FAILURE = `write 1   couchdb.insert(movie)   ->  OK, the document is stored
write 2   esClient.index(movie)   ->  throws (ES restarting, network blip)

CouchDB has the movie.  Elasticsearch does not.
Nothing will ever notice, and nothing will ever fix it.`;

const RIGHT_SHAPE = `API  ->  CouchDB  ->  _changes  ->  sync process  ->  index/delete  ->  ES
         ^                                                              ^
    one writer,                                              derived data,
    source of truth                                           rebuildable`;

// ===================================================================
// part 2 — the feed
// ===================================================================

const CHANGES_CURL = `curl -u admin:password \\
  'http://localhost:5984/movies/_changes?since=0&include_docs=true'`;

const CHANGES_REPLY = `{
  "results": [
    {
      "seq": "3-g1AAAACbeJzLYWBg...",   // this entry's position in the log
      "id":  "movie_155",               // the document that changed
      "changes": [ { "rev": "2-9f3c..." } ],
      "doc": {                          // present because include_docs=true
        "_id":   "movie_155",
        "_rev":  "2-9f3c...",
        "title": "The Dark Knight",
        "year":  2008
      }
    },
    {
      "seq": "4-g1AAAACbeJzLYWBg...",
      "id":  "movie_600",
      "changes": [ { "rev": "3-1ab7..." } ],
      "deleted": true                   // no "doc" — the document is gone
    }
  ],
  "last_seq": "4-g1AAAACbeJzLYWBg...", // where to resume from next time
  "pending": 0
}`;

const SEQ_LOG = `seq 1    movie_155 created      the counter ticks
seq 2    person_42 created      the counter ticks
seq 3    movie_155 updated      the counter ticks — same doc, new position
seq 4    movie_600 deleted      the counter ticks — a delete is a write too

one counter for the whole database, never per document, never reset`;

const SEQ_LATEST_ONLY = `movie_155 written at seq 1, rewritten at seq 3, rewritten again at seq 7

GET /movies/_changes?since=0

    ...
    { "seq": 7, "id": "movie_155" }      <- once, at its LATEST position

the feed remembers where each document currently stands,
not every step it took to get there`;

const CRASH_SCENARIO = `sync process reads up to seq 2, then dies
    40 writes happen while it is down    ->  the database is now at seq 42

restart with since=2     ->  40 entries arrive  ->  caught up, nothing lost
restart with since=now   ->  0 entries arrive   ->  those 40 changes are
                                                    gone, as far as the sync
                                                    is ever concerned`;

const PEEK_CURL = `# what position is this database at right now?
curl -u admin:password \\
  'http://localhost:5984/movies/_changes?descending=true&limit=1'`;

// ===================================================================
// part 3 — the sync
// ===================================================================

const LOOP_SHAPE = `1  ask the feed for everything since a position
2  process each entry that comes back
3  remember the position it answered with
4  ask again, starting from that position

every changes-based sync ever written is this loop`;

const POLL_LOOP = `const COUCH = "http://admin:password@localhost:5984/movies";

async function pollChanges(since: string) {
    const url =
        COUCH + "/_changes" +
        "?feed=longpoll" +      // hold the request open until a write
        "&since=" + since +     // resume where the last answer left off
        "&include_docs=true" +  // entries carry the doc, so no second fetch
        "&heartbeat=10000" +    // a newline every 10s, so proxies see life
        "&timeout=60000";       // answer with an empty result set after 60s

    const res  = await fetch(url);          // <- the process waits HERE
    const data = await res.json();

    for (const change of data.results) {
        await processChange(change);
    }

    return pollChanges(data.last_seq);   // ask again, from the new position
}

pollChanges("now");`;

const LONGPOLL_STEPS = `1  the sync sends the request
2  nothing has changed yet
3  CouchDB does NOT respond — it holds the socket open and waits
4  someone writes a document
5  NOW CouchDB responds, with that one change
6  the connection closes — one request, one answer

the waiting happens inside the fetch call: the function is suspended on
that line, using nothing. The call at the end starts the next request:

    request -> hang -> answer -> process -> request -> hang -> ...

functionally a while(true), where the sleep is CouchDB holding the socket.`;

const EMPTY_TIMEOUT = `{ "results": [], "last_seq": "42-g1AAAAC..." }

the for..of body never runs, and the loop asks again from 42`;

const ERROR_WRAPPER = `async function pollChanges(since: string) {
    try {
        const res  = await fetch(buildUrl(since));
        const data = await res.json();

        for (const change of data.results) {
            await processChange(change);
        }

        return pollChanges(data.last_seq);
    } catch (err) {
        console.error("changes feed error:", err);

        await new Promise((r) => setTimeout(r, 5000));
        return pollChanges(since);      // the SAME since — nothing skipped
    }
}`;

// ===================================================================
// part 3 — handling a change
// ===================================================================

const SHARE_ID = `async function processChange(change) {
    if (change.deleted) return handleDelete(change.id);

    await esClient.index({
        index: "movies",
        id: change.id,        // the CouchDB _id — never a generated one
        document: project(change.doc),
    });
}`;

const IDEMPOTENT_RUNS = `movie_155 updated in CouchDB
    -> feed entry for movie_155
    -> index into ES with _id "movie_155"
    -> the existing ES document is REPLACED

the same entry replayed after a crash
    -> index into ES with _id "movie_155"
    -> the existing ES document is replaced with the identical content

once or five times, the index ends up in the same state`;

const ID_PREFIXES = `movie_155     ->  the movies index
movie_600     ->  the movies index
person_42     ->  the persons index
person_1138   ->  the persons index

the routing information is IN the id, so it survives the document`;

const DELETE_ROUTING = `function indexFor(id: string) {
    if (id.startsWith("movie_"))  return "movies";
    if (id.startsWith("person_")) return "persons";
    return null;                     // not ours to mirror — ignore it
}

async function handleDelete(id: string) {
    const index = indexFor(id);   // the id alone is enough: no doc needed
    if (!index) return;

    await esClient.delete({ index, id });
}`;

const PROJECTION = `function project(doc) {
    return {
        title:    doc.title,          // searched
        overview: doc.overview,       // searched
        year:     doc.year,           // filtered and sorted
        genres:   doc.genres,         // faceted
        poster:   doc.poster_path,    // displayed with the hit
    };
    // _rev, _attachments, editorial notes, import bookkeeping: all dropped.
}`;

// ===================================================================
// part 4 — the production gaps
// ===================================================================

const DIVERGENCE_TIMELINE = `09:00   sync running, at seq 812
09:14   deploy — the process restarts, and starts from "now" (seq 851)
09:14   seqs 813..851 are never read

39 changes exist in CouchDB and will never reach Elasticsearch.
No error, no warning, no log line — just an index that is quietly wrong.`;

const CHECKPOINT_CODE = `async function pollChanges(since: string) {
    const res  = await fetch(buildUrl(since));
    const data = await res.json();

    for (const change of data.results) {
        await processChange(change);
    }

    await saveCheckpoint(data.last_seq);   // AFTER the batch is processed
    return pollChanges(data.last_seq);
}

// on startup: resume where the last run stopped, or start from now on a
// genuinely first run (paired with a full import — see the rebuild section)
const since = (await loadCheckpoint()) ?? "now";
pollChanges(since);`;

const CHECKPOINT_ORDER = `save AFTER processing
    crash mid-batch  ->  the checkpoint is still the OLD position
                     ->  restart replays the whole batch
                     ->  idempotent processing absorbs the repeats

save BEFORE processing
    crash mid-batch  ->  the checkpoint already moved past the batch
                     ->  restart resumes AFTER it
                     ->  the unprocessed half is lost, permanently`;

const RETRY_HELPER = `// LEVEL 1 — retry the one write that failed, in place.
async function withRetries<T>(fn: () => Promise<T>, attempts = 3) {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === attempts - 1) throw err;   // exhausted — hand it up

            const wait = 1000 * Math.pow(2, i);  // 1s, then 2s, then 4s
            console.warn("retrying in " + wait + "ms");
            await new Promise((r) => setTimeout(r, wait));
        }
    }
    throw new Error("unreachable");
}`;

const RETRY_LOOP = `for (const change of data.results) {
    try {
        // LEVEL 1: a restart or a 429 is absorbed here — the batch
        // never notices.
        await withRetries(() => processChange(change));
    } catch (err) {
        // LEVEL 2: it failed three times — this document is POISON.
        // Do NOT rethrow: that would stall every change queued behind
        // it, forever, for the sake of one document.
        console.error("DEAD-LETTER", change.id, err.message);
    }
}

await saveCheckpoint(data.last_seq);`;

const DEAD_LETTER_LOG = `DEAD-LETTER movie_9931 mapper_parsing_exception: failed to parse [year]
DEAD-LETTER movie_9944 mapper_parsing_exception: failed to parse [year]

two documents to re-index by hand once the mapping is fixed —
and 4,000 changes that flowed through untouched while they failed`;

const BLANKET_CATCH = `try {
    await esClient.delete({ index, id });
} catch {
    // "it's probably just a 404"
}`;

const PRECISE_CATCH = `try {
    await esClient.delete({ index, id });
} catch (err) {
    if (err.meta?.statusCode === 404) return;  // expected: never indexed
    throw err;                                 // everything else is real
}`;

// ===================================================================
// part 5 — rebuilding
// ===================================================================

const ALIAS_SHAPE = `search API  ─┐
             ├─>  alias "movies"  ──>  physical index movies_v1
sync process ─┘

nobody names movies_v1 — not the app, not the sync, not a script`;

const REBUILD_STEPS = `1  create movies_v2 with the new mapping
2  run the full import from CouchDB into movies_v2
3  the sync keeps writing through the alias — so into movies_v1
       users search v1 and see fresh data the whole time
4  move the alias from v1 to v2, in ONE request
5  delete movies_v1`;

const ALIAS_SWAP = `await esClient.indices.updateAliases({
    actions: [
        { remove: { index: "movies_v1", alias: "movies" } },
        { add:    { index: "movies_v2", alias: "movies" } },
    ],
});`;

const SWAP_GAP = `T+0min    note nothing, start the import into v2
T+0min    import reads CouchDB as it stands
T+2min    import finishes
T+2min    a user edits movie_155  ->  sync writes it via the alias, to v1
T+3min    a user adds movie_9000  ->  sync writes it via the alias, to v1
T+4min    alias swaps to v2

v2 goes live without either change. They are in CouchDB and in v1,
and v1 is about to be deleted.`;

const SWAP_FIX = `1  read the current position   S = last_seq from ?descending=true&limit=1
2  run the full import into movies_v2
3  swap the alias to movies_v2
4  replay the feed from S into movies_v2

everything written during the import window arrives in step 4;
anything the import already had is replaced with itself — harmless.`;

export function CouchdbSyncDocs() {
    return (
        <>
            {/* Page lead. Frames what this page is FOR before the first divider:
                it is a build guide, so every fragment below is code the reader
                writes rather than code being toured. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    CouchDB owns the data and Elasticsearch answers the searches.
                    That split is the right one, and it leaves exactly one problem
                    behind: every write that lands in CouchDB has to reach
                    Elasticsearch, in order, including the deletes, including the
                    ones that happen while the search layer is down. This page
                    builds that pipe from nothing.
                </p>
                <p>
                    It is written as a build guide. Each section adds the next piece
                    — the naive approach and why it fails, the feed CouchDB exposes,
                    the loop that reads it, the three decisions that make processing
                    safe to repeat, and the three gaps that separate a demo from a
                    sync you can leave running. The last section rebuilds the whole
                    index while all of it keeps flowing.
                </p>
                <p>
                    The code is Node, because a sync is a Node process — a long-lived
                    one, running beside your app rather than inside a request.{" "}
                    <Code>curl</Code>{" "}appears only where CouchDB is being asked
                    something over HTTP, since those URLs are worth pasting into a
                    browser or Postman and watching answer for yourself.
                </p>
            </div>

            {/* ---------- part 1 — why a separate process ---------- */}
            <PartHeading kicker="part 1">Why a Separate Process</PartHeading>
            <div>
                <DocSection title="the problem: keeping two stores in sync">
                    <p>
                        Two systems now hold the same movies: CouchDB, which the
                        application writes to, and Elasticsearch, which the search
                        box reads from. The moment a movie is created, edited or
                        deleted, those two stores disagree until something makes them
                        agree again. The entire design question is <em>what</em>{" "}
                        that something is — and the obvious answer is the wrong one.
                    </p>
                    <p>
                        <Term>The naive approach writes to both stores from the API
                        route.</Term>{" "}It is the first thing anyone reaches for,
                        and it reads perfectly reasonably:
                    </p>
                    <CodeBlock code={DUAL_WRITES} lang="ts" />
                    <p>
                        Two writes, one after the other, in one handler. Nothing about
                        that code looks dangerous — which is precisely why this is
                        worth being explicit about.
                    </p>
                    <p>
                        <Term>The failure mode is the second write.</Term>{" "}
                        Elasticsearch is restarting after a deploy, or the network
                        blips for a second, or a bulk queue is momentarily full. The
                        first write already succeeded.
                    </p>
                    <CodeBlock code={DUAL_FAILURE} lang="text" />
                    <p>
                        The document exists in the database and not in the index. It
                        is not late, it is <em>missing</em>: nothing is going to
                        retry it, because the request is over and the movie looks
                        saved to everyone involved. The user searches for the film
                        they just added and it is not there — a week later, still not
                        there.
                    </p>
                    <p>
                        <Term>No amount of retry logic in the endpoint fixes
                        this.</Term>{" "}Wrapping write 2 in retries narrows the
                        window; it does not close it, because the process can die
                        between the two calls, and because a retry that also fails
                        leaves you exactly where you started. What is actually wanted
                        is a transaction spanning both stores, and there is no such
                        thing: CouchDB and Elasticsearch share no transaction log, no
                        coordinator, no two-phase commit. Atomicity across two systems
                        that do not know about each other cannot be bought at the call
                        site.
                    </p>
                    <p>
                        <Term>The fix is to stop writing to two stores at
                        once.</Term>{" "}Invert the flow: the API writes only to
                        CouchDB, and a separate process watches CouchDB and mirrors
                        every change into Elasticsearch.
                    </p>
                    <CodeBlock code={RIGHT_SHAPE} lang="text" />
                    <p>
                        Three properties fall out of that shape. There is{" "}
                        <em>one writer per store</em>, so nothing has to be atomic
                        across a boundary — the API&apos;s write either lands in
                        CouchDB or it does not, and the sync&apos;s write either lands
                        in Elasticsearch or it is retried. The sync can{" "}
                        <em>crash and catch up</em>, because the feed remembers the
                        position it had reached and hands over everything since. And
                        Elasticsearch becomes <em>derived data</em>: if the index is
                        wrong, corrupted, or simply needs a different mapping, it can
                        be deleted and rebuilt from CouchDB, which is a very different
                        feeling from an index you are afraid to touch.
                    </p>
                    <p>
                        The rest of this page builds the box in the middle of that
                        diagram.
                    </p>

                    <Callout severity="danger" label="danger · dual writes fail silently">
                        <p>
                            The reason dual writes survive so long in codebases is
                            that they never announce themselves. There is no error to
                            catch, no alert to fire, no row marked broken — just an
                            index that drifts a little further from the database with
                            every failed second write, until someone notices that
                            search results are wrong and cannot say when it started.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · pick the source of truth explicitly">
                        <p>
                            CouchDB is the source of truth and Elasticsearch is a
                            derived view of it. Say that out loud once and a lot of
                            decisions become easy: no data ever originates in the
                            index, nothing is ever written there by hand, and
                            rebuilding it is a routine operation rather than a crisis.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · this is not CouchDB-specific">
                        <p>
                            The same shape works anywhere the database can emit an
                            ordered log of its own writes — MongoDB change streams,
                            Postgres logical replication, MySQL binlog. CouchDB is
                            unusually pleasant about it because the log is exposed as
                            plain HTTP, but the pattern and every gap in it transfer
                            unchanged.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the feed ---------- */}
            <PartHeading kicker="part 2">The Feed</PartHeading>
            <div>
                <DocSection title="the _changes feed">
                    <p>
                        CouchDB keeps an internal, ordered log of every write it has
                        accepted. It is not an add-on and not something you enable —
                        replication is built on it, so it is always there.{" "}
                        <Code>_changes</Code>{" "}is the endpoint that exposes that log
                        over HTTP, and it answers exactly one kind of question:{" "}
                        <em>what has happened since position X?</em>
                    </p>
                    <p>
                        The simplest useful form asks for everything from the
                        beginning, with the documents included. This is a plain GET —
                        paste it into Postman or a browser and it answers immediately:
                    </p>
                    <CodeBlock code={CHANGES_CURL} lang="bash" />
                    <p>
                        What comes back is a list of entries and a position to resume
                        from:
                    </p>
                    <CodeBlock code={CHANGES_REPLY} lang="jsonc" />
                    <p>
                        Each entry says <em>which</em>{" "}document changed and{" "}
                        <em>where</em>{" "}in the log that happened;{" "}
                        <Code>last_seq</Code>{" "}is the position of the final entry,
                        which is what the next request will ask to continue from. Note
                        the second entry: it has <Code>deleted: true</Code>{" "}and no{" "}
                        <Code>doc</Code>{" "}at all. That asymmetry drives a design
                        decision two sections from now.
                    </p>
                    <p>
                        <Term>Three query parameters do all the work.</Term>{" "}
                        <Code>since</Code>{" "}is the cursor — the position to read
                        from, where <Code>now</Code>{" "}means only what happens from
                        this moment on and <Code>0</Code>{" "}means the entire history
                        the database still holds. <Code>include_docs=true</Code>{" "}
                        makes each entry carry the full document, without which you
                        would fire one extra fetch per change to go and get it.{" "}
                        <Code>feed=longpoll</Code>{" "}changes how the request waits,
                        and is the subject of the next section.
                    </p>
                    <p>
                        <Term>How sequences work.</Term>{" "}Every write advances the
                        sequence — a create, an update and a delete each take the next
                        position, because to CouchDB all three are the same thing: a
                        new revision of a document. Think of it as the database&apos;s
                        odometer: one global counter, one per database, ticking
                        forward on every change and never running backwards.
                    </p>
                    <CodeBlock code={SEQ_LOG} lang="text" />
                    <p>
                        You never create a sequence. You read one out of a response,
                        remember it, and hand it back on the next request; that is the
                        whole of your relationship with it.
                    </p>
                    <p>
                        <Term>A document changed twice appears once, at its latest
                        position.</Term>{" "}The feed is not an audit trail of every
                        revision — it is a set of per-document positions, and rewriting
                        a document moves that document forward rather than adding a
                        second entry.
                    </p>
                    <CodeBlock code={SEQ_LATEST_ONLY} lang="text" />
                    <p>
                        This is what makes replaying a large backlog cheap: a document
                        edited two hundred times during an outage still costs you one
                        entry and one write into Elasticsearch.
                    </p>
                    <p>
                        <Term>The sequence is what makes crashing survivable.</Term>{" "}
                        This is the scenario the whole design exists for, and it is
                        worth walking through with numbers.
                    </p>
                    <CodeBlock code={CRASH_SCENARIO} lang="text" />
                    <p>
                        Same crash, same forty changes, two completely different
                        outcomes — and the only difference is the value of{" "}
                        <Code>since</Code>{" "}on restart. Holding onto that number is
                        therefore the single most important thing the sync does, and
                        it is exactly what the first production gap is about.
                    </p>
                    <p>
                        <Term>Sequence tokens are opaque.</Term>{" "}In a real CouchDB
                        the value looks like{" "}
                        <Code>3-g1AAAACbeJzLYWBg...</Code>{" "}— a base64 blob encoding
                        per-shard positions, not a number with a 3 in it. Never parse
                        one, never compare two, never try to compute the &ldquo;next&rdquo;
                        one. Store the string, send the string back.
                    </p>
                    <p>
                        <Term>Exploring by hand is worth doing before writing any
                        code.</Term>{" "}The endpoint is a normal URL with basic auth,
                        so Postman or a browser is enough, and there is one call that
                        answers &ldquo;where is this database right now?&rdquo; without
                        dumping the entire log:
                    </p>
                    <CodeBlock code={PEEK_CURL} lang="bash" />
                    <p>
                        Reading the log backwards and stopping after one entry gives
                        you the current head. Edit a document in Fauxton, run it again,
                        and watch the position move — that is the whole mechanism,
                        visible in two requests.
                    </p>
                    <p>
                        <Term>Deletes arrive in the same feed as everything
                        else.</Term>{" "}There is no separate deletions endpoint and no
                        second stream to subscribe to. One pipe carries creates,
                        updates and deletes, and a delete is simply an entry with{" "}
                        <Code>deleted: true</Code>{" "}and no document attached. A sync
                        that reads the feed and ignores that flag will happily keep
                        serving search results for movies that no longer exist.
                    </p>

                    <Callout severity="trap" label="trap · feed=longpoll hangs when you are exploring">
                        <p>
                            Add <Code>feed=longpoll</Code>{" "}to a URL you are poking
                            at by hand and the request appears to freeze. It is not
                            broken — that is the parameter doing its job, holding the
                            connection open until something changes. When exploring,
                            leave it off entirely; add it only in the sync loop, where
                            waiting is the point.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · include_docs, or pay per change">
                        <p>
                            Without <Code>include_docs=true</Code>{" "}an entry gives
                            you an id and a revision, and you must fetch the document
                            yourself before you can index it. That is one extra HTTP
                            round trip per change, forever, to avoid sending fields
                            you were about to ask for anyway.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · compaction and since=0">
                        <p>
                            <Code>since=0</Code>{" "}replays the history CouchDB still
                            holds, which is the current state of every live document
                            plus the tombstones it has not yet compacted away. It is
                            not a guarantee of every write that ever happened — but as
                            a way to populate an empty index it is complete, since
                            every existing document appears exactly once.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — the sync ---------- */}
            <PartHeading kicker="part 3">The Sync</PartHeading>
            <div>
                <DocSection title="building the sync loop">
                    <p>
                        With the feed understood, the process that reads it is small.
                        Every changes-based sync — for CouchDB, for Mongo, for a
                        binlog — is the same four steps repeated forever, and it helps
                        to have them in front of you before the code.
                    </p>
                    <CodeBlock code={LOOP_SHAPE} lang="text" />
                    <p>
                        Written out, that is one recursive function. Read it once as a
                        whole; the parts that deserve explaining are explained
                        underneath.
                    </p>
                    <CodeBlock code={POLL_LOOP} lang="ts" />
                    <p>
                        The URL carries the four parameters the loop depends on.{" "}
                        <Code>since</Code>{" "}is where to resume — supplied by the
                        caller, so the function has no memory of its own.{" "}
                        <Code>include_docs</Code>{" "}means the entries arrive ready to
                        index. <Code>heartbeat</Code>{" "}and{" "}
                        <Code>timeout</Code>{" "}keep a long wait healthy, and both are
                        covered below. The <Code>for..of</Code>{" "}is deliberately
                        sequential: <Code>await</Code>{" "}inside it processes one change
                        at a time, in feed order, which is what keeps two edits to the
                        same document from racing each other into the index. And the
                        last line hands <Code>last_seq</Code>{" "}to the next call, which
                        is what makes the loop a loop.
                    </p>
                    <p>
                        <Term>How longpoll actually works.</Term>{" "}The name suggests
                        polling in a tight circle, which is the opposite of what
                        happens. Step by step:
                    </p>
                    <CodeBlock code={LONGPOLL_STEPS} lang="text" />
                    <p>
                        The important consequence is that there is no interval, no{" "}
                        <Code>setInterval</Code>, and no wasted request. Between
                        changes the sync consumes nothing at all — it is a suspended
                        async function and an open TCP connection. When a write lands
                        in CouchDB, the response arrives in milliseconds.
                    </p>
                    <p>
                        <Term>The timeout is a safety valve, not a schedule.</Term>{" "}
                        If nothing happens for sixty seconds CouchDB answers anyway,
                        with an empty result set:
                    </p>
                    <CodeBlock code={EMPTY_TIMEOUT} lang="jsonc" />
                    <p>
                        The loop processes nothing, calls itself with the position it
                        was given, and hangs again. A quiet database means one request
                        a minute doing nothing — the connection gets recycled and
                        neither side is left holding a socket open indefinitely.
                    </p>
                    <p>
                        <Term>The heartbeat exists because of what sits between the
                        two machines.</Term>{" "}Proxies, load balancers and container
                        networks kill connections that have been silent too long, and
                        sixty seconds is a very common default. A longpoll request
                        during a quiet hour is exactly that: an open connection sending
                        nothing.
                    </p>
                    <p>
                        <Code>heartbeat=10000</Code>{" "}tells CouchDB to send a newline
                        every ten seconds while it waits. The newline means nothing —
                        it is not an event, it carries no data, and JSON parsing never
                        sees it, because the response body is only parsed once the real
                        answer arrives. Its entire job is to look alive to whatever is
                        in the middle. It costs one byte per ten seconds and removes an
                        entire class of &ldquo;the sync stops working after a few
                        minutes in production&rdquo; bug.
                    </p>
                    <p>
                        <Term>An error must never end the loop.</Term>{" "}As written
                        above, one failed fetch — CouchDB restarting, DNS hiccup — is
                        an unhandled rejection and the process is finished. Wrap the
                        body, wait, and go again from the same position:
                    </p>
                    <CodeBlock code={ERROR_WRAPPER} lang="ts" />
                    <p>
                        Two details make this safe. The retry uses{" "}
                        <Code>since</Code>{" "}and not <Code>data.last_seq</Code>, so
                        nothing between the two is skipped — a failure means the batch
                        was never confirmed, and asking for it again is correct. And
                        re-requesting a batch that was partly processed is harmless,
                        because processing a change twice produces the same result as
                        processing it once. That property is not an accident; it is
                        designed for in the next section.
                    </p>
                    <p>
                        <Term>Where to start on a very first run.</Term>{" "}
                        <Code>&quot;now&quot;</Code>{" "}is right when it is paired with
                        a full import: import everything that exists, start the sync at{" "}
                        <Code>now</Code>, and the two together cover the whole
                        database. <Code>0</Code>{" "}replays the history instead, which
                        also works and is slower. Neither is the answer for a{" "}
                        <em>restart</em>, though — that answer is a position you saved
                        earlier, which is the first production gap.
                    </p>

                    <Callout severity="trap" label="trap · recursion here is not a stack leak">
                        <p>
                            <Code>return pollChanges(...)</Code>{" "}inside an async
                            function looks like unbounded recursion, but each call
                            resolves through the microtask queue rather than nesting a
                            frame — the awaited promise settles and the previous
                            invocation completes. The one thing to preserve is the{" "}
                            <Code>return</Code>: dropping it detaches the next
                            iteration from the promise chain and any error it throws
                            becomes unhandled.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · run the sync as its own process">
                        <p>
                            This loop wants to be a standalone Node process with its
                            own lifecycle, not something started from an API route or a
                            Next.js module. Serverless and per-request runtimes freeze
                            or recycle whatever is not answering a request, which is
                            precisely what a long-held connection is.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · one worker per feed">
                        <p>
                            Scaling this by running three copies does not triple
                            throughput — it triples the same work, since each reads the
                            same feed and writes the same documents. Idempotency keeps
                            that from corrupting anything, but it buys nothing. If
                            indexing is genuinely the bottleneck, batch the writes with
                            the bulk API rather than duplicating the reader.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="handling each change: three decisions">
                    <p>
                        <Code>processChange</Code>{" "}was a placeholder in the loop
                        above. Filling it in takes three decisions, and all three are
                        the kind that are trivial to make now and expensive to change
                        once a million documents have been written under the old
                        answer.
                    </p>
                    <p>
                        <Term>Decision 1 — the two stores share the
                        identifier.</Term>{" "}The Elasticsearch{" "}
                        <Code>_id</Code>{" "}is the CouchDB <Code>_id</Code>, copied
                        verbatim, with nothing generated and nothing derived.
                    </p>
                    <CodeBlock code={SHARE_ID} lang="ts" />
                    <p>
                        <Term>Sharing the id is what makes the sync
                        idempotent.</Term>{" "}Indexing into Elasticsearch with an id
                        that already exists is a full replace, not an insert — so
                        every path through the system converges on the same state:
                    </p>
                    <CodeBlock code={IDEMPOTENT_RUNS} lang="text" />
                    <p>
                        Processing a change once or five times is identical. That one
                        property is what licenses everything else on this page: the
                        loop retrying a whole batch after an error, a crash replaying
                        the changes since the last checkpoint, the overlap between an
                        import and a replay during a rebuild. All of it is safe
                        because a repeat is a no-op.
                    </p>
                    <p>
                        Generated ids destroy that instantly. Let Elasticsearch assign
                        an id and every replayed change becomes a duplicate document,
                        and every update becomes a second copy while the original is
                        orphaned — the same movie appearing three times in the results,
                        two of them stale.
                    </p>
                    <p>
                        <Term>Decision 2 — put the routing information inside the
                        id.</Term>{" "}This one is forced by deletes. A delete entry
                        carries no document, and it physically cannot: the document is
                        gone from CouchDB, so there is nothing to include. No document
                        means no <Code>type</Code>{" "}field, no collection name, no
                        payload of any kind to route by. All that survives is the id —
                        so the id has to be enough.
                    </p>
                    <CodeBlock code={ID_PREFIXES} lang="text" />
                    <p>
                        With prefixed ids the delete handler works from the id alone,
                        and the routing is a string comparison:
                    </p>
                    <CodeBlock code={DELETE_ROUTING} lang="ts" />
                    <p>
                        Bare numeric ids leave you with two bad options: issue a delete
                        against every index and swallow the misses, or maintain a
                        separate id-to-type registry that is itself a second store to
                        keep in sync — the very problem this page exists to avoid. The
                        general rule is to design identifiers for the worst-informed
                        consumer, and here that is the delete handler: it knows a
                        string and nothing else.
                    </p>
                    <p>
                        <Term>Decision 3 — project the document, do not mirror
                        it.</Term>{" "}It is tempting to pass <Code>change.doc</Code>{" "}
                        straight through. Index instead the fields search actually
                        needs, and drop <Code>_rev</Code>{" "}and the rest of the
                        internals:
                    </p>
                    <CodeBlock code={PROJECTION} lang="ts" />
                    <p>
                        Two things are bought by that. The mapping stays intentional —
                        with dynamic mapping on, a surprise field in one document gets
                        a type guessed from its first value, and a field guessed wrong
                        cannot be corrected without a reindex. And documents stay
                        small, which matters more here than usual: an update rewrites
                        the entire document, so every byte you index is a byte rewritten
                        on every edit, stored in{" "}
                        <Code>_source</Code>, and shipped back with every hit.
                    </p>

                    <Callout severity="trap" label="trap · _rev has no meaning in Elasticsearch">
                        <p>
                            Copying CouchDB&apos;s <Code>_rev</Code>{" "}across looks
                            like preserving version information, but Elasticsearch has
                            its own <Code>_version</Code>{" "}and ignores yours
                            completely. It becomes an ordinary indexed string that
                            changes on every single write — pure churn in the index,
                            and misleading to anyone reading a document later.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · one prefix per index, chosen once">
                        <p>
                            Fix the prefixes at the moment you decide what CouchDB ids
                            look like, before the first document exists. Renaming a
                            prefix afterwards means rewriting every id in the database,
                            since the id is the one field that cannot be edited in
                            place — a delete and a re-create per document.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · not every document is yours to mirror">
                        <p>
                            A CouchDB database usually holds more than the entities you
                            search: design documents (<Code>_design/...</Code>),
                            configuration, migration bookkeeping. Returning{" "}
                            <Code>null</Code>{" "}from the router for anything with an
                            unrecognised prefix skips them by default, which is safer
                            than a filter that has to be remembered.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the production gaps ---------- */}
            <PartHeading kicker="part 4">The Production Gaps</PartHeading>
            <div>
                <DocSection title="production gap 1: persist the position">
                    <p>
                        The loop as it stands works perfectly for as long as it runs,
                        and forgets everything the moment it stops. The position it was
                        reading from lives in a function argument, and a function
                        argument does not survive a deploy, a crash, or a container
                        being rescheduled.
                    </p>
                    <p>
                        <Term>Starting from <Code>now</Code>{" "}on every restart is a
                        silent data-loss bug.</Term>{" "}It is not that changes arrive
                        late — they never arrive at all, and nothing anywhere reports
                        it.
                    </p>
                    <CodeBlock code={DIVERGENCE_TIMELINE} lang="text" />
                    <p>
                        Every restart punches another hole. Weeks later the index is
                        missing a scattering of documents with no pattern to them, and
                        the only honest fix is a full rebuild — because there is no
                        record of which changes were skipped.
                    </p>
                    <p>
                        <Term>The fix is to write the position down.</Term>{" "}Save{" "}
                        <Code>last_seq</Code>{" "}after each processed batch, and read it
                        back on startup. Redis, a file on a volume, or a document in
                        CouchDB itself all work — the requirement is only that it
                        outlives the process:
                    </p>
                    <CodeBlock code={CHECKPOINT_CODE} lang="ts" />
                    <p>
                        Restarts now cost nothing: the process comes back, loads the
                        position it had reached, and CouchDB hands over everything that
                        happened while it was away. A deploy is no longer an event the
                        data has to survive.
                    </p>
                    <p>
                        <Term>Saving after processing rather than before is the whole
                        design.</Term>{" "}The two orderings look interchangeable and
                        behave completely differently when the process dies halfway
                        through a batch.
                    </p>
                    <CodeBlock code={CHECKPOINT_ORDER} lang="text" />
                    <p>
                        Checkpointing first means a crash skips work. Checkpointing
                        last means a crash repeats work — and repeats are free, because
                        indexing by shared id is idempotent. Given the choice between
                        losing changes and re-applying a few, the answer is never in
                        doubt; this is what people mean by at-least-once delivery, and
                        it is only a comfortable place to be because of decision 1.
                    </p>

                    <Callout severity="danger" label="danger · checkpoint before processing and the data is gone">
                        <p>
                            Moving <Code>saveCheckpoint</Code>{" "}above the{" "}
                            <Code>for</Code>{" "}loop is a one-line edit that turns a
                            crash from a replay into permanent loss. The changes in the
                            unfinished batch are past the saved position, so no restart
                            will ever look at them again, and the feed will not mention
                            them a second time.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · checkpoint per index, not per process">
                        <p>
                            Store the position under a key naming what it belongs to —{" "}
                            <Code>sync:movies:last_seq</Code>{" "}rather than{" "}
                            <Code>last_seq</Code>. The moment there is a second
                            consumer of the same feed, or a replay into a v2 index
                            during a rebuild, they need independent positions and one
                            shared key silently corrupts both.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · store it as an opaque string">
                        <p>
                            Whatever holds the checkpoint must give back exactly the
                            string CouchDB produced. A store that coerces types will
                            happily turn{" "}
                            <Code>&quot;42-g1AAAAC...&quot;</Code>{" "}into something
                            else, and CouchDB rejects or misinterprets what comes back —
                            which is the same failure as never having saved it.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="production gap 2: retries and poison documents">
                    <p>
                        Inside the loop there is one line that can fail for reasons
                        that have nothing to do with your code:{" "}
                        <Code>esClient.index</Code>. Elasticsearch restarts during a
                        deploy, the network drops a packet, a bulk queue is full and
                        returns 429. Most of those failures are over in a second, and
                        one of them is not.
                    </p>
                    <p>
                        <Term>Today that error takes down the whole batch.</Term>{" "}
                        It propagates out of <Code>processChange</Code>, out of the{" "}
                        <Code>for..of</Code>, and into the outer catch, which waits
                        five seconds and re-requests the batch from the same position.
                        That is <em>correct</em> — nothing is lost, and idempotency
                        makes the repeat harmless — but it is blunt: one failed write
                        on entry 37 costs a full re-fetch and 50 documents reindexed,
                        and if the cause has not cleared it happens again.
                    </p>
                    <p>
                        <Term>The fix has two levels, and they answer different
                        questions.</Term>{" "}Level 1 asks &ldquo;can this write
                        succeed if I simply try again in a moment?&rdquo; A small
                        helper with exponential backoff answers it:
                    </p>
                    <CodeBlock code={RETRY_HELPER} lang="ts" />
                    <p>
                        The waits are 1s, 2s and 4s — long enough for a restart or a
                        pressure spike to clear, short enough that the feed is not
                        meaningfully behind afterwards. Crucially, the last attempt
                        rethrows rather than swallowing: an exhausted retry is a real
                        failure and the caller has to hear about it.
                    </p>
                    <p>
                        Level 2 asks the harder question: &ldquo;what if it fails{" "}
                        <em>every</em>{" "}time?&rdquo; A document with a value the
                        mapping cannot accept — a string in a{" "}
                        <Code>date</Code>{" "}field, an object where a keyword is
                        expected — will fail identically forever. That is a{" "}
                        <em>poison document</em>, and the one thing it must not be
                        allowed to do is stop the pipe.
                    </p>
                    <CodeBlock code={RETRY_LOOP} lang="ts" />
                    <p>
                        The missing <Code>throw</Code>{" "}in that catch is the entire
                        point of it. Rethrowing would send the failure to the outer
                        handler, which would re-fetch the batch, which would hit the
                        same document, which would fail again — an infinite loop in
                        which one malformed document holds up every change behind it
                        while the process looks perfectly healthy. Logging and
                        continuing costs one wrong document and keeps thousands of
                        correct ones flowing.
                    </p>
                    <p>
                        <Term>The dead-letter lines are a repair list.</Term>{" "}They
                        are not noise to be filtered out — they are the exact set of
                        documents the index is currently wrong about:
                    </p>
                    <CodeBlock code={DEAD_LETTER_LOG} lang="text" />
                    <p>
                        Fix the cause — correct the data, or correct the mapping — then
                        re-index those ids by hand, which is a handful of writes rather
                        than a rebuild. The sync never stopped, so there is nothing else
                        to catch up on.
                    </p>

                    <Callout severity="trap" label="trap · a retry loop with no ceiling">
                        <p>
                            Retrying &ldquo;until it works&rdquo; is the same stall in
                            a friendlier costume: a permanently failing document is
                            retried permanently, and every change behind it waits
                            forever. The attempt count is what converts an unbounded
                            wait into a bounded failure you can act on.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · make the dead-letter log findable">
                        <p>
                            A fixed prefix like <Code>DEAD-LETTER</Code>{" "}turns the
                            repair list into a single grep and a single alert rule. If
                            these documents deserve better than a log line, write the
                            failed ids to a Redis set or a CouchDB document — the point
                            is that something durable knows which ones need reindexing.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · the outer catch is still needed">
                        <p>
                            Level 2 catches failures of one <em>document</em>. The
                            outer handler from the loop section catches failures of the{" "}
                            <em>feed</em>{" "}— CouchDB unreachable, a socket dropped
                            mid-response — where there is no batch to continue and the
                            only move is to wait and re-request from the same position.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="production gap 3: catch precisely">
                    <p>
                        Deletes bring an error you genuinely expect. Elasticsearch
                        returns 404 when asked to delete a document that is not there,
                        and that happens legitimately — a document created and deleted
                        between two syncs, or one that was never indexed because it
                        failed a projection or landed in the dead-letter log. Tolerating
                        that 404 is right. <em>How</em>{" "}it gets tolerated is the
                        difference between a sync you can trust and one that lies to
                        you.
                    </p>
                    <p>
                        <Term>The blanket catch</Term>{" "}is the version that gets
                        written first, usually with a comment explaining the 404 that
                        motivated it:
                    </p>
                    <CodeBlock code={BLANKET_CATCH} lang="ts" />
                    <p>
                        The intention was to ignore one specific, harmless outcome. What
                        the code actually says is <em>ignore every possible
                        failure</em>. A 404 dies silently — as intended — and so does an
                        authentication failure, a cluster that is unreachable, a
                        connection refused because Elasticsearch is down, a timeout
                        under load. Deletes stop being applied, the index fills with
                        documents that no longer exist in CouchDB, and every log stays
                        clean. The sync looks healthy for precisely as long as it is
                        failing.
                    </p>
                    <p>
                        <Term>The precise catch</Term>{" "}names the error it is willing
                        to forgive and lets everything else through:
                    </p>
                    <CodeBlock code={PRECISE_CATCH} lang="ts" />
                    <p>
                        One extra line, and the behaviour is inverted. The expected 404
                        returns quietly, exactly as before. Anything else is rethrown —
                        where gap 2 picks it up: retried with backoff if it is transient,
                        and written to the dead-letter log if it is not. The failure
                        becomes visible instead of vanishing.
                    </p>
                    <p>
                        <Term>Write the precise catch, always.</Term>{" "}The rule
                        generalises past this one call: name the error you expect,
                        handle that, rethrow the rest. A <Code>catch</Code>{" "}with no
                        condition inside it is not error handling — it is a blindfold,
                        and it is worn by the one component whose job is to notice when
                        two stores disagree.
                    </p>
                    <p>
                        <Term>The three gaps are one mechanism.</Term>{" "}Precision in
                        gap 3 is what makes a real error reach gap 2&apos;s retries and
                        dead-letter; containment in gap 2 is what keeps one bad document
                        from stalling the feed; and both of them run inside gap 1&apos;s
                        checkpointing, which is what makes stopping the process at any
                        moment survivable. Remove any one and the other two quietly
                        stop being worth much.
                    </p>

                    <Callout severity="danger" label="danger · an empty catch hides the outage">
                        <p>
                            The worst property of{" "}
                            <Code>{"catch {}"}</Code>{" "}is not that it ignores errors —
                            it is that it ignores them <em>convincingly</em>. An
                            Elasticsearch node that has been down for an hour produces
                            an identical log to one that is perfectly healthy, so the
                            first evidence of the problem is a user reporting search
                            results for a film that was deleted last month.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · the status code is nested">
                        <p>
                            The Elasticsearch JS client puts the HTTP status on{" "}
                            <Code>err.meta.statusCode</Code>, not{" "}
                            <Code>err.status</Code>{" "}or{" "}
                            <Code>err.statusCode</Code>. Checking the wrong property
                            gives <Code>undefined</Code>, the comparison is never true,
                            and every 404 gets rethrown into the dead-letter log — a
                            precise catch that forgives nothing.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · a 404 on delete is not always innocent">
                        <p>
                            It is expected in the two cases above, and it is also what
                            you see when the routing sent the delete to the wrong index
                            — a prefix that stopped matching, say. If dead-letter lines
                            are quiet but 404s are constant, the ids and the router have
                            drifted apart.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — rebuilding ---------- */}
            <PartHeading kicker="part 5">Rebuilding</PartHeading>
            <div>
                <DocSection title="zero-downtime rebuild">
                    <p>
                        Sooner or later the mapping has to change: a field needs a
                        different type, a new analyzer is required, a subfield was never
                        added. None of that can be edited in place on an index that
                        already holds documents — it means a new index and every document
                        written again. The catch is that users are searching and the sync
                        is running the entire time, and neither is allowed to notice.
                    </p>
                    <p>
                        <Term>The prerequisite is decided on day one, not on rebuild
                        day.</Term>{" "}Nothing may ever talk to a physical index. The
                        application searches through an alias, the sync writes through
                        the same alias, and the real index name appears in exactly one
                        place: the alias definition.
                    </p>
                    <CodeBlock code={ALIAS_SHAPE} lang="text" />
                    <p>
                        Get this wrong and there is no zero-downtime rebuild available at
                        any price — swapping means editing and redeploying every consumer,
                        which is the downtime you were avoiding. Creating the first index
                        as <Code>movies_v1</Code>{" "}with an alias called{" "}
                        <Code>movies</Code>{" "}costs one extra request, once, ever.
                    </p>
                    <p>
                        <Term>With the alias in place the rebuild is five
                        steps.</Term>{" "}Users keep searching throughout, and the sync
                        keeps running untouched.
                    </p>
                    <CodeBlock code={REBUILD_STEPS} lang="text" />
                    <p>
                        Step 2 is where having a source of truth pays for itself. There
                        is no <Code>_reindex</Code>{" "}from v1 to v2 and no copying
                        between Elasticsearch indices — the import script that first
                        populated the index is pointed at v2 and run again, reading
                        CouchDB. That matters because v1 holds only what you chose to
                        project; if the new mapping needs a field the old projection
                        dropped, copying from v1 cannot produce it and CouchDB can.
                    </p>
                    <p>
                        Step 4 is the only moment users are exposed to, and it is a
                        single request that removes and adds in one atomic action:
                    </p>
                    <CodeBlock code={ALIAS_SWAP} lang="ts" />
                    <p>
                        There is no instant in which <Code>movies</Code>{" "}points at
                        nothing or at both. One search resolves to v1, the next resolves
                        to v2, and no client is aware that anything happened.
                    </p>
                    <p>
                        <Term>There is one subtle problem left, in the window between
                        the import and the swap.</Term>{" "}The import is not
                        instantaneous, and CouchDB does not stop accepting writes while
                        it runs.
                    </p>
                    <CodeBlock code={SWAP_GAP} lang="text" />
                    <p>
                        Both changes went to v1, because the sync writes through the
                        alias and the alias still pointed there. v2 goes live missing
                        them, and the moment v1 is deleted they are gone from search
                        entirely — while sitting perfectly intact in CouchDB, which is
                        the same silent divergence the whole page has been about.
                    </p>
                    <p>
                        <Term>The fix reuses gap 1&apos;s machinery.</Term>{" "}Note the
                        feed position before starting, and replay from it afterwards:
                    </p>
                    <CodeBlock code={SWAP_FIX} lang="text" />
                    <p>
                        The replay is the ordinary sync loop, started at{" "}
                        <Code>S</Code>{" "}and pointed at v2 — no special code path
                        exists for it. The overlap is harmless for the reason every
                        overlap on this page is harmless: a change already captured by
                        the import is indexed again under the same id and replaces itself.
                        Idempotency, decided back in decision 1, is what turns a
                        dangerous window into a shrug.
                    </p>

                    <Callout severity="trap" label="trap · the import window is longer than it looks">
                        <p>
                            The gap that needs replaying is not the swap itself — it is
                            everything from the moment the import{" "}
                            <em>started reading</em>. Take the checkpoint before step 2
                            begins, not when it finishes: a document edited during the
                            import may have been read in its old state, and only a replay
                            from the earlier position corrects it.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · verify before you swap, delete well after">
                        <p>
                            Between steps 3 and 4, query <Code>movies_v2</Code>{" "}
                            directly — document count against CouchDB, a few known
                            searches, one document read in full. And leave v1 in place
                            for a day after the swap: rolling back is then another alias
                            swap rather than another rebuild.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · aliases can also fan out">
                        <p>
                            An alias may point at several indices at once, which is how
                            time-partitioned data gets searched as one name. For this
                            pipeline the single-target form is what you want, since a
                            write through an alias resolving to two indices is rejected
                            outright — Elasticsearch will not guess which one you meant.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside all five parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>Why not just write to both databases from the API?</>}
                    a={
                        <>
                            &ldquo;<Term>Dual writes</Term>{" "}can&apos;t be{" "}
                            <Term>atomic</Term>{" "}across two systems — one succeeds,
                            the other fails, and they diverge silently. We keep a{" "}
                            <Term>single writer per store</Term>{" "}and mirror changes
                            through the feed.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>What happens if the sync crashes?</>}
                        a={
                            <>
                                &ldquo;It resumes from the persisted{" "}
                                <Term>checkpoint</Term>{" "}— the feed{" "}
                                <Term>replays</Term>{" "}everything since that sequence.
                                Processing is <Term>idempotent</Term>, so replayed
                                changes are harmless.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>What if one document keeps failing to index?</>}
                        a={
                            <>
                                &ldquo;After <Term>retries with backoff</Term>{" "}it goes
                                to a <Term>dead-letter</Term>{" "}log and the pipe moves
                                on — a <Term>poison document</Term>{" "}must never stall
                                the changes behind it.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
