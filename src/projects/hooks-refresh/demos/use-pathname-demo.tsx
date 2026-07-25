"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
    { href: "/hooks-refresh/use-router", label: "use-router" },
    { href: "/hooks-refresh/use-pathname", label: "use-pathname" },
    { href: "/hooks-refresh/use-params", label: "use-params" },
];

export default function UsePathnameDemo() {
    const pathname = usePathname();

    return (
        <div className="space-y-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm">
                <span className="text-[var(--muted)]">current pathname · </span>
                <span className="font-mono text-[var(--accent)]">{pathname}</span>
            </div>

            <nav className="flex flex-wrap gap-2">
                {LINKS.map((l) => {
                    const active = pathname === l.href;
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={`rounded-md border px-3 py-1.5 text-sm ${active
                                    ? "border-[var(--accent)] text-[var(--accent)]"
                                    : "border-[var(--border)] hover:bg-[var(--surface-2)]"
                                }`}
                        >
                            {l.label}
                        </Link>
                    );
                })}
            </nav>

            <p className="text-xs text-[var(--muted)]">
                Click a link — <span className="font-mono">usePathname</span>{" "}
                re-renders with the new value, and the active style follows. The
                returned string never contains a search string; use{" "}
                <span className="font-mono">useSearchParams</span> for those.
            </p>
        </div>
    );
}
