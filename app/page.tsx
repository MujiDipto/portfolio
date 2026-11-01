import { Numbers } from "@/components/Numbers";
import { Prompt } from "@/components/Prompt";
import { Section } from "@/components/Section";
import { TerminalWindow } from "@/components/TerminalWindow";
import { Contact } from "@/components/sections/Contact";
import { Education } from "@/components/sections/Education";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Skills } from "@/components/sections/Skills";
import { profile } from "@/lib/content";

export default function Home() {
  return (
    <>
      <a
        href="#content"
        className="bg-window text-accent sr-only z-20 rounded px-3 py-2 font-mono text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
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

          <Section id="about" title="About" command="cat about.md">
            <div className="max-w-[72ch] space-y-3 leading-relaxed">
              {profile.summary.map((line) => (
                <p key={line}>
                  <Numbers text={line} />
                </p>
              ))}
            </div>
          </Section>
          <Experience />
          <Projects />
          <Skills />
          <Education />
          <Contact />
        </main>
      </TerminalWindow>
    </>
  );
}
