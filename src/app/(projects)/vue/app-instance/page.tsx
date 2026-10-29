import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    AppInstanceDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/app-instance";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all eleven without exception: 11 sections, 11 cards.
const CREATE_APP_TEXT = [
    {
        title: "An app instance, not a global constructor",
        href: "#an-app-instance-not-a-global-constructor",
        text: (
            <>
                <Mono>createApp</Mono> returns an isolated app; nothing is global
                anymore.
            </>
        ),
    },
    {
        title: "Global API mapping",
        href: "#global-api-mapping",
        text: (
            <>
                <Mono>Vue.use/component/directive/mixin/prototype</Mono> move to the
                app; <Mono>Vue.extend</Mono> is gone.
            </>
        ),
    },
];

const REGISTERING_TEXT = [
    {
        title: "Plugins",
        href: "#plugins",
        text: (
            <>
                <Mono>install</Mono> receives the app; options are typed from{" "}
                <Mono>install</Mono>.
            </>
        ),
    },
    {
        title: "Global components and directives",
        href: "#global-components-and-directives",
        text: (
            <>
                Same registration on <Mono>app</Mono>; directive hooks renamed; type
                globals via <Mono>GlobalComponents</Mono>.
            </>
        ),
    },
    {
        title: "App-level provide",
        href: "#app-level-provide",
        text: (
            <>
                <Mono>app.provide</Mono> makes a value injectable everywhere.
            </>
        ),
    },
];

const MOUNTING_TEXT = [
    {
        title: "Mounting into a container",
        href: "#mounting-into-a-container",
        text: <>The container stays; the app renders inside it.</>,
    },
    {
        title: "What mount returns",
        href: "#what-mount-returns",
        text: (
            <>
                <Mono>mount</Mono> returns the root component, so it ends the chain.
            </>
        ),
    },
    {
        title: "Configure before mounting",
        href: "#configure-before-mounting",
        text: (
            <>
                Register everything before <Mono>mount</Mono>; mount once.
            </>
        ),
    },
];

const GLOBAL_PROPERTIES_TEXT = [
    {
        title: "app.config.globalProperties",
        // "app.config.globalProperties" slugs to this id: slug() turns each "."
        // into "-" and lowercases the rest.
        href: "#app-config-globalproperties",
        text: (
            <>
                Replaces <Mono>Vue.prototype</Mono>, scoped to the app.
            </>
        ),
    },
    {
        title: "Typing global properties",
        href: "#typing-global-properties",
        text: (
            <>
                Augment <Mono>ComponentCustomProperties</Mono> in a module file.
            </>
        ),
    },
    {
        title: "Global properties and setup",
        href: "#global-properties-and-setup",
        text: (
            <>
                No <Mono>this</Mono> in setup; use provide/inject instead.
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

const CREATE_APP: SummaryArticle[] = CREATE_APP_TEXT.map(withSeverities);
const REGISTERING: SummaryArticle[] = REGISTERING_TEXT.map(withSeverities);
const MOUNTING: SummaryArticle[] = MOUNTING_TEXT.map(withSeverities);
const GLOBAL_PROPERTIES: SummaryArticle[] =
    GLOBAL_PROPERTIES_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("app-instance");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "createApp vs new Vue", items: CREATE_APP },
                        { label: "Registering on the app", items: REGISTERING },
                        { label: "Mounting", items: MOUNTING },
                        { label: "Global properties", items: GLOBAL_PROPERTIES },
                    ]}
                />
            }
        >
            {/* Same arrangement as the typescript pages: no DemoFrame and no
                "use client", header inlined with DemoFrame's markup, heading and
                summary from the registry so the page, its sidebar row and its
                landing card can never drift. */}
            <article className="w-full">
                <header className="mb-6">
                    <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                        Vue · Getting Started
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <AppInstanceDocs />
            </article>
        </PageShell>
    );
}
