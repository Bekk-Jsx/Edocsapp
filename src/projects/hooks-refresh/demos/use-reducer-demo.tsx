"use client";

import { useReducer, useState } from "react";

type Task = { id: string; text: string; done: boolean };
type State = { tasks: Task[] };

// Discriminated union → the reducer's switch becomes exhaustively type-checked.
type Action =
    | { type: "add"; id: string; text: string }
    | { type: "toggle"; id: string }
    | { type: "remove"; id: string }
    | { type: "clearDone" };

// Third arg to useReducer. Runs once on mount; lets you build the initial state
// from a seed (or an expensive read) without doing it inline every render.
function init(seed: string[]): State {
    return {
        tasks: seed.map((text) => ({
            id: crypto.randomUUID(),
            text,
            done: false,
        })),
    };
}

// Pure. No I/O, no Date.now(), no crypto.randomUUID() — Strict Mode
// double-invokes reducers in dev to catch impurity.
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "add":
            return {
                tasks: [
                    ...state.tasks,
                    { id: action.id, text: action.text, done: false },
                ],
            };
        case "toggle":
            return {
                tasks: state.tasks.map((t) =>
                    t.id === action.id ? { ...t, done: !t.done } : t,
                ),
            };
        case "remove":
            return { tasks: state.tasks.filter((t) => t.id !== action.id) };
        case "clearDone":
            return { tasks: state.tasks.filter((t) => !t.done) };
    }
}

export default function UseReducerDemo() {
    const [state, dispatch] = useReducer(
        reducer,
        ["read the docs", "ship it"],
        init,
    );
    const [text, setText] = useState("");
    const doneCount = state.tasks.filter((t) => t.done).length;

    return (
        <div className="space-y-3">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = text.trim();
                    if (!trimmed) return;
                    dispatch({ type: "add", id: crypto.randomUUID(), text: trimmed });
                    setText("");
                }}
                className="flex gap-2"
            >
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="add a task"
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
                />
                <button
                    type="submit"
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    add
                </button>
            </form>

            <ul className="space-y-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-2">
                {state.tasks.length === 0 ? (
                    <li className="font-mono text-xs text-[var(--muted)]">
                        no tasks
                    </li>
                ) : (
                    state.tasks.map((t) => (
                        <li
                            key={t.id}
                            className="flex items-center gap-2 text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() =>
                                    dispatch({ type: "toggle", id: t.id })
                                }
                                className="accent-[var(--accent)]"
                            />
                            <span
                                className={
                                    t.done
                                        ? "flex-1 text-[var(--muted)] line-through"
                                        : "flex-1 text-[var(--text)]"
                                }
                            >
                                {t.text}
                            </span>
                            <button
                                onClick={() =>
                                    dispatch({ type: "remove", id: t.id })
                                }
                                aria-label={`remove ${t.text}`}
                                className="rounded px-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--amber)]"
                            >
                                ✕
                            </button>
                        </li>
                    ))
                )}
            </ul>

            <div className="flex items-center justify-between">
                <button
                    onClick={() => dispatch({ type: "clearDone" })}
                    disabled={doneCount === 0}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)] disabled:opacity-40"
                >
                    clear completed
                </button>
                <span className="font-mono text-xs text-[var(--muted)]">
                    {doneCount} done · {state.tasks.length - doneCount} left
                </span>
            </div>
        </div>
    );
}
