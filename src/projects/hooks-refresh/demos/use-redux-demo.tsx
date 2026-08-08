"use client";

import { useState } from "react";
import {
    configureStore,
    createSlice,
    type PayloadAction,
} from "@reduxjs/toolkit";
import { Provider, useDispatch, useSelector } from "react-redux";

// Self-contained: this file declares its own slice, its own store and its own
// Provider, so nothing here touches the surrounding app. In a real project the
// slice would live in features/counter/counterSlice.ts and the store in
// lib/store.ts — see the docs below.

const counterSlice = createSlice({
    name: "counter",
    initialState: { value: 0 },
    reducers: {
        // These read like mutations; Immer turns them into immutable updates.
        increment: (state) => {
            state.value += 1;
        },
        incrementBy: (state, action: PayloadAction<number>) => {
            state.value += action.payload;
        },
        reset: (state) => {
            state.value = 0;
        },
    },
});

const { increment, incrementBy, reset } = counterSlice.actions;

// A FACTORY, not a module-level `store`. A "use client" module is still
// evaluated on the server while prerendering, so a singleton store would be one
// shared instance across requests — the exact leak the danger callout describes.
// Building it per mount keeps this demo honest about the pattern it teaches.
const makeStore = () =>
    configureStore({ reducer: { counter: counterSlice.reducer } });

type DemoStore = ReturnType<typeof makeStore>;
type DemoState = ReturnType<DemoStore["getState"]>;

const BUTTON =
    "rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]";

function Counter() {
    // Subscribes to counter.value ONLY — this is the partial subscription that
    // Context cannot do. A primitive, so the reference check is a value check.
    const value = useSelector((state: DemoState) => state.counter.value);
    const dispatch = useDispatch();

    return (
        <div className="space-y-3">
            <p className="font-mono text-xs text-[var(--muted)]">
                state.counter.value:{" "}
                <span className="text-[var(--accent)]">{value}</span>
            </p>

            <div className="flex flex-wrap gap-2">
                <button onClick={() => dispatch(increment())} className={BUTTON}>
                    +1
                </button>
                <button
                    onClick={() => dispatch(incrementBy(5))}
                    className={BUTTON}
                >
                    +5
                </button>
                <button onClick={() => dispatch(reset())} className={BUTTON}>
                    reset
                </button>
            </div>

            <p className="text-xs leading-relaxed text-[var(--muted)]">
                Each button dispatches an auto-generated action —{" "}
                <span className="font-mono">increment()</span>,{" "}
                <span className="font-mono">incrementBy(5)</span>,{" "}
                <span className="font-mono">reset()</span>. The store runs the
                slice reducer, the value changes, and every component selecting
                it re-renders. With the Redux DevTools extension installed you
                can watch each action land.
            </p>
        </div>
    );
}

export default function UseReduxDemo() {
    // Built once per mounted component — the client-side half of the per-request
    // store rule. A plain `makeStore()` in the body would build a fresh store on
    // every render and reset the count. The docs below show the `useRef` variant
    // the RTK guide uses; a lazy `useState` initializer gives the same
    // build-once guarantee without reading a ref during render.
    const [store] = useState(makeStore);

    return (
        <Provider store={store}>
            <Counter />
        </Provider>
    );
}
