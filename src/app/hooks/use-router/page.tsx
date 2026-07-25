import DemoFrame from "@/components/ui/demo-frame";
import UseRouterDemo from "@/components/demos/use-router-demo";
import { UseRouterDocs } from "./content";
import { Code, Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import { useRouter } from "next/navigation";
//                       ^^^^^^^^^^^^^^^^^ App Router — NOT "next/router"

export default function SaveButton({ onSave }: { onSave: () => Promise<void> }) {
  const router = useRouter();

  async function handleClick() {
    await onSave();
    router.refresh();          // re-fetch server data, keep client state
  }

  return <button onClick={handleClick}>save</button>;
}

// Methods on the returned router:
// router.push(href)     — navigate, add history entry
// router.replace(href)  — navigate, replace history entry
// router.back() / .forward()
// router.refresh()      — re-run server render for current route
// router.prefetch(href) — warm the client cache`;

export default function Page() {
    return (
        <DemoFrame
            name="useRouter"
            source="next/navigation"
            code={CODE}
            docs={<UseRouterDocs />}
            description={
                <>
                    Programmatic access to the App Router: push, replace, back,
                    refresh. Reach for it when navigation is a{" "}
                    <Term>consequence of some action</Term> rather than a click on
                    a link — for links, keep <Code>&lt;Link&gt;</Code>. Import
                    from <Code>next/navigation</Code>; the old{" "}
                    <Code>next/router</Code> is Pages Router and behaves
                    differently.
                </>
            }
        >
            <UseRouterDemo />
        </DemoFrame>
    );
}
