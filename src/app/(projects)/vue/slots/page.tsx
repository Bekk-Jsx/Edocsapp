import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import { SlotsDocs, SECTION_SEVERITIES } from "@/projects/vue/content/slots";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all five without exception: 5 sections, 5 cards.
const SLOTS_TEXT = [
    {
        title: "Default and named slots",
        href: "#default-and-named-slots",
        text: (
            <>
                <Mono>{"<slot>"}</Mono> and <Mono>{"<template #name>"}</Mono>;
                fallback content; compiled in the parent&apos;s scope.
            </>
        ),
    },
];

const SCOPED_TEXT = [
    {
        title: "Sending data to the parent",
        href: "#sending-data-to-the-parent",
        text: <>Child passes slot props; parent decides the markup.</>,
    },
    {
        title: "Props on the default slot",
        href: "#props-on-the-default-slot",
        text: (
            <>
                <Mono>v-slot</Mono> on the component alone, or{" "}
                <Mono>{"<template #default>"}</Mono> with named slots.
            </>
        ),
    },
];

const TYPING_TEXT = [
    {
        title: "Declaring slots with SlotsType",
        href: "#declaring-slots-with-slotstype",
        text: (
            <>
                Declared in the child; types <Mono>$slots</Mono> and the
                parent&apos;s slot props.
            </>
        ),
    },
    {
        title: "What SlotsType checks",
        href: "#what-slotstype-checks",
        text: (
            <>Checks the parent&apos;s usage only; a wrong declaration fails at runtime.</>
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

const SLOTS: SummaryArticle[] = SLOTS_TEXT.map(withSeverities);
const SCOPED: SummaryArticle[] = SCOPED_TEXT.map(withSeverities);
const TYPING: SummaryArticle[] = TYPING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("slots");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "Default and named slots", items: SLOTS },
                        { label: "Scoped slots", items: SCOPED },
                        { label: "Typing slots", items: TYPING },
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

                <SlotsDocs />
            </article>
        </PageShell>
    );
}
