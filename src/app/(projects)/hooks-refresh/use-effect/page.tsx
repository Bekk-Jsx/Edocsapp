import DemoFrame from "@/components/ui/demo-frame";
import UseEffectDemo from "@/projects/hooks-refresh/demos/use-effect-demo";
import PageShell from "@/components/ui/page-shell";
import SummaryArticles, {
    Mono,
    type SummaryArticle,
} from "@/components/ui/summary-articles";
import {
    UseEffectDocs,
    UseEffectResyncDocs,
    ExampleLabel,
    SECTION_SEVERITIES,
} from "@/projects/hooks-refresh/content/use-effect-content";
import { Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useEffect } from "react";

export default function ChatRoom({ room }: { room: string }) {
  useEffect(() => {
    const conn = createConnection(room);
    conn.connect();

    return () => conn.disconnect();  // disconnect old room before connecting new
  }, [room]);                        // re-sync whenever room changes

  return <h1>Room: {room}</h1>;
}`;

// Glanceable chapter takeaways — reading only these gives the whole chapter.
// Each href targets a DocSection id (slugged from its title in content.tsx),
// except the last, which targets the wrapper around the final live demo.
// AUDIT RULE: every DocSection on this page must have exactly one article here,
// and every article must point at a real section id — EXCEPT the two pinned
// footer sections, "react vs next.js" and "say it right — english", which always
// render last and are deliberately NOT in the rail.
const SUMMARY_TEXT = [
    {
        href: "#reading-the-code",
        text: (
            <>
                Line by line: render 1 paints <Mono>0</Mono>, the effect runs after paint
                and schedules render 2 — and <Mono>window</Mono> is read in the effect
                because it doesn&apos;t exist on the server.
            </>
        ),
    },
    {
        href: "#what-an-effect-is",
        text: (
            <>
                An effect synchronizes your component with an external system — it runs
                after render, not to compute values from props or state.
            </>
        ),
    },
    {
        href: "#the-dependency-array",
        text: (
            <>
                <Mono>[]</Mono> runs once; <Mono>[deps]</Mono> re-runs on change; NO array
                runs every render — if it calls <Mono>setState</Mono> it loops. Avoid the
                no-array form.
            </>
        ),
    },
    {
        href: "#rules-of-hooks",
        text: (
            <>
                Never call <Mono>useEffect</Mono> conditionally — the condition goes
                inside the effect, not around it.
            </>
        ),
    },
    {
        href: "#reading-the-cleanup",
        text: (
            <>
                Line by line: <Mono>addEventListener</Mono> registers once, the returned
                function is the cleanup, and both calls must receive the same handler
                reference.
            </>
        ),
    },
    {
        href: "#cleanup-the-core-idea",
        text: (
            <>
                If an effect starts something, return a function to stop it — start and
                stop, always paired.
            </>
        ),
    },
    {
        href: "#setup-runs-once-the-callback-runs-many",
        text: (
            <>
                The setup runs once and just registers the callback; the browser fires it
                many times — different runners.
            </>
        ),
    },
    {
        href: "#when-cleanup-runs",
        text: (
            <>
                Cleanup runs on unmount and before every re-sync — React tears down the
                old before setting up the new.
            </>
        ),
    },
    {
        href: "#two-ways-to-leak-listeners",
        text: (
            <>
                Registering in the body leaks a listener per render; skipping cleanup
                leaks one per revisit — you need the effect AND its cleanup.
            </>
        ),
    },
    {
        href: "#effects-data-fetching",
        text: (
            <>
                A timer needs stopping; a fetch needs its stale response ignored (
                <Mono>AbortController</Mono>) to avoid a race — and in Next, prefer
                fetching in Server Components.
            </>
        ),
    },
    {
        href: "#ssr-strict-mode",
        text: (
            <>
                Effects never run on the server; Strict Mode double-invokes them in dev to
                prove your cleanup fully reverses your setup.
            </>
        ),
    },
    {
        href: "#putting-it-together-dependency-driven-re-sync",
        text: (
            <>
                With <Mono>[dep]</Mono>, the effect re-syncs on change: React runs the old
                cleanup before the new setup, so you never connect to two rooms at once.
            </>
        ),
    },
    {
        href: "#reading-the-re-sync",
        text: (
            <>
                Line by line: <Mono>[room]</Mono> re-syncs on change — React runs
                cleanup(old) before setup(new), so two rooms are never open at once.
            </>
        ),
    },
];

// Severities are DERIVED from SECTION_SEVERITIES by href — never hand-set here,
// so every card matches the section it links to by construction.
const SUMMARY: SummaryArticle[] = SUMMARY_TEXT.map((item) => ({
    ...item,
    severities: SECTION_SEVERITIES[item.href.replace("#", "")],
}));

export default function Page() {
    return (
        <PageShell alerts={<SummaryArticles items={SUMMARY} />}>
            {/* Page header. DemoFrame normally supplies this, but the live demo is
                the hardest example here and belongs at the bottom — so the title
                leads the page on its own. */}
            <header className="mb-6">
                <p className="font-mono text-xs tracking-widest text-[var(--muted)]">
                    react · useEffect
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-[var(--text)]">
                    useEffect
                </h1>
                <div className="mt-3 leading-relaxed text-[var(--muted)]">
                    Synchronize a component with an <Term>external system</Term> after
                    render — subscriptions, the DOM, timers, network. Not for deriving
                    state from props: the dependency array controls re-syncing, and the
                    returned cleanup keeps every setup paired with a teardown.
                </div>
            </header>

            {/* parts 1 & 2 — run once, then cleanup */}
            <UseEffectDocs />

            {/* part 3 — the hardest example, live. DemoFrame renders the demo, then
                the source, then UseEffectResyncDocs, so the code is explained
                immediately after it. */}
            <section
                id="putting-it-together-dependency-driven-re-sync"
                className="mt-14 border-t border-[var(--border)] pt-10"
                style={{ scrollMarginTop: "2rem" }}
            >
                <ExampleLabel>
                    putting it together · dependency-driven re-sync
                </ExampleLabel>
                <DemoFrame
                    name="chat room"
                    source="react"
                    code={CODE}
                    docs={<UseEffectResyncDocs />}
                    description={
                        <>
                            Everything so far, at once: a setup that connects, a cleanup
                            that disconnects, and a <Term>dependency</Term> that decides
                            when to swap one for the other. Switch rooms and watch the log
                            — the old connection closes before the new one opens.
                        </>
                    }
                >
                    <UseEffectDemo />
                </DemoFrame>
            </section>
        </PageShell>
    );
}
