"use client";

import { useInsertionEffect, useState } from "react";

const PALETTE: { name: string; color: string }[] = [
    { name: "periwinkle", color: "#7c9cf0" },
    { name: "mint", color: "#5fd3a0" },
    { name: "amber", color: "#e0b352" },
];

// Toy version of what a CSS-in-JS library does: derive a class from a value
// and inject its rule into <head> BEFORE layout runs.
function useInjectedRule(className: string, css: string) {
    useInsertionEffect(() => {
        const el = document.createElement("style");
        el.setAttribute("data-hook", "use-insertion-effect");
        el.textContent = `.${className} { ${css} }`;
        document.head.appendChild(el);
        return () => {
            el.remove();
        };
    }, [className, css]);
}

export default function UseInsertionEffectDemo() {
    const [i, setI] = useState(0);
    const current = PALETTE[i];
    const className = `dyn-${current.name}`;
    useInjectedRule(className, `background:${current.color};`);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {PALETTE.map((p, idx) => (
                    <button
                        key={p.name}
                        onClick={() => setI(idx)}
                        aria-label={p.name}
                        className={`h-8 w-8 rounded-md border ${idx === i
                                ? "border-[var(--accent)]"
                                : "border-[var(--border)]"
                            }`}
                        style={{ background: p.color }}
                    />
                ))}
            </div>

            <div
                className={`${className} h-16 rounded-md border border-[var(--border)]`}
            />

            <p className="text-xs text-[var(--muted)]">
                Each swap injects a fresh <span className="font-mono">&lt;style&gt;</span>{" "}
                tag via <span className="font-mono">useInsertionEffect</span> — runs
                before <span className="font-mono">useLayoutEffect</span>, so the
                rule already exists when React measures the box. Inspect{" "}
                <span className="font-mono">&lt;head&gt;</span> to see the tag come
                and go.
            </p>
        </div>
    );
}
