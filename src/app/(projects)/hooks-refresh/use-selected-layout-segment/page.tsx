import DemoFrame from "@/components/ui/demo-frame";
import UseSelectedLayoutSegmentDemo from "@/projects/hooks-refresh/demos/use-selected-layout-segment-demo";
import { UseSelectedLayoutSegmentDocs } from "@/projects/hooks-refresh/content/use-selected-layout-segment-content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `// app/hooks/layout.tsx  (Server Component — keeps the shell fast)
import Nav from "./nav";

export default function HooksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Nav />
      <main>{children}</main>
    </div>
  );
}

// app/hooks/nav.tsx  (Client Component — where the hook lives)
"use client";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

const HOOKS = ["use-state", "use-effect", "use-router", "use-search-params"];

export default function Nav() {
  // Called from a client child of app/hooks/layout.tsx →
  // returns the active segment ONE LEVEL below that layout.
  const active = useSelectedLayoutSegment();

  return (
    <nav>
      {HOOKS.map((slug) => (
        <Link
          key={slug}
          href={\`/hooks/\${slug}\`}
          aria-current={active === slug ? "page" : undefined}
        >
          {slug}
        </Link>
      ))}
    </nav>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useSelectedLayoutSegment"
            source="next/navigation"
            code={CODE}
            docs={<UseSelectedLayoutSegmentDocs />}
            description={
                <>
                    Read the <Term>active child segment</Term> relative to the
                    layout the hook is called from — perfect for highlighting
                    the active row in a shared nav without parsing the full
                    pathname. Pair with{" "}
                    <Code>useSelectedLayoutSegments()</Code> for breadcrumb-style
                    reads that include every level below.
                </>
            }
        >
            <UseSelectedLayoutSegmentDemo />
        </DemoFrame>
    );
}
