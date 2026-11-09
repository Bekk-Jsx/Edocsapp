"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Highlight from "./highlight";

export type Suggestion = {
    id: string;
    kind: "page" | "part" | "title";
    text: string;
    /** The keyword that matched, shown as a chip after the title. */
    keyword?: string;
    /** "Composables › Writing Composables", or "Writing Composables › Conventions". */
    crumb: string;
    href: string;
};

const KIND_LABEL: Record<Suggestion["kind"], string> = {
    page: "Page",
    part: "Part",
    title: "Title",
};

function isTypingField(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    return (
        el.isContentEditable ||
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
    );
}

// Input + suggestion dropdown, as an ARIA combobox. Owns only the dropdown's
// open/active state; the value, the suggestions and what Enter does belong to
// the caller (search-controller.tsx).
export default function SearchBox({
    placeholder,
    value,
    query,
    suggestions,
    loading,
    onValueChange,
    onFirstFocus,
    onSubmit,
    onClear,
    onPick,
}: {
    placeholder: string;
    value: string;
    /** The debounced query the suggestions were computed for (highlighting). */
    query: string;
    suggestions: Suggestion[];
    loading: boolean;
    onValueChange: (value: string) => void;
    onFirstFocus: () => void;
    onSubmit: () => void;
    onClear: () => void;
    onPick: (s: Suggestion) => void;
}) {
    const id = useId();
    const listId = `${id}-list`;
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    const typed = value.trim().length >= 2;
    const showList = open && typed && (loading || suggestions.length > 0);
    const activeIndex = suggestions.findIndex((s) => s.id === activeId);

    // "/" or Ctrl/⌘+K focuses the box — unless the user is typing elsewhere.
    useEffect(() => {
        function onKey(e: globalThis.KeyboardEvent) {
            const slash = e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey;
            const cmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
            if (!slash && !cmdK) return;
            if (isTypingField(e.target) && e.target !== inputRef.current) return;
            e.preventDefault();
            inputRef.current?.focus();
            inputRef.current?.select();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Clicking anywhere outside closes the dropdown.
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    function move(delta: number) {
        if (!suggestions.length) return;
        setOpen(true);
        const next =
            activeIndex === -1
                ? delta > 0
                    ? 0
                    : suggestions.length - 1
                : (activeIndex + delta + suggestions.length) % suggestions.length;
        setActiveId(suggestions[next].id);
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                move(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                move(-1);
                break;
            case "Enter":
                e.preventDefault();
                if (showList && activeIndex >= 0) {
                    setOpen(false);
                    onPick(suggestions[activeIndex]);
                } else {
                    setOpen(false);
                    onSubmit();
                }
                break;
            case "Escape":
                e.preventDefault();
                if (showList) setOpen(false);
                else onClear();
                break;
        }
    }

    return (
        <div ref={rootRef} className="relative">
            <form
                role="search"
                onSubmit={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    onSubmit();
                }}
                className="flex items-center gap-2"
            >
                <div className="relative flex min-w-0 flex-1 items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] transition-colors focus-within:border-[var(--accent)]">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-[var(--muted)]"
                    >
                        <circle cx="11" cy="11" r="6.5" />
                        <path d="m20 20-4.2-4.2" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        role="combobox"
                        aria-label={placeholder}
                        aria-expanded={showList}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={
                            showList && activeIndex >= 0
                                ? `${id}-opt-${activeIndex}`
                                : undefined
                        }
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={placeholder}
                        value={value}
                        onFocus={() => {
                            onFirstFocus();
                            setOpen(true);
                        }}
                        onChange={(e) => {
                            onValueChange(e.target.value);
                            setActiveId(null);
                            setOpen(true);
                        }}
                        onKeyDown={onKeyDown}
                        className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
                    />
                    {value ? (
                        <button
                            type="button"
                            aria-label="clear search"
                            onClick={() => {
                                setOpen(false);
                                onClear();
                                inputRef.current?.focus();
                            }}
                            className="mr-1 cursor-pointer rounded px-1.5 text-lg leading-none text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                        >
                            ×
                        </button>
                    ) : (
                        <kbd
                            aria-hidden="true"
                            className="mr-2 rounded border border-[var(--border)] px-1.5 font-mono text-[0.65rem] text-[var(--muted)]"
                        >
                            /
                        </kbd>
                    )}
                </div>
                <button
                    type="submit"
                    className="cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--text)] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                    Search
                </button>
            </form>

            <ul
                id={listId}
                role="listbox"
                aria-label="suggestions"
                hidden={!showList}
                className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg shadow-black/40"
            >
                {loading && !suggestions.length
                    ? [0, 1, 2].map((i) => (
                          <li key={i} aria-hidden="true" className="px-3 py-2">
                              <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--surface-2)]" />
                              <div className="mt-1.5 h-2 w-1/3 animate-pulse rounded bg-[var(--surface-2)]" />
                          </li>
                      ))
                    : suggestions.map((s, i) => (
                          <li
                              key={s.id}
                              id={`${id}-opt-${i}`}
                              role="option"
                              aria-selected={i === activeIndex}
                              // mousedown, not click: fires before the input's blur
                              onMouseDown={(e) => {
                                  e.preventDefault();
                                  setOpen(false);
                                  onPick(s);
                              }}
                              onMouseEnter={() => setActiveId(s.id)}
                              className={`flex cursor-pointer items-start gap-2.5 px-3 py-2 ${
                                  i === activeIndex ? "bg-[var(--surface-2)]" : ""
                              }`}
                          >
                              <span className="mt-0.5 w-11 shrink-0 rounded border border-[var(--border)] text-center font-mono text-[0.55rem] uppercase tracking-widest text-[var(--muted)]">
                                  {KIND_LABEL[s.kind]}
                              </span>
                              <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text)]">
                                      <Highlight text={s.text} query={query} />
                                      {s.keyword ? (
                                          <code className="code-token rounded px-1.5 py-0.5 font-mono text-[0.7rem]">
                                              <Highlight text={s.keyword} query={query} />
                                          </code>
                                      ) : null}
                                  </span>
                                  <span className="block truncate font-mono text-[0.65rem] text-[var(--muted)]">
                                      {s.crumb}
                                  </span>
                              </span>
                          </li>
                      ))}
            </ul>
        </div>
    );
}
