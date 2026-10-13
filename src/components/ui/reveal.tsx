"use client";

import { useId, useState, type CSSProperties, type ReactNode } from "react";

// Hidden-until-asked panels for an exercise: "show hint" / "show solution".
// Generic on purpose — any exercises page (a chapter's, or a project-wide
// capstone) uses it the same way. Pass either or both; hint always comes first.
//
// The panel contents are rendered on the server (CodeBlock, Callout…) and passed
// through as props, so this client boundary ships only buttons and booleans —
// never Shiki. Do not import CodeBlock here.
//
// LAYOUT: the buttons sit in their own flex row; the panels render BELOW that
// row as plain blocks, never inside it. A panel must not be a flex item: a flex
// item's min-width is `auto`, i.e. its min-content width — the longest line of
// any code inside — so a long line would widen the panel past the section and
// push the page sideways. As a block with w-full + min-w-0, the panel takes the
// section's width and a long line scrolls inside its own CodeBlock instead.
//
// Panels stay in the DOM with `hidden` rather than unmounting, so aria-controls
// always points at a real element. Each opens and closes on its own; state is
// local and nothing is persisted — every visit starts closed.

type Label = "hint" | "solution";

// Same class string as BTN in notes-board.tsx — the codebase's one button look.
const BTN =
    "cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text)] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50";

const PANEL =
    "mt-2 w-full min-w-0 space-y-[0.9rem] rounded-lg border p-4 text-[0.95rem] leading-[1.65] text-[var(--muted)]";

// Tints are color-mix() over runtime vars — inline, as the badges do.
const PANEL_STYLE: Record<Label, CSSProperties> = {
    hint: { borderColor: "var(--border)", background: "var(--surface)" },
    solution: {
        borderColor: "color-mix(in srgb, var(--mint) 40%, var(--surface))",
        background: "color-mix(in srgb, var(--mint) 6%, var(--surface))",
    },
};

export default function Reveal({
    hint,
    solution,
}: {
    hint?: ReactNode;
    solution?: ReactNode;
}) {
    const baseId = useId();
    const [open, setOpen] = useState<Record<Label, boolean>>({
        hint: false,
        solution: false,
    });

    const items = (
        [
            ["hint", hint],
            ["solution", solution],
        ] as const
    ).filter(([, content]) => content !== undefined);

    const panelId = (label: Label) => `${baseId}-${label}`;
    const toggle = (label: Label) =>
        setOpen((o) => ({ ...o, [label]: !o[label] }));

    return (
        <div className="w-full min-w-0">
            <div className="flex flex-wrap gap-2">
                {items.map(([label]) => (
                    <button
                        key={label}
                        type="button"
                        className={BTN}
                        aria-expanded={open[label]}
                        aria-controls={panelId(label)}
                        onClick={() => toggle(label)}
                    >
                        {open[label] ? "hide" : "show"} {label}
                    </button>
                ))}
            </div>
            {items.map(([label, content]) => (
                <div
                    key={label}
                    id={panelId(label)}
                    hidden={!open[label]}
                    className={`${PANEL} ${label === "hint" ? "border-dashed" : ""}`}
                    style={PANEL_STYLE[label]}
                >
                    {label === "solution" ? (
                        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--mint)]">
                            solution
                        </p>
                    ) : null}
                    {content}
                </div>
            ))}
        </div>
    );
}
