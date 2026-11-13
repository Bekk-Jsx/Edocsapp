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
// THIS PAGE IS WRITTEN IN PARTS. Each part is a block of entries here, a block
// of sections in the component, and one group in the rail — so adding another
// one touches three places and nothing else.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Cross-origin requests) ---
    // inline `trap · in code both look identical`
    "the-error": ["trap"],
    // inline `note · no browser, no CORS`
    "what-counts-as-another-origin": ["note"],
    // inline `note · the rule`
    "why-reading-is-blocked": ["note"],
    // inline `note · CORS still matters without cookies`
    "what-cors-does-not-do": ["note"],
    // inline `danger · XSS bypasses all of it`
    "cookies-across-origins": ["danger"],
    // inline `trap · a browser call shares user data`
    "wildcards-and-whose-header-counts": ["trap"],

    // --- part 2 (Preflight) ---
    // inline `note · same origin is never preflighted`
    "when-the-browser-asks-first": ["note"],
    // inline `trap · the server must answer OPTIONS` + `note · the message names the step`
    "the-options-exchange": ["trap", "note"],

    // --- part 3 (Where CORS gets fixed) ---
    // inline `trap · same machine is not same origin` + `trap · a dev proxy can hide
    // a production problem` — one entry, the rail shows one icon per severity
    "a-proxy-in-dev-and-in-production": ["trap"],
    // inline `note · vary: Origin behind a CDN`
    "cors-on-the-server": ["note"],
    // inline `note · what the proxy removes`
    "why-a-proxy-is-not-a-bypass": ["note"],

    // --- part 4 (Caching) ---
    // "two-mechanisms" carries no callout, so it has no entry.
    // inline `trap · no-cache does not mean no caching`
    "the-directives": ["trap"],
    // inline `note · Disable cache while developing`
    "what-this-looks-like-in-an-app": ["note"],
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

// PAGE RULES — readability is the point of this page:
//
// 1. Never more than two consecutive sentences of prose; a table, a list, a
//    code block or a callout breaks every run.
// 2. Every claim arrives next to its artifact — a header line, a diagram, a
//    comparison row. No paragraph runs longer than three rendered lines.
// 3. Tables carry the comparisons, lists carry the sequences, callouts carry
//    the traps.
// 4. PURPOSE FIRST per section: what goes wrong, then the rule, then the detail.
// 5. Every fragment declares its language: ts, or text for a header, an error
//    message or a diagram.
// 6. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 7. Nothing on this page is Vue-version specific, so it carries no
//    "vue 2 → 3" callout.

// ===================================================================
// part 1 — cross-origin requests
// ===================================================================

const CORS_ERROR = `Access to fetch at 'https://api.example.com/users' from origin
'http://localhost:5173' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.`;

const ORIGIN_PARTS = `https :// api.example.com : 443
─────    ───────────────    ───
scheme        host          port`;

const ORIGIN_SPLIT = `browser                                     server
  ├─ knows the page's origin
  ├─ adds  Origin: http://localhost:5173  ─▶
  │                                          decides: is that origin allowed?
  │                      ◀─ access-control-allow-origin: *
  └─ compares, then allows or blocks the read`;

const CROSS_SITE_READ = `evil.com's JS  ──request──▶  bank.com
               cookie: session=abc123
                        ◀──200 { "balance": 48210, "iban": "…" }`;

const CREDENTIALS_INCLUDE = `fetch(url, { credentials: 'include' }) // cross-origin: send cookies`;

const WILDCARD = `access-control-allow-origin: *`;

const CORS_REFLECT = `cors({ origin: true, credentials: true })
// ❌ echoes any Origin and allows cookies:
//    access-control-allow-origin: https://evil.com
//    access-control-allow-credentials: true`;

const CORS_LIST = `cors({ origin: ['https://app.mybank.com'], credentials: true }) // ✅`;

// ===================================================================
// part 2 — preflight
// ===================================================================

const PREFLIGHT_DECISION = `cross-origin?  ── no ──▶  sent, response readable. No CORS at all.
      │ yes
      ▼
simple?  ── yes ──▶  sent, then the response is gated by access-control-allow-origin
      │ no
      ▼
OPTIONS first, then the real request if allowed`;

const OPTIONS_REQUEST = `OPTIONS /posts
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type`;

const OPTIONS_RESPONSE = `access-control-allow-origin: http://localhost:5173
access-control-allow-methods: GET, POST, PUT, DELETE
access-control-allow-headers: content-type, authorization
access-control-max-age: 86400`;

// ===================================================================
// part 3 — where CORS gets fixed
// ===================================================================

const PROXY_PATH = `browser ──▶ localhost:3000/api/users     same origin, no CORS
             (dev server, a Node process)
             ──▶ localhost:8000/users    server-to-server, no browser rules
             ◀── 200 { … }
        ◀── 200 { … }`;

const VITE_PROXY = `// vite.config.ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\\/api/, ''),
    },
  },
}`;

const API_BASE_URL = `const BASE_URL = '/api' // browser → localhost:3000/api/… → same origin`;

const NGINX_PROXY = `location / {
  try_files $uri /index.html;
}

location /api/ {
  proxy_pass http://localhost:8000/;
}`;

const EXPRESS_PROXY = `app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
}))
app.use(express.static('dist'))`;

const CORS_OPTIONS = `cors({
  origin: ['https://ui.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // only with cookie authentication
})`;

const THIRD_PARTY_COOKIE = `set-cookie: session=…; Secure; HttpOnly; SameSite=None`;

// ===================================================================
// part 4 — caching
// ===================================================================

const MAX_AGE = `cache-control: max-age=3600`;

const ETAG = `etag: "a7f3b2"`;

const NO_STORE_FETCH = `fetch(url, { cache: 'no-store' })`;

export function CorsAndCachingDocs() {
    return (
        <>
            {/* Page lead — before the first divider. Two sentences, nothing more. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    A cross-origin request is sent and answered — and then
                    withheld: the browser hands the response to the page only if
                    the responding server allows that origin.
                </p>
                <p>
                    This part covers the error, what counts as another origin, the
                    rule behind the block, what it does not cover, how cookies
                    travel, and when a wildcard is wrong.
                </p>
            </div>

            {/* ---------- part 1 — cross-origin requests ---------- */}
            <PartHeading kicker="part 1">Cross-origin requests</PartHeading>
            <div>
                <DocSection title="The error">
                    <p>
                        A cross-origin call fails in the browser even though the
                        server answered normally.
                    </p>
                    <CodeBlock code={CORS_ERROR} lang="text" />
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            The request was sent — the server received it and did
                            the work.
                        </li>
                        <li>
                            The browser withheld the response; <Code>fetch</Code>{" "}
                            rejects with a <Code>TypeError</Code> and no status.
                        </li>
                        <li>
                            No client-side change can fix it: a header is missing
                            from the server&apos;s answer.
                        </li>
                    </ol>
                    <p>
                        The Network panel still lists the exchange, which is what
                        separates this from an offline failure.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["Symptom", "CORS block", "Offline"]}
                        rows={[
                            ["fetch result", "rejects, TypeError", "rejects, TypeError"],
                            ["Network panel row", "present, often failed", "present, failed"],
                            [
                                "Console message",
                                "names the CORS policy",
                                "names a connection failure",
                            ],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · in code both look identical"
                    >
                        <p>
                            Error handling cannot distinguish a CORS block from a
                            dead network, because neither exposes a status (see
                            Fetching Data). The Console is the only place that says
                            which happened.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="What counts as another origin">
                    <p>
                        An origin is scheme, host and port — the path plays no
                        part.
                    </p>
                    <CodeBlock code={ORIGIN_PARTS} lang="text" />
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["From", "To", "Same origin?"]}
                        rows={[
                            [
                                "http://localhost:5173",
                                "http://localhost:5173/api",
                                "yes — path is irrelevant",
                            ],
                            [
                                "http://localhost:5173",
                                "http://localhost:3000",
                                "no — port differs",
                            ],
                            ["https://app.com", "http://app.com", "no — scheme differs"],
                            [
                                "https://app.com",
                                "https://api.app.com",
                                "no — host differs",
                            ],
                        ]}
                    />
                    <p>
                        Every cross-origin request involves exactly two origins,
                        and the work is split between them.
                    </p>
                    <CodeBlock code={ORIGIN_SPLIT} lang="text" />
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            The browser sends <Code>Origin</Code>; page scripts
                            cannot set or forge it.
                        </li>
                        <li>
                            The server only states a policy; it blocks nothing
                            itself.
                        </li>
                        <li>The browser enforces that policy.</li>
                    </ul>

                    <Callout severity="note" label="note · no browser, no CORS">
                        <p>
                            <Code>curl</Code> and server-side code ignore CORS
                            entirely. A fix therefore always ships on the
                            responding server, never in the client.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Why reading is blocked">
                    <p>
                        Cookies are attached by destination, not by the page that
                        triggered the request.
                    </p>
                    <ol className="list-decimal space-y-1 pl-5">
                        <li>
                            A user signs in at <Code>bank.com</Code>, which answers
                            with <Code>set-cookie: session=abc123</Code>.
                        </li>
                        <li>
                            From then on, every request going to{" "}
                            <Code>bank.com</Code> carries that cookie.
                        </li>
                        <li>
                            The user visits <Code>evil.com</Code>, whose script runs
                            in the same browser.
                        </li>
                        <li>
                            That script calls <Code>bank.com</Code>; the browser
                            attaches the cookie on the way out.
                        </li>
                        <li>
                            The bank sees a valid session and answers correctly.
                        </li>
                    </ol>
                    <CodeBlock code={CROSS_SITE_READ} lang="text" />
                    <p>
                        Without a rule, that script would read the response and
                        hold the account data without ever learning the password.
                    </p>

                    <Callout severity="note" label="note · the rule">
                        <p>
                            A page may send cross-origin requests, but may only
                            read the response when the responding server names its
                            origin as allowed.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="What CORS does not do">
                    <p>
                        The rule covers reads, which leaves three neighbouring
                        problems to other mechanisms.
                    </p>
                    <GridTable
                        cols="grid-cols-[1fr_max-content_max-content]"
                        head={["Situation", "Blocked by CORS?", "Handled by"]}
                        rows={[
                            ["Another origin reads a response", "yes", "CORS"],
                            [
                                "Another origin triggers a request",
                                "no — it still runs",
                                "SameSite cookies",
                            ],
                            [
                                "That request causes a side effect (a transfer, a delete)",
                                "no",
                                "CSRF tokens",
                            ],
                            [
                                "Server-to-server call",
                                "no — no browser involved",
                                "network rules, API keys",
                            ],
                            ["Same-origin request", "no check takes place", "—"],
                        ]}
                    />
                    <p>
                        Browsers now treat a cookie without an explicit{" "}
                        <Code>SameSite</Code> as <Code>Lax</Code>, so the cookie in
                        the previous section is no longer attached to a cross-site{" "}
                        <Code>fetch</Code> by default.
                    </p>

                    <Callout
                        severity="note"
                        label="note · CORS still matters without cookies"
                    >
                        <p>
                            It blocks reads from services that trust whoever can
                            reach them — an intranet API, a router page, a
                            development server on <Code>localhost</Code> — where
                            the network position is the credential.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Cookies across origins">
                    <p>
                        A cookie&apos;s scope is domain and path, which does not
                        match the origin rules above.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Attribute", "Part of the cookie's scope?"]}
                        rows={[
                            [
                                "Host (example.com)",
                                "yes — plus subdomains with Domain=example.com",
                            ],
                            ["Path (Path=/api)", "yes — sent to /api and below only"],
                            [
                                "Port",
                                "no — localhost:5173 and localhost:3000 share cookies",
                            ],
                            [
                                "Scheme",
                                "mostly no — a Secure cookie only travels over HTTPS",
                            ],
                        ]}
                    />
                    <p>
                        The port row explains the usual development setup: a
                        frontend and an API on different ports are different
                        origins with one shared cookie jar.
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            <Code>SameSite</Code>, set by the server:{" "}
                            <Code>Strict</Code> never cross-site, <Code>Lax</Code>{" "}
                            only on top-level navigations, <Code>None</Code> always
                            but then <Code>Secure</Code> is required.
                        </li>
                        <li>
                            <Code>credentials</Code>, set by the caller:{" "}
                            <Code>same-origin</Code> by default, cross-origin only
                            on request.
                        </li>
                    </ul>
                    <CodeBlock code={CREDENTIALS_INCLUDE} lang="ts" />
                    <GridTable
                        cols="grid-cols-[1fr_max-content]"
                        head={["Another origin can", ""]}
                        rows={[
                            ["Read the cookie value or session id", "no"],
                            [
                                "Read the set-cookie header",
                                "no — it cannot be exposed to scripts",
                            ],
                            ["Cause a request that carries the cookie", "yes"],
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
                    <p>
                        The borrowed-authority pattern in that table is the classic
                        confused deputy: the browser acts on the user&apos;s
                        authority for someone else&apos;s instructions.
                    </p>

                    <Callout severity="danger" label="danger · XSS bypasses all of it">
                        <p>
                            A script injected into a site&apos;s own pages runs with
                            that site&apos;s origin, so no CORS check applies and{" "}
                            <Code>document.cookie</Code> works. <Code>HttpOnly</Code>{" "}
                            keeps the session cookie unreadable even then.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Wildcards, and whose header counts">
                    <p>
                        Answering every origin removes the error, which is why it
                        is the most copied fix.
                    </p>
                    <CodeBlock code={WILDCARD} lang="text" />
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            Correct for data that is public, unauthenticated and
                            read-only — the policy of public APIs.
                        </li>
                        <li>
                            Wrong for anything user-specific: list the origins
                            actually served.
                        </li>
                    </ul>
                    <p>
                        A wildcard alone cannot expose a cookie session, because
                        the browser refuses it together with credentials — the
                        dangerous configuration is the one that reflects the origin
                        back.
                    </p>
                    <CodeBlock code={CORS_REFLECT} lang="ts" />
                    <CodeBlock code={CORS_LIST} lang="ts" />
                    <p>
                        Services authenticated by network position are exposed by a
                        wildcard alone: while a development server or an admin page
                        runs, any site the user visits can call it from their
                        browser and read the answer.
                    </p>
                    <p>
                        Whose policy applies is a second common confusion — the
                        responding server&apos;s, never the caller&apos;s.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Goal", "Which server is configured"]}
                        rows={[
                            ["Let your own frontend read your API", "your API"],
                            [
                                "Read a third-party service from the browser",
                                "theirs — it already sends a wildcard, or the call is impossible",
                            ],
                            [
                                "Read a third-party service that sends no header",
                                "none — call it from your server, where no enforcement exists",
                            ],
                        ]}
                    />
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
                                "never — it patches one developer's browser, the app stays broken",
                            ],
                            [
                                "A development proxy on the app's own origin",
                                "correct for development — the browser sees one origin",
                            ],
                        ]}
                    />

                    <Callout
                        severity="trap"
                        label="trap · a browser call shares user data"
                    >
                        <p>
                            Calling a third-party service from the page sends every
                            user&apos;s IP address to that company, which in the EU
                            is personal data; calling it server-side exposes only
                            the server. A third-party script is a larger risk again:
                            it runs with the page&apos;s own origin and can read its
                            DOM, storage and non-<Code>HttpOnly</Code> cookies,
                            where a <Code>fetch</Code> cannot.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — preflight ---------- */}
            <PartHeading kicker="part 2">Preflight</PartHeading>
            <div>
                <DocSection title="When the browser asks first">
                    <p>
                        Some cross-origin calls produce two rows in the Network
                        panel: an <Code>OPTIONS</Code> request to the same URL, then
                        the real one.
                    </p>
                    <p>
                        Requests a plain HTML form could already make are sent
                        directly; anything beyond that is announced in advance,
                        because a <Code>DELETE</Code> that has already run cannot be
                        undone.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Sent directly (simple)", "Preflighted"]}
                        rows={[
                            ["Method", "GET, HEAD, POST", "PUT, PATCH, DELETE, …"],
                            [
                                "Headers",
                                "only basic ones",
                                "any custom header, such as Authorization or X-Api-Key",
                            ],
                            [
                                "Content-Type",
                                "text/plain, multipart/form-data, application/x-www-form-urlencoded",
                                "application/json",
                            ],
                        ]}
                    />
                    <p>
                        Most real API calls therefore are preflighted, because a JSON
                        body and an auth header are both on the right-hand side.
                    </p>
                    <CodeBlock code={PREFLIGHT_DECISION} lang="text" />

                    <Callout
                        severity="note"
                        label="note · same origin is never preflighted"
                    >
                        <p>
                            Method, headers and content type make no difference on
                            the same origin — a same-origin <Code>DELETE</Code> with
                            a JSON body goes straight out.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="The OPTIONS exchange">
                    <p>The browser describes what it intends to do.</p>
                    <CodeBlock code={OPTIONS_REQUEST} lang="text" />
                    <p>The server answers what it permits.</p>
                    <CodeBlock code={OPTIONS_RESPONSE} lang="text" />
                    <p>
                        Only when the answer covers the plan does the real request
                        follow; <Code>access-control-max-age</Code> says for how long
                        the browser may skip the next preflight, which is why the
                        extra row often appears once and then disappears.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · the server must answer OPTIONS"
                    >
                        <p>
                            A backend that routes only <Code>POST /posts</Code>{" "}
                            answers the preflight with <Code>404</Code> or{" "}
                            <Code>405</Code>, and the real request never happens. The{" "}
                            <Code>POST</Code> looks faultless yet never reaches the
                            server, so the <Code>OPTIONS</Code> row&apos;s status is
                            the first thing to check.
                        </p>
                    </Callout>

                    <Callout
                        severity="note"
                        label="note · the message names the step"
                    >
                        <p>
                            &quot;Response to preflight request doesn&apos;t pass
                            access control check&quot; means the{" "}
                            <Code>OPTIONS</Code> failed; &quot;No
                            &apos;Access-Control-Allow-Origin&apos; header is
                            present&quot; means the real response did.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — where CORS gets fixed ---------- */}
            <PartHeading kicker="part 3">Where CORS gets fixed</PartHeading>
            <div>
                <DocSection title="A proxy, in dev and in production">
                    <p>
                        A proxy is a server process, not something in the browser:
                        the browser talks to one origin, and that process forwards
                        the request onward, where no browser rules apply.
                    </p>
                    <CodeBlock code={PROXY_PATH} lang="text" />
                    <p>In development that process is the dev server.</p>
                    <CodeBlock code={VITE_PROXY} lang="ts" />
                    <CodeBlock code={API_BASE_URL} lang="ts" />
                    <p>
                        The backend needs no configuration for this path, because it
                        never sees a browser request.
                    </p>
                    <p>
                        In production that process is gone — a build produces static
                        files, and <Code>vite.config.ts</Code> is neither deployed
                        nor executed — so the forwarding moves to whatever serves
                        those files.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Hosting", "Where the proxy lives"]}
                        rows={[
                            [
                                "nginx, Apache, Caddy",
                                "a location block that proxies /api to the API",
                            ],
                            [
                                "A Node or Express process",
                                "express.static('dist') plus http-proxy-middleware",
                            ],
                            [
                                "Vercel, Netlify, Cloudflare",
                                "rewrites in their configuration",
                            ],
                            ["Next.js", "rewrites() in next.config.js"],
                            [
                                "Plain static hosting (S3, Pages)",
                                "nowhere — the backend must allow the origin",
                            ],
                        ]}
                    />
                    <CodeBlock code={NGINX_PROXY} lang="nginx" />
                    <CodeBlock code={EXPRESS_PROXY} lang="js" />
                    <p>
                        Keeping the path at <Code>/api</Code> in both environments
                        means the application code is identical in development and
                        production.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · same machine is not same origin"
                    >
                        <p>
                            Two ports on one server are still two origins. What
                            removes CORS is a single entry point that forwards, not
                            co-location.
                        </p>
                    </Callout>

                    <Callout
                        severity="trap"
                        label="trap · a dev proxy can hide a production problem"
                    >
                        <p>
                            Developing behind a proxy and deploying to separate
                            origins makes CORS appear for the first time in
                            production. Either proxy in production too, or configure
                            CORS and test against the real origin.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="CORS on the server">
                    <p>
                        When nothing can sit in front — separate domains, static
                        hosting — the responding server lists the origins it serves.
                    </p>
                    <CodeBlock code={CORS_OPTIONS} lang="ts" />
                    <p>
                        Middleware also answers the preflights, which hand-written
                        header code usually forgets.
                    </p>
                    <p>
                        Cookie authentication across two different domains needs the
                        cookie to be third-party, and browsers increasingly refuse
                        those.
                    </p>
                    <CodeBlock code={THIRD_PARTY_COOKIE} lang="text" />
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            Subdomains instead (<Code>app.example.com</Code> and{" "}
                            <Code>api.example.com</Code>) keep the cookie
                            first-party, so <Code>SameSite=Lax</Code> works.
                        </li>
                        <li>
                            A token in an <Code>Authorization</Code> header avoids{" "}
                            <Code>SameSite</Code> entirely, and needs no{" "}
                            <Code>credentials: &apos;include&apos;</Code>.
                        </li>
                    </ul>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Situation", "Simplest correct answer"]}
                        rows={[
                            [
                                "Separate domains, token authentication",
                                "the API lists the frontend's origin",
                            ],
                            [
                                "Separate domains, cookie authentication",
                                "move to subdomains, or put a proxy in front",
                            ],
                            [
                                "Infrastructure can be changed",
                                "one entry point, same origin, no CORS at all",
                            ],
                        ]}
                    />

                    <Callout
                        severity="note"
                        label="note · vary: Origin behind a CDN"
                    >
                        <p>
                            When a cache sits in front of an API that answers
                            different origins, the response must declare{" "}
                            <Code>vary: Origin</Code>, or a response allowed for one
                            origin can be served to another.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Why a proxy is not a bypass">
                    <p>
                        A proxy can only forward what the browser sent it, and the
                        browser attaches cookies by destination.
                    </p>
                    <GridTable
                        cols="grid-cols-[1fr_max-content_max-content]"
                        head={["Browser requests", "Cookies attached", "The API sees"]}
                        rows={[
                            [
                                "localhost:3000/api — the developer's own proxy",
                                "cookies for localhost",
                                "a valid session",
                            ],
                            [
                                "evil.com/api — a hostile proxy",
                                "cookies for evil.com",
                                "no session, so 401",
                            ],
                        ]}
                    />
                    <p>
                        A victim&apos;s <Code>bank.com</Code> cookie never leaves the
                        browser except toward <Code>bank.com</Code>, so a hostile
                        proxy is no better placed than <Code>curl</Code>.
                    </p>

                    <Callout severity="note" label="note · what the proxy removes">
                        <p>
                            A proxy takes the browser out of the path, and the browser
                            is where the user&apos;s identity lives. That is why it
                            also legitimately carries credentials the developer owns,
                            such as a server-side API key.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 4 — caching ---------- */}
            <PartHeading kicker="part 4">Caching</PartHeading>
            <div>
                <DocSection title="Two mechanisms">
                    <p>
                        Caching answers a different question from CORS — not whether
                        a response may be read, but whether the request has to happen
                        at all.
                    </p>
                    <p>
                        Repeating an unchanged download wastes time and bytes; never
                        repeating it serves stale data after a deploy. Two response
                        headers settle both.
                    </p>
                    <CodeBlock code={MAX_AGE} lang="text" />
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            For the next hour the browser answers from its own cache:
                            Size reads <Code>(disk cache)</Code> or{" "}
                            <Code>(memory cache)</Code>, Time is near zero, and the
                            data may be up to an hour old.
                        </li>
                    </ul>
                    <CodeBlock code={ETAG} lang="text" />
                    <ul className="list-disc space-y-1 pl-5">
                        <li>
                            The next request carries{" "}
                            <Code>if-none-match: &quot;a7f3b2&quot;</Code>.
                        </li>
                        <li>
                            Unchanged → <Code>304 Not Modified</Code> with no body;
                            changed → <Code>200</Code> with new content and a new{" "}
                            <Code>etag</Code>.
                        </li>
                    </ul>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Freshness (max-age)", "Validation (etag)"]}
                        rows={[
                            ["Request made", "none", "one, with no body in the answer"],
                            ["Cost", "zero", "a round trip"],
                            ["Staleness risk", "up to max-age", "none"],
                        ]}
                    />
                </DocSection>

                <DocSection title="The directives">
                    <p>
                        All of this is decided by the server; a client can only be
                        stricter.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Directive", "Means"]}
                        rows={[
                            ["max-age=N", "fresh for N seconds, no request"],
                            ["no-cache", "store it, but validate every time"],
                            [
                                "no-store",
                                "never store it — auth responses, personal data",
                            ],
                            [
                                "private",
                                "only the browser may cache it, not a CDN or proxy",
                            ],
                            ["immutable", "never revalidate — for hashed filenames"],
                        ]}
                    />
                    <CodeBlock code={NO_STORE_FETCH} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · no-cache does not mean no caching"
                    >
                        <p>
                            It means the stored copy is validated on every use. The
                            directive that stores nothing is <Code>no-store</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="What this looks like in an app">
                    <p>
                        Three everyday consequences follow from the two mechanisms.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["Case", "Headers", "Result"]}
                        rows={[
                            [
                                "API responses",
                                "no-store or no-cache",
                                "every call reaches the server, because data changes",
                            ],
                            [
                                "Hashed build files (index-a7f3b2.js)",
                                "max-age far in the future, immutable",
                                "downloaded once, never revalidated",
                            ],
                            [
                                "index.html",
                                "no-store or a short max-age",
                                "a deploy is picked up immediately",
                            ],
                        ]}
                    />
                    <p>
                        Because a new build produces new filenames, nothing has to be
                        invalidated — which is what the hashes in a production build
                        are for.
                    </p>

                    <Callout
                        severity="note"
                        label="note · Disable cache while developing"
                    >
                        <p>
                            The Network panel&apos;s <Code>Disable cache</Code>{" "}
                            ignores every rule above while DevTools is open: useful
                            during development, misleading while testing cache
                            behaviour.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
