import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { getDb } from "@/server/db";
import { COLLECTIONS, type AssetDoc } from "@/server/schema";
import { localStorage } from "@/server/storage";

// ===================================================================
// GET /api/assets/<id> — streams one registered asset.
//
// The URL carries an asset ID, never a path: the only way to a file is a
// document in `assets`, whose `key` the storage adapter resolves. So no
// request can name a file that was never registered, and traversal has
// nothing to act on (the adapter re-checks the key regardless).
//
// Content-Type comes from the stored metadata. Assets are immutable — a new
// upload is a new id — so they are cached hard and forever.
// ===================================================================

const IMMUTABLE = "public, max-age=31536000, immutable";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;

    // Anything that is not a well-formed id is a 404, not a 500.
    if (!ObjectId.isValid(id)) {
        return new Response("Not found", { status: 404 });
    }

    let asset: AssetDoc | null = null;
    try {
        const db = await getDb();
        asset = await db
            .collection<AssetDoc>(COLLECTIONS.assets)
            .findOne({ _id: new ObjectId(id) });
    } catch (error) {
        console.error("[assets] database unreachable", error);
        return new Response("Asset store unavailable", { status: 503 });
    }

    if (!asset) return new Response("Not found", { status: 404 });

    try {
        const file = await localStorage.read(asset.key);
        // Node stream -> web stream; `as` because the DOM lib types
        // ReadableStream without the Node generic.
        const body = Readable.toWeb(file.stream) as ReadableStream<Uint8Array>;
        return new Response(body, {
            status: 200,
            headers: {
                "Content-Type": asset.mime || file.mime,
                "Content-Length": String(file.bytes),
                "Cache-Control": IMMUTABLE,
            },
        });
    } catch (error) {
        // Registered but missing on disk: a real inconsistency, so it is
        // logged — but it is still a 404 to the caller.
        console.error(`[assets] key not readable: ${asset.key}`, error);
        return new Response("Not found", { status: 404 });
    }
}
