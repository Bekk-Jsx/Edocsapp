import PageShell from "@/components/ui/page-shell";
import { AboutNextVersionDocs } from "@/projects/hooks-refresh/content/about-next-version-content";

// Project page, not a hook page: PageShell with no `alerts`, so the summary rail
// never renders and the body takes the full column. No DemoFrame either — there
// is nothing live to show, only what comes next.
export default function Page() {
    return (
        <PageShell>
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        hooks · refresh
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        About next version
                    </h1>
                    <div className="mt-3 leading-relaxed text-[var(--muted)]">
                        What is planned for the next version of this lab — in the order
                        it is meant to be built.
                    </div>
                </header>

                <AboutNextVersionDocs />
            </article>
        </PageShell>
    );
}
