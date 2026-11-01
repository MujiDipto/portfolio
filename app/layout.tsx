import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Muji Dipto | Senior Software Engineer",
  description:
    "Senior Software Engineer in Brisbane, focused on backend and platform engineering.",
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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full font-mono">{children}</body>
    </html>
  );
}
