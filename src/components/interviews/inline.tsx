import type { ReactNode } from "react";
import type { LocalizedText } from "@/server/schema";

// ===================================================================
// INLINE — the tiny markup every text field understands, and the
// English/German resolution that sits in front of it.
//
//   `code`          -> inline code token
//   **bold**        -> <strong>
//   [label](url)    -> link (external ones open in a new tab)
//
// Parsed into React elements, never injected: there is no
// dangerouslySetInnerHTML in this renderer. Anything that is not one of the
// three patterns stays plain text, so a stray * or ] is shown, not swallowed.
// ===================================================================

export type Lang = "en" | "de";

export const otherLang = (lang: Lang): Lang => (lang === "en" ? "de" : "en");

/**
 * The cookie holding the global content language.
 *
 * It lives HERE, in a server-safe module, and deliberately not in
 * lang-provider.tsx: anything exported from a "use client" module reaches a
 * Server Component as a client REFERENCE, not as its value. Reading the cookie
 * with such a reference silently returns undefined — the layout looked up a
 * proxy object instead of the string "interviews_lang", so German never
 * survived a reload.
 */
export const LANG_COOKIE = "interviews_lang";

/** Parses the cookie value, defaulting to English. */
export function langFromCookie(value: string | undefined): Lang {
    return value === "de" ? "de" : "en";
}

/**
 * The text for a language, plus whether it fell back to English.
 * German is written later, so a missing `de` is normal, not an error.
 */
export function resolve(
    text: LocalizedText,
    lang: Lang,
): { value: string; fallback: boolean } {
    if (lang === "de") {
        if (text.de !== undefined) return { value: text.de, fallback: false };
        return { value: text.en, fallback: true };
    }
    return { value: text.en, fallback: false };
}

// One pass, three alternatives. Code comes first in the alternation so that
// backticked content is taken literally — `**not bold**` stays as written.
const TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

const CODE_CLASS =
    "code-token rounded px-1.5 py-0.5 font-mono text-[0.85em]";

/**
 * The same markup, reduced to the words a reader would say out loud:
 * `code` -> code, **bold** -> bold, [label](url) -> label (the URL is dropped).
 *
 * It lives beside the parser on purpose — speech and rendering must agree on
 * what the markup means, and one regex is the only way to guarantee that.
 */
export function plainText(value: string): string {
    return value.replace(
        new RegExp(TOKEN),
        (_match, code?: string, bold?: string, label?: string) =>
            code ?? bold ?? label ?? "",
    );
}

/** True for anything that leaves the app. */
function isExternal(url: string): boolean {
    return /^(https?:)?\/\//.test(url) || url.startsWith("mailto:");
}

/** Renders one string of inline markup. */
export function Inline({ text }: { text: string }): ReactNode {
    const out: ReactNode[] = [];
    let last = 0;
    let key = 0;

    // `matchAll` needs the regex to be stateless per call, so it is rebuilt.
    for (const match of text.matchAll(new RegExp(TOKEN))) {
        const at = match.index;
        if (at === undefined) continue;
        if (at > last) out.push(text.slice(last, at));

        const [whole, code, bold, label, url] = match;
        if (code !== undefined) {
            out.push(
                <code key={key++} className={CODE_CLASS}>
                    {code}
                </code>,
            );
        } else if (bold !== undefined) {
            out.push(<strong key={key++}>{bold}</strong>);
        } else if (label !== undefined && url !== undefined) {
            const external = isExternal(url);
            out.push(
                <a
                    key={key++}
                    href={url}
                    {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    className="text-[var(--accent)] underline decoration-[var(--border)] underline-offset-2 transition-colors hover:decoration-[var(--accent)]"
                >
                    {label}
                </a>,
            );
        }
        last = at + whole.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

/** The muted marker shown beside text that has no translation yet. */
export function FallbackMark() {
    return (
        <span
            title="No German translation yet — showing English"
            className="ml-1.5 inline-block align-[0.1em] rounded border border-[var(--border)] px-1 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]"
        >
            en
        </span>
    );
}

/**
 * A localized string: resolved for `lang`, rendered with inline markup, and
 * marked "EN" when it fell back.
 */
export function Text({
    text,
    lang,
}: {
    text: LocalizedText;
    lang: Lang;
}): ReactNode {
    const { value, fallback } = resolve(text, lang);
    return (
        <>
            <Inline text={value} />
            {fallback ? <FallbackMark /> : null}
        </>
    );
}

/** Plain resolved string, for attributes (alt, title) that take no elements. */
export function plain(text: LocalizedText, lang: Lang): string {
    return resolve(text, lang).value;
}
