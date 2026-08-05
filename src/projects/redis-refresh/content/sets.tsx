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
    // --- part 1 (Uniqueness and Unorderedness) ---
    // inline `trap · never rely on the order of SMEMBERS` callout, plus a
    // `note · reference` on SRANDMEMBER and SPOP
    "the-order-is-not-yours": ["trap", "note"],

    // --- part 2 (The O(1) Questions) ---
    // inline `note · reference` callout — SMISMEMBER
    sismember: ["note"],

    // --- part 3 (Set Algebra) ---
    // inline `trap · SDIFF is not symmetrical` callout
    "sinter-sunion-sdiff": ["trap"],
    // inline `note · reference` callout — the destination key and its TTL
    "the-store-variants": ["note"],

    // --- part 4 (The Secondary Index) ---
    // inline `danger · forget the SREM and the index dangles` callout, plus a
    // `note · reference` on ordering the index with a sorted set
    "the-cost": ["danger", "note"],

    // --- part 5 (Limits) ---
    // inline `danger · SMEMBERS on a large set blocks` callout
    "smembers-is-keys-shaped": ["danger"],
    // inline `note · reference` callout — the intset / listpack / hashtable encodings
    "intersection-has-a-real-cost": ["note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace,
// strings-and-counters, hashes, lists and the hooks content files each define for
// their own part dividers.
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
// GridTable in inspecting-the-keyspace / strings-and-counters / hashes / lists use —
// a real <table> would be the only one in the codebase. The markup, the cell padding
// and the three text colours (head, first column, rest) are unchanged.
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

const DEDUP = `SADD tags:1 "redis" "nodejs" "redis"
# (integer) 2      -> three sent, two added
SMEMBERS tags:1
# 1) "nodejs"
# 2) "redis"       -> the duplicate was dropped, not rejected`;

const SIGNAL = `SADD tags:1 "redis"
# (integer) 0      -> already a member
SADD tags:1 "docker"
# (integer) 1      -> newly added`;

const ORDER = `DEL s
# (integer) 1
SADD s "z" "a" "m"
# (integer) 3
SMEMBERS s
# 1) "a"
# 2) "m"
# 3) "z"           -> or z, m, a, or any other arrangement`;

const EMPTY = `DEL s
# (integer) 1
SADD s "only"
# (integer) 1      -> the key did not exist; SADD created it
SREM s "only"
# (integer) 1
EXISTS s
# (integer) 0      -> the last member took the key with it
SMEMBERS s
# (empty array)    -> reading a missing set is not an error`;

const SISMEMBER = `SISMEMBER tags:1 "redis"
# (integer) 1      -> yes
SISMEMBER tags:1 "python"
# (integer) 0      -> no`;

const SCARD = `SCARD tags:1
# (integer) 3      -> a stored count, not a walk`;

const SREM = `SREM tags:1 "docker" "python"
# (integer) 1      -> only docker was actually there
SCARD tags:1
# (integer) 2`;

const TWO_SETS = `SADD u:1:skills "js" "redis" "docker"
# (integer) 3
SADD u:2:skills "js" "python"
# (integer) 2`;

const ALGEBRA = `SINTER u:1:skills u:2:skills
# 1) "js"                  -> in BOTH
SUNION u:1:skills u:2:skills
# 1) "js"
# 2) "redis"
# 3) "docker"
# 4) "python"              -> in EITHER, deduplicated
SDIFF u:1:skills u:2:skills
# 1) "redis"
# 2) "docker"              -> in the FIRST but not the others`;

const SDIFF_ORDER = `SDIFF u:1:skills u:2:skills
# 1) "redis"
# 2) "docker"
SDIFF u:2:skills u:1:skills
# 1) "python"              -> a different question, a different answer`;

const MULTI = `SINTER online:users premium:users beta:testers
# 1) "42"
# 2) "117"                 -> in all three, computed server-side`;

const STORE = `SINTERSTORE result u:1:skills u:2:skills
# (integer) 1      -> the SIZE of the result, not the members
SMEMBERS result
# 1) "js"
EXPIRE result 60
# (integer) 1      -> a STORE result has no TTL of its own`;

const SINTERCARD = `SINTERCARD 2 u:1:skills u:2:skills
# (integer) 1      -> the count only; no members cross the wire
SINTERCARD 2 online:users premium:users LIMIT 1000
# (integer) 1000   -> stopped counting at the limit`;

const SCAN_PATTERN = `redis-cli --scan --pattern 'user:*'
# user:1
# user:1:sessions   -> matched too: it merely starts with user:
# user:2`;

const INDEX = `HSET user:1 name "Yassin"
# (integer) 1
SADD users:index 1
# (integer) 1
HSET user:2 name "Ali"
# (integer) 1
SADD users:index 2
# (integer) 1
SMEMBERS users:index
# 1) "1"
# 2) "2"           -> exact, instant, nothing scanned`;

const DANGLING = `DEL user:1
# (integer) 1
SMEMBERS users:index
# 1) "1"           -> still listed, pointing at nothing
# 2) "2"
SREM users:index 1
# (integer) 1      -> the other half of the delete`;

const HUGE = `SSCAN huge:set 0
# 1) "3072"
# 2) 1) "id:1583"
#    2) "id:104"
#    ...           -> one batch, plus a cursor to continue
SCARD huge:set
# (integer) 1000000
SISMEMBER huge:set "id:42"
# (integer) 1`;

const INTER_COST = `SINTER small:set huge:set
# 1) "id:42"       -> cheap: Redis starts from the smallest set
SINTERCARD 2 huge:a huge:b LIMIT 100
# (integer) 100    -> the cost is capped by the limit`;

const NODE = `await client.sAdd('tags:1', ['redis', 'nodejs']);   // -> number of NEW members
await client.sMembers('tags:1');                    // -> string[], order not guaranteed
await client.sIsMember('tags:1', 'redis');          // -> boolean
await client.sCard('tags:1');                       // -> number
await client.sRem('tags:1', 'docker');              // -> number actually removed

await client.sInter(['u:1:skills', 'u:2:skills']);  // -> string[]
await client.sInterCard(['u:1:skills', 'u:2:skills']);
await client.sInterStore('result', ['u:1:skills', 'u:2:skills']);

for await (const members of client.sScanIterator('huge:set', { COUNT: 500 })) { /* batch */ }`;

export function SetsDocs() {
    return (
        <>
            {/* ---------- part 1 — the two properties everything else follows from ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Uniqueness and Unorderedness</PartHeading>
            <div>
                <DocSection title="SADD and silent deduplication">
                    <CodeBlock code={DEDUP} lang="bash" />
                    <p>
                        <Term>
                            A set holds MEMBERS, and every member is unique.
                        </Term>{" "}
                        You <em>add</em> a member, you <em>remove</em> a member, and you{" "}
                        <em>test membership</em> — &quot;items&quot; and
                        &quot;elements&quot; belong to the other types.
                    </p>
                    <p>
                        <Term>
                            Three members were sent and two were added: the duplicate was
                            silently dropped.
                        </Term>{" "}
                        Not an error, not a warning. Uniqueness is the type&apos;s job, so
                        sending a member twice is a normal thing to do.
                    </p>

                    <CodeBlock code={SIGNAL} lang="bash" />
                    <p>
                        <Term>The integer is a deduplication signal.</Term>{" "}
                        <Code>0</Code> means it was already there, <Code>1</Code> means it
                        is new — so you never check before adding.
                    </p>
                    <p>
                        <Term>
                            That replaces <Code>SISMEMBER</Code> followed by{" "}
                            <Code>SADD</Code> with one atomic command
                        </Term>{" "}
                        — no gap in which another client could add the same member between
                        your check and your write.
                    </p>
                </DocSection>

                <DocSection title="the order is not yours">
                    <CodeBlock code={ORDER} lang="bash" />
                    <p>
                        <Term>A set has no order and no index.</Term> Redis returns members
                        in internal table order, which changes as the set grows and as the
                        encoding converts underneath it.
                    </p>
                    <p>
                        <Term>
                            The number of members is the CARDINALITY
                        </Term>{" "}
                        — that is the only positional-sounding fact a set will give you, and
                        it is a count rather than a position.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · never rely on the order of SMEMBERS"
                    >
                        <p>
                            It is not insertion order and not sorted order, and two calls on
                            the same unchanged data can differ. Code that reads{" "}
                            <Code>members[0]</Code> as &quot;the first one&quot; works in
                            testing and reorders itself in production. If you need order,
                            that is a list or a sorted set.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · SRANDMEMBER and SPOP"
                    >
                        <p>
                            <Code>SRANDMEMBER</Code> returns random members without removing
                            them; <Code>SPOP</Code> removes and returns random members. Both
                            exist precisely because &quot;the first member&quot; is not a
                            meaningful concept in a set — the only member Redis will single
                            out for you is an arbitrary one.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="there is no empty set">
                    <CodeBlock code={EMPTY} lang="bash" />
                    <p>
                        <Term>
                            <Code>SADD</Code> on a missing key creates the set, and removing
                            the last member deletes the key.
                        </Term>{" "}
                        The same rule as hashes and lists: writing implies creating, and
                        there is no empty collection to be left behind.
                    </p>
                    <p>
                        <Term>
                            Reading a missing set returns <Code>(empty array)</Code>, not{" "}
                            <Code>(nil)</Code>.
                        </Term>{" "}
                        So an empty reply says nothing about whether the key exists —{" "}
                        <Code>EXISTS</Code> is what answers that.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — the cheap questions, which are the point of the type ---------- */}
            <PartHeading kicker="part 2">The O(1) Questions</PartHeading>
            <div>
                <DocSection title="SISMEMBER">
                    <CodeBlock code={SISMEMBER} lang="bash" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_max-content]"
                        head={["command", "the question", "cost"]}
                        rows={[
                            ["SISMEMBER", "is this member in the set?", "O(1)"],
                            ["SCARD", "how many members are there?", "O(1)"],
                            ["SREM", "remove these members", "O(1) per member"],
                            ["SMEMBERS", "give me every member", "O(N) — see part 5"],
                        ]}
                    />
                    <p>
                        <Term>
                            <Code>SISMEMBER</Code> is O(1) whether the set holds ten members
                            or ten million.
                        </Term>{" "}
                        Redis hashes the member and looks in one place; the size of the set
                        does not enter into it.
                    </p>
                    <p>
                        <Term>
                            This is the command sets exist for: &quot;is X in the
                            group?&quot;
                        </Term>{" "}
                        Banned IPs, feature flags, seen-IDs, permissions — every one of them
                        is a membership test and nothing more.
                    </p>

                    <Callout severity="note" label="note · reference · SMISMEMBER">
                        <p>
                            <Code>SMISMEMBER</Code> tests several members in one call and
                            returns one <Code>1</Code>/<Code>0</Code> per member, in the
                            order you asked — the same
                            reply-zips-back-to-the-request shape as <Code>MGET</Code> and{" "}
                            <Code>HMGET</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="SCARD">
                    <CodeBlock code={SCARD} lang="bash" />
                    <p>
                        <Term>
                            <Code>SCARD</Code> is short for cardinality: how many members.
                        </Term>{" "}
                        O(1), because Redis keeps the count rather than counting on demand —
                        the same arrangement as <Code>LLEN</Code> and <Code>HLEN</Code>.
                    </p>
                    <p>
                        <Term>
                            So never call <Code>SMEMBERS</Code> and count the result in the
                            application.
                        </Term>{" "}
                        That turns a stored integer into a full transfer of the set, to
                        arrive at a number Redis already had.
                    </p>
                </DocSection>

                <DocSection title="SREM">
                    <CodeBlock code={SREM} lang="bash" />
                    <p>
                        <Term>
                            <Code>SREM</Code> reports how many members were really removed.
                        </Term>{" "}
                        Two were named and the reply is <Code>1</Code>, because{" "}
                        <Code>python</Code> was never in the set — the same reporting rule as{" "}
                        <Code>HDEL</Code>, and <Code>0</Code> is not an error.
                    </p>

                    <QA
                        q={
                            <>
                                A set holds two million session IDs and you need to know
                                whether one specific ID is present. Which commands are
                                acceptable?
                            </>
                        }
                        a={
                            <>
                                <Code>SISMEMBER</Code> — O(1) and one byte of reply.{" "}
                                <Code>SMEMBERS</Code> would transfer two million members and
                                block the server while it built the reply.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — the operations you would otherwise write yourself ---------- */}
            <PartHeading kicker="part 3">Set Algebra</PartHeading>
            <div>
                <DocSection title="two sets to work with">
                    <CodeBlock code={TWO_SETS} lang="bash" />
                    <p>
                        <Term>Two skill sets, overlapping in one member.</Term> Everything
                        in this part reads off these two keys, so the answers are checkable
                        by eye.
                    </p>
                </DocSection>

                <DocSection title="SINTER, SUNION, SDIFF">
                    <CodeBlock code={ALGEBRA} lang="bash" />
                    <GridTable
                        cols="grid-cols-[max-content_1fr_max-content]"
                        head={["operation", "returns", "argument order"]}
                        rows={[
                            [
                                "SINTER (intersection)",
                                "members present in BOTH — in ALL, given more keys",
                                "irrelevant",
                            ],
                            [
                                "SUNION (union)",
                                "members in EITHER, deduplicated",
                                "irrelevant",
                            ],
                            [
                                "SDIFF (difference)",
                                "members in the FIRST set but not the others",
                                "decides the answer",
                            ],
                        ]}
                    />
                    <p>
                        <Term>
                            The three operations are INTERSECTION, UNION and DIFFERENCE.
                        </Term>{" "}
                        <Code>js</Code> appears once in the union even though it is in both
                        sets — deduplication applies to the result as much as to the inputs.
                    </p>

                    <CodeBlock code={SDIFF_ORDER} lang="bash" />

                    <Callout severity="trap" label="trap · SDIFF is not symmetrical">
                        <p>
                            <Code>SDIFF</Code> is the only one of the three where argument
                            order matters. &quot;What does user 1 have that user 2
                            doesn&apos;t&quot; is a different question from the reverse, and
                            both spellings are valid commands that return a valid-looking
                            answer. <Code>SINTER</Code> and <Code>SUNION</Code> are
                            order-independent, so the habit of not thinking about order
                            carries over silently.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="why this beats doing it in the application">
                    <CodeBlock code={MULTI} lang="bash" />
                    <p>
                        <Term>The computation happens SERVER-SIDE, inside Redis.</Term> The
                        CLIENT-SIDE alternative is fetching both sets over the wire and
                        intersecting them in JavaScript — two full transfers plus your own
                        loop, to reach an answer the server could have produced from data it
                        already holds.
                    </p>
                    <p>
                        <Term>All three take any number of keys.</Term>{" "}
                        <Code>SINTER online:users premium:users beta:testers</Code> is one
                        command and one reply: the users in all three groups.
                    </p>
                </DocSection>

                <DocSection title="the STORE variants">
                    <CodeBlock code={STORE} lang="bash" />
                    <p>
                        <Term>
                            <Code>SINTERSTORE</Code> writes the result to a key instead of
                            returning it
                        </Term>
                        , so nothing crosses the wire at all — the reply is just the size.{" "}
                        <Code>SUNIONSTORE</Code> and <Code>SDIFFSTORE</Code> are the other
                        two.
                    </p>
                    <p>
                        <Term>
                            Reach for them when the result feeds another operation
                        </Term>{" "}
                        — a stored intersection is itself a set, so it can be intersected
                        again — or when you want to cache the answer with a TTL.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · the destination key"
                    >
                        <p>
                            The destination is OVERWRITTEN, whatever type it held, and it is{" "}
                            <em>deleted</em> if the result is empty — so a missing key after
                            a <Code>STORE</Code> means &quot;no members matched&quot;, not
                            &quot;the command failed&quot;. And a stored result carries no
                            TTL of its own: you attach one with <Code>EXPIRE</Code>
                            afterwards, and it is dropped again by the next{" "}
                            <Code>STORE</Code> that rewrites the key.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="SINTERCARD">
                    <CodeBlock code={SINTERCARD} lang="bash" />
                    <p>
                        <Term>
                            <Code>SINTERCARD</Code> answers how many are in the intersection
                            without transferring the members.
                        </Term>{" "}
                        The count is usually all the application wanted.
                    </p>
                    <p>
                        <Term>
                            Note the leading <Code>2</Code>: you state how many keys you are
                            passing before naming them.
                        </Term>{" "}
                        The same shape as <Code>FIELDS 1 token</Code> in{" "}
                        <Code>HEXPIRE</Code> — a count, then the list — which is how Redis
                        keeps the trailing options unambiguous.
                    </p>
                    <p>
                        <Term>
                            <Code>LIMIT</Code> stops the count once it is reached.
                        </Term>{" "}
                        That is the way to cap the cost of an intersection you only need a
                        rough answer from: <Code>LIMIT 1000</Code> returns{" "}
                        <Code>1000</Code> and stops working the moment it gets there.
                    </p>

                    <QA
                        q={
                            <>
                                You need the number of users who are both online and premium,
                                out of millions. What do you send?
                            </>
                        }
                        a={
                            <>
                                <Code>SINTERCARD</Code> with the two keys, and a{" "}
                                <Code>LIMIT</Code> if an exact figure isn&apos;t required.{" "}
                                <Code>SINTER</Code> would compute the same intersection and
                                then transfer every member so the application could count
                                them.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 4 — the modelling pattern sets are really for ---------- */}
            <PartHeading kicker="part 4">The Secondary Index</PartHeading>
            <div>
                <DocSection title="the problem">
                    <CodeBlock code={SCAN_PATTERN} lang="bash" />
                    <p>
                        <Term>
                            You have <Code>user:1</Code>, <Code>user:2</Code>,{" "}
                            <Code>user:3</Code> as hashes. How do you get &quot;all
                            users&quot;?
                        </Term>{" "}
                        Redis has no <Code>SELECT * FROM users</Code>, and nothing in the
                        keyspace groups those three keys together.
                    </p>
                    <p>
                        <Term>Deriving the list from key names is the wrong way.</Term> The
                        scan walks the entire keyspace, may return the same key twice, and
                        matches anything that merely <em>starts</em> with{" "}
                        <Code>user:</Code> — <Code>user:1:sessions</Code> is not a user.
                    </p>
                </DocSection>

                <DocSection title="the right way">
                    <CodeBlock code={INDEX} lang="bash" />
                    <p>
                        <Term>Keep a set of IDs as you write.</Term> One extra{" "}
                        <Code>SADD</Code> next to the <Code>HSET</Code>, and{" "}
                        <Code>SMEMBERS users:index</Code> is then exact and instant — no
                        scanning, and none of the at-least-once weirdness of{" "}
                        <Code>SCAN</Code> from Inspecting the Keyspace.
                    </p>
                    <p>
                        <Term>
                            A set that lists the IDs of other keys is a SECONDARY INDEX.
                        </Term>{" "}
                        Same idea as an index in SQL, with one difference that matters: in
                        Redis you maintain it yourself.
                    </p>
                    <p>
                        <Term>
                            Uniqueness is what makes a set the right type for this.
                        </Term>{" "}
                        Writing the same user twice cannot corrupt the index, and the
                        membership test is the O(1) &quot;does this user exist&quot; you
                        wanted anyway.
                    </p>
                </DocSection>

                <DocSection title="the cost">
                    <CodeBlock code={DANGLING} lang="bash" />

                    <Callout
                        severity="danger"
                        label="danger · forget the SREM and the index dangles"
                    >
                        <p>
                            You maintain it, which means deleting a user is two commands:{" "}
                            <Code>DEL user:1</Code> and <Code>SREM users:index 1</Code>. Miss
                            the second and the index points at a key that no longer exists —
                            a DANGLING REFERENCE. Nothing in Redis will warn you, and the
                            read path breaks somewhere else entirely: a loop over the index
                            starts getting <Code>(nil)</Code> back for a user it was told
                            exists.
                        </p>
                    </Callout>

                    <p>
                        <Term>That is the general tradeoff of Redis modelling.</Term> No
                        foreign keys and no cascades, so every relationship is yours to keep
                        consistent. The two writes belong in the same repository function,
                        and later in the same transaction or pipeline.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · when the index needs ordering"
                    >
                        <p>
                            A plain set answers &quot;which users exist&quot; and nothing
                            about sequence. If the index needs ordering — newest users first,
                            or pagination — a sorted set with the timestamp as the score
                            replaces it, and that is its own page.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — what a set costs when it gets big ---------- */}
            <PartHeading kicker="part 5">Limits</PartHeading>
            <div>
                <DocSection title="SMEMBERS is KEYS-shaped">
                    <CodeBlock code={HUGE} lang="bash" />

                    <Callout
                        severity="danger"
                        label="danger · SMEMBERS on a large set blocks"
                    >
                        <p>
                            On a set with a million members <Code>SMEMBERS</Code> returns all
                            of them in one reply, built on the single thread while every
                            other client waits — the same shape of mistake as{" "}
                            <Code>KEYS *</Code> and <Code>HGETALL</Code> on a wide hash.{" "}
                            <Code>SSCAN</Code> walks it in batches, <Code>SCARD</Code> gives
                            the count in O(1), and <Code>SISMEMBER</Code> answers the
                            question in O(1).
                        </p>
                    </Callout>

                    <GridTable
                        cols="grid-cols-[max-content_1fr_max-content]"
                        head={["instead of SMEMBERS", "gives", "cost"]}
                        rows={[
                            ["SSCAN huge:set 0", "one batch, plus a cursor", "O(1) per call"],
                            ["SCARD huge:set", "the number of members", "O(1)"],
                            ["SISMEMBER huge:set x", "yes or no for one member", "O(1)"],
                        ]}
                    />
                    <p>
                        <Term>
                            Most of the time you don&apos;t want the members at all.
                        </Term>{" "}
                        You want a count or a yes/no, and both of those have an O(1) command
                        that never transfers the set.
                    </p>
                </DocSection>

                <DocSection title="intersection has a real cost">
                    <CodeBlock code={INTER_COST} lang="bash" />
                    <p>
                        <Term>
                            <Code>SINTER</Code> is O(N*M).
                        </Term>{" "}
                        Redis starts from the smallest set to limit the work, so{" "}
                        <Code>SINTER small:set huge:set</Code> is cheap however large the
                        second key is — it only ever tests the small set&apos;s members
                        against the others.
                    </p>
                    <p>
                        <Term>
                            Two genuinely large sets are a slow command on the single thread
                        </Term>
                        , and slow here means every other client waits.{" "}
                        <Code>SINTERCARD</Code> with <Code>LIMIT</Code> is how you cap it
                        when an approximate count will do.
                    </p>

                    <Callout severity="note" label="note · reference · how a set is encoded">
                        <p>
                            A set of only integers uses <Code>intset</Code>, a sorted array
                            of integers and the cheapest structure in Redis. A small
                            non-numeric set uses <Code>listpack</Code>. Past the configured
                            thresholds either one converts to <Code>hashtable</Code>, and
                            like every conversion it is permanent — see the{" "}
                            <Code>OBJECT ENCODING</Code> section of Inspecting the Keyspace.
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
                    Every command above, unchanged in meaning — same arguments, same order.
                    Three details are worth pinning:
                </p>
                <p>
                    <Term>
                        <Code>sIsMember</Code> returns a real boolean in v5
                    </Term>
                    , where the CLI shows <Code>1</Code> / <Code>0</Code>. Compare it as a
                    boolean and don&apos;t test it against <Code>1</Code>.
                </p>
                <p>
                    <Term>
                        <Code>sMembers</Code> on a missing key returns an empty array, not{" "}
                        <Code>null</Code>
                    </Term>{" "}
                    — the same trap as <Code>hGetAll</Code> returning <Code>{"{}"}</Code>.
                    Check <Code>.length</Code>, and remember the reply order is still not
                    guaranteed once you have it.
                </p>
                <p>
                    <Term>Multiple members go in as an array.</Term>{" "}
                    <Code>sAdd(key, [&apos;a&apos;, &apos;b&apos;])</Code>, not{" "}
                    <Code>sAdd(key, &apos;a&apos;, &apos;b&apos;)</Code> — the CLI&apos;s
                    variadic tail becomes one argument.
                </p>
            </DocSection>
        </>
    );
}
