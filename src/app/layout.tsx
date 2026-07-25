import type { Metadata } from "next";
import Navbar from "@/components/layout/navbar";
import FaqButton from "@/components/ui/faq-button";
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
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Navbar />
          <main className="flex-1 px-8 py-10 lg:px-14">{children}</main>
        </div>
        <FaqButton />
      </body>
    </html>
  );
}