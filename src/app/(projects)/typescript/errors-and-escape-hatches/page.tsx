import { notFound } from "next/navigation";
import PlanPage from "@/components/ui/plan-page";
import { topicBySlug } from "@/projects/typescript/typescript";

// Placeholder. Title, blurb and the planned parts all come from the registry
// entry for this slug, so this page, its sidebar row and its landing card match
// by construction; an unknown slug 404s rather than rendering a blank page.
//
// Server Component, and no demo: TypeScript is a compile-time tool with no
// compiler in the browser, so there is nothing here that could run there and no
// client boundary to draw.
export default function Page() {
    const topic = topicBySlug("errors-and-escape-hatches");
    if (!topic) notFound();

    return (
        <PlanPage
            eyebrow="typescript · practice"
            name={topic.name}
            summary={topic.summary}
            parts={topic.parts}
        />
    );
}
