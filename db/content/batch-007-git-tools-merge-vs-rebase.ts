import type { ContentEntry } from "../../src/server/schema";

// ===================================================================
// BATCH 007 — merge vs rebase, on the Git & Tools page.
//
// Fills the question the seed already scaffolded as `git-rebase` (order 9,
// high priority) rather than adding a `git-merge-vs-rebase` beside it, and on
// the page that already exists rather than a second Git page: "Git & Tools" is
// the Git page, and a `git` page next to it would put the same question in the
// sidebar twice. Same decision as jwt-auth, event-loop, virtual-dom,
// sql-vs-nosql and cors. The title is widened from "What does git rebase do
// (vs merge)?" to the symmetrical question, and the `#git-rebase` anchor is
// kept.
//
// The `git-tools` page node already exists, active and bilingual (order 9
// under fullstack-questions), so nothing structural is added here.
//
// FIRST `bash` code block in the database. No component change was needed:
// CodeBlock hands `lang` straight to shiki, which already highlights bash —
// src/projects/typescript uses lang="bash" on the file side.
//
// The three bullets are an UNORDERED list: two contrasting commands and the
// workflow teams build from them, not steps in a sequence.
//
// Inline code in the TITLE is deliberate and safe in both places it is read:
// the heading renders it through the inline parser, and ListenButton speaks
// plainText(), so the backticks are not read aloud.
// ===================================================================

export const entries: ContentEntry[] = [
    {
        page: "interviews/preparation/fullstack-questions/git-tools",
        slug: "git-rebase",
        title: {
            en: "What is the difference between `git merge` and `git rebase`?",
            de: "Was ist der Unterschied zwischen `git merge` und `git rebase`?",
        },
        status: "active",
        priority: "high",
        tags: ["git", "merge", "rebase"],
        shortAnswer: {
            en: "Both combine changes from one branch into another. Merge keeps the full history and adds a merge commit. Rebase moves your commits on top of the other branch, which gives you a clean, linear history.",
            de: "Beide übernehmen Änderungen von einem Branch in einen anderen. Merge behält die komplette History und erstellt einen Merge-Commit. Rebase setzt deine Commits dagegen auf den anderen Branch drauf und sorgt so für eine saubere, lineare History.",
        },
        blocks: [
            {
                type: "list",
                ordered: false,
                items: [
                    {
                        text: {
                            en: "`git merge main` (run on the feature branch) creates a merge commit that joins both histories. Nothing is rewritten.",
                            de: "`git merge main` (auf dem Feature-Branch) erstellt einen Merge-Commit, der beide Histories zusammenführt. Dabei wird nichts umgeschrieben.",
                        },
                    },
                    {
                        text: {
                            en: "`git rebase main` replays your feature commits one by one on top of the latest main. The commits get new hashes.",
                            de: "`git rebase main` spielt deine Feature-Commits einzeln auf dem aktuellen main neu ab. Die Commits bekommen dabei neue Hashes.",
                        },
                    },
                    {
                        text: {
                            en: "Many teams rebase a feature branch to keep it up to date, then merge (or squash) when the pull request goes into main.",
                            de: "In vielen Teams rebased man den Feature-Branch, um ihn aktuell zu halten, und merged (oder squasht) erst, wenn der Pull Request in main geht.",
                        },
                    },
                ],
            },
            {
                type: "code",
                lang: "bash",
                code: `# Merge: keeps history, adds a merge commit
git checkout feature
git merge main

# Rebase: replays feature commits on top of main
git checkout feature
git rebase main

# Conflict during rebase: fix it, then continue
git add .
git rebase --continue

# Branch already pushed? Update the remote safely
git push --force-with-lease`,
            },
        ],
        cards: [
            {
                type: "note",
                title: {
                    en: "Merge conflicts",
                    de: "Merge-Konflikte",
                },
                text: {
                    en: "Both can cause conflicts. With merge, you resolve them once. With rebase, you may have to resolve them for each commit and then continue with `git rebase --continue`.",
                    de: "Konflikte kann es bei beiden geben. Beim Merge löst man sie einmal. Beim Rebase muss man sie eventuell pro Commit lösen und dann mit `git rebase --continue` weitermachen.",
                },
            },
            {
                type: "trap",
                title: {
                    en: "Don't rebase shared branches",
                    de: "Keine geteilten Branches rebasen",
                },
                text: {
                    en: "Rebase rewrites history. If other people already work on the branch (e.g. main), their history no longer matches yours. Only rebase your own branches, and push with `git push --force-with-lease`.",
                    de: "Rebase schreibt die History um. Wenn andere schon auf dem Branch arbeiten (z. B. main), passt ihre History nicht mehr zu deiner. Deshalb nur eigene Branches rebasen und danach mit `git push --force-with-lease` pushen.",
                },
            },
        ],
    },
];
