import type { ReactNode } from "react";
import CodeBlock from "./code-block";
import type { Source } from "@/projects/hooks-refresh/hooks";

type Props = {
    name: string; // hook name — heading + eyebrow
    source: Source; // "react" | "next/navigation"
    description: ReactNode; // short intro under the heading
    code: string; // source shown in the "source" panel
    docs?: ReactNode; // refresh notes / react-vs-next / q&a sections
    children: ReactNode; // the live (client) demo
};

// Server Component. The live demo arrives via `children`, the docs via a named
// prop — both are components passed as data, letting this frame control layout.
export default function DemoFrame({
    name,
    source,
    description,
    code,
    docs,
    children,
}: Props) {
    return (
        <article className="w-full">
            <header className="mb-6">
                <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                    {source} · {name}
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                    {name}
                </h1>
                <div className="mt-3 text-[var(--muted)] leading-relaxed">
                    {description}
                </div>
            </header>

            <section className="mb-6">
                <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--mint)]">
                    live
                </p>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                    {children}
                </div>
            </section>

            <section>
                <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                    source
                </p>
                <CodeBlock code={code} />
            </section>

            {docs}
        </article>
    );
}