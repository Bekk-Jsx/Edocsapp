"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Three sibling navigation-hook pages, so clicking one is a real route change:
// the hook re-renders and the active style follows on its own.
const LINKS = [
    { href: "/hooks-refresh/use-router", label: "use-router" },
    { href: "/hooks-refresh/use-pathname", label: "use-pathname" },
    { href: "/hooks-refresh/use-params", label: "use-params" },
];

export default function UsePathnameDemo() {
    const pathname = usePathname();

    return (
        <div className="space-y-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                    usePathname()
                </p>
                <p className="mt-1 break-all font-mono text-sm text-[var(--accent)]">
                    {pathname}
                </p>
            </div>

            <nav className="flex flex-wrap gap-2">
                {LINKS.map((link) => {
                    const active = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={active ? "page" : undefined}
                            className={`rounded-md border px-3 py-1.5 font-mono text-xs transition-colors duration-150 ${
                                active
                                    ? "border-[var(--mint)] bg-[color-mix(in_srgb,var(--mint)_12%,var(--surface))] text-[var(--mint)]"
                                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
                            }`}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <p className="text-xs text-[var(--muted)]">
                The highlighted link is the one whose{" "}
                <span className="font-mono text-[var(--text)]">href</span> equals{" "}
                <span className="font-mono text-[var(--text)]">pathname</span> —
                click another and the value above changes with it. A{" "}
                <span className="font-mono text-[var(--text)]">?query</span> would
                never appear in that string.
            </p>
        </div>
    );
}
