"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { Lang } from "./inline";

// ===================================================================
// CODE COLLAPSE — "Show code" / "Hide code" for one code block.
//
// An interview answer is meant to be said out loud; the code is the backup
// you look at only if you want it. So it starts hidden.
//
// The highlighted markup is still rendered on the server (Shiki, inside
// CodeBlock) and passed in as children — toggling only flips `hidden`, so
// revealing is instant, nothing is fetched, and nothing is highlighted in the
// browser.
//
// OPEN STATE IS SHARED, NOT LOCAL. Every section is rendered twice, once per
// language, and only one copy is visible. With local state the two copies
// disagreed, so opening the code in English and then switching to German
// showed it closed again. Both copies now read one store keyed by the block's
// position, which is identical in both subtrees — so the language switch
// leaves every code block exactly as the reader left it.
// ===================================================================

type CodeOpenContext = {
    open: Record<string, boolean>;
    toggle: (id: string) => void;
};

const Ctx = createContext<CodeOpenContext | null>(null);

/** Holds which code blocks are open, for one page. */
export function CodeOpenProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState<Record<string, boolean>>({});
    const toggle = useCallback((id: string) => {
        setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);
    const value = useMemo(() => ({ open, toggle }), [open, toggle]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The UI labels. Translated along with the content they sit beside. */
const LABEL: Record<Lang, { show: string; hide: string }> = {
    en: { show: "Show code", hide: "Hide code" },
    de: { show: "Code anzeigen", hide: "Code ausblenden" },
};

export default function CodeCollapse({
    /**
     * Stable across both language copies of the same block — that is what
     * keeps them in step. Falsy would make every block share one state, so
     * callers must pass a real one.
     */
    id,
    /** The subtree's language; only the visible copy's labels are ever read. */
    lang,
    /** The server-rendered <CodeBlock>. */
    children,
    /** Shown under the code, only while it is open. */
    caption,
}: {
    id: string;
    lang: Lang;
    children: ReactNode;
    caption?: ReactNode;
}) {
    const shared = useContext(Ctx);
    // Outside a provider each block keeps its own state: still correct on its
    // own, it just cannot stay in step across a language switch.
    const [local, setLocal] = useState(false);
    const open = shared ? shared.open[id] === true : local;
    const onToggle = () => (shared ? shared.toggle(id) : setLocal(!local));

    const label = open ? LABEL[lang].hide : LABEL[lang].show;

    return (
        <div>
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-widest text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-[0.9em] w-[0.9em] shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                        open ? "rotate-0" : "-rotate-90"
                    }`}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
                {label}
            </button>

            <div hidden={!open} className="mt-2">
                {children}
                {caption}
            </div>
        </div>
    );
}
