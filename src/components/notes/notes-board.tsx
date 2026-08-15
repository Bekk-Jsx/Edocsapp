"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Note } from "@/lib/notes-store";

// One chapter of the project's registry, flattened to what the board needs.
// The page builds this from hooksByChapter() / topicsByChapter(), so the notes
// come out grouped in exactly the navbar's order without this component
// importing either project.
export type NotesChapter = {
    label: string;
    items: { slug: string; name: string }[];
};

// Notes whose hookSlug is empty — or points at a hook that no longer exists —
// collect here, and this pseudo-chapter always sorts last.
const OTHER = "Other";

const DATE = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

type FormState = {
    id: string | null; // null = add, otherwise edit
    title: string;
    description: string;
    link: string;
    titleDe: string;
    descriptionDe: string;
    hookSlug: string;
};

const EMPTY: FormState = {
    id: null,
    title: "",
    description: "",
    link: "",
    titleDe: "",
    descriptionDe: "",
    hookSlug: "",
};

const BTN =
    "cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text)] transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50";
// Backing out is destructive-adjacent, so cancel takes the danger colour on
// hover. Spelled out rather than composed from BTN: two competing
// hover:border-* utilities would be settled by stylesheet order, not by the
// order they appear in the class attribute.
const BTN_CANCEL =
    "cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-xs text-[var(--text)] transition-colors duration-150 hover:border-[var(--danger)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] disabled:opacity-50";
const FIELD =
    "w-full rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors duration-150 focus:border-[var(--accent)]";
const LABEL =
    "mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]";

export default function NotesBoard({
    project,
    chapters,
    initialNotes,
}: {
    project: string;
    chapters: NotesChapter[];
    initialNotes: Note[];
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    // Seeded by the server so the list is painted on first render; every later
    // read comes back through GET /api/notes/:project via `load()`.
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    // ?add=1 opens the form already filled in — the entry point the notepad
    // icon on a doc section uses. Read once, as initial state: the reader may
    // close the form, and re-reading the URL would keep reopening it.
    const [form, setForm] = useState<FormState | null>(() =>
        searchParams.get("add") === "1"
            ? {
                  ...EMPTY,
                  hookSlug: searchParams.get("hookSlug") ?? "",
                  link: searchParams.get("link") ?? "",
              }
            : null,
    );

    // Closing the form also drops ?add=1&hookSlug=…&link=… — the params exist to
    // open it, so leaving them behind would reopen it on the next visit and
    // leave a stale link in the address bar. replace(), not push(): backing out
    // of a form is not a step worth putting in history.
    const closeForm = useCallback(() => {
        setForm(null);
        if (searchParams.toString()) router.replace(pathname);
    }, [router, pathname, searchParams]);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/notes/${project}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setNotes((await res.json()) as Note[]);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not load notes");
        }
    }, [project]);

    async function save() {
        if (!form || !form.title.trim()) return;
        setSaving(true);
        const body = {
            title: form.title,
            description: form.description,
            link: form.link,
            titleDe: form.titleDe,
            descriptionDe: form.descriptionDe,
            hookSlug: form.hookSlug,
        };
        try {
            const res = await fetch(
                form.id
                    ? `/api/notes/${project}/${form.id}`
                    : `/api/notes/${project}`,
                {
                    method: form.id ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            // Same reasoning as cancelling: once the note exists, the params
            // that opened the form would only reopen it prefilled.
            closeForm();
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save note");
        } finally {
            setSaving(false);
        }
    }

    async function remove(id: string) {
        setConfirmId(null);
        try {
            const res = await fetch(`/api/notes/${project}/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete note");
        }
    }

    // slug -> notes, plus the leftovers. Recomputed only when the list or the
    // registry changes, and the registry never changes for a given page.
    const { byHook, other } = useMemo(() => {
        const known = new Set(
            chapters.flatMap((c) => c.items.map((i) => i.slug)),
        );
        const map = new Map<string, Note[]>();
        const rest: Note[] = [];
        for (const note of notes) {
            if (note.hookSlug && known.has(note.hookSlug)) {
                const list = map.get(note.hookSlug);
                if (list) list.push(note);
                else map.set(note.hookSlug, [note]);
            } else {
                rest.push(note);
            }
        }
        return { byHook: map, other: rest };
    }, [notes, chapters]);

    const total = notes.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    className={BTN}
                    onClick={() => (form ? closeForm() : setForm({ ...EMPTY }))}
                >
                    {form ? "close form" : "+ add note"}
                </button>
                <span className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--muted)]">
                    {total} note{total === 1 ? "" : "s"}
                </span>
            </div>

            {error ? (
                <p className="rounded-md border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] px-3 py-2 font-mono text-xs text-[var(--danger)]">
                    {error}
                </p>
            ) : null}

            {form ? (
                <NoteForm
                    form={form}
                    chapters={chapters}
                    saving={saving}
                    onChange={setForm}
                    onCancel={closeForm}
                    onSave={save}
                />
            ) : null}

            {total === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                    No notes yet. Add one here, or use the note icon beside any
                    section title.
                </p>
            ) : null}

            {/* Registry order, and a heading only where there is something under
                it — an empty chapter or hook prints nothing at all. */}
            {chapters.map((chapter) => {
                const hooks = chapter.items
                    .map((item) => ({ ...item, notes: byHook.get(item.slug) ?? [] }))
                    .filter((h) => h.notes.length > 0);
                if (!hooks.length) return null;

                return (
                    <section key={chapter.label} className="space-y-4">
                        <ChapterHeading>{chapter.label}</ChapterHeading>
                        {hooks.map((hook) => (
                            <div key={hook.slug} className="space-y-2">
                                <HookHeading>{hook.name}</HookHeading>
                                {hook.notes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        confirming={confirmId === note.id}
                                        onEdit={() =>
                                            setForm({
                                                id: note.id,
                                                title: note.title,
                                                description: note.description ?? "",
                                                link: note.link ?? "",
                                                titleDe: note.titleDe ?? "",
                                                descriptionDe:
                                                    note.descriptionDe ?? "",
                                                hookSlug: note.hookSlug ?? "",
                                            })
                                        }
                                        onAskDelete={() => setConfirmId(note.id)}
                                        onCancelDelete={() => setConfirmId(null)}
                                        onDelete={() => remove(note.id)}
                                    />
                                ))}
                            </div>
                        ))}
                    </section>
                );
            })}

            {other.length ? (
                <section className="space-y-4">
                    <ChapterHeading>{OTHER}</ChapterHeading>
                    <div className="space-y-2">
                        {other.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                confirming={confirmId === note.id}
                                onEdit={() =>
                                    setForm({
                                        id: note.id,
                                        title: note.title,
                                        description: note.description ?? "",
                                        link: note.link ?? "",
                                        titleDe: note.titleDe ?? "",
                                        descriptionDe: note.descriptionDe ?? "",
                                        hookSlug: note.hookSlug ?? "",
                                    })
                                }
                                onAskDelete={() => setConfirmId(note.id)}
                                onCancelDelete={() => setConfirmId(null)}
                                onDelete={() => remove(note.id)}
                            />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}

// Chapter band — the louder of the two headings, mirroring the part dividers on
// the doc pages so the hierarchy reads the same way here.
function ChapterHeading({ children }: { children: string }) {
    return (
        <div className="mt-10 mb-1 first:mt-0">
            <h2 className="text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

// Hook band — the quieter one, same metrics as a DocSection title. The padding
// keeps it off the rule above it (the chapter's, or the previous group's card),
// so a heading never sits flush against a border.
function HookHeading({ children }: { children: string }) {
    return (
        <div className="flex items-center gap-2 pt-3">
            <span
                aria-hidden="true"
                className="inline-block h-[14px] w-[2px] shrink-0 rounded-full bg-[var(--accent)]"
            />
            <p className="font-mono text-[0.8rem] font-semibold uppercase tracking-widest text-[var(--accent)]">
                {children}
            </p>
        </div>
    );
}

function NoteCard({
    note,
    confirming,
    onEdit,
    onAskDelete,
    onCancelDelete,
    onDelete,
}: {
    note: Note;
    confirming: boolean;
    onEdit: () => void;
    onAskDelete: () => void;
    onCancelDelete: () => void;
    onDelete: () => void;
}) {
    const internal = note.link?.startsWith("/");
    const external = note.link?.startsWith("http");

    return (
        <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <h3 className="text-[0.95rem] font-semibold text-[var(--text)]">
                        {note.title}
                    </h3>
                    {note.description ? (
                        <p className="text-sm leading-relaxed text-[var(--muted)]">
                            {note.description}
                        </p>
                    ) : null}
                    {note.titleDe ? (
                        <p className="text-[0.9rem] font-semibold text-[var(--mint)]">
                            <span className="mr-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                                de
                            </span>
                            {note.titleDe}
                        </p>
                    ) : null}
                    {note.descriptionDe ? (
                        <p className="text-sm leading-relaxed text-[var(--muted)]">
                            {note.descriptionDe}
                        </p>
                    ) : null}
                </div>

                {/* edit / delete, quiet until you reach for them */}
                <div className="flex shrink-0 items-center gap-1">
                    {confirming ? (
                        <>
                            <button
                                onClick={onDelete}
                                className="cursor-pointer rounded-md border border-[var(--danger)] px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--danger)]"
                            >
                                delete?
                            </button>
                            <button
                                onClick={onCancelDelete}
                                className="cursor-pointer rounded-md border border-[var(--border)] px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)] transition-colors duration-150 hover:border-[var(--danger)]"
                            >
                                no
                            </button>
                        </>
                    ) : (
                        <>
                            <IconButton label="edit note" onClick={onEdit}>
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </IconButton>
                            <IconButton
                                label="delete note"
                                onClick={onAskDelete}
                                destructive
                            >
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                            </IconButton>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-[0.65rem] text-[var(--muted)]">
                    {DATE.format(new Date(note.createdAt))}
                </span>
                {internal && note.link ? (
                    <Link href={note.link} className={BTN}>
                        open →
                    </Link>
                ) : null}
                {external && note.link ? (
                    <a
                        href={note.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={BTN}
                    >
                        open ↗
                    </a>
                ) : null}
            </div>
        </article>
    );
}

// Small stroke icon in a button, drawn inline like the rest of the app's icons.
// The border is transparent by default and only takes a colour on hover, so
// revealing it never shifts the row. `destructive` swaps that colour — and the
// icon's — to danger, which is the delete control's whole tell.
function IconButton({
    label,
    onClick,
    destructive = false,
    children,
}: {
    label: string;
    onClick: () => void;
    destructive?: boolean;
    children: React.ReactNode;
}) {
    const hover = destructive
        ? "hover:border-[var(--danger)] hover:text-[var(--danger)] focus-visible:border-[var(--danger)] focus-visible:text-[var(--danger)]"
        : "hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:border-[var(--accent)] focus-visible:text-[var(--accent)]";

    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`cursor-pointer rounded border border-transparent p-1 text-[var(--muted)] transition-colors duration-150 focus-visible:outline-none ${hover}`}
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[0.95rem] w-[0.95rem]"
            >
                {children}
            </svg>
        </button>
    );
}

// One form for both modes: `form.id` decides whether saving POSTs or PUTs.
function NoteForm({
    form,
    chapters,
    saving,
    onChange,
    onCancel,
    onSave,
}: {
    form: FormState;
    chapters: NotesChapter[];
    saving: boolean;
    onChange: (next: FormState) => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    const set = (patch: Partial<FormState>) => onChange({ ...form, ...patch });

    // A prefilled slug that isn't in the registry would vanish from a <select>
    // silently, so it is offered as its own option instead.
    const known = chapters.some((c) =>
        c.items.some((i) => i.slug === form.hookSlug),
    );

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSave();
            }}
            className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
        >
            <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--accent)]">
                {form.id ? "edit note" : "new note"}
            </p>

            <div>
                <label className={LABEL} htmlFor="note-title">
                    title *
                </label>
                <input
                    id="note-title"
                    required
                    value={form.title}
                    onChange={(e) => set({ title: e.target.value })}
                    className={FIELD}
                />
            </div>

            <div>
                <label className={LABEL} htmlFor="note-description">
                    description
                </label>
                <textarea
                    id="note-description"
                    rows={2}
                    value={form.description}
                    onChange={(e) => set({ description: e.target.value })}
                    className={FIELD}
                />
            </div>

            {/* The German pair mirrors the English pair exactly — same control,
                same width, one per row — so the form reads as one field list in
                two languages rather than two differently-shaped sections. */}
            <div>
                <label className={LABEL} htmlFor="note-title-de">
                    title (de)
                </label>
                <input
                    id="note-title-de"
                    value={form.titleDe}
                    onChange={(e) => set({ titleDe: e.target.value })}
                    className={FIELD}
                />
            </div>

            <div>
                <label className={LABEL} htmlFor="note-description-de">
                    description (de)
                </label>
                <textarea
                    id="note-description-de"
                    rows={2}
                    value={form.descriptionDe}
                    onChange={(e) => set({ descriptionDe: e.target.value })}
                    className={FIELD}
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <label className={LABEL} htmlFor="note-link">
                        link
                    </label>
                    <input
                        id="note-link"
                        placeholder="/hooks-refresh/use-state#… or https://…"
                        value={form.link}
                        onChange={(e) => set({ link: e.target.value })}
                        className={FIELD}
                    />
                </div>
                <div>
                    <label className={LABEL} htmlFor="note-hook">
                        grouped under
                    </label>
                    <select
                        id="note-hook"
                        value={form.hookSlug}
                        onChange={(e) => set({ hookSlug: e.target.value })}
                        className={FIELD}
                    >
                        <option value="">— {OTHER} —</option>
                        {!known && form.hookSlug ? (
                            <option value={form.hookSlug}>{form.hookSlug}</option>
                        ) : null}
                        {chapters.map((chapter) => (
                            <optgroup key={chapter.label} label={chapter.label}>
                                {chapter.items.map((item) => (
                                    <option key={item.slug} value={item.slug}>
                                        {item.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
                <button type="submit" className={BTN} disabled={saving}>
                    {saving ? "saving…" : form.id ? "save changes" : "add note"}
                </button>
                <button type="button" onClick={onCancel} className={BTN_CANCEL}>
                    cancel
                </button>
            </div>
        </form>
    );
}
