import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// BATCH 002 — the event loop, on the JavaScript page.
//
// This fills the question the seed already scaffolded at
// fullstack-questions/javascript as `event-loop` (order 1, high priority).
// It is NOT inserted as a second question: a batch only ever fills what the
// seed created, and a duplicate `js-event-loop` beside it would leave the
// page asking the same thing twice.
//
// First batch to use `cards`: the call stack definition and the "code after
// an async call does not wait" mistake belong beside the answer rather than
// inside it, so they are cards and not callout blocks.
// ===================================================================

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/javascript",
        slug: "event-loop",
        title: {
            en: "What is the event loop in JavaScript?",
            de: "Was ist der Event Loop in JavaScript?",
        },
        status: "active",
        priority: "high",
        tags: ["javascript", "async", "event-loop"],
        blocks: [
            {
                type: "paragraph",
                text: {
                    en: "JavaScript is single-threaded, so it can only run one task at a time. The event loop lets it handle asynchronous operations without blocking the main thread.",
                    de: "JavaScript ist single-threaded und kann deshalb immer nur eine Aufgabe gleichzeitig ausführen. Der Event Loop sorgt dafür, dass asynchrone Operationen den Main Thread nicht blockieren.",
                },
            },
            {
                type: "list",
                ordered: false,
                items: [
                    {
                        text: {
                            en: "Synchronous code runs first on the call stack, line by line.",
                            de: "Synchroner Code läuft zuerst auf dem Call Stack, Zeile für Zeile.",
                        },
                    },
                    {
                        text: {
                            en: "Async tasks like timers, network requests or file I/O are handled outside the call stack, and their callbacks are queued when they finish.",
                            de: "Asynchrone Aufgaben wie Timer, Netzwerk-Requests oder File I/O laufen außerhalb des Call Stacks. Sind sie fertig, landen ihre Callbacks in einer Queue.",
                        },
                    },
                    {
                        text: {
                            en: "When the call stack is empty, the event loop runs microtasks (Promises) first, then the next task from the task queue (e.g. `setTimeout`).",
                            de: "Sobald der Call Stack leer ist, führt der Event Loop zuerst die Microtasks (Promises) aus, danach die nächste Task aus der Task Queue (z. B. `setTimeout`).",
                        },
                    },
                ],
            },
            {
                type: "code",
                lang: "js",
                // Never translated — it is source, not prose.
                code: `console.log("1");                                  // sync

setTimeout(() => console.log("4"), 0);             // task queue

Promise.resolve().then(() => console.log("3"));    // microtask queue

console.log("2");                                  // sync

// Output: 1 2 3 4`,
            },
        ],
        cards: [
            {
                type: "note",
                title: { en: "Call stack", de: "Call Stack" },
                text: {
                    en: "The call stack keeps track of function calls. When a function is called, it's pushed onto the stack, and when it returns, it's popped off. JavaScript has only one call stack, so it can only run one thing at a time.",
                    de: "Der Call Stack merkt sich, welche Funktion gerade läuft. Wird eine Funktion aufgerufen, kommt sie oben auf den Stack, und wenn sie fertig ist, wird sie wieder entfernt. JavaScript hat nur einen Call Stack und kann deshalb immer nur eine Sache gleichzeitig ausführen.",
                },
            },
            {
                type: "trap",
                title: {
                    en: "Code after an async call doesn't wait",
                    de: "Code nach einem async-Aufruf wartet nicht",
                },
                text: {
                    en: "Code written after an async call runs immediately, before the result exists. Code that depends on the result has to go inside `.then()` or after `await`. `await` only pauses the current function, so the rest of the program keeps running.",
                    de: "Code, der nach einem async-Aufruf steht, läuft sofort, also bevor das Ergebnis da ist. Code, der vom Ergebnis abhängt, gehört in `.then()` oder hinter `await`. `await` pausiert nur die aktuelle Funktion, der Rest des Programms läuft weiter.",
                },
            },
        ],
    },
];
