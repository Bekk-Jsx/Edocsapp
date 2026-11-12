import { renderToStaticMarkup } from "react-dom/server";
import SummaryArticles, { type SummaryGroup } from "./src/components/ui/summary-articles";

// Rebuild EXACTLY the shape the interview page passes: objects holding React
// elements, created inside nested .map() callbacks.
type Entry = { slug: string; status: "planned" | "active" };
const entries: Entry[] = [
    { slug: "a", status: "planned" },
    { slug: "b", status: "planned" },
    { slug: "c", status: "active" },
];

function railCard(entry: Entry) {
    return {
        title: entry.slug,
        href: `#${entry.slug}`,
        text:
            entry.status === "planned" ? (
                <span className="muted">coming soon</span>
            ) : (
                <span className="state">known</span>
            ),
    };
}

const groups: SummaryGroup[] = [{ label: "High priority", items: entries.map((e) => railCard(e)) }];

const warnings: string[] = [];
const realError = console.error;
console.error = (...args: unknown[]) => { warnings.push(args.map(String).join(" ")); };
renderToStaticMarkup(<SummaryArticles groups={groups} />);
console.error = realError;

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("warnings captured:", warnings.length);
for (const w of warnings) console.log("  -> " + w.split("\n")[0]);
