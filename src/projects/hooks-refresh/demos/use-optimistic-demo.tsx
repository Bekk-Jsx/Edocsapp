"use client";

import { useOptimistic, useRef, useState } from "react";

type Message = { id: number; text: string };

// Real, confirmed rows use a real id; the optimistic row is marked instead of
// carrying one, so the render can tell the two layers apart.
type Row = Message & { pending?: boolean };

let nextId = 2;

export default function UseOptimisticDemo() {
    // actualState — confirmed messages only. Never holds a half-saved row.
    const [messages, setMessages] = useState<Message[]>([{ id: 1, text: "Hi!" }]);
    const [failNext, setFailNext] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    const [optimisticMessages, addOptimistic] = useOptimistic<Row[], string>(
        messages,
        (current, newMsg) => [
            ...current,
            { id: -1, text: `${newMsg} (sending…)`, pending: true },
        ],
    );

    // The form submission IS the action, so addOptimistic has a pending action
    // to attach to — no startTransition needed here.
    async function send(formData: FormData) {
        const text = (formData.get("text") ?? "").toString().trim();
        if (!text) return;
        setError(null);
        addOptimistic(text); // 1. instant
        formRef.current?.reset();

        await new Promise((r) => setTimeout(r, 1000)); // 2. the "server"

        if (failNext) {
            // The failure path commits NOTHING: actualState is untouched, so the
            // optimistic row is discarded when this action ends. No rollback code.
            setFailNext(false);
            setError(`“${text}” failed to send — the pending row rolled back on its own.`);
            return;
        }
        setMessages((prev) => [...prev, { id: nextId++, text }]); // 3. commit
    }

    return (
        <div className="space-y-3">
            <form ref={formRef} action={send} className="flex gap-2">
                <input
                    name="text"
                    placeholder="send a message"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                    type="submit"
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    send
                </button>
            </form>

            <label className="flex w-fit cursor-pointer items-center gap-2 font-mono text-xs text-[var(--muted)]">
                <input
                    type="checkbox"
                    checked={failNext}
                    onChange={(e) => setFailNext(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--amber)]"
                />
                fail the next send
            </label>

            {/* the OPTIMISTIC list is what gets rendered — not `messages` */}
            <ul className="space-y-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2">
                {optimisticMessages.map((m, i) => (
                    <li
                        // pending rows have no real id, and two sends can be in
                        // flight at once — key those by position instead.
                        key={m.pending ? `pending-${i}` : m.id}
                        className="flex items-center justify-between font-mono text-xs"
                    >
                        <span
                            className={
                                m.pending
                                    ? "text-[var(--muted)]"
                                    : "text-[var(--text)]"
                            }
                        >
                            {m.text}
                        </span>
                        {m.pending && (
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--amber)]" />
                        )}
                    </li>
                ))}
            </ul>

            {error && (
                <p className="font-mono text-xs text-[var(--amber)]">{error}</p>
            )}

            <p className="text-xs text-[var(--muted)]">
                The pending row appears instantly and is replaced by the real one
                once the save commits. Tick{" "}
                <span className="font-mono">fail the next send</span> to watch the
                optimistic row remove itself when{" "}
                <span className="font-mono">actualState</span> never updates —
                nothing in this component removes it.
            </p>
        </div>
    );
}
