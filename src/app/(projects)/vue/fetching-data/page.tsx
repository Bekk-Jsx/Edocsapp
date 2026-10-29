import { notFound } from "next/navigation";
import PlanPage from "@/components/ui/plan-page";
import { topicBySlug } from "@/projects/vue/vue";

// Placeholder. Title, blurb and the planned parts all come from the registry
// entry for this slug, so this page, its sidebar row and its landing card match
// by construction; an unknown slug 404s rather than rendering a blank page.
export default function Page() {
    const topic = topicBySlug("fetching-data");
    if (!topic) notFound();

    return (
        <PlanPage
            eyebrow="vue · networking"
            name={topic.name}
            summary={topic.summary}
            parts={topic.parts}
        />
    );
}
