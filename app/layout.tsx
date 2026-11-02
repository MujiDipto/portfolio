import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { jsFlagScript } from "@/lib/boot";
import { siteUrl } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Muji Dipto | Senior Software Engineer";
// Approved by Muji, 2026-11-02.
const description =
  "Senior Software Engineer at OnEarly in Brisbane, after 4+ years at Oracle owning backend platforms and data pipelines. Explore it in an interactive terminal.";

// The icons and link-preview card are files in app/ (scripts/brand-images.mjs).
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Muji Dipto",
    locale: "en_AU",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script sets data-theme before React hydrates.
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlagScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full font-mono">{children}</body>
    </html>
  );
}
