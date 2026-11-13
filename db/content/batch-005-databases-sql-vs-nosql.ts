import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// BATCH 005 — SQL vs NoSQL, on the Databases page.
//
// Fills the question the seed already scaffolded as `sql-vs-nosql` (order 1,
// high priority) rather than adding a `db-sql-vs-nosql` beside it: the page is
// the prefix, so a `db-` slug would both repeat the page's own name in the URL
// and ask the same thing twice on one page. Same decision as `event-loop` and
// `virtual-dom`. The title is widened to the question as it is actually asked.
//
// The `databases` page node already exists, active and bilingual (order 5 under
// fullstack-questions), so nothing structural is added here.
//
// Table cells are ordinary inline text, so `SELECT` in a cell renders as an
// inline code token through the same parser as the short answer, the bullets
// and the cards (components/interviews/inline.tsx).
// ===================================================================

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/databases",
        slug: "sql-vs-nosql",
        title: {
            en: "What is the difference between SQL and NoSQL databases?",
            de: "Was ist der Unterschied zwischen SQL- und NoSQL-Datenbanken?",
        },
        status: "active",
        priority: "high",
        tags: ["databases", "sql", "nosql"],
        shortAnswer: {
            en: "SQL databases store data in tables with a fixed schema and relations between them. NoSQL databases store data in more flexible formats, like documents or key-value pairs, and are easier to scale horizontally.",
            de: "SQL-Datenbanken speichern Daten in Tabellen mit festem Schema und Beziehungen zwischen den Tabellen. NoSQL-Datenbanken speichern Daten flexibler, z. B. als Dokumente oder Key-Value-Paare, und lassen sich leichter horizontal skalieren.",
        },
        blocks: [
            {
                type: "table",
                columns: [
                    { en: "", de: "" },
                    { en: "SQL", de: "SQL" },
                    { en: "NoSQL", de: "NoSQL" },
                ],
                rows: [
                    [
                        { en: "Data model", de: "Datenmodell" },
                        {
                            en: "Tables with rows and columns",
                            de: "Tabellen mit Zeilen und Spalten",
                        },
                        {
                            en: "Documents, key-value, graph, wide-column",
                            de: "Dokumente, Key-Value, Graph, Wide-Column",
                        },
                    ],
                    [
                        { en: "How you query", de: "Abfragen" },
                        {
                            en: "SQL language (`SELECT`, `JOIN` …), raw queries or an ORM (Object Relational Mapper) like Sequelize or Prisma",
                            de: "SQL-Sprache (`SELECT`, `JOIN` …), direkt als Query oder über ein ORM (Object Relational Mapper) wie Sequelize oder Prisma",
                        },
                        {
                            en: "MongoDB Query API with JSON-like objects, through the official driver or an ODM (Object Document Mapper) like Mongoose",
                            de: "MongoDB Query API mit JSON-ähnlichen Objekten, über den offiziellen Driver oder ein ODM (Object Document Mapper) wie Mongoose",
                        },
                    ],
                    [
                        { en: "Schema", de: "Schema" },
                        { en: "Fixed, defined up front", de: "Fest, vorher definiert" },
                        {
                            en: "Flexible, can differ per document",
                            de: "Flexibel, kann sich pro Dokument unterscheiden",
                        },
                    ],
                    [
                        { en: "Relations", de: "Beziehungen" },
                        {
                            en: "JOINs between tables",
                            de: "JOINs zwischen Tabellen",
                        },
                        {
                            en: "Mostly embedded data, few joins",
                            de: "Meist eingebettete Daten, wenige Joins",
                        },
                    ],
                    [
                        { en: "Scaling", de: "Skalierung" },
                        {
                            en: "Mostly vertical (bigger server)",
                            de: "Meist vertikal (größerer Server)",
                        },
                        {
                            en: "Horizontal (more servers)",
                            de: "Horizontal (mehr Server)",
                        },
                    ],
                    [
                        { en: "Examples", de: "Beispiele" },
                        { en: "PostgreSQL, MySQL", de: "PostgreSQL, MySQL" },
                        { en: "MongoDB, Redis", de: "MongoDB, Redis" },
                    ],
                    [
                        { en: "Good for", de: "Geeignet für" },
                        {
                            en: "Structured data, transactions (e.g. payments)",
                            de: "Strukturierte Daten, Transaktionen (z. B. Payments)",
                        },
                        {
                            en: "Flexible or fast-changing data, high traffic",
                            de: "Flexible oder sich schnell ändernde Daten, hoher Traffic",
                        },
                    ],
                ],
            },
            {
                type: "code",
                lang: "js",
                // Never translated — it is source, not prose.
                code: `// SQL (PostgreSQL): user and orders in separate tables, combined with JOIN
const { rows } = await pool.query(
  \`SELECT u.name, o.total
   FROM users u
   JOIN orders o ON o.user_id = u.id
   WHERE u.id = $1\`,
  [userId]
);

// NoSQL (MongoDB): orders embedded in the user document, no JOIN needed
const user = await db.collection("users").findOne(
  { _id: userId },
  { projection: { name: 1, orders: 1 } }
);`,
            },
        ],
        cards: [
            {
                type: "note",
                title: {
                    en: "ACID (Atomicity, Consistency, Isolation, Durability)",
                    de: "ACID (Atomicity, Consistency, Isolation, Durability)",
                },
                text: {
                    en: "SQL databases guarantee ACID transactions: either all changes are saved or none are. This matters for things like payments. Today MongoDB also supports transactions across multiple documents.",
                    de: "SQL-Datenbanken garantieren ACID-Transaktionen: Entweder werden alle Änderungen gespeichert oder keine. Das ist z. B. bei Payments wichtig. MongoDB unterstützt heute aber auch Transaktionen über mehrere Dokumente.",
                },
            },
            {
                type: "trap",
                title: {
                    en: '"NoSQL means no schema"',
                    de: "„NoSQL heißt kein Schema“",
                },
                text: {
                    en: "Even without a schema in the database, your app still expects a fixed structure. Without validation (e.g. a Mongoose schema or JSON Schema), the data quickly becomes inconsistent.",
                    de: "Auch ohne Schema in der Datenbank erwartet die App eine feste Struktur. Ohne Validierung (z. B. ein Mongoose-Schema oder JSON Schema) werden die Daten schnell inkonsistent.",
                },
            },
        ],
    },
];
