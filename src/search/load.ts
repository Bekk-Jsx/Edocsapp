// Lazy, cached access to a project's search index. Each project's JSON is its
// own dynamic-import chunk (see the generated ./data/index.ts), fetched the
// first time a search box needs it and shared by every later caller.

import { LOADERS } from "./data";
import type { SearchIndex } from "./types";

const cache = new Map<string, Promise<SearchIndex>>();

/** Whether `npm run search:sync` produced an index for this project. */
export const hasIndex = (project: string) =>
    Object.prototype.hasOwnProperty.call(LOADERS, project);

export function loadIndex(project: string): Promise<SearchIndex> {
    let pending = cache.get(project);
    if (!pending) {
        const loader = LOADERS[project];
        pending = loader
            ? loader().then((m) => m.default as SearchIndex)
            : Promise.reject(new Error(`No search index for "${project}"`));
        // a failed load is retried on the next call rather than cached forever
        pending.catch(() => cache.delete(project));
        cache.set(project, pending);
    }
    return pending;
}
