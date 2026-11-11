# Content batches

Content enters the database **only** through a batch file in this folder. There
is no admin UI, and `db:seed` never edits an existing entry — so a batch is the
single way an answer is written or changed.

Because these files are in git, they are the second copy of the content; the
first is `db/backup/`, which `db:export` writes.

## Running one

```bash
npm run db:content -- db/content/batch-001-javascript-closures.ts
npm run db:export            # then commit db/backup/
```

The whole batch is validated with zod **before** anything is written, so a typo
in entry 40 cannot leave entries 1–39 applied. Each entry is then upserted by
`{ page, slug }` with `$set` on the content fields only — `order`, `kind` and
`source` stay as the seed wrote them. An entry whose content already matches is
reported as `unchanged` and not rewritten.

A batch can only fill a question the seed already created. A `{ page, slug }`
that is not in the database is reported and skipped, never inserted: the seed
owns structure, batches own content.

## File name

`batch-NNN-<short-name>.ts` — `NNN` is a zero-padded sequence, so the folder
reads in the order the content was written.

## Shape

The file exports `entries`, typed by `ContentEntry` from `src/server/schema.ts`:

| field         | required | notes                                                        |
| ------------- | -------- | ------------------------------------------------------------ |
| `page`        | yes      | full node path, e.g. `interviews/preparation/fullstack-questions/javascript` |
| `slug`        | yes      | the question's slug, as seeded                               |
| `title`       | yes      | `LocalizedText` — overrides the seeded title                  |
| `shortAnswer` | no       | the ~30-second spoken answer                                 |
| `blocks`      | yes      | the long answer; `[]` is valid                               |
| `followUps`   | no       | questions an interviewer is likely to ask next               |
| `tags`        | no       |                                                              |
| `priority`    | no       | `high` / `medium` / `low`; omit to keep the seeded priority  |
| `status`      | yes      | `active` to publish                                          |

Every translatable field is `LocalizedText`: `{ en: string; de?: string }`.
German is written later — a reader falls back to English whenever `de` is
missing. The `code` field of a code block is **never** translated.

## Inline markup

Inside any text field, three things are understood (rendering comes with the
question pages):

- `` `code` `` → inline code
- `**bold**` → bold
- `[label](url)` → link

## Every block type, once

The example below is a **reference, not a batch to run**: its page/slug pair is
fictional, so `db:content` would report it as skipped.

```ts
import type { ContentEntry } from "../../src/server/schema";

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/javascript",
        slug: "example-every-block",
        title: { en: "Every block type", de: "Alle Blocktypen" },
        shortAnswer: {
            en: "One sentence you could say out loud in 30 seconds.",
            de: "Ein Satz, den man in 30 Sekunden sagen kann.",
        },
        status: "active",
        priority: "medium",
        tags: ["example"],
        followUps: [
            { en: "And how would you test that?", de: "Und wie würdest du das testen?" },
        ],
        blocks: [
            { type: "paragraph", text: { en: "A paragraph with `code` and **bold**.", de: "Ein Absatz mit `code` und **bold**." } },

            { type: "heading", level: 3, text: { en: "A section", de: "Ein Abschnitt" } },

            {
                type: "list",
                ordered: false,
                items: [
                    { text: { en: "A top-level item", de: "Ein Punkt" } },
                    {
                        text: { en: "One with children", de: "Einer mit Unterpunkten" },
                        children: [{ text: { en: "Nested", de: "Verschachtelt" } }],
                    },
                ],
            },

            {
                type: "table",
                columns: [{ en: "Option" }, { en: "When" }],
                rows: [
                    [{ en: "`GET`" }, { en: "reading" }],
                    [{ en: "`POST`" }, { en: "creating" }],
                ],
                caption: { en: "Which verb to use", de: "Welches Verb wann" },
            },

            {
                type: "code",
                lang: "ts",
                // never translated
                code: "const answer = 42;",
                caption: { en: "The shape of it", de: "So sieht es aus" },
            },

            {
                type: "callout",
                severity: "trap",
                label: { en: "trap · the usual mistake", de: "Falle · der übliche Fehler" },
                text: { en: "What people get wrong here.", de: "Was hier oft falsch gemacht wird." },
            },

            // assetId comes from: npm run db:asset -- ./pic.png --alt-en "…"
            // The alt text lives on the asset, not on the block.
            { type: "image", assetId: "000000000000000000000000", caption: { en: "A diagram" } },

            {
                type: "compare",
                left: {
                    label: { en: "Without it", de: "Ohne" },
                    blocks: [{ type: "code", lang: "ts", code: "// the slow way" }],
                },
                right: {
                    label: { en: "With it", de: "Mit" },
                    blocks: [{ type: "code", lang: "ts", code: "// the fast way" }],
                },
            },
        ],
    },
];
```

## Callout severities

`danger` · `trap` · `difference` · `tip` · `note` — the same vocabulary the
project doc pages use (`src/lib/severity.tsx`), minus `next`, which is specific
to the React-vs-Next pages.
