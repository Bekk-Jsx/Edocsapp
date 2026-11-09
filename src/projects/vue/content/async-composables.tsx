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
    // --- part 1 (The async state pattern) ---
    // inline `note · the Ref cast`
    "data-loading-error-and-refresh": ["note"],

    // --- part 2 (Reactive sources) ---
    // inline `trap · don't treat AbortError as an error` + `note · effectScope`
    "re-fetch-on-change-abort-stale-runs": ["trap", "note"],
};

// Top-level divider between the two parts of the page — mirrors the groups in
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

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details. ❌ broken code comes before ✅ fixed code.
// 3. Every fragment declares its language: ts or vue. Component examples use
//    <script setup lang="ts">.
// 4. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.

// ===================================================================
// part 1 — the async state pattern
// ===================================================================

const REPEATED_BOILERPLATE = `// repeated in every component
const user = ref<User | null>(null)
const loading = ref(false)
const error = ref<Error | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    user.value = await fetchUser(1)
  } catch (e) {
    error.value = e as Error
  } finally {
    loading.value = false
  }
})`;

const USE_ASYNC_DATA = `// src/composables/useAsyncData.ts
import { ref, type Ref } from 'vue'

export function useAsyncData<T>(loader: () => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      data.value = await loader()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }

  refresh() // load immediately

  return { data, loading, error, refresh }
}`;

const USE_ASYNC_DATA_CALLER = `<script setup lang="ts">
import { fetchUser } from '@/api/users'
import { useAsyncData } from '@/composables/useAsyncData'

const { data: user, loading, error, refresh } = useAsyncData(() => fetchUser(1))
</script>

<template>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">{{ error.message }}</p>
  <p v-else>{{ user?.name }}</p>
  <button @click="refresh">Reload</button>
</template>`;

// ===================================================================
// part 2 — reactive sources
// ===================================================================

const USE_ASYNC_DATA_SOURCE = `// src/composables/useAsyncData.ts
import { ref, watch, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export function useAsyncData<S, T>(
  source: MaybeRefOrGetter<S>,
  loader: (source: S, signal: AbortSignal) => Promise<T>,
) {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  watch(
    () => toValue(source),
    async (value, _old, onCleanup) => {
      const controller = new AbortController()
      onCleanup(() => controller.abort())

      loading.value = true
      error.value = null
      try {
        data.value = await loader(value, controller.signal)
        loading.value = false
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        error.value = e instanceof Error ? e : new Error(String(e))
        loading.value = false
      }
    },
    { immediate: true },
  )

  return { data, loading, error }
}`;

const USE_ASYNC_DATA_SOURCE_CALLER = `<script setup lang="ts">
import { ref } from 'vue'
import { fetchUser } from '@/api/users'
import { useAsyncData } from '@/composables/useAsyncData'

const userId = ref(1)
const { data: user, loading, error } = useAsyncData(userId, (id, signal) =>
  fetchUser(id, signal),
)
</script>

<template>
  <button v-for="id in 3" :key="id" @click="userId = id">User {{ id }}</button>
  <p v-if="loading">Loading…</p>
  <p v-else-if="error">{{ error.message }}</p>
  <p v-else>{{ user?.name }}</p>
</template>`;

export function AsyncComposablesDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    Fetching data needs the same scaffolding everywhere: a data ref, a
                    loading flag, an error catch, and protection against stale
                    responses. An <Term>async composable</Term> builds that scaffolding
                    once.
                </p>
                <p>
                    This page develops one composable in two steps: first the async
                    state pattern, then a reactive source with automatic re-fetching
                    and aborting.
                </p>
            </div>

            {/* ---------- part 1 — the async state pattern ---------- */}
            <PartHeading kicker="part 1">The async state pattern</PartHeading>
            <div>
                <DocSection title="data, loading, error and refresh">
                    <p>
                        Every component that loads data repeats the same boilerplate — a
                        data ref, a loading flag, a <Code>try</Code>/<Code>catch</Code>{" "}
                        for the error, a call on mount. Copied into several components,
                        it drifts, and the error case is the part most often forgotten:
                    </p>
                    <CodeBlock code={REPEATED_BOILERPLATE} lang="ts" />
                    <p>
                        One composable owns the whole lifecycle of an async call. The
                        loader is a parameter, so the same composable serves any
                        resource:
                    </p>
                    <CodeBlock code={USE_ASYNC_DATA} lang="ts" />
                    <p>A component passes its loader and renders the three states:</p>
                    <CodeBlock code={USE_ASYNC_DATA_CALLER} lang="vue" />
                    <p>
                        The immediate <Code>refresh()</Code> runs during setup; the refs
                        fill when the promise resolves, so no <Code>onMounted</Code> is
                        needed. <Code>refresh</Code> is also returned, so reloading costs
                        nothing. <Code>data</Code> is <Code>{"T | null"}</Code>, which
                        forces the template to handle the not-yet-loaded case.
                    </p>

                    <Callout severity="note" label="note · the Ref cast">
                        <p>
                            Inside a generic function,{" "}
                            <Code>{"ref<T | null>(null)"}</Code> infers{" "}
                            <Code>{"Ref<UnwrapRef<T> | null>"}</Code>, which rejects{" "}
                            <Code>data.value = await loader()</Code>. The{" "}
                            <Code>{"as Ref<T | null>"}</Code> cast is the standard fix,
                            used by libraries such as VueUse.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — reactive sources ---------- */}
            <PartHeading kicker="part 2">Reactive sources</PartHeading>
            <div>
                <DocSection title="Re-fetch on change, abort stale runs">
                    <p>
                        A one-shot load is rarely enough: the id being fetched is
                        usually state, and the data must follow it. Changing it quickly
                        also revives the stale-response race from Computed &amp;
                        Watchers — a slow earlier request can finish last and overwrite
                        newer data.
                    </p>
                    <p>
                        The composable takes a reactive source and watches it; each run
                        aborts the previous one:
                    </p>
                    <CodeBlock code={USE_ASYNC_DATA_SOURCE} lang="ts" />
                    <p>A component passes a ref as the source:</p>
                    <CodeBlock code={USE_ASYNC_DATA_SOURCE_CALLER} lang="vue" />
                    <p>
                        Each piece is an existing tool composed:{" "}
                        <Code>toValue</Code> in a getter accepts a ref, getter or plain
                        value (see Writing Composables); <Code>immediate: true</Code>{" "}
                        replaces the manual first refresh; <Code>onCleanup</Code> with
                        an <Code>AbortController</Code> ensures only the latest request
                        can write <Code>data</Code> (see Computed &amp; Watchers). The{" "}
                        <Code>AbortError</Code> is swallowed — it means a newer request
                        took over, not a failure — and it leaves <Code>loading</Code>{" "}
                        untouched: the new run has already set it, and only a run that
                        finishes ends it.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · don't treat AbortError as an error"
                    >
                        <p>
                            Writing it into <Code>error</Code> flashes a failure message
                            on every quick source change. Return early instead.
                        </p>
                    </Callout>

                    <Callout severity="note" label="note · effectScope">
                        <p>
                            Watchers created while a component&apos;s setup runs stop
                            on unmount. A composable called outside any component —
                            module code, a plugin — never stops by itself;{" "}
                            <Code>effectScope()</Code> groups its effects so{" "}
                            <Code>scope.stop()</Code> can end them manually.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
