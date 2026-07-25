"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hooksByChapter } from "@/lib/hooks";

// Client component: usePathname requires the client boundary.
// (usePathname is covered properly in Ch7 — here it just drives active state.)
export default function Navbar() {
    const pathname = usePathname();
    const groups = hooksByChapter();

    return (
        <aside className="nav-scroll sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6">
            <Link href="/" className="mb-8 block">
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
                    hooks
                </span>
                <span className="block text-sm text-[var(--muted)]">refresh · lab</span>
            </Link>

            <nav className="space-y-6">
                {groups.map(({ chapter, hooks }) => (
                    <div key={chapter}>
                        <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                            {chapter}
                        </p>
                        <ul className="space-y-0.5">
                            {hooks.map((h) => {
                                const href = `/hooks/${h.slug}`;
                                const active = pathname === href;
                                return (
                                    <li key={h.slug}>
                                        <Link
                                            href={href}
                                            className={`block rounded-md px-2 py-1.5 font-mono text-sm transition-colors ${active
                                                    ? "bg-[var(--surface-2)] text-[var(--accent)]"
                                                    : "text-[var(--text)] hover:bg-[var(--surface-2)]"
                                                }`}
                                        >
                                            {h.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
}