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
    // --- part 1 (Client) ---
    // inline `danger · default import` callout
    ioredis: ["danger"],
    // inline `danger · a client per request` callout
    "one-connection-not-a-pool": ["danger"],
    // inline `trap · the offline queue` callout
    "connection-options": ["trap"],
    // inline `danger · unhandled error event` callout
    "connection-events": ["danger"],

    // --- part 2 (Writing Data) ---
    // inline `trap · HGETALL on a missing key` callout
    repository: ["trap"],
    // inline `tip · express 5 async errors` callout
    "null-is-a-normal-outcome": ["tip"],
    // inline forward-reference callout to Strings & Counters and Hashes
    "string-or-hash": ["next"],

    // --- part 3 (Observing) ---
    // inline `danger · MONITOR costs throughput` callout
    monitor: ["danger"],

    // --- part 4 (JavaScript Notes) ---
    // reference notes only — nothing here breaks anything
};

// Top-level divider between the four parts of the page — mirrors the groups in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper first-commands and the hooks content files each define
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

const CLIENT = `import { Redis } from "ioredis";

export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});`;

const SINGLETON = `// src/config/redis.ts — imported everywhere, constructed once
export const redis = new Redis({ host: "127.0.0.1", port: 6379 });`;

const CLIENT_LIST = `redis-cli CLIENT LIST
# id=8 addr=127.0.0.1:52134 ... db=0 cmd=hgetall ...
redis-cli INFO clients | head -3
# # Clients
# connected_clients:2`;

const OPTIONS = `export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});`;

const EVENTS = `redis.on("connect", () => console.log("[redis] connected"));
redis.on("error", (err) => console.error("[redis]", err.message));`;

const OUTAGE = `docker stop redis-lab
# [redis] connect ECONNREFUSED 127.0.0.1:6379   (repeating, widening gaps)
curl localhost:3001/api/health
# error response after a short delay — not a hang
docker start redis-lab
# [redis] connected`;

// Not executable — the direction dependencies are allowed to point.
const LAYERS = `// route -> controller -> service -> repository -> redis`;

const KEYS = `export const userKeys = {
  byId: (id: string) => \`user:\${id}\`,
} as const;`;

const REPOSITORY = `import { redis } from "../config/redis.ts";
import { userKeys } from "../keys/user.keys.ts";

export const userRepository = {
  async save(user: User): Promise<void> {
    await redis.hset(userKeys.byId(user.id), serializeUser(user));
  },

  async findById(id: string): Promise<User | null> {
    const hash = await redis.hgetall(userKeys.byId(id));
    return deserializeUser(hash);
  },
};`;

const SERIALIZE = `export const serializeUser = (u: User): Record<string, string> => ({
  id: u.id,
  name: u.name,
  email: u.email,
  createdAt: String(u.createdAt),
});

export const deserializeUser = (h: Record<string, string>): User | null =>
  h.id ? { ...h, createdAt: Number(h.createdAt) } as User : null;`;

const NOT_FOUND = `async get(id: string): Promise<User> {
  const user = await userRepository.findById(id);
  if (!user) throw new NotFoundError(\`user \${id} not found\`);
  return user;
}`;

const TYPE_FAMILIES = `redis-cli TYPE user:8c1d
# hash
redis-cli HGETALL user:8c1d
# 1) "id"    2) "8c1d"
# 3) "name"  4) "Yassin"
redis-cli HGET user:8c1d email
# "y@example.com"
redis-cli GET user:8c1d
# (error) WRONGTYPE Operation against a key holding the wrong kind of value`;

const MONITOR = `redis-cli MONITOR
# OK
# 1753812445.123456 [0 127.0.0.1:52134] "hgetall" "user:8c1d"`;

const MONITOR_HSET = `# POST /api/users produces:
1753812501.334891 [0 127.0.0.1:52134] "hset" "user:8c1d" "id" "8c1d" "name" "Ahmed" "email" "a@example.com" "createdAt" "1753812501330"`;

const LATENCY = `redis-cli --latency
# min: 0, max: 1, avg: 0.11 (1180 samples)`;

const NULLISH = `0 || 6379   // 6379 — any falsy value falls back
0 ?? 6379   // 0    — only null and undefined fall back`;

const OPTIONAL = `user.address?.city   // undefined instead of a TypeError
fn?.()               // called only if fn exists`;

const LOGICAL_ASSIGNMENT = `options.host ??= "127.0.0.1";  // assign when null/undefined
label ||= "untitled";          // assign when falsy
email &&= email.toLowerCase(); // assign when truthy`;

const FALSY = `// falsy: false, 0, -0, 0n, "", null, undefined, NaN
if ([])              // runs — an empty array is truthy
if (members.length)  // correct check for an empty reply`;

const AS_CONST = `const a = { value: 5 };
a.value = 10;        // allowed — const protects the binding, not the contents
a = { value: 10 };   // TypeError

const b = { value: 5 } as const;
b.value = 10;        // compile error only — erased at runtime`;

// Two representations of the same object, compared on the operations that
// separate them. Same grid treatment the useEffect notes use for their
// two-column comparison — a real <table> would be the only one in the codebase.
function RepresentationTable() {
    const cell = "border-b border-[var(--border)] px-3 py-2";
    return (
        <div className="grid grid-cols-[max-content_max-content_1fr_max-content] overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[0.75rem]">
            <div className={`${cell} text-[var(--text)]`}>stored as</div>
            <div className={`${cell} text-[var(--text)]`}>read one field</div>
            <div className={`${cell} text-[var(--text)]`}>update one field</div>
            <div className={`${cell} text-[var(--text)]`}>
                redis can operate on fields
            </div>

            <div className={`${cell} text-[var(--accent)]`}>string of JSON</div>
            <div className={`${cell} text-[var(--muted)]`}>GET, then parse</div>
            <div className={`${cell} text-[var(--muted)]`}>
                GET, parse, modify, stringify, SET
            </div>
            <div className={`${cell} text-[var(--muted)]`}>no</div>

            <div className="px-3 py-2 text-[var(--accent)]">hash</div>
            <div className="px-3 py-2 text-[var(--muted)]">HGET</div>
            <div className="px-3 py-2 text-[var(--muted)]">
                HSET on that field
            </div>
            <div className="px-3 py-2 text-[var(--muted)]">yes</div>
        </div>
    );
}

export function NodePlaygroundDocs() {
    return (
        <>
            {/* ---------- part 1 — connecting, and doing it once ---------- */}
            {/* No eyebrow label: the section title is the heading, and the
                fragment sits directly under it, ahead of the explanation. */}
            <PartHeading kicker="part 1">Client</PartHeading>
            <div>
                <DocSection title="ioredis">
                    <CodeBlock code={CLIENT} lang="ts" />
                    <p>
                        <Term>
                            Redis speaks a text protocol over TCP; a client library
                            handles that exchange.
                        </Term>{" "}
                        <Code>ioredis</Code> exposes every Redis command as a lowercase
                        method taking the same arguments in the same order as the CLI,
                        which is why commands are learned in <Code>redis-cli</Code>{" "}
                        first.
                    </p>
                    <p>
                        Host and port are the defaults and are written explicitly so the
                        file states where it connects.
                    </p>

                    <Callout severity="danger" label="danger · default import">
                        <p>
                            The import must be the <Term>named</Term> export. In ESM the{" "}
                            <Code>ioredis</Code> exports object is the namespace, so{" "}
                            <Code>import Redis from &quot;ioredis&quot;</Code> yields an
                            object rather than a constructor and fails with “This
                            expression is not constructable”.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="one connection, not a pool">
                    <CodeBlock code={SINGLETON} lang="ts" />
                    <p>
                        <Term>
                            Relational databases execute queries in parallel across
                            pooled connections; Redis executes commands on a single
                            thread, one at a time.
                        </Term>{" "}
                        Additional connections add no parallelism. A single connection is
                        also faster, because consecutive commands travel in the same TCP
                        write instead of waiting on each other&apos;s round trip.
                    </p>
                    <p>
                        <Term>Node caches modules.</Term> The first import evaluates the
                        file and every later import receives the same object, so the
                        module-scoped export is the singleton.
                    </p>

                    <Callout severity="danger" label="danger · a client per request">
                        <p>
                            Constructing a client inside a request handler opens a socket
                            per request and never closes it. File descriptors are
                            exhausted, then the server&apos;s <Code>maxclients</Code>{" "}
                            limit (10,000 by default) is reached and Redis refuses all new
                            connections, including monitoring.
                        </p>
                    </Callout>

                    <CodeBlock code={CLIENT_LIST} lang="bash" />
                    <p>
                        <Term>Two clients are expected</Term> — the application and the
                        CLI session. The count must remain constant as requests are
                        served; a number that grows per request identifies a connection
                        leak.
                    </p>
                    <p>
                        Redis records each client&apos;s last command in the{" "}
                        <Code>cmd</Code> field, which identifies the source of unexpected
                        traffic.
                    </p>
                </DocSection>

                <DocSection title="connection options">
                    <CodeBlock code={OPTIONS} lang="ts" />
                    <p>
                        <Term>
                            The defaults suit a demonstration rather than a service.
                        </Term>
                    </p>
                    <p>
                        <Code>lazyConnect</Code> defers the socket to the first command;
                        without it, importing any module that imports this file connects
                        to Redis, which breaks tests and type-only imports.
                    </p>
                    <p>
                        <Code>maxRetriesPerRequest</Code> caps retries for a single
                        command — the default of 20, combined with backoff, makes an HTTP
                        request hang for tens of seconds against a dead server instead of
                        failing.
                    </p>
                    <p>
                        <Code>retryStrategy</Code> returns the delay in milliseconds
                        before each reconnection attempt, here growing 200ms per attempt
                        to a 2000ms ceiling; returning <Code>null</Code> stops
                        reconnection. An uncapped delay leaves a recovered server unused,
                        while no backoff at all means every application instance hammers
                        a restarting server simultaneously.
                    </p>

                    <Callout severity="trap" label="trap · the offline queue">
                        <p>
                            <Code>enableOfflineQueue</Code> defaults to <Code>true</Code>,
                            so commands issued while disconnected are queued and sent on
                            reconnect. Acceptable for a brief blip; for a sustained outage
                            the queue grows in memory and a write intended for 10:00
                            executes minutes later against changed data. Cache reads are
                            usually better served by{" "}
                            <Code>enableOfflineQueue: false</Code> — fail immediately and
                            read the source of truth.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="connection events">
                    <CodeBlock code={EVENTS} lang="ts" />
                    <p>
                        <Term>
                            An <Code>error</Code> event does not mean the client has given
                            up
                        </Term>{" "}
                        — reconnection continues underneath, so the handler logs rather
                        than exits.
                    </p>

                    <Callout severity="danger" label="danger · unhandled error event">
                        <p>
                            The error listener is mandatory. <Code>ioredis</Code> emits{" "}
                            <Code>error</Code> on the client, and an unhandled{" "}
                            <Code>error</Code> event on a Node <Code>EventEmitter</Code>{" "}
                            terminates the process — a single Redis hiccup takes down the
                            entire API.
                        </p>
                    </Callout>

                    <CodeBlock code={OUTAGE} lang="bash" />
                    <p>Recovery requires no application restart.</p>
                </DocSection>
            </div>

            {/* ---------- part 2 — the path from a route to a key ---------- */}
            <PartHeading kicker="part 2">Writing Data</PartHeading>
            <div>
                <DocSection title="layers">
                    <CodeBlock code={LAYERS} lang="ts" />
                    <p>
                        <Term>Dependencies flow in one direction.</Term> The repository is
                        the only layer that imports the client; the service holds
                        decisions; the controller handles HTTP alone.
                    </p>
                    <p>
                        A service that needs <Code>req</Code> or <Code>res</Code>{" "}
                        indicates a leaked boundary.
                    </p>
                </DocSection>

                <DocSection title="key builders">
                    <CodeBlock code={KEYS} lang="ts" />
                    <p>
                        <Term>
                            Every key in the application originates from a builder file.
                        </Term>{" "}
                        Inspecting or renaming a namespace becomes a one-file change
                        instead of a search for template literals across the codebase.
                    </p>
                    <p>
                        <Code>as const</Code>{" "}
                        marks the object read-only to the compiler and preserves each
                        function&apos;s literal type.
                    </p>
                </DocSection>

                <DocSection title="repository">
                    <CodeBlock code={REPOSITORY} lang="ts" />
                    <p>
                        <Term>
                            The <Code>.ts</Code> extension in relative imports is required
                        </Term>
                        , because Node executes the TypeScript directly with no build
                        step.
                    </p>
                    <p>
                        <Code>redis.hset</Code> and <Code>redis.hgetall</Code> are the{" "}
                        <Code>HSET</Code> and <Code>HGETALL</Code> commands with identical
                        arguments.
                    </p>

                    <Callout severity="trap" label="trap · HGETALL on a missing key">
                        <p>
                            <Code>HGETALL</Code> returns an empty object for a missing key,
                            not <Code>null</Code>. The deserializer must detect that and
                            return <Code>null</Code> explicitly.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="serialization">
                    <CodeBlock code={SERIALIZE} lang="ts" />
                    <p>
                        <Term>
                            A Redis hash is a flat map of string to string.
                        </Term>{" "}
                        Numbers, booleans, dates and nesting have no representation, so
                        conversion happens once in the model rather than being reinvented
                        at each call site.
                    </p>
                </DocSection>

                <DocSection title="null is a normal outcome">
                    <CodeBlock code={NOT_FOUND} lang="ts" />
                    <p>
                        <Term>
                            An absent key is <Code>null</Code>, not an exception.
                        </Term>{" "}
                        Interpreting <Code>null</Code> as HTTP 404 is a business decision
                        and belongs in the service; the repository reports only what Redis
                        returned.
                    </p>

                    <Callout severity="tip" label="tip · express 5 async errors">
                        <p>
                            Express 5 forwards rejected promises to the error middleware,
                            so controllers need no <Code>try</Code>/<Code>catch</Code>. In
                            Express 4 the same route hangs unless every handler is wrapped.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="string or hash">
                    <CodeBlock code={TYPE_FAMILIES} lang="bash" />
                    <p>
                        <Term>
                            Every key has exactly one type, fixed when it is created, and
                            each command belongs to a type family
                        </Term>{" "}
                        — <Code>GET</Code> and <Code>SET</Code> for strings,{" "}
                        <Code>H*</Code> for hashes, <Code>L*</Code> for lists,{" "}
                        <Code>S*</Code> for sets, <Code>Z*</Code> for sorted sets. Sending
                        a command to the wrong family is rejected rather than coerced, so{" "}
                        <Code>TYPE</Code> is the first diagnostic step.
                    </p>

                    <RepresentationTable />

                    <p>
                        <Term>JSON in a string is opaque to the server.</Term> A single
                        field change costs a read, a parse and a full rewrite, and the
                        server cannot sort, increment or filter on anything inside it. A
                        hash stores the same object as addressable fields, so one field is
                        read or incremented server-side in a single command.
                    </p>

                    <Callout severity="next" label="covered later · strings &amp; hashes">
                        <p>
                            The trade-offs between the two representations are covered in
                            Strings &amp; Counters and Hashes.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — reading the wire, not the code ---------- */}
            <PartHeading kicker="part 3">Observing</PartHeading>
            <div>
                <DocSection title="MONITOR">
                    <CodeBlock code={MONITOR} lang="bash" />
                    <p>
                        <Term>
                            <Code>MONITOR</Code> streams every command received by the
                            server, from every client.
                        </Term>{" "}
                        Each line carries a microsecond timestamp, the database number in
                        brackets, the client address, the command in lowercase as sent on
                        the wire, and every argument. The database number confirms which
                        keyspace the application is actually using.
                    </p>
                    <p>
                        It is the fastest way to verify that a library sends what the code
                        implies.
                    </p>

                    <CodeBlock code={MONITOR_HSET} lang="bash" />
                    <p>
                        <Term>
                            An object of four properties becomes one <Code>HSET</Code> with
                            eight arguments
                        </Term>{" "}
                        — <Code>ioredis</Code> flattens it. <Code>createdAt</Code> appears
                        quoted, confirming the conversion to a string. On connect,{" "}
                        <Code>ioredis</Code> issues <Code>INFO</Code> unprompted to detect
                        the server version and topology; library traffic of this kind is
                        visible nowhere else.
                    </p>
                    <p>
                        The failures it exposes in practice are a command firing twice per
                        request, a key built with the wrong prefix, dozens of commands
                        where one was expected, and commands landing in database 1 because
                        something called <Code>SELECT</Code>.
                    </p>

                    <Callout severity="danger" label="danger · MONITOR costs throughput">
                        <p>
                            <Code>MONITOR</Code> streams every command from every client
                            and the server pays the formatting and delivery cost on the
                            same single thread that serves traffic — roughly a 50%
                            throughput reduction with one monitor attached. Development
                            only. Production equivalents are <Code>SLOWLOG</Code> and{" "}
                            <Code>CLIENT LIST</Code>.
                        </p>
                    </Callout>

                    <QA
                        q={<>How is watching the command stream described?</>}
                        a={
                            <>
                                “I <Term>tailed MONITOR</Term> while reproducing it.” The
                                client <em>issues</em> commands; the line shows the{" "}
                                <Term>arguments on the wire</Term>. Attaching a monitor{" "}
                                <em>degrades throughput</em>.
                            </>
                        }
                    />
                </DocSection>

                <DocSection title="latency">
                    <CodeBlock code={LATENCY} lang="bash" />
                    <p>
                        <Term>
                            Continuously sampled round-trip time, safe to leave running.
                        </Term>{" "}
                        A rising average points to the server or the network rather than to
                        application code.
                    </p>

                    <QA
                        q={<>How is a persistent client described?</>}
                        a={
                            <>
                                It is <Term>long-lived</Term> or <Term>persistent</Term>.
                                Creating one per request is a{" "}
                                <Term>connection leak</Term>. “The client is a
                                module-scoped singleton, so the connection is long-lived.”
                            </>
                        }
                    />
                </DocSection>
            </div>

            {/* ---------- part 4 — reference notes for the syntax above ---------- */}
            <PartHeading kicker="part 4">JavaScript Notes</PartHeading>
            <div>
                <p className="mt-4 text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                    Syntax used in the fragments above, kept to the minimum needed to read
                    them.
                </p>

                <DocSection title="nullish coalescing">
                    <CodeBlock code={NULLISH} lang="ts" />
                    <p>
                        <Code>??</Code> (ES2020) falls back only on <Code>null</Code> or{" "}
                        <Code>undefined</Code>, which is what configuration requires, since{" "}
                        <Code>0</Code>, <Code>&quot;&quot;</Code> and <Code>false</Code>{" "}
                        are legitimate values. Mixing <Code>??</Code> with <Code>||</Code>{" "}
                        or <Code>&amp;&amp;</Code> without parentheses is a syntax error.
                    </p>
                </DocSection>

                <DocSection title="optional chaining">
                    <CodeBlock code={OPTIONAL} lang="ts" />
                    <p>
                        <Code>?.</Code> (ES2020) short-circuits on <Code>null</Code> or{" "}
                        <Code>undefined</Code> and returns <Code>undefined</Code>. Applies
                        to property access, <Code>obj?.[key]</Code>, and calls. It reacts
                        to nullish values only, not to falsy ones.
                    </p>
                </DocSection>

                <DocSection title="logical assignment">
                    <CodeBlock code={LOGICAL_ASSIGNMENT} lang="ts" />
                    <p>
                        ES2021. <Code>??=</Code> fills in missing configuration without
                        overwriting a deliberate <Code>0</Code> or <Code>&quot;&quot;</Code>
                        . <Code>&amp;&amp;=</Code> transforms an existing value and
                        preserves the original when absent, where <Code>?.</Code> would
                        replace it with <Code>undefined</Code>.
                    </p>
                </DocSection>

                <DocSection title="falsy and nullish">
                    <CodeBlock code={FALSY} lang="ts" />
                    <p>
                        Eight values are falsy; only <Code>null</Code> and{" "}
                        <Code>undefined</Code> are nullish. Redis replies make the
                        distinction practical — an empty array is truthy, and an empty
                        string is a real stored value that a falsy check would confuse with
                        an absent key.
                    </p>
                </DocSection>

                <DocSection title="const and as const">
                    <CodeBlock code={AS_CONST} lang="ts" />
                    <p>
                        <Code>const</Code> fixes which value a name refers to.{" "}
                        <Code>as const</Code> is a TypeScript assertion that marks
                        properties readonly and narrows values to literal types; it does
                        not exist at runtime, where <Code>Object.freeze</Code> is required
                        for an actual guarantee.
                    </p>
                </DocSection>
            </div>
        </>
    );
}
