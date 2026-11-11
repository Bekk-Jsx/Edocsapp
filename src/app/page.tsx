import type { Metadata } from "next";
import HomeShell from "@/components/home/home-shell";
import {
    getInterviewAreaSummary,
    getInterviewTree,
    type InterviewCategory,
} from "@/lib/interviews";

// The root layout's metadata still names the hooks project; home overrides it.
export const metadata: Metadata = {
    title: "Projects · learn",
    description: "Hands-on learning projects, grouped by type.",
};

// Home is a thin server shell: it resolves which section to show from the URL
// so the first paint is already correct (no flash of the wrong half), reads
// the interview tree from the database, and hands both to the client shell.
//
// The database read is DELIBERATELY wrapped: Interviews live in MongoDB,
// Projects live in files, and an unreachable database must cost the page only
// its Interviews half. `interviews: null` is what the shell renders the
// "unavailable" state from — the page itself never throws.
export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { section } = await searchParams;
    const initialSection = section === "interviews" ? "interviews" : "projects";

    let interviews: { summary: string; categories: InterviewCategory[] } | null =
        null;
    try {
        const [categories, summary] = await Promise.all([
            getInterviewTree(),
            getInterviewAreaSummary(),
        ]);
        interviews = { summary, categories };
    } catch (error) {
        // Logged server-side with the reason; the page shows only that the
        // database is not reachable, never the connection string.
        console.error("[home] interview tree unavailable", error);
    }

    return <HomeShell initialSection={initialSection} interviews={interviews} />;
}
