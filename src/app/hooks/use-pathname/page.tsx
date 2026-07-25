import DemoFrame from "@/components/ui/demo-frame";
import UsePathnameDemo from "@/components/demos/use-pathname-demo";
import { UsePathnameDocs } from "./content";
import { Term } from "@/components/ui/doc-section";

const CODE = `"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/hooks/use-router", label: "useRouter" },
  { href: "/hooks/use-pathname", label: "usePathname" },
];

export default function Nav() {
  const pathname = usePathname();          // e.g. "/hooks/use-pathname"

  return (
    <nav>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={pathname === l.href ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}`;

export default function Page() {
    return (
        <DemoFrame
            name="usePathname"
            source="next/navigation"
            code={CODE}
            docs={<UsePathnameDocs />}
            description={
                <>
                    Read the current URL <Term>pathname</Term> from a client
                    component and re-render on navigation. Path only — no query,
                    no hash. The bread-and-butter primitive for active-link
                    highlighting.
                </>
            }
        >
            <UsePathnameDemo />
        </DemoFrame>
    );
}
