import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip). It is NOT what flags a section header — that is the
// explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic is one
// severity. No section here is, so every callout below is inline only.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Session) ---
    // inline `tip · signatures as you type` callout — no header treatment
    "redis-cli": ["tip"],
    // inline `trap · (nil) is not an error` callout
    "reply-annotations": ["trap"],
    // inline `danger · terminal detection` callout
    "raw-mode": ["danger"],
    // inline `danger · key case mismatch` callout
    "case-sensitivity": ["danger"],
    // inline forward-reference callout to the Strings & Counters topic
    "command-signatures": ["next"],

    // --- part 2 (Databases) ---
    // two inline callouts: `danger · cluster` and `trap · FLUSHALL`
    "databases-are-not-isolation": ["danger", "trap"],
};

// Top-level divider between the two halves of the page — mirrors the
// Session/Databases groups in the summary rail. Deliberately louder than a
// DocSection eyebrow (bold, larger, full-width rule) so the split is obvious
// while scrolling: this is a grouping, not a section.
//
// Same file-local helper the useEffect and useContext content files each define
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

const CONNECT = `redis-cli
# 127.0.0.1:6379>`;

const PING = `PING
# PONG
PING hello
# "hello"`;

const ONE_SHOT = `redis-cli PING
# PONG
redis-cli DBSIZE
# (integer) 3`;

// Not executable — a reference for the annotations the client prints. Each reply
// is followed by a comment so the block highlights like every other one here.
const REPLIES = `OK               # command succeeded, no data returned
"hello"          # text value — quotes are display only
(integer) 3      # numeric reply
(nil)            # the key does not exist
(empty array)    # succeeded, no elements matched
(error) ...      # command rejected`;

const RAW = `redis-cli GET greeting         # "hello"
redis-cli GET greeting | cat   # hello

redis-cli --raw GET greeting     # never annotate
redis-cli --no-raw GET greeting  # always annotate`;

const CASE = `set name Yassin
# OK
GET name
# "Yassin"
GET Name
# (nil)
SET Name Ahmed
# OK
DEL Name
# (integer) 1`;

// Not executable — the signature the CLI prints as the command is typed.
const SIGNATURE = `SET key value [NX|XX] [GET] [EX seconds|PX milliseconds|KEEPTTL]`;

const SELECT = `SELECT 1
# OK        -> prompt becomes 127.0.0.1:6379[1]>
GET name
# (nil)
DBSIZE
# (integer) 0
SELECT 0
# OK
GET name
# "Yassin"`;

const LOCATE = `INFO keyspace
# # Keyspace
# db0:keys=3,expires=0,avg_ttl=0
CLIENT INFO
# id=42 addr=127.0.0.1:51234 ... db=0 ...
redis-cli -n 3     # open a session directly on database 3`;

const COUNT = `CONFIG GET databases
# 1) "databases"
# 2) "16"`;

export function FirstCommandsDocs() {
    return (
        <>
            {/* ---------- part 1 — the client and its replies ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Session</PartHeading>
            <div>
                <DocSection title="redis-cli">
                    <CodeBlock code={CONNECT} lang="bash" />
                    <p>
                        <Term>
                            <Code>redis-cli</Code> is the official client shipped with
                            Redis.
                        </Term>{" "}
                        The prompt reports the host, the port, and — when it is not the
                        default — the database number in brackets. A prompt without
                        brackets indicates database 0.
                    </p>
                    <p>
                        <Term>The prompt is the first diagnostic step.</Term> When a
                        command returns unexpected results, it exposes a connection to the
                        wrong instance or database before anything else does.
                    </p>
                    <p>
                        Exit with <Code>exit</Code> or Ctrl+D. History persists in{" "}
                        <Code>~/.rediscli_history</Code> across sessions.
                    </p>

                    <Callout severity="tip" label="tip · signatures as you type">
                        <p>
                            The CLI displays a command&apos;s signature inline as it is
                            typed — faster than consulting documentation.{" "}
                            <Code>HELP SET</Code> adds the version, time complexity and
                            command group.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="PING">
                    <CodeBlock code={PING} lang="bash" />
                    <p>
                        <Term>
                            <Code>PING</Code> confirms the server received a command and
                            replied
                        </Term>{" "}
                        — the liveness probe used by monitoring systems, load balancers and
                        container health checks.
                    </p>
                    <p>
                        With an argument it returns that argument, confirming the round
                        trip preserves data intact.
                    </p>

                    <QA
                        q={<>How is checking that Redis is reachable described?</>}
                        a={
                            <>
                                “I <Term>ping</Term> the instance to confirm it&apos;s
                                reachable.” The exchange is a <Term>round trip</Term> or a{" "}
                                <Term>health check</Term>; a command is <em>issued</em> or{" "}
                                <em>sent</em>, and the server <em>returns a reply</em>.
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="one-shot mode">
                    <CodeBlock code={ONE_SHOT} lang="bash" />
                    <p>
                        <Term>
                            A command placed after <Code>redis-cli</Code> executes
                            immediately without opening a session.
                        </Term>{" "}
                        The client connects, sends, prints the reply and exits. This is the
                        form required in shell scripts, container health checks and cron
                        jobs.
                    </p>
                    <p>
                        Every command in this documentation works in both modes — the
                        interactive REPL suits exploration, one-shot suits automation.
                    </p>
                </DocSection>

                <DocSection title="reply annotations">
                    <CodeBlock code={REPLIES} lang="bash" />
                    <p>
                        <Term>
                            Annotations indicate the reply type and are added by the client.
                        </Term>{" "}
                        They are never part of the stored data.
                    </p>
                    <p>
                        <Term>
                            <Code>(nil)</Code> has one meaning: the key is absent.
                        </Term>{" "}
                        Redis does not distinguish a missing key from a key holding an
                        empty value, so the null-versus-missing ambiguity familiar from
                        relational databases does not arise.
                    </p>

                    <Callout severity="trap" label="trap · (nil) is not an error">
                        <p>
                            Client code must treat an absent key as a normal outcome, not a
                            failure.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="raw mode">
                    <CodeBlock code={RAW} lang="bash" />
                    <p>
                        <Term>
                            The client detects whether output goes to a terminal or into
                            another program.
                        </Term>{" "}
                        A terminal receives annotated output; a pipe switches to raw mode,
                        printing values only.
                    </p>

                    <Callout severity="danger" label="danger · terminal detection">
                        <p>
                            A value verified by hand as <Code>&quot;42&quot;</Code> arrives
                            as <Code>42</Code> once the command is piped. Scripts must pass{" "}
                            <Code>--raw</Code> explicitly rather than depend on terminal
                            detection, which changes behaviour according to how the command
                            is invoked.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="case sensitivity">
                    <CodeBlock code={CASE} lang="bash" />
                    <p>
                        <Term>
                            Command names are case-insensitive; keys are case-sensitive.
                        </Term>{" "}
                        <Code>name</Code> and <Code>Name</Code> are distinct keys and
                        coexist without warning.
                    </p>
                    <p>
                        <Code>DEL</Code> returns the number of keys removed, which doubles
                        as an existence check.
                    </p>

                    <Callout severity="danger" label="danger · key case mismatch">
                        <p>
                            Redis enforces no schema. A service writing{" "}
                            <Code>User:1</Code> and a service reading <Code>user:1</Code>{" "}
                            both succeed while the data is never found — the read simply
                            returns <Code>(nil)</Code>. Uppercase commands, lowercase keys
                            is followed across the ecosystem precisely because nothing
                            enforces it.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="command signatures">
                    <CodeBlock code={SIGNATURE} lang="bash" />
                    <p>
                        <Term>The notation is universal across Redis documentation.</Term>{" "}
                        <Code>key value</Code> are required arguments in order, square
                        brackets mark optional arguments, and a pipe marks mutually
                        exclusive choices.
                    </p>
                    <p>
                        <Term>
                            <Code>HELP</Code> additionally reports the command group.
                        </Term>{" "}
                        The group names the data type the command operates on: string,
                        hash, list, set, sorted-set, generic. That grouping is the
                        structure of the data-type chapter — a key known to hold a hash has
                        commands beginning with <Code>H</Code>.
                    </p>

                    <Callout severity="next" label="covered later · strings &amp; counters">
                        <p>
                            The <Code>SET</Code> modifiers shown here are covered in
                            Strings &amp; Counters.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — numbered keyspaces and what they aren't ---------- */}
            <PartHeading kicker="part 2">Databases</PartHeading>
            <div>
                <DocSection title="SELECT">
                    <CodeBlock code={SELECT} lang="bash" />
                    <p>
                        <Term>
                            A single instance provides 16 independent keyspaces numbered 0
                            to 15.
                        </Term>{" "}
                        They exist from startup and are never created —{" "}
                        <Code>SELECT</Code> only points the current connection at one.
                    </p>
                    <p>
                        <Term>Database 0 is the default for every client</Term>, which is
                        why an application and a <Code>redis-cli</Code> session see the
                        same keys unless one of them calls <Code>SELECT</Code>.
                    </p>
                    <p>
                        Numbering starts at 0, so <Code>SELECT 1</Code> selects the second
                        database.
                    </p>
                </DocSection>

                <DocSection title="locating the current database">
                    <CodeBlock code={LOCATE} lang="bash" />
                    <p>
                        <Term>
                            <Code>INFO keyspace</Code> lists only non-empty databases
                        </Term>
                        , reporting every database in use at once.
                    </p>
                    <p>
                        <Term>
                            <Code>CLIENT INFO</Code> reports the current connection
                            specifically
                        </Term>{" "}
                        and is the authoritative answer in scripts, since it does not
                        depend on reading a prompt.
                    </p>

                    <QA
                        q={<>What is the collection of all keys called?</>}
                        a={
                            <>
                                The <Term>keyspace</Term>. Separating data with{" "}
                                <Code>dev:</Code> and <Code>prod:</Code> prefixes is{" "}
                                <Term>namespacing</Term>: “both environments share one
                                keyspace, separated by a prefix.”
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="databases are not isolation">
                    <CodeBlock code={COUNT} lang="bash" />
                    <p>
                        <Term>The count is a startup setting</Term> (
                        <Code>redis-server --databases 32</Code>) and cannot be changed on
                        a running server.
                    </p>
                    <p>
                        <Term>
                            All 16 databases share one process, one thread, one memory limit
                            and one configuration.
                        </Term>{" "}
                        A slow command in database 5 blocks database 0, and memory pressure
                        in one evicts keys from all.
                    </p>
                    <p>
                        <Term>Production separation is achieved with key prefixes</Term> in
                        database 0 — <Code>dev:user:1</Code>, <Code>test:user:1</Code> — or
                        with separate instances on separate ports where genuine isolation
                        is required. Numbered databases remain useful only for throwaway
                        experiments.
                    </p>

                    <Callout severity="danger" label="danger · cluster exposes database 0 only">
                        <p>
                            Redis Cluster exposes database 0 only. Code depending on{" "}
                            <Code>SELECT</Code> cannot be moved to a cluster without
                            rewriting.
                        </p>
                    </Callout>

                    <Callout severity="trap" label="trap · FLUSHALL ignores database boundaries">
                        <p>
                            <Code>FLUSHALL</Code> clears all 16 keyspaces. Only{" "}
                            <Code>FLUSHDB</Code> is scoped to the current database.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
