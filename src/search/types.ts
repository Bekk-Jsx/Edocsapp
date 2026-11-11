// Shape of src/search/data/<project>.json — written by scripts/search-sync.mjs.
// Change both together.

export type SearchTitle = {
    title: string;
    href: string; // "/projects/vue/writing-composables#the-conventions"
    keywords: string[];
};

export type SearchPart = {
    /** "" for sections that sit before the page's first PartHeading. */
    name: string;
    href: string; // anchor of the part's first section, or the page href
    titles: SearchTitle[];
};

export type SearchPage = {
    slug: string;
    name: string;
    chapter: string;
    href: string;
    planned: boolean;
    parts: SearchPart[];
};

export type SearchIndex = {
    generated: string;
    project: { slug: string; name: string; href: string };
    pages: SearchPage[];
};

/** Which field produced an item's score. Drives the weight and the UI. */
export type SearchField = "page" | "part" | "title" | "keyword" | "note";

/** One scored page, part or section title. */
export type SearchHit = {
    kind: "page" | "part" | "title";
    field: SearchField;
    score: number;
    /** The text shown (page name, part name or section title). */
    text: string;
    href: string;
    page: SearchPage;
    part?: SearchPart;
    title?: SearchTitle;
    /** The keyword that matched, when field === "keyword". */
    keyword?: string;
    order: number;
};
