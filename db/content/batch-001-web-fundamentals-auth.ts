import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// batch-001 — authentication on Web Fundamentals.
//
// Three questions: JWT, sessions, and the comparison between them.
//
// `jwt-auth` is the slug the seed already created for the JWT question, so it
// is filled here rather than added again under a second name — the URL anchor
// #jwt-auth and its order (11) stay as they were.
//
// Fully bilingual: every text field carries `de`, so db:content accepts the
// batch without --allow-missing-de and the page switches completely rather
// than only its titles. The German wording is the author's own, supplied with
// the content.
//
// `code` is deliberately NOT localized — it is source, identical in both
// languages. Only a code block's caption would be.
// ===================================================================

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/web-fundamentals",
        slug: "jwt-auth",
        title: {
            en: "How does user authentication work with JWT (JSON Web Token)?",
            de: "Wie funktioniert die User-Authentifizierung mit JWT (JSON Web Token)?",
        },
        shortAnswer: {
            en: "User authentication verifies a user's identity before granting access to protected resources. A common approach is to use JWT (JSON Web Token) for secure authentication.",
            de: "Authentifizierung prüft die Identität eines Users, bevor er Zugriff auf geschützte Ressourcen bekommt. Ein gängiger Ansatz dafür ist JWT (JSON Web Token).",
        },
        status: "active",
        priority: "high",
        tags: ["auth", "jwt"],
        blocks: [
            {
                type: "list",
                // Numbered: these are the three steps of the flow, in order.
                ordered: true,
                items: [
                    {
                        text: {
                            en: "The user sends their credentials through a login form, and we verify them on the server.",
                            de: "Der User schickt seine Login-Daten über ein Formular, und wir prüfen sie auf dem Server.",
                        },
                    },
                    {
                        text: {
                            en: "If authentication is successful, the server generates a signed JWT and returns it to the client.",
                            de: "Ist der Login erfolgreich, erzeugt der Server ein signiertes JWT und gibt es an den Client zurück.",
                        },
                    },
                    {
                        text: {
                            en: "The client sends the JWT with every protected request, and the server validates it before allowing access.",
                            de: "Der Client schickt das JWT bei jedem geschützten Request mit, und der Server validiert es, bevor er den Zugriff erlaubt.",
                        },
                    },
                ],
            },
            {
                type: "code",
                lang: "js",
                code: `const jwt = require("jsonwebtoken");

// After login succeeds: create a signed token
const token = jwt.sign(
  { userId: user.id },          // payload
  process.env.JWT_SECRET,       // secret key
  { expiresIn: "15m" }          // expiry
);

// Example token: header.payload.signature
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjE3MzE0MjAwMDB9.4Hb9xK2mQpL7vR1sT8nW3yZ5aC6dE0fG

// On protected requests: validate the token
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}`,
            },
        ],
    },

    {
        page: "interviews/preparation/fullstack-questions/web-fundamentals",
        slug: "auth-session",
        title: {
            en: "How does user authentication work with sessions?",
            de: "Wie funktioniert die User-Authentifizierung mit Sessions?",
        },
        shortAnswer: {
            en: "User authentication verifies a user's identity before granting access to protected resources. Another common approach is session-based authentication, where the user's login state is stored on the server.",
            de: "Authentifizierung prüft die Identität eines Users, bevor er Zugriff auf geschützte Ressourcen bekommt. Ein weiterer gängiger Ansatz ist die Session-basierte Authentifizierung – dabei wird der Login-Status auf dem Server gespeichert.",
        },
        status: "active",
        priority: "high",
        tags: ["auth", "sessions"],
        blocks: [
            {
                type: "list",
                ordered: true,
                items: [
                    {
                        text: {
                            en: "The user sends their credentials through a login form, and we verify them on the server.",
                            de: "Der User schickt seine Login-Daten über ein Formular, und wir prüfen sie auf dem Server.",
                        },
                    },
                    {
                        text: {
                            en: "If authentication is successful, the server creates a session, stores it, and sends the session ID back in a cookie.",
                            de: "Ist der Login erfolgreich, legt der Server eine Session an, speichert sie und schickt die Session-ID als Cookie zurück.",
                        },
                    },
                    {
                        text: {
                            en: "The browser sends the cookie with every request automatically, and the server looks up the session to allow access.",
                            de: "Der Browser schickt das Cookie bei jedem Request automatisch mit, und der Server sucht die passende Session, um den Zugriff zu erlauben.",
                        },
                    },
                ],
            },
            {
                type: "code",
                lang: "js",
                code: `const session = require("express-session");

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, maxAge: 15 * 60 * 1000 }
}));

// After login succeeds: store the user in the session
req.session.userId = user.id;

// Cookie the browser receives:
// Set-Cookie: connect.sid=s%3A8fK2mQpL7vR1sT8nW3yZ5aC6; HttpOnly; Secure

// On protected requests: check the session
function auth(req, res, next) {
  if (req.session.userId) return next();
  res.status(401).json({ message: "Not authenticated" });
}`,
            },
        ],
    },

    {
        page: "interviews/preparation/fullstack-questions/web-fundamentals",
        slug: "auth-jwt-vs-session",
        title: {
            en: "What's the difference between JWT (JSON Web Token) and session-based authentication?",
            de: "Was ist der Unterschied zwischen JWT (JSON Web Token) und Session-basierter Authentifizierung?",
        },
        shortAnswer: {
            en: "Both approaches keep the user logged in. The main difference is where the user's state is stored: on the server with sessions, or inside the token with JWT.",
            de: "Beide Ansätze halten den User eingeloggt. Der Hauptunterschied ist, wo der Zustand gespeichert wird: bei Sessions auf dem Server, bei JWT im Token selbst.",
        },
        status: "active",
        priority: "high",
        tags: ["auth", "jwt", "sessions"],
        blocks: [
            {
                type: "table",
                // The empty first header is the row-label column. The two
                // technical headers read the same in German, but they still
                // carry `de` so no cell falls back and shows an "EN" marker.
                columns: [
                    { en: "", de: "" },
                    { en: "Session (stateful)", de: "Session (stateful)" },
                    { en: "JWT (stateless)", de: "JWT (stateless)" },
                ],
                rows: [
                    [
                        { en: "What the client holds", de: "Was der Client hat" },
                        {
                            en: "A random session ID (in a cookie)",
                            de: "Eine zufällige Session-ID (im Cookie)",
                        },
                        {
                            en: "A signed token with data inside (user id, role, expiry)",
                            de: "Ein signiertes Token mit Daten (User-ID, Rolle, Ablaufzeit)",
                        },
                    ],
                    [
                        { en: "Where the “truth” lives", de: "Wo die Daten liegen" },
                        {
                            en: "Server side (memory, Redis, DB)",
                            de: "Auf dem Server (Memory, Redis, DB)",
                        },
                        { en: "Inside the token itself", de: "Im Token selbst" },
                    ],
                    [
                        { en: "How the server checks", de: "Wie der Server prüft" },
                        {
                            en: "Looks up the ID in the store",
                            de: "Sucht die ID im Store",
                        },
                        {
                            en: "Verifies the signature, no lookup",
                            de: "Prüft die Signatur, kein Lookup",
                        },
                    ],
                    [
                        { en: "Logout / revoke", de: "Logout / Widerruf" },
                        {
                            en: "Easy: delete the session",
                            de: "Einfach: Session löschen",
                        },
                        {
                            en: "Hard: the token stays valid until it expires",
                            de: "Schwierig: Das Token bleibt bis zum Ablauf gültig",
                        },
                    ],
                    [
                        { en: "Scaling", de: "Skalierung" },
                        {
                            en: "Needs a shared store (e.g. Redis)",
                            de: "Braucht einen gemeinsamen Store (z. B. Redis)",
                        },
                        {
                            en: "Easy across services and servers",
                            de: "Einfach über mehrere Services und Server",
                        },
                    ],
                ],
            },
        ],
    },
];
