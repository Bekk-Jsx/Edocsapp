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
    // --- part 1 (Two silent traps) ---
    // "fetch-resolves-on-404" and "typing-the-boundary" carry no callout, so
    // they have no entry.
    // inline `danger · a declared type is not a verified type`
    "json-returns-any": ["danger"],

    // --- part 2 (One request helper) ---
    // "a-typed-helper-with-a-typed-error" carries no callout either.
    // inline `trap · Content-Type is required for a JSON body` + `tip · what a
    // client library adds`
    "endpoint-modules": ["trap", "tip"],

    // --- part 3 (Where the fetch belongs) ---
    // inline `trap · a store cache never shrinks` + `tip · what a data library
    // adds`
    "component-composable-or-store": ["trap", "tip"],
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

// PAGE RULES — those of the pinia-basics page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. Every fragment declares its language: ts, vue or text. Component examples
//    use <script setup lang="ts">.
// 4. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
// 5. Nothing on this page is Vue-version specific, so it carries no
//    "vue 2 → 3" callout.

// ===================================================================
// part 1 — two silent traps
// ===================================================================

const FETCH_404_SILENT = `const res = await fetch('https://api.example.com/users/9999')
const user: User = await res.json()
console.log(user.name) // ❌ undefined — and nothing was thrown`;

const CHECK_OK = `const res = await fetch(url)
if (!res.ok) {
  throw new Error(\`HTTP \${res.status} \${res.statusText}\`)
}`;

const ANY_TRAP = `interface User { id: number; name: string }

declare function json(): Promise<any>

async function annotated() {
  const user: User = await json()   // any → User: assignment allowed, nothing checked
  console.log(user.name)            // ok, typed string
  console.log(user.naem)            // error?
}

async function notAnnotated() {
  const user = await json()         // user: any
  console.log(user.naem)            // error?
  console.log(user.naem.whatever()) // error?
}`;

const TSC_ERROR = `anytrap.ts(8,20): error TS2339: Property 'naem' does not exist on type 'User'.`;

const ZOD_SCHEMA = `import { z } from 'zod'

const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
})
type Post = z.infer<typeof PostSchema>

const post = PostSchema.parse(await res.json()) // throws if the shape is wrong
post.title // genuinely a string`;

const TYPE_GUARD = `function isPost(value: unknown): value is Post {
  return (
    typeof value === 'object' && value !== null &&
    typeof (value as Post).title === 'string'
  )
}

const data: unknown = await res.json()
if (!isPost(data)) throw new Error('Unexpected response shape')
data.title // narrowed to Post`;

// ===================================================================
// part 2 — one request helper
// ===================================================================

const CATCH_ALL_SAME = `try {
  await loadPost(1)
} catch (e) {
  // ❌ offline, 404, 500 or invalid JSON — all look the same here
}`;

const HTTP_HELPER = `// src/api/http.ts
const BASE_URL = 'https://jsonplaceholder.typicode.com'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly body: unknown,
  ) {
    super(\`HTTP \${status} \${statusText}\`)
    this.name = 'HttpError'
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(\`\${BASE_URL}\${path}\`, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    const body = await res.text()
    throw new HttpError(res.status, res.statusText, body)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}`;

const BRANCH_ON_ERROR = `try {
  post.value = await getPost(id)
} catch (e) {
  if (e instanceof HttpError) {
    message.value = e.status === 404 ? 'not found' : \`server said \${e.status}\`
  } else if (e instanceof SyntaxError) {
    message.value = 'response was not JSON'
  } else {
    message.value = 'network problem — retry?'
  }
}`;

const POSTS_MODULE = `// src/api/posts.ts
import { request } from '@/api/http'

export interface Post {
  id: number
  userId: number
  title: string
  body: string
}

export function getPost(id: number, signal?: AbortSignal) {
  return request<Post>(\`/posts/\${id}\`, { signal })
}

export function createPost(input: Omit<Post, 'id'>) {
  return request<Post>('/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}`;

// ===================================================================
// part 3 — where the fetch belongs
// ===================================================================

const COMPOSABLE_CALL = `const userId = computed(() => Number(route.params.id))
const { data: user, loading, error } = useAsyncData(userId, (id, signal) =>
  getUser(id, signal),
)`;

const POSTS_STORE = `export const usePostsStore = defineStore('posts', () => {
  const cache = ref(new Map<number, Post>())
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function load(id: number): Promise<Post | null> {
    const hit = cache.value.get(id)
    if (hit) return hit

    loading.value = true
    error.value = null
    try {
      const post = await getPost(id)
      cache.value.set(id, post)
      return post
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      return null
    } finally {
      loading.value = false
    }
  }

  return { cache, loading, error, load }
})`;

export function FetchingDataDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    <Code>fetch</Code> reports far less than it seems: a 404 is a
                    resolved promise, and a parsed body is typed by whatever the
                    calling code claims. Both failures are silent.
                </p>
                <p>
                    This page covers those two traps, how to type the response
                    boundary, a request helper with a typed error, and the decision of
                    where a fetch call belongs.
                </p>
            </div>

            {/* ---------- part 1 — two silent traps ---------- */}
            <PartHeading kicker="part 1">Two silent traps</PartHeading>
            <div>
                <DocSection title="fetch resolves on 404">
                    <p>
                        Three correct-looking lines fail without any error: the request
                        completes, the body is parsed, and the rendered value is empty.
                    </p>
                    <CodeBlock code={FETCH_404_SILENT} lang="ts" />
                    <p>
                        <Code>fetch</Code> rejects only when the request itself fails. A
                        404 or a 500 is a completed HTTP exchange, so the promise
                        resolves and <Code>try</Code>/<Code>catch</Code> sees nothing.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Situation", "fetch promise"]}
                        rows={[
                            ["200 OK", "resolves"],
                            ["404, 500", "resolves, with res.ok === false"],
                            [
                                "DNS failure, offline, blocked by CORS",
                                "rejects (TypeError)",
                            ],
                        ]}
                    />
                    <p>
                        Check <Code>res.ok</Code> — true for statuses 200 to 299 — and
                        throw explicitly.
                    </p>
                    <CodeBlock code={CHECK_OK} lang="ts" />
                    <p>
                        <Code>res.ok</Code>, <Code>res.status</Code> and{" "}
                        <Code>res.statusText</Code> come from the response head and are
                        available before the body is read. Reading the body with{" "}
                        <Code>json()</Code> can fail separately when the response is not
                        valid JSON — an HTML error page from a proxy is the common case.
                        Three distinct failures therefore exist: network (
                        <Code>fetch</Code> rejects), HTTP status (<Code>res.ok</Code> is
                        false), and parsing (<Code>json()</Code> throws).
                    </p>
                </DocSection>

                <DocSection title="json() returns any">
                    <p>
                        <Code>res.json()</Code> is typed <Code>Promise&lt;any&gt;</Code>,
                        so the type of the parsed data is whatever the calling code
                        declares. The consequences differ depending on whether that
                        declaration exists, and the compiler reports only one of the two
                        cases.
                    </p>
                    <CodeBlock code={ANY_TRAP} lang="ts" />
                    <p>The compiler reports exactly one line:</p>
                    <CodeBlock code={TSC_ERROR} lang="text" />
                    <p>
                        With an annotation, the value really is a <Code>User</Code> for
                        the compiler, so typos downstream are caught — but the assignment
                        itself is not checked, because <Code>any</Code> is assignable to
                        anything. Without an annotation, <Code>any</Code> spreads:
                        nothing about the value is ever checked, and it travels into
                        everything derived from it. An annotation is therefore the lesser
                        evil, and an unverified one is still only a claim.
                    </p>
                    <p>
                        For an error response whose body is <Code>{"{}"}</Code>, that
                        claim produces a type that contradicts the data, and the mismatch
                        only surfaces where the value is finally used.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_max-content_1fr]"
                        head={["", "TypeScript says", "Runtime has"]}
                        rows={[
                            ["post", "Post", "{}"],
                            ["post.title", "string", "undefined"],
                            [
                                "post.title.toUpperCase()",
                                "fine",
                                "TypeError: Cannot read properties of undefined",
                            ],
                        ]}
                    />
                    <p>
                        Nothing fails at the fetch; it fails in a formatter, a comparator
                        or a child component, far from the cause.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr]"
                        head={["Cause of wrong data", "Caught by"]}
                        rows={[
                            ["404 or 500 error body", "the res.ok check"],
                            ["proxy returns an HTML page", "json() throws"],
                            ["the API renamed a field", "nothing but runtime validation"],
                            [
                                "the server returns null or a partial record",
                                "nothing but runtime validation",
                            ],
                        ]}
                    />

                    <Callout
                        severity="danger"
                        label="danger · a declared type is not a verified type"
                    >
                        <p>
                            An annotation or an <Code>as</Code> cast on a parsed response
                            states a shape the compiler never checks. Every piece of code
                            downstream is written against that promise.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Typing the boundary">
                    <p>
                        <Code>as User</Code> and <Code>: User</Code> are the same
                        unchecked claim, so neither is a solution by itself; the
                        annotation is preferred, because <Code>as</Code> can also silence
                        a real mismatch when the source is not <Code>any</Code>. What
                        follows is the ladder from cheapest to safest.
                    </p>
                    <p>
                        Checking the response removes the most common cause and costs
                        nothing. Keeping the claim in one function — the request helper
                        below — adds no safety but puts the risk in a single line that
                        can be hardened later.
                    </p>
                    <p>
                        Runtime validation is the actual fix. A schema library derives
                        the type from the schema, so the two cannot drift apart, and a
                        wrong shape fails at the fetch with a message naming the field.
                    </p>
                    <CodeBlock code={ZOD_SCHEMA} lang="ts" />
                    <p>
                        Without a dependency, <Code>unknown</Code> plus a type guard does
                        the same job by hand.
                    </p>
                    <CodeBlock code={TYPE_GUARD} lang="ts" />
                    <GridTable
                        cols="grid-cols-[1fr_max-content_max-content]"
                        head={["Situation", "A cast is enough", "Validate"]}
                        rows={[
                            [
                                "Own backend, types generated from the API (OpenAPI, tRPC)",
                                "yes",
                                "",
                            ],
                            ["Third-party or public API", "", "yes"],
                            [
                                "Data that is persisted, or drives money or auth",
                                "",
                                "yes",
                            ],
                            ["A field whose absence only renders blank", "yes", ""],
                        ]}
                    />
                </DocSection>
            </div>

            {/* ---------- part 2 — one request helper ---------- */}
            <PartHeading kicker="part 2">One request helper</PartHeading>
            <div>
                <DocSection title="A typed helper with a typed error">
                    <p>
                        The response check, the base URL, the parse and the claim have to
                        be repeated at every call site. Worse, every failure arrives as
                        an indistinguishable <Code>Error</Code>, while the reactions
                        differ: a 401 means redirecting to login, a 404 means showing a
                        not-found state, a 500 or a network failure means offering a
                        retry.
                    </p>
                    <CodeBlock code={CATCH_ALL_SAME} lang="ts" />
                    <p>
                        One function owns the protocol, and an error class carries the
                        status.
                    </p>
                    <CodeBlock code={HTTP_HELPER} lang="ts" />
                    <p>
                        The generic parameter is where the claim from the previous part
                        lives — once, for the whole app. <Code>HttpError</Code> extends{" "}
                        <Code>Error</Code>, so ordinary <Code>catch</Code> blocks work,
                        and adds <Code>status</Code> and <Code>body</Code> for branching
                        with <Code>instanceof</Code>. The three failure kinds stay
                        distinguishable: a network failure remains a{" "}
                        <Code>TypeError</Code>, a bad status becomes an{" "}
                        <Code>HttpError</Code>, and invalid JSON remains a{" "}
                        <Code>SyntaxError</Code>. A 204 No Content has no body, so
                        parsing it would throw — <Code>DELETE</Code> endpoints hit this
                        constantly. Passing <Code>options</Code> through keeps{" "}
                        <Code>method</Code>, <Code>body</Code> and <Code>signal</Code>{" "}
                        available, including the <Code>AbortController</Code> from an
                        async composable (see Async Composables).
                    </p>
                    <p>Callers branch on the error type.</p>
                    <CodeBlock code={BRANCH_ON_ERROR} lang="ts" />
                </DocSection>

                <DocSection title="Endpoint modules">
                    <p>
                        Components that build paths and set headers spread API knowledge
                        across the UI; a changed route or header has to be found in every
                        view.
                    </p>
                    <p>
                        One module per resource exports typed functions, and components
                        import those.
                    </p>
                    <CodeBlock code={POSTS_MODULE} lang="ts" />
                    <p>
                        A component now imports <Code>getPost</Code> and knows nothing
                        about URLs, headers or status codes.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · Content-Type is required for a JSON body"
                    >
                        <p>
                            Without it many servers do not parse the body and answer 415.{" "}
                            <Code>Accept</Code> declares what the response should be;{" "}
                            <Code>Content-Type</Code> declares what the request contains.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · what a client library adds">
                        <p>
                            <Code>axios</Code> provides the base URL, JSON handling and{" "}
                            <Code>isAxiosError</Code> out of the box, plus request and
                            response interceptors — the usual place for attaching and
                            refreshing auth tokens. Writing the helper once makes clear
                            what such a library does; either approach is fine, but not
                            both in one project.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 3 — where the fetch belongs ---------- */}
            <PartHeading kicker="part 3">Where the fetch belongs</PartHeading>
            <div>
                <DocSection title="Component, composable or store">
                    <p>
                        The same call can live in a component, a composable or a store,
                        and the choice decides behavior: a component refetches on every
                        visit and drops the data when it unmounts, while a store fetches
                        once, shares the result and keeps it for the session. The wrong
                        choice produces either needless requests on every tab switch or
                        global state that fills with data nobody needs.
                    </p>
                    <GridTable
                        cols="grid-cols-[1fr_max-content]"
                        head={["Question", "Answer leads to"]}
                        rows={[
                            ["Does more than one view need this data?", "a store"],
                            ["Must it survive leaving the view?", "a store"],
                            [
                                "Is it one view's detail data, keyed by a route param?",
                                "the component, through a composable",
                            ],
                            [
                                "Is the fetching pattern itself repeated (loading, error, abort)?",
                                "a composable, used by either",
                            ],
                        ]}
                    />
                    <p>
                        The default is a component with a composable; a store is for data
                        that is genuinely shared or must be cached.
                    </p>
                    <CodeBlock code={COMPOSABLE_CALL} lang="ts" />
                    <p>
                        A store owns the data together with its loading state, and can
                        skip the request entirely when the value is already there.
                    </p>
                    <CodeBlock code={POSTS_STORE} lang="ts" />
                    <p>
                        Data fetched in a router guard is a third option that is rarely
                        right: the guard delays the navigation with no interface to show
                        for it, while a view that renders its own loading state feels
                        faster.
                    </p>

                    <Callout severity="trap" label="trap · a store cache never shrinks">
                        <p>
                            Store data lives for the whole session. That suits a fixed
                            list such as countries; for every record a user happens to
                            open, component-owned state is better, because unmounting
                            releases it.
                        </p>
                    </Callout>

                    <Callout severity="tip" label="tip · what a data library adds">
                        <p>
                            TanStack Query (<Code>@tanstack/vue-query</Code>) and{" "}
                            <Code>useFetch</Code> from Nuxt or VueUse are this third
                            option done thoroughly: cache keys, deduplicated parallel
                            requests, stale-while-revalidate, retries and invalidation
                            after a mutation. A hand-written composable plus a store cache
                            covers the basics and marks the point where one of those is
                            worth installing.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
