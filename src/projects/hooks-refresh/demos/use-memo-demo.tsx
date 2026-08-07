"use client";

import { memo, useMemo, useState } from "react";

type Item = { id: number; name: string; price: number };
type Config = { taxRate: number };

// ~1000 rows — enough that the reduce is real work, small enough to stay snappy.
// Passed to useState as an INITIALIZER (not called), so the array is built once
// and keeps the same reference until an action replaces it.
function buildItems(): Item[] {
    return Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `sku-${i.toString().padStart(4, "0")}`,
        price: 2 + ((i * 37) % 900) / 10,
    }));
}

const money = (n: number) => `$${n.toFixed(2)}`;

// React.memo: re-renders only when a prop changes BY REFERENCE. `items` comes
// from useState and `config` from useMemo, so an unrelated `count` update in the
// parent leaves both identical and this child is skipped entirely.
const ExpensiveList = memo(function ExpensiveList({
    items,
    config,
}: {
    items: Item[];
    config: Config;
}) {
    console.log("list rendered");

    return (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="mb-2 font-mono text-[0.7rem] uppercase tracking-widest text-[var(--muted)]">
                memoized child · tax {Math.round(config.taxRate * 100)}%
            </p>
            <ul className="space-y-1 font-mono text-xs text-[var(--muted)]">
                {items.slice(0, 5).map((it) => (
                    <li key={it.id} className="flex justify-between gap-4">
                        <span>{it.name}</span>
                        <span className="text-[var(--text)]">
                            {money(it.price * (1 + config.taxRate))}
                        </span>
                    </li>
                ))}
            </ul>
            <p className="mt-2 font-mono text-[0.7rem] text-[var(--muted)]">
                + {items.length - 5} more rows
            </p>
        </div>
    );
});

export default function UseMemoDemo() {
    const [items, setItems] = useState(buildItems);
    const [taxRate, setTaxRate] = useState(0.2);
    const [count, setCount] = useState(0); // unrelated state — the whole point

    // Cached until the items REFERENCE changes. Bumping `count` re-renders this
    // component without running the reduce again.
    const total = useMemo(() => {
        console.log("recomputing total");
        return items.reduce((sum, it) => sum + it.price, 0);
    }, [items]);

    // Stable object identity — a fresh `{ taxRate }` literal would be a new
    // reference every render and would defeat the memo on ExpensiveList.
    const config = useMemo(() => ({ taxRate }), [taxRate]);

    // On-screen mirrors of the console markers, starting at the mount pass.
    // Bumped by the actions that INVALIDATE each memo — replacing `items`
    // recomputes the total, and either dep re-renders the child. Counting from
    // the handlers keeps render pure (no ref writes, no setState in an effect);
    // the console markers are the ground truth.
    const [computes, setComputes] = useState(1);
    const [listRenders, setListRenders] = useState(1);

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            { id: prev.length, name: `sku-${prev.length}`, price: 49.9 },
        ]);
        setComputes((c) => c + 1);
        setListRenders((r) => r + 1);
    };

    const toggleTaxRate = () => {
        setTaxRate((r) => (r === 0.2 ? 0.05 : 0.2));
        setListRenders((r) => r + 1);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setCount((c) => c + 1)}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    click {count}
                </button>
                <button
                    onClick={toggleTaxRate}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    toggle tax rate
                </button>
                <button
                    onClick={addItem}
                    className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-[var(--surface-2)]"
                >
                    add item
                </button>
            </div>

            <p className="font-mono text-xs text-[var(--muted)]">
                total over {items.length} items:{" "}
                <span className="text-[var(--text)]">{money(total)}</span> · computed{" "}
                <span className="text-[var(--accent)]">{computes}</span>× · list
                rendered <span className="text-[var(--accent)]">{listRenders}</span>×
            </p>

            <ExpensiveList items={items} config={config} />

            <p className="text-xs leading-relaxed text-[var(--muted)]">
                Open the console. <span className="text-[var(--mint)]">click</span>{" "}
                re-renders this component only — no{" "}
                <span className="font-mono">recomputing total</span>, no{" "}
                <span className="font-mono">list rendered</span>, both counters
                frozen. <span className="text-[var(--amber)]">toggle tax rate</span>{" "}
                makes a new <span className="font-mono">config</span>, so the child
                renders but the total stays cached.{" "}
                <span className="text-[var(--amber)]">add item</span> replaces the
                array reference and invalidates both. (Strict Mode logs each render
                twice in development.)
            </p>
        </div>
    );
}
