import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "apaarSetu | Data at one place",
  description: "APAAR-based National Student Data Management & Verification System for AICTE",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full min-h-screen bg-linear-to-b from-blue-300 to-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
