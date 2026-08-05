import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
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
    // inline `trap · PUSH and APPEND return a size` callout
    "when-an-integer-is-a-count": ["trap"],
    // inline `trap · a plain SET discards the TTL` callout
    "the-ttl-integers": ["trap"],
    // two inline traps — a missing collection reads as empty, and an empty
    // SCAN batch is not the end. Both are `trap`, so the card shows one icon.
    "nil-and-empty": ["trap"],
    // inline `note · two levels of type mismatch` callout
    "status-and-error-replies": ["note"],
    // inline `trap · empty is not null` callout
    "what-node-redis-turns-these-into": ["trap"],
};

// Exactly the grid treatment node-playground's RepresentationTable and the
// GridTable in inspecting-the-keyspace / strings-and-counters / hashes use — a real
// <table> would be the only one in the codebase. The markup, the cell padding and
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
            {head.map((h, i) => (
                <div key={`h-${i}`} className={`${ruled} text-[var(--text)]`}>
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

// No PartHeading helper here: the tutorial pages split into parts because they
// build an argument across them. This page is a lookup table — nine independent
// entries, read one at a time — so the rail is flat and the sections are the
// only level of structure.

const SHAPES = `SET k "hello"
# OK               -> status
GET k
# "hello"          -> string, always quoted
STRLEN k
# (integer) 5      -> integer
GET missing
# (nil)            -> absent
RPUSH l a b
# (integer) 2
LRANGE l 0 -1
# 1) "a"
# 2) "b"           -> array, numbered by the CLI`;

const COUNTS = `HSET u:1 name "Yassin" city "Berlin"
# (integer) 2      -> two fields, both new
HSET u:1 name "Nasereddine"
# (integer) 0      -> an update; nothing was created
SADD tags redis
# (integer) 1
SADD tags redis
# (integer) 0      -> already a member
HDEL u:1 city
# (integer) 1
DEL missing
# (integer) 0      -> nothing to do`;

const SIZES = `RPUSH q a b
# (integer) 2      -> the LENGTH of the list, not "2 pushed"
RPUSH q c
# (integer) 3      -> still the length
APPEND s "hello"
# (integer) 5      -> the LENGTH of the string
APPEND s "!"
# (integer) 6
LLEN q
# (integer) 3      -> the same number RPUSH already gave back`;

const FLAGS = `EXISTS u:1
# (integer) 1      -> the key is there
HEXISTS u:1 city
# (integer) 0      -> the field is not
SISMEMBER tags redis
# (integer) 1
EXPIRE u:1 60
# (integer) 1      -> an expiry was set
PERSIST u:1
# (integer) 1      -> an expiry was removed
PERSIST u:1
# (integer) 0      -> there was none to remove
RENAMENX u:1 u:2
# (integer) 0      -> the name u:2 was taken`;

const TTLS = `TTL session:1
# (integer) 58     -> seconds remaining
PTTL session:1
# (integer) 57412  -> milliseconds remaining
TTL permanent:1
# (integer) -1     -> the key exists and never expires
TTL gone:1
# (integer) -2     -> there is no such key
HTTL u:1 FIELDS 2 name city
# 1) (integer) 30  -> name has 30s left
# 2) (integer) -1  -> city exists with no TTL`;

const NILS = `GET missing
# (nil)
SET empty ""
GET empty
# ""                    -> an empty string, not a nil
HGET u:1 nope
# (nil)
LPOP drained
# (nil)
SET k "v" NX
# (nil)                 -> k existed; nothing was written
LRANGE missing 0 -1
# (empty array)
HGETALL missing
# (empty array)
SCAN 0 MATCH 'nope:*' COUNT 100
# 1) "13312"            -> cursor is not 0, so the walk continues
# 2) (empty array)`;

const STATUS = `PING
# PONG
SET k "v"
# OK
GET k:hash
# (error) WRONGTYPE Operation against a key holding the wrong kind of value
INCR k
# (error) ERR value is not an integer or out of range
HINCRBY u:1 name 1
# (error) ERR hash value is not an integer
HEXPIRE u:1 60 name
# (error) ERR wrong number of arguments      -> FIELDS 1 name
HEXPIRE u:1 60 FIELDS 1 name
# (error) ERR unknown command 'HEXPIRE'      -> on a server older than 7.4`;

const TYPES = `TYPE k:string
# string
TYPE k:zset
# zset            -> never "sorted-set"
TYPE missing
# none            -> not an error
OBJECT ENCODING k:hash
# "listpack"      -> a different question, answered separately`;

const NODE = `await client.set('k', 'v');               // 'OK'
await client.strLen('k');                 // 1
await client.get('missing');              // null
await client.lRange('missing', 0, -1);    // []
await client.hGetAll('missing');          // {}   <- not null
await client.exists('k');                 // true <- not 1
await client.set('k', 'v', { NX: true }); // null <- it did nothing
await client.scan('0');                   // { cursor: '0', keys: [...] }
await client.brPop('q', 0);               // { key: 'q', element: 'a' } | null
await client.incrByFloat('n', 1.5);       // '2.5' <- a string`;

const GUARDS = `const user = await client.hGetAll('user:1');
if (!user) { /* never runs: {} is truthy */ }
if (Object.keys(user).length === 0) { /* correct */ }

const keys = await client.lRange('q', 0, -1);
if (keys.length === 0) { /* correct */ }

const token = await client.get('session:1');
if (token === null) { /* correct: a single value really can be absent */ }`;

export function ReadingRepliesDocs() {
    return (
        <>
            <DocSection title="the five reply shapes">
                <CodeBlock code={SHAPES} lang="bash" />
                <GridTable
                    cols="grid-cols-[max-content_max-content_1fr]"
                    head={["reply", "CLI looks like", "means"]}
                    rows={[
                        [
                            "Status",
                            "OK",
                            "the command succeeded and had nothing to report",
                        ],
                        ["Integer", "(integer) 3", "a count, a length, or a flag"],
                        ["String", '"hello"', "a value, always quoted"],
                        ["Nil", "(nil)", 'absent, or "I did nothing"'],
                        [
                            "Array",
                            '1) "a"  2) "b"',
                            "zero or more elements, numbered by the CLI",
                        ],
                    ]}
                />
                <p>
                    <Term>
                        The <Code>(integer)</Code> marker, the quotes and the numbering
                        are added by the CLI.
                    </Term>{" "}
                    They are display, not data. A string reply of{" "}
                    <Code>&quot;3&quot;</Code> and an integer reply of <Code>3</Code> are
                    different things on the wire.
                </p>
            </DocSection>

            <DocSection title="when an integer is a count">
                <CodeBlock code={COUNTS} lang="bash" />
                <p>
                    <Term>The common case: how many things the command affected.</Term>{" "}
                    Not how many you asked for.
                </p>
                <GridTable
                    cols="grid-cols-[max-content_1fr]"
                    head={["command", "integer means"]}
                    rows={[
                        [
                            "HSET",
                            "how many fields were NEWLY created (updates don't count)",
                        ],
                        ["SADD", "how many members were newly added"],
                        ["ZADD", "how many members were newly added"],
                        [
                            "RPUSH / LPUSH",
                            "the new LENGTH of the list (not how many you pushed)",
                        ],
                        ["HDEL", "how many fields were removed"],
                        ["DEL / UNLINK", "how many keys were removed"],
                        ["SREM", "how many members were removed"],
                        ["APPEND", "the new LENGTH of the string"],
                        [
                            "STRLEN / LLEN / HLEN / SCARD / DBSIZE",
                            "the size of the thing",
                        ],
                    ]}
                />

                <CodeBlock code={SIZES} lang="bash" />

                <Callout severity="trap" label="trap · PUSH and APPEND return a size">
                    <p>
                        <Code>RPUSH</Code>, <Code>LPUSH</Code> and <Code>APPEND</Code>{" "}
                        break the pattern: they return the resulting SIZE, not a count of
                        what you did. <Code>RPUSH k &quot;a&quot; &quot;b&quot;</Code> on
                        an empty key returns <Code>2</Code>; on a list of ten it returns{" "}
                        <Code>12</Code>.
                    </p>
                </Callout>

                <p>
                    <Term>
                        <Code>0</Code> as a count is not an error.
                    </Term>{" "}
                    <Code>HDEL</Code> on a missing field, <Code>SREM</Code> on an absent
                    member, <Code>DEL</Code> on a missing key: all return{" "}
                    <Code>0</Code>, meaning &quot;nothing to do&quot;.
                </p>
            </DocSection>

            <DocSection title="when an integer is a yes/no">
                <CodeBlock code={FLAGS} lang="bash" />
                <GridTable
                    cols="grid-cols-[max-content_max-content_1fr]"
                    head={["command", "1", "0"]}
                    rows={[
                        ["EXISTS", "key is there", "key is not there"],
                        ["HEXISTS", "field is there", "field is not there"],
                        ["SISMEMBER", "member is in the set", "it is not"],
                        ["EXPIRE", "an expiry was set", "the key does not exist"],
                        [
                            "PERSIST",
                            "an expiry was removed",
                            "there was no expiry to remove",
                        ],
                        ["RENAMENX", "renamed", "the target name was taken"],
                    ]}
                />
                <p>
                    <Term>
                        These report WHAT THE COMMAND DID, not whether the key exists.
                    </Term>{" "}
                    <Code>EXPIRE</Code> returning <Code>0</Code> and{" "}
                    <Code>PERSIST</Code> returning <Code>0</Code> mean different things —
                    no key at all, versus a key that had nothing to remove.
                </p>
            </DocSection>

            <DocSection title="the TTL integers">
                <CodeBlock code={TTLS} lang="bash" />
                <p>
                    <Term>The one place a negative integer carries meaning.</Term>
                </p>
                <GridTable
                    cols="grid-cols-[max-content_1fr]"
                    head={["TTL / PTTL reply", "means"]}
                    rows={[
                        ["a positive number", "seconds (or ms) remaining"],
                        ["-1", "the key EXISTS and has NO expiry"],
                        ["-2", "the key DOES NOT EXIST"],
                    ]}
                />
                <p>
                    <Term>
                        <Code>-2</Code> is how you tell &quot;expired and gone&quot; from
                        &quot;still here, permanent&quot;.
                    </Term>{" "}
                    A plain <Code>GET</Code> returning <Code>(nil)</Code> cannot
                    distinguish those two.
                </p>
                <p>
                    <Term>
                        <Code>HTTL</Code> / <Code>HPTTL</Code> use the same three values
                    </Term>{" "}
                    — one reply per field, in the order the fields were given.
                </p>

                <Callout severity="trap" label="trap · a plain SET discards the TTL">
                    <p>
                        <Code>-1</Code> after you set an expiry almost always means a
                        plain <Code>SET</Code> rewrote the key and discarded the TTL.{" "}
                        <Code>SET ... KEEPTTL</Code> is the fix.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="nil and empty">
                <CodeBlock code={NILS} lang="bash" />
                <GridTable
                    cols="grid-cols-[max-content_1fr]"
                    head={["situation", "CLI reply"]}
                    rows={[
                        ["GET on a missing key", "(nil)"],
                        ["GET on an existing empty string", '""'],
                        ["HGET on a missing field OR key", "(nil)"],
                        ["LPOP / RPOP on an empty list", "(nil)"],
                        ["BRPOP that timed out", "(nil)"],
                        ["SET ... NX that did nothing", "(nil)"],
                        ["SET ... XX that did nothing", "(nil)"],
                        ["LRANGE / SMEMBERS on a missing key", "(empty array)"],
                        ["HGETALL on a missing key", "(empty array)"],
                        [
                            "SCAN batch with nothing matching",
                            "(empty array) WITH a non-zero cursor",
                        ],
                    ]}
                />
                <p>
                    <Term>Two distinct meanings of nil.</Term> &quot;This does not
                    exist&quot; (<Code>GET</Code>, <Code>HGET</Code>) and &quot;I chose
                    not to act&quot; (<Code>SET NX</Code> / <Code>XX</Code>). Same symbol,
                    different cause.
                </p>

                <Callout severity="trap" label="trap · a missing collection reads as empty">
                    <p>
                        A missing COLLECTION comes back empty, not nil, because in Redis
                        an empty collection and a missing key are the same state. So an
                        empty reply never tells you whether the key exists — use{" "}
                        <Code>EXISTS</Code> or <Code>TYPE</Code>.
                    </p>
                </Callout>

                <Callout severity="trap" label="trap · an empty SCAN batch is not the end">
                    <p>
                        An empty batch means this call examined keys and none matched.
                        Only a returned cursor of <Code>0</Code> ends the iteration — see{" "}
                        <Code>Inspecting the Keyspace</Code>.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="status and error replies">
                <CodeBlock code={STATUS} lang="bash" />
                <GridTable
                    cols="grid-cols-3"
                    head={["reply", "means", "usual cause"]}
                    rows={[
                        [
                            "OK",
                            "succeeded, nothing to report",
                            "SET, LTRIM, MSET, FLUSHDB",
                        ],
                        ["PONG", "the server is alive and reachable", "PING"],
                        [
                            "QUEUED",
                            "command accepted into a transaction",
                            "inside MULTI (covered later)",
                        ],
                        [
                            "(error) WRONGTYPE Operation against a key holding the wrong kind of value",
                            "the command family does not match the stored type",
                            "GET on a hash, LPUSH on a string. Diagnose with TYPE, then pick the right family.",
                        ],
                        [
                            "(error) ERR value is not an integer or out of range",
                            "the stored text is not an integer",
                            'INCR on "abc" or on "10.5" — INCR is integer-only, INCRBYFLOAT accepts decimals',
                        ],
                        [
                            "(error) ERR hash value is not an integer",
                            "same, on a hash field",
                            "HINCRBY on a non-numeric field",
                        ],
                        [
                            "(error) ERR wrong number of arguments",
                            "malformed command",
                            "a missing argument, or the FIELDS count in HEXPIRE not matching the field list",
                        ],
                        [
                            "(error) ERR unknown command",
                            "the command does not exist in this version",
                            "a typo, or a 7.4-only command such as HEXPIRE on a 7.0 server",
                        ],
                    ]}
                />

                <Callout severity="note" label="note · two levels of type mismatch">
                    <p>
                        <Code>WRONGTYPE</Code> and &quot;not an integer&quot; are both
                        type mismatches, at different levels.{" "}
                        <Code>WRONGTYPE</Code> is about the KEY&apos;s type; &quot;not an
                        integer&quot; is about the CONTENT of a string.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="TYPE and encoding replies">
                <CodeBlock code={TYPES} lang="bash" />
                <GridTable
                    cols="grid-cols-[max-content_1fr]"
                    head={["TYPE reply", "the type"]}
                    rows={[
                        ["string", "a string"],
                        ["hash", "a hash"],
                        ["list", "a list"],
                        ["set", "a set"],
                        ["zset", "a sorted set — never reported as sorted-set"],
                        ["none", "the key does not exist — not an error"],
                    ]}
                />
                <p>
                    <Term>
                        <Code>OBJECT ENCODING</Code> answers a different question
                    </Term>{" "}
                    — the internal representation (<Code>listpack</Code>,{" "}
                    <Code>hashtable</Code>, <Code>quicklist</Code>, <Code>intset</Code>,{" "}
                    <Code>skiplist</Code>, <Code>int</Code>, <Code>embstr</Code>,{" "}
                    <Code>raw</Code>) rather than the type. See{" "}
                    <Code>Inspecting the Keyspace</Code>.
                </p>
            </DocSection>

            <DocSection title="what node-redis turns these into">
                <CodeBlock code={NODE} lang="js" />
                <GridTable
                    cols="grid-cols-[max-content_1fr]"
                    head={["Redis reply", "node-redis v5 value"]}
                    rows={[
                        ["OK", "'OK' (string)"],
                        ["(integer) 3", "3 (number)"],
                        ["(nil)", "null"],
                        ['"value"', "'value'"],
                        ["(empty array)", "[]"],
                        [
                            "HGETALL on missing key",
                            "{} (empty object, NOT null)",
                        ],
                        [
                            "EXISTS / HEXISTS / SISMEMBER",
                            "boolean, not 1 / 0",
                        ],
                        ["SET ... NX that did nothing", "null"],
                        ["SCAN", "{ cursor, keys } — cursor is a STRING"],
                        ["BRPOP", "{ key, element } | null"],
                        [
                            "INCRBYFLOAT",
                            "a STRING, because a JS number cannot represent every value",
                        ],
                    ]}
                />

                <CodeBlock code={GUARDS} lang="js" />

                <Callout severity="trap" label="trap · empty is not null">
                    <p>
                        The empty-vs-null split is where most bugs live.{" "}
                        <Code>if (!user)</Code> never fires for <Code>hGetAll</Code> — it
                        returns <Code>{"{}"}</Code>. Check{" "}
                        <Code>Object.keys(x).length</Code> for hashes and{" "}
                        <Code>.length</Code> for arrays, and reserve{" "}
                        <Code>=== null</Code> for genuinely absent single values.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="terminology">
                <p>
                    <Term>Redis SENDS a REPLY.</Term> It does not &quot;return a
                    response&quot;.
                </p>
                <p>
                    <Term>Each shape has a name.</Term> A one-word reply is a STATUS
                    REPLY, a number is an INTEGER REPLY, a list is an ARRAY REPLY, and{" "}
                    <Code>(nil)</Code> is a NULL REPLY.
                </p>
                <p>
                    <Term>A command that did nothing was a NO-OP.</Term>
                </p>
                <p>
                    <Term>
                        An error prefixed <Code>(error)</Code> is an ERROR REPLY.
                    </Term>{" "}
                    The connection stays open; it is not a failure of the connection.
                </p>
            </DocSection>
        </>
    );
}
