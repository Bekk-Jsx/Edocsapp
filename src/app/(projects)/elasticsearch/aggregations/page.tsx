import { notFound } from "next/navigation";
import PlanPage from "@/components/ui/plan-page";
import { topicBySlug } from "@/projects/elasticsearch/elasticsearch";

// Placeholder. Title, blurb and the planned parts all come from the registry
// entry for this slug, so this page, its sidebar row and its landing card match
// by construction; an unknown slug 404s rather than rendering a blank page.
//
// Server Component, and no demo: Elasticsearch runs on a server, so there is
// nothing here that could run in the browser and no client boundary to draw.
export default function Page() {
    const topic = topicBySlug("aggregations");
    if (!topic) notFound();

    return (
        <PlanPage
            eyebrow="elasticsearch · searching"
            name={topic.name}
            summary={topic.summary}
            parts={topic.parts}
        />
    );
}
