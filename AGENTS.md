<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database

Interview content lives in MongoDB (Atlas). Projects stay as files — only the
Interviews tree and its questions are in the database today, and the schema is
generic (`nodes` / `entries`) so other content can move in later without a
second shape.

Connection: `MONGODB_URI` + `MONGODB_DB` from `.env.local` (never committed;
see `.env.example`). `npm run db:ping` checks it. The URI carries the password,
so **never print or log it** — host only.

## Rules

- **Never drop or rename a collection or field directly.** Every shape change
  is a new numbered migration in `db/migrations/` that upgrades the stored
  documents in place and bumps their `schemaVersion`. Migrations are additive
  and idempotent.
- **Schema changes never lose data.** `db:migrate` runs `db:export` first, so
  no migration is the first thing to touch a database without a snapshot on
  disk.
- **Readers tolerate missing optional fields**, and accept any
  `schemaVersion >= 1` — a document that has not been migrated yet must still
  parse. An invalid or unknown block is dropped with a server-side warning
  rather than crashing the page (`safeBlocks` in `src/server/schema.ts`).
- **The seed only inserts.** `db:seed` `$set`s structural fields on `nodes`,
  but uses `$setOnInsert` for the whole of an `entries` document: an existing
  question is never modified by a seed run. Content changes go through
  `db:content` batches.
- **Pictures never go in the database.** Bytes go through the storage adapter
  (`src/server/storage`, today `/storage/assets`, committed); the `assets`
  collection holds metadata and the opaque storage key only.
- **Run `db:export` and commit `db/backup/` after every content batch.** The
  scripts in git plus that export are the two copies of the content.
- `src/server/schema.ts` is the only source of DB types: zod schemas first,
  TypeScript types inferred. No hand-written interface for a stored shape.
- `src/server/db.ts` is `server-only`. The scripts open their own client
  (`scripts/db/lib.ts`) and must not import it.

## Scripts

| command | does |
| --- | --- |
| `npm run db:ping` | checks the connection (host only, no secrets) |
| `npm run db:migrate` | exports, then applies pending `db/migrations/*` |
| `npm run db:seed` | upserts the tree, inserts missing questions |
| `npm run db:content -- <file>` | applies a content batch (`db/content/README.md`) |
| `npm run db:export` | writes `db/backup/*.json` (canonical EJSON, sorted) |
| `npm run db:restore -- --confirm` | upserts `db/backup/*.json`; never deletes |
| `npm run db:asset -- <file> --alt-en "…"` | stores a picture, registers the asset |

## Collections

- `nodes` — the navigation tree: `area` / `category` / `item` / `page`, keyed
  by a unique `path` such as
  `interviews/preparation/fullstack-questions/javascript`, with `parent` as the
  parent's path.
- `entries` — content units, one per question (`kind: "question"`), unique by
  `{ page, slug }`.
- `assets` — picture metadata plus its storage key.
- `migrations` — one document per applied migration.

`status` is `active` (published) / `planned` (scaffolded, unwritten) /
`hidden` (never served). Hidden nodes and entries are filtered out in
`src/lib/interviews.ts`, so no caller can leak one by forgetting a check.
