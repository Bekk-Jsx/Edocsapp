import { DocSection, Code, Term, Callout, QA } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";
import CodeBlock from "@/components/ui/code-block";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > tip > note). It is NOT what flags a section header — that is
// the explicit `sectionSeverity` prop, which marks a section whose ENTIRE topic
// is one severity. No section on this page is.
// Sections carrying no callout are absent from the map and their card renders plain.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (Inline) ---
    // inline `danger · mutation` callout — a mutated state object keeps its
    // reference, so the re-render is skipped and the UI goes stale
    "step-3-the-reducer": ["danger"],
    // inline `note · when it re-renders` callout — the Object.is bail-out rule
    "step-4-wiring-usereducer": ["note"],
    // inline `tip · stable dispatch` callout
    "step-5-dispatching-from-the-ui": ["tip"],

    // --- part 2 (As a module) ---
    // inline `tip · pass the function` callout — hand React the initializer,
    // don't call it yourself
    "initial-state-ts-lazy-init": ["tip"],
    // inline `note · redux` callout, pointing at the global-store version
    "usereducer-context-vs-usecontext-alone": ["note"],
};

// Top-level divider between the parts of the page — mirrors the group labels in
// the summary rail. Deliberately louder than a DocSection eyebrow (bold, larger,
// full-width rule) so the split is obvious while scrolling: this is a grouping,
// not a section.
//
// Same file-local helper use-context and use-effect define for their own part
// dividers.
function PartHeading({
    kicker,
    children,
}: {
    kicker: string;
    children: string;
}) {
    return (
        <div className="mt-14 mb-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {kicker}
            </p>
            <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

// ===================================================================
// Part 1 — Inline. The todo list built step by step, every piece
// inside ONE component, in the order you would actually write it:
// what the state holds, what can happen to it, how each change is
// computed, how it is wired up, how the UI triggers it.
// Each section leads with its own fragment and explains that fragment
// only — there is no whole-module source panel on this page.
// ===================================================================

const STATE_SHAPE = `type Todo = { id: number; text: string; done: boolean };

type State = {
  todos: Todo[];    // the list itself
  nextId: number;   // the id the next added todo will get
};

const initialState: State = { todos: [], nextId: 1 };`;

const ACTIONS = `type Action =
  | { type: "add"; text: string }     // payload: the text to add
  | { type: "toggle"; id: number }    // payload: which todo to flip
  | { type: "remove"; id: number }    // payload: which todo to drop
  | { type: "clearDone" };            // no payload — it needs nothing`;

const REDUCER = `function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return {
        todos: [...state.todos, { id: state.nextId, text: action.text, done: false }],
        nextId: state.nextId + 1,     // new array, new object, id consumed
      };

    case "toggle":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),                             // map returns a new array; the flipped
      };                               // todo is a new object, the rest reused

    case "remove":
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };

    case "clearDone":
      return { ...state, todos: state.todos.filter((t) => !t.done) };
  }
}`;

const MUTATION = `// WRONG — same array, same state object, no re-render
case "add":
  state.todos.push({ id: state.nextId, text: action.text, done: false });
  return state;`;

const WIRING = `import { useReducer } from "react";

function TodoList() {
  const [state, dispatch] = useReducer(reducer, initialState);
  //     ^^^^^  ^^^^^^^^              ^^^^^^^  ^^^^^^^^^^^^
  //     current  request a change    1st arg   2nd arg
  //     value                        the       the starting
  //                                  reducer   value

  return <p>{state.todos.length} todos</p>;
}`;

// Nested inside the `note · when it re-renders` callout at the end of
// "step 4 · wiring useReducer". The callout tints in globals.css re-colour the
// Shiki frame to the callout's own hue.
const RERENDER_FLOW = `dispatch -> reducer(state, action) -> Object.is(new, old)
  -> different -> re-render
  -> same      -> no render`;

const DISPATCH_UI = `function TodoList() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [text, setText] = useState("");   // transient input, not reducer state

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          dispatch({ type: "add", text: text.trim() });   // action, not a setter
          setText("");
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit">add</button>
      </form>

      {state.todos.map((t) => (
        <li key={t.id}>
          <input
            type="checkbox"
            checked={t.done}
            onChange={() => dispatch({ type: "toggle", id: t.id })}
          />
          {t.text}
          <button onClick={() => dispatch({ type: "remove", id: t.id })}>✕</button>
        </li>
      ))}

      <button onClick={() => dispatch({ type: "clearDone" })}>clear completed</button>
    </>
  );
}`;

// ===================================================================
// Part 2 — As a module. The SAME todo logic, one file per section, in
// dependency order: types, then the reducer that imports them, then
// the initial state and its lazy initializer, then a component that
// imports all three, then sharing one instance through context.
// Every import line is shown, because where a value comes from is
// half of what these sections are teaching.
// ===================================================================

const TYPES_FILE = `// types.ts — no imports; everything else imports from here
export type Todo = { id: number; text: string; done: boolean };

export type State = {
  todos: Todo[];
  nextId: number;
};

export type Action =
  | { type: "add"; text: string }
  | { type: "toggle"; id: number }
  | { type: "remove"; id: number }
  | { type: "clearDone" };`;

const REDUCER_FILE = `// reducer.ts
import type { State, Action } from "./types";

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":
      return {
        todos: [...state.todos, { id: state.nextId, text: action.text, done: false }],
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
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case "clearDone":
      return { ...state, todos: state.todos.filter((t) => !t.done) };
  }
}`;

const INITIAL_FILE = `// initial-state.ts
import type { State } from "./types";

export const initialState: State = { todos: [], nextId: 1 };

// init(seed) — builds the starting state from a seed, once.
export function init(seed: string[]): State {
  return {
    todos: seed.map((text, i) => ({ id: i + 1, text, done: false })),
    nextId: seed.length + 1,
  };
}`;

const LAZY_CALL = `const SEED = ["read the docs", "ship it"];

const [state, dispatch] = useReducer(reducer, SEED, init);
//                                   ^^^^^^^  ^^^^  ^^^^
//                                   1st:     2nd:  3rd:
//                                   reducer  the   the initializer —
//                                            seed  React calls init(SEED)
//                                                  once, on mount`;

const RESET_CASE = `// with an init function, "start over" is just another action
case "reset":
  return init(action.payload);   // { type: "reset"; payload: string[] }`;

const COMPONENT_FILE = `// todo-list.tsx
"use client";
import { useReducer, useState } from "react";
import { reducer } from "./reducer";
import { initialState } from "./initial-state";
import type { Todo } from "./types";      // only if this file names the type

export default function TodoList() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [text, setText] = useState("");

  const remaining: Todo[] = state.todos.filter((t) => !t.done);

  return <p>{remaining.length} left</p>;
}`;

const PROVIDER_FILE = `// todo-context.tsx
"use client";
import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import { reducer } from "./reducer";
import { initialState } from "./initial-state";
import type { State, Action } from "./types";

type TodoValue = { state: State; dispatch: Dispatch<Action> };

export const TodoContext = createContext<TodoValue | null>(null);

export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <TodoContext.Provider value={{ state, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
}`;

const CONSUMER_FILE = `// clear-done-button.tsx
"use client";
import { useContext } from "react";
import { TodoContext } from "./todo-context";

export function ClearDoneButton() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("ClearDoneButton must be inside <TodoProvider>");

  const { state, dispatch } = ctx;
  const doneCount = state.todos.filter((t) => t.done).length;

  return (
    <button disabled={doneCount === 0} onClick={() => dispatch({ type: "clearDone" })}>
      clear completed ({doneCount})
    </button>
  );
}`;

const COMPARISON = `// A — useContext alone: the provider decides how state updates
const [todos, setTodos] = useState<Todo[]>([]);
const addTodo = (text: string) => setTodos((ts) => [...ts, make(text)]);
const toggleTodo = (id: number) => setTodos((ts) => ts.map(/* ... */));
const value = { todos, addTodo, toggleTodo, removeTodo, clearDone };

// B — useReducer + context: one pure reducer owns every transition
const [state, dispatch] = useReducer(reducer, initialState);
const value = { state, dispatch };`;

export function UseReducerDocs() {
    return (
        <>
            <PartHeading kicker="part 1">Inline</PartHeading>
            <div>
                <DocSection title="step 1 · state shape">
                    <CodeBlock code={STATE_SHAPE} lang="ts" />
                    <p>
                        <Term>Decide what the state holds before anything else.</Term>{" "}
                        Everything downstream — the actions, the reducer, the UI — is
                        derived from this shape, so it is the one decision worth making
                        first.
                    </p>
                    <p>
                        <Term>
                            <Code>State</Code> is one object, not one value.
                        </Term>{" "}
                        <Code>todos</Code> is the list the UI renders;{" "}
                        <Code>nextId</Code> is a counter the reducer needs to hand out
                        ids. Keeping the counter IN state is what lets the reducer stay
                        pure — it never has to invent an id.
                    </p>
                    <p>
                        <Term>
                            <Code>initialState</Code> is the starting value.
                        </Term>{" "}
                        It is a plain constant at module level, not a function call, and
                        it is what the hook is handed as its second argument in step 4.
                    </p>
                </DocSection>

                <DocSection title="step 2 · actions">
                    <CodeBlock code={ACTIONS} lang="ts" />
                    <p>
                        <Term>An action describes WHAT HAPPENED, not what to set.</Term>{" "}
                        <Code>{'{ type: "toggle", id: 3 }'}</Code> says a todo was
                        toggled; it does not say what the new list should be. Deciding
                        that is the reducer&apos;s job, and separating the two is the
                        whole point of the pattern.
                    </p>
                    <p>
                        <Term>
                            <Code>type</Code> is required; the other fields are the
                            payload.
                        </Term>{" "}
                        <Code>add</Code> carries <Code>text</Code>,{" "}
                        <Code>toggle</Code> and <Code>remove</Code> carry an{" "}
                        <Code>id</Code>, and <Code>clearDone</Code> carries nothing
                        because it needs nothing. Each variant declares exactly the data
                        its transition requires.
                    </p>
                    <p>
                        <Term>
                            The union is DISCRIMINATED by <Code>type</Code>.
                        </Term>{" "}
                        Inside <Code>case &quot;toggle&quot;</Code> TypeScript narrows{" "}
                        <Code>action</Code> to that one variant, so{" "}
                        <Code>action.id</Code> type-checks and{" "}
                        <Code>action.text</Code> is a compile error. Add a fifth variant
                        and the <Code>switch</Code> stops being exhaustive — the return
                        type breaks until you handle it.
                    </p>
                </DocSection>

                <DocSection title="step 3 · the reducer">
                    <CodeBlock code={REDUCER} lang="ts" />
                    <p>
                        <Term>
                            A reducer is <Code>(state, action) =&gt; newState</Code>.
                        </Term>{" "}
                        It takes the current state and the action that just happened, and
                        returns the state that should replace it. It is an ordinary
                        function — nothing about it is React-specific, which is why it can
                        be tested by calling it.
                    </p>
                    <p>
                        <Term>Every case returns a NEW object.</Term> Spread the state,
                        then replace the part that changed:{" "}
                        <Code>map</Code> for toggle, <Code>filter</Code> for remove and
                        clear, a fresh array for add. Nothing is assigned to, pushed to or
                        spliced.
                    </p>
                    <p>
                        <Term>It must be PURE.</Term> Same inputs, same output, every
                        time — no mutation, no <Code>fetch</Code>, no{" "}
                        <Code>Date.now()</Code>, no <Code>crypto.randomUUID()</Code>, no
                        writing to a ref. Anything non-deterministic belongs in the action
                        payload, computed by the caller.
                    </p>
                    <p>
                        <Term>React compares by REFERENCE to decide the re-render.</Term>{" "}
                        If the returned object is the same object it passed in, React
                        concludes nothing changed and bails out. Purity is not style
                        advice here; it is the mechanism the re-render depends on.
                    </p>
                    <p>
                        <Term>Strict Mode double-invokes the reducer in development.</Term>{" "}
                        React calls it twice with the same arguments and expects the same
                        result — an impure reducer produces a visibly wrong value in dev,
                        which is the point: the bug surfaces on your machine rather than
                        in production.
                    </p>

                    <Callout severity="danger" label="danger · mutation">
                        <CodeBlock code={MUTATION} lang="ts" />
                        <p className="mt-3">
                            Mutating old state (<Code>state.todos.push(...)</Code>) keeps
                            the same reference, so React may skip the re-render — the UI
                            silently goes stale. Nothing throws, nothing warns in
                            production, and the data is genuinely correct in memory while
                            the screen shows the previous list. Always return a NEW object.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="step 4 · wiring useReducer">
                    <CodeBlock code={WIRING} lang="tsx" />
                    <p>
                        <Term>
                            <Code>state</Code> — the current value.
                        </Term>{" "}
                        The state for THIS render, read-only, exactly like the first
                        element of a <Code>useState</Code> pair.
                    </p>
                    <p>
                        <Term>
                            <Code>dispatch</Code> — how you REQUEST a change.
                        </Term>{" "}
                        You call it with an action. You never assign to{" "}
                        <Code>state</Code>, and there is no setter: dispatching is the
                        only way in.
                    </p>
                    <p>
                        <Term>
                            First argument — the <Code>reducer</Code>.
                        </Term>{" "}
                        The function that decides the next state. React calls it for you;
                        you never call it yourself.
                    </p>
                    <p>
                        <Term>
                            Second argument — <Code>initialState</Code>.
                        </Term>{" "}
                        The value <Code>state</Code> has on the first render. It is used
                        once and ignored on every render after that.
                    </p>
                    <p>
                        <Term>The flow, end to end.</Term>{" "}
                        <Code>dispatch(action)</Code> → React runs{" "}
                        <Code>reducer(state, action)</Code> → the returned value becomes
                        the new state → the component re-renders with it. The reducer runs
                        during that process, not inside your event handler, which is why
                        reading <Code>state</Code> immediately after{" "}
                        <Code>dispatch</Code> still gives you the old value.
                    </p>

                    <Callout severity="note" label="note · when it re-renders">
                        <p>
                            A re-render happens after <Code>dispatch</Code> ONLY if the
                            reducer returns a NEW state reference. React compares the
                            returned value with the current one via{" "}
                            <Code>Object.is</Code>: different reference → re-render; same
                            reference → React bails out (no render). This is why the
                            reducer must return a new object, not mutate the old one —
                            same bail-out rule as <Code>useState</Code>.
                        </p>
                        <div className="mt-3">
                            <CodeBlock code={RERENDER_FLOW} lang="text" />
                        </div>
                    </Callout>
                </DocSection>

                <DocSection title="step 5 · dispatching from the ui">
                    <CodeBlock code={DISPATCH_UI} lang="tsx" />
                    <p>
                        <Term>The UI only dispatches.</Term> Every handler here is one
                        line that names what happened —{" "}
                        <Code>{'{ type: "toggle", id: t.id }'}</Code> — and nothing else.
                        No spreading, no <Code>filter</Code>, no decision about what the
                        next list should be.
                    </p>
                    <p>
                        <Term>The reducer owns the transitions.</Term> That split is what
                        you get for the extra types: the rules live in one pure function
                        you can read top to bottom, and the component stays a description
                        of the screen. Adding a new transition means adding a variant and
                        a <Code>case</Code>, not touching five handlers.
                    </p>
                    <p>
                        <Term>Not everything belongs in the reducer.</Term> The input&apos;s{" "}
                        <Code>text</Code> is transient UI state that no other component
                        cares about, so it stays in <Code>useState</Code>. Reducer state
                        is the data with rules attached.
                    </p>

                    <Callout severity="tip" label="tip · stable dispatch">
                        <p>
                            <Code>dispatch</Code> keeps the same identity for the
                            component&apos;s life — safe to omit from{" "}
                            <Code>useEffect</Code> deps and to pass to children without{" "}
                            <Code>useCallback</Code>. A memoized child receiving only{" "}
                            <Code>dispatch</Code> never re-renders because of it.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            <PartHeading kicker="part 2">As a module</PartHeading>
            <div>
                <DocSection title="types.ts">
                    <CodeBlock code={TYPES_FILE} lang="ts" />
                    <p>
                        <Term>Types live in their own module.</Term> This file imports
                        nothing and exports only types, so every other file can import
                        from it without creating a cycle — the reducer needs{" "}
                        <Code>State</Code> and <Code>Action</Code>, the components need{" "}
                        <Code>State</Code> and <Code>Todo</Code>, and none of them need
                        each other.
                    </p>
                    <p>
                        <Term>
                            <Code>export type</Code>, not <Code>export</Code>.
                        </Term>{" "}
                        These are erased at compile time; importers use{" "}
                        <Code>import type</Code> so nothing from this file survives into
                        the bundle.
                    </p>
                </DocSection>

                <DocSection title="reducer.ts">
                    <CodeBlock code={REDUCER_FILE} lang="ts" />
                    <p>
                        <Term>
                            <Code>import type {"{"} State, Action {"}"} from
                            &quot;./types&quot;</Code> is the only import it needs.
                        </Term>{" "}
                        The reducer has no React import, no hooks and no JSX — it is a
                        plain function over plain data, which is exactly why it can be
                        unit-tested by calling{" "}
                        <Code>reducer(someState, someAction)</Code> and comparing the
                        result.
                    </p>
                    <p>
                        <Term>Exporting the reducer lets any component reuse the LOGIC.</Term>{" "}
                        Not the state. Two components importing this same function and
                        calling <Code>useReducer</Code> get two independent, unrelated
                        todo lists — the import shares the rules, and each hook call
                        creates its OWN state.
                    </p>
                    <p>
                        <Term>That is the same rule as <Code>useState</Code>.</Term> A
                        hook call is per-component-instance. Sharing one list between
                        components is a separate problem, solved two sections down.
                    </p>
                </DocSection>

                <DocSection title="initial-state.ts + lazy init">
                    <CodeBlock code={INITIAL_FILE} lang="ts" />
                    <p>
                        <Term>Two ways to start, in one file.</Term>{" "}
                        <Code>initialState</Code> is a constant for the plain case;{" "}
                        <Code>init(seed)</Code> BUILDS the starting state from an argument
                        when there is real work to do — mapping a seed, parsing
                        localStorage, reading a prop.
                    </p>

                    <CodeBlock code={LAZY_CALL} lang="tsx" />
                    <p>
                        <Term>
                            The third argument is the LAZY INITIALIZER.
                        </Term>{" "}
                        With three arguments the second one changes meaning: it is no
                        longer the initial state, it is the SEED passed to the
                        initializer. React calls <Code>init(SEED)</Code> once, on mount,
                        and uses the result as the initial state.
                    </p>
                    <Callout severity="tip" label="tip · pass the function">
                        <p>
                            Pass the function, don&apos;t call it.{" "}
                            <Code>useReducer(reducer, SEED, init)</Code> hands React the
                            function; <Code>useReducer(reducer, init(SEED))</Code> runs it
                            on EVERY render and throws the result away on all but the
                            first. Same value, wasted work.
                        </p>
                    </Callout>

                    <p>
                        <Term>Reuse init to reset</Term>
                    </p>
                    <CodeBlock code={RESET_CASE} lang="ts" />
                    <p>
                        <Term>
                            The initializer earns its place twice: mount, and reset.
                        </Term>{" "}
                        Because <Code>init</Code> is an ordinary exported function, the
                        reducer can call it to rebuild state from scratch — one function
                        defines &quot;what a fresh state looks like&quot; for both the
                        first render and every reset after it.
                    </p>
                </DocSection>

                <DocSection title="using it in a component">
                    <CodeBlock code={COMPONENT_FILE} lang="tsx" />
                    <p>
                        <Term>Three imports, three responsibilities.</Term>{" "}
                        <Code>useReducer</Code> from React,{" "}
                        <Code>reducer</Code> from <Code>./reducer</Code>,{" "}
                        <Code>initialState</Code> from <Code>./initial-state</Code> — and{" "}
                        <Code>import type</Code> for anything the component names in its
                        own annotations.
                    </p>
                    <p>
                        <Term>Importing gives you the RULES.</Term> The state itself is
                        created here, by this <Code>useReducer</Code> call, and it is
                        LOCAL to this component instance. Render{" "}
                        <Code>&lt;TodoList /&gt;</Code> twice and there are two lists that
                        know nothing about each other.
                    </p>
                    <p>
                        <Term>
                            <Code>&quot;use client&quot;</Code> is required.
                        </Term>{" "}
                        <Code>useReducer</Code> is a hook, so the file has to be a Client
                        Component. The reducer module itself does not — it is plain
                        TypeScript and can be imported from either side.
                    </p>
                </DocSection>

                <DocSection title="sharing across components">
                    <CodeBlock code={PROVIDER_FILE} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useReducer</Code> alone is LOCAL — exactly like{" "}
                            <Code>useState</Code>.
                        </Term>{" "}
                        To share one list across a tree, call the hook ONCE in a provider
                        and put both halves of the pair into the context value.
                    </p>
                    <p>
                        <Term>
                            The value is <Code>{"{ state, dispatch }"}</Code>.
                        </Term>{" "}
                        <Code>state</Code> so descendants can read,{" "}
                        <Code>dispatch</Code> so they can request changes.{" "}
                        <Code>Dispatch&lt;Action&gt;</Code> is React&apos;s type for the
                        dispatch function, imported as a type from{" "}
                        <Code>react</Code>.
                    </p>

                    <CodeBlock code={CONSUMER_FILE} lang="tsx" />
                    <p>
                        <Term>A consumer reads the pair and dispatches.</Term> It holds no
                        state of its own and has no setter — it derives{" "}
                        <Code>doneCount</Code> from the shared state and sends an action
                        back. Any component under the provider can do this, at any depth,
                        without a single prop being threaded through.
                    </p>
                    <p>
                        <Term>The division of labour.</Term> The reducer MANAGES the
                        transitions; context DISTRIBUTES the state and the dispatch. They
                        solve different problems and compose cleanly because neither knows
                        about the other.
                    </p>
                </DocSection>

                <DocSection title="useReducer + context vs useContext alone">
                    <CodeBlock code={COMPARISON} lang="tsx" />
                    <p>
                        <Term>
                            <Code>useContext</Code> alone distributes a value; YOU decide
                            how it updates.
                        </Term>{" "}
                        Usually that means <Code>useState</Code> inside the provider plus
                        a handful of handler functions on the value. It is simple and
                        direct, and the update logic ends up SCATTERED across those
                        handlers — each one spreading and mapping in its own way.
                    </p>
                    <p>
                        <Term>
                            <Code>useReducer</Code> + context CENTRALIZES every transition.
                        </Term>{" "}
                        One pure, testable function holds all of them, and components just
                        dispatch typed actions. The value shrinks to two entries, and
                        adding behaviour means adding a variant and a{" "}
                        <Code>case</Code> instead of another function on the value object.
                    </p>
                    <p>
                        <Term>The trade-off is indirection.</Term> The reducer costs you a
                        type union, an action for every transition, and a layer between
                        the click and the change — overkill for one or two simple values,
                        where option A is genuinely the better code. It starts paying off
                        when the transitions are MANY or INTERDEPENDENT: when adding one
                        thing must also clear another, or when the same change can be
                        triggered from four places.
                    </p>
                    <p>
                        <Term>Neither fixes re-renders.</Term> Both put a value on a
                        context, and context has NO PARTIAL SUBSCRIPTION — every consumer
                        re-renders when the value changes, whichever field it actually
                        reads. Keep the value reference stable, and split unrelated state
                        into separate contexts; that is a context concern, not a reducer
                        one.
                    </p>
                    <p>
                        <Term>One thing the reducer does help with here.</Term>{" "}
                        <Code>dispatch</Code> is stable for the provider&apos;s life, so a{" "}
                        <Code>{"{ state, dispatch }"}</Code> value only changes when{" "}
                        <Code>state</Code> does — where option A&apos;s inline handler
                        functions are new references on every provider render unless each
                        one is memoized.
                    </p>

                    <Callout severity="note" label="note · redux">
                        <p>
                            Redux applies this same reducer/action/dispatch idea as a
                            GLOBAL store — a separate library, covered on its own page.
                            The vocabulary transfers exactly; what changes is that the
                            store lives outside the component tree rather than in a hook.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- footer sections — always last, never in the rail ---------- */}
            <DocSection title="react vs next.js" tone="accent">
                <p>
                    <Code>useReducer</Code> is identical to React — same signature, same
                    semantics, nothing about the App Router changes it. What differs is
                    the boundary: it is a hook, so any file calling it needs{" "}
                    <Code>&quot;use client&quot;</Code> at the top.
                </p>
                <p>
                    Same story as <Code>useState</Code>. A Server Component renders once,
                    on the server, with no hook runtime and no re-render to schedule — so
                    it cannot hold reducer state. The reducer, the types and the
                    initializer are plain TypeScript and can live in a server-importable
                    module; only the <Code>useReducer</Code> call has to be on the client.
                </p>
            </DocSection>

            <DocSection title="say it right — english" tone="mint">
                <QA
                    q={<>why must a reducer be pure?</>}
                    a={
                        <>
                            &ldquo;React compares the returned state{" "}
                            <Term>by reference</Term> to decide whether to re-render, and{" "}
                            <Term>double-invokes the reducer in development</Term> to
                            check. Mutating the old state or causing side effects breaks
                            both — the UI goes stale, or the dev run disagrees with
                            itself.&rdquo;
                        </>
                    }
                />

                <div className="mt-4">
                    <QA
                        q={
                            <>
                                do you need to memoize <Code>dispatch</Code> before passing
                                it down?
                            </>
                        }
                        a={
                            <>
                                &ldquo;No — <Code>dispatch</Code> has a{" "}
                                <Term>stable identity</Term> for the component&apos;s
                                life, so it never causes extra re-renders and needs no{" "}
                                <Code>useCallback</Code>.&rdquo;
                            </>
                        }
                    />
                </div>
            </DocSection>
        </>
    );
}
