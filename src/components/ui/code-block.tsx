import { codeToHtml } from "shiki";

type Props = {
    code: string;
    lang?: string; // "tsx" | "ts" | "bash" | "css" | ...
};

// Server Component (no "use client"): Shiki highlights on the server, so the
// highlighter never ships to the browser — the client receives finished HTML.
export default async function CodeBlock({ code, lang = "tsx" }: Props) {
    const html = await codeToHtml(code.trim(), {
        lang,
        theme: "one-dark-pro",
    });

    return (
        <div
            className="code-frame overflow-hidden rounded-lg border border-[var(--border)]"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}