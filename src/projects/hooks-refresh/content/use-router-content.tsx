import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// No `next` flags anywhere: this hook has no React counterpart to differ FROM —
// routing isn't a React feature at all, so the whole page is Next-only and a
// react-vs-next marker would be noise. What is left are two real breakages
// (refresh() silently doing nothing to client-fetched data, and the
// next/router import) plus one gotcha (reaching for push where <Link> belongs).
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Navigating from code) ---
    // inline `trap · don't push plain links` callout
    "userouter-vs-link": ["trap"],
    // --- part 2 (refresh() & traps) ---
    // inline `danger · refresh() ignores client state` callout
    "refresh-only-re-runs-server-data": ["danger"],
    // inline `danger · wrong import` callout
    "import-scope-traps": ["danger"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-action-state, use-callback, use-context,
// use-custom-store, use-effect, use-id, use-layout-effect, use-memo,
// use-optimistic, use-reducer and use-sync-external-store define for their own
// parts.
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

// ===================================================================
// Part 1 — Navigating from code. What the router object is, then the
// one decision that actually comes up: this or a <Link>.
// ===================================================================

const WHAT_IT_IS = `"use client";
import { useRouter } from "next/navigation";

const router = useRouter();
router.push("/dashboard");   // navigate from code`;

const VS_LINK = `<Link href="/about">About</Link>                              // ✅ user clicks — prefetched
<button onClick={() => router.push("/about")}>About</button>  // ❌ worse for a plain link

async function onSubmit(){ await save(); router.push("/success"); } // ✅ code-driven`;

// ===================================================================
// Part 2 — refresh() & traps. The mechanism first (a full server +
// client pair), then the two ways it silently doesn't work.
// ===================================================================

const REFRESH = `// app/items/page.tsx — SERVER component
export default async function ItemsPage() {
  const items = await getItems();
  return <ul>{items.map(i => <li key={i.id}>{i.name}<DeleteButton id={i.id}/></li>)}</ul>;
}

// delete-button.tsx — CLIENT
"use client";
import { useRouter } from "next/navigation";

function DeleteButton({ id }) {
  const router = useRouter();
  async function del() {
    await fetch(\`/api/items/\${id}\`, { method: "DELETE" }); // 1. mutate on server
    router.refresh();                                       // 2. re-run server render
  }
  return <button onClick={del}>Delete</button>;
}`;

const CLIENT_DATA = `// ❌ if the list is a CLIENT component (useEffect fetch), refresh() won't update it
// ✅ re-fetch on the client instead:
await fetch(\`/api/items/\${id}\`, { method: "DELETE" });
setItems(await getItems());`;

const IMPORT = `import { useRouter } from "next/navigation"; // ✅  ("next/router" ❌ = old Pages Router)`;

export function UseRouterDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Navigating from code</PartHeading>
            <div>
                <DocSection title="what it is">
                    <CodeBlock code={WHAT_IT_IS} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useRouter</Code> returns the router object for
                            PROGRAMMATIC navigation.
                        </Term>{" "}
                        Changing pages from code, not from a{" "}
                        <Code>&lt;Link&gt;</Code> click.
                    </p>
                    <p>
                        <Term>The methods.</Term> <Code>push(&quot;/path&quot;)</Code>{" "}
                        navigates and adds a history entry;{" "}
                        <Code>replace(&quot;/path&quot;)</Code> navigates but REPLACES
                        the current entry, so there is nothing to go back to.{" "}
                        <Code>back()</Code> and <Code>forward()</Code> move through
                        history, and <Code>refresh()</Code>{" "}re-fetches the current
                        route&apos;s server data.
                    </p>
                    <p>
                        <Term>
                            Import from <Code>&quot;next/navigation&quot;</Code>.
                        </Term>{" "}
                        That is the App Router hook — NOT{" "}
                        <Code>&quot;next/router&quot;</Code>, which is the old Pages
                        Router one. It is client-only, so the component calling it
                        needs <Code>&quot;use client&quot;</Code>.
                    </p>
                    <p>
                        <Term>There is no core-React equivalent.</Term>{" "}Routing is a
                        framework feature, not something React ships. The SPA
                        equivalent is React Router&apos;s <Code>useNavigate</Code> —{" "}
                        <Code>navigate(&quot;/x&quot;)</Code>,{" "}
                        <Code>navigate(&quot;/x&quot;, {"{ replace: true }"})</Code>,{" "}
                        <Code>navigate(-1)</Code> — and it has no{" "}
                        <Code>refresh()</Code>.
                    </p>
                </DocSection>

                <DocSection title="useRouter vs <Link>" sectionSeverity="trap">
                    <CodeBlock code={VS_LINK} lang="tsx" />
                    <p>
                        <Term>
                            Use <Code>&lt;Link&gt;</Code> for anything the user
                            directly clicks.
                        </Term>{" "}
                        It prefetches the route and is accessible by default — a real
                        anchor, so middle-click, open-in-new-tab and screen readers all
                        behave.
                    </p>
                    <p>
                        <Term>
                            Reserve <Code>useRouter</Code> for navigation triggered by
                            LOGIC.
                        </Term>{" "}
                        After a submit or a login, conditionally on some state, from a
                        timer — the cases where there is no link for the user to click
                        in the first place.
                    </p>
                    <p>
                        <Term>
                            A <Code>push</Code> in place of a normal link is strictly
                            worse.
                        </Term>{" "}
                        You lose prefetching, you lose the anchor semantics, and you
                        write more code to get less.
                    </p>

                    <Callout severity="trap" label="trap · don't push plain links">
                        <p>
                            For user-clicked navigation use{" "}
                            <Code>&lt;Link&gt;</Code> (prefetched, accessible). Use{" "}
                            <Code>router.push</Code> only for code-driven navigation —
                            after an action, conditionally, etc.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">refresh() &amp; traps</PartHeading>
            <div>
                <DocSection title="router.refresh() — re-render server data">
                    <CodeBlock code={REFRESH} lang="tsx" />
                    <p>
                        <Term>The problem it solves.</Term> After the{" "}
                        <Code>DELETE</Code> the database is updated, but the UI still
                        shows the old list — that markup was server-rendered earlier and
                        nothing has told the page otherwise.
                    </p>
                    <p>
                        <Term>What the call actually does.</Term> YOU call{" "}
                        <Code>router.refresh()</Code>; Next re-requests the current
                        route, RE-RUNS its Server Components on the server (
                        <Code>getItems</Code> runs again → a new list) and merges the
                        fresh markup into the live page.
                    </p>
                    <p>
                        <Term>It is not a reload.</Term>{" "}The URL doesn&apos;t change and
                        client state is PRESERVED — scroll position, every{" "}
                        <Code>useState</Code>, the focused input. Only what the server
                        produced is replaced.
                    </p>
                    <p>
                        <Term>And it has to be forced.</Term>{" "}Next caches the server
                        render and won&apos;t re-run it on its own;{" "}
                        <Code>refresh()</Code> is what invalidates that cache for the
                        current route.
                    </p>
                    <p>
                        <Term>Two different kinds of re-render.</Term>{" "}
                        <Code>setState</Code> re-runs client code in the browser;{" "}
                        <Code>refresh()</Code> re-runs Server Components on the server.
                        Same word, different machine.
                    </p>
                    <p>
                        <Term>Often paired with <Code>useTransition</Code>.</Term>{" "}
                        <Code>startTransition(() =&gt; router.refresh())</Code> gives
                        you an <Code>isPending</Code> flag to show while the server
                        round-trip is in flight.
                    </p>
                </DocSection>

                <DocSection
                    title="refresh only re-runs server data"
                    sectionSeverity="danger"
                >
                    <CodeBlock code={CLIENT_DATA} lang="tsx" />
                    <p>
                        <Term>
                            <Code>refresh()</Code> only re-runs SERVER work.
                        </Term>{" "}
                        If the data lives in a Client Component — a{" "}
                        <Code>useEffect</Code> fetch into state — the call does nothing
                        to it. The list just stays stale, with no error to point at.
                    </p>
                    <p>
                        <Term>For client-fetched data you do it yourself.</Term>{" "}
                        Re-fetch and <Code>setState</Code> after the mutation, or update
                        optimistically.
                    </p>
                    <p>
                        <Term>The rule.</Term> Server-rendered data →{" "}
                        <Code>router.refresh()</Code>. Client state → re-fetch +{" "}
                        <Code>setState</Code>.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · refresh() ignores client state"
                    >
                        <p>
                            <Code>router.refresh()</Code>{" "}re-runs Server Components
                            only. It will NOT update data fetched in a client
                            component&apos;s <Code>useEffect</Code> — that stays stale.
                            Re-fetch + <Code>setState</Code> (or update optimistically)
                            instead.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="import & scope traps" sectionSeverity="danger">
                    <CodeBlock code={IMPORT} lang="tsx" />
                    <p>
                        <Term>
                            Import from <Code>next/navigation</Code>, not{" "}
                            <Code>next/router</Code>.
                        </Term>{" "}
                        The old Pages Router hook has a different API and breaks in{" "}
                        <Code>app/</Code> — and autocomplete offers both names, so this
                        one fails silently or oddly rather than loudly.
                    </p>
                    <p>
                        <Term>
                            <Code>useRouter</Code> is client-only.
                        </Term>{" "}
                        To navigate FROM the server — after a server action, say — use{" "}
                        <Code>redirect()</Code> from{" "}
                        <Code>&quot;next/navigation&quot;</Code>, not{" "}
                        <Code>useRouter</Code>.
                    </p>

                    <Callout severity="danger" label="danger · wrong import">
                        <p>
                            In the App Router import <Code>useRouter</Code> from{" "}
                            <Code>next/navigation</Code>. <Code>next/router</Code>{" "}is
                            the old Pages Router API and won&apos;t work in{" "}
                            <Code>app/</Code>. For server-side navigation use{" "}
                            <Code>redirect()</Code>, not <Code>useRouter</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    Navigation hooks are NEXT-ONLY — routing isn&apos;t part of core
                    React, so there is no counterpart to compare against here.
                </p>
                <p>
                    The SPA equivalent is React Router&apos;s{" "}
                    <Code>useNavigate</Code>. It covers the same ground —{" "}
                    <Code>navigate(&quot;/x&quot;)</Code>,{" "}
                    <Code>navigate(&quot;/x&quot;, {"{ replace: true }"})</Code>,{" "}
                    <Code>navigate(-1)</Code> — but has no{" "}
                    <Code>router.refresh()</Code>, because there is no server render to
                    re-run.
                </p>
                <p>
                    <Code>useRouter</Code> is client-only (
                    <Code>&quot;use client&quot;</Code>); navigation from the server
                    uses <Code>redirect()</Code>.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            what does <Code>router.refresh()</Code> do?
                        </>
                    }
                    a={
                        <>
                            &ldquo;It re-runs the current route&apos;s{" "}
                            <Term>Server Components on the server</Term>{" "}and merges the
                            fresh markup into the page — without a reload, preserving
                            client state.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                <Code>&lt;Link&gt;</Code> or <Code>useRouter</Code>?
                            </>
                        }
                        a={
                            <>
                                &ldquo;<Code>&lt;Link&gt;</Code> for{" "}
                                <Term>user-clicked</Term>{" "}navigation — it&apos;s
                                prefetched. <Code>useRouter</Code> for{" "}
                                <Term>code-driven</Term>{" "}navigation: after an action,
                                conditionally.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
