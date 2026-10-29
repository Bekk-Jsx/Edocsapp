import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
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
    // --- part 1 (computed()) ---
    // "computed-outside-components" carries no callout, so no entry.

    // --- part 2 (The watch option) ---
    // inline `vue 2 → 3 · watching arrays`
    "watching-arrays": ["difference"],

    // --- part 3 (The watch() function) ---
    // "watch-outside-components" carries no callout, so no entry.
    // inline `trap · watch a getter, not a property value`
    "watch-sources": ["trap"],
    // "stopping-a-watcher" and "options-or-functions" carry no callout, so no
    // entry.

    // --- part 4 (deep, immediate and once) ---
    // inline `note · reactive sources are deep already`
    deep: ["note"],
    // inline `trap · no old value on the first run`
    immediate: ["trap"],
    // inline `vue 2 → 3 · once is new`
    once: ["difference"],

    // --- part 5 (watchEffect) ---
    // inline `vue 2 → 3 · new api`
    watcheffect: ["difference"],
    // inline `trap · only reads before the first await are tracked`
    "async-effects": ["trap"],
    // inline `note · an empty array never fires`
    "watch-or-watcheffect": ["note"],

    // --- part 6 (Cleanup) ---
    // inline `trap · register before the first await` + `vue 2 → 3 · cleanup is new`
    "watcher-cleanup": ["trap", "difference"],
    // inline `tip · fetch and axios accept the signal`
    "cancelling-stale-requests": ["tip"],
};

// Top-level divider between the six parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in the typescript content files.
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

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. ERROR HOUSE STYLE: a compiler error is a comment on the line BELOW the
//    offending code, prefixed `// ❌ `.
// 4. Every fragment declares its language: ts, js or text.
// 5. Differences are inline Callouts with severity "difference" and the label
//    prefix "vue 2 → 3 · …".
// 6. A comparison shows both codes side by side in the container-query pair
//    grid, and each column opens with a one-line <Term> label.
// 7. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — computed()
// ===================================================================

const DUPLICATED_COMPUTED = `// SessionBadge.vue
computed: {
  name(): string {
    return session.user?.name ?? 'guest'
  },
},
// the same computed again in every other component`;

const DISPLAY_NAME = `import { computed } from 'vue'

export const displayName = computed(() => session.user?.name ?? 'guest')`;

const READ_DISPLAY_NAME = `computed: {
  name(): string {
    return displayName.value
  },
},`;

const ASSIGN_COMPUTED = `displayName.value = 'Bob'
// ❌ Cannot assign to 'value' because it is a read-only property`;

// ===================================================================
// part 2 — the watch option
// ===================================================================

const ARRAY_WATCH = `data() {
  return { items: [] as string[] }
},
watch: {
  items(newItems: string[]) {
    console.log('items changed', newItems.length)
  },
},
methods: {
  add() {
    this.items.push('x')
    // ❌ the array changed, but the watcher never fires
  },
},`;

const ARRAY_WATCH_DEEP = `watch: {
  items: {
    handler(newItems: string[]) {
      console.log('items changed', newItems.length)
    },
    deep: true,
  },
},`;

// ===================================================================
// part 3 — the watch() function
// ===================================================================

const WATCH_FUNCTION = `import { watch } from 'vue'

watch(
  () => session.user,
  (user, previous) => {
    localStorage.setItem('user', JSON.stringify(user))
  },
)`;

const WATCH_PROPERTY_VALUE = `watch(session.user, (user) => { /* … */ })
// ❌ passes the current value (User | null), not a source`;

const WATCH_GETTER = `watch(() => session.user, (user) => { /* … */ })`;

const STOP_WATCHER = `const stop = watch(loginCount, (n) => console.log(n))
stop() // no more callbacks`;

// ===================================================================
// part 4 — deep, immediate and once
// ===================================================================

const GETTER_NOT_DEEP = `watch(
  () => session.user,
  (user) => save(user),
)

session.user!.name = 'Bob'
// ❌ same object — the watcher does not fire`;

const GETTER_DEEP = `watch(
  () => session.user,
  (user) => save(user),
  { deep: true },
)`;

const WATCH_IMMEDIATE = `watch(
  () => session.user,
  (user, previous) => {
    document.title = user ? \`Hi \${user.name}\` : 'App'
  },
  { immediate: true },
)`;

const WATCH_ONCE = `watch(loginCount, () => showWelcomeTip(), { once: true })`;

// ===================================================================
// part 5 — watchEffect
// ===================================================================

const WATCH_MISSES_READS = `watch(
  () => session.user,
  () => {
    document.title = \`\${displayName.value} · \${loginCount.value} logins\`
  },
)

export function resetCount(): void {
  loginCount.value = 0
  // ❌ session.user did not change — the title keeps the old count
}`;

const WATCH_EFFECT = `import { watchEffect } from 'vue'

watchEffect(() => {
  document.title = \`\${displayName.value} · \${loginCount.value} logins\`
})`;

const WATCH_EFFECT_ASYNC = `watchEffect(async () => {
  const res = await fetch(\`/api/users/\${userId.value}\`) // ✅ tracked
  const data = await res.json()
  console.log(filter.value) // ❌ read after await — not tracked
})`;

const EFFECT_FORM = `watchEffect(() => {
  document.title = \`\${displayName.value} · \${loginCount.value}\`
})`;

const EQUIVALENT_WATCH = `watch(
  [displayName, loginCount],
  () => {
    document.title = \`\${displayName.value} · \${loginCount.value}\`
  },
  { immediate: true },
)`;

// ===================================================================
// part 6 — cleanup
// ===================================================================

const CLEANUP_TIMER = `watch(userId, (id, _old, onCleanup) => {
  const timer = setTimeout(() => {
    console.log('show user', id)
  }, 2000)

  onCleanup(() => {
    clearTimeout(timer)
    console.log('cancel timer for', id)
  })
})`;

const CLEANUP_SEQUENCE = `userId = 1 → run 1 starts a timer for 1
userId = 2 → Vue calls run 1's cleanup → "cancel timer for 1"
           → run 2 starts a timer for 2
2s later   → "show user 2"`;

const STALE_RACE = `select 1 → request 1 starts (slow)
select 2 → request 2 starts (fast)
         request 2 done → shows user 2
         request 1 done → shows user 1   ❌ but 2 is selected`;

const ABORT_DEMO = `const controller = new AbortController()

const request = fetch('https://jsonplaceholder.typicode.com/users/1', {
  signal: controller.signal,
})

controller.abort()

try {
  await request
} catch (err) {
  console.log(err.name, '-', err.message)
}
console.log('signal.aborted =', controller.signal.aborted)`;

const ABORT_OUTPUT = `AbortError - This operation was aborted
signal.aborted = true`;

const ABORT_IN_WATCH = `watch(userId, async (id, _old, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  user.value = await fetchUser(id, controller.signal)
})`;

const ABORT_IN_OPTION = `watch: {
  async userId(id: number, _old: number, onCleanup: (fn: () => void) => void) {
    const controller = new AbortController()
    onCleanup(() => controller.abort())

    try {
      this.user = await fetchUser(id, controller.signal)
    } catch {
      // aborted: a newer request replaced this one
    }
  },
},`;

// Column grid for a side-by-side comparison (rule 6) — the same plain utility
// strings the typescript pages use, so they all split at the same width.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

export function ComputedAndWatchersDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Components declare derived values and reactions with the{" "}
                    <Code>computed</Code> and <Code>watch</Code> options. The{" "}
                    <Code>computed()</Code>, <Code>watch()</Code> and{" "}
                    <Code>watchEffect()</Code> functions provide{" "}
                    <Term>the same features anywhere</Term> — in modules, stores,
                    setup code and composables.
                </p>
                <p>
                    This page covers derived state, watching sources, the watcher
                    options, <Code>watchEffect</Code>, and cleanup for async work.
                    Examples use a shared session module with a reactive{" "}
                    <Code>session</Code>, a <Code>loginCount</Code> ref and a{" "}
                    <Code>User</Code> type (
                    <Code>{"{ id: number; name: string }"}</Code>).
                </p>
            </div>

            {/* ---------- part 1 — computed() ---------- */}
            <PartHeading kicker="part 1">computed()</PartHeading>
            <div>
                <DocSection title="computed() outside components">
                    <p>
                        Values derived from shared state, such as a display name, end
                        up rewritten as a <Code>computed</Code> option in every
                        component that needs them. The logic is duplicated and the
                        copies can drift apart:
                    </p>
                    <CodeBlock code={DUPLICATED_COMPUTED} lang="ts" />
                    <p>
                        The <Code>computed()</Code> function defines the derived value
                        once, next to the state. It returns a readonly ref:
                    </p>
                    <CodeBlock code={DISPLAY_NAME} lang="ts" />
                    <p>
                        Components read it through <Code>.value</Code>, for example
                        from a <Code>computed</Code> option:
                    </p>
                    <CodeBlock code={READ_DISPLAY_NAME} lang="ts" />
                    <p>
                        Like the <Code>computed</Code> option, it is{" "}
                        <Term>cached</Term> — the getter re-runs only when a value it
                        read changes, so repeated reads return the stored result — and{" "}
                        <Term>lazy</Term> — the getter does not run until{" "}
                        <Code>.value</Code> is read.
                    </p>
                    <p>
                        The type is inferred from the return value (
                        <Code>{"ComputedRef<string>"}</Code>); a wider type is passed
                        as a generic, <Code>{"computed<User | null>(() => …)"}</Code>.
                        Assigning to it is a compile error:
                    </p>
                    <CodeBlock code={ASSIGN_COMPUTED} lang="ts" />
                </DocSection>
            </div>

            {/* ---------- part 2 — the watch option ---------- */}
            <PartHeading kicker="part 2">The watch option</PartHeading>
            <div>
                <DocSection title="Watching arrays">
                    <p>
                        A watcher on an array in <Code>data()</Code> no longer fires
                        when the array is mutated with <Code>push</Code>,{" "}
                        <Code>splice</Code> or an index write. Code migrated from Vue 2
                        stops working without an error or warning:
                    </p>
                    <CodeBlock code={ARRAY_WATCH} lang="ts" />
                    <p>
                        <Code>deep: true</Code> makes the watcher react to mutations:
                    </p>
                    <CodeBlock code={ARRAY_WATCH_DEEP} lang="ts" />
                    <p>
                        Without <Code>deep</Code>, a watcher fires only when the
                        watched value itself is replaced (
                        <Code>{"this.items = [...this.items, 'x']"}</Code>).{" "}
                        <Code>push</Code> changes the contents of the same array. Vue 2
                        patched array methods to notify watchers, which is why
                        mutations used to fire.
                    </p>

                    <Callout severity="difference" label="vue 2 → 3 · watching arrays">
                        <p>
                            A watcher on an array fires only on replacement. Add{" "}
                            <Code>deep: true</Code> to react to mutations. Replacing
                            the array fires in both versions.
                        </p>
                    </Callout>

                    <p>
                        Everything else about the option is unchanged: string method
                        names (<Code>{"items: 'onItemsChange'"}</Code>), dotted paths (
                        <Code>{"'user.name'"}</Code>), <Code>immediate</Code> and{" "}
                        <Code>this.$watch()</Code>.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 3 — the watch() function ---------- */}
            <PartHeading kicker="part 3">The watch() function</PartHeading>
            <div>
                <DocSection title="watch() outside components">
                    <p>
                        The <Code>watch</Code> option exists only inside a component.
                        Reactions that belong to shared state, such as saving the
                        session user to <Code>localStorage</Code> on every change, run
                        only while that component is mounted — and twice if two
                        components do it.
                    </p>
                    <p>
                        The <Code>watch()</Code> function works in any module. The
                        callback receives the new and old values, typed from the
                        source:
                    </p>
                    <CodeBlock code={WATCH_FUNCTION} lang="ts" />
                </DocSection>

                <DocSection title="Watch sources">
                    <p>
                        The first argument is the source — something Vue can track.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["Source", "Example", "Fires when"]}
                        rows={[
                            ["ref", "watch(loginCount, …)", ".value changes"],
                            [
                                "getter",
                                "watch(() => session.user, …)",
                                "the returned value changes",
                            ],
                            [
                                "reactive object",
                                "watch(session, …)",
                                "any nested property changes (deep automatically)",
                            ],
                            [
                                "array of sources",
                                "watch([loginCount, () => session.user], …)",
                                "any of them changes",
                            ],
                        ]}
                    />
                    <p>
                        Passing a reactive property directly passes its current value,
                        not a source:
                    </p>
                    <CodeBlock code={WATCH_PROPERTY_VALUE} lang="ts" />
                    <p>
                        <Code>session.user</Code> is read once, immediately, so there
                        is nothing to track. Here TypeScript reports it because of{" "}
                        <Code>null</Code>; for an object-typed property it can compile
                        and still be wrong. The getter form:
                    </p>
                    <CodeBlock code={WATCH_GETTER} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · watch a getter, not a property value"
                    >
                        <p>
                            Wrap reactive properties in a getter:{" "}
                            <Code>{"() => session.user"}</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Stopping a watcher">
                    <p>
                        <Code>watch()</Code> returns a function that stops the watcher:
                    </p>
                    <CodeBlock code={STOP_WATCHER} lang="ts" />
                    <p>
                        A watcher created in a module lives as long as the app, which
                        suits app-wide state. Watchers created in{" "}
                        <Code>setup()</Code> are stopped automatically when the
                        component unmounts (see Script Setup).
                    </p>
                </DocSection>

                <DocSection title="Options or functions">
                    <p>
                        The <Code>computed</Code> and <Code>watch</Code> options exist
                        only inside <Code>defineComponent</Code>. The{" "}
                        <Code>computed()</Code> and <Code>watch()</Code> functions work
                        anywhere. A store module therefore has computed values and
                        watchers too — through the functions.
                    </p>
                    <GridTable
                        cols="grid-cols-[max-content_1fr_1fr]"
                        head={["", "Component (Options API)", "Module or store"]}
                        rows={[
                            [
                                "Derived value",
                                "computed: { … } option",
                                "computed(() => …)",
                            ],
                            [
                                "Reaction to change",
                                "watch: { … } option",
                                "watch(source, cb)",
                            ],
                        ]}
                    />
                    <p>
                        Pinia uses the same split: an options store declares{" "}
                        <Code>getters</Code> (its computed values) and has no{" "}
                        <Code>watch</Code> option; a setup store uses{" "}
                        <Code>computed()</Code> and <Code>watch()</Code> directly.
                    </p>
                </DocSection>
            </div>

            {/* ---------- part 4 — deep, immediate and once ---------- */}
            <PartHeading kicker="part 4">deep, immediate and once</PartHeading>
            <div>
                <DocSection title="deep">
                    <p>
                        A getter that returns an object fires only when the object is
                        replaced. A change inside it goes unnoticed:
                    </p>
                    <CodeBlock code={GETTER_NOT_DEEP} lang="ts" />
                    <p>
                        <Code>deep: true</Code> tracks every nested property:
                    </p>
                    <CodeBlock code={GETTER_DEEP} lang="ts" />

                    <Callout
                        severity="note"
                        label="note · reactive sources are deep already"
                    >
                        <p>
                            <Code>watch(session, …)</Code> on a reactive object is deep
                            automatically. <Code>deep</Code> matters for getters and
                            refs holding objects. Deep watching walks the whole object
                            on every change; avoid it on large data.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="immediate">
                    <p>
                        The callback runs only on a change, never for the initial
                        value. Logic that must also run at the start — loading data for
                        the current id, syncing the document title — misses the first
                        run.
                    </p>
                    <p>
                        <Code>immediate: true</Code> runs the callback once right away:
                    </p>
                    <CodeBlock code={WATCH_IMMEDIATE} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · no old value on the first run"
                    >
                        <p>
                            On the immediate run, <Code>previous</Code> is{" "}
                            <Code>undefined</Code>; its type is{" "}
                            <Code>User | null | undefined</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="once">
                    <p>
                        Some reactions matter only for the first change, such as
                        showing a tip after the first login. Without an option, the
                        stop handle must be kept and called inside the callback.
                    </p>
                    <p>
                        <Code>once: true</Code> stops the watcher after its first run:
                    </p>
                    <CodeBlock code={WATCH_ONCE} lang="ts" />

                    <Callout severity="difference" label="vue 2 → 3 · once is new">
                        <p>
                            <Code>once</Code> was added in Vue 3.4. <Code>deep</Code>{" "}
                            and <Code>immediate</Code> work as before. All three are
                            also available in the <Code>watch</Code> option:{" "}
                            <Code>
                                {"{ handler, deep: true, immediate: true, once: true }"}
                            </Code>
                            .
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 5 — watchEffect ---------- */}
            <PartHeading kicker="part 5">watchEffect</PartHeading>
            <div>
                <DocSection title="watchEffect">
                    <p>
                        <Code>watch</Code> reacts only to its source. Values read
                        inside the callback are used, not watched. When one of them
                        changes on its own, the callback does not run:
                    </p>
                    <CodeBlock code={WATCH_MISSES_READS} lang="ts" />
                    <p>
                        With <Code>watch</Code>, the fix is listing every source by
                        hand: <Code>{"watch([() => session.user, loginCount], …)"}</Code>
                        .
                    </p>
                    <p>
                        <Code>watchEffect</Code> has no source list. It runs the
                        function and tracks every reactive value the function reads:
                    </p>
                    <CodeBlock code={WATCH_EFFECT} lang="ts" />
                    <p>
                        It uses the same dependency tracking as <Code>computed</Code>,
                        applied to side effects. It runs immediately to collect its
                        dependencies and collects them again on every run, so a value
                        read only inside an <Code>if</Code> is tracked only while that
                        branch runs. It receives no new/old values and returns a stop
                        function.
                    </p>

                    <Callout severity="difference" label="vue 2 → 3 · new api">
                        <p>
                            Vue 2 has no <Code>watchEffect</Code>. The closest
                            equivalent was an immediate watcher with every source
                            listed manually.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Async effects">
                    <p>
                        Only reads made while the function runs synchronously are
                        tracked:
                    </p>
                    <CodeBlock code={WATCH_EFFECT_ASYNC} lang="ts" />

                    <Callout
                        severity="trap"
                        label="trap · only reads before the first await are tracked"
                    >
                        <p>
                            Read every dependency before the first <Code>await</Code>.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="watch or watchEffect">
                    <p>
                        <Code>watchEffect</Code> behaves like a <Code>watch</Code>{" "}
                        whose source array is filled automatically, with{" "}
                        <Code>immediate: true</Code>:
                    </p>
                    <div className={PAIR_FRAME}>
                        <div className={PAIR_GRID}>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>watchEffect</Term>
                                </p>
                                <CodeBlock code={EFFECT_FORM} lang="ts" />
                            </div>
                            <div className={PAIR_COL}>
                                <p>
                                    <Term>Equivalent watch</Term>
                                </p>
                                <CodeBlock code={EQUIVALENT_WATCH} lang="ts" />
                            </div>
                        </div>
                    </div>
                    <p>
                        Differences remain: <Code>watchEffect</Code> cannot exclude a
                        value it reads, its dependencies can change between runs, and
                        it provides no old value.
                    </p>
                    <GridTable
                        cols="grid-cols-[1fr_max-content]"
                        head={["Need", "Use"]}
                        rows={[
                            [
                                "React to specific sources, or need the old value",
                                "watch",
                            ],
                            [
                                "Run on start and depend on whatever the code reads",
                                "watchEffect",
                            ],
                            [
                                "Run only for named sources although the callback reads more",
                                "watch",
                            ],
                        ]}
                    />

                    <Callout
                        severity="note"
                        label="note · an empty array never fires"
                    >
                        <p>
                            <Code>watch([], fn)</Code> has no sources and never runs.
                            Unlike React&apos;s <Code>useEffect(fn, [])</Code>, it does
                            not mean &quot;run once&quot;; one-time code belongs in{" "}
                            <Code>setup()</Code> or <Code>mounted</Code>.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 6 — cleanup ---------- */}
            <PartHeading kicker="part 6">Cleanup</PartHeading>
            <div>
                <DocSection title="Watcher cleanup">
                    <p>
                        Work started by one watcher run can outlive it. When the source
                        changes again, the earlier run&apos;s timer or request is still
                        active and can act on outdated data.
                    </p>
                    <p>
                        Vue passes an <Code>onCleanup</Code> function into the callback
                        (third argument of <Code>watch</Code>, first argument of{" "}
                        <Code>watchEffect</Code>). The function registered there runs
                        right before the next run and when the watcher stops. What
                        cleaning up means is decided by the callback:
                    </p>
                    <CodeBlock code={CLEANUP_TIMER} lang="ts" />
                    <p>
                        Changing <Code>userId</Code> from 1 to 2 within two seconds
                        produces this sequence:
                    </p>
                    <CodeBlock code={CLEANUP_SEQUENCE} lang="text" />
                    <GridTable
                        cols="grid-cols-2"
                        head={["Vue", "Callback code"]}
                        rows={[
                            [
                                "Passes onCleanup into the callback",
                                "Starts the work (timer, request, listener)",
                            ],
                            [
                                "Stores the registered function",
                                "Registers a function that stops that work",
                            ],
                            [
                                "Calls it before the next run and when the watcher stops",
                                "—",
                            ],
                        ]}
                    />
                    <p>
                        In the <Code>watch()</Code> function (Vue 3.5+),{" "}
                        <Code>{"onWatcherCleanup(() => …)"}</Code>, imported from{" "}
                        <Code>vue</Code>, can be used instead of the argument.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · register before the first await"
                    >
                        <p>
                            Vue associates the cleanup with the current run only while
                            the callback runs synchronously. Register it before any{" "}
                            <Code>await</Code>.
                        </p>
                    </Callout>

                    <Callout severity="difference" label="vue 2 → 3 · cleanup is new">
                        <p>
                            Vue 2 watchers had no cleanup hook; stale work had to be
                            detected manually, for example with a request counter.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Cancelling stale requests">
                    <p>
                        A watcher that fetches data can display the wrong result. When
                        the source changes from 1 to 2 and request 1 is slower, it
                        finishes last and overwrites the data for 2:
                    </p>
                    <CodeBlock code={STALE_RACE} lang="text" />
                    <p>
                        <Code>AbortController</Code> is a built-in Web API (browsers and
                        Node, no import). <Code>controller.signal</Code> is passed to
                        the request; <Code>controller.abort()</Code> cancels it, and the
                        pending <Code>await</Code> rejects with an{" "}
                        <Code>AbortError</Code>:
                    </p>
                    <CodeBlock code={ABORT_DEMO} lang="js" />
                    <p>Output:</p>
                    <CodeBlock code={ABORT_OUTPUT} lang="text" />
                    <p>
                        Each watcher run creates its own controller and registers{" "}
                        <Code>abort</Code> as its cleanup. The next run aborts the
                        previous request, so its <Code>await</Code> throws and its
                        assignment never happens:
                    </p>
                    <CodeBlock code={ABORT_IN_WATCH} lang="ts" />
                    <p>
                        The same handler works in the <Code>watch</Code> option, where{" "}
                        <Code>onCleanup</Code> is the third parameter. Aborted requests
                        reject, so the handler catches the <Code>AbortError</Code>:
                    </p>
                    <CodeBlock code={ABORT_IN_OPTION} lang="ts" />

                    <Callout
                        severity="tip"
                        label="tip · fetch and axios accept the signal"
                    >
                        <p>
                            <Code>{"fetch(url, { signal })"}</Code> and axios (
                            <Code>config.signal</Code>) cancel natively. Custom async
                            code (timers, other libraries) must listen to{" "}
                            <Code>signal</Code>&apos;s <Code>abort</Code> event itself.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
