import type { LocalizedText, Priority, Status } from "../../src/server/schema";

// ===================================================================
// SEED — the Interviews tree and its 265 questions.
//
// This file is DATA, not a script: db:seed reads it, inserts what is missing,
// and never modifies an entry that already exists. Answers arrive later
// through db:content batches, so every question starts with blocks: [] and
// status "planned" (or "hidden", for the ones below).
//
// Being in git makes it the second copy of the structure, alongside
// db/backup (see AGENTS.md > Database).
//
// EXPECTED_* at the bottom is asserted by db:seed — if a line is lost or
// duplicated while editing, the seed refuses to run rather than quietly
// writing a different set.
// ===================================================================

const PRIORITY: Record<"H" | "M" | "L", Priority> = {
    H: "high",
    M: "medium",
    L: "low",
};

export type EntrySource = { name: string; url: string };

export type SeedQuestion = {
    slug: string;
    priority: Priority;
    title: LocalizedText;
    status: Status;
    duplicateOf?: string;
    /**
     * Overrides the page's source. `null` means the question is ours and
     * carries no source at all — see `own()` below.
     */
    source?: EntrySource | null;
};

/** A question to be written: visible, planned, both languages. */
const q = (
    slug: string,
    priority: "H" | "M" | "L",
    en: string,
    de: string,
): SeedQuestion => ({
    slug,
    priority: PRIORITY[priority],
    title: { en, de },
    status: "planned",
});

/** A duplicate of another question: kept for its URL, never served. */
const dup = (slug: string, en: string, duplicateOf: string): SeedQuestion => ({
    slug,
    priority: PRIORITY.L,
    title: { en },
    status: "hidden",
    duplicateOf,
});

/**
 * A question of our own, on a page that otherwise carries a source: same as
 * `q`, but sourceless. Used for the Git questions appended to Git & Tools,
 * which are not from the GeeksforGeeks list the rest of that page came from.
 */
const own = (
    slug: string,
    priority: "H" | "M" | "L",
    en: string,
    de: string,
): SeedQuestion => ({ ...q(slug, priority, en, de), source: null });

/** Outside the stack (Spring, Django): kept for later, never served. */
const hid = (slug: string, en: string): SeedQuestion => ({
    slug,
    priority: PRIORITY.L,
    title: { en },
    status: "hidden",
});

export type SeedPage = {
    slug: string;
    /**
     * The item this page hangs under, by slug. Omitted means
     * fullstack-questions — where every page lived while this file described
     * only one item.
     */
    item?: string;
    name: LocalizedText;
    /**
     * Sidebar order within its item. Explicit rather than the array index,
     * because PAGES now spans two items — and because the AI pages leave gaps
     * for the parts of the v1 plan that are not written yet.
     */
    order: number;
    status: Status;
    /**
     * Where this page's questions came from. Omitted means the GeeksforGeeks
     * list the original 207 were taken from; `null` means they are ours and
     * carry no source.
     */
    source?: EntrySource | null;
    questions: SeedQuestion[];
};

// -------------------------------------------------------------------
// the tree above the pages
// -------------------------------------------------------------------

export const AREA = {
    slug: "interviews",
    path: "interviews",
    name: { en: "Interviews", de: "Interviews" },
    summary: {
        en: "Interview preparation: questions, answers and practice in English and German.",
        de: "Vorbereitung auf Interviews: Fragen, Antworten und Übung auf Englisch und Deutsch.",
    },
} as const;

export const CATEGORY = {
    slug: "preparation",
    path: "interviews/preparation",
    name: { en: "Preparation", de: "Vorbereitung" },
} as const;

export const ITEM = {
    slug: "fullstack-questions",
    path: "interviews/preparation/fullstack-questions",
    name: { en: "Full-Stack Questions", de: "Full-Stack-Fragen" },
    summary: {
        en: "Common full-stack developer interview questions with short answers and deep dives.",
        de: "Typische Interviewfragen für Full-Stack-Entwickler mit kurzen Antworten und Details.",
    },
} as const;

export type SeedItem = {
    slug: string;
    path: string;
    name: LocalizedText;
    summary: LocalizedText;
    order: number;
    status: Status;
};

/**
 * The items under Preparation, in sidebar order.
 *
 * Full-Stack Questions and AI in Development have pages; About Me is still
 * scaffolded and empty. An item becomes "active" through a content batch
 * (`items: [{ slug, status: "active" }]`) — AI in Development is deliberately
 * left "planned", because nothing in the serving code gates a page on its
 * item's status (only "hidden" is filtered, in src/lib/interviews.ts and
 * src/server/interviews.ts), so its pages are listed either way and the badge
 * stays honest while the answers are unwritten. The seed's $set on `order` is
 * what moves Full-Stack Questions from 0 to 2 on an existing database.
 */
export const ITEMS: SeedItem[] = [
    {
        slug: "about-me",
        path: `${CATEGORY.path}/about-me`,
        name: { en: "About Me", de: "Über mich" },
        summary: {
            en: "Your story for the interview: introduction, education, career, projects and expectations — written to memorize.",
            de: "Deine Geschichte fürs Interview: Vorstellung, Ausbildung, Karriere, Projekte und Erwartungen – zum Auswendiglernen.",
        },
        order: 1,
        status: "planned",
    },
    {
        slug: ITEM.slug,
        path: ITEM.path,
        name: ITEM.name,
        summary: ITEM.summary,
        order: 2,
        status: "active",
    },
    {
        slug: "ai-in-development",
        path: `${CATEGORY.path}/ai-in-development`,
        name: { en: "AI in Development", de: "KI in der Entwicklung" },
        summary: {
            en: "How you work with AI tools as a developer, and how to answer AI questions in interviews.",
            de: "Wie du als Entwickler mit KI-Tools arbeitest und wie du KI-Fragen im Interview beantwortest.",
        },
        order: 3,
        status: "planned",
    },
];

/** Every question seeded carries this source. */
export const SOURCE = {
    name: "GeeksforGeeks",
    url: "https://www.geeksforgeeks.org/html/full-stack-developer-interview-questions-and-answers/",
} as const;

// -------------------------------------------------------------------
// pages, in sidebar order
// -------------------------------------------------------------------

export const PAGES: SeedPage[] = [
    {
        slug: "web-fundamentals",
        name: { en: "Web Fundamentals", de: "Web-Grundlagen" },
        order: 1,
        status: "active",
        questions: [
            q("mern-stack", "M", "What is the MERN stack?", "Was ist der MERN-Stack?"),
            q("mern-flow", "L", "How do the parts of a MERN app work together?", "Wie arbeiten die Teile einer MERN-App zusammen?"),
            q("what-is-dns", "M", "What is DNS?", "Was ist DNS?"),
            q("dns-resolution", "M", "How does DNS resolution work?", "Wie funktioniert die DNS-Auflösung?"),
            q("http-vs-https", "H", "What is the difference between HTTP and HTTPS?", "Was ist der Unterschied zwischen HTTP und HTTPS?"),
            q("client-vs-server", "H", "What is the difference between client side and server side?", "Was ist der Unterschied zwischen Client-Side und Server-Side?"),
            q("cors", "H", "What is CORS?", "Was ist CORS?"),
            q("rest-api", "H", "What is a REST API?", "Was ist eine REST API?"),
            q("get-vs-post", "H", "GET vs POST: what is the difference?", "GET vs. POST: Was ist der Unterschied?"),
            q("put-vs-patch", "H", "PUT vs PATCH: what is the difference?", "PUT vs. PATCH: Was ist der Unterschied?"),
            q("jwt-auth", "H", "How does JWT authentication work?", "Wie funktioniert die Authentifizierung mit JWT?"),
            q("authn-vs-authz", "H", "Authentication vs authorization", "Authentifizierung vs. Autorisierung"),
            q("websockets-vs-http", "M", "WebSockets vs HTTP: when do you use which?", "WebSockets vs. HTTP: Wann nutzt man was?"),
            q("debug-fullstack", "H", "How do you debug a bug that crosses frontend and backend?", "Wie debuggt man einen Fehler zwischen Frontend und Backend?"),
            q("what-is-api", "M", "What is an API?", "Was ist eine API?"),
            q("web-server-role", "L", "What does a web server do?", "Was macht ein Webserver?"),
            q("cms", "L", "What is a CMS?", "Was ist ein CMS?"),
            q("deployment", "M", "How do you deploy a full-stack application?", "Wie deployt man eine Full-Stack-Anwendung?"),
            q("pwa", "L", "What is a Progressive Web App?", "Was ist eine Progressive Web App?"),
            q("responsive-design", "M", "What is responsive web design?", "Was ist Responsive Webdesign?"),
            // Appended rather than slotted next to jwt-auth (order 11) on
            // purpose: `order` comes from the position in this array, and the
            // seed only $setOnInserts an entry — so inserting in the middle
            // would give these two an order that an existing question already
            // holds. Renumbering would need a migration.
            q("auth-session", "H", "How does user authentication work with sessions?", "Wie funktioniert die Authentifizierung mit Sessions?"),
            q("auth-jwt-vs-session", "H", "What's the difference between JWT (JSON Web Token) and session-based authentication?", "Was ist der Unterschied zwischen JWT (JSON Web Token) und Session-basierter Authentifizierung?"),
        ],
    },
    {
        slug: "javascript",
        name: { en: "JavaScript", de: "JavaScript" },
        order: 2,
        status: "active",
        questions: [
            q("event-loop", "H", "How does the event loop work?", "Wie funktioniert der Event Loop?"),
            q("promises", "H", "What are Promises?", "Was sind Promises?"),
            q("single-threaded", "M", "Is JavaScript single-threaded? How does it handle multithreading?", "Ist JavaScript single-threaded? Wie geht es mit Multithreading um?"),
            q("equality", "H", "== vs ===: what is the difference?", "== vs. ===: Was ist der Unterschied?"),
            q("callback-hell", "M", "What is callback hell and how do you avoid it?", "Was ist Callback Hell und wie vermeidet man sie?"),
            q("temporal-dead-zone", "H", "What is the temporal dead zone?", "Was ist die Temporal Dead Zone?"),
            q("data-types", "H", "Which data types does JavaScript have?", "Welche Datentypen gibt es in JavaScript?"),
            q("js-comments", "L", "How do you write comments in JavaScript?", "Wie schreibt man Kommentare in JavaScript?"),
            q("coercion-3-2-7", "M", 'What is the result of 3 + 2 + "7", and why?', 'Was ist das Ergebnis von 3 + 2 + "7" und warum?'),
            q("isnan", "L", "What does isNaN do?", "Was macht isNaN?"),
            q("js-vs-asp", "L", "Is JavaScript faster than ASP Script?", "Ist JavaScript schneller als ASP Script?"),
            q("negative-infinity", "L", "What is negative infinity?", "Was ist negative Unendlichkeit (-Infinity)?"),
            q("multiline-code", "L", "How do you split JavaScript code over several lines?", "Wie teilt man JavaScript-Code auf mehrere Zeilen auf?"),
            q("js-creator", "L", "Who created JavaScript?", "Wer hat JavaScript entwickelt?"),
            q("undeclared-vs-undefined", "M", "Undeclared vs undefined variables", "Nicht deklarierte vs. undefined Variablen"),
            q("global-variables", "M", "What are global variables, and what are their problems?", "Was sind globale Variablen und welche Probleme haben sie?"),
            q("null", "M", "What is null, and how is it different from undefined?", "Was ist null und was ist der Unterschied zu undefined?"),
            q("delete-property", "L", "How do you delete a property from an object?", "Wie löscht man eine Property aus einem Objekt?"),
            q("this-keyword", "H", "How does the this keyword work?", "Wie funktioniert das Keyword this?"),
            q("timers", "M", "How do timers (setTimeout, setInterval) work?", "Wie funktionieren Timer (setTimeout, setInterval)?"),
            q("loops", "L", "Which loop structures does JavaScript have?", "Welche Schleifen gibt es in JavaScript?"),
            q("dynamic-typing", "M", "Is JavaScript dynamically typed?", "Ist JavaScript dynamisch typisiert?"),
            q("string-to-int", "L", "How do you convert a string to an integer?", "Wie wandelt man einen String in eine Ganzzahl um?"),
            q("strict-mode", "M", "What is strict mode?", "Was ist der Strict Mode?"),
            q("closures", "H", "What is a closure?", "Was ist eine Closure?"),
            q("call-apply-bind", "H", "What do call(), apply() and bind() do?", "Was machen call(), apply() und bind()?"),
            q("error-types", "M", "Which types of errors exist in JavaScript?", "Welche Fehlertypen gibt es in JavaScript?"),
        ],
    },
    {
        slug: "react",
        name: { en: "React", de: "React" },
        order: 3,
        status: "active",
        questions: [
            q("what-is-react", "M", "What is React?", "Was ist React?"),
            q("mvc", "L", "What is MVC architecture, and where does React fit?", "Was ist die MVC-Architektur und wo passt React hinein?"),
            q("building-blocks", "M", "What are the main building blocks of React?", "Was sind die wichtigsten Bausteine von React?"),
            q("virtual-dom", "H", "What is the virtual DOM?", "Was ist das Virtual DOM?"),
            q("jsx", "H", "What is JSX?", "Was ist JSX?"),
            q("component-types", "M", "Which types of components exist?", "Welche Arten von Komponenten gibt es?"),
            q("browser-jsx", "M", "How does the browser run JSX?", "Wie führt der Browser JSX aus?"),
            q("create-react-app", "L", "How do you create a React app?", "Wie erstellt man eine React-App?"),
            q("events", "M", "How do events work in React?", "Wie funktionieren Events in React?"),
            q("lists", "M", "How do you render lists in React?", "Wie rendert man Listen in React?"),
            q("keys", "H", "Why do lists need keys?", "Warum brauchen Listen Keys?"),
            q("conditional-rendering", "M", "How does conditional rendering work?", "Wie funktioniert Conditional Rendering?"),
            q("react-router", "M", "What is React Router?", "Was ist React Router?"),
            q("router-components", "L", "Which components does React Router provide?", "Welche Komponenten bietet React Router?"),
            q("lifecycle", "M", "What are the component lifecycle methods?", "Was sind die Lifecycle-Methoden einer Komponente?"),
            q("mounting-methods", "L", "Which methods run in the mounting phase?", "Welche Methoden laufen in der Mounting-Phase?"),
            q("setstate", "M", "How does setState work?", "Wie funktioniert setState?"),
            q("refs", "M", "What are refs used for?", "Wofür nutzt man Refs?"),
            q("hooks", "H", "What are hooks?", "Was sind Hooks?"),
            q("usestate", "H", "How does useState work?", "Wie funktioniert useState?"),
            q("useeffect", "H", "How does useEffect work?", "Wie funktioniert useEffect?"),
            q("fragments", "M", "What are fragments?", "Was sind Fragments?"),
            q("devtools", "L", "What are React DevTools used for?", "Wofür nutzt man die React DevTools?"),
            q("functional-update", "H", "Why update state with a callback?", "Warum aktualisiert man State mit einem Callback?"),
            q("material-ui", "L", "What is Material UI?", "Was ist Material UI?"),
            q("flux-redux", "M", "What is the Flux architecture in Redux?", "Was ist die Flux-Architektur in Redux?"),
        ],
    },
    {
        slug: "node-express",
        name: { en: "Node.js & Express", de: "Node.js & Express" },
        order: 4,
        status: "active",
        questions: [
            q("what-is-express", "M", "What is Express?", "Was ist Express?"),
            q("why-express", "L", "Why use Express?", "Warum nutzt man Express?"),
            q("express-cors", "M", "How do you enable CORS in Express?", "Wie aktiviert man CORS in Express?"),
            q("builtin-middleware", "M", "Which built-in middleware does Express have?", "Welche eingebaute Middleware hat Express?"),
            q("app-set", "L", "What does app.set() configure?", "Was konfiguriert app.set()?"),
            q("express-databases", "L", "Which databases work with Express?", "Welche Datenbanken funktionieren mit Express?"),
            q("static-files", "L", "How do you serve static files in Express?", "Wie liefert man statische Dateien mit Express aus?"),
            q("app-use", "M", "What does app.use() do?", "Was macht app.use()?"),
            q("error-handling", "H", "How does error handling work in Express?", "Wie funktioniert Error Handling in Express?"),
            q("traditional-vs-express", "L", "Traditional web server vs Express server", "Klassischer Webserver vs. Express-Server"),
            q("next-function", "H", "What does next() do in Express middleware?", "Was macht next() in einer Express-Middleware?"),
            q("util-module", "L", "What is the util module?", "Was ist das util-Modul?"),
            q("env-variables", "H", "How do you use environment variables in Node.js?", "Wie nutzt man Umgebungsvariablen in Node.js?"),
            q("dns-module", "L", "What is the dns module?", "Was ist das dns-Modul?"),
            q("child-processes", "M", "What are child processes?", "Was sind Child Processes?"),
            q("tracing", "L", "What is tracing in Node.js?", "Was ist Tracing in Node.js?"),
            // Ours, not from the GeeksforGeeks list the rest of this page came from.
            own("node-express-middleware", "H", "What is middleware in Express?", "Was ist Middleware in Express?"),
        ],
    },
    {
        slug: "databases",
        name: { en: "Databases", de: "Datenbanken" },
        order: 5,
        status: "active",
        questions: [
            q("sql-vs-nosql", "H", "Relational vs non-relational databases", "Relationale vs. nicht-relationale Datenbanken"),
            q("normalization", "H", "Normalization vs denormalization", "Normalisierung vs. Denormalisierung"),
            q("mongodb-vs-sql", "H", "MongoDB vs SQL databases", "MongoDB vs. SQL-Datenbanken"),
            q("bson", "L", "What is BSON?", "Was ist BSON?"),
            q("aggregation-framework", "M", "What is the aggregation framework in MongoDB?", "Was ist das Aggregation Framework in MongoDB?"),
            q("aggregation-operations", "M", "Which aggregation operations exist?", "Welche Aggregation-Operationen gibt es?"),
            q("write-concern", "M", "What is write concern?", "Was ist Write Concern?"),
            q("ttl-indexes", "L", "What are TTL indexes?", "Was sind TTL-Indexe?"),
            q("journaling", "L", "How does journaling affect performance?", "Wie beeinflusst Journaling die Performance?"),
            q("full-text-search", "M", "How does full-text search work in MongoDB?", "Wie funktioniert die Volltextsuche in MongoDB?"),
        ],
    },
    {
        slug: "browser-dom",
        name: { en: "Browser & DOM", de: "Browser & DOM" },
        order: 6,
        status: "active",
        questions: [
            q("event-bubbling", "H", "What are event bubbling and capturing?", "Was sind Event Bubbling und Event Capturing?"),
            q("prompt-box", "L", "What is a prompt box?", "Was ist eine Prompt-Box?"),
            q("add-elements", "M", "How do you add elements to the DOM dynamically?", "Wie fügt man dynamisch Elemente zum DOM hinzu?"),
            q("change-styles", "M", "How do you change styles and classes with JavaScript?", "Wie ändert man Styles und Klassen mit JavaScript?"),
            q("read-write-files", "L", "Can JavaScript read and write files?", "Kann JavaScript Dateien lesen und schreiben?"),
            q("detect-os", "L", "How do you detect the user's operating system?", "Wie erkennt man das Betriebssystem des Users?"),
            q("popup-boxes", "L", "Which popup boxes does JavaScript have?", "Welche Popup-Boxen gibt es in JavaScript?"),
            q("alert-vs-confirm", "L", "alert() vs confirm()", "alert() vs. confirm()"),
            q("innerhtml-risks", "H", "What are the drawbacks of innerHTML?", "Welche Nachteile hat innerHTML?"),
            q("void-0", "L", "What does javascript:void(0) do?", "Was macht javascript:void(0)?"),
            q("cookies", "M", "What are cookies?", "Was sind Cookies?"),
            q("create-cookie", "L", "How do you create a cookie with JavaScript?", "Wie erstellt man ein Cookie mit JavaScript?"),
            q("read-cookie", "L", "How do you read a cookie?", "Wie liest man ein Cookie?"),
            q("delete-cookie", "L", "How do you delete a cookie?", "Wie löscht man ein Cookie?"),
            q("escape-characters", "L", "What are escape characters?", "Was sind Escape-Zeichen?"),
            q("storage-comparison", "H", "Cookies vs sessionStorage vs localStorage", "Cookies vs. sessionStorage vs. localStorage"),
            q("web-workers", "M", "What are Web Workers?", "Was sind Web Workers?"),
            q("handling-events", "M", "How do you handle events in JavaScript?", "Wie behandelt man Events in JavaScript?"),
            q("checkbox-status", "L", "How do you read the state of a checkbox?", "Wie liest man den Status einer Checkbox?"),
            q("select-elements", "M", "How do you access HTML elements from JavaScript?", "Wie greift man mit JavaScript auf HTML-Elemente zu?"),
            dup("event-bubbling-2", "Event bubbling", "event-bubbling"),
        ],
    },
    {
        slug: "html",
        name: { en: "HTML", de: "HTML" },
        order: 7,
        status: "active",
        questions: [
            q("html-vs-html5", "M", "HTML vs HTML5", "HTML vs. HTML5"),
            q("html-vs-xhtml", "L", "HTML vs XHTML", "HTML vs. XHTML"),
            q("doctype", "M", "What does <!DOCTYPE html> do?", "Was macht <!DOCTYPE html>?"),
            q("tags-vs-elements", "L", "Tags vs elements", "Tags vs. Elemente"),
            q("headings", "L", "How do heading tags work?", "Wie funktionieren Überschriften-Tags?"),
            q("same-page-links", "L", "How do you link to a section on the same page?", "Wie verlinkt man auf einen Abschnitt derselben Seite?"),
            q("attributes", "L", "What are HTML attributes?", "Was sind HTML-Attribute?"),
            q("b-vs-strong", "M", "<b> vs <strong>", "<b> vs. <strong>"),
            q("em-vs-i", "L", "<em> vs <i>", "<em> vs. <i>"),
            q("html-comments", "L", "How do you write comments in HTML?", "Wie schreibt man Kommentare in HTML?"),
            q("block-vs-inline", "H", "Block vs inline elements", "Block- vs. Inline-Elemente"),
            q("div-vs-span", "M", "<div> vs <span>", "<div> vs. <span>"),
            dup("div-span-differences", "Differences between <div> and <span>", "div-vs-span"),
            q("class-vs-id", "M", "class vs id", "class vs. id"),
            q("meta-tags", "M", "What are meta tags used for?", "Wofür nutzt man Meta-Tags?"),
            q("anchor-tag", "L", "How does the anchor tag work?", "Wie funktioniert das Anchor-Tag?"),
            q("void-elements", "L", "What are void elements?", "Was sind Void-Elemente?"),
            q("inline-to-block", "L", "How do you make an inline element behave like a block?", "Wie macht man aus einem Inline-Element ein Block-Element?"),
            q("container-vs-empty", "L", "Container tags vs empty tags", "Container-Tags vs. leere Tags"),
            q("separating-text", "L", "Which tags separate sections of text?", "Welche Tags trennen Textabschnitte?"),
            q("script-in-html", "M", "How do you include JavaScript in HTML?", "Wie bindet man JavaScript in HTML ein?"),
            q("logical-vs-physical", "L", "Logical vs physical tags", "Logische vs. physische Tags"),
            q("mathml", "L", "What is MathML?", "Was ist MathML?"),
            q("scrolling-text", "L", "How do you make scrolling text or images?", "Wie erstellt man scrollenden Text oder Bilder?"),
            q("manifest-file", "L", "What is the manifest file in HTML5?", "Was ist die Manifest-Datei in HTML5?"),
            q("new-tab-links", "L", "How do you open a link in a new tab?", "Wie öffnet man einen Link in einem neuen Tab?"),
            q("multipart-form-data", "M", "What is multipart/form-data?", "Was ist multipart/form-data?"),
            q("svg", "L", "How do you add SVG to a page?", "Wie fügt man SVG in eine Seite ein?"),
            q("media-tags", "L", "Which media tags does HTML5 have?", "Welche Media-Tags gibt es in HTML5?"),
            q("cellpadding-vs-cellspacing", "L", "cellpadding vs cellspacing", "cellpadding vs. cellspacing"),
            q("frame-target", "L", "How does a link open inside a specific frame?", "Wie öffnet ein Link in einem bestimmten Frame?"),
        ],
    },
    {
        slug: "css",
        name: { en: "CSS", de: "CSS" },
        order: 8,
        status: "active",
        questions: [
            q("what-is-css", "L", "What is CSS?", "Was ist CSS?"),
            q("why-css", "L", "Why do we use CSS?", "Warum nutzt man CSS?"),
            q("css-vs-css3", "L", "CSS vs CSS3", "CSS vs. CSS3"),
            q("css-syntax", "L", "What does CSS syntax look like?", "Wie sieht die CSS-Syntax aus?"),
            q("add-css", "M", "What are the ways to add CSS to a page?", "Wie kann man CSS in eine Seite einbinden?"),
            q("css-comments", "L", "How do you write comments in CSS?", "Wie schreibt man Kommentare in CSS?"),
            q("rgba", "L", "What does the alpha channel in RGBA do?", "Was macht der Alpha-Kanal bei RGBA?"),
            q("hsl", "L", "What are HSL colors?", "Was sind HSL-Farben?"),
            q("border", "L", "Which border properties exist?", "Welche Border-Properties gibt es?"),
            q("apply-css", "L", "How are CSS styles applied to elements?", "Wie werden CSS-Styles auf Elemente angewendet?"),
            q("import-css", "L", "How do you include one CSS file in another?", "Wie bindet man eine CSS-Datei in eine andere ein?"),
            q("overlapping", "M", "How do you control overlapping elements (z-index)?", "Wie steuert man überlappende Elemente (z-index)?"),
            q("positioning", "H", "How does CSS positioning work?", "Wie funktioniert Positioning in CSS?"),
            q("overflow", "L", "What does overflow do?", "Was macht overflow?"),
            q("float", "L", "How does float work?", "Wie funktioniert float?"),
            q("inline-block", "M", "What is display: inline-block?", "Was ist display: inline-block?"),
            q("vertical-center", "M", "How do you center text vertically?", "Wie zentriert man Text vertikal?"),
            q("center-images", "L", "How do you center an image?", "Wie zentriert man ein Bild?"),
            q("combinators", "M", "What are CSS combinators?", "Was sind CSS-Kombinatoren?"),
            q("pseudo-classes", "M", "What are pseudo-classes?", "Was sind Pseudo-Klassen?"),
            q("pseudo-elements", "M", "What are pseudo-elements?", "Was sind Pseudo-Elemente?"),
            q("gradients", "L", "How do CSS gradients work?", "Wie funktionieren CSS-Gradients?"),
            q("transforms-2d", "L", "What are 2D transformations?", "Was sind 2D-Transformationen?"),
            q("transforms-3d", "L", "What are 3D transformations?", "Was sind 3D-Transformationen?"),
            q("transitions", "M", "How do CSS transitions work?", "Wie funktionieren CSS-Transitions?"),
            q("animations", "M", "How do CSS animations work?", "Wie funktionieren CSS-Animationen?"),
            q("box-sizing", "H", "What does box-sizing do?", "Was macht box-sizing?"),
            // The duplicate lives on another page, so the reference is qualified.
            dup("responsive-design-css", "Responsive design in CSS", "web-fundamentals/responsive-design"),
        ],
    },
    {
        slug: "git-tools",
        name: { en: "Git & Tools", de: "Git & Tools" },
        order: 9,
        status: "active",
        questions: [
            q("package-json", "M", "What is package.json?", "Was ist package.json?"),
            q("git-workflow", "H", "What is version control, and what does your Git workflow look like?", "Was ist Versionskontrolle und wie sieht dein Git-Workflow aus?"),
            q("postman", "L", "What is Postman used for?", "Wofür nutzt man Postman?"),
            q("what-is-git", "M", "What is Git?", "Was ist Git?"),
            q("git-repository", "L", "What is a Git repository?", "Was ist ein Git-Repository?"),
            q("pull-requests", "H", "What are the benefits of a pull request?", "Welche Vorteile hat ein Pull Request?"),
            q("git-bundle", "L", "What is git bundle?", "Was ist git bundle?"),
            q("git-object-model", "L", "What is the Git object model?", "Was ist das Git-Objektmodell?"),
            q("git-rebase", "H", "What does git rebase do (vs merge)?", "Was macht git rebase (vs. merge)?"),
            q("git-hooks", "M", "What are Git hooks?", "Was sind Git Hooks?"),
            // Appended, and sourceless: these four are ours, not from the
            // GeeksforGeeks list above. Two more were proposed and dropped as
            // duplicates — `merge-vs-rebase` is `git-rebase` (order 9, the
            // only answered question on this page, whose title batch-007
            // already widened to "merge vs rebase"), and a "what is a pull
            // request / what do you check in review" question is
            // `pull-requests` (order 6).
            own("merge-conflicts", "H", "How do you resolve a merge conflict?", "Wie löst du einen Merge-Konflikt?"),
            own("branching-strategies", "H", "Branching strategies: Git Flow, GitHub Flow, trunk-based", "Branching-Strategien: Git Flow, GitHub Flow, Trunk-based"),
            own("reset-revert-restore", "M", "git reset vs. git revert vs. git restore", "git reset vs. git revert vs. git restore"),
            own("cherry-pick-stash", "L", "git cherry-pick and git stash: when do you use them?", "git cherry-pick und git stash: Wann setzt du sie ein?"),
        ],
    },
    {
        slug: "spring",
        name: { en: "Spring" },
        order: 10,
        status: "hidden",
        questions: [
            hid("spring-boot", "What is Spring Boot?"),
            hid("spring-boot-features", "What are the features of Spring Boot?"),
            hid("spring-non-web", "Can Spring Boot build non-web applications?"),
            hid("spring-https-flow", "How does an HTTPS request flow through Spring Boot?"),
            hid("restcontroller", "What is @RestController?"),
            hid("controller-vs-restcontroller", "@Controller vs @RestController"),
            hid("thymeleaf", "What is Thymeleaf?"),
            hid("spring-data-jpa", "Spring Data vs Spring Data JPA"),
            hid("spring-mvc", "What is Spring MVC?"),
            hid("spring-bean", "What is a Spring Bean?"),
            hid("inner-beans", "What are inner beans?"),
        ],
    },
    {
        slug: "django-flask",
        name: { en: "Django & Flask" },
        order: 11,
        status: "hidden",
        questions: [
            hid("what-is-django", "What is Django?"),
            hid("flask-vs-django", "Flask vs Django"),
            hid("django-orm", "What is the Django ORM?"),
            hid("django-superuser", "What is a superuser in Django?"),
            hid("django-nosql", "Does Django support NoSQL databases?"),
        ],
    },
    // -----------------------------------------------------------------
    // Appended after django-flask (order 11) rather than slotted next to the
    // topics they belong beside: `order` is what the sidebar sorts on, and
    // renumbering the nine pages above would be a migration. Sourceless —
    // these are ours.
    // -----------------------------------------------------------------
    {
        slug: "testing",
        name: { en: "Testing", de: "Testing" },
        order: 12,
        status: "active",
        source: null,
        questions: [
            q("unit-integration-e2e", "H", "Unit, integration and end-to-end tests: what is the difference?", "Unit-, Integrations- und End-to-End-Tests: Was ist der Unterschied?"),
            q("testing-pyramid", "H", "What is the testing pyramid?", "Was ist die Testpyramide?"),
            q("jest-vs-vitest", "H", "Jest vs. Vitest: when do you use which?", "Jest vs. Vitest: Wann nimmst du was?"),
            q("mocking", "H", "How do you mock dependencies, API calls and timers?", "Wie mockst du Abhängigkeiten, API-Aufrufe und Timer?"),
            q("component-testing", "H", "How do you test a React or Vue component with Testing Library?", "Wie testest du eine React- oder Vue-Komponente mit der Testing Library?"),
            q("cypress-vs-playwright", "M", "Cypress vs. Playwright: what are the differences?", "Cypress vs. Playwright: Was sind die Unterschiede?"),
            q("tdd", "M", "What is TDD and how does it work?", "Was ist TDD und wie funktioniert es?"),
            q("api-testing", "M", "How do you test a Node.js / Express API endpoint?", "Wie testest du einen Node.js-/Express-API-Endpunkt?"),
            q("code-coverage", "M", "What is code coverage, and is 100% a good goal?", "Was ist Code Coverage, und sind 100 % ein sinnvolles Ziel?"),
            q("snapshot-tests", "L", "What are snapshot tests and when are they useful?", "Was sind Snapshot-Tests und wann sind sie sinnvoll?"),
            q("flaky-tests", "L", "How do you avoid flaky end-to-end tests?", "Wie vermeidest du instabile (flaky) End-to-End-Tests?"),
        ],
    },
    {
        slug: "apis-realtime",
        name: { en: "APIs & Real-Time", de: "APIs & Echtzeit" },
        order: 13,
        status: "active",
        source: null,
        questions: [
            q("graphql-vs-rest", "H", "What is GraphQL and how is it different from REST?", "Was ist GraphQL und wie unterscheidet es sich von REST?"),
            q("graphql-operations", "H", "Queries, mutations and subscriptions in GraphQL", "Queries, Mutations und Subscriptions in GraphQL"),
            q("websocket-vs-http", "H", "What is a WebSocket and how is it different from HTTP?", "Was ist ein WebSocket und wie unterscheidet er sich von HTTP?"),
            q("websocket-polling-sse", "H", "WebSockets vs. polling vs. Server-Sent Events: when to use which?", "WebSockets vs. Polling vs. Server-Sent Events: Wann nimmt man was?"),
            q("graphql-schema-resolvers", "M", "What are a GraphQL schema and resolvers?", "Was sind ein GraphQL-Schema und Resolver?"),
            q("graphql-n-plus-one", "M", "What is the N+1 problem in GraphQL and how does DataLoader solve it?", "Was ist das N+1-Problem in GraphQL und wie löst DataLoader es?"),
            q("socketio-vs-websocket", "M", "Socket.IO vs. native WebSockets", "Socket.IO vs. native WebSockets"),
            q("scaling-websockets", "M", "How do you scale WebSockets across several servers?", "Wie skalierst du WebSockets über mehrere Server?"),
            q("graphql-security", "L", "How do you secure a GraphQL API?", "Wie sicherst du eine GraphQL-API ab?"),
            q("webrtc-signaling", "L", "What is WebRTC and what is signaling?", "Was ist WebRTC und was ist Signaling?"),
        ],
    },
    {
        slug: "cloud-devops",
        name: { en: "Cloud & DevOps", de: "Cloud & DevOps" },
        order: 14,
        status: "active",
        source: null,
        questions: [
            q("what-is-docker", "H", "What is Docker and what problem does it solve?", "Was ist Docker und welches Problem löst es?"),
            q("image-vs-container", "H", "Docker image vs. container", "Docker-Image vs. Container"),
            q("dockerfile-best-practices", "H", "Dockerfile: main instructions and best practices (layers, caching, multi-stage builds)", "Dockerfile: wichtigste Anweisungen und Best Practices (Layer, Caching, Multi-Stage-Builds)"),
            q("docker-compose", "H", "What is Docker Compose and when do you use it?", "Was ist Docker Compose und wann setzt du es ein?"),
            q("ci-cd-pipeline", "H", "What is CI/CD and what does a typical pipeline look like?", "Was ist CI/CD und wie sieht eine typische Pipeline aus?"),
            q("aws-core-services", "H", "Main AWS services for a web app (EC2, S3, RDS, Lambda, CloudFront)", "Die wichtigsten AWS-Services für eine Web-App (EC2, S3, RDS, Lambda, CloudFront)"),
            q("containers-vs-vms", "M", "Containers vs. virtual machines", "Container vs. virtuelle Maschinen"),
            q("serverless", "M", "What is serverless (AWS Lambda, Google Cloud Functions)? Pros and cons", "Was ist Serverless (AWS Lambda, Google Cloud Functions)? Vor- und Nachteile"),
            q("env-and-secrets", "M", "How do you manage environment variables and secrets?", "Wie verwaltest du Umgebungsvariablen und Secrets?"),
            q("aws-iam", "M", "AWS IAM: users, roles and least privilege", "AWS IAM: Benutzer, Rollen und Least Privilege"),
            q("gcp-core-services", "M", "Main Google Cloud services (Cloud Run, Cloud Functions, BigQuery, Cloud Storage)", "Die wichtigsten Google-Cloud-Services (Cloud Run, Cloud Functions, BigQuery, Cloud Storage)"),
            q("deploy-node-docker", "L", "How do you deploy a Node.js app with Docker to AWS or Google Cloud?", "Wie deployst du eine Node.js-App mit Docker auf AWS oder Google Cloud?"),
            q("bigquery-vs-sql", "L", "What is BigQuery and how is it different from a normal SQL database?", "Was ist BigQuery und wie unterscheidet es sich von einer normalen SQL-Datenbank?"),
        ],
    },
    {
        slug: "payments",
        name: { en: "Payments", de: "Zahlungen" },
        order: 15,
        status: "active",
        source: null,
        questions: [
            q("stripe-payment-flow", "H", "How does a typical Stripe payment flow work (PaymentIntent)?", "Wie läuft ein typischer Stripe-Zahlungsablauf ab (PaymentIntent)?"),
            q("payment-webhooks", "H", "What are webhooks and why are they important for payments?", "Was sind Webhooks und warum sind sie bei Zahlungen wichtig?"),
            q("webhook-security", "H", "How do you secure webhooks (signature verification, idempotency)?", "Wie sicherst du Webhooks ab (Signaturprüfung, Idempotenz)?"),
            q("sca-3ds", "M", "What is SCA / 3-D Secure and how does it affect checkout?", "Was ist SCA / 3-D Secure und wie wirkt es sich auf den Checkout aus?"),
            q("checkout-vs-elements", "M", "Stripe Checkout vs. Stripe Elements", "Stripe Checkout vs. Stripe Elements"),
            q("refunds-failed-payments", "M", "How do you handle refunds and failed payments?", "Wie gehst du mit Erstattungen und fehlgeschlagenen Zahlungen um?"),
            q("pci-dss", "M", "What is PCI DSS and how do you avoid handling card data yourself?", "Was ist PCI DSS und wie vermeidest du es, selbst Kartendaten zu verarbeiten?"),
            q("payment-provider-migration", "L", "How do you migrate from one payment provider to another?", "Wie migrierst du von einem Zahlungsanbieter zu einem anderen?"),
        ],
    },
    {
        slug: "data-visualization",
        name: { en: "Data Visualization", de: "Datenvisualisierung" },
        order: 16,
        status: "active",
        source: null,
        questions: [
            q("choose-chart-type", "H", "How do you choose the right chart type for your data?", "Wie wählst du den passenden Diagrammtyp für deine Daten?"),
            q("large-datasets-charts", "H", "How do you handle large datasets in charts?", "Wie gehst du mit großen Datenmengen in Diagrammen um?"),
            q("chart-libraries", "M", "Recharts vs. Chart.js vs. ApexCharts vs. D3: what are the differences?", "Recharts vs. Chart.js vs. ApexCharts vs. D3: Was sind die Unterschiede?"),
            q("svg-vs-canvas", "M", "SVG vs. Canvas rendering for charts", "SVG- vs. Canvas-Rendering für Diagramme"),
            q("performant-dashboards", "M", "How do you build a fast dashboard?", "Wie baust du ein performantes Dashboard?"),
            q("accessible-charts", "L", "How do you make charts accessible?", "Wie machst du Diagramme barrierefrei?"),
        ],
    },
    {
        slug: "typescript",
        name: { en: "TypeScript", de: "TypeScript" },
        order: 17,
        status: "active",
        source: null,
        questions: [
            q("ts-interface-vs-type", "H", "What is the difference between `interface` and `type` in TypeScript?", "Was ist der Unterschied zwischen `interface` und `type` in TypeScript?"),
        ],
    },

    // -----------------------------------------------------------------
    // AI in Development — the first pages under a second item. The orders
    // are the agreed v1 plan's, gaps included: 2, 4 and 5 are reserved for
    // pages that are not written yet, so the ones that exist keep their
    // intended position instead of being renumbered later.
    // -----------------------------------------------------------------
    {
        slug: "your-ai-workflow",
        item: "ai-in-development",
        name: { en: "Your AI Workflow", de: "Dein KI-Workflow" },
        order: 1,
        status: "active",
        source: null,
        questions: [
            q("ai-daily-workflow", "H", "How do you use AI tools in your daily development work?", "Wie nutzt du KI-Tools in deiner täglichen Entwicklungsarbeit?"),
            q("ai-limits", "M", "Which tasks do you not give to AI, and why?", "Welche Aufgaben gibst du nicht an die KI ab, und warum?"),
        ],
    },
    {
        slug: "quality-responsibility",
        item: "ai-in-development",
        name: { en: "Quality & Responsibility", de: "Qualität & Verantwortung" },
        order: 3,
        status: "active",
        source: null,
        questions: [
            q("verify-ai-code", "H", "How do you check and verify AI-generated code?", "Wie prüfst du KI-generierten Code?"),
            q("ai-data-privacy", "H", "How do you handle company code and data privacy when using AI tools?", "Wie gehst du bei KI-Tools mit Firmencode und Datenschutz um?"),
        ],
    },
    {
        slug: "tool-landscape",
        item: "ai-in-development",
        name: { en: "Tool Landscape", de: "Tool-Landschaft" },
        order: 6,
        status: "active",
        source: null,
        questions: [
            q("copilot-cursor-claude-code", "H", "GitHub Copilot vs. Cursor vs. Claude Code: what is the difference?", "GitHub Copilot vs. Cursor vs. Claude Code: Was ist der Unterschied?"),
        ],
    },
    {
        slug: "ai-tech-stack",
        item: "ai-in-development",
        name: { en: "AI Tech Stack", de: "KI-Tech-Stack" },
        order: 7,
        status: "active",
        source: null,
        questions: [
            q("integrating-llms", "H", 'What does "integrating an LLM" (e.g. the OpenAI API) into an app mean?', "Was bedeutet es, ein LLM (z. B. die OpenAI-API) in eine App zu integrieren?"),
        ],
    },
];

// -------------------------------------------------------------------
// expected totals — asserted by db:seed
// -------------------------------------------------------------------

/** Questions per page slug. A mismatch stops the seed. */
export const EXPECTED_PER_PAGE: Record<string, number> = {
    "web-fundamentals": 22,
    javascript: 27,
    react: 26,
    "node-express": 17,
    databases: 10,
    "browser-dom": 21,
    html: 31,
    css: 28,
    // 10 seeded + 4 appended; two of the six proposed were duplicates.
    "git-tools": 14,
    spring: 11,
    "django-flask": 5,
    testing: 11,
    "apis-realtime": 10,
    "cloud-devops": 13,
    payments: 8,
    "data-visualization": 6,
    typescript: 1,
    "your-ai-workflow": 2,
    "quality-responsibility": 2,
    "tool-landscape": 1,
    "ai-tech-stack": 1,
};

/** 207 seeded first, then 58 appended, then 2 written answers. */
export const EXPECTED_TOTAL = 267;
/** 16 outside the stack (Spring, Django) + 3 duplicates. */
export const EXPECTED_HIDDEN = 19;
export const EXPECTED_VISIBLE = 248;
