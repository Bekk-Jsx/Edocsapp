"use client";

import { useOptimistic, useRef, useState } from "react";

type Message = { id: string; text: string; pending?: boolean };

// Simulated server round-trip. Fails deterministically on messages containing
// "fail" so we can show the optimistic revert.
async function sendToServer(text: string): Promise<Message> {
    await new Promise((r) => setTimeout(r, 1200));
    if (text.toLowerCase().includes("fail")) {
        throw new Error("server rejected");
    }
    return { id: crypto.randomUUID(), text };
}

export default function UseOptimisticDemo() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    const [optimistic, addOptimistic] = useOptimistic<Message[], string>(
        messages,
        (current, text) => [
            ...current,
            { id: `optimistic-${text}`, text, pending: true },
        ],
    );

    async function submit(formData: FormData) {
        const text = (formData.get("text") ?? "").toString().trim();
        if (!text) return;
        setError(null);
        addOptimistic(text);
        formRef.current?.reset();
        try {
            const saved = await sendToServer(text);
            setMessages((prev) => [...prev, saved]);
        } catch (e) {
            setError(e instanceof Error ? e.message : "unknown error");
            // useOptimistic reverts automatically — we don't touch `messages`.
        }
    }

    return (
        <div className="space-y-3">
            <form ref={formRef} action={submit} className="flex gap-2">
                <input
                    name="text"
                    placeholder="send a message — include `fail` to force an error"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                    type="submit"
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    send
                </button>
            </form>

            <ul className="space-y-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2">
                {optimistic.length === 0 ? (
                    <li className="font-mono text-xs text-[var(--muted)]">
                        —
                    </li>
                ) : (
                    optimistic.map((m) => (
                        <li
                            key={m.id}
                            className="flex items-center justify-between font-mono text-xs"
                        >
                            <span className="text-[var(--text)]">{m.text}</span>
                            {m.pending && (
                                <span className="text-[var(--amber)]">sending…</span>
                            )}
                        </li>
                    ))
                )}
            </ul>

            {error && (
                <p className="font-mono text-xs text-[var(--amber)]">
                    {error} — the optimistic entry was rolled back.
                </p>
            )}

            <p className="text-xs text-[var(--muted)]">
                The pending row shows up instantly, then either commits with a
                real id or vanishes if the action throws. The optimistic value
                is a <em>transient</em> view on top of the real state.
            </p>
        </div>
    );
}
