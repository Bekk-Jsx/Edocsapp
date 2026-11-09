import Link from "next/link";
import type { MouseEvent } from "react";
import type { SearchHit } from "@/search/types";
import Highlight from "../highlight";

export type NavigateHandler = (e: MouseEvent<HTMLAnchorElement>, href: string) => void;

// A section title, drawn like a DocSection heading (accent bar + mono caps),
// with the section's keywords as inline-code chips. The chip that matched is
// emphasized; the rest stay quiet.
export default function TitleResult({
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
    const keywords = hit.title?.keywords ?? [];
    return (
        <Link
            href={hit.href}
            onClick={(e) => onNavigate(e, hit.href)}
            className="group block rounded-md px-2 py-2 transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            <div className="flex items-center gap-2">
                <span
                    aria-hidden="true"
                    className="inline-block h-[14px] w-[2px] shrink-0 rounded-full bg-[var(--accent)]"
                />
                <p className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">
                    <Highlight text={hit.text} query={query} />
                </p>
            </div>
            {crumb ? (
                <p className="mt-0.5 pl-[10px] font-mono text-[0.65rem] text-[var(--muted)]">
                    {crumb}
                </p>
            ) : null}
            {keywords.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-[10px] text-[0.85rem]">
                    {keywords.map((k) => {
                        const matched = k === hit.keyword;
                        return (
                            <code
                                key={k}
                                className={`code-token rounded px-1.5 py-0.5 font-mono text-[0.8em] ${
                                    matched
                                        ? "ring-1 ring-[var(--accent)]"
                                        : "opacity-70"
                                }`}
                            >
                                {matched ? <Highlight text={k} query={query} /> : k}
                            </code>
                        );
                    })}
                </div>
            ) : null}
        </Link>
    );
}
