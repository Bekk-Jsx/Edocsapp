import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hooks Refresh · React & Next.js",
  description: "Live demos, source, and reference docs for every hook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-scroll-behavior: Next 16 no longer overrides scroll-behavior on
    // route changes, so opt back in to keep page navigation an instant jump
    // while in-page anchors stay smooth.
    <html lang="en" data-scroll-behavior="smooth">
      {/* Chrome is per-section: the navbar + FAQ button shell lives in
          src/app/(projects)/hooks-refresh/layout.tsx, and the home page brings
          its own. The root owns only <html>/<body> and the base metadata. */}
      <body className="min-h-screen">{children}</body>
    </html>
  );
}