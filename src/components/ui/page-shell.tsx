import type { ReactNode } from "react";
import PageSearch from "@/components/search/page-search";

// Two-column content shell: a fluid body column and a fixed-width, sticky
// alerts rail on the right. Collapses to a single column below ~1100px
// (see .page-grid in globals.css). The navbar lives outside this.
//
// A page with a rail is a written doc page, so it gets page search — no
// per-page code. Pages without one (PlanPage placeholders, notes) get none.
export default function PageShell({
    children,
    alerts,
}: {
    children: ReactNode;
    alerts?: ReactNode;
}) {
    return (
        <div className="page-grid">
            <div className="page-body">
                {alerts ? <PageSearch>{children}</PageSearch> : children}
            </div>
            {alerts ? (
                <aside className="page-alerts rail-scroll">{alerts}</aside>
            ) : null}
        </div>
    );
}
