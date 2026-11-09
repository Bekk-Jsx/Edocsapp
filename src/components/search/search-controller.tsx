"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { loadIndex } from "@/search/load";
import { MIN_QUERY, prepareQuery } from "@/search/match";
import { loadNotes, searchNotes, type Note } from "@/search/notes";
import { didYouMean, groupByPage, LIMITS, searchHits } from "@/search/query";
import type { SearchHit, SearchIndex } from "@/search/types";
import SearchBox, { type Suggestion } from "./search-box";
import NoteResult from "./results/note-result";
import PageResult from "./results/page-result";
import PartResult from "./results/part-result";
import TitleResult from "./results/title-result";

const DEBOUNCE_MS = 120;
const FLASH_MS = 1200;

/**
 * Scrolls a section into view (its scroll-margin-top clears the top of the
 * viewport) and flashes it. Same animation as `.doc-section:target`, applied by
 * class because client-side navigation never updates :target.
 */
export function arrive(id: string, scroll = true) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (scroll) el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    el.classList.remove("search-arrive");
    void el.offsetWidth; // restart the animation if it is already running
    el.classList.add("search-arrive");
    window.setTimeout(() => el.classList.remove("search-arrive"), FLASH_MS);
}

function crumbFor(hit: SearchHit, scopedToPage: boolean): string {
    if (hit.kind === "page") return hit.page.chapter;
    if (hit.kind === "part") return scopedToPage ? hit.page.name : `${hit.page.chapter} › ${hit.page.name}`;
    const part = hit.part?.name;
    if (scopedToPage) return part || hit.page.name;
    return part ? `${hit.page.name} › ${part}` : hit.page.name;
}

export default function SearchController({
    project,
    pageSlug,
    placeholder,
    onActiveChange,
}: {
    project: string;
    /** Set for page search: results are scoped to this page. */
    pageSlug?: string;
    placeholder: string;
    onActiveChange: (active: boolean) => void;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const urlQuery = params.get("q") ?? "";

    const [value, setValue] = useState(urlQuery);
    const [debounced, setDebounced] = useState(urlQuery);
    // The query whose results are on screen. Follows ?q=, but is set locally
    // first so showing/hiding never waits for the router.
    const [shown, setShown] = useState(urlQuery);
    const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
    const [wanted, setWanted] = useState(false);
    const [index, setIndex] = useState<SearchIndex | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [notes, setNotes] = useState<Note[] | null>(null);
    // Section to scroll to once the cleared search has been committed and the
    // sections are laid out again (see go()).
    const pendingArrive = useRef<string | null>(null);

    // ?q= changed (Back/Forward, refresh, or our own replace landing): follow
    // it. `seenUrlQuery` tracks the URL only — never set it locally, or the
    // next render sees a mismatch and restores the old query.
    if (urlQuery !== seenUrlQuery) {
        setSeenUrlQuery(urlQuery);
        setShown(urlQuery);
        setValue(urlQuery);
        setDebounced(urlQuery);
    }

    const active = shown.trim().length >= MIN_QUERY;
    const needIndex = wanted || active;
    const loading = needIndex && !index && !loadError;

    useEffect(() => onActiveChange(active), [active, onActiveChange]);

    // After every commit: if a same-page jump is waiting, the DOM now shows
    // the sections again, so scroll positions are final.
    useEffect(() => {
        const id = pendingArrive.current;
        if (!id) return;
        pendingArrive.current = null;
        arrive(id);
    });

    useEffect(() => {
        if (!needIndex || index) return;
        let live = true;
        loadIndex(project)
            .then((i) => live && setIndex(i))
            .catch(() => live && setLoadError(true));
        return () => {
            live = false;
        };
    }, [needIndex, index, project]);

    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(value), DEBOUNCE_MS);
        return () => window.clearTimeout(t);
    }, [value]);

    // Notes are read live on every search, never cached in the index.
    useEffect(() => {
        if (!active) return;
        let live = true;
        loadNotes(project)
            .then((n) => live && setNotes(n))
            .catch(() => live && setNotes([]));
        return () => {
            live = false;
        };
    }, [active, shown, project]);

    const suggestions = useMemo<Suggestion[]>(() => {
        const q = prepareQuery(debounced);
        if (!index || !q) return [];
        return searchHits(index, q, pageSlug)
            .slice(0, LIMITS.suggestions)
            .map((h) => ({
                id: `${h.kind}:${h.href}:${h.text}`,
                kind: h.kind,
                text: h.text,
                keyword: h.keyword,
                crumb: crumbFor(h, Boolean(pageSlug)),
                href: h.href,
            }));
    }, [index, debounced, pageSlug]);

    const results = useMemo(() => {
        const q = prepareQuery(shown);
        if (!index || !q) return null;
        const hits = searchHits(index, q, pageSlug);
        const noteHits = notes ? searchNotes(notes, q, index, pageSlug).slice(0, LIMITS.notes) : [];
        if (pageSlug) {
            const flat = hits.slice(0, LIMITS.pageHits);
            return {
                groups: null,
                flat,
                noteHits,
                count: flat.length + noteHits.length,
                correction: hits.length || noteHits.length ? null : didYouMean(index, q, pageSlug),
            };
        }
        const groups = groupByPage(hits);
        const count = groups.reduce((n, g) => n + (g.pageHit ? 1 : 0) + g.hits.length, 0) + noteHits.length;
        return {
            groups,
            flat: null,
            noteHits,
            count,
            correction: hits.length || noteHits.length ? null : didYouMean(index, q),
        };
    }, [index, shown, notes, pageSlug]);

    function setUrl(q: string, hash = "") {
        const url = q ? `${pathname}?q=${encodeURIComponent(q)}${hash}` : `${pathname}${hash}`;
        router.replace(url, { scroll: false });
    }

    function submit(raw = value) {
        const q = raw.trim();
        if (!q) return clear();
        if (q.length < MIN_QUERY) return;
        setValue(q);
        setShown(q);
        setUrl(q);
    }

    function clear() {
        setValue("");
        setDebounced("");
        setShown("");
        if (urlQuery) setUrl("");
    }

    // Same-page anchor: drop the search (so the sections are visible again),
    // then — after that commit — scroll and flash. Anything else is an ordinary navigation, and the
    // destination page flashes the section itself on arrival (see PageSearch).
    function go(href: string): boolean {
        const url = new URL(href, window.location.origin);
        if (url.pathname !== window.location.pathname || !url.hash) return false;
        pendingArrive.current = decodeURIComponent(url.hash.slice(1));
        setValue("");
        setDebounced("");
        setShown("");
        onActiveChange(false);
        // Native history rather than a router navigation, so Next does not run
        // its own scroll-to-hash alongside arrive(). Next keeps
        // useSearchParams in sync with history.replaceState.
        window.history.replaceState(null, "", `${pathname}${url.hash}`);
        return true;
    }

    function onResultClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (go(href)) e.preventDefault();
    }

    function pick(s: Suggestion) {
        if (!go(s.href)) router.push(s.href);
    }

    return (
        <div>
            <SearchBox
                placeholder={placeholder}
                value={value}
                query={debounced}
                suggestions={suggestions}
                loading={loading}
                onValueChange={setValue}
                onFirstFocus={() => setWanted(true)}
                onSubmit={() => submit()}
                onClear={clear}
                onPick={pick}
            />

            {active ? (
                <section aria-live="polite" className="mt-6 space-y-4">
                    {loadError ? (
                        <p className="font-mono text-xs text-[var(--danger)]">
                            Search index could not be loaded.
                        </p>
                    ) : !results ? (
                        <div aria-hidden="true" className="space-y-3">
                            {[0, 1].map((i) => (
                                <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--surface)]" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <p className="font-mono text-xs text-[var(--muted)]">
                                {results.count ? (
                                    <>
                                        <span className="text-[var(--text)]">{results.count}</span>{" "}
                                        result{results.count === 1 ? "" : "s"} for &ldquo;{shown}&rdquo;
                                    </>
                                ) : (
                                    <>No match for &ldquo;{shown}&rdquo;</>
                                )}
                            </p>
                            {!results.count && results.correction ? (
                                <p className="text-sm text-[var(--muted)]">
                                    Did you mean{" "}
                                    <a
                                        href={`${pathname}?q=${encodeURIComponent(results.correction)}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            submit(results.correction ?? "");
                                        }}
                                        className="font-mono text-[var(--accent)] underline-offset-2 hover:underline"
                                    >
                                        {results.correction}
                                    </a>
                                    ?
                                </p>
                            ) : null}

                            {results.groups?.map((g) => (
                                <PageResult key={g.page.slug} page={g.page} query={shown} onNavigate={onResultClick}>
                                    {g.hits.length
                                        ? g.hits.map((h) =>
                                              h.kind === "part" ? (
                                                  <PartResult key={`${h.kind}:${h.href}`} hit={h} query={shown} onNavigate={onResultClick} />
                                              ) : (
                                                  <TitleResult
                                                      key={`${h.kind}:${h.href}`}
                                                      hit={h}
                                                      query={shown}
                                                      crumb={h.part?.name || undefined}
                                                      onNavigate={onResultClick}
                                                  />
                                              ),
                                          )
                                        : null}
                                </PageResult>
                            ))}

                            {results.flat?.length ? (
                                <div className="space-y-1">
                                    {results.flat.map((h) =>
                                        h.kind === "part" ? (
                                            <PartResult key={`${h.kind}:${h.href}`} hit={h} query={shown} onNavigate={onResultClick} />
                                        ) : (
                                            <TitleResult
                                                key={`${h.kind}:${h.href}`}
                                                hit={h}
                                                query={shown}
                                                crumb={h.part?.name || undefined}
                                                onNavigate={onResultClick}
                                            />
                                        ),
                                    )}
                                </div>
                            ) : null}

                            {results.noteHits.length ? (
                                <div className="space-y-2 pt-2">
                                    <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                                        Your notes
                                    </p>
                                    {results.noteHits.map((n) => (
                                        <NoteResult key={n.note.id} hit={n} query={shown} onNavigate={onResultClick} />
                                    ))}
                                </div>
                            ) : null}
                        </>
                    )}
                </section>
            ) : null}
        </div>
    );
}
