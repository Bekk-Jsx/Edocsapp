import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note).
// Three flags, three different failure modes: a same-tab write that never
// notifies (stale), an unstable snapshot (infinite loop), and a missing server
// snapshot (SSR crash / mismatch). The idea and the examples themselves are
// mechanism, not hazard. See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 2 (Examples) ---
    // inline `trap · same-tab writes don't notify` callout
    "localstorage-cross-tab-the-same-tab-gap": ["trap"],
    // --- part 3 (Getting it right) ---
    // inline `danger · new object each read = infinite loop` callout
    "stable-snapshot": ["danger"],
    // inline `react ⇄ next · getServerSnapshot` callout
    "ssr-snapshot": ["next"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-callback, use-context, use-custom-store, use-effect,
// use-id, use-layout-effect, use-memo and use-reducer define for their own parts.
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
// Part 1 — The idea. The signature IS the concept: three functions,
// one per question React needs answered about foreign state.
// Fragments are wrapped one argument per line throughout: the code
// frame scrolls past ~80 columns, and a hidden third argument is
// exactly the detail these sections exist to show.
// ===================================================================

const SIGNATURE = `const value = useSyncExternalStore(
  subscribe,         // how React listens
  getSnapshot,       // read the current value
  getServerSnapshot, // the value during SSR
);`;

// ===================================================================
// Part 2 — Examples. Both stores are the browser. The first is the
// happy path; the second is the same shape with one hole in it that
// the platform will not tell you about.
// ===================================================================

const ONLINE = `function subscribe(cb) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function getSnapshot() { return navigator.onLine; }

const isOnline = useSyncExternalStore(subscribe, getSnapshot, () => true);`;

const LOCAL_STORAGE = `function subscribe(cb) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function getSnapshot() {
  return localStorage.getItem("theme") ?? "light";
}

// same-tab writes DON'T fire "storage" — notify manually:
function setTheme(v) {
  localStorage.setItem("theme", v);
  window.dispatchEvent(new Event("storage"));
}`;

// ===================================================================
// Part 3 — Getting it right. Why the hook exists at all, then the two
// ways of holding it wrong: an unstable snapshot and a missing server
// snapshot.
// ===================================================================

const OLD_PATTERN = `// old manual pattern — works, but tears under concurrent
// rendering and is awkward for SSR
const [online, setOnline] = useState(navigator.onLine);

useEffect(() => {
  /* add/remove online+offline listeners, setOnline */
}, []);`;

const STABLE_SNAPSHOT = `// ❌ a new object every call -> infinite loop
getSnapshot() { return { online: navigator.onLine }; }

// ✅ a primitive (or a stored reference)
getSnapshot() { return navigator.onLine; }`;

const SSR_SNAPSHOT = `const value = useSyncExternalStore(
  subscribe,
  getSnapshot,
  () => defaultValue, // 3rd arg — the server snapshot
);`;

export function UseSyncExternalStoreDocs() {
    return (
        <>
            <PartHeading kicker="part 1">The idea</PartHeading>
            <div>
                <DocSection title="subscribe to external state">
                    <CodeBlock code={SIGNATURE} lang="tsx" />
                    <p>
                        <Term>
                            It subscribes a component to state that lives OUTSIDE React.
                        </Term>{" "}
                        React only knows about state made inside it —{" "}
                        <Code>useState</Code>, <Code>useReducer</Code>. This hook is the
                        bridge to everything else: <Code>window</Code> and the browser
                        APIs, <Code>localStorage</Code>, a WebSocket, a store library.
                    </p>
                    <p>
                        <Term>Three arguments, three questions.</Term>{" "}
                        <Code>subscribe(callback)</Code> is how React listens — register
                        the callback, return an unsubscribe.{" "}
                        <Code>getSnapshot()</Code> reads the current value.{" "}
                        <Code>getServerSnapshot()</Code> is the value during SSR.
                    </p>
                    <p>
                        <Term>The store itself is not React&apos;s problem.</Term> Any
                        source that can notify and be read will do. The Custom Store page
                        under State Libraries builds one end to end and plugs it in here.
                    </p>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">Examples</PartHeading>
            <div>
                <DocSection title="window — online status">
                    <CodeBlock code={ONLINE} lang="tsx" />
                    <p>
                        <Term>Here the store is the BROWSER.</Term>{" "}
                        <Code>subscribe</Code> wires up the <Code>online</Code> and{" "}
                        <Code>offline</Code> events and returns the unsubscribe;{" "}
                        <Code>getSnapshot</Code> reads <Code>navigator.onLine</Code>; the
                        third argument is the SSR fallback.
                    </p>
                    <p>
                        <Term>
                            <Code>cb</Code> does not re-render anything.
                        </Term>{" "}
                        An event fires → the browser calls <Code>cb</Code>, which is
                        React&apos;s trigger → React re-reads <Code>getSnapshot</Code> →
                        if the value changed (<Code>Object.is</Code>) it re-renders,
                        otherwise it bails out. The callback only says
                        &ldquo;re-check&rdquo;.
                    </p>
                    <p>
                        <Term>Cleanup is the returned function.</Term> React calls it on
                        unmount, and again if <Code>subscribe</Code> itself changes
                        identity — which is why <Code>subscribe</Code> is defined at
                        module scope rather than inside the component.
                    </p>
                </DocSection>

                <DocSection
                    title="localStorage — cross-tab & the same-tab gap"
                    sectionSeverity="trap"
                >
                    <CodeBlock code={LOCAL_STORAGE} lang="tsx" />
                    <p>
                        <Term>
                            The store is <Code>localStorage</Code>, and the snapshot is a
                            string.
                        </Term>{" "}
                        A primitive, so the <Code>Object.is</Code> check is stable for
                        free — no cached reference to maintain.
                    </p>
                    <p>
                        <Term>
                            The <Code>storage</Code> event fires ONLY in OTHER tabs.
                        </Term>{" "}
                        Never in the tab that made the change. Cross-tab sync is therefore
                        automatic; a same-tab write leaves this tab blind, and the UI holds
                        the old value.
                    </p>
                    <p>
                        <Term>So dispatch it yourself when THIS tab writes.</Term> Wrap{" "}
                        <Code>setItem</Code> in a setter that also calls{" "}
                        <Code>dispatchEvent</Code>, and route every write through it. Do
                        NOT dispatch for other tabs&apos; changes — the browser already
                        delivers those, and doing both just doubles the work.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · same-tab writes don't notify"
                    >
                        <p>
                            The <Code>storage</Code> event is cross-tab only. When THIS tab
                            calls <Code>setItem</Code>, no storage event fires here, so the
                            UI goes stale — dispatch the event manually after your own
                            writes. Other tabs&apos; changes are delivered automatically;
                            don&apos;t dispatch for those.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 3">Getting it right</PartHeading>
            <div>
                <DocSection title="why not useEffect + useState">
                    <CodeBlock code={OLD_PATTERN} lang="tsx" />
                    <p>
                        <Term>The old way subscribes by hand.</Term> Seed{" "}
                        <Code>useState</Code> from the source, add the listeners in an
                        effect, call the setter on every event. It works, and it has two
                        problems this hook was built to remove.
                    </p>
                    <p>
                        <Term>1 — Tearing.</Term> Under concurrent rendering a render can
                        pause and resume. If the external store changes in between,
                        different components can read DIFFERENT values in the same frame:
                        one inconsistent UI from one paint.{" "}
                        <Code>useSyncExternalStore</Code> reads synchronously and
                        consistently, so every component sees the SAME value per render.
                    </p>
                    <p>
                        <Term>2 — SSR.</Term> Effects never run on the server, and{" "}
                        <Code>useState(navigator.onLine)</Code> touches an API the server
                        does not have. <Code>getServerSnapshot</Code> gives that pass a
                        clean value instead.
                    </p>
                    <p>
                        <Term>You will rarely write it by hand.</Term> Zustand, Redux and
                        Jotai all use it internally — reach for it directly when you are
                        integrating a non-React source yourself.
                    </p>
                </DocSection>

                <DocSection title="stable snapshot" sectionSeverity="danger">
                    <CodeBlock code={STABLE_SNAPSHOT} lang="tsx" />
                    <p>
                        <Term>
                            React calls <Code>getSnapshot</Code> on every render and
                            compares with <Code>Object.is</Code>.
                        </Term>{" "}
                        That comparison is the entire mechanism for deciding whether
                        anything moved.
                    </p>
                    <p>
                        <Term>A fresh object can never pass it.</Term>{" "}
                        <Code>{"{ online: navigator.onLine }"}</Code> is a new reference
                        each call, so it never equals the previous one: re-render →{" "}
                        <Code>getSnapshot</Code> → new object → re-render, forever.
                    </p>
                    <p>
                        <Term>Return a primitive, or a STORED reference.</Term> Keep the
                        object in the store and hand back that same one, producing a new
                        reference only when the underlying data actually changes. Reading
                        must never allocate.
                    </p>

                    <Callout
                        severity="danger"
                        label="danger · new object each read = infinite loop"
                    >
                        <p>
                            <Code>getSnapshot</Code> returning a fresh object every call
                            makes React re-render endlessly. Return a primitive or a stored
                            reference; produce a new reference only when the data changes.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="ssr snapshot" sectionSeverity="next">
                    <CodeBlock code={SSR_SNAPSHOT} lang="tsx" />
                    <p>
                        <Term>
                            On the server the store and the browser APIs do not exist.
                        </Term>{" "}
                        Pass <Code>getServerSnapshot</Code> as the third argument,
                        returning a safe default. Omit it and the server pass either
                        crashes on a missing API or disagrees with the client on hydration.
                    </p>
                    <p>
                        <Term>In the App Router that is not optional.</Term> The component
                        must be <Code>&quot;use client&quot;</Code> — and a client
                        component still gets a server render, which is precisely the pass
                        the server snapshot covers.
                    </p>

                    <Callout severity="next" label="react ⇄ next · getServerSnapshot">
                        <p>
                            In SSR (Next), always pass <Code>getServerSnapshot</Code>{" "}
                            returning a safe default — browser stores don&apos;t exist on
                            the server, and omitting it causes a crash or hydration
                            mismatch.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useSyncExternalStore</Code> is identical to React and
                    client-only — the component calling it needs{" "}
                    <Code>&quot;use client&quot;</Code>. Its SSR argument,{" "}
                    <Code>getServerSnapshot</Code>, exists precisely for frameworks like
                    Next: provide it and the server pass has a value to render instead of
                    reaching for a browser API that isn&apos;t there.
                </p>
                <p>
                    It is also the foundation the state libraries sit on — Zustand, Redux
                    and Jotai all subscribe through it. See the Custom Store page for
                    building the store this hook connects to.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={
                        <>
                            why does this hook exist instead of <Code>useEffect</Code> +{" "}
                            <Code>useState</Code>?
                        </>
                    }
                    a={
                        <>
                            &ldquo;To prevent <Term>tearing</Term> — consistent reads under
                            concurrent rendering — and to be SSR-safe via{" "}
                            <Code>getServerSnapshot</Code>. The manual pattern risks
                            both.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                why must <Code>getSnapshot</Code> be stable?
                            </>
                        }
                        a={
                            <>
                                &ldquo;React compares snapshots by <Code>Object.is</Code>. A
                                fresh object each read looks{" "}
                                <Term>perpetually changed</Term>{" "}
                                and loops forever.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
