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
    // --- part 1 (What MULTI Actually Does) ---
    // no callouts: the three sections here are the mechanism, stated plainly

    // --- part 2 (No Rollback) ---
    // inline `danger · a failed command does not undo the others` callout,
    // carrying the session that proves it
    "a-failed-command-does-not-undo-the-others": ["danger"],

    // --- part 3 (WATCH and Optimistic Locking) ---
    // inline `trap · (nil) is the retry signal` callout
    "the-failure-path": ["trap"],
    // inline `danger · WATCH is tied to the connection` callout, plus a
    // `note · reference` on bounding the retries under contention
    "watch-is-per-connection": ["danger", "note"],

    // --- part 4 (Pipelining is Not a Transaction) ---
    // inline `trap · the same builder shape for both` callout
    "two-different-problems": ["trap"],
    // forward-reference callout to the Lua Scripts topic, plus a
    // `note · reference` on hash slots under Redis Cluster
    choosing: ["next", "note"],
};

// Top-level divider between the four parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace,
// strings-and-counters, hashes, lists, sets, sorted-sets and the hooks content
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

// Exactly the grid treatment node-playground's RepresentationTable and the
// GridTable in inspecting-the-keyspace / strings-and-counters / hashes / lists /
// sets / sorted-sets use — a real <table> would be the only one in the codebase.
// The markup, the cell padding and the three text colours (head, first column,
// rest) are unchanged. `cols` is a literal grid-template-columns utility so
// Tailwind sees it at build time.
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

const SINGLE = `INCR views:home
# (integer) 1      -> read, add, write, all inside one command
HINCRBY user:1 logins 1
# (integer) 1
SADD tags:1 "redis"
# (integer) 1
ZINCRBY leaderboard 50 "yassin"
# "350"            -> every one of these is already safe under any concurrency`;

const GAP = `GET counter
# "5"              <- another client's INCR can land HERE
SET counter 6
# OK               -> and its increment is now overwritten`;

const QUEUED = `MULTI
# OK
SET a 1
# QUEUED
INCR a
# QUEUED
EXEC
# 1) OK
# 2) (integer) 2   -> one reply per queued command, in order`;

const DISCARD = `MULTI
# OK
SET x "1"
# QUEUED
DISCARD
# OK
GET x
# (nil)            -> nothing was written`;

const NO_ROLLBACK = `MULTI
# OK
SET k "value"
# QUEUED
INCR k
# QUEUED
EXEC
# 1) OK
# 2) (error) ERR value is not an integer or out of range
GET k
# "value"          -> the SET stands; nothing was undone`;

const EXECABORT = `MULTI
# OK
SET
# (error) ERR wrong number of arguments for 'set' command
GET a
# QUEUED
EXEC
# (error) EXECABORT Transaction discarded because of previous errors`;

const MULTI_READ = `MULTI
# OK
GET balance
# QUEUED          -> not "100"; the value arrives after EXEC, too late to decide on
EXEC
# 1) "100"`;

const WATCH_HAPPY = `SET balance 100
# OK
WATCH balance
# OK
GET balance
# "100"            -> OUTSIDE MULTI, so you actually see it: 100 is enough to spend 30
MULTI
# OK
DECRBY balance 30
# QUEUED
EXEC
# 1) (integer) 70`;

// Two terminals, so this is not one paste-able session.
const WATCH_FAIL = `# first terminal
SET balance 100
# OK
WATCH balance
# OK
GET balance
# "100"
MULTI
# OK
DECRBY balance 30
# QUEUED           -> stop here, do NOT send EXEC yet

# second terminal
redis-cli SET balance 500
# OK

# first terminal
EXEC
# (nil)            -> cancelled; nothing ran
GET balance
# "500"            -> the other client's write, untouched`;

const RETRY = `async function spend(client, amount) {
  while (true) {
    await client.watch('balance');
    const balance = Number(await client.get('balance'));

    if (balance < amount) {
      await client.unwatch();
      return false;                    // not enough — give up, not a retry
    }

    const multi = client.multi();
    multi.decrBy('balance', amount);
    const res = await multi.exec();

    if (res !== null) return true;     // committed
    // null -> someone changed it, loop and re-read
  }
}`;

const NODE = `const multi = client.multi();
multi.set('a', '1');
multi.incr('a');
const replies = await multi.exec();      // -> array of replies, or null if a WATCH broke

await client.watch('balance');            // per connection
await client.unwatch();`;

export function AtomicityDocs() {
    return (
        <>
            {/* ---------- part 1 — the mechanism, and the narrow gap it closes ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">What MULTI Actually Does</PartHeading>
            <div>
                <DocSection title="single commands need no protection">
                    <CodeBlock code={SINGLE} lang="bash" />
                    <p>
                        <Term>Every single Redis command is already atomic.</Term> The
                        server runs commands on ONE THREAD, so nothing interleaves inside
                        one of them — there is no moment mid-<Code>INCR</Code> for another
                        client to observe or to write over.
                    </p>
                    <p>
                        <Term>
                            So <Code>INCR</Code>, <Code>HINCRBY</Code>, <Code>SADD</Code>{" "}
                            and <Code>ZINCRBY</Code> need nothing wrapped around them.
                        </Term>{" "}
                        Under a thousand concurrent clients they are exactly as correct as
                        under one. Reaching for a transaction to protect a single command
                        protects nothing that was at risk.
                    </p>

                    <CodeBlock code={GAP} lang="bash" />
                    <p>
                        <Term>The problem is GROUPS.</Term> Two commands sent from your
                        application are two separate trips, and another client&apos;s
                        command can land in the gap between them. That gap is the entire
                        subject of this page.
                    </p>
                    <p>
                        <Term>
                            What <Code>MULTI</Code> buys is ISOLATION: no INTERLEAVING.
                        </Term>{" "}
                        It closes the gap between your commands and it does nothing else —
                        so keep reading before assuming it does what a SQL transaction
                        does.
                    </p>
                </DocSection>

                <DocSection title="QUEUED, then EXEC">
                    <CodeBlock code={QUEUED} lang="bash" />
                    <p>
                        <Term>Nothing executes until EXEC.</Term> <Code>MULTI</Code> opens
                        the block, and every command after it comes back{" "}
                        <Code>QUEUED</Code> — Redis has accepted it into a per-connection
                        buffer and is holding it, unrun.
                    </p>
                    <p>
                        <Term>
                            Commands are QUEUED, then COMMITTED by <Code>EXEC</Code>.
                        </Term>{" "}
                        <Code>EXEC</Code> runs the buffer back-to-back, with no other
                        client&apos;s command in between, and returns ONE REPLY PER QUEUED
                        COMMAND, in the order they were queued.
                    </p>
                    <p>
                        <Term>
                            Those replies are the ordinary ones the commands would have
                            returned individually.
                        </Term>{" "}
                        <Code>SET</Code> still answers <Code>OK</Code> and{" "}
                        <Code>INCR</Code> still answers a number — <Code>EXEC</Code>{" "}
                        hands back an ARRAY of them, not one status for the block. There is
                        no single &quot;the transaction succeeded&quot; reply to read.
                    </p>
                </DocSection>

                <DocSection title="DISCARD">
                    <CodeBlock code={DISCARD} lang="bash" />
                    <p>
                        <Term>
                            <Code>DISCARD</Code> throws the queue away.
                        </Term>{" "}
                        The <Code>SET</Code> was accepted and never run, so{" "}
                        <Code>GET x</Code> is <Code>(nil)</Code> — a queued command that is
                        THROWN AWAY leaves no trace at all.
                    </p>
                    <p>
                        <Term>
                            <Code>DISCARD</Code> only works BEFORE <Code>EXEC</Code>.
                        </Term>{" "}
                        It abandons a block you have opened but not committed. Once{" "}
                        <Code>EXEC</Code> has run there is nothing to discard and no undo —
                        which is the whole of the next part.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — the expectation SQL leaves you with, and why it is wrong ---------- */}
            <PartHeading kicker="part 2">No Rollback</PartHeading>
            <div>
                <DocSection title="a failed command does not undo the others">
                    <Callout
                        severity="danger"
                        label="danger · a failed command does not undo the others"
                    >
                        <CodeBlock code={NO_ROLLBACK} lang="bash" />
                        <p className="mt-3">
                            The <Code>INCR</Code> failed, because <Code>k</Code> holds{" "}
                            <Code>&quot;value&quot;</Code>. The <Code>SET</Code> STILL
                            HAPPENED. Redis executed both commands, reported an error for
                            one of them, and kept the other — and{" "}
                            <Code>GET k</Code> afterwards proves it. There is nothing to
                            call, and no flag to pass, that would have undone the{" "}
                            <Code>SET</Code>.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            A Redis transaction means &quot;these commands run together
                            without interruption&quot;, NOT &quot;all or nothing&quot;.
                        </Term>{" "}
                        It gives you ISOLATION. What it does not give you is ROLLBACK, or
                        ATOMICITY IN THE SQL SENSE — the two words mean different things in
                        the two systems.
                    </p>
                    <p>
                        <Term>
                            Anyone carrying SQL expectations into <Code>MULTI</Code> will
                            write a bug here.
                        </Term>{" "}
                        The mental model that says a failed statement unwinds the ones
                        before it produces half-applied state in Redis, and the error that
                        should have prevented it is sitting in the reply array being
                        ignored.
                    </p>
                </DocSection>

                <DocSection title="the one case where nothing runs">
                    <CodeBlock code={EXECABORT} lang="bash" />
                    <p>
                        <Term>
                            An error Redis can catch AT QUEUE TIME aborts the whole thing.
                        </Term>{" "}
                        <Code>SET</Code> with no arguments is rejected the moment it is
                        sent, not queued; <Code>EXEC</Code> then refuses to run anything and
                        answers <Code>EXECABORT</Code>. A transaction cancelled this way was
                        ABORTED — the <Code>GET a</Code> that did queue never ran either.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["error type", "when caught", "result"]}
                        rows={[
                            [
                                "bad syntax / unknown command",
                                "at QUEUED time",
                                "whole transaction aborts, nothing runs",
                            ],
                            [
                                "wrong type / bad value",
                                "at EXEC time",
                                "the other commands still run",
                            ],
                        ]}
                    />
                    <p>
                        <Term>
                            Redis can check the SHAPE of a command upfront, but not whether
                            it will work against the actual data.
                        </Term>{" "}
                        Argument count and command name are knowable while queueing. Whether{" "}
                        <Code>k</Code> holds something <Code>INCR</Code> can add to is only
                        knowable at the moment <Code>INCR</Code> runs — so that class of
                        error can never abort the block, only report itself inside it.
                    </p>

                    <QA
                        q={
                            <>
                                A <Code>MULTI</Code> block sets a key and then increments a
                                non-numeric key. What is the state afterwards?
                            </>
                        }
                        a={
                            <>
                                The <Code>SET</Code> is applied and the <Code>INCR</Code>{" "}
                                reports an error. There is no rollback in Redis —{" "}
                                <Code>EXEC</Code> returns one reply per command and some of
                                them can be errors while the rest committed.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — the case MULTI cannot express on its own ---------- */}
            <PartHeading kicker="part 3">WATCH and Optimistic Locking</PartHeading>
            <div>
                <DocSection title="why MULTI alone is not enough">
                    <CodeBlock code={MULTI_READ} lang="bash" />
                    <p>
                        <Term>
                            Inside <Code>MULTI</Code> you cannot read a value and use it.
                        </Term>{" "}
                        <Code>GET balance</Code> comes back <Code>QUEUED</Code>, not{" "}
                        <Code>&quot;100&quot;</Code>. You get the value after{" "}
                        <Code>EXEC</Code>, by which point every decision that depended on it
                        has already been committed.
                    </p>
                    <p>
                        <Term>
                            So &quot;read the balance, check it is enough, then subtract&quot;
                            cannot be expressed as a plain transaction.
                        </Term>{" "}
                        The check has to happen in your application, which means it happens
                        outside the block, which means the value could have changed by the
                        time the block runs. That is what <Code>WATCH</Code> is for.
                    </p>
                </DocSection>

                <DocSection title="WATCH">
                    <CodeBlock code={WATCH_HAPPY} lang="bash" />
                    <p>
                        <Term>
                            <Code>WATCH</Code> marks a key.
                        </Term>{" "}
                        If anyone changes it between the <Code>WATCH</Code> and your{" "}
                        <Code>EXEC</Code>, the <Code>EXEC</Code> FAILS instead of running.
                        Nothing is locked and nobody is blocked — Redis simply refuses to
                        commit a decision that was made on stale information.
                    </p>
                    <p>
                        <Term>
                            The <Code>GET</Code> runs OUTSIDE <Code>MULTI</Code>, which is
                            why you actually see the value.
                        </Term>{" "}
                        The order is fixed: watch, read, decide in the application, then open
                        the block and write. On the happy path the balance was never touched,
                        so <Code>EXEC</Code> commits and returns its reply array as usual.
                    </p>
                </DocSection>

                <DocSection title="the failure path">
                    <CodeBlock code={WATCH_FAIL} lang="bash" />
                    <p>
                        <Term>This needs TWO terminals.</Term> The interference has to come
                        from another client — a single session cannot demonstrate it, because
                        your own commands are the ones being held.
                    </p>
                    <p>
                        <Term>
                            <Code>(nil)</Code> instead of a reply array means the transaction
                            was CANCELLED.
                        </Term>{" "}
                        The <Code>DECRBY</Code> never ran, and{" "}
                        <Code>balance</Code> is still <Code>500</Code> — the value the other
                        client wrote, with nothing subtracted from it.
                    </p>

                    <Callout severity="trap" label="trap · (nil) is the retry signal">
                        <p>
                            That <Code>(nil)</Code> is not an error and not an empty result.
                            It is the signal to RETRY: re-read the fresh value, decide again,
                            try again. Handling it as a failure abandons work that would
                            succeed on a second pass, and handling it as success — the easy
                            mistake in Node, where it arrives as a plain{" "}
                            <Code>null</Code> return rather than a thrown error — silently
                            skips a write your code believes it made.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="the retry loop">
                    <CodeBlock code={RETRY} lang="js" />
                    <p>
                        <Term>This is OPTIMISTIC LOCKING.</Term> Lock nothing, do the work,
                        detect that the world changed underneath you, and redo it. The
                        opposite is PESSIMISTIC LOCKING, where you take a lock up front and
                        everyone else waits their turn.
                    </p>
                    <p>
                        <Term>
                            The <Code>null</Code> check is the whole loop.
                        </Term>{" "}
                        A non-null reply array committed, so the function returns. A{" "}
                        <Code>null</Code> means a watched key moved, so it goes round again
                        and re-reads — the balance it decided on is now known to be stale.
                    </p>
                    <p>
                        <Term>
                            <Code>UNWATCH</Code> clears your watches without running
                            anything.
                        </Term>{" "}
                        That is the early-return path above: the balance is too low, so there
                        is no transaction to attempt and no reason to keep watching.{" "}
                        <Code>EXEC</Code> and <Code>DISCARD</Code> clear watches
                        automatically, so <Code>UNWATCH</Code> is only needed when you leave
                        without doing either.
                    </p>
                </DocSection>

                <DocSection title="WATCH is per connection">
                    <Callout
                        severity="danger"
                        label="danger · WATCH is tied to the connection"
                    >
                        <p>
                            <Code>WATCH</Code> belongs to the CONNECTION, not to the key and
                            not to the client library. Since an application pools
                            connections, a <Code>WATCH</Code> issued on one connection means
                            nothing on another — <Code>MULTI</Code> and <Code>WATCH</Code>{" "}
                            must travel on the same one. node-redis&apos;s{" "}
                            <Code>client.multi()</Code> handles this, but a hand-rolled pool,
                            or one shared client used from several concurrent requests, can
                            silently lose the guarantee: the <Code>EXEC</Code> succeeds and
                            the check it depended on never applied.
                        </p>
                    </Callout>

                    <p>
                        <Term>
                            That failure looks like success, which is what makes it a danger
                            rather than a trap.
                        </Term>{" "}
                        A broken <Code>WATCH</Code> does not error and does not return{" "}
                        <Code>null</Code>. It commits, on a value nobody verified — and the
                        balance goes negative in production rather than in your tests.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · when the key is contended"
                    >
                        <p>
                            A key being fought over by many clients is CONTENDED, and a retry
                            loop over a contended key can spin — every attempt is invalidated
                            by the next writer before it reaches <Code>EXEC</Code>. Bound the
                            attempts rather than looping forever. If the contention is
                            structural rather than occasional, a Lua script is the better
                            answer: it reads and branches INSIDE the server, in one atomic
                            step, with no retry at all.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                What does it mean when <Code>EXEC</Code> returns{" "}
                                <Code>nil</Code>, and what should the application do?
                            </>
                        }
                        a={
                            <>
                                A watched key was modified by another client, so Redis
                                cancelled the transaction and ran nothing. The application
                                re-reads the value, re-evaluates its condition, and retries.
                                It is a normal outcome under concurrency, not an error to log
                                and abandon.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 4 — the other thing that batches commands, and isn't this ---------- */}
            <PartHeading kicker="part 4">Pipelining is Not a Transaction</PartHeading>
            <div>
                <DocSection title="two different problems">
                    <p>
                        <Term>
                            PIPELINING is a NETWORK optimisation.
                        </Term>{" "}
                        Send a hundred commands without waiting for each reply, then read the
                        hundred replies at once: one ROUND TRIP instead of a hundred. It says
                        nothing whatsoever about isolation.
                    </p>
                    <p>
                        <Term>A transaction is an ISOLATION guarantee.</Term> No other
                        client&apos;s command lands in the middle of the group. That is a
                        statement about ordering, not about how the bytes got to the server.
                    </p>

                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "pipeline", "transaction"]}
                        rows={[
                            ["purpose", "fewer round trips", "no interleaving"],
                            [
                                "other clients",
                                "CAN run commands in between",
                                "cannot",
                            ],
                            ["wrapped in", "nothing", "MULTI / EXEC"],
                        ]}
                    />
                    <p>
                        <Term>A transaction gives you both benefits.</Term> The queued
                        commands are also sent in one batch, so the round trips are saved
                        anyway. A pipeline gives you only the speed — which is exactly why
                        the two get confused: they look identical from the outside and
                        differ in the guarantee.
                    </p>

                    <Callout severity="trap" label="trap · the same builder shape for both">
                        <p>
                            In node-redis both are built with the same chained builder, which
                            is why the two get conflated. <Code>client.multi()</Code> emits{" "}
                            <Code>MULTI</Code> and <Code>EXEC</Code> around the batch; a
                            plain pipeline does not. Reading code, look for whether the
                            commands are WRAPPED — not for the shape of the JavaScript, which
                            is the same either way.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="choosing">
                    <p>
                        <Term>PIPELINE when the commands are independent</Term> and you only
                        want them fast — a thousand <Code>SET</Code>s during a data import,
                        where no other client&apos;s write between them could make any of
                        them wrong.
                    </p>
                    <p>
                        <Term>TRANSACTION when the group must not be split.</Term> The{" "}
                        <Code>DEL user:1</Code> plus <Code>SREM users:index 1</Code> pair from
                        the secondary-index pattern in Sets, or any two-key write where a
                        half-applied state is a bug someone will have to clean up by hand.
                    </p>
                    <p>
                        <Term>
                            LUA when you need to read a value and branch on it inside the
                            server.
                        </Term>{" "}
                        That is the case <Code>MULTI</Code> cannot express and{" "}
                        <Code>WATCH</Code> only approximates with a retry — the logic runs
                        where the data is, so there is nothing to re-read.
                    </p>

                    <Callout severity="next" label="covered later · lua scripts">
                        <p>
                            <Code>EVAL</Code>, <Code>SCRIPT LOAD</Code> and{" "}
                            <Code>EVALSHA</Code>, and the cases where a script is the only
                            correct answer, are covered in Lua Scripts.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · MULTI on Redis Cluster"
                    >
                        <p>
                            On Redis Cluster a <Code>MULTI</Code> block must touch keys that
                            all live in the same HASH SLOT, because the block runs on one
                            node. Hash tags are how you force that: only the part inside the
                            braces is hashed, so <Code>user:{"{1}"}:profile</Code> and{" "}
                            <Code>user:{"{1}"}:sessions</Code> are guaranteed to land
                            together. A pipeline has no such restriction — its commands are
                            independent, so they can be routed to different nodes.
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
                    Every command above, unchanged in meaning — same order, same
                    guarantees. Three details are worth pinning:
                </p>
                <p>
                    <Term>
                        <Code>exec()</Code> returns <Code>null</Code> when a watched key
                        changed.
                    </Term>{" "}
                    It does not throw, so a missing null check reads as success — the one
                    outcome the retry loop exists to catch is also the quietest one to
                    forget.
                </p>
                <p>
                    <Term>
                        <Code>exec()</Code> does not throw on a per-command error either.
                    </Term>{" "}
                    The error object sits in the replies array at that command&apos;s
                    position, exactly where the CLI printed <Code>(error)</Code>. Inspect
                    the array; don&apos;t just await it.
                </p>
                <p>
                    <Term>
                        <Code>multi()</Code> is a builder, so nothing is sent until{" "}
                        <Code>exec()</Code>.
                    </Term>{" "}
                    Forgetting the <Code>await</Code> means the whole block silently never
                    runs — no error, no writes, and a function that returned as though it
                    had done its job.
                </p>
            </DocSection>
        </>
    );
}
