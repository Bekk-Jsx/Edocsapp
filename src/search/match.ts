// ===================================================================
// MATCHING — normalize + scorer. No library.
//
// Raw score of a query against one text:
//   exact 100 · text starts with query 80 · a word starts with query 70
//   · contains 50 · typo (OSA distance 1 → 40, 2 → 30) · else 0.
// A multi-word query must match every word; its score is the average × 0.9.
// Raw < 30 is no match. The final score multiplies by the field weight.
// ===================================================================

import type { SearchField } from "./types";

export const WEIGHTS: Record<SearchField, number> = {
    page: 4,
    part: 3,
    title: 2,
    keyword: 1,
    note: 1,
};

export const MIN_QUERY = 2;
const MIN_RAW = 30;

const stripDiacritics = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "toValue" -> ["to", "Value"]; "HTMLElement" -> ["HTML", "Element"]. */
function splitCamel(token: string): string[] {
    return token
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .split(" ")
        .filter(Boolean);
}

export type Normalized = {
    /** camel-split words joined by single spaces: "to value inside". */
    full: string;
    /** everything alphanumeric, no separators: "tovalueinside". */
    compact: string;
    /** camel parts plus each joined token: ["to", "value", "tovalue", "inside"]. */
    words: string[];
};

/**
 * Lowercase, strip diacritics, split camelCase and - _ . / (and any other
 * punctuation) into words, collapse spaces. A camelCase token contributes its
 * parts AND its joined form, so "toValue" is found by "value" and "tovalue".
 */
export function normalize(text: string): Normalized {
    const tokens = stripDiacritics(text)
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean);
    const parts: string[] = [];
    const words: string[] = [];
    for (const token of tokens) {
        const camel = splitCamel(token).map((w) => w.toLowerCase());
        parts.push(...camel);
        words.push(...camel);
        if (camel.length > 1) words.push(camel.join(""));
    }
    return { full: parts.join(" "), compact: parts.join(""), words };
}

/** Optimal string alignment (restricted Damerau-Levenshtein) distance. */
export function osa(a: string, b: string): number {
    const n = a.length;
    const m = b.length;
    if (!n) return m;
    if (!m) return n;
    const d: number[][] = Array.from({ length: n + 1 }, (_, i) => {
        const row = new Array<number>(m + 1).fill(0);
        row[0] = i;
        return row;
    });
    for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                v = Math.min(v, d[i - 2][j - 2] + 1);
            }
            d[i][j] = v;
        }
    }
    return d[n][m];
}

const maxTypos = (len: number) => (len >= 8 ? 2 : len >= 4 ? 1 : 0);

/**
 * Smallest typo distance between a query term and any text word, or Infinity.
 * Each word is compared whole (skipped when lengths differ by > 2) and cut to
 * the term's length, so "compos"/"composbles" both reach "composables".
 */
export function typoDistance(term: string, words: string[]): number {
    const limit = maxTypos(term.length);
    if (!limit) return Infinity;
    let best = Infinity;
    for (const w of words) {
        if (Math.abs(w.length - term.length) <= 2) best = Math.min(best, osa(term, w));
        if (w.length > term.length) best = Math.min(best, osa(term, w.slice(0, term.length)));
        if (best === 0) break;
    }
    return best <= limit ? best : Infinity;
}

/** Single term (no spaces, already compacted) against a normalized text. */
function termScore(term: string, text: Normalized): number {
    if (!term) return 0;
    if (text.compact === term) return 100;
    if (text.compact.startsWith(term)) return 80;
    if (text.words.some((w) => w.startsWith(term))) return 70;
    if (text.compact.includes(term)) return 50;
    const d = typoDistance(term, text.words);
    if (d === 1) return 40;
    if (d === 2) return 30;
    return 0;
}

/** Whole query treated as a phrase against the space-joined text. */
function phraseScore(q: Normalized, text: Normalized): number {
    if (!q.full) return 0;
    if (text.full === q.full) return 100;
    if (text.full.startsWith(q.full)) return 80;
    if (` ${text.full}`.includes(` ${q.full}`)) return 70;
    if (text.full.includes(q.full)) return 50;
    return 0;
}

/** A prepared query: normalize once, score many texts. */
export type Query = {
    raw: string;
    norm: Normalized;
    /** whitespace-separated terms, each compacted ("to-value" -> "tovalue"). */
    terms: string[];
};

export function prepareQuery(raw: string): Query | null {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_QUERY) return null;
    const terms = trimmed
        .split(/\s+/)
        .map((t) => normalize(t).compact)
        .filter(Boolean);
    if (!terms.length) return null;
    return { raw: trimmed, norm: normalize(trimmed), terms };
}

// Normalizing the same title/keyword on every keystroke is the hot path;
// texts are few and stable, so a plain cache keeps scoring cheap.
const normCache = new Map<string, Normalized>();
function norm(text: string): Normalized {
    let n = normCache.get(text);
    if (!n) {
        n = normalize(text);
        normCache.set(text, n);
    }
    return n;
}

/** Raw 0–100 score of a query against one text; 0 below the threshold. */
export function rawScore(query: Query, text: string): number {
    const t = norm(text);
    let score = phraseScore(query.norm, t);
    if (query.terms.length === 1) {
        score = Math.max(score, termScore(query.terms[0], t));
    } else if (score === 0) {
        const each = query.terms.map((term) => termScore(term, t));
        if (each.every((s) => s >= MIN_RAW)) {
            score = (each.reduce((a, b) => a + b, 0) / each.length) * 0.9;
        }
    }
    return score >= MIN_RAW ? score : 0;
}

export const fieldScore = (query: Query, text: string, field: SearchField) =>
    rawScore(query, text) * WEIGHTS[field];

/**
 * "Did you mean" — for each query term with no exact vocabulary hit, the
 * closest vocabulary word within a loose typo budget. Returns the corrected
 * query in the vocabulary's own spelling, or null when nothing changes.
 */
export function suggestCorrection(query: Query, vocabulary: Iterable<string>): string | null {
    const vocab = new Map<string, string>(); // compact -> display form
    for (const text of vocabulary) {
        for (const token of stripDiacritics(text).split(/[^A-Za-z0-9]+/)) {
            if (token.length < 3) continue;
            const key = token.toLowerCase();
            if (!vocab.has(key)) vocab.set(key, token);
        }
    }
    let changed = false;
    const out = query.terms.map((term) => {
        if (vocab.has(term)) return vocab.get(term) as string;
        const budget = Math.max(2, Math.floor(term.length / 3));
        let best: { word: string; d: number } | null = null;
        for (const [key, display] of vocab) {
            if (Math.abs(key.length - term.length) > budget) continue;
            const d = osa(term, key);
            if (d <= budget && (!best || d < best.d || (d === best.d && display.length < best.word.length))) {
                best = { word: display, d };
            }
        }
        if (best) {
            changed = true;
            return best.word;
        }
        return term;
    });
    return changed ? out.join(" ") : null;
}

/**
 * Character ranges of `text` to highlight for this query: literal occurrences
 * of each term (case- and accent-insensitive), else the words that matched by
 * typo. Ranges are merged and sorted.
 */
export function matchRanges(text: string, raw: string): [number, number][] {
    // fold char by char so indexes stay aligned with the original text
    const folded = Array.from(text, (c) => stripDiacritics(c).toLowerCase()[0] ?? c).join("");
    const terms = raw
        .trim()
        .split(/\s+/)
        .map((t) => stripDiacritics(t).toLowerCase())
        .filter((t) => t.length >= 1);
    const ranges: [number, number][] = [];

    for (const term of terms) {
        let found = false;
        let from = 0;
        while (term && from <= folded.length) {
            const at = folded.indexOf(term, from);
            if (at === -1) break;
            ranges.push([at, at + term.length]);
            from = at + term.length;
            found = true;
        }
        if (found) continue;
        const compact = term.replace(/[^a-z0-9]/g, "");
        if (!compact) continue;
        const wordRe = /[A-Za-z0-9]+/g;
        let m: RegExpExecArray | null;
        while ((m = wordRe.exec(folded))) {
            const parts = splitCamel(text.slice(m.index, m.index + m[0].length)).map((w) => w.toLowerCase());
            const words = [m[0], ...parts];
            if (typoDistance(compact, words) !== Infinity) {
                ranges.push([m.index, m.index + m[0].length]);
            }
        }
    }

    ranges.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const r of ranges) {
        const last = merged[merged.length - 1];
        if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
        else merged.push([r[0], r[1]]);
    }
    return merged;
}
