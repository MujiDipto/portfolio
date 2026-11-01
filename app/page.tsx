import { Numbers } from "@/components/Numbers";
import { Prompt } from "@/components/Prompt";
import { TerminalWindow, type Tab } from "@/components/TerminalWindow";
import { profile } from "@/lib/content";

const tabs: Tab[] = [{ id: "about", label: "about" }];

export default function Home() {
  return (
    <>
      <a
        href="#content"
        className="bg-window text-accent sr-only z-20 rounded px-3 py-2 font-mono text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <TerminalWindow tabs={tabs}>
        <main
          id="content"
          tabIndex={-1}
          className="px-5 py-10 focus:outline-none sm:px-10 sm:py-14"
        >
          <section aria-labelledby="name" className="max-w-[72ch]">
            <Prompt command="whoami" />
            <h1
              id="name"
              className="text-fg-strong mt-4 text-3xl font-semibold tracking-tight"
            >
              {profile.name}
            </h1>
            <p className="text-fg mt-2 text-lg">
              {profile.title}, {profile.focus}
            </p>
            <p className="text-muted mt-1 font-mono text-sm">
              {profile.location}
            </p>
          </section>

          <section
            id="about"
            aria-labelledby="about-heading"
            className="mt-14 max-w-[72ch] scroll-mt-16"
          >
            <Prompt command="cat about.md" />
            <h2 id="about-heading" className="sr-only">
              About
            </h2>
            <div className="mt-4 space-y-3 leading-relaxed">
              {profile.summary.map((line) => (
                <p key={line}>
                  <Numbers text={line} />
                </p>
              ))}
            </div>
          </section>
        </main>
      </TerminalWindow>
    </>
  );
}
