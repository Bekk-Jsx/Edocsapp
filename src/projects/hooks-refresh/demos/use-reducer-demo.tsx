"use client";

import { useReducer, useState } from "react";

// The running example for the whole page: a todo list with four transitions.
// Ids come from state (`nextId`) rather than crypto.randomUUID(), so the
// reducer stays pure — Strict Mode double-invokes it in dev, and a random id
// generated inside would differ between the two calls.
type Todo = { id: number; text: string; done: boolean };
type State = { todos: Todo[]; nextId: number };

// Discriminated union → the switch below is exhaustively type-checked and each
// case narrows to its own payload.
type Action =
    | { type: "add"; text: string }
    | { type: "toggle"; id: number }
    | { type: "remove"; id: number }
    | { type: "clearDone" };

// Third arg to useReducer. Runs ONCE on mount with the seed, so the mapping is
// not redone on every render.
function init(seed: string[]): State {
    return {
        todos: seed.map((text, i) => ({ id: i + 1, text, done: false })),
        nextId: seed.length + 1,
    };
}

// Pure: no mutation, no I/O, no Date.now(). Every case returns a NEW object.
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "add":
            return {
                todos: [
                    ...state.todos,
                    { id: state.nextId, text: action.text, done: false },
                ],
                nextId: state.nextId + 1,
            };
        case "toggle":
            return {
                ...state,
                todos: state.todos.map((t) =>
                    t.id === action.id ? { ...t, done: !t.done } : t,
                ),
            };
        case "remove":
            return {
                ...state,
                todos: state.todos.filter((t) => t.id !== action.id),
            };
        case "clearDone":
            return { ...state, todos: state.todos.filter((t) => !t.done) };
    }
}

const SEED = ["read the docs", "ship it"];

export default function UseReducerDemo() {
    // 1st arg: the reducer. 2nd: the seed passed to init. 3rd: the lazy initializer.
    const [state, dispatch] = useReducer(reducer, SEED, init);

    // The input is transient UI state, not part of the reducer's domain.
    const [text, setText] = useState("");
    const doneCount = state.todos.filter((t) => t.done).length;

    return (
        <div className="space-y-3">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = text.trim();
                    if (!trimmed) return;
                    dispatch({ type: "add", text: trimmed });
                    setText("");
                }}
                className="flex gap-2"
            >
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="add a todo"
                    aria-label="new todo"
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
                {state.todos.length === 0 ? (
                    <li className="font-mono text-xs text-[var(--muted)]">
                        no todos
                    </li>
                ) : (
                    state.todos.map((t) => (
                        <li key={t.id} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() => dispatch({ type: "toggle", id: t.id })}
                                aria-label={`toggle ${t.text}`}
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
                                onClick={() => dispatch({ type: "remove", id: t.id })}
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
                    {doneCount} done · {state.todos.length - doneCount} left
                </span>
            </div>
        </div>
    );
}
