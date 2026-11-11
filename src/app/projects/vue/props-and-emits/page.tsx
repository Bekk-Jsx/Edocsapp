import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    PropsAndEmitsDocs,
    SECTION_SEVERITIES,
} from "@/projects/vue/content/props-and-emits";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all seven without exception: 7 sections, 7 cards.
const PROPS_TEXT = [
    {
        title: "Typed props with PropType",
        href: "#typed-props-with-proptype",
        text: (
            <>
                Runtime constructor + <Mono>{"PropType<T>"}</Mono> cast; checked in
                the component and in parent templates.
            </>
        ),
    },
    {
        title: "required, default and validator",
        href: "#required-default-and-validator",
        text: (
            <>
                <Mono>required</Mono>/<Mono>default</Mono> remove{" "}
                <Mono>undefined</Mono>; <Mono>validator</Mono> adds the runtime
                check.
            </>
        ),
    },
];

const EVENTS_TEXT = [
    {
        title: "How component events work",
        href: "#how-component-events-work",
        text: (
            <>
                Child <Mono>$emit</Mono>s, parent listens with <Mono>@</Mono>; events
                do not bubble.
            </>
        ),
    },
    {
        title: "Declaring events with emits",
        href: "#declaring-events-with-emits",
        text: (
            <>Object form types names and payloads; validators warn at runtime.</>
        ),
    },
    {
        title: "Undeclared listeners fall through",
        href: "#undeclared-listeners-fall-through",
        text: (
            <>
                Undeclared listeners become native listeners on the root; declare
                every event.
            </>
        ),
    },
];

const OTHER_CHANNELS_TEXT = [
    {
        title: "Function props",
        href: "#function-props",
        text: (
            <>
                Possible, typed with <Mono>PropType</Mono>; use only when a return
                value is needed.
            </>
        ),
    },
    {
        title: "Calling a child's methods",
        // The apostrophe slugs to "-", like every other non-alphanumeric run.
        href: "#calling-a-child-s-methods",
        text: (
            <>
                <Mono>$refs</Mono> + <Mono>{"InstanceType<typeof Child>"}</Mono>;
                only after mount, use sparingly.
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

const PROPS: SummaryArticle[] = PROPS_TEXT.map(withSeverities);
const EVENTS: SummaryArticle[] = EVENTS_TEXT.map(withSeverities);
const OTHER_CHANNELS: SummaryArticle[] = OTHER_CHANNELS_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("props-and-emits");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Typed props", items: PROPS },
                        { label: "Component events", items: EVENTS },
                        {
                            label: "Function props and child methods",
                            items: OTHER_CHANNELS,
                        },
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
                        Vue · Components
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                        {topic.name}
                    </h1>
                    <div className="mt-3 text-[var(--muted)] leading-relaxed">
                        {topic.summary}
                    </div>
                </header>

                <PropsAndEmitsDocs />
            </article>
        </PageShell>
    );
}
