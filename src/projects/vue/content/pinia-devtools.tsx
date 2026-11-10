import { DocSection, Code, Term, Callout } from "@/components/ui/doc-section";
import type { SectionSeverities } from "@/lib/severity";

// Everything each section covers, keyed by its section id, in page order. This
// feeds the summary rail in page.tsx (one icon per severity, sorted
// danger > trap > next > difference > tip > note). It is NOT what flags a
// section header — that is the explicit `sectionSeverity` prop, and no section
// here is wholly one severity, so every callout below is inline only.
// Keys are slug(title) — the id DocSection gives the section.
// See the convention comment in @/lib/severity.
export const SECTION_SEVERITIES: SectionSeverities = {
    // --- part 1 (The store inspector) ---
    // inline `note · getters are shown as values`
    "reading-store-state": ["note"],
    // inline `trap · edits do not reach the server`
    "editing-state-live": ["trap"],

    // --- part 2 (Timeline and time travel) ---
    // inline `tip · name actions after intent`
    "the-action-timeline": ["tip"],
    // inline `note · the extension, not the app`
    "time-travel": ["note"],
};

// Top-level divider between the parts of the page — mirrors the groups in
// the summary rail. Identical to the helper in the typescript content files.
function PartHeading({
    kicker,
    children,
}: {
    kicker: string;
    children: string;
}) {
    return (
        <div className="mt-14 mb-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--muted)]">
                {kicker}
            </p>
            <h2 className="mt-1 text-[1.15rem] font-bold tracking-tight text-[var(--text)]">
                {children}
            </h2>
            <div
                aria-hidden="true"
                className="mt-3 h-px w-full bg-[var(--border)]"
            />
        </div>
    );
}

// PAGE RULES — those of the app-instance page:
//
// 1. A section opens with prose; every fragment is introduced by the sentence
//    above it. Two fragments never touch.
// 2. PURPOSE FIRST: the problem, then the solution, then how it works, then
//    details.
// 3. Reference-doc tone: no "we", no tutorial or chat wording, no Q&A.
//
// This page describes a browser extension rather than code, so it carries no
// fragments at all — and therefore no CodeBlock, GridTable or pair grid. An
// unused helper copied in from the reference would only be dead code.

export function PiniaDevtoolsDocs() {
    return (
        <>
            {/* Page lead — before the first divider. */}
            <div className="space-y-[0.9rem] text-[0.95rem] leading-[1.65] text-[var(--muted)]">
                <p>
                    The Vue DevTools browser extension has a{" "}
                    <Term>Pinia inspector</Term>: it lists every store, shows its state
                    and getters, lets that state be edited while the app runs, and
                    records actions and patches on a timeline.
                </p>
                <p>
                    This page covers what the inspector shows, editing state live,
                    reading the timeline, and the limits of time travel.
                </p>
            </div>

            {/* ---------- part 1 — the store inspector ---------- */}
            <PartHeading kicker="part 1">The store inspector</PartHeading>
            <div>
                <DocSection title="Reading store state">
                    <p>
                        Logging state to the console shows one moment of one store, and
                        a <Code>console.log</Code> placed in an action disappears as
                        soon as the code is tidied up.
                    </p>
                    <p>
                        With the Vue DevTools extension installed, a Pinia section lists
                        all registered stores by their id. Selecting one shows its state
                        and its getters with current values, updating as the app runs.
                    </p>
                    <p>
                        The id passed to <Code>defineStore</Code> is the label shown
                        here, which is why a meaningful, unique id matters. A store
                        appears once it has been used for the first time, because{" "}
                        <Code>defineStore</Code> only creates the instance when its
                        composable is first called.
                    </p>
                    <p>
                        The Components inspector shows the same data from the other
                        side: selecting a component lists the stores it uses, which
                        answers whether a component reads the store it was expected to
                        read.
                    </p>

                    <Callout severity="note" label="note · getters are shown as values">
                        <p>
                            Getters appear with their computed result, so a wrong getter
                            is visible without reading its code.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Editing state live">
                    <p>
                        Reaching an edge case — an empty list, an expired session, an
                        admin account — by clicking through the UI is slow, and some
                        states are hard to produce at all.
                    </p>
                    <p>
                        State values in the inspector are editable. Changing one writes
                        to the store, so every component bound to it re-renders
                        immediately.
                    </p>
                    <p>
                        This makes states reachable without the UI that would normally
                        create them: switching a user&apos;s role to{" "}
                        <Code>admin</Code> to check a guarded route, emptying a list to
                        see its empty state, or setting an error flag to inspect an
                        error message.
                    </p>

                    <Callout
                        severity="trap"
                        label="trap · edits do not reach the server"
                    >
                        <p>
                            Editing state changes only the client&apos;s store. A
                            persisted or server-backed value returns on the next load or
                            request unless it is changed at its source.
                        </p>
                    </Callout>
                </DocSection>
            </div>

            {/* ---------- part 2 — timeline and time travel ---------- */}
            <PartHeading kicker="part 2">Timeline and time travel</PartHeading>
            <div>
                <DocSection title="The action timeline">
                    <p>
                        When state is wrong, the question is which change made it wrong
                        and in what order — something a snapshot of the current state
                        cannot answer.
                    </p>
                    <p>
                        The timeline records Pinia events as they happen: actions with
                        their arguments, and state changes with their type, in the order
                        they occurred.
                    </p>
                    <p>
                        Reading it answers the questions a state snapshot cannot:
                        whether an action ran at all, whether it ran twice, which store
                        changed first, and whether a change came from an action or from
                        a direct assignment. Direct assignments appear as a change
                        without an action name, which is the practical argument for
                        routing changes through named actions (see Pinia Basics).
                    </p>

                    <Callout severity="tip" label="tip · name actions after intent">
                        <p>
                            A timeline of <Code>login</Code>, <Code>addToCart</Code> and{" "}
                            <Code>checkout</Code> is readable; one of{" "}
                            <Code>setUser</Code> and <Code>setItems</Code> only repeats
                            what the state already shows.
                        </p>
                    </Callout>
                </DocSection>

                <DocSection title="Time travel">
                    <p>
                        Reproducing a bug often means repeating the same sequence of
                        clicks after every code change.
                    </p>
                    <p>
                        Selecting an earlier entry on the timeline restores the state as
                        it was at that point, so the steps leading to a bug can be
                        replayed without redoing them.
                    </p>
                    <p>
                        Only state tracked by the inspector is restored. Everything
                        outside it — the DOM&apos;s own state, a pending request, data
                        already written to a server or to{" "}
                        <Code>localStorage</Code> — stays as it is, so a replayed state
                        is not a full snapshot of the app.
                    </p>

                    <Callout severity="note" label="note · the extension, not the app">
                        <p>
                            Both the inspector and the timeline come from the DevTools
                            extension and exist only in development builds. Production
                            builds expose no such data unless it is explicitly enabled.
                        </p>
                    </Callout>
                </DocSection>
            </div>
        </>
    );
}
