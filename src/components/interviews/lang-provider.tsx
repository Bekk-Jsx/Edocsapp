"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { LANG_COOKIE, Text, otherLang, type Lang } from "./inline";
import type { LocalizedText } from "@/server/schema";

// ===================================================================
// LANG — the global EN/DE choice and the per-section overrides.
//
// Both language versions of every section are rendered ON THE SERVER, each as
// its own subtree, and these client components only decide which one is
// shown. So Shiki, the block renderer and the whole tree stay server-side,
// switching is instant, and no text is fetched twice.
//
// The global choice is remembered in the `interviews_lang` cookie, READ ON THE
// SERVER (see the interviews layout), so the first paint is already in the
// right language — there is no flash.
//
// Per-section overrides are client state only: deliberately not persisted, so
// a reload returns to one consistent language.
// ===================================================================

// LANG_COOKIE is imported from ./inline and deliberately NOT re-exported: a
// server component importing it from this "use client" module would get a
// client reference instead of the string. See the note on its definition.

type LangContext = {
    /** The page-wide language. */
    lang: Lang;
    /** Section ids currently flipped to the other language. */
    overrides: Record<string, boolean>;
    /** Sets the page language AND clears every override. */
    setLang: (lang: Lang) => void;
    /** Flips one section to the other language, or back. */
    toggleSection: (sectionId: string) => void;
};

const Ctx = createContext<LangContext | null>(null);

export function useLang(): LangContext {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
    return ctx;
}

/** The language a given section is showing right now. */
export function useSectionLang(sectionId?: string): Lang {
    const { lang, overrides } = useLang();
    if (!sectionId) return lang;
    return overrides[sectionId] ? otherLang(lang) : lang;
}

export default function LangProvider({
    initialLang,
    children,
}: {
    /** Resolved from the cookie on the server. */
    initialLang: Lang;
    children: ReactNode;
}) {
    const [lang, setLangState] = useState<Lang>(initialLang);
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});

    const setLang = useCallback((next: Lang) => {
        setLangState(next);
        // A new global choice supersedes every per-section exception.
        setOverrides({});
        // Lax + a year: it is a display preference, read on the next request so
        // the server can render the right language first time.
        document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    }, []);

    const toggleSection = useCallback((sectionId: string) => {
        setOverrides((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    }, []);

    const value = useMemo(
        () => ({ lang, overrides, setLang, toggleSection }),
        [lang, overrides, setLang, toggleSection],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Shows one of two server-rendered subtrees.
 *
 * Both are in the DOM; the inactive one carries `hidden`, which also takes it
 * out of the accessibility tree and out of find-in-page.
 */
export function LangPair({
    sectionId,
    en,
    de,
}: {
    /** Omit for page-level text, which no section override applies to. */
    sectionId?: string;
    en: ReactNode;
    de: ReactNode;
}) {
    const lang = useSectionLang(sectionId);
    return (
        <>
            <div hidden={lang !== "en"}>{en}</div>
            <div hidden={lang !== "de"}>{de}</div>
        </>
    );
}

/**
 * A rail card's title, in the language ITS section is showing.
 *
 * The rail used to be rendered twice, once per language, which meant a card
 * could only follow the GLOBAL switch — a per-section override left its card
 * in the other language. One card that reads the section's language itself
 * fixes that and halves the rail's DOM (and its scroll spies) at the same
 * time.
 */
export function RailCardTitle({
    sectionId,
    text,
}: {
    sectionId: string;
    text: LocalizedText;
}) {
    const lang = useSectionLang(sectionId);
    return <Text text={text} lang={lang} />;
}

/** The same, inline — for a heading or a lead, where a <div> would break flow. */
export function LangText({
    sectionId,
    en,
    de,
}: {
    sectionId?: string;
    en: ReactNode;
    de: ReactNode;
}) {
    const lang = useSectionLang(sectionId);
    return (
        <>
            <span hidden={lang !== "en"}>{en}</span>
            <span hidden={lang !== "de"}>{de}</span>
        </>
    );
}
