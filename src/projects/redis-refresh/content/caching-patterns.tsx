import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header — that is
// the explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is
// one severity. No section on this page is.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Cache-Aside) ---
    // inline `danger · the TTL is not optional` callout, plus a
    // `note · reference` on negative caching
    "the-shape-in-code": ["danger", "note"],

    // --- part 2 (Choosing a TTL) ---
    // inline `note · reference` callout — TTL jitter
    "the-question-ttl-answers": ["note"],

    // --- part 3 (The Stampede) ---
    // inline `danger · the cache synchronises the load it was meant to absorb`
    // callout, carrying the failure mode itself
    "what-goes-wrong": ["danger"],
    // inline `trap · the lock is named after the DATA` callout, plus a
    // `note · reference` on the safe release and bounded retries
    "walked-through-request-by-request": ["trap", "note"],

    // --- part 4 (Invalidation on Write) ---
    // inline `danger · cache first, database second` callout, plus a
    // `note · reference` on closing the window entirely
    "the-order-is-a-bug-waiting-to-happen": ["danger", "note"],
    // inline `note · reference` callout — SCAN + UNLINK, versioned prefixes
    "keys-you-forgot-about": ["note"],

    // --- part 5 (When Redis Is Down) ---
    // inline `trap · a rate limiter is not a cache` callout, plus a
    // `note · reference` on a JSON.parse that throws on a hit
    "degrade-to-slow-not-to-broken": ["trap", "note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace,
// strings-and-counters, hashes, lists, sets, sorted-sets, atomicity and the hooks
// content files each define for their own part dividers.
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
// sets / sorted-sets / atomicity use — a real <table> would be the only one in
// the codebase. The markup, the cell padding and the three text colours (head,
// first column, rest) are unchanged. `cols` is a literal grid-template-columns
// utility so Tailwind sees it at build time.
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

const CACHE_ASIDE = `async function getUser(id) {
  const key = \`user:\${id}\`;

  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);        // hit

  const user = await db.users.findById(id);     // miss
  if (!user) return null;

  await redis.set(key, JSON.stringify(user), { EX: 300 });
  return user;
}`;

const JITTER = `await redis.set(key, JSON.stringify(user), {
  EX: 300 + Math.floor(Math.random() * 60),     // 300–359s, not 300 for everyone
});`;

const LOCK = `async function getUser(id) {
  const key = \`user:\${id}\`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const gotLock = await redis.set(\`lock:\${key}\`, '1', { NX: true, EX: 10 });

  if (!gotLock) {
    await sleep(50);
    return getUser(id);            // someone else is rebuilding — retry
  }

  const user = await db.users.findById(id);
  await redis.set(key, JSON.stringify(user), { EX: 300 });
  await redis.del(\`lock:\${key}\`);
  return user;
}`;

const INVALIDATE_DEL = `await db.users.update(id, data);
await redis.del(\`user:\${id}\`);`;

const INVALIDATE_SET = `await db.users.update(id, data);
await redis.set(\`user:\${id}\`, JSON.stringify(data), { EX: 300 });`;

const ORDER_WRONG = `await redis.del(key);         // cache cleared
await db.users.update(...);   // a concurrent read loads the OLD row and caches it`;

const ORDER_RIGHT = `await db.users.update(...);
await redis.del(key);`;

const DEGRADE = `async function getUser(id) {
  try {
    const cached = await redis.get(\`user:\${id}\`);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn('cache unavailable', err);      // don't rethrow
  }

  return db.users.findById(id);
}`;

export function CachingPatternsDocs() {
    return (
        <>
            {/* ---------- part 1 — the pattern itself, which is the small part ---------- */}
            <PartHeading kicker="part 1">Cache-Aside</PartHeading>
            <div>
                <DocSection title="the three steps">
                    <p>
                        <Term>
                            The application asks Redis first, and only touches the real
                            database on a miss.
                        </Term>{" "}
                        Three steps, and there is nothing more to the pattern than this:{" "}
                        <Code>GET</Code> the key, and a HIT returns immediately; a MISS
                        queries the database; <Code>SET</Code> the result with a TTL, then
                        return it.
                    </p>
                    <p>
                        <Term>
                            A read served from Redis is a HIT; one that falls through to the
                            database is a MISS.
                        </Term>{" "}
                        The proportion of reads that hit is the HIT RATE — the one number
                        that says whether the cache is earning its keep. A freshly emptied
                        cache is COLD, every read is a miss, and it stays that way until
                        enough traffic has filled it and it is WARM.
                    </p>
                    <p>
                        <Term>Redis never talks to your database.</Term> The application
                        orchestrates: it reads, it decides, it queries, it writes back.
                        Redis has no idea it is being used as a cache — as far as the server
                        is concerned it is answering a <Code>GET</Code> and accepting a{" "}
                        <Code>SET</Code>, exactly as it would for any other key.
                    </p>
                    <p>
                        <Term>
                            Which is why the engineering is not in the <Code>GET</Code> and
                            the <Code>SET</Code>.
                        </Term>{" "}
                        Those two lines are the pattern you will write ninety per cent of the
                        time and they are never the hard part. Choosing a TTL, surviving the
                        moment a hot key expires, invalidating on write in the right order,
                        and deciding what happens when Redis is down — that is the rest of
                        this page.
                    </p>
                </DocSection>

                <DocSection title="the shape in code">
                    <CodeBlock code={CACHE_ASIDE} lang="js" />
                    <p>
                        <Term>Read the three steps straight down the function.</Term> The
                        early return on <Code>cached</Code> is the hit path and it never
                        reaches the database. Everything below it is the miss path, and it
                        ends by writing what it found back into the cache so the next caller
                        takes the early return instead.
                    </p>

                    <Callout severity="danger" label="danger · the TTL is not optional">
                        <p>
                            A cache entry written without an expiry is PERMANENT STALE DATA.
                            It survives every deploy and every schema change, and it will sit
                            there being wrong until something explicitly deletes it — or
                            until <Code>maxmemory</Code> eviction happens to pick it, which
                            is not a policy, it is a coincidence. The{" "}
                            <Code>{"{ EX: 300 }"}</Code> is what makes this a cache rather
                            than a second database nobody maintains.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · caching the absence of a row"
                    >
                        <p>
                            The function above returns <Code>null</Code> without caching
                            anything, so every lookup for a user that does not exist hits the
                            database every time. Caching that answer — &quot;this user does
                            not exist&quot; — is NEGATIVE CACHING, and it needs a much
                            shorter TTL than a real value. Give a missing row the same three
                            hundred seconds and a user who signs up is a missing user for
                            five minutes after they were created.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="why a string and not a hash here">
                    <p>
                        <Term>
                            The whole document is read and written as a unit, so a JSON string
                            is the right call.
                        </Term>{" "}
                        A cache entry is fetched whole, replaced whole and deleted whole —
                        there is no field-level access to lose, so the objection to a JSON
                        blob does not apply. <Code>JSON.stringify</Code> in,{" "}
                        <Code>JSON.parse</Code> out, one round trip either way.
                    </p>
                    <p>
                        <Term>
                            It becomes the wrong call the moment you want to update one field
                            without rewriting the rest.
                        </Term>{" "}
                        That is read-modify-write in the application, with the lost-update
                        window it always carries — the blob section of Strings &amp; Counters
                        has the four steps and the concurrency problem, and Hashes has the
                        field-level commands that replace them. The unit of access is the
                        question, and for a cache the unit is the whole value.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — the number nobody wants to be responsible for ---------- */}
            <PartHeading kicker="part 2">Choosing a TTL</PartHeading>
            <div>
                <DocSection title="the question TTL answers">
                    <p>
                        <Term>TTL is your tolerance for staleness, expressed in seconds.</Term>{" "}
                        It is not a performance setting and it is not a memory setting. The
                        engineering question it answers is &quot;how wrong can this be, for
                        how long, before someone cares?&quot; — and that is a product
                        question wearing a number.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["data", "typical TTL"]}
                        rows={[
                            ["session / auth token", "minutes to hours"],
                            ["user profile", "5–15 minutes"],
                            ["product listing, prices", "30–60 seconds"],
                            ['counts, feeds, "trending"', "10–60 seconds"],
                            ["expensive report or aggregate", "hours"],
                        ]}
                    />
                    <p>
                        <Term>Short TTL, long TTL — you are trading one cost for another.</Term>{" "}
                        A short TTL means fresher data and more database load, because the
                        entry rebuilds more often. A long TTL means cheaper reads and more
                        staleness. There is no correct answer to find, only the one the
                        product tolerates.
                    </p>

                    <Callout severity="note" label="note · reference · TTL jitter">
                        <CodeBlock code={JITTER} lang="js" />
                        <p className="mt-3">
                            Giving every key the same TTL means they all expire together,
                            because a deploy warmed them all at the same moment. Adding a
                            small random offset spreads the rebuild out over a minute instead
                            of concentrating it in one second. That is JITTER, and it is the
                            cheapest mitigation there is for the failure mode in the next
                            part.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — the thing that takes systems down ---------- */}
            <PartHeading kicker="part 3">The Stampede</PartHeading>
            <div>
                <DocSection title="what goes wrong">
                    <p>
                        <Term>A popular key expires.</Term> In that instant five hundred
                        concurrent requests all <Code>GET</Code> it, all miss, and all send
                        the same query to the database — because every one of them ran the
                        miss path, and the miss path queries.
                    </p>
                    <p>
                        <Term>
                            The cache did not reduce load. It SYNCHRONISED it into a spike.
                        </Term>{" "}
                        A database comfortably serving ten queries a second suddenly receives
                        five hundred at once, all identical, all redundant — four hundred and
                        ninety-nine of them computing a value another request is already
                        computing.
                    </p>
                    <p>
                        <Term>
                            Many requests rebuilding the same expired key at once is a CACHE
                            STAMPEDE, also called a THUNDERING HERD.
                        </Term>{" "}
                        Both names describe the same shape: the expiry is a starting gun, and
                        everybody runs.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · the cache synchronises the load it was meant to absorb"
                    >
                        <p>
                            This is the failure mode that takes systems down, and the cruel
                            part is that it gets WORSE as the cache gets more effective. A
                            key with a ninety-nine per cent hit rate is a key almost all of
                            your traffic depends on — so the one second in which it does not
                            exist is the one second in which all of that traffic arrives at
                            the database at the same time. The better the cache, the bigger
                            the spike when it blinks.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the lock">
                    <CodeBlock code={LOCK} lang="js" />
                    <p>
                        <Term>
                            Exactly one request reaches the database, because exactly one
                            request wins the <Code>NX</Code>.
                        </Term>{" "}
                        The other four hundred and ninety-nine lose it, wait fifty
                        milliseconds, call the function again and find the fresh value
                        already sitting in the cache. The database sees one query where it
                        would have seen five hundred.
                    </p>
                    <p>
                        <Term>
                            The <Code>EX: 10</Code> on the lock is not decoration.
                        </Term>{" "}
                        If the rebuilding process crashes between taking the lock and
                        deleting it, the lock releases itself ten seconds later and the next
                        request rebuilds. Without it the <Code>DEL</Code> is the only thing
                        that ever removes the key, and a process that dies before reaching it
                        leaves every subsequent request sleeping and retrying forever — the
                        deadlock callout in Strings &amp; Counters is this exact key with the
                        expiry left off.
                    </p>
                </DocSection>

                <DocSection title="walked through, request by request">
                    <p>
                        <Term>The setup.</Term> Five hundred people open the profile of user
                        42 at the same moment, and <Code>user:42</Code> has just expired.
                    </p>
                    <p>
                        <Term>Request #1.</Term> <Code>GET user:42</Code> answers{" "}
                        <Code>nil</Code> — a miss.{" "}
                        <Code>SET lock:user:42 1 NX EX 10</Code> answers <Code>OK</Code>: the
                        key did not exist, so it won. It queries the database.
                    </p>
                    <p>
                        <Term>Request #2, one millisecond later.</Term>{" "}
                        <Code>GET user:42</Code> answers <Code>nil</Code>, still a miss,
                        because #1 has not finished.{" "}
                        <Code>SET lock:user:42 1 NX EX 10</Code> answers <Code>nil</Code>:
                        the lock exists, so <Code>NX</Code> refuses. Because it lost, it
                        sleeps fifty milliseconds instead of touching the database.
                    </p>
                    <p>
                        <Term>Requests #3 to #500.</Term> Identical to #2. All of them get{" "}
                        <Code>nil</Code> from the lock, all of them sleep.
                    </p>
                    <p>
                        <Term>Back in #1.</Term> The query returns.{" "}
                        <Code>SET user:42 &lt;json&gt; EX 300</Code> warms the cache, and{" "}
                        <Code>DEL lock:user:42</Code> releases the lock.
                    </p>
                    <p>
                        <Term>#2 wakes after fifty milliseconds</Term> and calls the function
                        again. <Code>GET user:42</Code> returns the JSON — a hit. It returns
                        without ever touching the database, and so does every one of #3 to
                        #500. Total database queries: ONE.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the lock is named after the DATA, not the caller"
                    >
                        <p>
                            <Code>lock:user:42</Code> is derived from the DATA BEING FETCHED,
                            not from the user making the request. All five hundred requests
                            compute the same lock name, which is exactly what makes them
                            collide — and collision is the point. A lock keyed by session,
                            request id or anything else per-caller gives five hundred
                            different locks, five hundred winners, and the stampede you were
                            trying to prevent.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            The corollary: this only helps when many requests want the SAME
                            key.
                        </Term>{" "}
                        Five hundred users each opening their own profile is five hundred
                        different keys and five hundred legitimate queries. There is no
                        stampede there, nothing to collapse, and every request wins its own
                        lock instantly — the mechanism costs one extra round trip and changes
                        nothing else.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · the release, and the waiting"
                    >
                        <p>
                            Releasing the lock with a plain <Code>DEL</Code> is unsafe if the
                            TTL expired first: the rebuild ran long, the lock lapsed, another
                            process took it, and your <Code>DEL</Code> now deletes THEIR
                            lock. The correct release compares the value before deleting,
                            which is not expressible as one Redis command — it needs a Lua
                            script, and that is the Lua Scripts page. Waiting with a fixed
                            sleep and a recursive call is the simple version too: production
                            code bounds the retries and backs off rather than recursing
                            indefinitely on a rebuild that may never finish.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                Why does adding a lock to a cache miss reduce database load,
                                when the lock itself is an extra Redis round trip?
                            </>
                        }
                        a={
                            <>
                                Because the round trip is measured in microseconds and the
                                database query it prevents is measured in milliseconds,
                                multiplied by every concurrent request that would have run it.
                                The lock trades a cheap operation for the elimination of a
                                synchronised spike.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 4 — the write side, where the ordering bug lives ---------- */}
            <PartHeading kicker="part 4">Invalidation on Write</PartHeading>
            <div>
                <DocSection title="delete or overwrite">
                    <p>
                        <Term>
                            Data that no longer matches the source of truth is STALE.
                        </Term>{" "}
                        Removing it deliberately is INVALIDATION; letting its TTL remove it
                        is EVICTION BY TTL. Neither is &quot;clearing&quot; the cache — that
                        word covers both and distinguishes nothing, and the difference
                        between them is the whole of this part.
                    </p>
                    <p>
                        <Term>When the data changes, the cache is wrong. Two options.</Term>{" "}
                        Delete the entry, or overwrite it. They are not equivalent, and one
                        of them is the default for a reason.
                    </p>

                    <CodeBlock code={INVALIDATE_DEL} lang="js" />
                    <p>
                        <Term>Delete it — cache-aside, the standard.</Term> The next read
                        misses and rebuilds from the database, which means the value that
                        lands in the cache is a value the read path actually produced.
                    </p>

                    <CodeBlock code={INVALIDATE_SET} lang="js" />
                    <p>
                        <Term>Overwrite it — write-through.</Term> No miss, so the next
                        reader pays nothing. But you are caching data nobody may ever read,
                        and the cached shape has to match EXACTLY what a read would have
                        produced — the same joins, the same derived fields, the same
                        serialisation. The moment the write path and the read path disagree
                        about the shape, you have cached a wrong value that looks perfectly
                        valid.
                    </p>
                    <p>
                        <Term>Delete is the safer default,</Term> because it cannot cache a
                        wrong value. The worst it can do is cause a miss.
                    </p>
                </DocSection>

                <DocSection title="the order is a bug waiting to happen">
                    <Callout
                        severity="danger"
                        label="danger · cache first, database second is wrong"
                    >
                        <CodeBlock code={ORDER_WRONG} lang="js" />
                        <p className="mt-3">
                            Between those two lines a concurrent read finds nothing in the
                            cache, loads the OLD row from the database — the update has not
                            landed yet — and writes it back. And it arrives with a fresh
                            three-hundred-second TTL, so the staleness OUTLIVES the request
                            that caused it. You invalidated the cache and ended up with a
                            wrong value that will now sit there for five minutes.
                        </p>
                    </Callout>

                    <CodeBlock code={ORDER_RIGHT} lang="js" />
                    <p>
                        <Term>Database first, cache second.</Term> The window still exists —
                        a read can land between the update committing and the{" "}
                        <Code>DEL</Code> — but it is much smaller, and the value that gets
                        cached in it is at least the NEW one. Wrong-for-microseconds instead
                        of wrong-for-five-minutes.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · closing the window entirely"
                    >
                        <p>
                            Removing the remaining window needs either a short-lived &quot;do
                            not cache this key&quot; marker that the read path checks before
                            writing, or a second <Code>DEL</Code> issued a moment later — the
                            DELAYED DOUBLE DELETE. Both are real complexity: an extra key to
                            reason about, or a background job that has to actually run. Take
                            it on when the staleness actually hurts, not because the window
                            exists on paper.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="keys you forgot about">
                    <p>
                        <Term>One update often invalidates more than one key.</Term>{" "}
                        <Code>user:42</Code> is the obvious one. The list the user appears in,
                        a cached count, a rendered fragment with their name in it — those are
                        cached too, under keys the write path never mentions, and they are
                        the ones that go stale silently.
                    </p>
                    <p>
                        <Term>
                            Deriving cache keys in a single helper, next to the write that
                            invalidates them, is what keeps them in sync.
                        </Term>{" "}
                        A key spelled out as a template literal in four files is four places
                        to forget. One function that returns every key derived from a user id
                        is one place to update when a fifth key appears.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · invalidating a whole family"
                    >
                        <p>
                            Deleting keys by pattern means <Code>SCAN</Code> plus{" "}
                            <Code>UNLINK</Code>, which is a maintenance operation and not
                            something to run inside a request — it walks the keyspace, and the
                            cost scales with how much of it there is. Versioned key prefixes
                            avoid the walk entirely: cache under <Code>user:v2:42</Code>, and
                            changing one constant to <Code>v3</Code> invalidates the whole
                            family at once, leaving the old generation to expire on its own
                            TTL.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — the outage, and the per-use-case decision it forces ---------- */}
            <PartHeading kicker="part 5">When Redis Is Down</PartHeading>
            <div>
                <DocSection title="degrade to slow, not to broken">
                    <CodeBlock code={DEGRADE} lang="js" />
                    <p>
                        <Term>
                            A cache read failure should make the application SLOW, not BROKEN.
                        </Term>{" "}
                        The <Code>try</Code> covers the cache read and nothing else; the
                        database call sits outside it, on the normal path, so an unreachable
                        Redis simply means every request takes the miss path. Continuing to
                        work with reduced performance is GRACEFUL DEGRADATION.
                    </p>
                    <p>
                        <Term>
                            If a Redis outage takes down your app, Redis stopped being a cache
                            and became a HARD DEPENDENCY.
                        </Term>{" "}
                        That is a design change nobody announced — it happened the first time
                        an exception from <Code>redis.get</Code> was allowed to propagate out
                        of a read path. The whole premise of a cache is that the source of
                        truth is still there.
                    </p>

                    <Callout severity="trap" label="trap · a rate limiter is not a cache">
                        <p>
                            The exception matters. Rate limiters, locks and session stores are
                            NOT caches, and swallowing an error in any of them removes a
                            guarantee rather than a speed-up: requests bypass the limiter, two
                            workers hold the same lock and both do the work, or everyone is
                            logged out. There the failure has to SURFACE as a real error. The
                            policy is a deliberate choice per use case — the{" "}
                            <Code>catch</Code> above is correct here and a security hole three
                            files over.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · a hit that throws"
                    >
                        <p>
                            <Code>JSON.parse</Code> of a corrupted value, or of one written
                            before a shape change, throws on what looks like a perfectly good
                            cache HIT — and it throws outside the outage the{" "}
                            <Code>catch</Code> above was written for. Wrapping the parse and
                            treating a failure as a MISS makes deploys that change a cached
                            shape survivable: the bad entry is simply rebuilt on read instead
                            of taking the request down with it.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                Your Redis instance is unreachable. Should the request fail?
                            </>
                        }
                        a={
                            <>
                                For a cache, no — fall through to the database, log it, and
                                serve a slower response. For a rate limiter or a lock it
                                usually must fail, because silently continuing removes the
                                guarantee the code depends on. The decision is per use case,
                                not global.
                            </>
                        }
                    />
                </DocSection>
            </div>
        </>
    );
}
