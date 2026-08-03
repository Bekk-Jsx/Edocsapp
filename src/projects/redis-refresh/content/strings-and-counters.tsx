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
    // --- part 1 (SET and its Options) ---
    // inline `danger · SET NX then EXPIRE leaves a gap` callout, plus a
    // `note · reference` on releasing the lock safely
    "the-one-line-lock": ["danger", "note"],
    // inline `note · reference` callout — WRONGTYPE on a non-string key
    "the-get-option": ["note"],
    // inline `trap · a plain SET discards the expiry` callout, plus a
    // `note · reference` on the other expiry arguments
    keepttl: ["trap", "note"],

    // --- part 2 (Counters) ---
    // inline `trap · the type stays string` callout, plus a `note · reference`
    // on the int encoding and the 64-bit range
    "the-parsing-trap": ["trap", "note"],

    // --- part 3 (Multi-key and One-shot Reads) ---
    // inline `note · reference` callout — MSETNX and Cluster hash slots
    "mset-and-mget": ["note"],
    // inline `note · reference` callout — GETEX and the deprecated GETSET
    getdel: ["note"],

    // --- part 4 (Append and Length) ---
    // inline `note · reference` callout — STRLEN, GETRANGE/SETRANGE, bitmaps
    append: ["note"],

    // --- part 5 (When a JSON Blob is the Wrong Call) ---
    // inline `note · reference` callout — RedisJSON is a module
    "the-rule": ["note"],
};

// Top-level divider between the five parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands, node-playground, inspecting-the-keyspace
// and the hooks content files each define for their own part dividers.
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

// Exactly the grid treatment node-playground's RepresentationTable and
// inspecting-the-keyspace's GridTable use — a real <table> would be the only one
// in the codebase. The markup, the cell padding and the three text colours
// (head, first column, rest) are unchanged.
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

const NX_XX = `SET k "v1"
# OK
SET k "v2" NX
# (nil)              -> k exists, so NX did nothing
SET k "v3" XX
# OK                 -> k exists, so XX overwrote it
DEL k
# (integer) 1
SET k "v4" XX
# (nil)              -> k is missing, so XX did nothing
SET k "v5" NX
# OK                 -> k is missing, so NX created it`;

// Not executable as one session — two clients interleaved, so the gap between
// the check and the write is visible.
const RACE = `# client A                        # client B
EXISTS lock:job1
# (integer) 0
                                  EXISTS lock:job1
                                  # (integer) 0
SET lock:job1 "A"
# OK
                                  SET lock:job1 "B"
                                  # OK    <- both believe they own the lock`;

const RACE_FIXED = `# client A                        # client B
SET lock:job1 "A" NX
# OK
                                  SET lock:job1 "B" NX
                                  # (nil) <- exactly one client gets OK`;

const LOCK = `SET lock:job1 "worker-a" NX EX 30
# OK
TTL lock:job1
# (integer) 30`;

const LOCK_GAP = `SET lock:job1 "worker-a" NX
# OK                 -> acquired, and it has no TTL yet
# ... the worker crashes here, before EXPIRE runs
TTL lock:job1
# (integer) -1       -> permanent
SET lock:job1 "worker-b" NX EX 30
# (nil)              -> and every other worker gets this, forever`;

const EXPIRE_DEL = `SET name "Yassin"
# OK
EXPIRE name 60
# (integer) 1
TTL name
# (integer) 60
GET name
# "Yassin"           -> the value was never touched
PERSIST name
# (integer) 1        -> the deadline is dropped, the key stays`;

const GET_OPTION = `SET counter "10"
# OK
SET counter "20" GET
# "10"               -> the old value, returned as the new one is written
GET counter
# "20"`;

const KEEPTTL = `SET s:1 "v1" EX 100
# OK
SET s:1 "v2"
# OK
TTL s:1
# (integer) -1       -> the deadline is gone

SET s:1 "v1" EX 100
# OK
SET s:1 "v2" KEEPTTL
# OK
TTL s:1
# (integer) 98       -> value replaced, deadline preserved`;

const INCR = `SET views:page1 0
# OK
INCR views:page1
# (integer) 1
INCR views:page1
# (integer) 2
DEL views:page1
# (integer) 1
INCR views:page1
# (integer) 1        -> a missing key counts as 0, no setup needed`;

const FAMILY = `SET n 0
# OK
INCR n
# (integer) 1
INCRBY n 10
# (integer) 11
DECR n
# (integer) 10
DECRBY n 5
# (integer) 5
INCRBYFLOAT price -1.5
# "-1.5"             -> there is no DECRBYFLOAT; pass a negative`;

const PARSING = `SET name "Yassin"
# OK
INCR name
# (error) ERR value is not an integer or out of range
TYPE name
# string             -> still a string, before and after

SET hits "10"
# OK
INCR hits
# (integer) 11       -> "10" parses fine
SET price "10.5"
# OK
INCR price
# (error) ERR value is not an integer or out of range
INCRBYFLOAT price 0.5
# "11"               -> INCRBYFLOAT is the one that accepts a decimal`;

const MSET_MGET = `MSET u:1:name "Yassin" u:1:city "Berlin"
# OK
MGET u:1:name u:1:city u:1:missing
# 1) "Yassin"
# 2) "Berlin"
# 3) (nil)           -> the position is kept, so the reply zips back by index`;

const GETDEL = `SET otp:123 "849201"
# OK
GETDEL otp:123
# "849201"
GET otp:123
# (nil)              -> read and consumed in one command`;

const APPEND = `SET a "hello"
# OK
APPEND a " world"
# (integer) 11       -> the new length, not the value
GET a
# "hello world"

SET a "hello"
# OK
SET a " world"
# OK
GET a
# " world"           -> SET throws the old value away

DEL a
# (integer) 1
APPEND a "first line"
# (integer) 10       -> on a missing key it behaves like SET`;

const APPEND_BRANCH = `// without the guarantee
if (await client.exists('log:2')) await client.append('log:2', txt);
else await client.set('log:2', txt);

// with it
await client.append('log:2', txt);   // works either way`;

const BLOB = `SET user:1 '{"name":"Yassin","city":"Berlin","logins":42}'
# OK
TYPE user:1
# string             -> one opaque value, whatever is inside it`;

const BLOB_UPDATE = `const raw = await client.get('user:1');             // 1. transfer it all
const user = JSON.parse(raw);                       // 2. parse it
user.logins += 1;                                   // 3. edit one field
await client.set('user:1', JSON.stringify(user));   // 4. write it all back`;

const NODE = `await client.set('lock:job1', 'worker-a', { NX: true, EX: 30 });   // -> 'OK' | null
await client.set('s:1', 'v2', { KEEPTTL: true });
const old = await client.set('counter', '20', { GET: true });      // previous value

await client.incr('views:page1');            // -> number
await client.incrBy('views:page1', 10);
await client.incrByFloat('price', -1.5);     // -> string, not number

await client.mSet({ 'u:1:name': 'Yassin', 'u:1:city': 'Berlin' });
const vals = await client.mGet(['u:1:name', 'u:1:missing']);       // ['Yassin', null]

const otp = await client.getDel('otp:123');
await client.append('log:2', 'line');        // -> new length`;

export function StringsAndCountersDocs() {
    return (
        <>
            {/* ---------- part 1 — the modifiers that make a write conditional ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">SET and its Options</PartHeading>
            <div>
                <DocSection title="NX and XX">
                    <CodeBlock code={NX_XX} lang="bash" />

                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["command", "key missing", "key exists"]}
                        rows={[
                            ["SET k v", "creates -> OK", "overwrites -> OK"],
                            ["SET k v NX", "creates -> OK", "does nothing -> (nil)"],
                            ["SET k v XX", "does nothing -> (nil)", "overwrites -> OK"],
                        ]}
                    />

                    <p>
                        <Term>
                            <Code>NX</Code> is Not eXists, <Code>XX</Code> is eXists.
                        </Term>{" "}
                        The same naming family turns up across the command set —{" "}
                        <Code>EXPIRE ... NX|XX</Code> and <Code>ZADD ... NX|XX</Code> read
                        the same way, so learning it once covers all of them.
                    </p>
                    <p>
                        <Term>Plain SET always wins.</Term> It writes whether or not the key
                        is there. <Code>NX</Code> makes the write{" "}
                        <Term>conditional on absence</Term> — create only.{" "}
                        <Code>XX</Code> makes it conditional on <Term>presence</Term> —
                        update only.
                    </p>
                    <p>
                        <Term>
                            <Code>(nil)</Code> here is not an error — it means &quot;I did
                            nothing&quot;.
                        </Term>{" "}
                        A returned <Code>(nil)</Code> reports a <Term>no-op</Term>: the
                        condition wasn&apos;t met, so the value on the server is exactly
                        what it was before the command.
                    </p>
                    <p>
                        <Term>Keep the verbs straight.</Term> You <Term>set</Term> a key and
                        you <Term>overwrite</Term> a value — the key is the name you write
                        to, the value is the thing that gets replaced.
                    </p>
                </DocSection>

                <DocSection title="why NX matters: atomicity">
                    <CodeBlock code={RACE} lang="bash" />
                    <p>
                        <Term>
                            Checking and then writing in two commands leaves a gap.
                        </Term>{" "}
                        Both clients read <Code>0</Code> from <Code>EXISTS</Code> before
                        either has written, so both go on to <Code>SET</Code> and both
                        believe they own the lock. Nothing in the sequence is wrong on its
                        own; the bug is the space between the two commands.
                    </p>

                    <CodeBlock code={RACE_FIXED} lang="bash" />
                    <p>
                        <Term>
                            <Code>SET ... NX</Code> is a single command, so exactly one
                            client gets <Code>OK</Code>.
                        </Term>{" "}
                        The check and the write are the same operation, and the loser is
                        told so immediately by the <Code>(nil)</Code>.
                    </p>
                    <p>
                        <Term>
                            A command is <em>atomic</em> when nothing can interleave with
                            it.
                        </Term>{" "}
                        That is the property being bought here — not speed, not fewer
                        keystrokes. Two commands can be interleaved; one cannot.
                    </p>
                </DocSection>

                <DocSection title="the one-line lock">
                    <CodeBlock code={LOCK} lang="bash" />
                    <p>
                        <Term>
                            Acquire the lock and set its deadline in one atomic command.
                        </Term>{" "}
                        <Code>NX</Code> makes it an acquisition and <Code>EX 30</Code>{" "}
                        attaches the expiry, so there is never a moment where the key exists
                        without a TTL.
                    </p>

                    <Callout severity="danger" label="danger · SET NX then EXPIRE leaves a gap">
                        <CodeBlock code={LOCK_GAP} lang="bash" />
                        <p className="mt-3">
                            Split into two commands, the key is live and permanent between
                            them. A worker that crashes after the <Code>SET</Code> and
                            before the <Code>EXPIRE</Code> leaves <Code>TTL</Code> at{" "}
                            <Code>-1</Code>. Every other worker calling{" "}
                            <Code>SET ... NX</Code> now gets <Code>(nil)</Code> forever:
                            nobody can take the lock, and nothing will ever release it.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · reference · releasing a lock safely">
                        <p>
                            Releasing this lock with a plain <Code>DEL</Code> is unsafe. If
                            the TTL had already lapsed and another worker acquired the lock,
                            the <Code>DEL</Code> deletes someone else&apos;s lock. The
                            correct release compares the value first and only deletes on a
                            match, which is not expressible as a single Redis command — it
                            needs a Lua script or a Redlock-style library. Advanced, and not
                            covered on this page.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="EXPIRE versus DEL">
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "DEL k", "EXPIRE k 30"]}
                        rows={[
                            ["when", "now", "in 30 seconds"],
                            [
                                "key after the command",
                                "gone",
                                "still there, with a countdown",
                            ],
                            ["reversible", "no", "yes — PERSIST"],
                        ]}
                    />
                    <p>
                        <Term>
                            <Code>DEL</Code> is an action; <Code>EXPIRE</Code> is a deadline.
                        </Term>{" "}
                        <Code>DEL</Code> happens when you send it and there is nothing left
                        to undo. <Code>EXPIRE</Code> hands Redis an instruction to carry out
                        later, and until then the key is entirely normal.
                    </p>

                    <CodeBlock code={EXPIRE_DEL} lang="bash" />
                    <p>
                        <Term>
                            <Code>EXPIRE</Code> works on a key that already exists and does
                            not touch its value.
                        </Term>{" "}
                        <Code>GET name</Code> still returns <Code>&quot;Yassin&quot;</Code>{" "}
                        with sixty seconds on the clock — an expiry is metadata on the key,
                        not part of what the key holds.
                    </p>
                    <p>
                        <Term>Keep the verbs straight here too.</Term> You{" "}
                        <Term>attach</Term> an expiry with <Code>EXPIRE</Code> and{" "}
                        <Term>drop</Term> it with <Code>PERSIST</Code>. Neither one sets or
                        overwrites anything.
                    </p>
                </DocSection>

                <DocSection title="the GET option">
                    <CodeBlock code={GET_OPTION} lang="bash" />
                    <p>
                        <Term>
                            <Code>SET ... GET</Code> returns the old value while writing the
                            new one, atomically.
                        </Term>{" "}
                        One round trip instead of a <Code>GET</Code> followed by a{" "}
                        <Code>SET</Code>, and no gap in which another client could change
                        the value between the read and the write.
                    </p>
                    <p>
                        <Term>Reach for it when the previous value matters</Term> — rotating
                        a token and logging what it replaced, or reading a counter and
                        resetting it in the same breath.
                    </p>

                    <Callout severity="note" label="note · reference · GET on the wrong type">
                        <p>
                            <Code>SET ... GET</Code> against a key holding a non-string type
                            returns <Code>WRONGTYPE</Code>, and the write does not happen.
                            The command is all-or-nothing: the option cannot half-succeed by
                            writing the string and failing to report the old value.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="KEEPTTL">
                    <CodeBlock code={KEEPTTL} lang="bash" />
                    <p>
                        <Term>
                            A plain <Code>SET</Code> replaces the key, expiry included.
                        </Term>{" "}
                        <Code>TTL</Code> goes to <Code>-1</Code> and the key is now
                        permanent. <Code>KEEPTTL</Code> replaces the value and leaves the
                        deadline running — the <Code>98</Code> is the original hundred
                        seconds, minus the two that had already elapsed.
                    </p>

                    <Callout severity="trap" label="trap · a plain SET discards the expiry">
                        <p>
                            The expiry goes silently: no error, no warning, and the write
                            succeeds. This is the same trap as <em>losing a TTL</em> in
                            Inspecting the Keyspace, seen from the write side rather than
                            found afterwards with <Code>TTL</Code>. The session that was
                            supposed to lapse simply never does, and the only evidence is a{" "}
                            <Code>-1</Code> nobody thought to check.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · reference · the other expiry arguments">
                        <p>
                            <Code>EX</Code> takes seconds and <Code>PX</Code> milliseconds;{" "}
                            <Code>EXAT</Code> and <Code>PXAT</Code> take an absolute Unix
                            timestamp instead of a duration, which is what you want when the
                            deadline is a wall-clock moment rather than a countdown.{" "}
                            <Code>SETEX</Code> and <Code>PSETEX</Code> are the older
                            single-purpose forms, kept for compatibility — prefer{" "}
                            <Code>SET</Code> with <Code>EX</Code> or <Code>PX</Code>.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                You need to write a key only if it isn&apos;t already there,
                                and it must not outlive 30 seconds. How many commands?
                            </>
                        }
                        a={
                            <>
                                One — <Code>SET k v NX EX 30</Code>. Splitting it into{" "}
                                <Code>SET ... NX</Code> plus <Code>EXPIRE</Code> introduces
                                a window where a crash leaves the key permanent.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 2 — a string that Redis will do arithmetic on ---------- */}
            <PartHeading kicker="part 2">Counters</PartHeading>
            <div>
                <DocSection title="INCR">
                    <CodeBlock code={INCR} lang="bash" />
                    <p>
                        <Term>
                            <Code>INCR</Code> returns the <em>new</em> value
                        </Term>
                        , so incrementing and reading are the same command. There is no{" "}
                        <Code>INCR</Code> followed by <Code>GET</Code>.
                    </p>
                    <p>
                        <Term>No initialisation is needed.</Term> <Code>INCR</Code> on a
                        missing key treats it as <Code>0</Code> and returns <Code>1</Code>,
                        so there is no &quot;create the counter first&quot; step — and
                        therefore no race between creating it and incrementing it.
                    </p>
                    <p>
                        <Term>
                            A counter is <em>incremented</em>, never &quot;plus-oned&quot;.
                        </Term>{" "}
                        <Code>INCR</Code> is a <Term>counter primitive</Term>: the whole
                        read-add-write cycle collapsed into one server-side operation.
                    </p>
                </DocSection>

                <DocSection title="the family">
                    <CodeBlock code={FAMILY} lang="bash" />
                    <p>
                        <Term>
                            <Code>INCR</Code> adds 1, <Code>INCRBY</Code> adds the number
                            you choose, <Code>DECR</Code> subtracts 1 and{" "}
                            <Code>DECRBY</Code> subtracts <em>n</em>.
                        </Term>{" "}
                        Four commands, one idea.
                    </p>
                    <p>
                        <Term>
                            <Code>INCRBYFLOAT</Code> handles decimals, and there is no{" "}
                            <Code>DECRBYFLOAT</Code>
                        </Term>{" "}
                        — pass a negative instead, as in{" "}
                        <Code>INCRBYFLOAT price -1.5</Code>.
                    </p>
                    <p>
                        <Term>All of them are atomic.</Term> No read-modify-write in your
                        application, so no lost updates under concurrency however many
                        clients are counting at once.
                    </p>
                </DocSection>

                <DocSection title="the parsing trap">
                    <CodeBlock code={PARSING} lang="bash" />

                    <Callout severity="trap" label="trap · the type stays string">
                        <p>
                            There is no counter type. <Code>TYPE</Code> keeps reporting{" "}
                            <Code>string</Code> and Redis parses the content on every call,
                            which is why <Code>INCR name</Code> on{" "}
                            <Code>&quot;Yassin&quot;</Code> fails at call time rather than
                            being prevented at write time. So <Code>&quot;10&quot;</Code>{" "}
                            increments fine, <Code>&quot;abc&quot;</Code> errors, and{" "}
                            <Code>&quot;10.5&quot;</Code> <em>also</em> errors —{" "}
                            <Code>INCR</Code> is integer-only, and{" "}
                            <Code>INCRBYFLOAT</Code> is the one that accepts a decimal.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · reference · how the integer is stored">
                        <p>
                            An integer value is stored under the <Code>int</Code> encoding
                            rather than as text, which is what makes <Code>INCR</Code>{" "}
                            cheap. The range is 64-bit signed, and overflowing it returns the
                            same <Code>out of range</Code> error as a value that never
                            parsed. <Code>INCRBYFLOAT</Code> uses a long double and is not
                            suitable for money — store minor units as integers and count
                            those instead.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                Two requests increment the same page counter at the same
                                moment. Do you need a lock?
                            </>
                        }
                        a={
                            <>
                                No. <Code>INCR</Code> is a single atomic command on a
                                single-threaded server, so both increments land. A lock would
                                only be needed if you read the value, computed something from
                                it in your application, and wrote it back.
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 3 — several keys per round trip, and read-once reads ---------- */}
            <PartHeading kicker="part 3">Multi-key and One-shot Reads</PartHeading>
            <div>
                <DocSection title="MSET and MGET">
                    <CodeBlock code={MSET_MGET} lang="bash" />
                    <p>
                        <Term>
                            <Code>MSET</Code> writes several keys and <Code>MGET</Code>{" "}
                            reads several, in one round trip each.
                        </Term>{" "}
                        The saving is network, not server work — the same commands still
                        run, just without a round trip between each of them.
                    </p>
                    <p>
                        <Term>Missing keys come back as nil in position.</Term> The reply
                        always has the same length as the request, so it zips back to your
                        key list by index and there is never any guessing about which key a
                        given value belongs to.
                    </p>

                    <Callout severity="note" label="note · reference · MSETNX and Cluster">
                        <p>
                            <Code>MSET</Code> is atomic across all its keys, but it has no
                            per-key <Code>NX</Code> form. <Code>MSETNX</Code> exists and
                            only sets if <em>all</em> the keys are missing, which is rarely
                            what you want. On Redis Cluster, multi-key commands require every
                            key to live in the same hash slot.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="GETDEL">
                    <CodeBlock code={GETDEL} lang="bash" />
                    <p>
                        <Term>
                            <Code>GETDEL</Code> reads a value and removes the key in one
                            atomic command.
                        </Term>{" "}
                        This is the command for one-time tokens, OTPs and single-use flags —
                        anything that must be delivered exactly once.
                    </p>
                    <p>
                        <Term>
                            <Code>GET</Code> followed by <Code>DEL</Code> is not the same
                            thing.
                        </Term>{" "}
                        Two clients can both read the token before either one deletes it,
                        and both then act on a code that was supposed to work once.
                    </p>

                    <Callout severity="note" label="note · reference · GETEX and GETSET">
                        <p>
                            <Code>GETEX</Code> reads a value and changes its expiry in the
                            same command — <Code>GETEX k EX 60</Code> to extend it,{" "}
                            <Code>GETEX k PERSIST</Code> to drop it. <Code>GETSET</Code> is
                            deprecated in favour of <Code>SET ... GET</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — growing a string instead of replacing it ---------- */}
            <PartHeading kicker="part 4">Append and Length</PartHeading>
            <div>
                <DocSection title="APPEND">
                    <CodeBlock code={APPEND} lang="bash" />
                    <p>
                        <Term>
                            <Code>APPEND</Code> adds text to the end of the existing value
                            and replaces nothing.
                        </Term>{" "}
                        Put next to <Code>SET</Code>, the difference is the whole point:{" "}
                        <Code>SET a &quot; world&quot;</Code> throws{" "}
                        <Code>&quot;hello&quot;</Code> away, while{" "}
                        <Code>APPEND a &quot; world&quot;</Code> keeps it.
                    </p>
                    <p>
                        <Term>It returns the new length, not the value.</Term> Convenient
                        for log lines and accumulating buffers, where the size matters more
                        than reading the whole thing back.
                    </p>
                    <p>
                        <Term>
                            On a missing key it behaves like <Code>SET</Code>
                        </Term>
                        , which is why no branch is needed in application code:
                    </p>

                    <CodeBlock code={APPEND_BRANCH} lang="js" />

                    <Callout severity="note" label="note · reference · the rest of the string commands">
                        <p>
                            <Code>STRLEN</Code> returns the length without transferring the
                            value. <Code>GETRANGE</Code> and <Code>SETRANGE</Code> read and
                            overwrite byte ranges, which makes a string usable as a
                            fixed-layout buffer. Strings are binary-safe up to 512 MB, and
                            the bitmap commands (<Code>SETBIT</Code>, <Code>GETBIT</Code>,{" "}
                            <Code>BITCOUNT</Code>) operate on that same underlying string.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — the first real modelling decision ---------- */}
            <PartHeading kicker="part 5">
                When a JSON Blob is the Wrong Call
            </PartHeading>
            <div>
                <DocSection title="the blob">
                    <CodeBlock code={BLOB} lang="bash" />
                    <p>
                        <Term>Storing a JSON document in a string works.</Term> Redis
                        accepts it without complaint — to the server it is just bytes, and
                        for a document you always read and write whole there is nothing
                        wrong with it.
                    </p>

                    <CodeBlock code={BLOB_UPDATE} lang="js" />
                    <p>
                        <Term>The cost shows up when one field changes.</Term> Four steps —
                        transfer the whole document, parse it, edit it, stringify and write
                        it back — and every one of them happens in your application rather
                        than on the server.
                    </p>
                    <p>
                        <Term>
                            That shape is <em>read-modify-write</em>, and two clients doing
                            it concurrently produce a <em>lost update</em>.
                        </Term>{" "}
                        Both read version 1, each applies its own change, and the second
                        write erases the first. Redis never saw a conflict: it received two
                        perfectly valid <Code>SET</Code> commands.
                    </p>
                    <p>
                        <Term>Reading one field is no cheaper either.</Term> There is no way
                        to ask for <Code>logins</Code> alone — the entire document crosses
                        the wire whatever you wanted from it.
                    </p>
                </DocSection>

                <DocSection title="the rule">
                    <p>
                        <Term>
                            A structured type replaces all four steps with one atomic
                            field-level command.
                        </Term>{" "}
                        No read, no parse, no window for a lost update, and only the field
                        you asked for on the wire. That is the Hashes page, and the commands
                        belong there rather than here.
                    </p>
                    <p>
                        <Term>
                            JSON in a string when you always read and write the whole thing
                            as a unit; a structured type when you touch fields individually
                            or need atomic per-field updates.
                        </Term>{" "}
                        The question is never &quot;is JSON allowed&quot; but &quot;what is
                        the unit of access&quot; — and that makes it the first real
                        modelling decision on this page.
                    </p>

                    <Callout severity="note" label="note · reference · RedisJSON">
                        <p>
                            <Code>RedisJSON</Code> (the <Code>JSON.*</Code> commands) gives
                            path-level access to a real JSON document, which removes the
                            read-modify-write problem without flattening the shape. It is a
                            module, though, and not present in a stock{" "}
                            <Code>redis:7.4-alpine</Code> image — so it is not an option
                            here unless the image changes.
                        </p>
                    </Callout>

                    <QA
                        q={
                            <>
                                Why is storing a JSON object in a string risky under
                                concurrency?
                            </>
                        }
                        a={
                            <>
                                Because the update is read-modify-write in the application,
                                not in Redis. Two clients can both read version 1, each apply
                                their own change, and the second write erases the first.
                                Field-level commands inside Redis are atomic and have no such
                                window.
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
                    Every command above, unchanged in meaning — same arguments, same order,
                    with the CLI&apos;s trailing options passed as an options object. Three
                    details are worth pinning:
                </p>
                <p>
                    <Term>
                        <Code>set</Code> with <Code>NX</Code> returns <Code>null</Code>, not{" "}
                        <Code>false</Code>, when it does nothing.
                    </Term>{" "}
                    Check <Code>=== null</Code>. A falsy check happens to work here, but it
                    would also swallow a legitimate empty-string reply from the commands
                    that can return one.
                </p>
                <p>
                    <Term>
                        Redis&apos;s <Code>(nil)</Code> becomes JavaScript{" "}
                        <Code>null</Code> in node-redis v5
                    </Term>{" "}
                    — including inside an <Code>mGet</Code> array, where the position is
                    preserved exactly as the CLI shows it.
                </p>
                <p>
                    <Term>
                        <Code>incrByFloat</Code> returns a string.
                    </Term>{" "}
                    A JavaScript number cannot represent every value Redis can, so the
                    reply stays textual. Wrap it in <Code>Number()</Code> only where you
                    know the precision is safe.
                </p>
            </DocSection>
        </>
    );
}
