"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
    addPhrase,
    editPhrase,
    removePhrase,
} from "@/server/phrasebook-actions";
import type { Phrase } from "@/server/phrasebook";
import type { PhraseLink } from "@/server/schema";
import ListenButton from "./listen-button";

// ===================================================================
// PHRASEBOOK BOARD — the EN/DE pairs, grouped and linked exactly as the
// interview notes were.
//
// A phrase is one SLIM ROW, not a card: EN and DE side by side on a wide
// screen, stacked on a narrow one, each with its own 🔊 pinned to its own
// language. Rows are divided by hairlines rather than boxed, so a page of
// them stays scannable.
//
// The form is the same flow the note form had: ?add=1 opens it prefilled from
// the question that was being read, saving or cancelling closes it and drops
// the params. Two fields only — English and Deutsch, both required, both
// typed by hand.
// ===================================================================

/** Phrases whose page is unknown land here, as notes did. */
const OTHER = "Other";

export type PhrasebookGroup = {
    /** The item's name, e.g. "Full-Stack Questions". */
    label: string;
    /** Its pages, in sidebar order: slug + display name. */
    pages: { slug: string; name: string }[];
};

const FIELD =
    "w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:outline-none";
const LABEL =
    "mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]";
const BTN =
    "rounded-md border px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1";

function IconButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            // Quiet until the row is hovered or focused; .phrase-tool keeps it
            // visible where there is no hover at all (touch).
            className="phrase-tool inline-flex h-[1.2em] w-[1.2em] shrink-0 items-center justify-center rounded text-[var(--muted)] opacity-0 transition-[color,opacity] duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100 hover:text-[var(--accent)] focus-visible:opacity-100 focus-visible:text-[var(--accent)] focus-visible:outline-none"
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-full w-full"
            >
                {children}
            </svg>
        </button>
    );
}

/** One language's text plus its own listen button. */
function Side({
    phrase,
    lang,
}: {
    phrase: Phrase;
    lang: "en" | "de";
}) {
    const text = { en: phrase.en, de: phrase.de };
    return (
        <div className="flex min-w-0 items-start gap-1.5">
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)] pt-[0.3em]">
                {lang}
            </span>
            <span className="min-w-0 flex-1 text-[0.9rem] leading-[1.6] text-[var(--text)]">
                {lang === "en" ? phrase.en : phrase.de}
            </span>
            {/* `lang` pins it: the EN side always speaks English, the DE side
                always German, whatever the page is set to — and no section
                context is consulted, so it works wherever phrases are listed.
                NOT `subtle`: hearing a phrase is the point of the phrasebook,
                so the button is always visible rather than hover-revealed. */}
            <ListenButton
                speechKey={`phrase:${phrase.id}:${lang}`}
                what={lang === "en" ? "English phrase" : "German phrase"}
                text={text}
                lang={lang}
            />
        </div>
    );
}

function Row({
    phrase,
    onEdit,
    onDelete,
}: {
    phrase: Phrase;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="group/row border-b border-[var(--border)] py-2 last:border-b-0">
            {/* Two columns once there is room; stacked below that. */}
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                <Side phrase={phrase} lang="en" />
                <Side phrase={phrase} lang="de" />
            </div>
            <div className="mt-0.5 flex items-center gap-2">
                <Link
                    href={phrase.link.href}
                    className="font-mono text-[0.62rem] text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
                >
                    {phrase.link.entry ?? phrase.link.page} →
                </Link>
                <span className="flex-1" />
                <IconButton label="edit phrase" onClick={onEdit}>
                    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                    <path d="M13.5 6.5l4 4" />
                </IconButton>
                <IconButton label="delete phrase" onClick={onDelete}>
                    <path d="M4 7h16" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M8 7V5h8v2" />
                    <path d="M19 7l-1 14H6L5 7" />
                </IconButton>
            </div>
        </div>
    );
}

export default function PhrasebookBoard({
    initialPhrases,
    groups,
}: {
    initialPhrases: Phrase[];
    groups: PhrasebookGroup[];
}) {
    const router = useRouter();
    const params = useSearchParams();
    const [phrases, setPhrases] = useState<Phrase[]>(initialPhrases);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [editing, setEditing] = useState<string | null>(null);
    const [en, setEn] = useState("");
    const [de, setDe] = useState("");

    // The add button on a question section arrives with ?add=1 and the anchor
    // it came from — the same contract the note form had.
    //
    // Whether the add form is open is DERIVED from the URL rather than mirrored
    // into state: closing it drops the params, which closes the form, so the
    // two can never disagree and clicking another section's button always
    // reopens it. (Editing is local, because it has no URL of its own.)
    const open = editing !== null || params.get("add") === "1";

    const linkFromParams = (): PhraseLink | null => {
        const href = params.get("link");
        const item = params.get("item");
        const page = params.get("hookSlug");
        if (!href || !item || !page) return null;
        const entry = href.includes("#") ? href.split("#")[1] : undefined;
        return { item, page, href, ...(entry ? { entry } : {}) };
    };

    const close = () => {
        setEditing(null);
        setEn("");
        setDe("");
        setError(null);
        // replace(), not push(): backing out must not walk through the form.
        if (params.toString()) router.replace("/interviews/notes");
    };

    async function save() {
        setBusy(true);
        setError(null);
        if (editing) {
            const result = await editPhrase({ id: editing, en, de });
            if (!result.ok) {
                setError(result.error);
                setBusy(false);
                return;
            }
            setPhrases((prev) =>
                prev.map((p) =>
                    p.id === editing ? { ...p, en: en.trim(), de: de.trim() } : p,
                ),
            );
        } else {
            const link = linkFromParams();
            if (!link) {
                setError("Open the form from a question to attach the phrase.");
                setBusy(false);
                return;
            }
            const result = await addPhrase({ en, de, link });
            if (!result.ok) {
                setError(result.error);
                setBusy(false);
                return;
            }
            setPhrases((prev) => [...prev, result.phrase]);
        }
        setBusy(false);
        close();
    }

    async function remove(id: string) {
        const previous = phrases;
        setPhrases((prev) => prev.filter((p) => p.id !== id));
        const result = await removePhrase(id);
        if (!result.ok) {
            setPhrases(previous);
            setError(result.error);
        }
    }

    const byPage = new Map<string, Phrase[]>();
    for (const phrase of phrases) {
        const list = byPage.get(phrase.link.page);
        if (list) list.push(phrase);
        else byPage.set(phrase.link.page, [phrase]);
    }

    // Pages that no group knows about still get shown, under "Other".
    const known = new Set(groups.flatMap((g) => g.pages.map((p) => p.slug)));
    const orphans = phrases.filter((p) => !known.has(p.link.page));

    return (
        <div>
            {open ? (
                <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className={LABEL} htmlFor="phrase-en">
                                English
                            </label>
                            <input
                                id="phrase-en"
                                value={en}
                                onChange={(e) => setEn(e.target.value)}
                                placeholder="Authentication"
                                className={FIELD}
                            />
                        </div>
                        <div>
                            <label className={LABEL} htmlFor="phrase-de">
                                Deutsch
                            </label>
                            <input
                                id="phrase-de"
                                value={de}
                                onChange={(e) => setDe(e.target.value)}
                                placeholder="Authentifizierung"
                                className={FIELD}
                            />
                        </div>
                    </div>
                    {error ? (
                        <p
                            role="status"
                            className="mt-2 font-mono text-[0.7rem] text-[var(--amber)]"
                        >
                            {error}
                        </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={busy || !en.trim() || !de.trim()}
                            className={`${BTN} border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--surface)] focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40`}
                        >
                            {busy ? "Saving…" : editing ? "Save" : "Add"}
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className={`${BTN} border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] focus-visible:ring-[var(--border)]`}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : null}

            {!open && error ? (
                <p
                    role="status"
                    className="mb-4 font-mono text-[0.7rem] text-[var(--amber)]"
                >
                    {error}
                </p>
            ) : null}

            {!phrases.length ? (
                <p className="font-mono text-sm text-[var(--muted)]">
                    No phrases yet. Use the 🔊-adjacent button on a question to add
                    one.
                </p>
            ) : null}

            {/* Grouped exactly as the notes were: one block per item, then its
                pages in sidebar order. */}
            {groups.map((group) => {
                const pages = group.pages.filter(
                    (p) => (byPage.get(p.slug)?.length ?? 0) > 0,
                );
                if (!pages.length) return null;
                return (
                    <section key={group.label} className="mt-8 first:mt-0">
                        <div className="mb-3 flex items-center gap-2">
                            <span
                                aria-hidden="true"
                                className="inline-block h-[14px] w-[2px] shrink-0 rounded-full bg-[var(--accent)]"
                            />
                            <h2 className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">
                                {group.label}
                            </h2>
                        </div>
                        {pages.map((page) => (
                            <div key={page.slug} className="mb-5">
                                <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                                    {page.name}
                                </p>
                                <div>
                                    {(byPage.get(page.slug) ?? []).map((phrase) => (
                                        <Row
                                            key={phrase.id}
                                            phrase={phrase}
                                            onEdit={() => {
                                                setEditing(phrase.id);
                                                setEn(phrase.en);
                                                setDe(phrase.de);
                                            }}
                                            onDelete={() => void remove(phrase.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </section>
                );
            })}

            {orphans.length ? (
                <section className="mt-8">
                    <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                        {OTHER}
                    </p>
                    <div>
                        {orphans.map((phrase) => (
                            <Row
                                key={phrase.id}
                                phrase={phrase}
                                onEdit={() => {
                                    setEditing(phrase.id);
                                    setEn(phrase.en);
                                    setDe(phrase.de);
                                }}
                                onDelete={() => void remove(phrase.id)}
                            />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
