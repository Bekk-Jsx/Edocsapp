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
    // --- part 1 (Shape and Creation) ---
    // inline `trap · an empty list and a missing key are one state` callout
    "there-is-no-create-and-no-empty-list": ["trap"],
    // inline `note · reference` callout — LINSERT, LSET, LREM, LPOS
    lrange: ["note"],

    // --- part 2 (Popping, Queues and Stacks) ---
    // inline `note · reference` callout — LMPOP, RPOPLPUSH, LMOVE
    "popping-in-batches": ["note"],

    // --- part 3 (Capped Lists) ---
    // inline `note · reference` callout — an untrimmed list is a memory leak
    "the-capped-list-pattern": ["note"],

    // --- part 4 (Blocking Pops) ---
    // inline `danger · a blocked connection cannot send anything else` callout,
    // plus a `note · reference` on BLPOP, BLMPOP, BLMOVE and reliable queues
    "blocking-blocks-the-client-not-the-server": ["danger", "note"],

    // --- part 5 (Limits) ---
    // inline `trap · the middle of a list is expensive` callout, plus a
    // `note · reference` on the listpack -> quicklist encoding
    "random-access-is-o-n": ["trap", "note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace,
// strings-and-counters, hashes and the hooks content files each define for their
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

const RPUSH = `RPUSH tasks "a" "b" "c"
# (integer) 3      -> the new length
LRANGE tasks 0 -1
# 1) "a"
# 2) "b"
# 3) "c"           -> RPUSH appends, so the order matches what you typed`;

const LPUSH = `DEL t
# (integer) 1
LPUSH t "a" "b" "c"
# (integer) 3      -> the new length again
LRANGE t 0 -1
# 1) "c"
# 2) "b"
# 3) "a"           -> reversed`;

const CREATE = `DEL t
# (integer) 1
EXISTS t
# (integer) 0
RPUSH t "only"
# (integer) 1      -> the key did not exist; RPUSH created it
RPOP t
# "only"
EXISTS t
# (integer) 0      -> the last element took the key with it`;

const EMPTY = `DEL t
# (integer) 1
EXISTS t
# (integer) 0
LRANGE t 0 -1
# (empty array)    -> not an error`;

const LRANGE = `RPUSH pair "a" "b"
# (integer) 2
LRANGE pair 0 -1
# 1) "a"
# 2) "b"           -> 0 to -1 is the whole list
LRANGE pair -2 -2
# 1) "a"           -> -1 is the LAST element, -2 the second-to-last
LRANGE pair 0 9
# 1) "a"
# 2) "b"           -> out of range returns what exists, no error`;

const POPS = `DEL q
# (integer) 1
RPUSH q "a" "b" "c"
# (integer) 3
LPOP q
# "a"              -> removed AND returned
RPOP q
# "c"
LRANGE q 0 -1
# 1) "b"
LPOP drained
# (nil)            -> empty or missing, same reply`;

const QUEUE = `DEL jobs
# (integer) 1
RPUSH jobs "job1" "job2"
# (integer) 2
LPOP jobs
# "job1"           -> job1 arrived first, so the queue serves it first`;

const STACK = `DEL undo
# (integer) 1
RPUSH undo "step1" "step2"
# (integer) 2
RPOP undo
# "step2"          -> same end as the push, so the newest comes back first`;

const BATCH = `DEL q
# (integer) 1
RPUSH q "a" "b" "c" "d"
# (integer) 4
LPOP q 2
# 1) "a"
# 2) "b"           -> one round trip instead of two`;

const LLEN = `LLEN q
# (integer) 2      -> O(1), whatever the length`;

const LTRIM = `DEL log
# (integer) 1
RPUSH log "l1" "l2" "l3" "l4" "l5"
# (integer) 5
LTRIM log 0 2
# OK
LRANGE log 0 -1
# 1) "l1"
# 2) "l2"
# 3) "l3"          -> l4 and l5 are gone, not hidden`;

const LTRIM_LAST = `LTRIM log -3 -1
# OK               -> keep the LAST three; there is no RTRIM`;

const CAPPED = `LPUSH feed:1 "newest"
# (integer) 101
LTRIM feed:1 0 99
# OK               -> back to 100, newest still at index 0`;

const BRPOP = `DEL jobs
# (integer) 1
RPUSH jobs "job1" "job2"
# (integer) 2
BRPOP jobs 0
# 1) "jobs"
# 2) "job2"
BRPOP jobs 0
# 1) "jobs"
# 2) "job1"
BRPOP jobs 0
# ... the prompt HANGS: the list is empty, so Redis holds the connection open`;

// Two terminals, so this is not one paste-able session.
const BRPOP_WAKE = `# second terminal
redis-cli RPUSH jobs "job3"
# (integer) 1

# first terminal, instantly and on its own
# 1) "jobs"
# 2) "job3"`;

const BRPOP_TIMEOUT = `BRPOP jobs 5
# (nil)            -> nothing arrived within five seconds
BRPOP jobs 0
# ... 0 means wait forever`;

const POLL = `while (true) {
  const job = await client.rPop('jobs');
  if (!job) await sleep(1000);   // nothing there — wait and ask again
  else await handle(job);
}`;

const WAIT = `while (true) {
  const [, job] = await client.brPop('jobs', 0);
  await handle(job);
}`;

const LINDEX = `LINDEX q 0
# "b"              -> an end: O(1)
LINDEX q 5000
# "..."            -> the middle: Redis walks there from the nearest end`;

const NODE = `await client.rPush('tasks', ['a', 'b', 'c']);      // -> new length
await client.lRange('tasks', 0, -1);               // -> string[]
await client.lPop('q');                            // -> string | null
await client.lPop('q', 2);                         // -> string[] | null
await client.lLen('q');                            // -> number
await client.lTrim('feed:1', 0, 99);               // -> 'OK'

const worker = client.duplicate();                 // blocking needs its own connection
await worker.connect();
const res = await worker.brPop('jobs', 0);         // -> { key, element } | null`;

export function ListsDocs() {
    return (
        <>
            {/* ---------- part 1 — what a list is, and how one comes into being ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Shape and Creation</PartHeading>
            <div>
                <DocSection title="ordered, and open at both ends">
                    <CodeBlock code={RPUSH} lang="bash" />
                    <p>
                        <Term>
                            A list is an ordered sequence of strings, and the order is yours
                            to control.
                        </Term>{" "}
                        Duplicates are allowed, nothing is sorted for you, and elements go
                        in and come out at either end.
                    </p>
                    <p>
                        <Term>
                            A list has two ends: the LEFT is the <em>head</em>, the RIGHT is
                            the <em>tail</em>.
                        </Term>{" "}
                        Every command name says which end it works on — the <Code>L</Code>{" "}
                        and <Code>R</Code> in <Code>LPUSH</Code> and <Code>RPUSH</Code> are
                        not left-and-right by accident.
                    </p>
                    <p>
                        <Term>You PUSH onto a list and POP off it.</Term> Those are the
                        verbs; &quot;add&quot; and &quot;remove&quot; lose the information
                        about which end.
                    </p>

                    <CodeBlock code={LPUSH} lang="bash" />
                    <p>
                        <Term>
                            <Code>LPUSH</Code> pushes onto the head, which reverses what you
                            type.
                        </Term>{" "}
                        Each element is pushed in turn: <Code>a</Code> goes in, then{" "}
                        <Code>b</Code> in front of it, then <Code>c</Code> in front of that.
                        The command is not confused — it did the same thing three times.
                    </p>
                    <p>
                        <Term>Both return the new length.</Term> Not how many you pushed —
                        the size of the list afterwards.
                    </p>
                </DocSection>

                <DocSection title="array or linked list?">
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Redis list", "array"]}
                        rows={[
                            ["ordered", "yes", "yes"],
                            ["duplicates", "allowed", "allowed"],
                            ["reachable by index", "yes", "yes"],
                            ["stored as", "a linked list", "one contiguous block"],
                            ["both ends", "O(1)", "O(1) at the back only"],
                            ["the middle by index", "O(N) — walked from an end", "O(1)"],
                        ]}
                    />
                    <p>
                        <Term>
                            The familiar part is real: ordered, indexed, duplicates allowed.
                        </Term>{" "}
                        That is where the resemblance to an array stops.
                    </p>
                    <p>
                        <Term>A Redis list is a linked list, not a contiguous array.</Term>{" "}
                        The ends are O(1) because Redis holds a pointer to each of them.
                        Reaching the middle by index is O(N), because there is nothing to
                        compute — Redis walks there from whichever end is nearer.
                    </p>
                    <p>
                        <Term>So it is fast at the ends and slow in the middle</Term> — the
                        exact opposite of an array, which gives instant random access and
                        makes you pay to insert at the front.
                    </p>
                </DocSection>

                <DocSection title="there is no create, and no empty list">
                    <CodeBlock code={CREATE} lang="bash" />
                    <p>
                        <Term>
                            <Code>RPUSH</Code> on a missing key creates the list and pushes
                            in one step.
                        </Term>{" "}
                        Same as <Code>HSET</Code> and <Code>INCR</Code>: writing implies
                        creating, and there is no create command to forget.
                    </p>
                    <p>
                        <Term>Pop the last element and Redis deletes the key.</Term> There
                        is no empty list, exactly as there is no empty hash.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · an empty list and a missing key are one state"
                    >
                        <CodeBlock code={EMPTY} lang="bash" />
                        <p className="mt-3">
                            Redis cannot tell you the difference, because there is no
                            difference to tell. Reading a missing key is not an error
                            either: <Code>LRANGE</Code> on one returns{" "}
                            <Code>(empty array)</Code>, never <Code>(nil)</Code> and never
                            an error. So an empty reply says nothing about whether the key
                            exists — <Code>EXISTS</Code> is the command that answers that.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="LRANGE">
                    <CodeBlock code={LRANGE} lang="bash" />
                    <p>
                        <Term>
                            <Code>LRANGE key start stop</Code> reads a window, and there is
                            no &quot;get all&quot; command.
                        </Term>{" "}
                        <Code>0 -1</Code> is the idiom for the whole list: index{" "}
                        <Code>0</Code> to index <Code>-1</Code>, where <Code>-1</Code> is
                        the last element and <Code>-2</Code> the second-to-last.
                    </p>
                    <p>
                        <Term>
                            Out-of-range requests return what exists rather than erroring.
                        </Term>{" "}
                        <Code>LRANGE pair 0 9</Code> on a two-element list gives two
                        elements — the same forgiving reading Redis applies to a missing
                        key.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · the middle-of-the-list commands"
                    >
                        <p>
                            <Code>LINSERT</Code> inserts before or after a pivot value,{" "}
                            <Code>LSET</Code> overwrites by index, <Code>LREM</Code> removes{" "}
                            <em>n</em> occurrences of a value, and <Code>LPOS</Code> returns
                            a value&apos;s index. All four are O(N) for the same reason the
                            middle of a list is, and none of them is covered further here.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — taking elements back out, and the two shapes that gives ---------- */}
            <PartHeading kicker="part 2">Popping, Queues and Stacks</PartHeading>
            <div>
                <DocSection title="LPOP and RPOP">
                    <CodeBlock code={POPS} lang="bash" />
                    <p>
                        <Term>A pop removes AND returns.</Term> One command, not a read
                        followed by a delete — so the element is yours and no other client
                        can be handed the same one.
                    </p>
                    <p>
                        <Term>
                            On an empty or missing key a pop returns <Code>(nil)</Code>.
                        </Term>{" "}
                        Which, since there is no empty list, is one case rather than two.
                    </p>
                </DocSection>

                <DocSection title="queue versus stack">
                    <GridTable
                        cols="grid-cols-[max-content_max-content_max-content_1fr]"
                        head={["shape", "add", "take", "ends"]}
                        rows={[
                            ["queue (FIFO)", "RPUSH", "LPOP", "opposite ends"],
                            ["stack (LIFO)", "RPUSH", "RPOP", "the same end"],
                        ]}
                    />
                    <CodeBlock code={QUEUE} lang="bash" />
                    <p>
                        <Term>
                            A queue is FIFO — first in, first out — which is push at one end
                            and pop at the other.
                        </Term>{" "}
                        <Code>job1</Code> arrived first, so the queue serves it first. This
                        is the shape behind every job queue in this project.
                    </p>

                    <CodeBlock code={STACK} lang="bash" />
                    <p>
                        <Term>
                            A stack is LIFO — last in, first out — which is push and pop at
                            the same end.
                        </Term>{" "}
                        Nothing about the list changed; the only difference is which end you
                        took from.
                    </p>
                    <p>
                        <Term>
                            So the data structure does not decide — the pair of commands
                            does.
                        </Term>{" "}
                        One list is a queue or a stack according to how it is read.
                    </p>
                </DocSection>

                <DocSection title="popping in batches">
                    <CodeBlock code={BATCH} lang="bash" />
                    <p>
                        <Term>Both pops take a count.</Term> <Code>LPOP q 2</Code> returns
                        two elements in one round trip instead of two — how a worker grabs a
                        batch of jobs instead of asking per job.
                    </p>

                    <Callout
                        severity="note"
                        label="note · reference · the multi-key and move forms"
                    >
                        <p>
                            <Code>LMPOP</Code> pops from the first non-empty of several
                            keys. <Code>RPOPLPUSH</Code> and its successor{" "}
                            <Code>LMOVE</Code> move an element from one list to another
                            atomically, which is the basis of the reliable-queue pattern —
                            named here so the vocabulary is familiar, and not covered
                            further.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="LLEN">
                    <CodeBlock code={LLEN} lang="bash" />
                    <p>
                        <Term>
                            <Code>LLEN</Code> is O(1)
                        </Term>{" "}
                        — Redis stores the count rather than counting on demand, so it is
                        instant whether the list holds two elements or two million. That
                        makes it your queue-depth metric: cheap enough to call on every
                        scrape.
                    </p>

                    <QA
                        q={
                            <>
                                You want a FIFO job queue. Which two commands, and why not
                                the other pairing?
                            </>
                        }
                        a={
                            <>
                                <Code>RPUSH</Code> to add and <Code>LPOP</Code> to take —
                                opposite ends, so the oldest job is served first. Pushing
                                and popping the same end gives a stack, where a busy queue
                                keeps serving the newest job and starves the oldest.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — keeping a list from growing forever ---------- */}
            <PartHeading kicker="part 3">Capped Lists</PartHeading>
            <div>
                <DocSection title="LTRIM">
                    <CodeBlock code={LTRIM} lang="bash" />
                    <p>
                        <Term>
                            <Code>LTRIM</Code> keeps a range and deletes everything else.
                        </Term>{" "}
                        Same index syntax as <Code>LRANGE</Code>, and destructive where{" "}
                        <Code>LRANGE</Code> is not: <Code>LRANGE</Code> reads a window,{" "}
                        <Code>LTRIM</Code> makes the list <em>become</em> that window.
                    </p>
                    <p>
                        <Term>Shortening a list this way is TRIMMING</Term>, and it replies{" "}
                        <Code>OK</Code> rather than a count — there is no &quot;how many did
                        it remove&quot; in the reply.
                    </p>

                    <CodeBlock code={LTRIM_LAST} lang="bash" />
                    <p>
                        <Term>
                            There is no <Code>RTRIM</Code>.
                        </Term>{" "}
                        The <Code>L</Code> here means &quot;list&quot;, not
                        &quot;left&quot;, and the range covers both ends — so keeping the
                        last three is <Code>LTRIM log -3 -1</Code> rather than a different
                        command.
                    </p>
                </DocSection>

                <DocSection title="the capped-list pattern">
                    <CodeBlock code={CAPPED} lang="bash" />
                    <p>
                        <Term>
                            Push to the head, then trim to the size you want: that is the
                            standard &quot;keep the last N&quot;.
                        </Term>{" "}
                        The list can never exceed 100 elements, and the newest is always at
                        index <Code>0</Code>, so <Code>LRANGE feed:1 0 9</Code> is the top
                        ten without any sorting.
                    </p>
                    <p>
                        <Term>A list that discards old entries is CAPPED, or BOUNDED.</Term>{" "}
                        Activity feeds, the last N log lines, notification lists — two
                        commands after every write, and the cost of the key stops growing.
                    </p>

                    <Callout severity="note" label="note · reference · an untrimmed list">
                        <p>
                            An unbounded list is a memory leak with extra steps. If nothing
                            trims it and nothing pops it, it grows until{" "}
                            <Code>maxmemory</Code> eviction decides for you — a decision
                            made at the worst possible moment, by the server, about keys you
                            did not choose.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — the command that waits instead of polling ---------- */}
            <PartHeading kicker="part 4">Blocking Pops</PartHeading>
            <div>
                <DocSection title="BRPOP">
                    <CodeBlock code={BRPOP} lang="bash" />
                    <p>
                        <Term>
                            The <Code>B</Code> is for blocking.
                        </Term>{" "}
                        If the key has an element, <Code>BRPOP</Code> returns it
                        immediately, exactly like <Code>RPOP</Code>. If the list is empty
                        the connection <em>waits</em> until something is pushed.
                    </p>

                    <CodeBlock code={BRPOP_WAKE} lang="bash" />
                    <p>
                        <Term>
                            The push in the second terminal wakes the first one instantly.
                        </Term>{" "}
                        Nothing was retried and nothing was scheduled — the waiting
                        connection is handed the element as it arrives.
                    </p>
                    <p>
                        <Term>
                            The reply says WHICH KEY and THE VALUE, where <Code>RPOP</Code>{" "}
                            returns just the value.
                        </Term>{" "}
                        The extra element is there because one <Code>BRPOP</Code> can watch
                        several keys at once, and then the answer has to say which of them
                        delivered.
                    </p>

                    <CodeBlock code={BRPOP_TIMEOUT} lang="bash" />
                    <p>
                        <Term>The last argument is a timeout in seconds.</Term>{" "}
                        <Code>0</Code> means wait forever; <Code>BRPOP jobs 5</Code> gives
                        up after five seconds and returns <Code>(nil)</Code>.
                    </p>
                </DocSection>

                <DocSection title="what it replaces">
                    <CodeBlock code={POLL} lang="js" />
                    <p>
                        <Term>
                            A worker that repeatedly asks is POLLING, and it pays twice.
                        </Term>{" "}
                        One request every second per worker whether or not there is work,
                        and up to a full second of delay before a job that has already
                        arrived starts being handled.
                    </p>

                    <CodeBlock code={WAIT} lang="js" />
                    <p>
                        <Term>
                            With <Code>BRPOP</Code> the worker asks once and Redis wakes it
                            the instant a job arrives.
                        </Term>{" "}
                        No wasted requests, no delay, and the loop got shorter rather than
                        cleverer. That is the whole job: don&apos;t poll, wait.
                    </p>
                    <p>
                        <Term>
                            In one line: pop if there is something, otherwise wait until
                            there is, then pop it.
                        </Term>{" "}
                        And because it still removes AND returns, the worker owns the
                        element — no second worker is given the same one.
                    </p>
                </DocSection>

                <DocSection title="blocking blocks the client, not the server">
                    <p>
                        <Term>
                            <Code>BRPOP</Code> blocks that ONE connection, not Redis.
                        </Term>{" "}
                        The connection is registered as waiting on the key and the server
                        moves straight on to serving everyone else. Fifty blocked workers
                        cost essentially nothing.
                    </p>
                    <p>
                        <Term>A blocked client is IDLE, not busy.</Term> It consumes a
                        connection, not CPU — which is why the single-threaded warning does
                        not apply here. That warning is about commands that DO WORK on the
                        one thread, <Code>KEYS</Code> or <Code>HGETALL</Code> on a wide
                        hash, and a client sitting still does none.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · a blocked connection cannot send anything else"
                    >
                        <p>
                            A connection waiting in <Code>BRPOP</Code> can send no other
                            command until it returns. A worker therefore needs its OWN
                            client instance, separate from the one the app reads and writes
                            with. Miss this and the whole app freezes behind the blocked
                            connection — every unrelated <Code>GET</Code> queues up behind a
                            wait that may never end. In node-redis that is{" "}
                            <Code>client.duplicate()</Code> plus its own{" "}
                            <Code>connect()</Code>.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · the rest of the blocking family"
                    >
                        <p>
                            <Code>BLPOP</Code> is the head-side twin, and{" "}
                            <Code>BLMPOP</Code> and <Code>BLMOVE</Code> are the blocking
                            multi-key and move forms. Note also that a plain{" "}
                            <Code>BRPOP</Code> loses the job if the worker crashes after
                            popping: the element is out of the list and nowhere else. The
                            reliable-queue answer is <Code>BLMOVE</Code> into a processing
                            list and a removal on success — named here, not covered.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                Your API hangs the moment a background worker starts. The
                                worker uses <Code>BRPOP</Code>. What happened?
                            </>
                        }
                        a={
                            <>
                                The worker is blocking on the same client instance the API
                                uses, so every other command is stuck behind a wait with a
                                timeout of <Code>0</Code>. Give the worker its own
                                connection with <Code>duplicate()</Code>.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 5 — the shape a list is the wrong choice for ---------- */}
            <PartHeading kicker="part 5">Limits</PartHeading>
            <div>
                <DocSection title="random access is O(N)">
                    <CodeBlock code={LINDEX} lang="bash" />

                    <Callout
                        severity="trap"
                        label="trap · the middle of a list is expensive"
                    >
                        <p>
                            <Code>LINDEX q 5000</Code> makes Redis walk five thousand
                            elements from the nearest end. Fine at the ends, expensive in
                            the middle, and the command gives no hint which it was. Lists
                            are for queues and capped feeds, not for &quot;row 5000 of my
                            data&quot;. If you need ordering <em>plus</em> lookup by
                            position or by score, that is a sorted set — its own page.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · reference · how a list is encoded"
                    >
                        <p>
                            A short list is stored as a <Code>listpack</Code>; past{" "}
                            <Code>list-max-listpack-size</Code> it converts to a{" "}
                            <Code>quicklist</Code>, a linked list of listpacks. Same type,
                            same commands, different structure underneath — see the{" "}
                            <Code>OBJECT ENCODING</Code> section of Inspecting the Keyspace.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                A list holds a million elements. Which of <Code>LLEN</Code>,{" "}
                                <Code>LPOP</Code> and <Code>LINDEX key 500000</Code> should
                                worry you?
                            </>
                        }
                        a={
                            <>
                                Only the <Code>LINDEX</Code>. <Code>LLEN</Code> reads a
                                stored count and <Code>LPOP</Code> works at an end — both
                                O(1) at any size. The <Code>LINDEX</Code> walks half the
                                list on the single thread.
                            </>
                        }
                    />
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
                        <Code>brPop</Code> in v5 returns an object{" "}
                        <Code>{"{ key, element }"}</Code>
                    </Term>
                    , not the two-element array the CLI shows. Read the field, not a
                    position.
                </p>
                <p>
                    <Term>
                        <Code>lRange</Code> on a missing key returns an empty array, not{" "}
                        <Code>null</Code>
                    </Term>{" "}
                    — the same trap as <Code>hGetAll</Code> returning <Code>{"{}"}</Code>.
                    Check <Code>.length</Code>, and keep <Code>=== null</Code> for the
                    single-value replies that really can be absent, like <Code>lPop</Code>.
                </p>
                <p>
                    <Term>Multiple values go in as an array.</Term>{" "}
                    <Code>rPush(key, [&apos;a&apos;, &apos;b&apos;])</Code>, not{" "}
                    <Code>rPush(key, &apos;a&apos;, &apos;b&apos;)</Code> — the CLI&apos;s
                    variadic tail becomes one argument.
                </p>
            </DocSection>
        </>
    );
}
