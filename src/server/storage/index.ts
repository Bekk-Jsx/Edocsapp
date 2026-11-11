import type { Readable } from "node:stream";

// ===================================================================
// STORAGE — the seam between "an asset exists" and "where its bytes live".
//
// Pictures never go in the database (see AGENTS.md > Database): the `assets`
// collection stores metadata and an opaque `key`, and this adapter is the only
// thing that knows how to turn that key into bytes. Swapping LocalStorage for
// S3/R2 later means one new implementation of this interface and no change to
// the collection, the scripts or the route handler.
//
// No `server-only` here on purpose: the db:asset script imports it too, and it
// is Node-only by construction anyway (fs, streams).
// ===================================================================

export interface StoredFile {
    stream: Readable;
    mime: string;
    bytes: number;
}

export interface StorageAdapter {
    /**
     * Stores the bytes at `filePath` under a name derived from `fileName`, and
     * returns the opaque key to persist on the asset document.
     */
    put(filePath: string, fileName: string): Promise<string>;
    /** Opens a stored object. Rejects for a key that is not present. */
    read(key: string): Promise<StoredFile>;
}

export { LocalStorage, localStorage } from "./local";
