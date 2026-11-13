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
//
// THIS PAGE IS WRITTEN IN PARTS. Part 1 is below; the caching part follows in
// its own prompt. Each part is a block of entries here, a block of sections in
// the component, and one group in the rail — so adding the next one touches
// three places and nothing else.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Cross-origin requests) ---
    // inline `trap · a CORS block looks like a network failure`
    "reading-the-error": ["trap"],
    // "why-the-rule-exists" and "origins-browser-and-server" carry no callout,
    // so they have no entry.
    // inline `danger · XSS bypasses all of it`
    "cookies-across-origins": ["danger"],
    // inline `trap · calling a service from the page shares user data`
    "wildcards-and-private-data": ["trap"],
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

// PAGE RULES — those of the network-panel page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details.
// 3. Every fragment declares its language: ts, or text for a header, an error
//    message or a diagram.
// 4. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 5. Nothing on this page is Vue-version specific, so it carries no
//    "vue 2 → 3" callout.

// ===================================================================
// part 1 — cross-origin requests
// ===================================================================

const CORS_ERROR = `Access to fetch at 'https://api.example.com/users' from origin
'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.`;

const SET_COOKIE = `set-cookie: session=abc123        ← stored for bank.com`;

const CROSS_SITE_READ = `evil.com's JS  ──request──▶  bank.com
               cookie: session=abc123
                        ◀──200 { "balance": 48210, "iban": "…" }`;

const ORIGIN_SPLIT = `browser                                     server
  ├─ knows the page's origin
  ├─ adds  Origin: http://localhost:5173  ─▶
  │                                          decides: is that origin allowed?
  │                      ◀─ access-control-allow-origin: *
  └─ compares, then allows or blocks the read`;

const CREDENTIALS_INCLUDE = `fetch(url, { credentials: 'include' }) // cross-origin: send cookies`;

const WILDCARD = `access-control-allow-origin: *`;

export function CorsAndCachingDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A cross-origin request is sent, answered, and then withheld:
                    the browser refuses to hand the response to the page&apos;s
                    JavaScript unless the responding server allows that origin.
                </p>
                <p>
                    This part covers the error, the rule behind it, what an origin
                    is, how cookies travel cross-origin, and when a wildcard is the
                    wrong answer.
                </p>
            </div>

            {/* ---------- part 1 — cross-origin requests ---------- */}
            <PartHeading kicker="part 1">Cross-origin requests</PartHeading>
            <div>
                <DocSection title="Reading the error">
                    <p>
                        An application on one origin calls an API on another. The
                        request leaves, the server answers 200, and the calling code
                        still fails.
                    </p>
                    <CodeBlock code={CORS_ERROR} lang="text" />
                    <p>
                        Three details of this message are regularly misread. The
                        request was sent: the server received it and did its work,
                        and the browser withheld the response afterwards.{" "}
                        <Code>fetch</Code> rejects with a <Code>TypeError</Code> and
                        exposes no status, so the calling code cannot tell a CORS
                        block from a failed network — both end up in the same branch
                        (see Fetching Data). And nothing in the client can fix it,
                        because what is missing is a header in the server&apos;s
                        answer.
                    </p>
                    <p>
                        The Network panel still lists the request, often with a{" "}
                        <Code>failed</Code> status, which is how a CORS block is
                        distinguished from an offline failure: the panel shows the
                        exchange and the Console shows the policy message.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · a CORS block looks like a network failure"
                    >
                        <p>
                            In code both appear as a rejected <Code>fetch</Code> with
                            no status. The difference is only visible in the Console
                            and the Network panel.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Why the rule exists">
                    <p>
                        A cookie is attached by destination, not by the page that
                        triggered the request. After signing in at{" "}
                        <Code>bank.com</Code>, every request going to{" "}
                        <Code>bank.com</Code> carries its session cookie, whichever
                        page started it.
                    </p>
                    <CodeBlock code={SET_COOKIE} lang="text" />
                    <p>
                        That asymmetry is what the rule addresses. A script on
                        another site can trigger a request to <Code>bank.com</Code>,
                        and the browser attaches the cookie on the way out.
                    </p>
                    <CodeBlock code={CROSS_SITE_READ} lang="text" />
                    <p>
                        The server sees a valid session and answers correctly; it has
                        no way to know the request originated elsewhere. Without a
                        rule, the calling script would read the response and hold the
                        account data without ever learning the password.
                    </p>
                    <p>
                        The browser cannot stop the server from answering, but it can
                        refuse to pass the answer on: a page may send cross-origin
                        requests, but may only read the response when the responding
                        server names that origin as allowed.
                    </p>
                    <p>
                        The rule covers reads, not side effects. A cross-origin{" "}
                        <Code>POST</Code> that transfers money still arrives and
                        executes — the attacker merely cannot read the result.
                        Preventing that is the job of <Code>SameSite</Code> cookies
                        and CSRF tokens, a different mechanism for a different
                        attack. Cookies are also no longer attached in that scenario
                        by default: browsers treat a cookie without an explicit{" "}
                        <Code>SameSite</Code> as <Code>Lax</Code>, which excludes
                        cross-site <Code>fetch</Code>. CORS remains the broader,
                        older layer, and it still blocks reads where no cookie is
                        involved at all — a service that trusts whoever can reach it,
                        such as an intranet API, a router page or a development server
                        on <Code>localhost</Code>.
                    </p>
                    <GridTable
                        cols="grid-cols-[1fr_max-content]"
                        head={["", "Covered by CORS"]}
                        rows={[
                            ["Another origin reading a response", "yes"],
                            [
                                "Another origin triggering a request",
                                "no — the request still runs",
                            ],
                            [
                                "A side effect caused by that request",
                                "no — SameSite and CSRF tokens",
                            ],
                            [
                                "Server-to-server calls",
                                "no — without a browser there is no enforcement",
                            ],
                            ["Same-origin requests", "no check takes place"],
                        ]}
                    />
                </DocSection>

                <DocSection title="Origins, browser and server">
                    <p>
                        &quot;Cross-origin&quot; is decided by an exact comparison,
                        and the parts that count are easy to get wrong.
                    </p>
                    <p>
                        An origin is a property of a URL: scheme, host and port. The
                        path plays no part.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["From", "To", "Same origin?"]}
                        rows={[
                            [
                                "http://localhost:5173",
                                "http://localhost:5173/api",
                                "yes — the path is irrelevant",
                            ],
                            [
                                "http://localhost:5173",
                                "http://localhost:3000",
                                "no — different port",
                            ],
                            [
                                "https://app.com",
                                "http://app.com",
                                "no — different scheme",
                            ],
                            [
                                "https://app.com",
                                "https://api.app.com",
                                "no — different host",
                            ],
                        ]}
                    />
                    <p>
                        Every cross-origin request therefore involves two origins: the
                        page&apos;s own, which is where its document was loaded from,
                        and the target&apos;s. A page has exactly one origin for its
                        lifetime and may call many targets; an iframe is a separate
                        document with an origin of its own.
                    </p>
                    <p>
                        The responsibilities are split, and knowing the split explains
                        most confusion about where a fix belongs.
                    </p>
                    <CodeBlock code={ORIGIN_SPLIT} lang="text" />
                    <p>
                        The browser sends the <Code>Origin</Code> header, and page
                        scripts cannot set or forge it — it is a forbidden header
                        precisely so the server can rely on it. The server only states
                        a policy; the browser enforces it. Two consequences follow:{" "}
                        <Code>curl</Code> and server-side code ignore CORS entirely,
                        and a CORS fix always ships on the responding server, never in
                        the client.
                    </p>
                </DocSection>

                <DocSection title="Cookies across origins">
                    <p>
                        Whether a cookie reaches an API is decided by rules that do
                        not match the origin rules above, which makes the behaviour
                        surprising in development.
                    </p>
                    <p>
                        A cookie&apos;s scope is domain and path, not origin.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Attribute", "Part of the cookie's scope?"]}
                        rows={[
                            [
                                "Host (example.com)",
                                "yes — plus subdomains when Domain=example.com is set",
                            ],
                            ["Path (Path=/api)", "yes — sent only to /api and below"],
                            [
                                "Port",
                                "no — localhost:5173 and localhost:3000 share cookies",
                            ],
                            [
                                "Scheme",
                                "mostly no — a Secure cookie is only sent over HTTPS",
                            ],
                        ]}
                    />
                    <p>
                        The port row explains a common development setup: a frontend
                        on one port and an API on another are different origins, so
                        CORS applies, yet they share one cookie jar. Two further rules
                        decide whether the cookie actually travels:{" "}
                        <Code>SameSite</Code>, set by the server (<Code>Strict</Code>{" "}
                        never on cross-site requests, <Code>Lax</Code> only on
                        top-level navigations, <Code>None</Code> always but then{" "}
                        <Code>Secure</Code> is required), and credentials, set by the
                        caller — <Code>fetch</Code> sends cookies to the same origin
                        by default and cross-origin only on request.
                    </p>
                    <CodeBlock code={CREDENTIALS_INCLUDE} lang="ts" />
                    <p>
                        What another origin can do with those cookies is narrow. The
                        value is never readable: <Code>document.cookie</Code> only
                        lists the page&apos;s own origin, the <Code>set-cookie</Code>{" "}
                        response header cannot be exposed to scripts, and an{" "}
                        <Code>HttpOnly</Code> cookie is invisible even to the
                        site&apos;s own JavaScript. What another origin can do is
                        cause a request that carries the cookie — the classic confused
                        deputy, where the browser acts on the user&apos;s authority
                        for someone else&apos;s instructions.
                    </p>
                    <GridTable
                        cols="grid-cols-[1fr_max-content]"
                        head={["Another origin can", ""]}
                        rows={[
                            ["Read the cookie value or session id", "no"],
                            ["Read the set-cookie header", "no"],
                            ["Cause a request that carries it", "yes"],
                            [
                                "Read that response",
                                "only if the server allows its origin",
                            ],
                            [
                                "Cause a side effect with it",
                                "yes, unless SameSite or a CSRF token prevents it",
                            ],
                        ]}
                    />

                    <Callout severity="danger" label="danger · XSS bypasses all of it">
                        <p>
                            A script injected into a site&apos;s own page runs with
                            that site&apos;s origin, so no CORS check applies and{" "}
                            <Code>document.cookie</Code> works. <Code>HttpOnly</Code>{" "}
                            is the second line of defence that keeps a session cookie
                            unreadable even then.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Wildcards and private data">
                    <p>
                        The quickest way to make an error disappear is to answer every
                        origin with a wildcard, which is why it is the most frequently
                        copied fix.
                    </p>
                    <CodeBlock code={WILDCARD} lang="text" />
                    <p>
                        A wildcard is correct for data that is public, unauthenticated
                        and read-only — the policy public APIs use. For anything
                        user-specific, the server lists the origins it actually serves.
                    </p>
                    <p>
                        The browser refuses a wildcard together with{" "}
                        <Code>credentials: &apos;include&apos;</Code>, so a
                        cookie-session API cannot be exposed to every origin by that
                        mistake alone. The genuinely exposed services are those
                        authenticated by network position or by IP: an intranet API, an
                        admin page, a development server. While such a server runs, any
                        website the developer visits can call it from their browser, and
                        a wildcard lets that site read the answer.
                    </p>
                    <p>
                        A second confusion is whose policy applies. Reading a
                        third-party service&apos;s response depends on that
                        service&apos;s headers; changing the configuration of one&apos;s
                        own server has no effect on it. Public services such as IP or
                        geolocation lookups already answer with a wildcard, so they can
                        be called from the browser while the application&apos;s own API
                        stays restricted — two servers, two independent policies. When a
                        service sends no such header, the call belongs on the server
                        side, where no enforcement exists; a frontend then calls its own
                        API, same-origin, and that API calls the service.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Suggested fix", "Verdict"]}
                        rows={[
                            [
                                "cors() with no options on an authenticated API",
                                "wrong — pass the list of allowed origins",
                            ],
                            [
                                "A browser extension that disables the check",
                                "never — it only patches one developer's browser while the app stays broken",
                            ],
                            [
                                "A development proxy on the app's own origin",
                                "the correct development fix — the browser sees one origin",
                            ],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · calling a service from the page shares user data"
                    >
                        <p>
                            A browser call to a third-party service sends every
                            user&apos;s IP address to that company, which in the EU is
                            personal data. Calling it from the server instead exposes
                            only the server. A third-party script is a different
                            magnitude again: it runs with the page&apos;s own origin and
                            can read its DOM, storage and non-<Code>HttpOnly</Code>{" "}
                            cookies, where a <Code>fetch</Code> cannot.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
