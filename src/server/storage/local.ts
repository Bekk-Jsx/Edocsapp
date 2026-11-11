import { createReadStream } from "node:fs";
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StorageAdapter, StoredFile } from "./index";

// ===================================================================
// LOCAL STORAGE — assets on disk, under /storage/assets, committed to git.
//
// The key is "<uuid><ext>", never anything derived from user input, and
// resolving a key is checked against the asset directory before any read: a
// key that escapes it (traversal, absolute path) is refused rather than
// served. The route handler only ever passes keys it read from the database,
// so this is defence in depth, not the primary gate.
// ===================================================================

const ROOT = path.join(process.cwd(), "storage", "assets");

// Enough to serve what a doc page needs; anything else is rejected at upload
// time rather than guessed at read time.
const MIME_BY_EXT: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".svg": "image/svg+xml",
};

/** The media type for a file name, or undefined when unsupported. */
export function mimeForFile(fileName: string): string | undefined {
    return MIME_BY_EXT[path.extname(fileName).toLowerCase()];
}

export class LocalStorage implements StorageAdapter {
    constructor(private readonly root: string = ROOT) {}

    /** Absolute path for a key, refusing anything outside the asset root. */
    private resolve(key: string): string {
        const full = path.resolve(this.root, key);
        const prefix = path.resolve(this.root) + path.sep;
        if (!full.startsWith(prefix)) {
            throw new Error(`Refusing to resolve key outside storage: ${key}`);
        }
        return full;
    }

    async put(filePath: string, fileName: string): Promise<string> {
        const ext = path.extname(fileName).toLowerCase();
        if (!MIME_BY_EXT[ext]) {
            throw new Error(
                `Unsupported asset type "${ext || fileName}". Supported: ${Object.keys(MIME_BY_EXT).join(", ")}`,
            );
        }
        const key = `${randomUUID()}${ext}`;
        await mkdir(this.root, { recursive: true });
        await copyFile(filePath, this.resolve(key));
        return key;
    }

    async read(key: string): Promise<StoredFile> {
        const full = this.resolve(key);
        const info = await stat(full); // throws ENOENT for an unknown key
        const mime = mimeForFile(key);
        if (!mime) throw new Error(`Unsupported asset type for key: ${key}`);
        return {
            stream: createReadStream(full),
            mime,
            bytes: info.size,
        };
    }
}

/** The adapter the app and the scripts both use today. */
export const localStorage: StorageAdapter = new LocalStorage();
