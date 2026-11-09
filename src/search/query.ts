// Turns an index + a query into ranked hits, dropdown suggestions and grouped
// results. Pure functions; the components only render what comes back.

import { fieldScore, suggestCorrection, type Query } from "./match";
import type { SearchHit, SearchIndex, SearchPage } from "./types";

export const LIMITS = {
    suggestions: 6,
    projectGroups: 6,
    hitsPerGroup: 3,
    pageHits: 8,
    notes: 3,
};

/**
 * Every page, part and title that matches, best first. With `pageSlug` the
 * search is scoped to that page and page names are not candidates.
 * Ties: shorter text first, then document order.
 */
export function searchHits(index: SearchIndex, query: Query, pageSlug?: string): SearchHit[] {
    const hits: SearchHit[] = [];
    let order = 0;
    const pages = pageSlug ? index.pages.filter((p) => p.slug === pageSlug) : index.pages;

    for (const page of pages) {
        if (!pageSlug) {
            const score = fieldScore(query, page.name, "page");
            if (score) {
                hits.push({ kind: "page", field: "page", score, text: page.name, href: page.href, page, order });
            }
        }
        order++;
        for (const part of page.parts) {
            if (part.name) {
                const score = fieldScore(query, part.name, "part");
                if (score) {
                    hits.push({ kind: "part", field: "part", score, text: part.name, href: part.href, page, part, order });
                }
            }
            order++;
            for (const title of part.titles) {
                let score = fieldScore(query, title.title, "title");
                let keyword: string | undefined;
                for (const k of title.keywords) {
                    const s = fieldScore(query, k, "keyword");
                    if (s > score) {
                        score = s;
                        keyword = k;
                    }
                }
                if (score) {
                    hits.push({
                        kind: "title",
                        field: keyword ? "keyword" : "title",
                        score,
                        text: title.title,
                        href: title.href,
                        page,
                        part,
                        title,
                        keyword,
                        order,
                    });
                }
                order++;
            }
        }
    }

    return hits.sort(
        (a, b) => b.score - a.score || a.text.length - b.text.length || a.order - b.order,
    );
}

export type PageGroup = {
    page: SearchPage;
    /** The page name itself matched. */
    pageHit?: SearchHit;
    hits: SearchHit[];
    score: number;
};

/** Project results: hits grouped under their page, best group first. */
export function groupByPage(hits: SearchHit[]): PageGroup[] {
    const groups = new Map<string, PageGroup>();
    for (const hit of hits) {
        let g = groups.get(hit.page.slug);
        if (!g) {
            g = { page: hit.page, hits: [], score: hit.score };
            groups.set(hit.page.slug, g);
        }
        g.score = Math.max(g.score, hit.score);
        if (hit.kind === "page") g.pageHit = hit;
        else if (g.hits.length < LIMITS.hitsPerGroup) g.hits.push(hit);
    }
    return [...groups.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, LIMITS.projectGroups);
}

/** Every searchable string in scope — the "did you mean" vocabulary. */
export function vocabulary(index: SearchIndex, pageSlug?: string): string[] {
    const out: string[] = [];
    for (const page of index.pages) {
        if (pageSlug && page.slug !== pageSlug) continue;
        if (!pageSlug) out.push(page.name);
        for (const part of page.parts) {
            out.push(part.name);
            for (const t of part.titles) out.push(t.title, ...t.keywords);
        }
    }
    return out;
}

export const didYouMean = (index: SearchIndex, query: Query, pageSlug?: string) =>
    suggestCorrection(query, vocabulary(index, pageSlug));
