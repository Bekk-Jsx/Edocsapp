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
    // --- part 1 (Score and Member) ---
    // inline `trap · score first, then member` callout, plus a `note · reference`
    // on NX / XX / GT / LT / CH / INCR
    zadd: ["trap", "note"],
    // inline `note · reference` callout — IEEE 754 doubles and lexicographic ties
    "the-score-is-a-float": ["note"],

    // --- part 2 (Reading by Position) ---
    // inline `note · reference` callout — the pre-6.2 ZREVRANGE family
    "zrange-and-rev": ["note"],
    // inline `trap · rank 0 is not nil` callout
    "zrank-and-zrevrank": ["trap"],

    // --- part 3 (Reading by Score) ---
    // inline `note · reference` callout — BYLEX
    bounds: ["note"],
    // inline `trap · LIMIT needs BYSCORE or BYLEX` callout, plus a
    // `note · reference` on the cost of deep offsets
    limit: ["trap", "note"],

    // --- part 4 (Sliding Windows) ---
    // inline `note · reference` callout — ZREMRANGEBYRANK and ZREM
    zremrangebyscore: ["note"],
    // inline `note · reference` callout — MULTI or Lua, and the key's own EXPIRE
    "rate-limiting-worked-through": ["note"],
    // inline `note · reference` callout — ZPOPMIN / ZPOPMAX and the blocking forms
    "other-things-the-score-can-be": ["note"],

    // --- part 5 (Limits) ---
    // inline `danger · ZRANGE 0 -1 is the SMEMBERS mistake` callout, plus a
    // `note · reference` on the listpack -> skiplist encoding
    cost: ["danger", "note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace,
// strings-and-counters, hashes, lists, sets and the hooks content files each define
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

// Exactly the grid treatment node-playground's RepresentationTable and the
// GridTable in inspecting-the-keyspace / strings-and-counters / hashes / lists /
// sets use — a real <table> would be the only one in the codebase. The markup, the
// cell padding and the three text colours (head, first column, rest) are unchanged.
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

const ZADD = `ZADD leaderboard 100 "yassin" 250 "ali" 175 "sara"
# (integer) 3
ZRANGE leaderboard 0 -1
# 1) "yassin"
# 2) "sara"
# 3) "ali"         -> inserted in any order, returned by score, lowest first`;

const ZADD_ORDER = `ZADD k "yassin" 100
# (error) ERR value is not a valid float
ZADD k 1 2
# (integer) 1      -> score 1, member "2"; no error to notice`;

const ZADD_UPDATE = `ZADD leaderboard 300 "yassin"
# (integer) 0      -> nothing new; a score was updated
ZSCORE leaderboard "yassin"
# "300"
ZCARD leaderboard
# (integer) 3      -> still three members, not four`;

const FLOAT = `ZADD prices 19.99 "book"
# (integer) 1
ZSCORE prices "book"
# "19.99"          -> a string, not a number`;

const ZINCRBY = `ZINCRBY leaderboard 50 "yassin"
# "350"            -> the NEW score, as a string
ZRANGE leaderboard 0 -1 REV
# 1) "yassin"
# 2) "ali"
# 3) "sara"        -> re-positioned by that same command`;

const REV = `ZRANGE leaderboard 0 -1
# 1) "sara"
# 2) "ali"
# 3) "yassin"      -> lowest score first, the default
ZRANGE leaderboard 0 -1 REV
# 1) "yassin"
# 2) "ali"
# 3) "sara"        -> highest first
ZRANGE leaderboard 0 2 REV
# 1) "yassin"
# 2) "ali"
# 3) "sara"        -> 0 2 is the top three, same index syntax as LRANGE`;

const WITHSCORES = `ZRANGE leaderboard 0 2 REV WITHSCORES
# 1) "yassin"
# 2) "350"
# 3) "ali"
# 4) "250"
# 5) "sara"
# 6) "175"         -> member, score, member, score`;

const ZRANK = `ZRANK leaderboard "sara"
# (integer) 0      -> lowest score, so rank 0
ZREVRANK leaderboard "sara"
# (integer) 2      -> counting from the top instead
ZRANK leaderboard "nobody"
# (nil)            -> not in the set at all
ZCARD leaderboard
# (integer) 3`;

const BYSCORE = `ZRANGE leaderboard 200 400 BYSCORE
# 1) "ali"
# 2) "yassin"      -> 200 and 400 are SCORES
ZRANGE leaderboard 200 400
# (empty array)    -> the same numbers as INDEXES; there is no index 200`;

const BOUNDS = `ZRANGE leaderboard -inf +inf BYSCORE
# 1) "sara"
# 2) "ali"
# 3) "yassin"      -> everything
ZRANGE leaderboard 250 +inf BYSCORE
# 1) "ali"
# 2) "yassin"      -> 250 is included
ZRANGE leaderboard (250 +inf BYSCORE
# 1) "yassin"      -> the ( excludes the member at exactly 250`;

const LIMIT = `ZRANGE leaderboard -inf +inf BYSCORE REV LIMIT 0 10
# 1) "yassin"
# 2) "ali"
# 3) "sara"        -> LIMIT offset count; page two is LIMIT 10 10
ZRANGE leaderboard 0 -1 LIMIT 0 10
# (error) ERR syntax error, LIMIT is only supported in combination with either BYSCORE or BYLEX`;

const ZREMRANGE = `ZREMRANGEBYSCORE leaderboard -inf 200
# (integer) 1      -> sara, at 175, was in the range
ZCARD leaderboard
# (integer) 2`;

const RATE_SETUP = `ZADD reqs:user1 940 "r1"
# (integer) 1
ZADD reqs:user1 970 "r2"
# (integer) 1
ZADD reqs:user1 995 "r3"
# (integer) 1      -> three requests already made`;

const RATE_CHECK = `# a request arrives at second 1000; the window is the last sixty seconds
ZREMRANGEBYSCORE reqs:user1 -inf 940
# (integer) 1      -> r1 has aged out
ZCARD reqs:user1
# (integer) 2      -> two inside the window, under the limit of three
ZADD reqs:user1 1000 "r4"
# (integer) 1      -> allowed, and recorded`;

const COST = `ZRANGE huge:zset 0 9 REV
# 1) "yassin"
# ...              -> ten members, the window you actually wanted
ZCARD huge:zset
# (integer) 1000000
ZREVRANK huge:zset "yassin"
# (integer) 41     -> one member's standing, O(log N)
ZSCORE huge:zset "yassin"
# "350"`;

const NODE = `await client.zAdd('leaderboard', [{ score: 100, value: 'yassin' }]);   // -> new members
await client.zIncrBy('leaderboard', 50, 'yassin');                     // -> number
await client.zScore('leaderboard', 'yassin');                          // -> number | null
await client.zCard('leaderboard');                                     // -> number
await client.zRevRank('leaderboard', 'sara');                          // -> number | null

await client.zRange('leaderboard', 0, 2, { REV: true });                // -> string[]
await client.zRangeWithScores('leaderboard', 0, 2, { REV: true });      // -> {value,score}[]
await client.zRangeByScore('leaderboard', 200, 400, { LIMIT: { offset: 0, count: 10 } });
await client.zRemRangeByScore('reqs:user1', '-inf', 940);              // -> number removed`;

export function SortedSetsDocs() {
    return (
        <>
            {/* ---------- part 1 — the one addition that changes everything ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Score and Member</PartHeading>
            <div>
                <DocSection title="ZADD">
                    <CodeBlock code={ZADD} lang="bash" />
                    <p>
                        <Term>
                            A sorted set holds MEMBERS, each carrying a SCORE, and the
                            members are ORDERED BY SCORE.
                        </Term>{" "}
                        You <em>add</em> a member and later <em>increment</em> its score; the
                        ordering is Redis&apos;s job and it is maintained permanently, not
                        computed when you read.
                    </p>
                    <p>
                        <Term>
                            The members went in unordered and came back sorted, lowest score
                            first.
                        </Term>{" "}
                        Nothing sorted them — <Code>ZADD</Code> placed each one where it
                        belonged as it was written.
                    </p>

                    <CodeBlock code={ZADD_ORDER} lang="bash" />

                    <Callout severity="trap" label="trap · score first, then member">
                        <p>
                            Getting the pair backwards does not reliably error.{" "}
                            <Code>ZADD k &quot;yassin&quot; 100</Code> does fail, because{" "}
                            <Code>&quot;yassin&quot;</Code> is not a valid float — but a
                            number is a perfectly legal member name, so{" "}
                            <Code>ZADD k 1 2</Code> silently stores a member called{" "}
                            <Code>&quot;2&quot;</Code> with score <Code>1</Code>. The
                            mistake surfaces later as missing data rather than as an error.
                        </p>
                    </Callout>

                    <CodeBlock code={ZADD_UPDATE} lang="bash" />
                    <p>
                        <Term>
                            Re-adding an existing member updates its score; it never
                            duplicates.
                        </Term>{" "}
                        Uniqueness comes from the set half of the type, so a member appears
                        exactly once no matter how often it is written.
                    </p>
                    <p>
                        <Term>
                            The <Code>0</Code> means no new member was added, only a score
                            changed.
                        </Term>{" "}
                        Same integer convention as <Code>SADD</Code> and{" "}
                        <Code>HSET</Code>: the reply counts what was created, not what was
                        written.
                    </p>

                    <Callout severity="note" label="note · reference · the ZADD modifiers">
                        <p>
                            <Code>NX</Code> and <Code>XX</Code> mean only-add and
                            only-update. <Code>GT</Code> and <Code>LT</Code> only move a
                            score up or down, which is what high-score semantics actually
                            want — a lower result should not overwrite a personal best.{" "}
                            <Code>CH</Code> makes the reply count changed members rather than
                            just new ones, and <Code>INCR</Code> makes <Code>ZADD</Code>{" "}
                            behave like <Code>ZINCRBY</Code> and return the resulting score.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the score is a float">
                    <CodeBlock code={FLOAT} lang="bash" />
                    <p>
                        <Term>
                            <Code>ZSCORE</Code> returns a string.
                        </Term>{" "}
                        The same reason as <Code>INCRBYFLOAT</Code>: a JavaScript number
                        cannot represent every value Redis can, so the reply stays textual.
                        Cast with <Code>Number()</Code> when you need arithmetic.
                    </p>
                    <p>
                        <Term>A score is a number, not a label.</Term> Any float works —
                        19.99 for a price, a Unix timestamp for a time, a plain integer for
                        points.
                    </p>

                    <Callout severity="note" label="note · reference · doubles and ties">
                        <p>
                            Scores are IEEE 754 doubles. Integers stay exact up to{" "}
                            <Code>2^53</Code>, which covers millisecond timestamps
                            comfortably; beyond that, equal-looking scores may not compare
                            equal. Members sharing a score are ordered LEXICOGRAPHICALLY,
                            which is what keeps the ordering deterministic instead of
                            arbitrary.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="ZINCRBY">
                    <CodeBlock code={ZINCRBY} lang="bash" />
                    <p>
                        <Term>
                            <Code>ZINCRBY</Code> returns the new score, as a string.
                        </Term>{" "}
                        This is the <Code>HINCRBY</Code> of sorted sets: atomic, no read, no
                        write-back, and the member is re-positioned in the ordering as part
                        of the same operation.
                    </p>
                    <p>
                        <Term>That is what makes leaderboards trivial.</Term> One command
                        per point scored, and the ranking is correct immediately — there is
                        no re-sorting step to run and nothing to keep in sync.
                    </p>

                    <QA
                        q={
                            <>
                                Two servers award points to the same player at the same
                                moment. Does the leaderboard stay correct?
                            </>
                        }
                        a={
                            <>
                                Yes. <Code>ZINCRBY</Code> is a single atomic command and it
                                re-positions the member as part of the same operation, so
                                both increments land and the order reflects both. Reading the
                                score, adding in the application and writing it back with{" "}
                                <Code>ZADD</Code> would lose one of them.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 2 — reading the ordering as positions ---------- */}
            <PartHeading kicker="part 2">Reading by Position</PartHeading>
            <div>
                <DocSection title="ZRANGE and REV">
                    <CodeBlock code={REV} lang="bash" />
                    <p>
                        <Term>
                            <Code>ZRANGE</Code> reads ascending by default;{" "}
                            <Code>REV</Code> reads descending.
                        </Term>{" "}
                        A leaderboard is almost always <Code>REV</Code>, because the
                        interesting end is the high scores.
                    </p>
                    <p>
                        <Term>
                            The index syntax is <Code>LRANGE</Code>&apos;s.
                        </Term>{" "}
                        <Code>0 -1</Code> is everything and <Code>0 2</Code> is the first
                        three — of the ordering you asked for, so <Code>0 2 REV</Code> is the
                        top three.
                    </p>

                    <Callout severity="note" label="note · reference · the older commands">
                        <p>
                            <Code>ZREVRANGE</Code> is the separate pre-6.2 command; since
                            Redis 6.2 the <Code>REV</Code> option on <Code>ZRANGE</Code>{" "}
                            replaces it, along with <Code>ZRANGEBYSCORE</Code> and{" "}
                            <Code>ZREVRANGEBYSCORE</Code>. They still work, and old code and
                            old tutorials are full of them — recognising them as the same
                            thing is the point.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="WITHSCORES">
                    <CodeBlock code={WITHSCORES} lang="bash" />
                    <p>
                        <Term>
                            <Code>WITHSCORES</Code> returns a flat alternating list: member,
                            score, member, score.
                        </Term>{" "}
                        The same shape as <Code>HGETALL</Code>, and the CLI numbers every
                        line rather than pairing them for you.
                    </p>
                    <p>
                        <Term>
                            That one command is a top-three leaderboard with its point
                            totals
                        </Term>{" "}
                        — no second round trip to fetch the scores the ordering was based on.
                    </p>
                </DocSection>

                <DocSection title="ZRANK and ZREVRANK">
                    <CodeBlock code={ZRANK} lang="bash" />
                    <p>
                        <Term>
                            A member&apos;s position is its RANK, and counting from the top
                            is the REVERSE RANK.
                        </Term>{" "}
                        <Code>ZRANK</Code> counts from the lowest score,{" "}
                        <Code>ZREVRANK</Code> from the highest.
                    </p>
                    <p>
                        <Term>Rank is ZERO-BASED.</Term> So &quot;sara is #3 on the
                        leaderboard&quot; is <Code>ZREVRANK</Code> plus one — the display
                        number and the stored rank are not the same number.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_1fr_max-content]"
                        head={["command", "counts from", "sara"]}
                        rows={[
                            ["ZRANK", "the LOWEST score", "0"],
                            ["ZREVRANK", "the HIGHEST score", "2"],
                            ["either, absent member", "nothing to count", "(nil)"],
                        ]}
                    />

                    <Callout severity="trap" label="trap · rank 0 is not nil">
                        <p>
                            A missing member returns <Code>(nil)</Code>, not{" "}
                            <Code>0</Code> — and <Code>0</Code> is a real rank, the very top
                            of the ordering. In node-redis that is <Code>0</Code> versus{" "}
                            <Code>null</Code>, so <Code>if (!rank)</Code> treats the leader
                            of the leaderboard exactly like somebody who is not on it.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            <Code>ZCARD</Code> is the member count
                        </Term>{" "}
                        — O(1), the <Code>SCARD</Code> of sorted sets.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 3 — reading the ordering as score ranges ---------- */}
            <PartHeading kicker="part 3">Reading by Score</PartHeading>
            <div>
                <DocSection title="BYSCORE">
                    <CodeBlock code={BYSCORE} lang="bash" />
                    <p>
                        <Term>
                            One keyword decides what the two numbers mean.
                        </Term>{" "}
                        Without <Code>BYSCORE</Code>, <Code>200 400</Code> is an INDEX
                        RANGE — positions 200 to 400, which a three-member set does not have.
                        With it, they are a SCORE RANGE.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["query", "200 400 means", "on this leaderboard"]}
                        rows={[
                            ["ZRANGE k 200 400", "indexes 200..400", "(empty array)"],
                            ["ZRANGE k 200 400 BYSCORE", "scores 200..400", "ali, yassin"],
                        ]}
                    />
                    <p>
                        <Term>Same command, same arguments, different question.</Term> This
                        is the one place on the page where a missing keyword produces a
                        plausible empty reply rather than an error.
                    </p>
                </DocSection>

                <DocSection title="bounds">
                    <CodeBlock code={BOUNDS} lang="bash" />
                    <p>
                        <Term>
                            <Code>-inf</Code> and <Code>+inf</Code> are valid bounds
                        </Term>
                        , so &quot;everything, by score&quot; is{" "}
                        <Code>-inf +inf BYSCORE</Code> — useful when the rest of the command
                        needs <Code>BYSCORE</Code> in order to accept an option.
                    </p>
                    <p>
                        <Term>
                            A bound is INCLUSIVE by default; a leading <Code>(</Code> makes
                            it EXCLUSIVE.
                        </Term>{" "}
                        <Code>(250</Code> means &quot;above 250, not 250 itself&quot;, which
                        is how you page by the last score you saw without repeating it.
                    </p>

                    <Callout severity="note" label="note · reference · BYLEX">
                        <p>
                            <Code>BYLEX</Code> ranges members lexicographically instead of
                            by score, with <Code>[</Code> and <Code>(</Code> for
                            inclusive and exclusive and <Code>-</Code> / <Code>+</Code> for
                            the extremes. It only makes sense when every member shares the
                            same score, and it is how autocomplete indexes get built on a
                            sorted set.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="LIMIT">
                    <CodeBlock code={LIMIT} lang="bash" />
                    <p>
                        <Term>
                            <Code>LIMIT offset count</Code> — the same idea as SQL.
                        </Term>{" "}
                        The first page is <Code>LIMIT 0 10</Code> and page two is{" "}
                        <Code>LIMIT 10 10</Code>.
                    </p>

                    <Callout severity="trap" label="trap · LIMIT needs BYSCORE or BYLEX">
                        <p>
                            With a plain index range <Code>LIMIT</Code> is a syntax error,
                            because the indexes already express the window — asking for
                            positions 0 to -1 and then for ten of them is two answers to the
                            same question. So paging a leaderboard by index uses{" "}
                            <Code>ZRANGE k 0 9 REV</Code>, and <Code>LIMIT</Code> is for when
                            the window is a score range.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · reference · the cost of deep pages">
                        <p>
                            Offset-based paging costs O(log N + offset), so page five
                            hundred is measurably slower than page one — the offset is
                            walked, not jumped to. Paging by the last score seen (
                            <Code>(lastScore +inf BYSCORE</Code>) stays cheap at any depth.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the score as time, which is the real pattern ---------- */}
            <PartHeading kicker="part 4">Sliding Windows</PartHeading>
            <div>
                <DocSection title="ZREMRANGEBYSCORE">
                    <CodeBlock code={ZREMRANGE} lang="bash" />
                    <p>
                        <Term>
                            <Code>ZREMRANGEBYSCORE</Code> deletes every member whose score
                            falls in the range, and returns how many it removed.
                        </Term>{" "}
                        One command for &quot;everything below this line is gone&quot;, with
                        no need to know which members those were.
                    </p>

                    <Callout severity="note" label="note · reference · the other removals">
                        <p>
                            <Code>ZREMRANGEBYRANK</Code> does the same thing by position —
                            &quot;keep the top 100&quot; — and <Code>ZREM</Code> removes
                            members you name, reporting how many were really there, like{" "}
                            <Code>SREM</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="rate limiting, worked through">
                    <p>
                        <Term>
                            The rule: at most three requests per minute per user. The score
                            is the TIMESTAMP of each request.
                        </Term>{" "}
                        Members are just labels here — what carries the meaning is when each
                        one happened.
                    </p>

                    <CodeBlock code={RATE_SETUP} lang="bash" />
                    <p>
                        <Term>
                            It is now second 1000, and this user has three requests on
                            record.
                        </Term>{" "}
                        The window is the last sixty seconds, so anything scored below 940 is
                        too old to count against them.
                    </p>

                    <CodeBlock code={RATE_CHECK} lang="bash" />
                    <p>
                        <Term>
                            Deleting what has aged out is TRIMMING A WINDOW, and this shape
                            is a SLIDING (or ROLLING) WINDOW
                        </Term>{" "}
                        rather than a FIXED one. Every call trims first and counts second, so
                        the set never grows beyond the window.
                    </p>
                    <p>
                        <Term>Why a sorted set: the score is time.</Term> &quot;Everything
                        older than X&quot; becomes a single range delete — no scanning, no
                        per-request keys to expire, and the count that follows is O(1).
                    </p>

                    <Callout severity="note" label="note · reference · making it correct">
                        <p>
                            The three commands belong in one <Code>MULTI</Code> or one Lua
                            script: run separately, two concurrent requests can both trim,
                            both count two, and both be allowed. The key also wants an{" "}
                            <Code>EXPIRE</Code> slightly longer than the window, so an idle
                            user&apos;s key disappears on its own instead of living forever
                            at zero members&apos; worth of usefulness.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="other things the score can be">
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["the score is", "and you have"]}
                        rows={[
                            ["a count of points", "a leaderboard"],
                            ["a timestamp", "a time window"],
                            [
                                "a priority number",
                                "a priority queue — ZRANGE ... LIMIT 0 1 is the most urgent job",
                            ],
                            ["a geohash", "the GEO commands, built on this type"],
                        ]}
                    />
                    <p>
                        <Term>
                            The type does not change; only what you decide the number means.
                        </Term>{" "}
                        Every pattern on this page is the same two operations — order by
                        score, and read or delete a range of it.
                    </p>

                    <Callout severity="note" label="note · reference · ZPOPMIN and ZPOPMAX">
                        <p>
                            <Code>ZPOPMIN</Code> and <Code>ZPOPMAX</Code> remove and return
                            the extreme member, and <Code>BZPOPMIN</Code> /{" "}
                            <Code>BZPOPMAX</Code> are their blocking forms — a priority queue
                            with exactly the shape <Code>BRPOP</Code> gives a list, and the
                            same rule about needing its own connection.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                Why is a sorted set the right structure for a sliding-window
                                rate limiter, rather than a counter with a TTL?
                            </>
                        }
                        a={
                            <>
                                A counter with a TTL resets in fixed buckets, so a user can
                                spend the whole quota at the end of one window and again at
                                the start of the next. Timestamps as scores let you delete
                                exactly what has aged out and count what remains, which is a
                                true rolling window.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 5 — what the ordering costs ---------- */}
            <PartHeading kicker="part 5">Limits</PartHeading>
            <div>
                <DocSection title="cost">
                    <CodeBlock code={COST} lang="bash" />
                    <p>
                        <Term>
                            Writes and rank lookups are O(log N), not O(1).
                        </Term>{" "}
                        The ordering is kept in a skiplist rather than a hash table, so a
                        sorted set is slightly more expensive than a plain set — and still
                        cheap enough that the ordering is nearly free.
                    </p>

                    <Callout severity="danger" label="danger · ZRANGE 0 -1 on a large sorted set">
                        <p>
                            This is the <Code>SMEMBERS</Code> mistake again: one blocking
                            reply holding every member, built on the single thread while
                            every other client waits. Ask for the window you need (
                            <Code>0 9 REV</Code>), the count (<Code>ZCARD</Code>), or one
                            member&apos;s standing (<Code>ZSCORE</Code>,{" "}
                            <Code>ZREVRANK</Code>) — and use <Code>ZSCAN</Code> when you
                            genuinely have to walk a large one.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · how a sorted set is encoded"
                    >
                        <p>
                            A small sorted set is stored as a <Code>listpack</Code>. Past{" "}
                            <Code>zset-max-listpack-entries</Code> or{" "}
                            <Code>zset-max-listpack-value</Code> it converts to a{" "}
                            <Code>skiplist</Code>, and like every conversion it is permanent
                            — see the <Code>OBJECT ENCODING</Code> section of Inspecting the
                            Keyspace.
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
                        The member field is called <Code>value</Code>, not{" "}
                        <Code>member</Code>.
                    </Term>{" "}
                    <Code>{"{ score, value }"}</Code> going in, and the same key coming back
                    out of the <Code>WithScores</Code> variants.
                </p>
                <p>
                    <Term>
                        <Code>zRangeWithScores</Code> returns an array of objects
                    </Term>
                    , not the flat alternating list the CLI shows — so there is no pairing
                    step, and no chance of pairing it wrong.
                </p>
                <p>
                    <Term>
                        <Code>zScore</Code> returns a number in v5
                    </Term>{" "}
                    even though the CLI shows a quoted string, and <Code>null</Code> when
                    the member is absent. A score of <Code>0</Code> and a missing member are{" "}
                    <Code>0</Code> versus <Code>null</Code> — both falsy, and not the same
                    thing. The same care <Code>zRevRank</Code> needs for rank{" "}
                    <Code>0</Code>.
                </p>
            </DocSection>
        </>
    );
}
