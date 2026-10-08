import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "learn",
  description: "Hands-on learning projects, grouped by type.",
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
    // suppressHydrationWarning (one level deep, attributes only): browser
    // extensions like Grammarly/ColorZilla stamp attributes onto <html>/<body>
    // before hydration, which React otherwise reports as a mismatch.
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* Chrome is per-section: each project's own layout under
          src/app/(projects)/ owns its navbar (and FAQ button, where it has
          one), and the home page brings its own. The root owns only
          <html>/<body> and the base metadata. */}
      <body className="min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}