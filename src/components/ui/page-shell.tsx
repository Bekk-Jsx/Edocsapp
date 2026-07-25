import type { ReactNode } from "react";

// Two-column content shell: a fluid body column and a fixed-width, sticky
// alerts rail on the right. Collapses to a single column below ~1100px
// (see .page-grid in globals.css). The navbar lives outside this.
export default function PageShell({
    children,
    alerts,
}: {
    children: ReactNode;
    alerts?: ReactNode;
}) {
    return (
        <div className="page-grid">
            <div className="page-body">{children}</div>
            {alerts ? (
                <aside className="page-alerts rail-scroll">{alerts}</aside>
            ) : null}
        </div>
    );
}
