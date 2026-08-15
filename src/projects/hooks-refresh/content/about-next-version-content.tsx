import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";

// Roadmap for v2 — a project page, not a hook page: same section and prose
// styles as the docs, but no severity map, no summary rail and no demo, because
// there is no API here to flag traps on. Order is priority order.
export function AboutNextVersionDocs() {
    return (
        <>
            <DocSection title="foundations (priority)">
                <p>
                    <Term>Server vs Client Components.</Term>{" "}The App Router&apos;s
                    server/client split — where the boundary sits, what crosses it, and
                    where data should be fetched. It is the missing foundation the whole
                    Next side of this lab rests on: every{" "}
                    <Code>&quot;use client&quot;</Code> written so far is a decision
                    made without the page that explains it.
                </p>
                <p>
                    <Term>Suspense &amp; error boundaries.</Term> Built properly, with
                    real loading and error UI rather than a <Code>fallback</Code>{" "}
                    dropped in to silence a warning. Several React 19 hooks lean on
                    them — <Code>use</Code>, <Code>useActionState</Code> and{" "}
                    <Code>useSearchParams</Code> all assume a boundary is there.
                </p>

                <Callout severity="note" label="note · order matters">
                    <p>
                        These two come first because the rest depends on them. A form
                        page or a testing page written before the server/client boundary
                        is properly explained would keep pointing at an answer that
                        isn&apos;t on the site yet.
                    </p>
                </Callout>
            </DocSection>

            <DocSection title="content">
                <p>
                    <Term>Forms end-to-end.</Term> One real form that combines{" "}
                    <Code>useActionState</Code>, <Code>useFormStatus</Code> and{" "}
                    <Code>useOptimistic</Code> with validation and Server Actions —
                    the three hooks documented separately, finally shown doing one job
                    together.
                </p>
                <p>
                    <Term>Testing.</Term> React Testing Library and{" "}
                    <Code>renderHook</Code>: how to test async behaviour, effects, and
                    the custom hooks from the Custom Hooks page.
                </p>
                <p>
                    <Term>Performance measurement.</Term> The React DevTools Profiler —
                    reading a flame graph, seeing when memoization actually helps, and
                    avoiding the premature <Code>useMemo</Code> the Performance chapter
                    keeps warning about.
                </p>
            </DocSection>

            <DocSection title="ecosystem (docs-oriented)">
                <p>
                    <Term>React Router.</Term> The routing equivalents to the Next
                    navigation hooks, gathered in one place:{" "}
                    <Code>useNavigate</Code> (≈ <Code>useRouter().push</Code>),{" "}
                    <Code>useLocation</Code> (≈ <Code>usePathname</Code> +{" "}
                    <Code>useSearchParams</Code>), <Code>useParams</Code>, and React
                    Router&apos;s own <Code>useSearchParams</Code> — which is MUTABLE
                    through a setter, unlike Next&apos;s read-only one.
                </p>
                <p>
                    <Term>State libraries.</Term> Zustand, Jotai (<Code>useAtom</Code>),
                    and React Query / SWR (<Code>useQuery</Code>) — the production
                    version of the <Code>useFetch</Code> built by hand on the Custom
                    Hooks page.
                </p>
                <p>
                    <Term>
                        <Code>useDebugValue</Code>.
                    </Term>{" "}
                    The last core React hook left: dev-tools labelling for custom hooks.
                    Small, rarely needed, and included for completeness.
                </p>
            </DocSection>

            <DocSection title="infrastructure">
                <p>
                    <Term>Monorepo split.</Term> Separate each sub-project into its own
                    app, sharing one theme package, with a single hub home page and
                    subdomain hosting. Mainly to cut build times — one lab that rebuilds
                    everything on every change gets slower with each project added.
                </p>
            </DocSection>
        </>
    );
}
