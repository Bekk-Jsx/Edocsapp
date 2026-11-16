import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// BATCH 009 — Express middleware, and `interface` vs `type`.
//
// Two written answers for the two questions db:seed scaffolded alongside
// this batch:
//
//   node-express/node-express-middleware   on the existing Node.js & Express
//                                          page, not on a second "nodejs"
//                                          page beside it — that page already
//                                          owns Express, middleware included
//                                          (`builtin-middleware`,
//                                          `next-function`), and a node path
//                                          can only be retired by a
//                                          migration.
//   typescript/ts-interface-vs-type        on a new TypeScript page (order 17
//                                          under fullstack-questions), which
//                                          the seed creates.
//
// Structure is the seed's: `order` is not a ContentEntry field, so the
// middleware question sits last on its page (17 of 17) and the TypeScript one
// is the only question on its own. Nothing here can reach another entry —
// db:content upserts by { page, slug }.
//
// Both answers are bullets-or-table plus one code block, with the two cards
// (note + trap) that put the marks on the rail. Table cells and card text are
// ordinary inline text, so `|` inside a backticked cell is just a character:
// the table is structured data, never a parsed Markdown row.
// ===================================================================

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/node-express",
        slug: "node-express-middleware",
        title: {
            en: "What is middleware in Express?",
            de: "Was ist Middleware in Express?",
        },
        status: "active",
        priority: "high",
        tags: ["node", "express", "middleware"],
        shortAnswer: {
            en: "Middleware is a function that runs between the incoming request and the final response. It can read or change the request, end the response, or pass control to the next function with `next()`.",
            de: "Middleware ist eine Funktion, die zwischen dem eingehenden Request und der finalen Response läuft. Sie kann den Request lesen oder verändern, die Response direkt beenden oder mit `next()` an die nächste Funktion weitergeben.",
        },
        blocks: [
            {
                type: "list",
                ordered: false,
                items: [
                    {
                        text: {
                            en: "Each middleware gets `req`, `res` and `next` as arguments.",
                            de: "Jede Middleware bekommt `req`, `res` und `next` als Argumente.",
                        },
                    },
                    {
                        text: {
                            en: "Middleware runs in the order it's registered, with `app.use()` or on a specific route.",
                            de: "Middleware läuft in der Reihenfolge, in der sie registriert wurde, mit `app.use()` oder an einer bestimmten Route.",
                        },
                    },
                    {
                        text: {
                            en: "Typical use cases are logging, parsing JSON (`express.json()`), authentication, CORS and error handling.",
                            de: "Typische Use Cases sind Logging, JSON parsen (`express.json()`), Authentifizierung, CORS und Error Handling.",
                        },
                    },
                ],
            },
            {
                type: "code",
                lang: "js",
                // Never translated — it is source, not prose.
                code: `const express = require("express");
const app = express();

// 1. Runs for every request
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.url}\`);
  next(); // pass control to the next middleware
});

// 2. Built-in middleware: parse JSON body
app.use(express.json());

// 3. Route-specific middleware (auth checks the token)
app.get("/profile", auth, (req, res) => {
  res.json(req.user);
});

// 4. Error handler: 4 arguments, registered last
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});`,
            },
        ],
        cards: [
            {
                type: "note",
                title: {
                    en: "Error-handling middleware",
                    de: "Error-Handling-Middleware",
                },
                text: {
                    en: "It has four arguments, `(err, req, res, next)`, and is registered after all routes. Calling `next(err)` jumps straight to it.",
                    de: "Sie hat vier Argumente, `(err, req, res, next)`, und wird nach allen Routes registriert. Mit `next(err)` springt Express direkt dorthin.",
                },
            },
            {
                type: "trap",
                title: {
                    en: "Forgetting `next()`",
                    de: "`next()` vergessen",
                },
                text: {
                    en: "If a middleware neither calls `next()` nor sends a response, the request hangs until it times out.",
                    de: "Wenn eine Middleware weder `next()` aufruft noch eine Response schickt, hängt der Request, bis es zum Timeout kommt.",
                },
            },
        ],
    },

    {
        page: "interviews/preparation/fullstack-questions/typescript",
        slug: "ts-interface-vs-type",
        title: {
            en: "What is the difference between `interface` and `type` in TypeScript?",
            de: "Was ist der Unterschied zwischen `interface` und `type` in TypeScript?",
        },
        status: "active",
        priority: "high",
        tags: ["typescript", "types"],
        shortAnswer: {
            en: "Both describe the shape of data. `interface` is mainly for objects and can be extended or merged. `type` is more flexible and can also describe unions, primitives and tuples.",
            de: "Beide beschreiben die Struktur von Daten. `interface` ist vor allem für Objekte gedacht und lässt sich erweitern oder zusammenführen. `type` ist flexibler und kann auch Unions, primitive Typen und Tuples beschreiben.",
        },
        blocks: [
            {
                // The first column is the row label, so its header is blank in
                // both languages — hasGerman() treats an empty `en` as nothing
                // to translate, which is why this cell passes the German gate.
                type: "table",
                columns: [
                    { en: "", de: "" },
                    { en: "interface", de: "interface" },
                    { en: "type", de: "type" },
                ],
                rows: [
                    [
                        { en: "Objects", de: "Objekte" },
                        { en: "Yes", de: "Ja" },
                        { en: "Yes", de: "Ja" },
                    ],
                    [
                        { en: 'Union types (`"a" | "b"`)', de: 'Union Types (`"a" | "b"`)' },
                        { en: "No", de: "Nein" },
                        { en: "Yes", de: "Ja" },
                    ],
                    [
                        {
                            en: "Primitive alias (`type Id = string`)",
                            de: "Alias für primitive Typen (`type Id = string`)",
                        },
                        { en: "No", de: "Nein" },
                        { en: "Yes", de: "Ja" },
                    ],
                    [
                        { en: "Tuples", de: "Tuples" },
                        { en: "No", de: "Nein" },
                        { en: "Yes", de: "Ja" },
                    ],
                    [
                        { en: "Extending", de: "Erweitern" },
                        { en: "`extends`", de: "`extends`" },
                        { en: "Intersection with `&`", de: "Intersection mit `&`" },
                    ],
                    [
                        { en: "Declaration merging", de: "Declaration Merging" },
                        { en: "Yes", de: "Ja" },
                        { en: "No (error)", de: "Nein (Fehler)" },
                    ],
                ],
            },
            {
                type: "code",
                lang: "ts",
                // Never translated — it is source, not prose.
                code: `interface User { id: string; name: string; }
interface Admin extends User { role: "admin"; }

type Id = string;                             // primitive alias: only with type
type Status = "active" | "blocked";           // union: only with type
type Point = [number, number];                // tuple
type Customer = User & { status: Status };    // intersection

// Declaration merging: only with interface
interface User { email: string; }             // User now has id, name, email`,
            },
        ],
        cards: [
            {
                type: "note",
                title: {
                    en: "Declaration merging",
                    de: "Declaration Merging",
                },
                text: {
                    en: "If you declare the same `interface` twice, TypeScript merges them into one. This is useful for extending library types, e.g. adding a field to `Request` in Express.",
                    de: "Wenn man dasselbe `interface` zweimal deklariert, führt TypeScript beide zu einem zusammen. Das ist praktisch, um Typen aus Libraries zu erweitern, z. B. ein Feld zu `Request` in Express hinzuzufügen.",
                },
            },
            {
                type: "trap",
                title: {
                    en: '"Which one should I use?"',
                    de: "„Was soll ich nehmen?“",
                },
                text: {
                    en: "Neither is wrong, but stay consistent. A common rule: `interface` for objects and public APIs, `type` for unions and everything else.",
                    de: "Beides ist richtig, aber man sollte konsistent bleiben. Eine gängige Regel: `interface` für Objekte und öffentliche APIs, `type` für Unions und alles andere.",
                },
            },
        ],
    },
];
