import { notFound } from "next/navigation";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import { VModelDocs, SECTION_SEVERITIES } from "@/projects/vue/content/v-model";
import { topicBySlug } from "@/projects/vue/vue";

// Glanceable chapter takeaways — reading only these gives the whole page.
// Each href targets a DocSection id (slugged from its title in the content file).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id. No pinned footer sections,
// so the rule holds for all four without exception: 4 sections, 4 cards.
const CONTRACT_TEXT = [
    {
        title: "The modelValue contract",
        href: "#the-modelvalue-contract",
        text: (
            <>
                Parent passes its variable; child reads <Mono>modelValue</Mono> and
                emits <Mono>update:modelValue</Mono>.
            </>
        ),
    },
    {
        title: "Why the contract matters",
        href: "#why-the-contract-matters",
        text: (
            <>
                One API for native inputs, own components and libraries; no setters
                per field.
            </>
        ),
    },
];

const ARGUMENTS_TEXT = [
    {
        title: "v-model arguments",
        href: "#v-model-arguments",
        text: (
            <>
                <Mono>v-model:name</Mono> ↔ prop <Mono>name</Mono> +{" "}
                <Mono>update:name</Mono>; replaces <Mono>.sync</Mono>.
            </>
        ),
    },
];

const FORWARDING_TEXT = [
    {
        title: "Writable computed for inner inputs",
        href: "#writable-computed-for-inner-inputs",
        text: (
            <>
                <Mono>get</Mono> reads the prop, <Mono>set</Mono> emits; never mutate
                an object prop.
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

const CONTRACT: SummaryArticle[] = CONTRACT_TEXT.map(withSeverities);
const ARGUMENTS: SummaryArticle[] = ARGUMENTS_TEXT.map(withSeverities);
const FORWARDING: SummaryArticle[] = FORWARDING_TEXT.map(withSeverities);

export default function Page() {
    const topic = topicBySlug("v-model");
    if (!topic) notFound();

    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "v-model on components", items: CONTRACT },
                        { label: "Multiple v-models", items: ARGUMENTS },
                        {
                            label: "Forwarding v-model to inner inputs",
                            items: FORWARDING,
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

                <VModelDocs />
            </article>
        </PageShell>
    );
}
