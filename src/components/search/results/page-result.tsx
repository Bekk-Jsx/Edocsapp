import Link from "next/link";
import type { ReactNode } from "react";
import { BADGE_CLASS } from "@/components/ui/badge-class";
import type { SearchPage } from "@/search/types";
import Highlight from "../highlight";
import type { NavigateHandler } from "./title-result";

// A page as it appears on the project landing: chapter eyebrow, page name as
// the heading, same card surface and hover border. Its matching parts and
// titles sit underneath, inside the same card.
export default function PageResult({
    page,
    query,
    onNavigate,
    children,
}: {
    page: SearchPage;
    query: string;
    onNavigate: NavigateHandler;
    children?: ReactNode;
}) {
    return (
        <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--accent)]">
            <Link
                href={page.href}
                onClick={(e) => onNavigate(e, page.href)}
                className="block rounded-lg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
                <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                    {page.chapter}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-mono text-sm text-[var(--accent)]">
                        <Highlight text={page.name} query={query} />
                    </h3>
                    {page.planned ? (
                        <span
                            className={BADGE_CLASS}
                            style={{
                                color: "var(--muted)",
                                background: "var(--surface-2)",
                                borderColor: "var(--border)",
                            }}
                        >
                            planned
                        </span>
                    ) : null}
                </div>
            </Link>
            {children ? (
                <div className="space-y-1 border-t border-[var(--border)] px-4 py-3">
                    {children}
                </div>
            ) : null}
        </article>
    );
}
