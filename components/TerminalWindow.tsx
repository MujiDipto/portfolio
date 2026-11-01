import type { ReactNode } from "react";

/** A fixed-size terminal window; its content area is the only thing that scrolls. */
export function TerminalWindow({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh items-center justify-center sm:p-8">
      <div className="bg-window sm:border-border flex h-full w-full max-w-[73.6rem] flex-col overflow-hidden sm:h-[min(80dvh,48rem)] sm:rounded-xl sm:border">
        <header className="bg-titlebar border-border grid h-11 flex-none grid-cols-[1fr_auto_1fr] items-center border-b px-4">
          <div aria-hidden="true" className="hidden gap-2 sm:flex">
            <span className="bg-dot-close size-3 rounded-full" />
            <span className="bg-dot-minimise size-3 rounded-full" />
            <span className="bg-dot-zoom size-3 rounded-full" />
          </div>
          <p aria-hidden="true" className="text-muted col-start-2 text-sm">
            muji@brisbane: ~
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}
