import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// BATCH 006 — CORS, on the Web Fundamentals page.
//
// Fills the question the seed already scaffolded as `cors` (order 7, high
// priority) rather than adding a `web-cors` beside it: the page is the prefix,
// so a `web-` slug would both repeat the page's own name in the URL and ask
// the same thing twice on one page. Same decision as `jwt-auth`, `event-loop`,
// `virtual-dom` and `sql-vs-nosql`. The title is widened to the question as it
// is actually asked, and the `#cors` anchor the page already links to is kept.
//
// The `web-fundamentals` page node already exists, active and bilingual
// (order 1 under fullstack-questions), so nothing structural is added here.
//
// The three bullets are an UNORDERED list: they are three facts about how CORS
// works, not steps in a sequence — unlike the numbered JWT flow in batch-001.
//
// `code` is deliberately NOT localized — it is source, identical in both
// languages. Its trailing comments show the two headers as they go over the
// wire, which is why they stay in the block rather than becoming prose.
// ===================================================================

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/web-fundamentals",
        slug: "cors",
        title: {
            en: "What is CORS (Cross-Origin Resource Sharing)?",
            de: "Was ist CORS (Cross-Origin Resource Sharing)?",
        },
        status: "active",
        priority: "high",
        tags: ["cors", "http", "security"],
        shortAnswer: {
            en: "CORS is a browser security mechanism that controls whether a website can request data from a different origin. The server decides which origins are allowed by sending special HTTP headers.",
            de: "CORS ist ein Sicherheitsmechanismus im Browser, der steuert, ob eine Website Daten von einem anderen Origin abfragen darf. Der Server entscheidet über spezielle HTTP-Header, welche Origins erlaubt sind.",
        },
        blocks: [
            {
                type: "list",
                ordered: false,
                items: [
                    {
                        text: {
                            en: "An origin is protocol + domain + port, e.g. `https://app.com:443`. If any part is different, the request is cross-origin.",
                            de: "Ein Origin besteht aus Protokoll, Domain und Port, z. B. `https://app.com:443`. Ist ein Teil davon anders, ist der Request cross-origin.",
                        },
                    },
                    {
                        text: {
                            en: "The browser sends the request with an `Origin` header, and the server answers with `Access-Control-Allow-Origin`.",
                            de: "Der Browser schickt den Request mit einem `Origin`-Header, und der Server antwortet mit `Access-Control-Allow-Origin`.",
                        },
                    },
                    {
                        text: {
                            en: "For more complex requests (e.g. `PUT`, `DELETE`, custom headers like `Authorization`, or `Content-Type: application/json`), the browser first sends a preflight `OPTIONS` request to ask for permission.",
                            de: "Bei komplexeren Requests (z. B. `PUT`, `DELETE`, eigene Header wie `Authorization` oder `Content-Type: application/json`) schickt der Browser vorher einen Preflight-Request mit `OPTIONS`, um die Erlaubnis abzufragen.",
                        },
                    },
                ],
            },
            {
                type: "code",
                lang: "js",
                code: `const cors = require("cors");

app.use(cors({
  origin: "https://app.com",   // allowed origin
  credentials: true            // allow cookies
}));

// Request header (sent by the browser):
// Origin: https://app.com

// Response header (sent by the server):
// Access-Control-Allow-Origin: https://app.com`,
            },
        ],
        cards: [
            {
                type: "note",
                title: {
                    en: "Same-Origin Policy",
                    de: "Same-Origin Policy",
                },
                text: {
                    en: "By default, the browser blocks a page from reading responses from another origin. CORS is the controlled way to relax this rule.",
                    de: "Standardmäßig verhindert der Browser, dass eine Seite Antworten von einem anderen Origin lesen kann. CORS ist der kontrollierte Weg, diese Regel zu lockern.",
                },
            },
            {
                type: "trap",
                title: {
                    en: "CORS doesn't protect your API",
                    de: "CORS schützt nicht deine API",
                },
                text: {
                    en: "CORS is enforced by the browser, not the server. Postman or server-to-server requests ignore it completely, so your API still needs authentication.",
                    de: "CORS wird vom Browser durchgesetzt, nicht vom Server. Postman oder Server-zu-Server-Requests ignorieren es komplett, deshalb braucht die API trotzdem Authentifizierung.",
                },
            },
        ],
    },
];
