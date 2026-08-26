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
    // --- part 1 (Sizing & Survival) ---
    "shard-sizing-the-two-failure-directions": ["trap", "tip", "note"],
    "nodes-what-one-is-how-it-dies": ["danger", "trap", "note"],
    "replicas-surviving-node-loss": ["danger", "tip", "note"],

    // --- part 2 (Diagnosis) ---
    "cluster-health-the-colors-and-the-why": ["trap", "tip", "note"],
    "finding-slow-queries-the-slowlog": ["trap", "tip", "note"],
    "profile-from-total-to-guilty-clause": ["trap", "tip", "note"],

    // --- part 3 (The Checklist) ---
    "the-mistakes-checklist": ["danger", "trap", "note"],
};

// Top-level divider between the three parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper every other elasticsearch content file defines for its
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

// PAGE RULES, applied to every section below.
//
// 1. A section opens with prose: the reader knows what it is about before any
//    fragment appears.
// 2. Every fragment is introduced by the sentence above it, and read by the
//    sentence below it where it has a result. Two fragments never touch.
// 3. A comparison names both sides in plain words and ends in a paragraph
//    saying which one to write and why.
// 4. Every OPERATION appears in both forms — the Node client call and the curl
//    that goes over the wire — client first.
//
// THIS PAGE'S OWN RULE: Settings Structure covered what a knob IS. This page
// covers the DECISION and the DIAGNOSIS — what to set it to, and what to run
// when the cluster is telling you something is wrong.

// ===================================================================
// part 1 — sizing & survival
// ===================================================================

const SHARD_DIRECTIONS = `TOO FEW SHARDS — each one huge

    recovery is slow        a 200GB shard moving to another node
                            takes hours, not minutes
    the data cannot spread  one shard is one node's problem;
                            it never splits across machines

TOO MANY SHARDS — each one tiny

    fixed overhead          every shard carries file handles, memory
                            and cluster state — x thousands
    every search fans out   each shard searched, each result merged;
                            coordination starts to cost more than
                            the searching does`;

const SIZING_INPUTS = `1  mature data size / 10-50 GB    ->  the shard count
       what the index will hold, not what it holds today

2  how many nodes exist
       more shards than nodes is fine — several sit on one node

3  what you are trying to scale
       write throughput  ->  shards
       read throughput   ->  replicas`;

const SCALE_REALITY = `45,000 movies  ~  well under 1 GB

    number_of_shards:   1        one shard, far below 10 GB
    number_of_replicas: 1        0 on a single-node cluster

this is the CORRECT answer, not a compromise for a small project`;

const CLUSTER_OF_ONE = `one server, one Elasticsearch process

    node = the process
    cluster = that one node

    it dies       ->  everything is down; there is no "other node"
    it restarts   ->  it reloads its own data from local disk

this is most small projects, and it is a perfectly real deployment`;

const CLUSTER_OF_THREE = `server A            server B            server C
  ES process          ES process          ES process
  node-1              node-2              node-3
      └───────────────────┴───────────────────┘
              configured to find each other
                    = ONE cluster of 3

node-2's machine dies  ->  node-1 and node-3 carry on

three processes on ONE server is not this: the server dies
and all three die with it. Useful for learning, nothing else.`;

const HOW_NODES_DIE = `JVM heap exhausted        the classic — an aggregation over a huge
                          field, or deep pagination, and the node
                          spends its life in GC, then dies

disk full                 at ~85% used ES stops allocating shards to
                          the node (the watermark); at ~95% it starts
                          moving them away

process killed            the OS OOM-killer, a container restart,
                          an ordinary deploy

hardware or VM lost       the machine simply goes

network partition         reachable by nobody = treated as gone,
                          whether or not it is still running`;

const WITH_REPLICA = `number_of_replicas: 1

    node A   [shard 0 · primary]
    node B   [shard 0 · replica]

node A dies
    ->  ES PROMOTES B's replica to primary, automatically
    ->  every document is still served — no data lost
    ->  health YELLOW: the new primary has no copy of its own

node A comes back
    ->  a fresh replica is built on it
    ->  health GREEN`;

const WITHOUT_REPLICA = `number_of_replicas: 0

    node A   [shard 0 · primary]
    node B   (nothing)

node A dies
    ->  there is no copy anywhere
    ->  the shard is GONE
    ->  health RED: that slice of the data is unavailable

node A comes back with its disk intact  ->  recovered
node A's disk is gone                   ->  rebuild from CouchDB`;

const PROTECTIONS = `replicas   protect against NODE LOSS
               copies of the data, on other machines

shards     protect against NOTHING
               capacity and parallelism only —
               they CUT the data up, they do not COPY it

so "add shards for safety" is a category error:
more shards is more places to lose a piece from, not fewer`;

const HEALTH_TS = `await esClient.cluster.health();`;

const HEALTH_CURL = `curl 'localhost:9200/_cluster/health?pretty'`;

const HEALTH_REPLY = `{
  "cluster_name": "docker-cluster",
  "status": "yellow",              // the whole answer, in one word
  "number_of_nodes": 1,
  "active_primary_shards": 4,
  "active_shards": 4,
  "unassigned_shards": 4,          // the replicas, with nowhere to go
  "number_of_pending_tasks": 0
}`;

const HEALTH_COLORS = `GREEN    every shard — primary and replica — is assigned

YELLOW   every PRIMARY is assigned
         one or more REPLICAS are not
         all data is available; the safety net is missing

RED      at least one PRIMARY is unassigned
         part of the data is unavailable RIGHT NOW

the colour is a shard ALLOCATION summary and nothing else.
It says nothing about speed, heap, disk or query load.`;

const EXPLAIN_TS = `await esClient.cluster.allocationExplain();`;

const EXPLAIN_CURL = `curl 'localhost:9200/_cluster/allocation/explain?pretty'`;

const EXPLAIN_REPLY = `{
  "index": "movies_v1",
  "shard": 0,
  "primary": false,                        // this is a replica
  "current_state": "unassigned",
  "can_allocate": "no",
  "allocate_explanation": "cannot allocate because allocation is
     not permitted to any of the nodes",
  "node_allocation_decisions": [
    {
      "node_name": "node-1",
      "deciders": [
        {
          "decider": "same_shard",
          "decision": "NO",
          "explanation": "a copy of this shard is already allocated
             to this node"
        }
      ]
    }
  ]
}`;

const SLOWLOG_TS = `await esClient.indices.putSettings({
    index: "movies",
    settings: {
        "index.search.slowlog.threshold.query.warn": "1s",
        "index.search.slowlog.threshold.query.info": "500ms",
    },
});`;

const SLOWLOG_CURL = `curl -X PUT 'localhost:9200/movies/_settings' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "index.search.slowlog.threshold.query.warn": "1s",
    "index.search.slowlog.threshold.query.info": "500ms"
  }'`;

const SLOWLOG_KEY = `index . search . slowlog . threshold . query . warn

    search      reads — an indexing.slowlog twin exists for writes
    threshold   log it only if it took longer than this
    query       the query phase (a fetch threshold exists too)
    warn        one of warn / info / debug / trace,
                each with its own threshold`;

const SLOWLOG_LINE = `[WARN ][i.s.s.query] [node-1] [movies][0] took[1.4s],
  took_millis[1400], total_hits[45000],
  source[{"query":{"bool":{"must":[{"multi_match":{"query":"dark",
  "fields":["title","overview"]}}],"filter":[{"nested":{"path":
  "credits","query":{"term":{"credits.name":"nolan"}}}}]}}}]

the full body, in source[...] — a query you can paste and re-run`;

const PROFILE_IDEA = `the slowlog says:   this query took 1200ms      <- a TOTAL

profile says:

    bool                    1200ms
      ├── multi_match          80ms
      ├── range                 5ms
      └── nested             1100ms   <- the guilty one

"the query is slow"  becomes  "THIS clause is slow"`;

const PROFILE_TS = `const res = await esClient.search({
    index: "movies",
    profile: true,           // the only thing added
    query: { /* unchanged */ },
});

res.hits.hits;               // still the real results
res.profile;                 // plus the timings`;

const PROFILE_CURL = `curl -X POST 'localhost:9200/movies/_search?pretty' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "profile": true,
    "query": { "match": { "title": "dark knight" } }
  }'`;

const PROFILE_PATH = `profile
  └── shards[]           one entry per shard searched
        └── searches[]
              └── query[]      <- THE TREE. This is what you read.

              aggregations[]   only if the request had aggs`;

const PROFILE_NODE = `{
  "type": "BooleanQuery",          // which clause this is
  "description": "title:dark title:knight",
  "time_in_nanos": 1204000000,     // 1.204s — the number you scan for
  "breakdown": { },                // 15 sub-timers — skip
  "children": [                    // the clauses inside it
    { "type": "TermQuery", "time_in_nanos": 80000000  },
    { "type": "ToParentBlockJoinQuery", "time_in_nanos": 1100000000 }
  ]
}`;

const LUCENE_NAMES = `BooleanQuery                 your  bool
TermQuery / MultiPhrase...   your  match / match_phrase
IndexOrDocValuesQuery        your  range or term filter
...BlockJoinQuery            your  nested

everything else in the node — breakdown, collector,
rewrite_time — is Lucene's business, not yours`;

const TWO_PHASES = `QUERY phase     find the matching documents, score them,
                pick the top N ids
                MEASURED by profile

FETCH phase     load _source for those N documents
                and return them
                NOT measured by profile

request took 800ms, the tree adds up to 60ms
    ->  the missing 740ms is fetch
    ->  the documents are too big, or you asked for too many
    ->  no clause rewrite will ever fix it`;

const CHECKLIST_MAPPING = `text vs keyword confused
    sorting and aggregating fail on text; exact match on
    an analyzed field silently misses
    proven in  Mappings & Analysis

arrays of objects left as plain objects
    fields are flattened, so conditions match ACROSS objects —
    but nested everywhere is the opposite mistake: you pay the
    join on filters that never combine two fields
    proven in  Mappings & Analysis

no alias from day one
    the first mapping change becomes a redeploy instead of
    a one-request swap
    proven in  Documents & Indices  /  CouchDB Sync

dynamic mapping trusted in production
    types guessed from the first value seen, and one typo in a
    field name creates a permanent junk field
    proven in  Documents & Indices`;

const CHECKLIST_QUERY = `term on a text field
    zero hits, no error — the query looks fine and finds nothing
    proven in  Search Queries

a plain query or agg on a nested field
    zero hits, empty buckets, no error — the wrapper is missing
    proven in  Mappings & Analysis  /  Aggregations

yes/no conditions in must instead of filter
    scores polluted by conditions that carry no relevance,
    and the filter bitset cache is never used
    proven in  Search Queries

deep from pagination
    the 10,000-document wall — and raising max_result_window
    instead of moving to search_after just moves the wall
    proven in  Search Queries`;

const CHECKLIST_WRITE = `a 200 from bulk trusted as success
    per-item failures are reported INSIDE the body; leaving
    result.errors unchecked drops documents in silence
    proven in  Documents & Indices

refresh: true inside an import loop
    a segment flushed per document — imports run an order of
    magnitude slower
    proven in  Documents & Indices

sustained 429s answered by raising the queue size
    the queue was the messenger; back off and retry instead
    proven in  Documents & Indices`;

const CHECKLIST_SYNC = `dual writes from the API
    two stores written in one handler, no single writer per
    store, and they diverge silently the first time write 2 fails
    proven in  CouchDB Sync

since=now on every restart
    every change during the downtime is never seen — persist
    the checkpoint and resume from it
    proven in  CouchDB Sync

a blanket catch {}
    a 404 and a dead cluster become the same non-event; name the
    error you expect and rethrow the rest
    proven in  CouchDB Sync

oversharding "for speed", replicas expected to add capacity
    shards bought coordination overhead, and replicas copy the
    data rather than making room for more of it
    proven in  Settings Structure  /  this page`;

export function ProductionDocs() {
    return (
        <>
            {/* Page lead. Frames what this page is FOR before the first divider:
                Settings Structure was the anatomy, this is the operating manual —
                decisions and diagnosis rather than syntax. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Everything before this page was about making Elasticsearch do
                    what you want. This one is about what happens once it is
                    running and something is wrong: a cluster that is not green, a
                    search that got slow, a node that stopped existing. The moves
                    are few and they are always the same, which is the good news.
                </p>
                <p>
                    Settings Structure covered what a knob <em>is</em>. This page
                    covers what to set it <em>to</em>, and what to run when the
                    cluster is telling you something. It closes with the traps this
                    project actually hit, gathered in one place — the page to re-read
                    before shipping rather than after.
                </p>
                <p>
                    Operations appear twice, the Node client call first and then the{" "}
                    <Code>curl</Code>{" "}that goes over the wire, because these are
                    the calls you make from a terminal at least as often as from
                    code. Models and trees are structure rather than requests, so
                    those stand alone.
                </p>
            </div>

            {/* ---------- part 1 — sizing & survival ---------- */}
            <PartHeading kicker="part 1">Sizing &amp; Survival</PartHeading>
            <div>
                <DocSection title="shard sizing: the two failure directions">
                    <p>
                        The shard count is the one setting that can never be changed,
                        so it is worth deciding rather than defaulting into. The
                        working guideline is simple:{" "}
                        <Term>aim for shards of 10 to 50 GB at mature size</Term>{" "}
                        — mature meaning what the index will hold once it is full,
                        not what it holds in its first week.
                    </p>
                    <p>
                        That range exists because both directions away from it hurt,
                        for entirely different reasons:
                    </p>
                    <CodeBlock code={SHARD_DIRECTIONS} lang="text" />
                    <p>
                        The first failure is slow to notice — everything works, until
                        the day a node has to move a shard and the cluster spends
                        four hours yellow. The second is the one beginners actually
                        hit, and it hits immediately.
                    </p>
                    <p>
                        <Term>&ldquo;More shards must be faster&rdquo; is the classic
                        mistake.</Term>{" "}It reads like parallelism and it is priced
                        like coordination. Every search touches every shard, waits for
                        the slowest, and merges what comes back; multiply that by a
                        few thousand shards holding a few megabytes each and the
                        cluster spends its time organising work rather than doing it.
                        An oversharded cluster is measurably slower than the same data
                        in one shard, and the only cure is a rebuild.
                    </p>
                    <p>
                        <Term>The decision has three inputs, in order.</Term>{" "}Work
                        down them and the count falls out; there is nothing to tune
                        afterwards.
                    </p>
                    <CodeBlock code={SIZING_INPUTS} lang="text" />
                    <p>
                        More shards than nodes is normal and fine — several shards
                        living on one node is the usual arrangement, and it leaves
                        room to add machines later without a rebuild. What does not
                        work is expecting replicas to make room for more data: they
                        are copies, so they consume capacity rather than adding it.
                    </p>
                    <p>
                        <Term>For this project the arithmetic is over before it
                        starts.</Term>{" "}Forty-five thousand movies is well under a
                        gigabyte, which is a fraction of one healthy shard.
                    </p>
                    <CodeBlock code={SCALE_REALITY} lang="text" />
                    <p>
                        This is worth saying plainly because the instinct is to treat
                        a one-shard index as a toy setting that a real deployment
                        would grow out of. It is not: for data of this size, one shard
                        is the answer a specialist gives, and splitting it would make
                        the cluster slower rather than more serious.
                    </p>

                    <Callout severity="trap" label="trap · sizing by document count">
                        <p>
                            The guideline is in gigabytes, not documents. Forty-five
                            thousand rich documents with big <Code>_source</Code>{" "}
                            bodies and forty-five thousand tiny ones are the same count
                            and nothing like the same shard. Size the index on disk —{" "}
                            <Code>GET /_cat/indices?v</Code>{" "}reports it — and
                            extrapolate from there.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · size for the index you will have">
                        <p>
                            Estimate the mature size and divide once. An index that
                            will reach 400 GB wants around eight to ten shards from
                            day one, because adding them later means a full reindex.
                            An index that will never leave a few gigabytes wants one,
                            forever.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · shard count is per index">
                        <p>
                            Each index has its own count, so a cluster can hold a
                            hundred-shard index and a one-shard index side by side.
                            The number that matters for cluster health is the total
                            across every index — that is what the coordination cost
                            scales with.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="nodes: what one is, how it dies">
                    <p>
                        Every cluster conversation assumes you already know what a
                        node is, and the definition is much less grand than the word
                        suggests. <Term>A node is one running Elasticsearch
                        process.</Term>{" "}Not a machine, not a service, not a
                        container image — a process. Everything else follows from
                        that.
                    </p>
                    <p>
                        <Term>One server running Elasticsearch is one node, and that
                        node is the entire cluster.</Term>{" "}A cluster of one is a
                        real cluster, and it is what most small projects run:
                    </p>
                    <CodeBlock code={CLUSTER_OF_ONE} lang="text" />
                    <p>
                        The consequences are worth stating without softening. If that
                        process dies, search is down — there is nothing to fail over
                        to, because &ldquo;the other node&rdquo; does not exist. When
                        it starts again it reads its own data back off local disk and
                        carries on; no data is lost by a restart, only availability
                        during it.
                    </p>
                    <p>
                        <Term>&ldquo;One dies, the others survive&rdquo; needs more
                        than one machine.</Term>{" "}Three servers, each running its
                        own Elasticsearch process, configured to find each other,
                        form one cluster of three:
                    </p>
                    <CodeBlock code={CLUSTER_OF_THREE} lang="text" />
                    <p>
                        Running three processes on a single server produces the same
                        picture in the API and none of the protection: the server is
                        still one failure away from taking all three down at once. It
                        is a fine way to see promotion and rebalancing happen on a
                        laptop, and it is not a deployment.
                    </p>
                    <p>
                        <Term>There are effectively two rungs on this ladder.</Term>{" "}
                        One node is simple, recovers by restarting, and leans on the
                        source database as its safety net. Three or more nodes survive
                        losing a machine. Two nodes is neither — it costs twice as
                        much as one and cannot form a reliable quorum — so nothing
                        between the two rungs is worth building.
                    </p>
                    <p>
                        <Term>Nodes die in a small number of ways, and the order is
                        roughly the order of frequency.</Term>{" "}Knowing the list is
                        most of diagnosing an outage, because the symptom rarely says
                        which one happened.
                    </p>
                    <CodeBlock code={HOW_NODES_DIE} lang="text" />
                    <p>
                        Heap exhaustion is by far the most common, and it is nearly
                        always something a query asked for: an aggregation over a
                        high-cardinality field, or pagination deep enough that
                        thousands of documents have to be held to answer it. Disk is
                        second, and it announces itself in a way you will recognise
                        later on this page — the watermark decider is exactly the kind
                        of reason <Code>allocation/explain</Code>{" "}reports.
                    </p>
                    <p>
                        <Term>The design consequence is that node death is
                        routine.</Term>{" "}Deploys restart processes, containers get
                        rescheduled, machines are replaced. Elasticsearch is built on
                        that assumption, which is why replicas exist and why promotion
                        is automatic rather than an operator decision — and why the
                        next section is about what happens in the seconds after a node
                        stops answering.
                    </p>

                    <Callout severity="danger" label="danger · a single node has no failover">
                        <p>
                            On a one-node cluster there is no degraded mode: the
                            process is either up or search is down. That is an
                            acceptable trade for many projects, but it has to be a
                            decision rather than a surprise — and it means the
                            restart path and the rebuild-from-source path both need to
                            actually work before you need them.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · three containers on one host">
                        <p>
                            A three-node <Code>docker-compose</Code>{" "}cluster on one
                            machine reports three nodes, allocates replicas, and goes
                            green — so it looks like the real thing. It shares one
                            kernel, one disk and one power supply, so every failure it
                            is supposed to protect against takes out all three at once.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · nodes have roles">
                        <p>
                            In a multi-node cluster a node can be master-eligible, data,
                            ingest, coordinating, or several at once — which is how
                            larger clusters separate the work of holding data from the
                            work of managing membership. On a single node it is all of
                            them, and the distinction never comes up.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="replicas: surviving node loss">
                    <p>
                        A replica is a full copy of a shard, kept on a different node
                        from the one it copies. That definition is easy to repeat and
                        easy to hold loosely, so it is worth walking the actual
                        sequence of a node dying with a replica in place and without
                        one — the two outcomes are not variations of each other.
                    </p>
                    <p>
                        <Term>With a replica</Term>, the loss is absorbed
                        automatically and you find out from the health colour rather
                        than from users:
                    </p>
                    <CodeBlock code={WITH_REPLICA} lang="text" />
                    <p>
                        Nothing was lost and nothing had to be decided: Elasticsearch
                        promotes the surviving copy to primary on its own, in seconds.
                        Yellow is the cluster saying &ldquo;serving everything, but the
                        spare is gone&rdquo; — and when the machine returns, a fresh
                        replica is rebuilt onto it and the colour goes back to green.
                    </p>
                    <p>
                        <Term>Without a replica</Term>, the same event is permanent:
                    </p>
                    <CodeBlock code={WITHOUT_REPLICA} lang="text" />
                    <p>
                        There is no copy to promote, so the shard is simply
                        unavailable, and red means part of your data cannot be
                        searched at all right now. If the node comes back with its
                        disk intact the shard recovers; if the disk is gone, so is
                        that slice of the index, and the only recovery is a rebuild
                        from the source of truth.
                    </p>
                    <p>
                        <Term>Which is why the two settings protect against different
                        things — and one of them protects against nothing.</Term>{" "}
                        This is the single most common misunderstanding of the pair.
                    </p>
                    <CodeBlock code={PROTECTIONS} lang="text" />
                    <p>
                        Replicas are the durability knob. Shards are the capacity and
                        parallelism knob. Adding shards to a fragile cluster makes it
                        no safer, because cutting the data into more pieces does not
                        create a second copy of any of them.
                    </p>
                    <p>
                        <Term>On a single node the honest answer is zero.</Term>{" "}
                        Elasticsearch refuses to place a replica on the same node as
                        its primary, and it is right to: a copy on the machine you are
                        protecting against protects nothing. So the replica stays
                        unassigned, the cluster sits yellow forever, and the copy you
                        are paying for in disk does not exist. Setting{" "}
                        <Code>number_of_replicas: 0</Code>{" "}states the truth of the
                        deployment. The real safety net at that scale is the source
                        database and a rebuild script that works.
                    </p>

                    <Callout severity="danger" label="danger · red is not a warning">
                        <p>
                            Yellow means the safety net is missing. Red means data is
                            missing — searches return partial results or errors, and
                            aggregations quietly compute over whatever shards
                            answered. A red cluster is producing wrong numbers, not
                            slow ones, and every minute it stays red is a minute of
                            answers you cannot trust.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · replicas can be changed at any time">
                        <p>
                            Unlike the shard count, <Code>number_of_replicas</Code>{" "}
                            is dynamic. Drop it to <Code>0</Code>{" "}for a bulk import
                            so every document is written once instead of twice, then
                            raise it afterwards and let Elasticsearch build the copies
                            in the background — a standard and safe import trick.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · replicas also answer searches">
                        <p>
                            A replica is not a cold standby. It is searched like any
                            other copy, so raising the count raises read throughput as
                            well as durability — and costs a proportional amount of
                            disk and indexing work, since every write is applied to
                            every copy.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — diagnosis ---------- */}
            <PartHeading kicker="part 2">Diagnosis</PartHeading>
            <div>
                <DocSection title="cluster health: the colors and the why">
                    <p>
                        When anything looks wrong — searches failing, writes rejected,
                        a node that stopped answering — this is the first call, before
                        reading a single log line. It is one request, it is cheap, and
                        it turns &ldquo;something is wrong&rdquo; into a colour you can
                        act on.
                    </p>
                    <p>
                        The client call takes no arguments at all:
                    </p>
                    <CodeBlock code={HEALTH_TS} lang="ts" />
                    <p>
                        The same thing from a terminal, which is where you will
                        usually run it:
                    </p>
                    <CodeBlock code={HEALTH_CURL} lang="bash" />
                    <p>
                        What comes back is a summary of the cluster in a dozen fields,
                        of which one matters more than all the rest:
                    </p>
                    <CodeBlock code={HEALTH_REPLY} lang="jsonc" />
                    <p>
                        <Term>The colour is a shard allocation summary, and nothing
                        more.</Term>{" "}It is not a performance score and not a
                        general &ldquo;is Elasticsearch OK&rdquo; indicator — it
                        answers exactly one question, which is whether every shard has
                        somewhere to live.
                    </p>
                    <CodeBlock code={HEALTH_COLORS} lang="text" />
                    <p>
                        Read honestly, that makes green and red easy and yellow the
                        interesting one. <Term>Yellow means full data and reduced
                        safety</Term>{" "}— every document is searchable, and a node
                        loss would now cost you something. On a single-node cluster it
                        is the permanent normal state, because the replicas have
                        nowhere valid to go and never will. The fix is to decide which
                        you meant: set replicas to <Code>0</Code>{" "}and go green, or
                        leave them and accept yellow as this deployment&apos;s
                        healthy colour.
                    </p>
                    <p>
                        <Term>Red is the colour that gets someone paged.</Term>{" "}A
                        primary is unassigned, so part of the index is unavailable
                        now: searches come back partial or error outright, and any
                        aggregation is computing over an incomplete set. Nothing else
                        on this page matters while the cluster is red.
                    </p>
                    <p>
                        <Term>Health gives the colour; one more call gives the
                        reason.</Term>{" "}It reports on the first unassigned shard it
                        finds, in sentences rather than codes:
                    </p>
                    <CodeBlock code={EXPLAIN_TS} lang="ts" />
                    <p>
                        And over the wire, with <Code>?pretty</Code>{" "}because the
                        explanation is meant to be read:
                    </p>
                    <CodeBlock code={EXPLAIN_CURL} lang="bash" />
                    <p>
                        The reply names the shard, says whether it is a primary, and
                        then goes node by node explaining why that node was not
                        allowed to take it:
                    </p>
                    <CodeBlock code={EXPLAIN_REPLY} lang="jsonc" />
                    <p>
                        &ldquo;A copy of this shard is already allocated to this
                        node&rdquo; is the single-node yellow, in the cluster&apos;s
                        own words. The other explanation you will meet is the disk
                        watermark — the node is above its threshold, so nothing new is
                        allowed onto it — which is the same failure mode from the
                        node-death list, seen from the allocation side.
                    </p>
                    <p>
                        <Term>These two calls are a pair.</Term>{" "}Health tells you
                        the colour, <Code>allocation/explain</Code>{" "}tells you why
                        it is that colour, and between them almost every cluster-level
                        problem is identified in under a minute. Learn them together;
                        the first without the second only ever tells you to worry.
                    </p>

                    <Callout severity="trap" label="trap · green is not the same as fine">
                        <p>
                            A cluster can be green while every query takes four
                            seconds, the heap sits at 95%, and half the write requests
                            are being rejected. Allocation is healthy; nothing else is
                            being measured. Green rules out one class of problem and
                            says nothing whatever about the rest.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · the _cat endpoints read better">
                        <p>
                            For a human at a terminal,{" "}
                            <Code>GET /_cat/indices?v</Code>{" "}and{" "}
                            <Code>GET /_cat/shards?v</Code>{" "}give the same picture
                            per index and per shard, in aligned columns instead of
                            JSON — including which index is the one that is yellow,
                            which health alone will not tell you.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · asking health to wait">
                        <p>
                            <Code>?wait_for_status=green&amp;timeout=30s</Code>{" "}makes
                            the call block until the cluster reaches that colour or the
                            timeout expires. It is the polite way for a startup script
                            or a test suite to wait for a cluster to be ready, instead
                            of sleeping and hoping.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="finding slow queries: the slowlog">
                    <p>
                        In production the useful question is never &ldquo;is
                        Elasticsearch slow&rdquo; — it is <em>which query</em>{" "}is
                        slow. Average latency hides it, because the average of one
                        catastrophic query and nine fast ones is an unremarkable
                        number. The slowlog answers the real question by logging every
                        search that crosses a threshold you set.
                    </p>
                    <p>
                        <Term>It is off by default, and it is a per-index dynamic
                        setting.</Term>{" "}Nothing has to be restarted and no config
                        file is involved — it takes effect on the next search:
                    </p>
                    <CodeBlock code={SLOWLOG_TS} lang="ts" />
                    <p>
                        The same settings over the wire, on the index&apos;s{" "}
                        <Code>_settings</Code>{" "}endpoint:
                    </p>
                    <CodeBlock code={SLOWLOG_CURL} lang="bash" />
                    <p>
                        <Term>The setting key is long, and every segment of it is
                        load-bearing.</Term>{" "}Reading it left to right explains what
                        else is available:
                    </p>
                    <CodeBlock code={SLOWLOG_KEY} lang="text" />
                    <p>
                        The levels are independent thresholds rather than a verbosity
                        dial: <Code>warn</Code>{" "}at 1s and <Code>info</Code>{" "}at
                        500ms means anything over a second is logged as a warning and
                        anything between half a second and a second as info. Set the
                        levels you will actually read.
                    </p>
                    <p>
                        <Term>The output goes to the Elasticsearch log</Term>{" "}—
                        which for a Docker deployment means the container logs, and
                        for a package install a file beside the main log. Each offender
                        gets one line:
                    </p>
                    <CodeBlock code={SLOWLOG_LINE} lang="text" />
                    <p>
                        The <Code>source[...]</Code>{" "}field is the entire payoff.
                        This is not a metric saying something was slow at half past
                        two; it is the exact query body, ready to paste into a client
                        and run again. The reproduction case, handed over
                        automatically.
                    </p>
                    <p>
                        <Term>Two habits follow from that.</Term>{" "}Leave a{" "}
                        <Code>warn</Code>{" "}threshold set permanently on every real
                        index — it costs nothing until it fires, and when it fires it
                        has already done the hard part of the investigation. And treat
                        it as a trigger rather than a diagnosis: the slowlog names the
                        suspect, it does not explain it. That is the next section&apos;s
                        job.
                    </p>

                    <Callout severity="trap" label="trap · the threshold is per shard">
                        <p>
                            The time logged is what that <em>shard</em>{" "}took, not
                            what the client waited. On a multi-shard index a request
                            can be slower than any single shard&apos;s entry, and a
                            threshold set from client-side timings will log less than
                            you expect. Set it lower than the latency you care about.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · set it once, on the index template">
                        <p>
                            Applied through an index template, the thresholds are
                            inherited by every index created afterwards — including the{" "}
                            <Code>_v2</Code>{" "}index from a rebuild, which otherwise
                            comes up with the slowlog silently off and takes the
                            observability with it.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · there is a fetch threshold too">
                        <p>
                            Alongside <Code>threshold.query</Code>{" "}sits{" "}
                            <Code>threshold.fetch</Code>, timing the phase that loads
                            the documents rather than the one that finds them. It is
                            worth enabling for exactly the situation the profile
                            section ends on: a request that is slow while its query is
                            fast.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="profile: from total to guilty clause">
                    <p>
                        The slowlog has just told you that a particular query took
                        1.2 seconds. That number is a <em>total</em>, and a total is
                        almost useless for fixing anything: the query has a{" "}
                        <Code>bool</Code>{" "}with a text match, a range filter and a
                        nested clause inside it, and nothing so far says which of them
                        spent the time. Changing one and re-measuring is guessing with
                        extra steps.
                    </p>
                    <p>
                        <Term><Code>profile: true</Code>{" "}is the switch that makes
                        Elasticsearch time each piece separately.</Term>{" "}Instead of
                        one number for the request, you get a number for every clause
                        in it:
                    </p>
                    <CodeBlock code={PROFILE_IDEA} lang="text" />
                    <p>
                        That is the entire purpose of the tool, and it is worth having
                        in one sentence: <Term>profile turns &ldquo;the query is
                        slow&rdquo; into &ldquo;this clause is slow&rdquo;.</Term>{" "}
                        Everything else about it is detail.
                    </p>
                    <p>
                        <Term>Running it changes nothing about the query.</Term>{" "}One
                        top-level key is added, the query body stays exactly as it was,
                        and the search still returns its real hits — the timings arrive
                        alongside them:
                    </p>
                    <CodeBlock code={PROFILE_TS} lang="ts" />
                    <p>
                        The same request over the wire, which is how you will usually
                        run a one-off investigation:
                    </p>
                    <CodeBlock code={PROFILE_CURL} lang="bash" />
                    <p>
                        <Term>The response is large, and almost all of it can be
                        ignored.</Term>{" "}There is one path worth knowing, and it
                        leads to the only part anyone reads:
                    </p>
                    <CodeBlock code={PROFILE_PATH} lang="text" />
                    <p>
                        On a one-shard index there is exactly one entry in{" "}
                        <Code>shards</Code>, which keeps things simple; with several
                        shards you are looking for the slowest one rather than adding
                        them up.
                    </p>
                    <p>
                        <Term>Every node in that tree has the same three fields worth
                        reading.</Term>{" "}A type saying which clause it is, a time,
                        and the children inside it:
                    </p>
                    <CodeBlock code={PROFILE_NODE} lang="jsonc" />
                    <p>
                        Reading it is two steps. First, scan the children for the big
                        number — the tree is a nesting of totals, so the parent&apos;s
                        time is mostly one of its children, and you follow that branch
                        down. Second, translate the type back into the clause you
                        wrote, because these are Lucene&apos;s names rather than the
                        query DSL&apos;s:
                    </p>
                    <CodeBlock code={LUCENE_NAMES} lang="text" />
                    <p>
                        With those two steps done you have the answer:{" "}
                        <em>the nested clause on credits is costing 1.1 of the 1.2
                        seconds</em>. Everything else in the response —{" "}
                        <Code>breakdown</Code>&apos;s fifteen sub-timers,{" "}
                        <Code>collector</Code>, <Code>rewrite_time</Code>{" "}— is for
                        people working on Lucene itself, and skipping it costs you
                        nothing.
                    </p>
                    <p>
                        <Term>The stopwatch is not free.</Term>{" "}Timing every clause
                        makes the query itself slower, so a profiled run does not
                        report the latency a real user would see. Read the{" "}
                        <em>proportions</em>{" "}— which clause holds most of the time —
                        and never the absolute numbers. It is a debugging tool you
                        reach for deliberately, not something to leave on.
                    </p>
                    <p>
                        <Term>And it only times the matching work.</Term>{" "}A search
                        happens in two phases, and profile measures one of them:
                    </p>
                    <CodeBlock code={TWO_PHASES} lang="text" />
                    <p>
                        This produces the one genuinely confusing profile result: a
                        request that took 800ms whose tree accounts for 60ms. Nothing
                        is broken and nothing is hidden — the time went into loading
                        documents, which means huge <Code>_source</Code>{" "}bodies, or
                        a page size asking for hundreds of them. No amount of clause
                        rewriting touches it; the fixes are to store less or to ask for
                        less with <Code>_source</Code>{" "}filtering.
                    </p>
                    <p>
                        <Term>Which gives the rule for reading any profile.</Term>{" "}
                        If the tree adds up to roughly the request time, the problem is
                        a clause and the tree names it. If the tree is far smaller than
                        the request time, the query was never the problem — suspect
                        document size.
                    </p>

                    <Callout severity="trap" label="trap · profiled timings are not benchmarks">
                        <p>
                            Reporting &ldquo;the query takes 1.2s&rdquo; from a
                            profiled run overstates it, sometimes considerably. Measure
                            latency with an unprofiled request and use profile only to
                            apportion it — the two runs answer different questions and
                            their numbers should never be mixed.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · profile the slowlog's body verbatim">
                        <p>
                            Paste the query out of <Code>source[...]</Code>{" "}unchanged
                            and add the one key. A query tidied up on the way in is a
                            different query, and the clause that was slow in production
                            is exactly the one most likely to get simplified away while
                            reformatting.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · aggregations profile separately">
                        <p>
                            A request with aggregations gets an{" "}
                            <Code>aggregations[]</Code>{" "}array beside{" "}
                            <Code>query[]</Code>, timed the same way. Worth remembering
                            when a query tree looks fast and the request does not: on
                            an aggregation-heavy search, the buckets may be where the
                            time went.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — the checklist ---------- */}
            <PartHeading kicker="part 3">The Checklist</PartHeading>
            <div>
                <DocSection title="the mistakes checklist">
                    <p>
                        Every trap flagged across this project, gathered in one place
                        as the closing reference. They are grouped by <em>when the
                        mistake is made</em>{" "}rather than by topic, because that is
                        what decides how expensive it is: a mapping mistake needs a
                        reindex, a query mistake needs an edit, and a sync mistake is
                        usually discovered by a user.
                    </p>
                    <p>
                        <Term>Mapping-time — the expensive group.</Term>{" "}Each of
                        these is baked into documents already written, so the fix is a
                        new index and a reindex rather than a deploy.
                    </p>
                    <CodeBlock code={CHECKLIST_MAPPING} lang="text" />
                    <p>
                        The pattern across all four is the same: a decision that looked
                        like a default. Nothing errors at the time, and the cost
                        arrives weeks later when a sort, an aggregation or a mapping
                        change is finally needed.
                    </p>
                    <p>
                        <Term>Query-time — the silent group.</Term>{" "}These are worse
                        to live with than they look, because every one of them returns
                        a valid response. There is no error to catch and no log line to
                        find; the results are simply wrong.
                    </p>
                    <CodeBlock code={CHECKLIST_QUERY} lang="text" />
                    <p>
                        The habit that catches all of them is refusing to trust an
                        empty result set. Zero hits is a claim about your data, and it
                        deserves one check against the mapping before it is believed.
                    </p>
                    <p>
                        <Term>Write-time — the group that loses data quietly.</Term>{" "}
                        Bulk indexing is fast and forgiving in exactly the way that
                        hides failure.
                    </p>
                    <CodeBlock code={CHECKLIST_WRITE} lang="text" />
                    <p>
                        All three share one shape: a signal that was available and was
                        not read — the per-item errors in the bulk body, the cost of a
                        refresh, the meaning of a 429.
                    </p>
                    <p>
                        <Term>Sync and operations — the group with no error
                        message.</Term>{" "}These do not fail loudly; they leave a
                        system that looks healthy while being wrong.
                    </p>
                    <CodeBlock code={CHECKLIST_SYNC} lang="text" />
                    <p>
                        If there is one line to carry out of this project, it is the
                        one shared by every group above: Elasticsearch almost never
                        tells you that you were wrong. It answers. The whole discipline
                        is building the habits that check the answer — against the
                        mapping, against the source of truth, against the colour of the
                        cluster.
                    </p>

                    <Callout severity="danger" label="danger · the silent failures outnumber the loud ones">
                        <p>
                            Of the fifteen entries above, three throw an error. The
                            rest return <Code>200</Code>{" "}with a response that looks
                            entirely normal — zero hits, an empty bucket list, a
                            partially applied bulk. Testing that only asserts &ldquo;no
                            exception was thrown&rdquo; catches almost none of this.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · the fix that becomes the next mistake">
                        <p>
                            Several of these have an obvious remedy that overshoots:{" "}
                            <Code>nested</Code>{" "}on every object, more shards for
                            speed, a bigger{" "}
                            <Code>max_result_window</Code>, a longer write queue. Each
                            trades a real problem for a subtler one, which is why the
                            entries name the overcorrection alongside the mistake.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · one index is enough to practise on">
                        <p>
                            Every trap here reproduces on a single-node cluster with
                            one small index. None of them need production traffic or a
                            large dataset to demonstrate — which makes them worth
                            deliberately reproducing once, rather than meeting for the
                            first time when they matter.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* Pinned footer, deliberately outside all three parts and out of the
                summary rail: it rehearses the page rather than adding to it. */}
            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>Why is the cluster yellow?</>}
                    a={
                        <>
                            &ldquo;Yellow means all <Term>primaries</Term>{" "}are
                            assigned but some <Term>replicas</Term>{" "}have nowhere to
                            go — on a single node that&apos;s the permanent normal
                            state. Full data, reduced safety;{" "}
                            <Term>allocation/explain</Term>{" "}gives the reason per
                            node.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={<>How do you find a slow query in production?</>}
                        a={
                            <>
                                &ldquo;The <Term>slowlog</Term>{" "}names the suspect —
                                any query over the <Term>threshold</Term>{" "}is logged
                                with its full body. Then <Term>profile</Term>: true
                                re-runs it timing every clause, turning &lsquo;the
                                query is slow&rsquo; into &lsquo;this{" "}
                                <Term>clause</Term>{" "}is slow&rsquo;.&rdquo;
                            </>
                        }
                    />
                </div>

                <div className="mt-4">
                    <QA
                        q={<>How many shards should this index have?</>}
                        a={
                            <>
                                &ldquo;Size by <Term>mature data</Term>: 10 to 50 GB
                                per shard. Under that, one shard is the correct answer
                                — <Term>oversharding</Term>{" "}buys{" "}
                                <Term>coordination overhead</Term>, not speed.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
