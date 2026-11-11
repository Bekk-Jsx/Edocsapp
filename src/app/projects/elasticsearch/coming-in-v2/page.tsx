import PageShell from "@/components/ui/page-shell";
import { ComingInV2Docs } from "@/projects/elasticsearch/content/coming-in-v2";

// Project page, not a docs page: PageShell with no `alerts`, so the summary rail
// never renders and the body takes the full column. Same template as the hooks
// project's About next version page — no demo, no severity map, nothing live to
// show, only what comes next.
export default function Page() {
    return (
        <PageShell>
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        elasticsearch · search
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        Coming in v2
                    </h1>
                    <div className="mt-3 leading-relaxed text-[var(--muted)]">
                        What is planned for the next version of this project — in the
                        order it is meant to be built.
                    </div>
                </header>

                <ComingInV2Docs />
            </article>
        </PageShell>
    );
}
