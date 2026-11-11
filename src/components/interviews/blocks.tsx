import CodeBlock from "@/components/ui/code-block";
import { Callout } from "@/components/ui/doc-section";
import type { AssetInfo } from "@/server/interviews";
import type { Block, ListItem, LocalizedText } from "@/server/schema";
import { Text, plain, type Lang } from "./inline";

// ===================================================================
// BLOCKS — the renderer for an entry's body. Server components throughout:
// Shiki highlights on the server (CodeBlock), and nothing here ships to the
// browser.
//
// The visual language is the doc pages': the same prose rhythm, the same
// Callout, the same CodeBlock, the same bordered table, the same
// container-query pair grid for comparisons.
//
// An unknown or invalid block renders NOTHING and warns on the server — a bad
// block never takes a page down. (Invalid ones are already dropped by
// safeBlocks on read; this is the second line.)
// ===================================================================

type Ctx = { lang: Lang; assets: Map<string, AssetInfo> };

// Same column grid the app-instance and typescript pages use, so comparisons
// break to one column at the same width everywhere.
const PAIR_FRAME = "@container";
const PAIR_GRID = "grid gap-3 @3xl:grid-cols-2";
const PAIR_COL = "min-w-0 space-y-2";

const PROSE = "text-[0.95rem] leading-[1.7] text-[var(--muted)]";

/** A table cell / header, which is localized text like everything else. */
function Cell({ text, lang }: { text: LocalizedText; lang: Lang }) {
    return <Text text={text} lang={lang} />;
}

/** Nested list rows. Children recurse, so depth is whatever the data has. */
function Items({ items, lang }: { items: ListItem[]; lang: Lang }) {
    return (
        <>
            {items.map((item, i) => (
                <li key={i} className="leading-[1.7]">
                    <Text text={item.text} lang={lang} />
                    {item.children?.length ? (
                        <ul className="mt-1 ml-5 list-disc space-y-1 marker:text-[var(--border)]">
                            <Items items={item.children} lang={lang} />
                        </ul>
                    ) : null}
                </li>
            ))}
        </>
    );
}

function Caption({ text, lang }: { text: LocalizedText; lang: Lang }) {
    return (
        <p className="mt-2 font-mono text-[0.7rem] text-[var(--muted)]">
            <Text text={text} lang={lang} />
        </p>
    );
}

/** One block. Returns null for anything it does not know. */
function One({ block, ctx }: { block: Block; ctx: Ctx }) {
    const { lang } = ctx;

    switch (block.type) {
        case "paragraph":
            return (
                <p className={PROSE}>
                    <Text text={block.text} lang={lang} />
                </p>
            );

        case "heading": {
            // Doc-page scale: h3 is a sub-heading inside a section, h4 below it.
            const className =
                block.level === 3
                    ? "mt-2 text-[1rem] font-semibold text-[var(--text)]"
                    : "mt-1 text-[0.9rem] font-semibold text-[var(--text)]";
            return block.level === 3 ? (
                <h3 className={className}>
                    <Text text={block.text} lang={lang} />
                </h3>
            ) : (
                <h4 className={className}>
                    <Text text={block.text} lang={lang} />
                </h4>
            );
        }

        case "list": {
            const className = `ml-5 space-y-1.5 ${PROSE} ${
                block.ordered ? "list-decimal" : "list-disc"
            } marker:text-[var(--border)]`;
            return block.ordered ? (
                <ol className={className}>
                    <Items items={block.items} lang={lang} />
                </ol>
            ) : (
                <ul className={className}>
                    <Items items={block.items} lang={lang} />
                </ul>
            );
        }

        case "table": {
            // The grid table the doc pages use. The column count is data, so
            // the template comes from an inline style rather than a utility
            // Tailwind would have to see at build time.
            const cell = "px-3 py-2";
            const ruled = `${cell} border-b border-[var(--border)]`;
            return (
                <div>
                    <div
                        className="grid overflow-hidden rounded border border-[var(--border)] bg-[var(--surface-2)] font-mono text-[0.75rem]"
                        style={{
                            gridTemplateColumns: `max-content repeat(${Math.max(block.columns.length - 1, 0)}, 1fr)`,
                        }}
                    >
                        {block.columns.map((column, c) => (
                            <div key={`h-${c}`} className={`${ruled} text-[var(--text)]`}>
                                <Cell text={column} lang={lang} />
                            </div>
                        ))}
                        {block.rows.map((row, r) =>
                            row.map((value, c) => (
                                <div
                                    key={`${r}-${c}`}
                                    className={`${r === block.rows.length - 1 ? cell : ruled} ${
                                        c === 0
                                            ? "text-[var(--accent)]"
                                            : "text-[var(--muted)]"
                                    }`}
                                >
                                    <Cell text={value} lang={lang} />
                                </div>
                            )),
                        )}
                    </div>
                    {block.caption ? (
                        <Caption text={block.caption} lang={lang} />
                    ) : null}
                </div>
            );
        }

        case "code":
            // `code` is source, never translated — the same string in both
            // language subtrees.
            return (
                <div>
                    <CodeBlock code={block.code} lang={block.lang} />
                    {block.caption ? (
                        <Caption text={block.caption} lang={lang} />
                    ) : null}
                </div>
            );

        case "callout":
            return (
                <Callout
                    severity={block.severity}
                    label={plain(block.label, lang)}
                >
                    <p>
                        <Text text={block.text} lang={lang} />
                    </p>
                </Callout>
            );

        case "image": {
            const asset = ctx.assets.get(block.assetId);
            if (!asset) {
                console.warn(`[blocks] image asset not found: ${block.assetId}`);
                return null;
            }
            return (
                <figure>
                    {/* Our own API serves these, and the dimensions come from
                        the asset record, so width/height reserve the space and
                        nothing shifts on load. next/image is not used: the
                        route is already immutable-cached and needs no resizing
                        pipeline. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`/api/assets/${block.assetId}`}
                        alt={plain(asset.alt, lang)}
                        width={asset.width}
                        height={asset.height}
                        loading="lazy"
                        decoding="async"
                        className="h-auto max-w-full rounded-lg border border-[var(--border)]"
                    />
                    {block.caption ? (
                        <figcaption>
                            <Caption text={block.caption} lang={lang} />
                        </figcaption>
                    ) : null}
                </figure>
            );
        }

        case "compare":
            return (
                <div className={PAIR_FRAME}>
                    <div className={PAIR_GRID}>
                        {([block.left, block.right] as const).map((pane, i) => (
                            <div key={i} className={PAIR_COL}>
                                <p className="font-mono text-[0.7rem] uppercase tracking-widest text-[var(--accent)]">
                                    <Text text={pane.label} lang={lang} />
                                </p>
                                <Blocks blocks={pane.blocks} ctx={ctx} />
                            </div>
                        ))}
                    </div>
                </div>
            );

        default: {
            // Unreachable while Block is exhaustive; kept so a block type added
            // to the schema without a renderer degrades to nothing, loudly.
            const unknown: never = block;
            console.warn(
                `[blocks] no renderer for block: ${JSON.stringify(unknown).slice(0, 80)}`,
            );
            return null;
        }
    }
}

/** An entry's body, in order. */
export default function Blocks({
    blocks,
    ctx,
}: {
    blocks: Block[];
    ctx: Ctx;
}) {
    if (!blocks.length) return null;
    return (
        <div className="space-y-4">
            {blocks.map((block, i) => (
                <One key={i} block={block} ctx={ctx} />
            ))}
        </div>
    );
}
