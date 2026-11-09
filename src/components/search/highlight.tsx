import { matchRanges } from "@/search/match";

// Wraps the parts of `text` that match `query` in a subtle <mark> (.search-mark
// in globals.css — tinted from --accent so it reads on the dark surfaces).
export default function Highlight({ text, query }: { text: string; query: string }) {
    const ranges = query ? matchRanges(text, query) : [];
    if (!ranges.length) return <>{text}</>;

    const out: React.ReactNode[] = [];
    let at = 0;
    ranges.forEach(([start, end], i) => {
        if (start > at) out.push(text.slice(at, start));
        out.push(
            <mark key={i} className="search-mark">
                {text.slice(start, end)}
            </mark>,
        );
        at = end;
    });
    if (at < text.length) out.push(text.slice(at));
    return <>{out}</>;
}
