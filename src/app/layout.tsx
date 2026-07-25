import type { Metadata } from "next";
import Navbar from "@/components/layout/navbar";
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
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Navbar />
          <main className="flex-1 px-8 py-10 lg:px-14">{children}</main>
        </div>
      </body>
    </html>
  );
}