import type { ReactNode } from "react";

export type Tab = { id: string; label: string };

export function TerminalWindow({
  tabs,
  children,
}: {
  tabs: Tab[];
  children: ReactNode;
}) {
  return (
    <div className="bg-window sm:border-border mx-auto w-full max-w-5xl sm:mt-10 sm:mb-16 sm:rounded-xl sm:border">
      <header className="bg-titlebar border-border sticky top-0 z-10 flex h-11 items-center gap-4 border-b px-4 sm:rounded-t-xl">
        <div aria-hidden="true" className="hidden gap-2 sm:flex">
          <span className="bg-dot-close size-3 rounded-full" />
          <span className="bg-dot-minimise size-3 rounded-full" />
          <span className="bg-dot-zoom size-3 rounded-full" />
        </div>
        <nav aria-label="Sections" className="min-w-0">
          <ul className="flex gap-1 font-mono text-sm">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <a
                  href={`#${tab.id}`}
                  className="text-fg hover:text-accent rounded px-2 py-1 hover:underline"
                >
                  {tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p
          aria-hidden="true"
          className="text-muted ml-auto hidden font-mono text-sm md:block"
        >
          muji@brisbane: ~
        </p>
      </header>
      {children}
    </div>
  );
}
