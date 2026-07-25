import DemoFrame from "@/components/ui/demo-frame";
import UseHookDemo from "@/components/demos/use-demo";
import { UseDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `// The real App Router pattern: server component starts the fetch,
// client component reads it with use() inside a Suspense boundary.

// app/quotes/page.tsx  (Server Component)
import { Suspense } from "react";
import Quote from "./quote";

async function fetchQuote() {
  const res = await fetch("https://api.example.com/quote", { cache: "no-store" });
  return res.json() as Promise<{ text: string }>;
}

export default function Page() {
  const promise = fetchQuote();          // NOT awaited — pass the promise down
  return (
    <Suspense fallback={<p>loading…</p>}>
      <Quote promise={promise} />
    </Suspense>
  );
}

// app/quotes/quote.tsx  (Client Component)
"use client";
import { use } from "react";

export default function Quote({ promise }: { promise: Promise<{ text: string }> }) {
  const { text } = use(promise);         // suspends until resolved
  return <blockquote>{text}</blockquote>;
}`;

export default function Page() {
    return (
        <DemoFrame
            name="use"
            source="react"
            code={CODE}
            docs={<UseDocs />}
            description={
                <>
                    Read a <Term>resource</Term> — a context or a promise — from
                    render. Unique among hooks: <Code>use</Code> is legal inside{" "}
                    <Code>if</Code> branches and loops. Promise reads suspend the
                    component until resolution, so they belong inside a{" "}
                    <Code>&lt;Suspense&gt;</Code> boundary.
                </>
            }
        >
            <UseHookDemo />
        </DemoFrame>
    );
}
