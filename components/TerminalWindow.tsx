import type { ReactNode } from "react";
import { CatImage } from "@/components/cat/CatImage";

/** A fixed-size terminal window; its content area is the only thing that scrolls. */
export function TerminalWindow({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh items-center justify-center sm:p-8">
      <div className="relative flex h-full w-full max-w-[73.6rem] flex-col sm:h-[min(80dvh,48rem,calc(100dvh-11rem))]">
        <div className="bg-window sm:border-border flex h-full w-full flex-col overflow-hidden sm:rounded-xl sm:border">
          <header className="bg-titlebar border-border grid h-11 flex-none grid-cols-[1fr_auto_1fr] items-center border-b px-4">
            <div aria-hidden="true" className="hidden gap-2 sm:flex">
              <span className="bg-dot-close size-3 rounded-full" />
              <span className="bg-dot-minimise size-3 rounded-full" />
              <span className="bg-dot-zoom size-3 rounded-full" />
            </div>
            <p aria-hidden="true" className="text-muted col-start-2 text-sm">
              muji@brisbane: ~
            </p>
            {/* On phones there is no room above the window, so it sits still here. */}
            <span
              data-cat-static
              className="col-start-3 justify-self-end sm:hidden"
            >
              <CatImage width={26} height={28} />
            </span>
          </header>
          {children}
        </div>
        {/* On wider screens the cat walks along the window's top edge here. */}
        <aside
          id="cat-layer"
          aria-label="Cat"
          className="pointer-events-none absolute inset-0 hidden sm:block"
        />
      </div>
    </div>
  );
}
