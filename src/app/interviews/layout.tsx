import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Navbar, { type NavGroup } from "@/components/layout/navbar";
import LangProvider from "@/components/interviews/lang-provider";
import LangSwitch from "@/components/interviews/lang-switch";
import {
    LANG_COOKIE,
    langFromCookie,
    plain,
} from "@/components/interviews/inline";
import { getInterviewTree } from "@/lib/interviews";
import { getItemPages } from "@/server/interviews";
import { INTERVIEWS_SEGMENT, interviewItemHref } from "@/lib/routes";

// Shell for every /interviews/* route — the same chrome as a project layout
// (sidebar, back link out of the section), so an interview page and a doc page
// feel like the same app.
//
// The sidebar lists one group per interview item with that item's pages as
// route links (ids carry "<item>/<page>", which basePath turns into
// /interviews/<item>/<page>), and carries the EN/DE content switch above them.
//
// The language cookie is read HERE, on the server, and handed to LangProvider
// as its initial value — which is what makes the first paint already correct
// instead of flashing English before a client effect corrects it.
export default async function InterviewsLayout({
    children,
}: {
    children: ReactNode;
}) {
    const jar = await cookies();
    const lang = langFromCookie(jar.get(LANG_COOKIE)?.value);

    // The tree may be unreachable; the sidebar then lists nothing rather than
    // taking the whole section down with it.
    let groups: NavGroup[] = [];
    let firstItemHref = "/?section=interviews";
    try {
        const categories = await getInterviewTree();
        const items = categories.flatMap((category) => category.items);
        if (items[0]) firstItemHref = interviewItemHref(items[0].slug);

        groups = await Promise.all(
            items.map(async (item): Promise<NavGroup> => {
                const pages = await getItemPages(item.slug);
                return {
                    heading: item.name,
                    items: pages.map((page) => ({
                        id: `${item.slug}/${page.slug}`,
                        // Sidebar rows are content, so they follow the
                        // language choice like everything else.
                        label: plain(page.name, lang),
                    })),
                };
            }),
        );
    } catch (error) {
        console.error("[interviews] sidebar tree unavailable", error);
    }

    return (
        <LangProvider initialLang={lang}>
            <div className="flex min-h-screen">
                <Navbar
                    groups={groups}
                    mode="route"
                    basePath={`/${INTERVIEWS_SEGMENT}`}
                    homeHref={firstItemHref}
                    brand={{ eyebrow: "interviews", sub: "questions · answers" }}
                    back={{ href: "/?section=interviews", label: "Interviews" }}
                    aside={<LangSwitch />}
                    // Section-level page, listed apart from the question pages
                    // exactly as a project lists its own notes.
                    projectLinks={[{ id: "notes", label: "Notes" }]}
                />
                <main className="flex-1 px-8 py-10 lg:px-14">{children}</main>
            </div>
        </LangProvider>
    );
}
