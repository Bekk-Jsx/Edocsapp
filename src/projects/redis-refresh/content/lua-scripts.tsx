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
    // --- part 1 (EVAL) ---
    // inline `trap · Lua arrays start at 1` callout, plus a
    // `note · reference` on the type conversion rules in both directions
    "keys-and-argv": ["trap", "note"],

    // --- part 2 (Why: The Safe Lock Release) ---
    // inline `danger · DEL releases whichever lock is there` callout, carrying
    // the two-terminal session that proves it
    "the-bug-del-creates": ["danger"],

    // --- part 3 (SCRIPT LOAD and EVALSHA) ---
    // inline `danger · the script cache is not persistent` callout
    noscript: ["danger"],
    // inline `note · reference` on SCRIPT EXISTS / FLUSH and Redis 7 functions
    "managing-several-scripts": ["note"],

    // --- part 4 (The Rate Limiter, Line by Line) ---
    // inline `note · reference` on returning a retry-after delay, and the clock
    "the-body": ["note"],

    // --- part 5 (Rules and Traps) ---
    // inline `danger · a script blocks the whole server` callout, plus a
    // `note · reference` on BUSY, SCRIPT KILL and the unkillable case
    "scripts-block-the-server": ["danger", "note"],
    // inline `trap · declaring keys is how the script finds its server` callout,
    // plus a `note · reference` on hash slots and hash tags
    "all-keys-must-be-declared-in-keys": ["trap", "note"],
    // inline `danger · a failed command does not undo the others` callout, plus
    // a `note · reference` on redis.pcall
    "a-script-has-no-rollback-either": ["danger", "note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace,
// strings-and-counters, hashes, lists, sets, sorted-sets, atomicity,
// caching-patterns and the hooks content files each define for their own part
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
// GridTable in inspecting-the-keyspace / strings-and-counters / hashes / lists /
// sets / sorted-sets / atomicity / caching-patterns use — a real <table> would be
// the only one in the codebase. The markup, the cell padding and the three text
// colours (head, first column, rest) are unchanged. `cols` is a literal
// grid-template-columns utility so Tailwind sees it at build time.
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

const EVAL_SHAPE = `EVAL <script> <numkeys> [keys...] [args...]

EVAL "return 1" 0
# (integer) 1
EVAL "return 'hello'" 0
# "hello"           -> zero keys, so nothing follows the 0`;

const EVAL_ONE_KEY = `EVAL "return redis.call('GET', KEYS[1])" 1 balance
# "500"             -> \`1 balance\` declares one key; inside the script it is KEYS[1]`;

const EVAL_TABLE = `EVAL "return {redis.call('GET', KEYS[1]), redis.call('GET', KEYS[2])}" 2 balance a
# 1) "500"
# 2) "1"            -> a Lua table comes back as an array reply`;

const EVAL_ARGV = `EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey "hello"
# OK                -> one key, then one non-key argument: ARGV[1] is "hello"`;

const LOCK_TAKE = `SET lock:job1 "worker-a" NX EX 30
# OK                -> worker A took the lock and may run the job
SET lock:job1 "worker-b" NX EX 30
# (nil)             -> taken; workers B to J skip the job`;

// Two terminals, so this is not one paste-able session.
const STALE_LOCK = `# first terminal — worker A takes the lock with a short TTL
SET lock:job1 "worker-a" NX EX 5
# OK
# ...wait six seconds; the lock expires on its own

# second terminal — worker B takes the now-free lock
redis-cli SET lock:job1 "worker-b" NX EX 30
# OK

# first terminal — worker A finishes its slow job and releases
DEL lock:job1
# (integer) 1       -> it just deleted WORKER B'S lock`;

const SAFE_RELEASE = `EVAL "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end" 1 lock:job1 "worker-a"
# (integer) 0       -> the value is "worker-b", so nothing was deleted
GET lock:job1
# "worker-b"        -> B still owns it, untouched`;

const WATCH_RELEASE = `async function release(client, key, myName) {
  while (true) {
    await client.watch(key);
    const owner = await client.get(key);

    if (owner !== myName) {
      await client.unwatch();
      return false;                  // not mine — don't delete
    }

    const multi = client.multi();
    multi.del(key);
    const res = await multi.exec();

    if (res !== null) return true;   // deleted
    // null -> someone changed it, loop and re-read
  }
}`;

const SCRIPT_LOAD = `SCRIPT LOAD "return redis.call('GET', KEYS[1])"
# "a5260dd66ce02462c5b5231c727b3f7772c0bcc5"
EVALSHA a5260dd66ce02462c5b5231c727b3f7772c0bcc5 1 balance
# "500"             -> same arguments, no script text`;

const SCRIPTS_MODULE = `// src/lib/redis/scripts.js
export const SCRIPTS = {
  releaseLock: {
    src: \`if redis.call('GET', KEYS[1]) == ARGV[1]
            then return redis.call('DEL', KEYS[1]) else return 0 end\`,
    sha: null,
  },
  rateLimit: {
    src: \`...\`,
    sha: null,
  },
};

export async function loadScripts(client) {
  for (const s of Object.values(SCRIPTS)) {
    s.sha = await client.scriptLoad(s.src);
  }
}`;

const RUN_HELPER = `async function run(client, script, keys, args) {
  try {
    return await client.evalSha(script.sha, { keys, arguments: args });
  } catch (err) {
    if (!err.message.includes('NOSCRIPT')) throw err;
    script.sha = await client.scriptLoad(script.src);   // reload and retry
    return await client.evalSha(script.sha, { keys, arguments: args });
  }
}

await run(client, SCRIPTS.releaseLock, ['lock:job1'], ['worker-a']);`;

const RATE_LIMIT = `local now    = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit  = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)
local count = redis.call('ZCARD', KEYS[1])

if count >= limit then return 0 end

redis.call('ZADD', KEYS[1], now, now .. '-' .. math.random())
redis.call('EXPIRE', KEYS[1], window)
return 1`;

const RATE_LIMIT_CALL = `await run(client, SCRIPTS.rateLimit, ['reqs:user1'], [Date.now(), 60000, 3]);`;

const ZREM_RANGE = `ZADD z 10 "a" 20 "b" 30 "c"
# (integer) 3
ZREMRANGEBYSCORE z -inf 20
# (integer) 2       -> how many members it removed
ZRANGE z 0 -1
# 1) "c"`;

const CLUSTER_DECLARED = `EVAL "return redis.call('GET', KEYS[1])" 1 balance
# the client sees \`balance\`, computes which node owns it, sends the script there`;

const CLUSTER_HARDCODED = `EVAL "return redis.call('GET', 'balance')" 0
# zero keys declared, so the client sends the script to an arbitrary node —
# and it errors if that node does not own \`balance\``;

const SCRIPT_NO_ROLLBACK = `redis.call('SET', KEYS[1], 'a')
redis.call('INCR', KEYS[1])       -- errors: 'a' is not an integer`;

export function LuaScriptsDocs() {
    return (
        <>
            {/* ---------- part 1 — the command, and how arguments reach the script ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">EVAL</PartHeading>
            <div>
                <DocSection title="a script is one command">
                    <p>
                        <Term>
                            From Redis&apos;s point of view a script is a SINGLE COMMAND.
                        </Term>{" "}
                        It runs on the single thread, and nothing else executes until it
                        finishes — a script is ATOMIC and UNINTERRUPTIBLE in exactly the
                        sense one <Code>INCR</Code> is.
                    </p>
                    <p>
                        <Term>
                            That is what makes read-then-decide safe with NO RETRY.
                        </Term>{" "}
                        <Code>WATCH</Code> handles read-then-decide by DETECTING a conflict
                        and retrying. Lua removes the conflict: the read and the decision
                        both happen inside Redis, in one uninterruptible step. No retry
                        loop, and no round trips in the middle for another client to slip
                        into.
                    </p>
                </DocSection>

                <DocSection title="EVAL and numkeys">
                    <CodeBlock code={EVAL_SHAPE} lang="bash" />
                    <p>
                        <Term>
                            You EVALUATE — or RUN — a script with <Code>EVAL</Code>.
                        </Term>{" "}
                        The script is a string, and what it returns is what the command
                        answers. <Code>return 1</Code> answers an integer,{" "}
                        <Code>return &apos;hello&apos;</Code> answers a bulk string.
                    </p>
                    <p>
                        <Term>
                            The trailing number is HOW MANY KEYS the script uses.
                        </Term>{" "}
                        Not a flag, not a mode — a count. Everything after it is split at
                        that position: the first <Code>numkeys</Code> arguments are keys and
                        the rest are plain values. It is the same
                        count-before-you-name shape as <Code>SINTERCARD</Code> and{" "}
                        <Code>HEXPIRE ... FIELDS</Code>: Redis has to know where the key
                        list ends before it can read the argument list.
                    </p>
                </DocSection>

                <DocSection title="KEYS and ARGV">
                    <CodeBlock code={EVAL_ONE_KEY} lang="bash" />
                    <p>
                        <Term>
                            <Code>1 balance</Code> declares one key, and inside the script
                            that key is <Code>KEYS[1]</Code>.
                        </Term>{" "}
                        <Code>redis.call(...)</Code> runs an ordinary Redis command from
                        inside the script and hands you its reply as a Lua value — so{" "}
                        <Code>redis.call(&apos;GET&apos;, KEYS[1])</Code> is the{" "}
                        <Code>GET balance</Code> you would have sent yourself, just issued
                        from the server side.
                    </p>

                    <Callout severity="trap" label="trap · Lua arrays start at 1">
                        <p>
                            <Code>KEYS[1]</Code> and <Code>ARGV[1]</Code> are the FIRST
                            elements, not the second, and <Code>KEYS[0]</Code> is{" "}
                            <Code>nil</Code>. Every other language you write in this week
                            indexes from zero, so the off-by-one is not a typo you catch by
                            reading — it is a script that silently operates on{" "}
                            <Code>nil</Code>, which Redis then reports as an error about an
                            argument you thought you passed.
                        </p>
                    </Callout>

                    <CodeBlock code={EVAL_TABLE} lang="bash" />
                    <p>
                        <Term>
                            <Code>{"{...}"}</Code> is a Lua TABLE, and Redis converts it to
                            an ARRAY REPLY.
                        </Term>{" "}
                        That is how a script returns several values at once. Here{" "}
                        <Code>2 balance a</Code> declares two keys, so{" "}
                        <Code>KEYS[1]</Code> is <Code>balance</Code> and{" "}
                        <Code>KEYS[2]</Code> is <Code>a</Code>.
                    </p>

                    <CodeBlock code={EVAL_ARGV} lang="bash" />
                    <p>
                        <Term>
                            Non-key arguments follow the keys and arrive as{" "}
                            <Code>ARGV</Code>.
                        </Term>{" "}
                        <Code>1 mykey &quot;hello&quot;</Code> means one key —{" "}
                        <Code>KEYS[1]</Code> is <Code>mykey</Code> — and then everything
                        left over, so <Code>ARGV[1]</Code> is{" "}
                        <Code>&quot;hello&quot;</Code>.
                    </p>
                    <p>
                        <Term>
                            <Code>KEYS</Code> for keys, <Code>ARGV</Code> for values, both
                            1-indexed.
                        </Term>{" "}
                        The split is not cosmetic and it is not documentation. It is what
                        lets the client route the script to the right server — see the
                        cluster section in Part 5.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · what crosses the boundary"
                    >
                        <p>
                            <Code>ARGV</Code> values always arrive as STRINGS, and what a
                            script returns is put through Redis&apos;s own conversion rules
                            on the way out: a Lua <Code>true</Code> becomes{" "}
                            <Code>1</Code>, <Code>false</Code> and <Code>nil</Code> become a
                            null reply, and a float is TRUNCATED to an integer. Returning a
                            table with an <Code>err</Code> or <Code>ok</Code> field is the
                            escape hatch — those produce an error reply and a status reply
                            respectively, rather than an array.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — the case that needs a script, worked end to end ---------- */}
            <PartHeading kicker="part 2">Why: The Safe Lock Release</PartHeading>
            <div>
                <DocSection title="what a lock is">
                    <p>
                        <Term>
                            A LOCK is a key used as a flag: &quot;I am working on this,
                            nobody else touch it.&quot;
                        </Term>{" "}
                        Taking it is ACQUIRING the lock and deleting it is RELEASING it.
                        The job must not run twice at once — sending an invoice, processing
                        a payment — and ten workers could pick it up.
                    </p>

                    <CodeBlock code={LOCK_TAKE} lang="bash" />
                    <p>
                        <Term>
                            Worker A gets <Code>OK</Code>, so it took the lock and may run
                            the job.
                        </Term>{" "}
                        Workers B to J get <Code>nil</Code>, so the lock is taken and they
                        skip it. When A finishes it deletes the key, releasing the lock for
                        whoever comes next.
                    </p>
                    <p>
                        <Term>Nothing in Redis enforces any of this.</Term> It is a
                        CONVENTION: every worker agrees to check the flag before working.
                        Redis is holding a string. A worker that never looks at{" "}
                        <Code>lock:job1</Code> runs the job regardless, and no command
                        would have stopped it.
                    </p>
                </DocSection>

                <DocSection title="the bug DEL creates">
                    <Callout
                        severity="danger"
                        label="danger · DEL releases whichever lock is there, not yours"
                    >
                        <CodeBlock code={STALE_LOCK} lang="bash" />
                        <p className="mt-3">
                            Walk it with two terminals. A&apos;s lock EXPIRED while its slow
                            job was still running, B legitimately took the free lock, and
                            then A&apos;s <Code>DEL</Code> deleted it — deleting someone
                            else&apos;s lock is releasing a STALE LOCK. B still believes it
                            owns the lock, and a third worker can now acquire it while B is
                            still running. The one thing the lock existed to prevent is now
                            happening, and every command in that session returned success.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            <Code>DEL</Code> takes a key name and nothing else.
                        </Term>{" "}
                        It cannot express &quot;delete this if it is still mine&quot;,
                        because the ownership check needs the CURRENT VALUE — and reading
                        it is a second command, with a gap in front of it.
                    </p>
                </DocSection>

                <DocSection title="the fix">
                    <CodeBlock code={SAFE_RELEASE} lang="bash" />
                    <p>
                        <Term>
                            Only delete if the value is still your own name.
                        </Term>{" "}
                        Read, compare and delete in ONE uninterruptible step. The script
                        returns <Code>0</Code> here because the value is{" "}
                        <Code>&quot;worker-b&quot;</Code>, so nothing was deleted and{" "}
                        <Code>GET lock:job1</Code> still answers{" "}
                        <Code>&quot;worker-b&quot;</Code> — A released nothing, which is
                        exactly right, because it owned nothing.
                    </p>
                    <p>
                        <Term>
                            This is the release half of two patterns you have already seen.
                        </Term>{" "}
                        The deadlock callout in Strings &amp; Counters is this key with the
                        <Code>EX</Code> left off, and the stampede lock in Caching Patterns
                        is this key being acquired — both of them end with a{" "}
                        <Code>DEL</Code> that should be this script.
                    </p>
                </DocSection>

                <DocSection title="the same thing with WATCH, and what it costs">
                    <CodeBlock code={WATCH_RELEASE} lang="js" />
                    <p>
                        <Term>
                            It works. <Code>WATCH</Code> marks the key, the comparison
                            happens in JavaScript, and a <Code>null</Code> from{" "}
                            <Code>exec()</Code> sends it round again.
                        </Term>{" "}
                        This is the optimistic-locking loop from Atomicity, applied to the
                        ownership check — correct, and out of proportion to the job.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["", "Lua", "WATCH"]}
                        rows={[
                            ["round trips", "1", "4 (WATCH, GET, MULTI+DEL, EXEC)"],
                            ["retry loop", "none", "required"],
                            ["connection state", "none", "WATCH is per-connection"],
                            ["code", "one string", "a loop with two exit paths"],
                        ]}
                    />
                    <p>
                        <Term>
                            Four network hops instead of one, plus a loop that can spin
                            under contention.
                        </Term>{" "}
                        For something you do at the END OF EVERY SINGLE JOB. The script does
                        the same work in one hop with no loop, no <Code>UNWATCH</Code> to
                        remember and no connection to keep hold of.
                    </p>
                    <p>
                        <Term>The rule.</Term> <Code>WATCH</Code> when the decision has to
                        be made in your application — because it needs data Redis does not
                        have, or logic you are not going to write in Lua. A script when the
                        decision can live INSIDE Redis.
                    </p>

                    <QA
                        q={
                            <>
                                Why can&apos;t <Code>MULTI</Code> express the safe lock
                                release?
                            </>
                        }
                        a={
                            <>
                                Because a queued <Code>GET</Code> returns nothing until{" "}
                                <Code>EXEC</Code>, so there is no value to branch on while
                                the transaction is being built. Lua runs the read and the
                                branch inside the server; <Code>WATCH</Code> moves the branch
                                to the client and pays for it with round trips and retries.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — shipping the same script thousands of times a second ---------- */}
            <PartHeading kicker="part 3">SCRIPT LOAD and EVALSHA</PartHeading>
            <div>
                <DocSection title="sending the text every time">
                    <p>
                        <Term>
                            <Code>EVAL</Code> ships the WHOLE SCRIPT on every call.
                        </Term>{" "}
                        For a script that runs a handful of times that is nothing. For one
                        running thousands of times a second it is the same few hundred bytes
                        crossing the network over and over, for no reason.
                    </p>

                    <CodeBlock code={SCRIPT_LOAD} lang="bash" />
                    <p>
                        <Term>
                            Redis CACHES the script under a SHA, and you INVOKE it by hash.
                        </Term>{" "}
                        <Code>SCRIPT LOAD</Code> stores the text and hands back its
                        identifier; <Code>EVALSHA</Code> takes that hash where{" "}
                        <Code>EVAL</Code> took the source. Same <Code>numkeys</Code>, same
                        keys, same arguments, same result — the only thing that changed is
                        what travels.
                    </p>
                </DocSection>

                <DocSection title="NOSCRIPT">
                    <Callout
                        severity="danger"
                        label="danger · the script cache is not persistent"
                    >
                        <p>
                            Restart Redis, or fail over to a replica, and the hash is GONE —{" "}
                            <Code>EVALSHA</Code> answers <Code>NOSCRIPT</Code>. The cache is
                            in memory and it is per-server; nothing about{" "}
                            <Code>SCRIPT LOAD</Code> survives a process ending or a different
                            process answering. Code that calls <Code>EVALSHA</Code> and
                            assumes the hash is there works perfectly until the first restart
                            and then fails on every single request.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            So production code always keeps the SOURCE and falls back.
                        </Term>{" "}
                        A missing hash is a <Code>NOSCRIPT</Code> error and reloading the
                        script is the FALLBACK — not an exceptional path to alert on, but
                        the ordinary consequence of a server having restarted at some point.
                    </p>
                </DocSection>

                <DocSection title="managing several scripts">
                    <CodeBlock code={SCRIPTS_MODULE} lang="js" />
                    <p>
                        <Term>
                            Keep the script text and its hash TOGETHER in one module, filled
                            in at startup.
                        </Term>{" "}
                        <Code>loadScripts</Code> is called once when the app connects, and
                        from then on every entry knows both what it is and what Redis calls
                        it.
                    </p>

                    <CodeBlock code={RUN_HELPER} lang="js" />
                    <p>
                        <Term>One helper handles the fallback for all of them.</Term> Try{" "}
                        <Code>EVALSHA</Code>; if the error is anything other than{" "}
                        <Code>NOSCRIPT</Code> it is a real failure and it rethrows;
                        otherwise reload the source, update the stored hash and run it
                        again. The second call is against a cache that now definitely has
                        the script.
                    </p>
                    <p>
                        <Term>You never handle hashes by hand.</Term> The module owns them,
                        the call sites pass keys and arguments, and <Code>NOSCRIPT</Code>{" "}
                        self-heals — including on the failover, which is precisely when
                        nobody is watching.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · the rest of the script cache"
                    >
                        <p>
                            <Code>SCRIPT EXISTS &lt;sha&gt;</Code> tests the cache without
                            running anything and <Code>SCRIPT FLUSH</Code> clears it. Redis 7
                            also has <Code>FUNCTION LOAD</Code> and <Code>FCALL</Code> —
                            persistent, named, replicated Lua libraries that remove the{" "}
                            <Code>NOSCRIPT</Code> problem entirely, at the cost of a
                            deployment step: the library has to be loaded onto the server as
                            a deliberate act rather than lazily by whichever client noticed
                            it was missing.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the sliding window that only works as a script ---------- */}
            <PartHeading kicker="part 4">
                The Rate Limiter, Line by Line
            </PartHeading>
            <div>
                <DocSection title="the whole script">
                    <p>
                        <Term>
                            This is the sliding window from Sorted Sets, which as three
                            separate commands was BROKEN under concurrency.
                        </Term>{" "}
                        Trim, count, then decide — with two gaps in the middle, so two
                        requests could both read a count under the limit and both pass the
                        check.
                    </p>

                    <CodeBlock code={RATE_LIMIT} lang="lua" />
                    <p>
                        <Term>
                            Returns <Code>1</Code> for allowed, <Code>0</Code> for rejected.
                        </Term>{" "}
                        Trim, count, decide, record — and nothing can slip between them,
                        because the whole thing is one command.
                    </p>
                </DocSection>

                <DocSection title="the arguments">
                    <p>
                        <Term>
                            <Code>ARGV</Code> values always arrive as STRINGS, so{" "}
                            <Code>tonumber</Code> converts them.
                        </Term>{" "}
                        You compute with all three: <Code>now - window</Code> is arithmetic
                        and <Code>count &gt;= limit</Code> is a numeric comparison. In Lua{" "}
                        <Code>&quot;1000&quot; - &quot;60&quot;</Code> coerces and happens to
                        work, but <Code>&quot;9&quot; &gt; &quot;10&quot;</Code> compares as
                        STRINGS and gives the wrong answer — so convert once at the top and
                        stop thinking about it.
                    </p>
                    <p>
                        <Term>
                            <Code>local</Code> declares a variable.
                        </Term>{" "}
                        Without it Lua creates a GLOBAL, which Redis rejects outright: the
                        script errors rather than quietly leaking state between runs.
                    </p>
                    <p>
                        <Term>
                            The three arguments are the rule &quot;max three requests per
                            sixty seconds&quot;, taken apart.
                        </Term>{" "}
                        <Code>now</Code> is the current timestamp PASSED IN from Node,{" "}
                        <Code>window</Code> is how far back to look, and{" "}
                        <Code>limit</Code> is how many are allowed in that span.
                    </p>

                    <CodeBlock code={RATE_LIMIT_CALL} lang="js" />
                </DocSection>

                <DocSection title="the body">
                    <CodeBlock code={ZREM_RANGE} lang="bash" />
                    <p>
                        <Term>
                            <Code>ZREMRANGEBYSCORE</Code> deletes every member whose SCORE
                            falls in the range, and returns how many it removed.
                        </Term>{" "}
                        Standalone, that is the session above. In the script the score is a
                        TIMESTAMP, so <Code>now - window</Code> — with a{" "}
                        <Code>now</Code> of 1000 and a window of 60, that is 940 — means
                        &quot;delete every request older than sixty seconds ago&quot;. The
                        window slides because the boundary is recomputed on every call.
                    </p>
                    <p>
                        <Term>
                            <Code>ZCARD</Code> counts what remains, which is exactly the
                            requests inside the window.
                        </Term>{" "}
                        The trim is what makes the count meaningful: everything older has
                        already been removed, so there is nothing to filter.
                    </p>
                    <p>
                        <Term>
                            <Code>if count &gt;= limit then return 0 end</Code> — already at
                            the limit, so return <Code>0</Code> and stop.
                        </Term>{" "}
                        Nothing is recorded, because the request is being REJECTED and a
                        rejected request is not one of the three. THIS is the line{" "}
                        <Code>MULTI</Code> cannot express: a decision based on a value read
                        moments earlier, in the same atomic step.
                    </p>
                    <p>
                        <Term>
                            <Code>ZADD</Code> records the allowed request.
                        </Term>{" "}
                        The score is <Code>now</Code>, which is what the next call&apos;s
                        trim will compare against. The MEMBER must be unique, or a second
                        request in the same millisecond would overwrite the first — a sorted
                        set holds no duplicates, so two identical members are one member.{" "}
                        <Code>..</Code> is Lua&apos;s string concatenation, so the member is
                        the timestamp with a random suffix glued on.
                    </p>
                    <p>
                        <Term>
                            <Code>EXPIRE</Code> means an idle user&apos;s key disappears on
                            its own.
                        </Term>{" "}
                        Without it every user who ever made one request leaves a sorted set
                        behind forever, trimmed down to empty but still there.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · the verdict is not the only useful answer"
                    >
                        <p>
                            Returning the RETRY-AFTER delay alongside the verdict — the
                            oldest score plus the window, minus <Code>now</Code> — is what
                            lets the caller send a <Code>Retry-After</Code> header instead of
                            a bare rejection, and it costs one extra{" "}
                            <Code>ZRANGE ... WITHSCORES</Code> inside the same script.
                            Passing <Code>now</Code> from the application also means every
                            app server must agree on the CLOCK: a machine running two seconds
                            fast writes scores from the future, and they survive the trim
                            until real time catches up.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — the four rules a script has to obey ---------- */}
            <PartHeading kicker="part 5">Rules and Traps</PartHeading>
            <div>
                <DocSection title="scripts block the server">
                    <Callout
                        severity="danger"
                        label="danger · a script blocks the whole server"
                    >
                        <p>
                            A script runs as ONE COMMAND on the single thread, so nothing
                            else executes until it finishes — the same property that makes it
                            atomic makes it a stall. No loops over large datasets, no{" "}
                            <Code>KEYS</Code>, no waiting on anything. Scripts must be SHORT.
                            A slow script is not a slow request; it is a server-wide stall,
                            and every other client is simply not being served while it runs.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            A long script BLOCKS or STALLS the server — it does not
                            &quot;slow it down&quot;.
                        </Term>{" "}
                        The distinction is worth keeping in your vocabulary, because
                        &quot;slow&quot; suggests a request that takes longer and{" "}
                        &quot;blocks&quot; correctly suggests every OTHER request taking
                        longer too.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · when one is already running too long"
                    >
                        <p>
                            <Code>busy-reply-threshold</Code> (formerly{" "}
                            <Code>lua-time-limit</Code>) is when Redis starts replying{" "}
                            <Code>BUSY</Code> to other clients rather than making them wait
                            in silence. <Code>SCRIPT KILL</Code> stops a script that has NOT
                            YET WRITTEN. Once it has written, killing it would leave a
                            half-applied state that was supposed to be atomic, so Redis
                            refuses — only <Code>SHUTDOWN NOSAVE</Code> ends it. That is why
                            an unbounded loop in a script is a real outage rather than a slow
                            query.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="scripts must be deterministic">
                    <p>
                        <Term>A script must be DETERMINISTIC.</Term> Modern Redis replicates
                        the EFFECTS of a script rather than the script itself, so the rule is
                        no longer enforced the way it once was — but it still shapes how you
                        write them: never read the clock or generate randomness for a value
                        you STORE.
                    </p>
                    <p>
                        <Term>
                            Values that vary are PASSED IN, not READ INSIDE.
                        </Term>{" "}
                        That is why <Code>now</Code> is <Code>ARGV[1]</Code> instead of
                        something the script reads for itself. The{" "}
                        <Code>math.random()</Code> in the member name is acceptable only
                        because it is a throwaway UNIQUENESS TOKEN — nothing reads it,
                        nothing compares it, and no later decision depends on which value it
                        happened to produce.
                    </p>
                </DocSection>

                <DocSection title="all keys must be declared in KEYS">
                    <p>
                        <Term>
                            On a single instance one server holds every key, so nothing about
                            this rule bites.
                        </Term>{" "}
                        On a CLUSTER the keys are split across several servers —{" "}
                        <Code>balance</Code> might live on node 1 and <Code>user:42</Code> on
                        node 3 — and the client has to pick which node to send the script to.
                        It picks using the KEYS you declared.
                    </p>

                    <CodeBlock code={CLUSTER_DECLARED} lang="bash" />
                    <CodeBlock code={CLUSTER_HARDCODED} lang="bash" />
                    <p>
                        <Term>
                            The difference is entirely in the <Code>numkeys</Code>.
                        </Term>{" "}
                        Both scripts read the same key and both work on your laptop. The
                        first one tells the client where the data is; the second one hides it
                        inside a string the client never parses.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · declaring keys is how the script finds its server"
                    >
                        <p>
                            Declaring keys is not bookkeeping and it is not documentation —
                            it is ROUTING. A hardcoded key name works on your single instance
                            and breaks the day you scale, which is the worst possible
                            timing: the code is old, it has been correct for a year, and
                            nothing about it changed.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · one hash slot per script"
                    >
                        <p>
                            On a cluster a script may only touch keys in ONE HASH SLOT, since
                            it runs on one node. Hash tags are how you force that: only the
                            part inside the braces is hashed, so{" "}
                            <Code>user:{"{1}"}:profile</Code> and{" "}
                            <Code>user:{"{1}"}:sessions</Code> are guaranteed to land on the
                            same node and a script may read both. The same restriction{" "}
                            <Code>MULTI</Code> has, for the same reason.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="a script has no rollback either">
                    <Callout
                        severity="danger"
                        label="danger · a failed command does not undo the others"
                    >
                        <CodeBlock code={SCRIPT_NO_ROLLBACK} lang="lua" />
                        <p className="mt-3">
                            The <Code>INCR</Code> errors and the script dies, and the{" "}
                            <Code>SET</Code> STAYS. Exactly like <Code>MULTI</Code>: ATOMIC
                            means UNINTERRUPTED, not all-or-nothing. If a partial state is
                            unacceptable, validate everything BEFORE writing anything — do
                            the reads and the checks at the top, and only start writing once
                            nothing left can fail.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            This is the one guarantee people expect from a script and do not
                            get.
                        </Term>{" "}
                        A script looks like a transaction in the SQL sense — a block of
                        statements that either happens or does not — and it is not one. It is
                        a block of statements nobody can interleave with.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · handling an error instead of dying"
                    >
                        <p>
                            <Code>redis.pcall</Code> does not abort the script on an error,
                            returning it as a VALUE instead. That lets a script inspect a
                            failed command and decide what to do — clean up, take a different
                            branch, return a meaningful reply — rather than dying halfway
                            through with whatever it had already written left in place.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                When is Lua the right tool instead of a transaction or a
                                pipeline?
                            </>
                        }
                        a={
                            <>
                                When a decision depends on data that must be read in the same
                                uninterrupted step — check a lock&apos;s owner before deleting
                                it, count a window before recording in it, compare a balance
                                before subtracting. Pipelines only save round trips and{" "}
                                <Code>MULTI</Code> cannot branch, so anything read-then-decide
                                either becomes <Code>WATCH</Code> with retries or a script
                                with none.
                            </>
                        }
                    />
                </DocSection>
            </div>
        </>
    );
}
