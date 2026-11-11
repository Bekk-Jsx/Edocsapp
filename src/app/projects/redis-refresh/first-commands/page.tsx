import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    FirstCommandsDocs,
    SECTION_SEVERITIES,
} from "@/projects/redis-refresh/content/first-commands";
import { topicBySlug } from "@/projects/redis-refresh/redis";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. This page has no pinned
// footer sections, so the rule holds for all ten without exception.
const SESSION_TEXT = [
    {
        title: "redis-cli",
        href: "#redis-cli",
        text: (
            <>
                The prompt reports host, port and — in brackets — a non-default
                database; a prompt without brackets is database 0.
            </>
        ),
    },
    {
        title: "PING",
        href: "#ping",
        text: (
            <>
                <Mono>PONG</Mono> confirms the server received a command and replied;
                with an argument it returns that argument, so the round trip is proven
                intact.
            </>
        ),
    },
    {
        title: "One-shot mode",
        href: "#one-shot-mode",
        text: (
            <>
                A command after <Mono>redis-cli</Mono> connects, sends, prints and exits
                — the form scripts, health checks and cron jobs require.
            </>
        ),
    },
    {
        title: "Reply annotations",
        href: "#reply-annotations",
        text: (
            <>
                Annotations are added by the client and never stored.{" "}
                <Mono>(nil)</Mono> has one meaning: the key is absent.
            </>
        ),
    },
    {
        title: "Raw mode",
        href: "#raw-mode",
        text: (
            <>
                A terminal receives annotated output, a pipe receives raw values — so{" "}
                <Mono>--raw</Mono> must be explicit in scripts.
            </>
        ),
    },
    {
        title: "Case sensitivity",
        href: "#case-sensitivity",
        text: (
            <>
                Commands are case-insensitive, keys are not: <Mono>name</Mono> and{" "}
                <Mono>Name</Mono> are distinct keys and neither warns.
            </>
        ),
    },
    {
        title: "Command signatures",
        href: "#command-signatures",
        text: (
            <>
                Square brackets mark optional arguments, a pipe marks exclusive choices;{" "}
                <Mono>HELP</Mono> reports the command group, which names the data type.
            </>
        ),
    },
];

const DATABASES_TEXT = [
    {
        title: "SELECT",
        href: "#select",
        text: (
            <>
                16 keyspaces numbered 0 to 15 exist from startup;{" "}
                <Mono>SELECT</Mono> only points the current connection at one.
            </>
        ),
    },
    {
        title: "Locating the current database",
        href: "#locating-the-current-database",
        text: (
            <>
                <Mono>INFO keyspace</Mono> lists non-empty databases;{" "}
                <Mono>CLIENT INFO</Mono> reports this connection and is what scripts
                should read.
            </>
        ),
    },
    {
        title: "Databases are not isolation",
        href: "#databases-are-not-isolation",
        text: (
            <>
                All 16 share one process, thread, memory limit and configuration —
                separation belongs in key prefixes or separate instances.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (item: (typeof SESSION_TEXT)[number]): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const SESSION: SummaryArticle[] = SESSION_TEXT.map(withSeverities);
const DATABASES: SummaryArticle[] = DATABASES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("first-commands");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Session", items: SESSION },
                        { label: "Databases", items: DATABASES },
                    ]}
                />
            }
        >
            {/* No DemoFrame: Redis runs on a server, so this page has no live demo to
                frame and no client boundary. The header DemoFrame would otherwise
                supply is inlined with the same markup, so the page keeps the rhythm
                of the hooks pages — every fragment is introduced and explained by
                its own DocSection instead of a whole-module source panel.
                Heading and subtitle come from the registry, so this page, its
                sidebar row and its landing card can never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        redis · cli
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <FirstCommandsDocs />
            </article>
        </PageShell>
    );
}
