import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header — that is
// the explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is
// one severity. No section here is, so every callout below is inline only.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Type) ---
    // inline `trap · SET overwrites any type` callout
    wrongtype: ["trap"],
    // inline `danger · DEL frees on the main thread` callout
    "commands-that-ignore-the-type": ["danger"],

    // --- part 2 (TTL) ---
    // inline `trap · SET discards the expiry` callout
    "losing-a-ttl": ["trap"],

    // --- part 3 (SCAN) ---
    // inline `trap · this is shell syntax` callout
    "seeding-a-keyspace-to-scan": ["trap"],
    // inline `trap · only 0 starts an iteration` callout
    "the-cursor": ["trap"],
    // inline `trap · an empty batch is not the end` callout
    "count-match-type": ["trap"],
    // inline `trap · scanIterator changed shape in v5` callout
    "scan-in-node": ["trap"],

    // --- part 4 (Object Encoding) ---
    // inline `danger · the conversion is one-way` callout
    "the-thresholds": ["danger"],
    // inline `note · reference` callout — string encodings are not covered here
    "string-encodings": ["note"],
};

// Top-level divider between the four parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground and the hooks content
// files each define for their own part dividers.
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

// Exactly the grid treatment node-playground's RepresentationTable uses — a real
// <table> would be the only one in the codebase. Generalised over head/rows here
// only because this page carries five of them: the markup, the cell padding and
// the three text colours (head, first column, rest) are unchanged.
// `cols` is a literal grid-template-columns utility so Tailwind sees it at build time.
function GridTable({
    cols,
    head,
    rows,
}: {
    cols: string;
    head: string[];
    rows: string[][];
}) {
    const cell = "px-3 py-2";
    const ruled = `${cell} border-b border-[var(--border)]`;
    return (
        <div
            className={`grid ${cols} overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[0.75rem]`}
        >
            {head.map((h) => (
                <div key={h} className={`${ruled} text-[var(--text)]`}>
                    {h}
                </div>
            ))}
            {rows.map((row, r) =>
                row.map((value, c) => (
                    <div
                        key={`${r}-${c}`}
                        // last row keeps the outer border as its only rule
                        className={`${r === rows.length - 1 ? cell : ruled} ${
                            c === 0 ? "text-[var(--accent)]" : "text-[var(--muted)]"
                        }`}
                    >
                        {value}
                    </div>
                )),
            )}
        </div>
    );
}

const CREATE = `SET k:string "hello"
# OK
HSET k:hash field "value"
# (integer) 1
RPUSH k:list a b c
# (integer) 3
SADD k:set x y
# (integer) 2
SADD k:set x
# (integer) 0      -> x was already a member
ZADD k:zset 1 first
# (integer) 1`;

const TYPES = `TYPE k:string
# string
TYPE k:hash
# hash
TYPE k:list
# list
TYPE k:set
# set
TYPE k:zset
# zset            -> not "sorted-set"
TYPE k:missing
# none            -> not an error`;

const WRONG = `LPUSH k:string a
# (error) WRONGTYPE Operation against a key holding the wrong kind of value`;

const GENERIC = `EXISTS k:hash
# (integer) 1
EXPIRE k:hash 60
# (integer) 1
TTL k:hash
# (integer) 60
RENAME k:hash k:profile
# OK
UNLINK k:profile
# (integer) 1`;

const SET_EXPIRY = `EXPIRE session:1 60
# (integer) 1      -> an expiry was set
EXPIRE nothing:1 60
# (integer) 0      -> no such key, nothing to set
PEXPIRE session:1 1500
# (integer) 1
SET session:1 "token" EX 60
# OK`;

const READ_EXPIRY = `TTL session:1
# (integer) 58     -> seconds remaining
PTTL session:1
# (integer) 57412  -> milliseconds remaining
TTL k:string
# (integer) -1     -> the key exists and never expires
TTL gone:1
# (integer) -2     -> there is no such key`;

const LOSE_TTL = `SET session:1 "token" EX 60
# OK
SET session:1 "rotated"
# OK
TTL session:1
# (integer) -1     -> the expiry is gone

SET session:1 "rotated" KEEPTTL
# OK
PERSIST session:1
# (integer) 1      -> an expiry was removed
PERSIST session:1
# (integer) 0      -> there was nothing to remove`;

const KEYS_ALL = `DBSIZE
# (integer) 2006
KEYS *
# 1) "demo:1583"
# 2) "demo:104"
# ...              2004 more, all in one reply`;

const SEED = `for i in $(seq 1 2000); do echo "SET demo:$i v$i"; done | redis-cli --pipe
# All data transferred. Waiting for the last reply...
# Last reply received from server.
# errors: 0, replies: 2000`;

const CURSOR = `SCAN 0
# 1) "3072"
# 2)  1) "demo:1583"
#     2) "demo:104"
#     3) "demo:1901"
#     ...
#    10) "demo:911"`;

const FILTERS = `SCAN 0 COUNT 100
# 1) "13312"
# 2) ... 97 keys        -> not 100

SCAN 0 MATCH 'demo:19*' COUNT 100
# 1) "13312"
# 2) (empty array)      -> cursor is not 0, so the walk continues

SCAN 0 TYPE hash COUNT 100
# 1) "13312"
# 2) 1) "k:hash"`;

const CLI_SCAN = `redis-cli --scan | head -3
# demo:1583
# demo:104
# demo:1901
redis-cli --scan --pattern 'user:*'
redis-cli --scan --pattern 'demo:*' | wc -l
# 2000
redis-cli --scan --pattern 'demo:*' | xargs -L 500 redis-cli UNLINK`;

const SCAN_MANUAL = `let cursor = '0';

do {
  const res = await client.scan(cursor, { MATCH: 'demo:*', COUNT: 100 });
  cursor = res.cursor;
  console.log(res.keys);
} while (cursor !== '0');`;

const SCAN_ITERATOR = `for await (const keys of client.scanIterator({ MATCH: 'demo:*', COUNT: 100 })) {
  console.log(keys);   // one batch (array) per iteration
}`;

// Not executable — SCAN walks the outer level, HSCAN the level below it.
const TREE = `Database
├── user:1        # <- SCAN returns this key
│    ├── name     # <- HSCAN returns these fields
│    ├── email
│    └── age
└── user:2        # <- SCAN returns this key`;

const HSCAN = `HSCAN user:1 0
# 1) "0"
# 2) 1) "name"   2) "Yassin"
#    3) "email"  4) "y@example.com"
#    5) "age"    6) "31"
HSCAN user:1 0 NOVALUES
# 1) "0"
# 2) 1) "name"  2) "email"  3) "age"`;

const ENCODING = `HSET u:1 name "Yassin"
# (integer) 1
TYPE u:1
# hash
OBJECT ENCODING u:1
# "listpack"

for i in $(seq 1 200); do echo "HSET u:1 f$i v$i"; done | redis-cli --pipe
OBJECT ENCODING u:1
# "hashtable"     -> same key, same type`;

const MEMORY = `OBJECT ENCODING u:1
# "listpack"
MEMORY USAGE u:1
# (integer) 104        -> 1 field
OBJECT ENCODING u:1
# "hashtable"
MEMORY USAGE u:1
# (integer) 14680      -> 201 fields`;

const THRESHOLDS = `CONFIG GET hash-max-listpack-entries
# 1) "hash-max-listpack-entries"
# 2) "128"
CONFIG GET hash-max-listpack-value
# 1) "hash-max-listpack-value"
# 2) "64"`;

const ONE_WAY = `HLEN u:1
# (integer) 2          -> HDEL took it back down to two fields
OBJECT ENCODING u:1
# "hashtable"          -> unchanged`;

const STRINGS = `SET a 12345
OBJECT ENCODING a
# "int"
SET b "hello"
OBJECT ENCODING b
# "embstr"
SET c "a string of more than forty-four bytes, which is the cutoff"
OBJECT ENCODING c
# "raw"`;

export function InspectingTheKeyspaceDocs() {
    return (
        <>
            {/* ---------- part 1 — one type per key, and the families bound to it ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Type</PartHeading>
            <div>
                <DocSection title="every key has exactly one type">
                    <CodeBlock code={CREATE} lang="bash" />
                    <p>
                        <Term>
                            A key&apos;s type is fixed the moment the key is created.
                        </Term>{" "}
                        Every command belongs to a type family, and Redis rejects a
                        mismatch instead of guessing what was meant.
                    </p>
                    <p>
                        <Term>The replies already differ by family.</Term>{" "}
                        <Code>SET</Code> returns <Code>OK</Code>; the four collection
                        commands return how many items were added.{" "}
                        <Code>SADD</Code> returning <Code>0</Code> is not a failure — the
                        member was already in the set.
                    </p>

                    <CodeBlock code={TYPES} lang="bash" />
                    <p>
                        <Term>
                            <Code>TYPE</Code> reports the family in Redis&apos;s own
                            vocabulary.
                        </Term>{" "}
                        A sorted set reports as <Code>zset</Code>, never{" "}
                        <Code>sorted-set</Code>.
                    </p>
                    <p>
                        <Term>
                            <Code>TYPE</Code> on a missing key returns <Code>none</Code>,
                            not an error
                        </Term>{" "}
                        — consistent with <Code>GET</Code> returning <Code>(nil)</Code>.
                        An absent key is a normal outcome in Redis, never a failure.
                    </p>
                </DocSection>

                <DocSection title="command families follow the type">
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["type", "prefix", "examples"]}
                        rows={[
                            ["string", "none", "GET SET INCR APPEND"],
                            ["hash", "H", "HGET HSET HGETALL HDEL"],
                            ["list", "L / R", "LPUSH RPOP LRANGE LLEN"],
                            ["set", "S", "SADD SMEMBERS SISMEMBER"],
                            ["zset", "Z", "ZADD ZRANGE ZSCORE"],
                        ]}
                    />
                    <p>
                        <Term>The prefix follows from the type.</Term> Once{" "}
                        <Code>TYPE</Code> says <Code>hash</Code>, the commands that apply
                        to the key are known to begin with <Code>H</Code>.
                    </p>
                    <p>
                        <Term>
                            That makes the diagnostic habit a fixed order: read the type
                            first, then pick the command family.
                        </Term>{" "}
                        Lists carry two prefixes because both ends are addressable —{" "}
                        <Code>L</Code> for the left, <Code>R</Code> for the right.
                    </p>
                </DocSection>

                <DocSection title="WRONGTYPE">
                    <CodeBlock code={WRONG} lang="bash" />
                    <p>
                        <Term>
                            A key&apos;s type is a contract, and a mismatched command is
                            rejected rather than coerced.
                        </Term>{" "}
                        Redis will not convert the value to suit the command, and it will
                        not silently do nothing: the command fails and the data is left
                        exactly as it was.
                    </p>

                    <Callout severity="trap" label="trap · SET overwrites any type">
                        <p>
                            <Code>SET</Code> replaces a key of <em>any</em> type without
                            warning, silently changing what that key is.{" "}
                            <Code>SET k:hash &quot;hello&quot;</Code> destroys the hash and
                            leaves a string behind — no error, no{" "}
                            <Code>WRONGTYPE</Code>, and every <Code>H*</Code> command
                            against the key starts failing afterwards.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="commands that ignore the type">
                    <CodeBlock code={GENERIC} lang="bash" />
                    <p>
                        <Term>
                            The generic group operates on the key, not on the value.
                        </Term>{" "}
                        <Code>EXISTS</Code>, <Code>DEL</Code>, <Code>RENAME</Code>,{" "}
                        <Code>EXPIRE</Code>, <Code>TTL</Code>, <Code>TYPE</Code>,{" "}
                        <Code>SCAN</Code>, <Code>KEYS</Code> and <Code>PERSIST</Code> are
                        safe to call without knowing what the key holds.
                    </p>

                    <Callout severity="danger" label="danger · DEL frees on the main thread">
                        <p>
                            <Code>DEL</Code> on a key holding a million elements frees all
                            of them on the single thread and can stall the server for
                            hundreds of milliseconds — every other client waits.{" "}
                            <Code>UNLINK</Code> does the same job and hands the freeing to
                            a background thread: same result, no blocking. It is never
                            worse than <Code>DEL</Code>, which is why some teams use it by
                            default.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                What is the first thing you check when a Redis command
                                returns <Code>WRONGTYPE</Code>?
                            </>
                        }
                        a={
                            <>
                                <Code>TYPE</Code> on the key. The error means the command
                                family doesn&apos;t match the stored type — not that the
                                data is corrupt or missing.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 2 — expiry, and the two ways it disappears ---------- */}
            <PartHeading kicker="part 2">TTL</PartHeading>
            <div>
                <DocSection title="setting expiry">
                    <CodeBlock code={SET_EXPIRY} lang="bash" />
                    <p>
                        <Term>
                            <Code>EXPIRE key seconds</Code> returns <Code>1</Code> when an
                            expiry was set and <Code>0</Code> when the key doesn&apos;t
                            exist.
                        </Term>{" "}
                        <Code>PEXPIRE</Code> is the same command in milliseconds.
                    </p>
                    <p>
                        <Term>Expiry can also be set at write time</Term> —{" "}
                        <Code>SET session:1 &quot;token&quot; EX 60</Code>, or{" "}
                        <Code>PX</Code> for milliseconds — which avoids the window where
                        the key exists without a TTL.
                    </p>
                    <p>
                        <Term>These commands report what they did, not what exists.</Term>{" "}
                        A <Code>0</Code> from <Code>EXPIRE</Code> is the only signal that
                        the key was never there.
                    </p>
                </DocSection>

                <DocSection title="reading expiry">
                    <CodeBlock code={READ_EXPIRY} lang="bash" />
                    <p>
                        <Term>
                            <Code>TTL</Code> returns the seconds remaining,{" "}
                            <Code>PTTL</Code> the milliseconds.
                        </Term>
                    </p>
                    <p>
                        <Term>Three return values cover every case.</Term> A positive
                        number is the time left; <Code>-1</Code> means the key exists and
                        has no expiry; <Code>-2</Code> means there is no such key. The{" "}
                        <Code>-2</Code> is how &quot;expired, or deleted&quot; is
                        distinguished from &quot;permanent&quot;.
                    </p>
                </DocSection>

                <DocSection title="losing a TTL">
                    <CodeBlock code={LOSE_TTL} lang="bash" />

                    <Callout severity="trap" label="trap · SET discards the expiry">
                        <p>
                            A plain <Code>SET</Code> on a key that has a TTL replaces the
                            key and discards its expiry. The key becomes permanent with no
                            warning and no error — the session that was supposed to lapse
                            never does. <Code>SET ... KEEPTTL</Code> preserves it.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            <Code>PERSIST</Code> removes an expiry deliberately
                        </Term>{" "}
                        — <Code>1</Code> if one was removed, <Code>0</Code> if there was
                        nothing to remove.
                    </p>
                    <p>
                        <Term>
                            So a TTL disappears in exactly two ways you didn&apos;t intend:
                            a <Code>SET</Code> that replaced the key, and a{" "}
                            <Code>PERSIST</Code>.
                        </Term>{" "}
                        Everything else either sets an expiry or leaves it alone.
                    </p>

                    <QA
                        q={
                            <>
                                A session key was supposed to expire after 30 minutes but
                                it&apos;s still there. Where do you look?
                            </>
                        }
                        a={
                            <>
                                <Code>TTL</Code> on the key. If it returns <Code>-1</Code>{" "}
                                the expiry was dropped — almost always a plain{" "}
                                <Code>SET</Code> rewriting the key without{" "}
                                <Code>KEEPTTL</Code>.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — walking the keyspace without freezing it ---------- */}
            <PartHeading kicker="part 3">SCAN</PartHeading>
            <div>
                <DocSection title="why not KEYS">
                    <CodeBlock code={KEYS_ALL} lang="bash" />
                    <p>
                        <Term>
                            <Code>KEYS *</Code> is O(N) on the single thread and returns
                            everything in one reply.
                        </Term>{" "}
                        While the server builds that list every other client is frozen.
                        Instant on a lab of six keys; a multi-hundred-millisecond stall on
                        a production keyspace — which is why it appears in most Redis
                        outage postmortems.
                    </p>
                    <p>
                        <Term>
                            <Code>SCAN</Code> returns the same information in small
                            batches
                        </Term>
                        , letting other clients&apos; commands run between calls. The
                        cursor exists only because the answer is no longer one single
                        reply.
                    </p>
                </DocSection>

                <DocSection title="seeding a keyspace to scan">
                    <CodeBlock code={SEED} lang="bash" />
                    <p>
                        <Term>
                            <Code>for VAR in LIST; do COMMAND; done</Code> is the shell
                            loop
                        </Term>{" "}
                        — it runs the body once per word in the list.
                    </p>
                    <p>
                        <Term>
                            <Code>$(seq 1 2000)</Code> is command substitution.
                        </Term>{" "}
                        <Code>seq</Code> prints the numbers 1 to 2000, and{" "}
                        <Code>$( )</Code> captures that output and drops the words in
                        place, so the loop sees 2000 words.
                    </p>
                    <p>
                        <Term>
                            <Code>echo</Code> builds one Redis command per line
                        </Term>{" "}
                        and <Code>|</Code> pipes those lines into{" "}
                        <Code>redis-cli</Code>. <Code>--pipe</Code> is mass-insert mode:
                        it speaks raw RESP and does not wait for each reply, which is
                        orders of magnitude faster than 2000 separate{" "}
                        <Code>redis-cli</Code> invocations.
                    </p>

                    <Callout severity="trap" label="trap · this is shell syntax">
                        <p>
                            The loop belongs at the shell, not at the{" "}
                            <Code>127.0.0.1:6379&gt;</Code> prompt. Typed inside{" "}
                            <Code>redis-cli</Code> it fails with{" "}
                            <Code>Invalid argument(s)</Code>, because the CLI is reading
                            Redis commands and <Code>for</Code> is not one.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the cursor">
                    <CodeBlock code={CURSOR} lang="bash" />
                    <p>
                        <Term>
                            <Code>SCAN 0</Code> returns a two-element reply
                        </Term>{" "}
                        — element 1 is the cursor, element 2 is the batch of keys found by{" "}
                        <em>this call only</em>. You iterate the keyspace with a cursor,
                        and each call returns one batch.
                    </p>
                    <p>
                        <Term>A cursor is a bookmark.</Term> It says where the walk
                        stopped so the next call resumes there. You never read it and
                        never compute with it — you hand it back unchanged.
                    </p>
                    <p>
                        <Term>It is not an offset and not a page number.</Term> It is an
                        encoded position in Redis&apos;s hash table, walked in reverse
                        binary order so the iteration stays correct while the table is
                        being resized. You cannot skip ahead, and you cannot ask how far
                        along you are.
                    </p>
                    <p>
                        <Term>
                            <Code>0</Code> means both &quot;start at the beginning&quot;
                            and, when returned, &quot;nothing left&quot;.
                        </Term>{" "}
                        Start at 0, finish at 0.
                    </p>

                    <Callout severity="trap" label="trap · only 0 starts an iteration">
                        <p>
                            <Code>SCAN 1</Code> does not error. It starts mid-table and
                            silently skips every key positioned before that point, so a
                            walk begun anywhere but <Code>0</Code> returns a partial
                            keyspace that looks complete.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="a full walk">
                    <GridTable
                        cols="grid-cols-[max-content_max-content_max-content_1fr]"
                        head={["call", "you send", "cursor returned", "batch"]}
                        rows={[
                            ["1", "SCAN 0", "48", "user:7 user:23 user:41 … (10)"],
                            ["2", "SCAN 48", "12", "user:3 user:19 user:50 … (10)"],
                            ["3", "SCAN 12", "36", "user:11 user:28 … (10)"],
                            ["4", "SCAN 36", "52", "user:5 user:33 … (10)"],
                            ["5", "SCAN 52", "0", "user:14 user:47 … (10)"],
                        ]}
                    />
                    <p>
                        <Term>Read it as a chain</Term> — each row&apos;s returned cursor
                        is the next row&apos;s argument. Five calls of about ten keys walk
                        a 50-key database, and the walk ends when the reply carries{" "}
                        <Code>0</Code>.
                    </p>
                    <p>
                        <Term>
                            The cursors jump around: no order, no counting up.
                        </Term>{" "}
                        <Code>48</Code>, <Code>12</Code>, <Code>36</Code>,{" "}
                        <Code>52</Code> is a normal sequence, and the keys come back
                        unsorted, in table order rather than insertion or alphabetical
                        order.
                    </p>
                </DocSection>

                <DocSection title="COUNT, MATCH, TYPE">
                    <CodeBlock code={FILTERS} lang="bash" />
                    <p>
                        <Term>
                            <Code>COUNT</Code> is a hint for how much work to do per call,
                            not a page size.
                        </Term>{" "}
                        The default is 10, and <Code>COUNT 100</Code> may return 97 or
                        113. Never write code that assumes{" "}
                        <Code>keys.length === COUNT</Code>.
                    </p>
                    <p>
                        <Term>
                            Setting <Code>COUNT</Code> to the size of the keyspace returns
                            everything in one call
                        </Term>{" "}
                        — which is <Code>KEYS *</Code> again, blocking included.
                    </p>
                    <p>
                        <Term>
                            <Code>MATCH</Code> filters after Redis has collected the batch.
                        </Term>{" "}
                        It takes glob syntax — <Code>*</Code> for any characters,{" "}
                        <Code>?</Code> for exactly one, <Code>[ae]</Code> for a class — and
                        reduces what crosses the wire, not the work the server does.
                    </p>
                    <p>
                        <Term>
                            <Code>TYPE</Code> (Redis 6+) filters during the walk
                        </Term>
                        , so unlike <Code>MATCH</Code> it is genuinely cheaper.
                    </p>

                    <Callout severity="trap" label="trap · an empty batch is not the end">
                        <p>
                            A filtered scan can return an empty batch with a non-zero
                            cursor — the call examined keys and none matched. The exit
                            condition is <Code>cursor === 0</Code>, never &quot;the batch
                            was empty&quot;. Stopping on an empty batch quits early and
                            silently misses most of the keyspace.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="what SCAN guarantees">
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["a key that is", "is"]}
                        rows={[
                            [
                                "present for the whole iteration",
                                "returned at least once",
                            ],
                            ["absent for the whole iteration", "never returned"],
                            [
                                "added or removed mid-iteration",
                                "undefined — it may or may not appear",
                            ],
                        ]}
                    />
                    <p>
                        <Term>
                            &quot;At least once&quot; means duplicates are normal.
                        </Term>{" "}
                        Redis stores keys in a hash table; when it grows past a threshold
                        the table is resized and keys are redistributed, so a key already
                        seen can land in a bucket not yet visited and come back a second
                        time.
                    </p>
                    <p>
                        <Term>
                            That is the price of not blocking: <Code>SCAN</Code> is
                            non-blocking and therefore offers no point-in-time snapshot.
                        </Term>{" "}
                        It cannot hold the table still, so it gives a loose,
                        eventually-consistent view instead. Dedupe through a{" "}
                        <Code>Set</Code> and keep the loop idempotent.
                    </p>
                </DocSection>

                <DocSection title="the CLI shortcut">
                    <CodeBlock code={CLI_SCAN} lang="bash" />
                    <p>
                        <Term>
                            <Code>redis-cli --scan</Code> runs the whole cursor loop and
                            prints one key per line
                        </Term>
                        , which is what makes it composable with ordinary shell tools.{" "}
                        <Code>--pattern</Code> passes a glob straight through to{" "}
                        <Code>MATCH</Code>.
                    </p>
                    <p>
                        <Term>
                            <Code>| wc -l</Code> counts a namespace
                        </Term>{" "}
                        without printing it, and{" "}
                        <Code>| xargs -L 500 redis-cli UNLINK</Code> bulk-deletes one:{" "}
                        <Code>-L 500</Code> batches key names 500 per{" "}
                        <Code>UNLINK</Code> call instead of spawning 2000 processes.
                    </p>
                </DocSection>

                <DocSection title="SCAN in Node">
                    <CodeBlock code={SCAN_MANUAL} lang="js" />
                    <p>
                        <Term>
                            The manual loop keeps the cursor visible: send it, overwrite it
                            with the one that comes back, stop when it is{" "}
                            <Code>&apos;0&apos;</Code> again.
                        </Term>{" "}
                        A <Code>do...while</Code> is the right shape because the first call
                        must happen before there is any cursor to test.
                    </p>
                    <p>
                        <Term>Two node-redis v5 details.</Term> The cursor is a{" "}
                        <em>string</em>, so the comparison is{" "}
                        <Code>cursor !== &apos;0&apos;</Code>; and the reply is an object{" "}
                        <Code>{"{ cursor, keys }"}</Code>, not the two-element array the
                        CLI shows.
                    </p>

                    <CodeBlock code={SCAN_ITERATOR} lang="js" />
                    <p>
                        <Term>The idiomatic version hides the protocol.</Term> No cursor
                        variable and no exit condition — the iterator ends when Redis
                        returns <Code>0</Code>.
                    </p>

                    <Callout severity="trap" label="trap · scanIterator changed shape in v5">
                        <p>
                            In node-redis v4 <Code>scanIterator</Code> yielded one key per
                            iteration; in v5 it yields an array per batch. Code copied from
                            an older tutorial passes a single string where a batch is
                            expected — it runs without an error, and does the wrong thing.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="HSCAN, SSCAN, ZSCAN">
                    <CodeBlock code={TREE} lang="bash" />
                    <p>
                        <Term>
                            Same cursor protocol, one level down.
                        </Term>{" "}
                        <Code>SCAN</Code> walks the keys in the database;{" "}
                        <Code>HSCAN</Code> walks the fields inside one key.{" "}
                        <Code>SCAN</Code> tells you <Code>user:1</Code> exists and says
                        nothing about what is inside it.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["command", "walks"]}
                        rows={[
                            ["HSCAN", "the fields of a hash"],
                            ["SSCAN", "the members of a set"],
                            ["ZSCAN", "the members of a sorted set"],
                        ]}
                    />

                    <CodeBlock code={HSCAN} lang="bash" />
                    <p>
                        <Term>
                            Not <Code>HGETALL</Code>, for the same reason as{" "}
                            <Code>KEYS</Code> versus <Code>SCAN</Code>.
                        </Term>{" "}
                        <Code>HGETALL</Code> returns every field in one reply — fine for a
                        five-field user, blocking for a hash with 100,000 fields.
                    </p>
                    <p>
                        <Term>
                            <Code>HSCAN key 0 NOVALUES</Code> (7.4+) returns field names
                            only
                        </Term>
                        , which inspects a wide hash without pulling every value over the
                        wire.
                    </p>

                    <QA
                        q={
                            <>
                                Why is <Code>KEYS</Code> acceptable in the CLI but not in
                                application code?
                            </>
                        }
                        a={
                            <>
                                The cost is identical — O(N) on a single thread. The
                                difference is who pays. In the CLI you knowingly block your
                                own lab. In application code it runs on every request,
                                against a keyspace whose size you don&apos;t control.
                            </>
                        }
                    />

                    <QA
                        q={
                            <>
                                If <Code>SCAN</Code> can&apos;t guarantee a snapshot, how
                                do you get a reliable list of keys?
                            </>
                        }
                        a={
                            <>
                                You don&apos;t derive it — you maintain it. Keep a
                                secondary index as you write (
                                <Code>SADD users:index &lt;id&gt;</Code>) and read that
                                instead of inferring the list from key names.{" "}
                                <Code>SCAN</Code> is a diagnostic and maintenance tool; the
                                index is the data-modelling answer.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 4 — the structure underneath the type ---------- */}
            <PartHeading kicker="part 4">Object Encoding</PartHeading>
            <div>
                <DocSection title="type versus encoding">
                    <CodeBlock code={ENCODING} lang="bash" />
                    <p>
                        <Term>Every value has two layers.</Term> The type you see (
                        <Code>TYPE</Code> reports <Code>hash</Code>) and the encoding
                        Redis actually uses in memory (<Code>OBJECT ENCODING</Code>{" "}
                        reports <Code>listpack</Code>).
                    </p>
                    <p>
                        <Term>
                            A value is stored under an encoding, and the encoding changes
                            on its own as the value grows.
                        </Term>{" "}
                        Nothing in the application asks for it, and memory usage changes
                        with it. Grown past 128 fields, the same key with the same type
                        reports <Code>hashtable</Code> — a different internal structure
                        behind an unchanged interface.
                    </p>
                </DocSection>

                <DocSection title="why the small form is faster">
                    <CodeBlock code={MEMORY} lang="bash" />
                    <p>
                        <Term>
                            A listpack is a flat, contiguous block of bytes, scanned
                            linearly.
                        </Term>{" "}
                        With few fields that beats a hash table — no pointers, no hashing,
                        everything in one cache line — and it is far smaller, with no
                        bucket array and no per-entry overhead.
                    </p>
                    <p>
                        <Term>Linear scanning stops paying at scale.</Term> At 200 fields
                        it is slow, so Redis switches to a real hashtable: O(1) lookups,
                        more memory per field.
                    </p>
                </DocSection>

                <DocSection title="the thresholds">
                    <CodeBlock code={THRESHOLDS} lang="bash" />
                    <p>
                        <Term>Two independent triggers.</Term> More than 128 fields,{" "}
                        <em>or</em> any single value longer than 64 bytes. Either one flips
                        the whole hash — one oversized value converts a two-field hash.
                    </p>

                    <Callout severity="danger" label="danger · the conversion is one-way">
                        <p>
                            Growing past a threshold triggers a conversion, and the
                            conversion is irreversible. <Code>HDEL</Code> back down to two
                            fields and the encoding stays <Code>hashtable</Code>. One
                            oversized value written once, and that key keeps the expensive
                            encoding for the rest of its life — the only way back is to
                            delete the key and write it again.
                        </p>
                    </Callout>

                    <CodeBlock code={ONE_WAY} lang="bash" />
                </DocSection>

                <DocSection title="encodings by type">
                    <GridTable
                        cols="grid-cols-[max-content_max-content_max-content_1fr]"
                        head={["type", "small", "large", "config prefix"]}
                        rows={[
                            ["hash", "listpack", "hashtable", "hash-max-listpack-*"],
                            ["list", "listpack", "quicklist", "list-max-listpack-size"],
                            [
                                "set",
                                "intset / listpack",
                                "hashtable",
                                "set-max-intset-entries, set-max-listpack-*",
                            ],
                            ["zset", "listpack", "skiplist", "zset-max-listpack-*"],
                            [
                                "string",
                                "int / embstr / raw",
                                "—",
                                "none (fixed rules)",
                            ],
                        ]}
                    />
                    <p>
                        <Term>
                            A set containing only integers uses <Code>intset</Code>
                        </Term>{" "}
                        — a sorted array of integers, the cheapest structure in Redis. Add
                        one non-numeric member and it converts, permanently, like every
                        other conversion here.
                    </p>
                </DocSection>

                <DocSection title="string encodings">
                    <CodeBlock code={STRINGS} lang="bash" />
                    <p>
                        <Code>int</Code> stores the value as an actual integer rather than
                        text, which is what makes <Code>INCR</Code> cheap.{" "}
                        <Code>embstr</Code> covers 44 bytes or fewer, allocated in one
                        block together with its object header. Above 44 bytes the encoding
                        is <Code>raw</Code>, with header and data allocated separately.
                    </p>

                    <Callout severity="note" label="note · reference only">
                        <p>
                            String encodings are listed here for reference and are not
                            covered further on this page. Unlike the collection types they
                            follow fixed rules with no configurable threshold, so there is
                            nothing to tune and nothing to trip over.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
