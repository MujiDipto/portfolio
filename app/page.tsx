import type { Metadata } from "next";
import { TerminalWindow } from "@/components/TerminalWindow";
import { StaticSession } from "@/components/terminal/StaticSession";
import { Terminal } from "@/components/terminal/Terminal";

// One address for search engines, whichever domain served the page (the
// Vercel URL serves the site too). Resolved against lib/site.ts.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <a
        href="#content"
        className="bg-window text-accent sr-only z-20 rounded px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <TerminalWindow>
        <main
          id="content"
          tabIndex={-1}
          // relative: keeps sr-only headings inside the scroll area, or they stretch the page.
          className="relative min-h-0 flex-1 overflow-y-auto px-5 py-8 focus:outline-none sm:px-8"
        >
          <Terminal />
          <noscript>
            <StaticSession />
          </noscript>
        </main>
      </TerminalWindow>
    </>
  );
}
