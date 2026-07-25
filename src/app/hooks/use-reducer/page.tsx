import DemoFrame from "@/components/ui/demo-frame";
import UseReducerDemo from "@/components/demos/use-reducer-demo";
import { UseReducerDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useReducer } from "react";

type Task = { id: string; text: string; done: boolean };
type State = { tasks: Task[] };

// Discriminated union → exhaustive switch, narrowed payloads.
type Action =
  | { type: "add"; id: string; text: string }
  | { type: "toggle"; id: string }
  | { type: "remove"; id: string }
  | { type: "clearDone" };

// Lazy init — runs once on mount with the seed.
function init(seed: string[]): State {
  return {
    tasks: seed.map((text) => ({ id: crypto.randomUUID(), text, done: false })),
  };
}

// Pure. Any non-determinism (ids, timestamps) goes in the action, not here.
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return { tasks: [...state.tasks, { id: action.id, text: action.text, done: false }] };
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

export default function Tasks() {
  const [state, dispatch] = useReducer(reducer, ["read the docs"], init);

  // dispatch has a STABLE identity — safe to pass down without useCallback.
  const onAdd = (text: string) =>
    dispatch({ type: "add", id: crypto.randomUUID(), text });

  return <TaskList state={state} dispatch={dispatch} onAdd={onAdd} />;
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useReducer"
            source="react"
            code={CODE}
            docs={<UseReducerDocs />}
            description={
                <>
                    Centralize complex transitions in a{" "}
                    <Term>pure reducer</Term>: <Code>(state, action)</Code> in,
                    next state out. Discriminated-union actions give you
                    exhaustive type-safety, <Code>dispatch</Code> has a stable
                    identity, and the third argument lets you compute the
                    initial state lazily.
                </>
            }
        >
            <UseReducerDemo />
        </DemoFrame>
    );
}
