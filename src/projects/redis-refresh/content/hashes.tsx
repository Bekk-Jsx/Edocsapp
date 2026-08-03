import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header — that is
// the explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is
// one severity. Only the pinned "the same commands in Node" footer is, and that
// section is deliberately absent from the rail.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Writing) ---
    // inline `note · reference` callout — HSETNX and the deprecated HMSET
    hset: ["note"],

    // --- part 2 (Reading) ---
    // inline `trap · every value comes back a string` callout, plus a
    // `note · reference` on the other whole-hash readers
    hgetall: ["trap", "note"],

    // --- part 3 (Deleting and Testing) ---
    // inline `trap · the last field takes the key with it` callout
    hdel: ["trap"],

    // --- part 4 (Atomic Field Updates) ---
    // inline `trap · the field is still a string` callout
    hincrby: ["trap"],

    // --- part 5 (Field TTL) ---
    // inline `trap · FIELDS takes a count first` callout
    "expiring-a-single-field": ["trap"],
    // inline `note · reference` callout — the full command set, and 7.4+ only
    "reading-and-removing-field-ttl": ["note"],

    // --- part 6 (Limits) ---
    // inline `danger · HGETALL on a wide hash blocks` callout, plus a
    // `note · reference` on the listpack -> hashtable conversion
    "wide-hashes": ["danger", "note"],
};

// Top-level divider between the six parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace,
// strings-and-counters and the hooks content files each define for their own part
// dividers.
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

// Exactly the grid treatment node-playground's RepresentationTable and the
// GridTable in inspecting-the-keyspace / strings-and-counters use — a real
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

const HSET = `HSET user:1 name "Yassin" city "Berlin"
# (integer) 2        -> two fields, both new
HSET user:1 name "Nasereddine" age 30
# (integer) 1        -> two written, only age is new
HSET user:1 age 31
# (integer) 0        -> nothing new; it was an update`;

const HSET_ADDS = `HSET user:1 name "Yassin"
# (integer) 1
HSET user:1 city "Berlin"
# (integer) 1        -> added; the hash was not replaced
HGETALL user:1
# 1) "name"
# 2) "Yassin"
# 3) "city"
# 4) "Berlin"`;

const HGET_NIL = `HGET user:1 name
# "Nasereddine"
HGET user:1 nothing
# (nil)              -> the field is missing
HGET user:404 name
# (nil)              -> the key is missing, and the reply is identical

EXISTS user:404
# (integer) 0        -> the key is what's absent
HEXISTS user:1 nothing
# (integer) 0        -> the key is fine, the field is absent`;

const HGETALL = `HGETALL user:1
# 1) "name"
# 2) "Nasereddine"
# 3) "city"
# 4) "Berlin"
# 5) "age"
# 6) "30"            -> three fields, six numbered rows`;

const HGETALL_NODE = `await client.hGetAll('user:1');
// { name: 'Nasereddine', city: 'Berlin', age: '30' }`;

const HMGET = `HMGET user:1 name age nothing
# 1) "Nasereddine"
# 2) "30"
# 3) (nil)           -> one slot per field asked for, in order`;

const HDEL = `HDEL user:1 city
# (integer) 1        -> one field actually removed
HDEL user:1 city
# (integer) 0        -> it was already gone`;

const HDEL_LAST = `HDEL user:1 name age
# (integer) 2
EXISTS user:1
# (integer) 0        -> the key went with the last field
TTL user:1
# (integer) -2       -> and any expiry on it went too`;

const HEXISTS = `HEXISTS user:1 city
# (integer) 1
HEXISTS user:1 phone
# (integer) 0`;

const HINCRBY = `HSET user:1 logins 42
# (integer) 1
HINCRBY user:1 logins 1
# (integer) 43       -> the new value, like INCR
HINCRBY user:1 logins 10
# (integer) 53
HINCRBYFLOAT user:1 score 1.5
# "1.5"              -> there is no HINCR; the amount is always explicit`;

const HINCRBY_TRAP = `HSET user:1 name "Yassin"
# (integer) 1
HINCRBY user:1 name 1
# (error) ERR hash value is not an integer
HSET user:1 score "10.5"
# (integer) 1
HINCRBY user:1 score 1
# (error) ERR hash value is not an integer
HINCRBYFLOAT user:1 score 1
# "11.5"             -> HINCRBYFLOAT is the one that accepts a decimal`;

const HEXPIRE = `HSET session:1 token "abc" csrf "xyz"
# (integer) 2
HEXPIRE session:1 60 FIELDS 1 token
# 1) (integer) 1     -> token expires in 60 seconds, csrf stays`;

const HTTL = `HTTL session:1 FIELDS 2 token csrf
# 1) (integer) 57
# 2) (integer) -1    -> csrf exists and never expires
HPERSIST session:1 FIELDS 1 token
# 1) (integer) 1     -> the expiry is dropped, the field stays`;

const NEST = `HSET user:1 address "Prinzenstr. 84, Berlin"
# (integer) 1        -> a plain string; there is no nested hash

HSET user:1:address street "Prinzenstr. 84" city "Berlin"
# (integer) 2        -> flattened into a key of its own`;

const WIDE = `HLEN big:1
# (integer) 100000
HGETALL big:1
# ... 200000 rows in one reply, built on the single thread

HSCAN big:1 0 COUNT 100
# 1) "3072"
# 2) 1) "f1"  2) "v1"  ...
HMGET big:1 f1 f2
# 1) "v1"
# 2) "v2"            -> ask for the two you wanted`;

const NODE = `await client.hSet('user:1', { name: 'Yassin', city: 'Berlin', age: 30 });  // -> new fields
const name = await client.hGet('user:1', 'name');                          // string | null
const some = await client.hmGet('user:1', ['name', 'age']);                 // array, nulls kept
const all  = await client.hGetAll('user:1');                               // {} when missing
await client.hDel('user:1', 'city');
await client.hExists('user:1', 'city');                                    // boolean
await client.hIncrBy('user:1', 'logins', 1);                               // -> number`;

export function HashesDocs() {
    return (
        <>
            {/* ---------- part 1 — putting fields in, and what the reply counts ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Writing</PartHeading>
            <div>
                <DocSection title="HSET">
                    <CodeBlock code={HSET} lang="bash" />
                    <p>
                        <Term>
                            The reply is how many <em>new</em> fields were created, not how
                            many were written.
                        </Term>{" "}
                        The second command writes two fields and returns <Code>1</Code>:{" "}
                        <Code>age</Code> is new, <Code>name</Code> was an update and updates
                        do not count. A <Code>0</Code> means nothing was new — everything
                        you sent overwrote a field that was already there.
                    </p>
                    <p>
                        <Term>
                            A hash holds <em>fields</em>, not keys.
                        </Term>{" "}
                        The key is the hash itself — <Code>user:1</Code> — and{" "}
                        <Code>name</Code>, <Code>city</Code> and <Code>age</Code> are its
                        fields. You <Term>set</Term> a field, exactly as you set a key.
                    </p>

                    <CodeBlock code={HSET_ADDS} lang="bash" />
                    <p>
                        <Term>
                            <Code>HSET</Code> on an existing key <em>adds</em> a field; it
                            does not replace the hash.
                        </Term>{" "}
                        This is the sharp contrast with <Code>SET</Code> on a string, which
                        throws the old value away. Two separate <Code>HSET</Code> calls
                        leave a two-field hash, where two separate <Code>SET</Code> calls
                        would leave only the second value.
                    </p>

                    <Callout severity="note" label="note · reference · HSETNX and HMSET">
                        <p>
                            <Code>HSETNX</Code> writes a field only if it does not already
                            exist — the field-level counterpart to <Code>SET ... NX</Code>.{" "}
                            <Code>HMSET</Code> is the deprecated multi-field form:{" "}
                            <Code>HSET</Code> has accepted multiple pairs since Redis 4, so{" "}
                            <Code>HMSET</Code> only turns up in old code.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the command family">
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["command", "what it does"]}
                        rows={[
                            ["HSET", "write one or more fields"],
                            ["HGET", "read ONE field"],
                            ["HMGET", "read SEVERAL fields — the M is for multiple"],
                            ["HGETALL", "read EVERY field"],
                            ["HDEL", "remove fields"],
                            ["HEXISTS", "test whether a field is present"],
                            ["HINCRBY", "add a number to a field, atomically"],
                        ]}
                    />
                    <p>
                        <Term>
                            The <Code>H</Code> prefix is the whole naming rule
                        </Term>{" "}
                        — once <Code>TYPE</Code> says <Code>hash</Code>, the commands that
                        apply to the key are the ones beginning with <Code>H</Code>.
                    </p>
                    <p>
                        <Term>
                            Three of them read, and the choice between those three is the
                            interesting part.
                        </Term>{" "}
                        <Code>HGET</Code> for one field, <Code>HMGET</Code> for a named few,{" "}
                        <Code>HGETALL</Code> for the lot — and the rest of this page is
                        largely about when each is the right call.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — the three readers, and what they cost ---------- */}
            <PartHeading kicker="part 2">Reading</PartHeading>
            <div>
                <DocSection title="HGET and the ambiguous nil">
                    <CodeBlock code={HGET_NIL} lang="bash" />
                    <p>
                        <Term>
                            A missing field and a missing key give the same answer.
                        </Term>{" "}
                        Both return <Code>(nil)</Code>, so the reply on its own cannot tell
                        you whether the hash is there without that field or whether there is
                        no hash at all.
                    </p>
                    <p>
                        <Term>
                            When the distinction matters, ask the question directly.
                        </Term>{" "}
                        <Code>EXISTS</Code> on the key separates &quot;no such user&quot;
                        from &quot;user with no phone number&quot;, and <Code>HEXISTS</Code>{" "}
                        answers it at the field level. A 404 and an empty optional field are
                        different outcomes in an API, so this is rarely academic.
                    </p>
                </DocSection>

                <DocSection title="HGETALL">
                    <CodeBlock code={HGETALL} lang="bash" />
                    <p>
                        <Term>
                            The reply is a flat, alternating list — field, value, field,
                            value.
                        </Term>{" "}
                        The CLI numbers every line rather than every pair, so a three-field
                        hash comes back as six rows. Nothing is nested and nothing is
                        labelled; the structure is positional.
                    </p>

                    <CodeBlock code={HGETALL_NODE} lang="js" />
                    <p>
                        <Term>node-redis flattens that list into an object for you</Term>,
                        pairing the rows up so you never handle the alternating form
                        yourself.
                    </p>

                    <Callout severity="trap" label="trap · every value comes back a string">
                        <p>
                            Look at <Code>age: &apos;30&apos;</Code> — quoted. A hash stores
                            strings and nothing else, so every number you write comes back
                            as text and needs <Code>Number()</Code> on the way out. This is
                            the entire reason a deserialise step exists in the repository
                            layer; skip it and <Code>age + 1</Code> quietly produces{" "}
                            <Code>&apos;301&apos;</Code>.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · reference · the other whole-hash readers">
                        <p>
                            <Code>HKEYS</Code> returns field names only and{" "}
                            <Code>HVALS</Code> values only. <Code>HLEN</Code> is the field
                            count, <Code>HRANDFIELD</Code> returns one or more random
                            fields, and <Code>HSTRLEN</Code> gives the length of a single
                            field&apos;s value without transferring the value itself.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="HMGET">
                    <CodeBlock code={HMGET} lang="bash" />
                    <p>
                        <Term>
                            Same positional guarantee as <Code>MGET</Code>.
                        </Term>{" "}
                        One reply slot per field requested, in the order requested, with{" "}
                        <Code>(nil)</Code> holding the place of the missing ones — so the
                        reply zips back to your field list by index and never shifts.
                    </p>
                </DocSection>

                <DocSection title="why HMGET when HGETALL exists">
                    <p>
                        <Term>
                            <Code>HGETALL</Code> transfers everything, whatever you needed.
                        </Term>{" "}
                        On a fifty-field hash where two fields are wanted, that is
                        forty-eight fields of wasted bandwidth and forty-eight values parsed
                        for nothing — on every single call.
                    </p>
                    <p>
                        <Term>
                            Reading everything is a <em>full fetch</em>; reading named
                            fields is a <em>projection</em>.
                        </Term>{" "}
                        The vocabulary is worth having, because the decision recurs at every
                        layer of a system and the two have very different costs.
                    </p>
                    <p>
                        <Term>On a three-field user it makes no difference at all.</Term> It
                        starts to matter once hashes get <em>wide</em> — session objects,
                        product records, config blobs that accumulate fields over years.
                    </p>
                    <p>
                        <Term>
                            The reasoning is the same as <Code>SCAN</Code> versus{" "}
                            <Code>KEYS</Code>
                        </Term>{" "}
                        in Inspecting the Keyspace: ask for what you need rather than for
                        everything, and the cost stops scaling with data you never look at.
                    </p>

                    <QA
                        q={
                            <>
                                You need two fields out of a fifty-field session hash. Which
                                command, and why?
                            </>
                        }
                        a={
                            <>
                                <Code>HMGET</Code>. <Code>HGETALL</Code> would transfer and
                                parse forty-eight fields you don&apos;t use, on every
                                request. The cost is bandwidth and deserialisation, not
                                Redis CPU.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — taking fields out, and asking without fetching ---------- */}
            <PartHeading kicker="part 3">Deleting and Testing</PartHeading>
            <div>
                <DocSection title="HDEL">
                    <CodeBlock code={HDEL} lang="bash" />
                    <p>
                        <Term>The reply is how many fields were actually removed</Term>, so
                        a <Code>0</Code> means the field was not there. You{" "}
                        <Term>remove</Term> a field — the same verb whether one goes or
                        several do.
                    </p>

                    <Callout severity="trap" label="trap · the last field takes the key with it">
                        <CodeBlock code={HDEL_LAST} lang="bash" />
                        <p className="mt-3">
                            There is no such thing as an empty hash in Redis. Delete the
                            final field and the key itself ceases to exist — so code that
                            clears a hash&apos;s fields and then assumes the key is still
                            there breaks, and <em>any TTL on that key disappears with it</em>
                            . A session hash rebuilt field by field after being emptied is
                            permanent again unless the expiry is reapplied.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="HEXISTS">
                    <CodeBlock code={HEXISTS} lang="bash" />
                    <p>
                        <Term>
                            Cheaper than <Code>HGET</Code>, because no value crosses the
                            wire.
                        </Term>{" "}
                        It answers a yes/no question instead of fetching data in order to
                        test it — which matters most on exactly the fields you would least
                        want to transfer, the large ones.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 4 — the reason a hash beats a JSON blob ---------- */}
            <PartHeading kicker="part 4">Atomic Field Updates</PartHeading>
            <div>
                <DocSection title="HINCRBY">
                    <CodeBlock code={HINCRBY} lang="bash" />
                    <p>
                        <Term>
                            <Code>HINCRBY</Code> returns the new value
                        </Term>
                        , so the field is incremented and read in one command — the same
                        bargain <Code>INCR</Code> makes on a string.
                    </p>
                    <p>
                        <Term>
                            This is the command that makes a hash better than a JSON blob.
                        </Term>{" "}
                        No <Code>GET</Code>, no parse, no edit, no write-back, and therefore
                        no lost update. One atomic step inside Redis replaces four steps in
                        your application.
                    </p>
                    <p>
                        <Term>
                            <Code>HINCRBYFLOAT</Code> covers decimals, and there is no{" "}
                            <Code>HINCR</Code>
                        </Term>{" "}
                        — the amount is always explicit, so <Code>1</Code> gets passed where{" "}
                        <Code>INCR</Code> would have implied it.
                    </p>

                    <Callout severity="trap" label="trap · the field is still a string">
                        <CodeBlock code={HINCRBY_TRAP} lang="bash" />
                        <p className="mt-3">
                            The same parsing rule as <Code>INCR</Code>, one level down: the
                            field must hold something that looks like an integer, and{" "}
                            <Code>HINCRBY</Code> on <Code>&quot;abc&quot;</Code> fails with{" "}
                            <Code>hash value is not an integer</Code>. So{" "}
                            <Code>&quot;10.5&quot;</Code> fails too — <Code>HINCRBY</Code>{" "}
                            is integer-only, and <Code>HINCRBYFLOAT</Code> is the one that
                            accepts a decimal.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                Why does storing a user as a hash remove a class of
                                concurrency bug that a JSON string has?
                            </>
                        }
                        a={
                            <>
                                Because the update happens inside Redis.{" "}
                                <Code>HINCRBY</Code> is a single atomic command, so two
                                concurrent logins both land. With a JSON string the update
                                is read-modify-write in the application: both clients read
                                the same version, and the second write erases the first.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 5 — expiry stops being all-or-nothing ---------- */}
            <PartHeading kicker="part 5">Field TTL (7.4+)</PartHeading>
            <div>
                <DocSection title="expiring a single field">
                    <CodeBlock code={HEXPIRE} lang="bash" />
                    <p>
                        <Term>Before 7.4, expiry only worked on whole keys.</Term> A hash
                        was all-or-nothing at the <em>key level</em>: either everything in
                        it lapsed together or none of it did, which forced anything with a
                        mixed lifetime into separate keys.
                    </p>
                    <p>
                        <Term>
                            <Code>HEXPIRE</Code> is <em>per-field TTL</em>.
                        </Term>{" "}
                        The <Code>token</Code> field expires in sixty seconds while{" "}
                        <Code>csrf</Code> stays exactly where it is — one hash, one key, two
                        different lifetimes.
                    </p>

                    <Callout severity="trap" label="trap · FIELDS takes a count first">
                        <p>
                            The syntax requires the number of fields <em>before</em> the
                            field names — <Code>FIELDS 1 token</Code>, not{" "}
                            <Code>FIELDS token</Code>. Get the count wrong and it is a
                            syntax error rather than a silent partial application, which is
                            the good outcome: the command is rejected instead of expiring
                            the wrong subset.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="reading and removing field TTL">
                    <CodeBlock code={HTTL} lang="bash" />
                    <p>
                        <Term>One reply per field, in the order you named them</Term> — the
                        same positional contract as <Code>HMGET</Code>.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["HTTL reply", "meaning"]}
                        rows={[
                            ["57", "seconds left on this field"],
                            ["-1", "the field exists and never expires"],
                            ["-2", "there is no such field"],
                        ]}
                    />
                    <p>
                        <Term>
                            The same three values <Code>TTL</Code> uses on a key
                        </Term>
                        , which makes the field-level commands read as the key-level ones
                        moved down a level rather than as a new idea. <Code>HPERSIST</Code>{" "}
                        drops a field&apos;s expiry and leaves the field, exactly as{" "}
                        <Code>PERSIST</Code> does for a key.
                    </p>

                    <Callout severity="note" label="note · reference · the full set, and the version floor">
                        <p>
                            Setting an expiry: <Code>HEXPIRE</Code>, <Code>HPEXPIRE</Code>,{" "}
                            <Code>HEXPIREAT</Code>, <Code>HPEXPIREAT</Code>. Reading one:{" "}
                            <Code>HTTL</Code>, <Code>HPTTL</Code>, <Code>HEXPIRETIME</Code>,{" "}
                            <Code>HPEXPIRETIME</Code>. All of them need Redis 7.4 or newer —
                            on 7.0 they simply do not exist, which is a real deployment trap
                            when a distro package lags behind the Docker image you developed
                            against.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 6 — where the type stops helping ---------- */}
            <PartHeading kicker="part 6">Limits</PartHeading>
            <div>
                <DocSection title="hashes do not nest">
                    <CodeBlock code={NEST} lang="bash" />
                    <p>
                        <Term>A field value is always a plain string.</Term> You cannot put
                        a hash inside a hash — <Code>HSET user:1 address ...</Code> can hold
                        a string, or JSON text you parse yourself, and nothing else. A hash
                        is one level deep by construction.
                    </p>
                    <p>
                        <Term>
                            For nesting you <em>flatten</em> into a separate key.
                        </Term>{" "}
                        <Code>user:1:address</Code> becomes a hash of its own, and the
                        relationship lives in the key name rather than in the structure.
                        Storing JSON in the field instead brings back every
                        read-modify-write problem the hash was chosen to avoid.
                    </p>
                </DocSection>

                <DocSection title="wide hashes">
                    <CodeBlock code={WIDE} lang="bash" />
                    <p>
                        <Term>
                            A hash with many fields is <em>wide</em>
                        </Term>
                        , and width is what turns the convenient reader into the dangerous
                        one.
                    </p>

                    <Callout severity="danger" label="danger · HGETALL on a wide hash blocks">
                        <p>
                            <Code>HGETALL</Code> on a hash with 100,000 fields is{" "}
                            <Code>KEYS</Code>-shaped danger: one enormous reply built on the
                            single thread while every other client waits. <Code>HSCAN</Code>{" "}
                            walks it in batches with the same cursor protocol{" "}
                            <Code>SCAN</Code> uses, and <Code>HMGET</Code> is the answer
                            whenever you already know which fields you want.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · reference · encoding">
                        <p>
                            A small hash is stored as a <Code>listpack</Code>; past 128
                            fields, or any single value longer than 64 bytes, it converts to
                            a <Code>hashtable</Code> — and the conversion is permanent, so
                            deleting fields afterwards does not bring the cheap encoding
                            back. See the <Code>OBJECT ENCODING</Code> part of Inspecting
                            the Keyspace for the thresholds and how to read them.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- pinned footer — the same commands from Node, reference only.
                 Deliberately absent from the summary rail: it adds no new idea, it
                 restates the CLI above in node-redis v5. Same treatment as the
                 pinned footer sections on the hooks pages. ---------- */}
            <DocSection
                title="the same commands in Node"
                tone="mint"
                sectionSeverity="note"
            >
                <CodeBlock code={NODE} lang="js" />
                <p>
                    Every command above, unchanged in meaning — same arguments in the same
                    order, with the field map passed as an object. Three details are worth
                    pinning:
                </p>
                <p>
                    <Term>
                        <Code>hGetAll</Code> on a missing key returns an empty object, not{" "}
                        <Code>null</Code>.
                    </Term>{" "}
                    So <Code>if (!user)</Code> never fires and a &quot;not found&quot; path
                    silently becomes a &quot;found, but blank&quot; path. Check{" "}
                    <Code>Object.keys(obj).length</Code> instead.
                </p>
                <p>
                    <Term>
                        <Code>hExists</Code> returns a real boolean in v5
                    </Term>{" "}
                    where the CLI shows <Code>1</Code> or <Code>0</Code> — so it goes
                    straight into an <Code>if</Code> without a comparison.
                </p>
                <p>
                    <Term>
                        Numbers passed to <Code>hSet</Code> are coerced to strings by Redis.
                    </Term>{" "}
                    What you write as <Code>30</Code> comes back as{" "}
                    <Code>&apos;30&apos;</Code>, so every read needs an explicit conversion.
                    The write side accepting a number is what makes this easy to forget.
                </p>
            </DocSection>
        </>
    );
}
