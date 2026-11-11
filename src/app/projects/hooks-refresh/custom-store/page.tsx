import DemoFrame from "@/components/ui/demo-frame";
import UseCustomStoreDemo from "@/projects/hooks-refresh/demos/use-custom-store-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    CustomStoreDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-custom-store-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const WHY_TEXT = [
    {
        title: "What a store is",
        href: "#what-a-store-is",
        text: (
            <>
                Shared state in a plain module, outside React. Needs data, a way to
                change it, and a way to NOTIFY React.
            </>
        ),
    },
];

const BUILDING_TEXT = [
    {
        title: "Subscribe — listening",
        href: "#subscribe-listening",
        text: (
            <>
                Add the callback to a <Mono>Set</Mono>, return the remover. React
                passes its OWN callback in here.
            </>
        ),
    },
    {
        title: "Emit — notifying",
        href: "#emit-notifying",
        text: (
            <>
                <Mono>emit()</Mono> runs every listener. Change the state first, then
                notify — the two are always a pair.
            </>
        ),
    },
    {
        title: "getSnapshot — reading",
        href: "#getsnapshot-reading",
        text: (
            <>
                Subscribe says WHEN it changed, <Mono>getSnapshot</Mono> says WHAT it
                is now. The store is complete, with zero React.
            </>
        ),
    },
];

const CONNECTING_TEXT = [
    {
        title: "The bridge",
        href: "#usesyncexternalstore-bridge",
        text: (
            <>
                <Mono>useSyncExternalStore(subscribe, getSnapshot)</Mono> — React
                listens, re-reads, re-renders. Every subscriber, one change.
            </>
        ),
    },
    {
        title: "Stable snapshot",
        href: "#stable-snapshot",
        text: (
            <>
                A fresh object per read never equals the last under{" "}
                <Mono>Object.is</Mono> — infinite loop. Return a primitive.
            </>
        ),
    },
    {
        title: "SSR snapshot",
        href: "#ssr-snapshot",
        text: (
            <>
                No client store on the server: pass a third arg,{" "}
                <Mono>getServerSnapshot</Mono>, or hydration mismatches.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof BUILDING_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const WHY: SummaryArticle[] = WHY_TEXT.map(withSeverities);
const BUILDING: SummaryArticle[] = BUILDING_TEXT.map(withSeverities);
const CONNECTING: SummaryArticle[] = CONNECTING_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "What & why", items: WHY },
                        { label: "Building the store", items: BUILDING },
                        { label: "Connecting to React", items: CONNECTING },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — the store
                is built one fragment at a time by its own DocSections. */}
            <DemoFrame
                name="Custom Store"
                source="react"
                docs={<CustomStoreDocs />}
                description={
                    <>
                        State that lives <Term>outside React</Term>, in a plain module, so
                        any number of components read the same data. Build it by hand —
                        the data, <Code>subscribe</Code>, <Code>emit</Code>,{" "}
                        <Code>getSnapshot</Code> — then bridge it in with{" "}
                        <Code>useSyncExternalStore</Code>. No library, and{" "}
                        <Term>no React until the last step</Term>: this is what Zustand is
                        underneath.
                    </>
                }
            >
                <UseCustomStoreDemo />
            </DemoFrame>
        </PageShell>
    );
}
