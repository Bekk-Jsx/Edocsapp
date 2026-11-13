import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// BATCH 004 — the virtual DOM, on the React page.
//
// Fills the question the seed already scaffolded as `virtual-dom` (high
// priority). No new slug: a `react-virtual-dom` beside it would ask the same
// thing twice on one page, and the React page's own prefix is the page, not
// the slug.
//
// The code example is JSX, which Shiki highlights from its bundled languages
// already — `lang: "jsx"` needs nothing added to CodeBlock.
// ===================================================================

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/react",
        slug: "virtual-dom",
        title: {
            en: "What is the Virtual DOM (Document Object Model) in React?",
            de: "Was ist das Virtual DOM (Document Object Model) in React?",
        },
        status: "active",
        priority: "high",
        tags: ["react", "virtual-dom", "rendering"],
        shortAnswer: {
            en: "The Virtual DOM is a lightweight copy of the real DOM that React keeps in memory. It lets React update the UI efficiently by changing only what's actually different.",
            de: "Das Virtual DOM ist eine leichtgewichtige Kopie des echten DOM, die React im Speicher hält. Damit kann React die UI effizient aktualisieren, weil nur das geändert wird, was sich wirklich unterscheidet.",
        },
        blocks: [
            {
                type: "list",
                ordered: false,
                items: [
                    {
                        text: {
                            en: "When state or props change, React creates a new Virtual DOM tree.",
                            de: "Wenn sich State oder Props ändern, erstellt React einen neuen Virtual-DOM-Baum.",
                        },
                    },
                    {
                        text: {
                            en: "React compares it with the previous tree. This process is called reconciliation (diffing).",
                            de: "React vergleicht ihn mit dem vorherigen Baum. Diesen Prozess nennt man Reconciliation (Diffing).",
                        },
                    },
                    {
                        text: {
                            en: "React then updates only the changed parts in the real DOM instead of re-rendering the whole page.",
                            de: "Danach aktualisiert React im echten DOM nur die geänderten Teile, statt die ganze Seite neu zu rendern.",
                        },
                    },
                ],
            },
            {
                type: "code",
                lang: "jsx",
                // Never translated — it is source, not prose.
                code: `// Wrong: index as key, breaks when items are added, removed or reordered
{todos.map((todo, index) => (
  <TodoItem key={index} todo={todo} />
))}

// Right: stable, unique ID as key
{todos.map((todo) => (
  <TodoItem key={todo.id} todo={todo} />
))}`,
            },
        ],
        cards: [
            {
                type: "note",
                title: {
                    en: "Why is the real DOM slow?",
                    de: "Warum ist das echte DOM langsam?",
                },
                text: {
                    en: "Updating the real DOM triggers layout and repaint in the browser, which is expensive. Changing a JavaScript object in memory is much cheaper.",
                    de: "Änderungen am echten DOM lösen im Browser Layout und Repaint aus, und das ist aufwendig. Ein JavaScript-Objekt im Speicher zu ändern, ist viel günstiger.",
                },
            },
            {
                type: "trap",
                title: { en: "Keys in lists", de: "Keys in Listen" },
                text: {
                    en: "React uses `key` to match list items between renders. Using the array index as the key can cause wrong updates when items are added, removed or reordered. Use a stable, unique ID instead.",
                    de: "React nutzt `key`, um Listenelemente zwischen zwei Renders zuzuordnen. Wenn man den Array-Index als Key verwendet, kann es beim Hinzufügen, Entfernen oder Sortieren zu falschen Updates kommen. Besser ist eine stabile, eindeutige ID.",
                },
            },
        ],
    },
];
