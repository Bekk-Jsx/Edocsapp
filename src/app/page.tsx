import Link from "next/link";
import { hooksByChapter, HOOKS, CHAPTERS } from "@/lib/hooks";

export default function Home() {
  const groups = hooksByChapter();

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs tracking-widest text-[var(--accent)]">
        react · next.js
      </p>
      <h1 className="mt-2 text-4xl font-semibold">Hooks, refreshed.</h1>
      <p className="mt-3 max-w-xl text-[var(--muted)] leading-relaxed">
        One hook per page: a live demo you can break, the exact source that
        drives it, and reference notes to re-read later. Server-rendered
        highlighting; client-only where a hook truly needs the browser.
      </p>

      <div className="mt-6 flex gap-6 font-mono text-xs text-[var(--muted)]">
        <span>
          <span className="text-[var(--text)]">{HOOKS.length}</span> hooks
        </span>
        <span>
          <span className="text-[var(--text)]">{CHAPTERS.length}</span> chapters
        </span>
        <span>
          <span className="text-[var(--text)]">
            {HOOKS.filter((h) => h.source === "next/navigation").length}
          </span>{" "}
          next-only
        </span>
      </div>

      <div className="mt-10 space-y-8">
        {groups.map(({ chapter, hooks }) => (
          <div key={chapter}>
            <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
              {chapter}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {hooks.map((h) => (
                <Link
                  key={h.slug}
                  href={`/hooks/${h.slug}`}
                  className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)]"
                >
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-sm text-[var(--accent)]">
                      {h.name}
                    </p>
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100">
                      {h.source === "next/navigation" ? "next" : "react"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">{h.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}