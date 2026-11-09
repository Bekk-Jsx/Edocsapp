#!/usr/bin/env node
// ===================================================================
// SEARCH SYNC — generates src/search/data/<project>.json (+ index.ts).
//
//   npm run search:sync    write the files
//   npm run search:check   generate in memory, exit 1 if any file is stale
//
// Reads, never edits: src/lib/projects.ts (the projects), each project's
// registry (CHAPTERS + TOPICS/HOOKS), each topic's page.tsx and the content
// modules it imports. Everything is parsed with the TypeScript compiler API —
// no regex over JSX, no extra dependency.
//
// What lands in the index, per page: name, chapter, parts (PartHeading text),
// section titles (DocSection title + the anchor DocSection derives from it,
// which is the id the rail card links to) and up to 8 keywords per section
// taken from inline <Code>/<Term> inside that section. No page prose.
// ===================================================================

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const OUT_DIR = path.join(SRC, "search", "data");
const APP_DIR = path.join(SRC, "app", "(projects)");
const CHECK = process.argv.includes("--check");

const GENERATED = "by npm run search:sync — do not edit";
const MAX_KEYWORDS = 8;
const FILLER = new Set([
    "const", "let", "var", "return", "true", "false", "if", "else", "new",
    "function", "this", "null", "undefined",
]);

const warnings = [];
const rel = (file) => path.relative(ROOT, file);
function warn(file, node, sf, message) {
    const line = node && sf ? sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 : 0;
    warnings.push(`${rel(file)}${line ? `:${line}` : ""} — ${message}`);
}

// ---------- helpers ----------------------------------------------------------

function parse(file) {
    const text = readFileSync(file, "utf8");
    const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

// Same algorithm as slug() in src/components/ui/doc-section.tsx — the anchor a
// DocSection gives itself, and therefore the href its rail card points at.
function slug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rarr: "→", larr: "←", mdash: "—", ndash: "–", hellip: "…", middot: "·", times: "×" };
function decodeEntities(s) {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
        if (e[0] === "#") {
            const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : m;
        }
        return ENTITIES[e.toLowerCase()] ?? m;
    });
}

const clean = (s) => s.replace(/\s+/g, " ").trim();

// Unwraps `x as const`, `x satisfies T`, parentheses.
function unwrap(expr) {
    while (
        expr &&
        (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) || ts.isParenthesizedExpression(expr))
    ) {
        expr = expr.expression;
    }
    return expr;
}

function stringValue(expr) {
    expr = unwrap(expr);
    if (!expr) return undefined;
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
    return undefined;
}

function objectProps(obj) {
    const out = {};
    for (const p of obj.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const name = p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : undefined;
        if (!name) continue;
        const init = unwrap(p.initializer);
        const s = stringValue(init);
        if (s !== undefined) out[name] = s;
        else if (ts.isArrayLiteralExpression(init)) {
            out[name] = init.elements.map(stringValue).filter((v) => v !== undefined);
        }
    }
    return out;
}

// Top-level `const NAME = <array literal>` declarations of a module.
function arrayConsts(sf) {
    const out = new Map();
    for (const stmt of sf.statements) {
        if (!ts.isVariableStatement(stmt)) continue;
        for (const d of stmt.declarationList.declarations) {
            const init = unwrap(d.initializer);
            if (ts.isIdentifier(d.name) && init && ts.isArrayLiteralExpression(init)) {
                out.set(d.name.text, init);
            }
        }
    }
    return out;
}

function resolveModule(specifier, fromFile) {
    let base;
    if (specifier.startsWith("@/")) base = path.join(SRC, specifier.slice(2));
    else if (specifier.startsWith(".")) base = path.resolve(path.dirname(fromFile), specifier);
    else return undefined;
    for (const candidate of [base, `${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx"), path.join(base, "index.ts")]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    return undefined;
}

// ---------- projects + registries ---------------------------------------------

function readProjects() {
    const file = path.join(SRC, "lib", "projects.ts");
    const arr = arrayConsts(parse(file)).get("PROJECTS");
    if (!arr) throw new Error(`${rel(file)}: PROJECTS array not found`);
    return arr.elements
        .map(unwrap)
        .filter(ts.isObjectLiteralExpression)
        .map(objectProps)
        .filter((p) => typeof p.slug === "string" && typeof p.title === "string");
}

// A project's registry is the .ts module directly under src/projects/<slug>/
// that declares CHAPTERS plus an array of { slug, name, … } objects (TOPICS, or
// HOOKS for the hooks project).
function readRegistry(projectSlug) {
    const dir = path.join(SRC, "projects", projectSlug);
    if (!existsSync(dir)) return undefined;
    const files = readdirSync(dir)
        .filter((f) => /\.tsx?$/.test(f))
        .sort()
        .map((f) => path.join(dir, f));

    for (const file of files) {
        const consts = arrayConsts(parse(file));
        const chaptersArr = consts.get("CHAPTERS");
        if (!chaptersArr) continue;

        const chapters = chaptersArr.elements.map((el) => {
            const s = stringValue(el);
            if (s !== undefined) return { id: s, label: s };
            const e = unwrap(el);
            if (ts.isObjectLiteralExpression(e)) {
                const p = objectProps(e);
                return { id: p.id ?? p.label, label: p.label ?? p.id };
            }
            return undefined;
        }).filter((c) => c && c.id);

        for (const [name, arr] of consts) {
            if (name === "CHAPTERS") continue;
            const objs = arr.elements.map(unwrap).filter(ts.isObjectLiteralExpression).map(objectProps);
            if (!objs.length || !objs.every((o) => typeof o.slug === "string" && typeof o.name === "string")) continue;
            return { file, chapters, topics: objs };
        }
        return { file, chapters, topics: [] };
    }
    return undefined;
}

// ---------- content walk ------------------------------------------------------

function tagName(node) {
    const t = ts.isJsxElement(node)
        ? node.openingElement.tagName
        : ts.isJsxSelfClosingElement(node)
          ? node.tagName
          : undefined;
    return t && ts.isIdentifier(t) ? t.text : undefined;
}

function attributes(node) {
    return ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
}

function jsxChildren(node) {
    return ts.isJsxElement(node) ? node.children : [];
}

// Visible text of a JSX subtree: JsxText (entity-decoded) and string-literal
// expressions such as {" "} or {"a <b>"}. Anything computed contributes nothing.
function textOf(node) {
    if (ts.isJsxText(node)) return decodeEntities(node.text);
    if (ts.isJsxExpression(node)) {
        const s = node.expression ? stringValue(node.expression) : undefined;
        return s ?? "";
    }
    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
        return node.children.map(textOf).join("");
    }
    return "";
}

function titleAttr(node) {
    for (const a of attributes(node).properties) {
        if (!ts.isJsxAttribute(a) || !ts.isIdentifier(a.name) || a.name.text !== "title") continue;
        if (!a.initializer) return undefined;
        if (ts.isStringLiteral(a.initializer)) return a.initializer.text;
        if (ts.isJsxExpression(a.initializer) && a.initializer.expression) {
            return stringValue(a.initializer.expression);
        }
        return undefined;
    }
    return undefined;
}

function collectKeywords(section, title) {
    const raw = [];
    const visit = (n) => {
        const tag = tagName(n);
        if (tag === "Code" || tag === "Term") {
            raw.push(clean(jsxChildren(n).map(textOf).join("")));
            return;
        }
        ts.forEachChild(n, visit);
    };
    for (const child of jsxChildren(section)) visit(child);

    const titleWords = new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
    const seen = new Set();
    const out = [];
    for (const k of raw) {
        if (k.length < 2 || k.length > 40) continue;
        const lower = k.toLowerCase();
        if (FILLER.has(lower) || seen.has(lower)) continue;
        const words = lower.split(/[^a-z0-9]+/).filter(Boolean);
        if (words.length && words.every((w) => titleWords.has(w))) continue;
        seen.add(lower);
        out.push(k);
        if (out.length === MAX_KEYWORDS) break;
    }
    return out;
}

// Walks one module in source order, appending parts/sections to `acc`.
function walkFile(file, pageHref, acc) {
    const sf = parse(file);
    const visit = (node) => {
        const tag = tagName(node);
        if (tag === "PartHeading") {
            const name = clean(jsxChildren(node).map(textOf).join(""));
            if (!name) warn(file, node, sf, "PartHeading text could not be resolved");
            acc.push({ name, href: "", titles: [] });
            return;
        }
        if (tag === "DocSection") {
            const title = titleAttr(node);
            if (title === undefined) {
                warn(file, node, sf, "DocSection title could not be resolved (not a string literal)");
                return;
            }
            const anchor = slug(title);
            if (!anchor) {
                warn(file, node, sf, `DocSection "${title}" has no usable anchor`);
                return;
            }
            if (!acc.length) acc.push({ name: "", href: "", titles: [] });
            acc[acc.length - 1].titles.push({
                title,
                href: `${pageHref}#${anchor}`,
                keywords: collectKeywords(node, title),
            });
            return;
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return sf;
}

function pageModules(pageFile, projectSlug) {
    const sf = parse(pageFile);
    const contentRoot = path.join(SRC, "projects", projectSlug) + path.sep;
    let planned = false;
    const modules = [];
    for (const stmt of sf.statements) {
        if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
        const spec = stmt.moduleSpecifier.text;
        if (/\/plan-page$/.test(spec)) planned = true;
        const resolved = resolveModule(spec, pageFile);
        if (resolved && resolved.startsWith(contentRoot)) modules.push(resolved);
    }
    return { planned, modules };
}

function buildPage(project, topic, chapterLabel) {
    const href = `/${project.slug}/${topic.slug}`;
    const pageFile = path.join(APP_DIR, project.slug, topic.slug, "page.tsx");
    const page = { slug: topic.slug, name: topic.name, chapter: chapterLabel, href, planned: false, parts: [] };

    if (!existsSync(pageFile)) {
        warnings.push(`${rel(pageFile)} — missing; "${topic.slug}" indexed as planned`);
        page.planned = true;
    } else {
        const { planned, modules } = pageModules(pageFile, project.slug);
        page.planned = planned;
        if (!planned) {
            const acc = [];
            walkFile(pageFile, href, acc);
            const seen = new Set();
            for (const m of modules) {
                if (seen.has(m)) continue;
                seen.add(m);
                walkFile(m, href, acc);
            }
            for (const part of acc) part.href = part.titles[0]?.href ?? href;
            page.parts = acc;
        }
    }

    if (page.planned) {
        const parts = Array.isArray(topic.parts) ? topic.parts : [];
        page.parts = parts.map((name) => ({ name, href, titles: [] }));
    }
    return page;
}

// ---------- generate ----------------------------------------------------------

function generate() {
    const files = new Map(); // absolute path -> content
    const stats = [];

    for (const project of readProjects()) {
        const registry = readRegistry(project.slug);
        if (!registry || !registry.topics.length) continue;

        const byChapter = new Map(registry.chapters.map((c) => [c.id, []]));
        const labelOf = new Map(registry.chapters.map((c) => [c.id, c.label]));
        const loose = [];
        for (const t of registry.topics) {
            const list = byChapter.get(t.chapter);
            if (list) list.push(t);
            else {
                warnings.push(`${rel(registry.file)} — topic "${t.slug}" has unknown chapter "${t.chapter}"`);
                loose.push(t);
            }
        }

        const pages = [];
        for (const [id, topics] of byChapter) {
            for (const t of topics) pages.push(buildPage(project, t, labelOf.get(id) ?? id));
        }
        for (const t of loose) pages.push(buildPage(project, t, t.chapter ?? ""));

        const data = {
            generated: GENERATED,
            project: { slug: project.slug, name: project.title, href: `/${project.slug}` },
            pages,
        };
        const json = `${JSON.stringify(data, null, 2)}\n`;
        files.set(path.join(OUT_DIR, `${project.slug}.json`), json);

        const parts = pages.flatMap((p) => p.parts);
        const titles = parts.flatMap((p) => p.titles);
        stats.push({
            project: project.slug,
            pages: pages.length,
            parts: parts.length,
            titles: titles.length,
            keywords: titles.reduce((n, t) => n + t.keywords.length, 0),
            bytes: Buffer.byteLength(json),
        });
    }

    // Loader map, so the client can import a project's JSON lazily by slug
    // without a per-project line anywhere else.
    const slugs = stats.map((s) => s.project);
    const index =
        `// Generated ${GENERATED}.\n` +
        `// One lazy loader per project index; src/search/load.ts is the only reader.\n\n` +
        `export const LOADERS: Record<string, () => Promise<{ default: unknown }>> = {\n` +
        slugs.map((s) => `    ${JSON.stringify(s)}: () => import("./${s}.json"),\n`).join("") +
        `};\n`;
    files.set(path.join(OUT_DIR, "index.ts"), index);

    return { files, stats };
}

// ---------- main --------------------------------------------------------------

const { files, stats } = generate();

for (const s of stats) {
    console.log(
        `${s.project.padEnd(16)} pages ${String(s.pages).padStart(3)} · parts ${String(s.parts).padStart(4)} · titles ${String(s.titles).padStart(4)} · keywords ${String(s.keywords).padStart(5)} · ${(s.bytes / 1024).toFixed(1)} KB`,
    );
}

const existing = existsSync(OUT_DIR)
    ? readdirSync(OUT_DIR).filter((f) => f.endsWith(".json") || f === "index.ts").map((f) => path.join(OUT_DIR, f))
    : [];
const extra = existing.filter((f) => !files.has(f));

if (CHECK) {
    const problems = [];
    for (const [file, content] of files) {
        if (!existsSync(file)) problems.push(`missing: ${rel(file)}`);
        else if (readFileSync(file, "utf8") !== content) problems.push(`stale:   ${rel(file)}`);
    }
    for (const f of extra) problems.push(`orphan:  ${rel(f)}`);
    if (warnings.length) {
        console.warn(`\n${warnings.length} warning(s):`);
        for (const w of warnings) console.warn(`  ⚠ ${w}`);
    }
    if (problems.length) {
        console.error("\nsearch index is out of date — run `npm run search:sync`:");
        for (const p of problems) console.error(`  ${p}`);
        process.exit(1);
    }
    console.log("\nsearch index is up to date.");
} else {
    mkdirSync(OUT_DIR, { recursive: true });
    for (const [file, content] of files) {
        if (!existsSync(file) || readFileSync(file, "utf8") !== content) writeFileSync(file, content);
    }
    for (const f of extra) unlinkSync(f);
    if (warnings.length) {
        console.warn(`\n${warnings.length} warning(s):`);
        for (const w of warnings) console.warn(`  ⚠ ${w}`);
    }
    console.log(`\nwrote ${files.size} file(s) to ${rel(OUT_DIR)}${extra.length ? `, removed ${extra.length}` : ""}.`);
}
