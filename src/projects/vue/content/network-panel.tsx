import { DocSection, Code, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > difference > tip > note). It is NOT what flags a
// section header — that is the explicit `sectionSeverity` prop, and no section
// here is wholly one severity, so every callout below is inline only.
// Keys are slug(title) — the id DocSection gives the section.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The request list) ---
    // "columns" and "filters-and-settings" carry no callout, so they have no
    // entry.

    // --- part 2 (Reading one request) ---
    // "headers-payload-and-response" carries no callout either.
    // inline `note · labels move between versions`
    "status-codes-worth-recognising": ["note"],

    // --- part 3 (Timing and conditions) ---
    // "where-the-time-goes" and "throttling-offline-and-canceled-requests"
    // carry no callout.
};

// Top-level divider between the parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in the other vue content files.
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

// The grid table the typescript pages use, copied unchanged.
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
            {head.map((h) => (
                <div key={h} className={`${ruled} text-[var(--text)]`}>
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

// PAGE RULES — those of the fetching-data page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details.
// 3. Every fragment declares its language. This page is a tool description, so
//    it is mostly prose and tables and carries a single fragment.
// 4. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A. Actions
//    are described impersonally, never as instructions to the reader.
// 5. Nothing on this page is Vue-version specific, so it carries no
//    "vue 2 → 3" callout.

// ===================================================================
// part 1 — the request list
// ===================================================================

const FILTER_EXPRESSIONS = `status-code:404
method:POST
larger-than:100k`;

export function NetworkPanelDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A logged response body answers one question about one request.
                    The Network panel answers the others: whether a request was sent
                    twice, how long the server took, how many bytes arrived, whether
                    the answer came from cache, and whether an abort really took
                    effect.
                </p>
                <p>
                    This page covers the request list, the tabs of a single request,
                    the status codes worth recognising, and the timing phases
                    together with throttling and canceled requests.
                </p>
                <p>
                    The panel records only while DevTools is open, so a page has to
                    be reloaded with it open to capture its first requests.
                </p>
            </div>

            {/* ---------- part 1 — the request list ---------- */}
            <PartHeading kicker="part 1">The request list</PartHeading>
            <div>
                <DocSection title="Columns">
                    <p>
                        Logging a parsed body shows only data that was already
                        expected. It cannot show that a request was sent twice, that
                        most of its duration was server time, that the response was
                        far larger than needed, that it came from cache without
                        touching the network, or that an aborted request completed
                        anyway.
                    </p>
                    <p>
                        The Network panel lists every request the page makes, one row
                        each, with the columns that answer those questions.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Column", "What it answers"]}
                        rows={[
                            ["Name", "which endpoint; the full URL on hover"],
                            [
                                "Status",
                                "the HTTP status — the first thing to read",
                            ],
                            [
                                "Type",
                                "fetch or xhr, document, script, stylesheet, img",
                            ],
                            [
                                "Initiator",
                                "which code started the request; clicking it jumps to that line",
                            ],
                            [
                                "Size",
                                "transferred bytes over resource size — compressed versus uncompressed",
                            ],
                            [
                                "Time",
                                "total duration, from sending to the last byte",
                            ],
                            [
                                "Waterfall",
                                "when it happened relative to every other request",
                            ],
                        ]}
                    />
                    <p>
                        Initiator is the column most often overlooked and the one that
                        answers &quot;which code fired this?&quot; — it leads into the
                        application&apos;s own source, and its call stack names the
                        handler behind the call. Two identical rows for one user action
                        are the plainest sign of a duplicated request, usually a
                        watcher that fires twice or a component that mounts twice.
                    </p>
                </DocSection>

                <DocSection title="Filters and settings">
                    <p>
                        A dev server&apos;s own scripts, styles and hot-reload
                        connections bury the handful of requests that matter, and a
                        reload or redirect clears the evidence.
                    </p>
                    <p>Four controls make the list usable.</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Control", "Effect"]}
                        rows={[
                            [
                                "Fetch/XHR filter",
                                "hides the application's own JS, CSS and images — the usual first click",
                            ],
                            [
                                "Filter box",
                                "narrows by URL text, or by a filter expression",
                            ],
                            [
                                "Preserve log",
                                "keeps rows across reloads and navigations",
                            ],
                            [
                                "Disable cache",
                                "forces every request to reach the server while DevTools is open",
                            ],
                        ]}
                    />
                    <p>The filter box also accepts expressions.</p>
                    <CodeBlock code={FILTER_EXPRESSIONS} lang="text" />
                    <p>
                        Preserve log matters whenever the interesting request is
                        followed by a navigation — a login that redirects, or a form
                        that submits — because without it the row disappears with the
                        page. Disable cache is the switch that makes cache behaviour
                        testable, by taking the browser cache out of the picture.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 2 — reading one request ---------- */}
            <PartHeading kicker="part 2">Reading one request</PartHeading>
            <div>
                <DocSection title="Headers, Payload and Response">
                    <p>
                        A rejected request cannot be diagnosed from the calling code,
                        which shows what was intended, not what was sent. A 400 or an
                        empty body needs the actual bytes in both directions.
                    </p>
                    <p>
                        Selecting a row opens tabs that answer different questions.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Tab", "Answers"]}
                        rows={[
                            [
                                "Headers",
                                "the metadata: status, method, content type, caching, auth, cookies",
                            ],
                            [
                                "Payload",
                                "what was sent: the request body and the parsed query string",
                            ],
                            [
                                "Response, Preview",
                                "what came back, raw and formatted",
                            ],
                            ["Timing", "where the time went"],
                        ]}
                    />
                    <p>
                        Headers is split into General (full URL, method, status, remote
                        address), Response Headers (<Code>content-type</Code>,{" "}
                        <Code>cache-control</Code> and <Code>etag</Code>,{" "}
                        <Code>set-cookie</Code>, and the access-control headers covered
                        on CORS &amp; Caching) and Request Headers. The request block
                        answers whether an <Code>Authorization</Code> token was
                        actually attached and whether a JSON request really carried its{" "}
                        <Code>Content-Type</Code> — a token present in the code but
                        missing from the request is a common cause of an unexplained
                        401.
                    </p>
                    <p>
                        Payload is where most 400s explain themselves: the body appears
                        as the server received it, which exposes a <Code>null</Code>{" "}
                        where an id belongs, an object serialised to{" "}
                        <Code>{"{}"}</Code>, or a field spelled in the wrong case. For
                        a GET request the same tab parses the query string into
                        readable key–value pairs.
                    </p>
                    <p>
                        Response shows the unformatted truth and explains a{" "}
                        <Code>SyntaxError</Code> from <Code>json()</Code>: the body is
                        usually an HTML error page from a proxy or a login redirect
                        rather than JSON (see Fetching Data). Preview renders the same
                        data as a tree.
                    </p>
                </DocSection>

                <DocSection title="Status codes worth recognising">
                    <p>
                        The status decides how the client should react, so a handful
                        are worth knowing on sight.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Code", "Meaning", "Typical cause in a frontend"]}
                        rows={[
                            ["200", "OK", "—"],
                            ["201", "Created", "a successful POST"],
                            [
                                "204",
                                "No Content",
                                "a successful DELETE — the body must not be parsed",
                            ],
                            [
                                "304",
                                "Not Modified",
                                "the cached copy is still valid (see CORS & Caching)",
                            ],
                            [
                                "400",
                                "Bad Request",
                                "a malformed body — check the Payload tab",
                            ],
                            [
                                "401",
                                "Unauthorized",
                                "missing or expired token — re-authenticate",
                            ],
                            [
                                "403",
                                "Forbidden",
                                "authenticated but not allowed — never retry",
                            ],
                            ["404", "Not Found", "wrong id or wrong path"],
                            ["409", "Conflict", "a duplicate, or a concurrent edit"],
                            [
                                "415",
                                "Unsupported Media Type",
                                "missing Content-Type: application/json",
                            ],
                            [
                                "422",
                                "Unprocessable Content",
                                "validation failed; the body usually lists the fields",
                            ],
                            [
                                "429",
                                "Too Many Requests",
                                "polling too fast — back off, read retry-after",
                            ],
                            [
                                "500",
                                "Server Error",
                                "not a client bug, but worth offering a retry",
                            ],
                            [
                                "502, 503, 504",
                                "Gateway, Unavailable, Timeout",
                                "infrastructure — retry with backoff",
                            ],
                        ]}
                    />
                    <p>
                        The distinction that matters most is 401 against 403: 401 means
                        the identity is missing or stale and re-authenticating can fix
                        it, while 403 means the identity is known and refused, so an
                        identical retry fails identically.
                    </p>

                    <Callout
                        severity="note"
                        label="note · labels move between versions"
                    >
                        <p>
                            Chrome renames and rearranges parts of the panel between
                            releases — the Payload tab was once part of Headers, and
                            filter names change. The columns, tabs and statuses
                            described here are stable in meaning even when a label
                            differs.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — timing and conditions ---------- */}
            <PartHeading kicker="part 3">Timing and conditions</PartHeading>
            <div>
                <DocSection title="Where the time goes">
                    <p>
                        &quot;The request is slow&quot; is not actionable. The same 2.4
                        seconds can be server work, a large download, or time spent
                        queued behind other requests, and each has a different fix — so
                        guessing optimises the wrong layer.
                    </p>
                    <p>The Timing tab splits one request into phases.</p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["Phase", "What is happening", "What fixes it"]}
                        rows={[
                            [
                                "Queueing, Stalled",
                                "not sent yet: per-host connection limit, lower priority",
                                "fewer requests, batching, HTTP/2",
                            ],
                            [
                                "DNS Lookup",
                                "resolving a hostname",
                                "fewer third-party hosts, preconnect",
                            ],
                            [
                                "Initial connection, SSL",
                                "TCP and TLS handshake",
                                "the same — paid once per host",
                            ],
                            [
                                "Waiting for server response (TTFB)",
                                "the server is working",
                                "backend: query, index, server-side cache",
                            ],
                            [
                                "Content Download",
                                "bytes arriving",
                                "a smaller payload: fewer fields, pagination, compression",
                            ],
                        ]}
                    />
                    <p>
                        The short reading: a long TTFB is a backend problem the
                        frontend cannot fix; a long Content Download is a payload
                        problem that is fixed by asking for less data; a long Queueing
                        phase means too many requests are in flight at once.
                    </p>
                </DocSection>

                <DocSection title="Throttling, offline and canceled requests">
                    <p>
                        On a fast local connection loading states flash for a few
                        milliseconds and error paths are never exercised, so both stay
                        untested until a user on a slow network finds them.
                    </p>
                    <p>
                        The throttling dropdown simulates conditions while DevTools is
                        open.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Setting", "What it reveals"]}
                        rows={[
                            [
                                "Slow 4G",
                                "loading states become visible; layout shifts when data lands; queueing between parallel requests",
                            ],
                            [
                                "Offline",
                                "the error path — fetch rejects with a TypeError, the branch a client reports as a network failure",
                            ],
                        ]}
                    />
                    <p>
                        Throttling applies to the page, not to anything outside the
                        browser, and only while DevTools is open.
                    </p>
                    <p>
                        An aborted request does not vanish from the list: it is marked
                        as canceled. That confirms an abort took effect, and the
                        absence of such a row exposes the opposite bug — a request that
                        completed anyway and overwrote newer data, the stale-response
                        race described on Computed &amp; Watchers. Navigating away
                        cancels in-flight requests the same way, so canceled rows are
                        routine rather than failures.
                    </p>
                    <p>
                        With Disable cache switched off, a repeated request shows the
                        browser cache at work: the Size column reads from disk cache or
                        from memory cache instead of a transferred size, or the status
                        is 304 instead of 200. What produces those answers is the
                        subject of CORS &amp; Caching.
                    </p>
                </DocSection>
            </div>
        </>
    );
}
