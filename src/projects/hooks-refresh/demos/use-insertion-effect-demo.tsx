"use client";

import { useId, useInsertionEffect, useState } from "react";

// What a CSS-in-JS library does internally, in miniature: build a rule from a
// runtime value, inject it as a <style> tag before React touches the DOM, and
// remove it when the component goes away.
//
// The effect body does nothing else — no measuring, no setState — because at
// this point in the commit there is nothing to measure and no re-render to ask
// for. See the "restrictions" section.
const ACCENTS = [
    { label: "mint", value: "var(--mint)" },
    { label: "amber", value: "var(--amber)" },
    { label: "orchid", value: "var(--next)" },
] as const;

// The rule is a plain string built at render time — this is the "runtime CSS"
// the hook exists for. Rendered below too, so you can read what got injected.
const ruleFor = (cls: string, color: string) =>
    `.${cls} { border-color: ${color}; color: ${color}; }`;

export default function UseInsertionEffectDemo() {
    const [accent, setAccent] = useState<(typeof ACCENTS)[number]>(ACCENTS[0]);

    // useId is per-instance, so two copies of this demo can't collide. Its
    // output contains ":" — illegal in a class selector, so strip it.
    const id = useId();
    const cls = `ie-box-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
    const rule = ruleFor(cls, accent.value);

    useInsertionEffect(() => {
        const tag = document.createElement("style");
        tag.textContent = rule;
        document.head.appendChild(tag);
        // Cleanup runs before the next injection and on unmount — without it
        // every toggle would leave a dead <style> behind.
        return () => tag.remove();
    }, [rule]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--muted)]">accent:</span>
                {ACCENTS.map((a) => (
                    <button
                        key={a.label}
                        onClick={() => setAccent(a)}
                        className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
                            accent.label === a.label
                                ? "border-[var(--accent)] text-[var(--accent)]"
                                : "border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-2)]"
                        }`}
                    >
                        {a.label}
                    </button>
                ))}
            </div>

            {/* Only the base classes are static. The colour comes from the
                injected rule, so this box is unstyled until the tag lands. */}
            <div
                className={`${cls} rounded-lg border bg-[var(--surface-2)] p-4 text-sm`}
            >
                styled by an injected <span className="font-mono">&lt;style&gt;</span>{" "}
                tag
            </div>

            <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 font-mono text-xs text-[var(--muted)]">
                {rule}
            </pre>

            <p className="text-xs text-[var(--muted)]">
                This is what Emotion and styled-components do internally — you
                wouldn&apos;t write it by hand. The tag is removed on unmount and
                before each re-injection.
            </p>
        </div>
    );
}
