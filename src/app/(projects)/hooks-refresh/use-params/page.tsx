import DemoFrame from "@/components/ui/demo-frame";
import UseParamsDemo from "@/projects/hooks-refresh/demos/use-params-demo";
import { UseParamsDocs } from "@/projects/hooks-refresh/content/use-params-content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `// app/blog/[slug]/page.tsx  (Server Component)
// On the Page itself, params arrive as a prop — no hook needed.
export default async function Post({ params }: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Article slug={slug} />;
}

// app/blog/[slug]/breadcrumbs.tsx  (Client Component nested inside)
"use client";
import { useParams } from "next/navigation";

export default function Breadcrumbs() {
  const { slug } = useParams<{ slug: string }>();
  return <nav>blog / {slug}</nav>;
}

// URL:  /blog/hello-world?tab=comments
//       └─ params: { slug: "hello-world" }
//                                      └─ search params: { tab: "comments" }`;

export default function Page() {
    return (
        <DemoFrame
            name="useParams"
            source="next/navigation"
            code={CODE}
            docs={<UseParamsDocs />}
            description={
                <>
                    Read the current route&apos;s <Term>dynamic segment values</Term>{" "}
                    from a client component — <Code>[slug]</Code> folders become{" "}
                    <Code>params.slug</Code>. Distinct from{" "}
                    <Code>useSearchParams</Code>, which reads the query string
                    after the <Code>?</Code>.
                </>
            }
        >
            <UseParamsDemo />
        </DemoFrame>
    );
}
