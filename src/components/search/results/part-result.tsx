import Link from "next/link";
import type { SearchHit } from "@/search/types";
import Highlight from "../highlight";
import type { NavigateHandler } from "./title-result";

// A part, drawn like the PartHeading divider on doc pages: mono kicker, bold
// heading, hairline rule.
export default function PartResult({
    hit,
    query,
    crumb,
    onNavigate,
}: {
    hit: SearchHit;
    query: string;
    crumb?: string;
    onNavigate: NavigateHandler;
}) {
    return (
        <Link
            href={hit.href}
            onClick={(e) => onNavigate(e, hit.href)}
            className="block rounded-md px-2 py-2 transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {crumb ? `part · ${crumb}` : "part"}
            </p>
            <p className="mt-1 text-[1.05rem] font-bold tracking-tight text-[var(--text)]">
                <Highlight text={hit.text} query={query} />
            </p>
            <div aria-hidden="true" className="mt-2 h-px w-full bg-[var(--border)]" />
        </Link>
    );
}
