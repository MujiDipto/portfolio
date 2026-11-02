import type { Metadata } from "next";
import Link from "next/link";
import { OutputView, Project, Whoami } from "@/components/terminal/Outputs";
import { projects } from "@/lib/content";

const title = "Muji Dipto | CV";
// The site's approved description; this page is the same content, typed out.
const description =
  "Senior Software Engineer at OnEarly in Brisbane, after 4+ years at Oracle owning backend platforms and data pipelines. Explore it in an interactive terminal.";

export const metadata: Metadata = {
  title,
  alternates: { canonical: "/cv" },
  openGraph: {
    type: "profile",
    url: "/cv",
    siteName: "Muji Dipto",
    locale: "en_AU",
    title,
    description,
  },
};

/**
 * The whole CV as one plain page: crawlable, printable and readable without
 * typing a command. It reuses the terminal's outputs, so the two cannot drift.
 */
export default function Cv() {
  return (
    // The window surface, not the page: the theme's text colours are checked
    // against it (__tests__/theme-contrast.test.ts).
    <div className="cv bg-window min-h-full">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <nav aria-label="Site" className="mb-10 text-sm print:hidden">
          <Link
            href="/"
            className="text-accent underline underline-offset-4 hover:no-underline"
          >
            Open the interactive terminal
          </Link>
        </nav>
        <main className="space-y-12">
          <Whoami main cvLink={false} />
          <section>
            <OutputView output={{ type: "highlights" }} />
          </section>
          <section>
            <OutputView output={{ type: "experience" }} />
          </section>
          <section>
            <h2 data-title>Projects</h2>
            <div className="space-y-8">
              {projects.map((p) => (
                <Project key={p.slug} slug={p.slug} />
              ))}
            </div>
          </section>
          <section>
            <OutputView output={{ type: "skills" }} />
          </section>
          <section>
            <OutputView output={{ type: "education" }} />
          </section>
          <section>
            <OutputView output={{ type: "contact" }} />
          </section>
        </main>
      </div>
    </div>
  );
}
