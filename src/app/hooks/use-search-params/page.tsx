import DemoFrame from "@/components/ui/demo-frame";
import UseSearchParamsDemo from "@/components/demos/use-search-params-demo";
import { UseSearchParamsDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function SearchBox() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const q = searchParams.get("q") ?? "";

  function setQ(next: string) {
    // clone the read-only params, mutate the copy, replace the URL
    const params = new URLSearchParams(searchParams);
    next ? params.set("q", next) : params.delete("q");
    router.replace(\`\${pathname}?\${params.toString()}\`);
  }

  return <input value={q} onChange={(e) => setQ(e.target.value)} />;
}

// Keep the Suspense boundary tight so the rest of the route can still be
// prerendered — useSearchParams opts its subtree out of static rendering.
export default function Page() {
  return (
    <Suspense fallback={<p>loading…</p>}>
      <SearchBox />
    </Suspense>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="useSearchParams"
            source="next/navigation"
            code={CODE}
            docs={<UseSearchParamsDocs />}
            description={
                <>
                    Read the current URL&apos;s query string as a{" "}
                    <Term>read-only URLSearchParams</Term>. To change it, clone,
                    mutate, and hand the new query to <Code>router.replace</Code>{" "}
                    or <Code>router.push</Code>. Wrap the reader in a{" "}
                    <Code>&lt;Suspense&gt;</Code> boundary — otherwise the whole
                    route opts out of static rendering.
                </>
            }
        >
            <UseSearchParamsDemo />
        </DemoFrame>
    );
}
