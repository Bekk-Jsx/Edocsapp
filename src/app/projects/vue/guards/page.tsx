import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import { GuardsDocs, SECTION_SEVERITIES } from "@/projects/vue/content/guards";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for both without exception: 3 sections, 3 cards.
const PROTECTED_ROUTES_TEXT = [
    {
        title: "Signed-in only",
        href: "#signed-in-only",
        text: (
            <>
                <Mono>meta.requiresAuth</Mono> + one <Mono>beforeEach</Mono>; redirect
                back via a query param; return instead of <Mono>next()</Mono>.
            </>
        ),
    },
];

const ROLE_BASED_TEXT = [
    {
        title: "Admin only",
        href: "#admin-only",
        text: (
            <>
                Roles as <Mono>meta</Mono> data in the same guard; typed via{" "}
                <Mono>RouteMeta</Mono>; <Mono>beforeEnter</Mono> for one-offs.
            </>
        ),
    },
];

const LEAVE_GUARDS_TEXT = [
    {
        title: "Unsaved changes",
        href: "#unsaved-changes",
        text: (
            <>
                <Mono>onBeforeRouteLeave</Mono> can return <Mono>false</Mono>;{" "}
                <Mono>afterEach</Mono> for titles and analytics.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: {
    title: string;
    href: string;
    text: React.ReactNode;
}): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const PROTECTED_ROUTES: SummaryArticle[] =
    PROTECTED_ROUTES_TEXT.map(withSeverities);
const ROLE_BASED: SummaryArticle[] = ROLE_BASED_TEXT.map(withSeverities);
const LEAVE_GUARDS: SummaryArticle[] = LEAVE_GUARDS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("guards");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Protected routes", items: PROTECTED_ROUTES },
                        { label: "Role-based routes", items: ROLE_BASED },
                        { label: "Leave guards", items: LEAVE_GUARDS },
                    ]}
                />
            }
        >
            {/* Same arrangement as the app-instance page: no DemoFrame and no
                "use client", header inlined, heading and summary from the
                registry so the page, its sidebar row and its landing card can
                never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · Router
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <GuardsDocs />
            </article>
        </PageShell>
    );
}
