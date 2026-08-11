import DemoFrame from "@/components/ui/demo-frame";
import UseSyncExternalStoreDemo from "@/projects/hooks-refresh/demos/use-sync-external-store-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseSyncExternalStoreDocs,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-sync-external-store-content";
import { Code, Term } from "@/components/ui/doc-section";

// Glanceable chapter takeaways — reading only these gives the whole part.
// Each href targets a DocSection id (slugged from its title in content.tsx).
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const IDEA_TEXT = [
    {
        title: "Subscribe to external state",
        href: "#subscribe-to-external-state",
        text: (
            <>
                Three args: <Mono>subscribe</Mono> (how React listens),{" "}
                <Mono>getSnapshot</Mono> (read it), <Mono>getServerSnapshot</Mono>{" "}
                (SSR).
            </>
        ),
    },
];

const EXAMPLES_TEXT = [
    {
        title: "Window — online status",
        href: "#window-online-status",
        text: (
            <>
                {/* explicit {" "}: the leading space of a text node starting with
                    an HTML entity gets trimmed away in the JSX transform */}
                The store is the browser. <Mono>cb</Mono>{" "}
                doesn&apos;t re-render — it tells React to re-read and compare.
            </>
        ),
    },
    {
        title: "localStorage — the same-tab gap",
        href: "#localstorage-cross-tab-the-same-tab-gap",
        text: (
            <>
                <Mono>storage</Mono> fires in OTHER tabs only. Dispatch it yourself
                after your own writes, or this tab goes stale.
            </>
        ),
    },
];

const RIGHT_TEXT = [
    {
        title: "Why not useEffect + useState",
        href: "#why-not-useeffect-usestate",
        text: (
            <>
                The manual pattern tears under concurrent rendering and has no server
                value. This hook is tear-free and SSR-safe.
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
                No browser store on the server: pass the third arg or the server pass
                crashes, then hydration mismatches.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const withSeverities = (
    item: (typeof EXAMPLES_TEXT)[number],
): SummaryArticle => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
});

const IDEA: SummaryArticle[] = IDEA_TEXT.map(withSeverities);
const EXAMPLES: SummaryArticle[] = EXAMPLES_TEXT.map(withSeverities);
const RIGHT: SummaryArticle[] = RIGHT_TEXT.map(withSeverities);

export default function Page() {
    return (
        <PageShell
            alerts={
                <SummaryArticles
                    groups={[
                        { label: "The idea", items: IDEA },
                        { label: "Examples", items: EXAMPLES },
                        { label: "Getting it right", items: RIGHT },
                    ]}
                />
            }
        >
            {/* No `code` prop: this page has no whole-module source panel — every
                fragment is introduced and explained by its own DocSection. */}
            <DemoFrame
                name="useSyncExternalStore"
                source="react"
                docs={<UseSyncExternalStoreDocs />}
                description={
                    <>
                        The bridge to state that lives <Term>outside React</Term> — a
                        browser API, <Code>localStorage</Code>, a socket, a store library.
                        Give it a way to listen (<Code>subscribe</Code>), a way to read (
                        <Code>getSnapshot</Code>) and a value for the server (
                        <Code>getServerSnapshot</Code>), and it re-renders on change —{" "}
                        <Term>tear-free</Term>, so every component reads the same value in
                        the same frame.
                    </>
                }
            >
                <UseSyncExternalStoreDemo />
            </DemoFrame>
        </PageShell>
    );
}
