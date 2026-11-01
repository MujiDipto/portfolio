import type { ReactNode } from "react";
import { Prompt } from "@/components/Prompt";

/** A page section introduced by a shell command; the heading is for screen readers. */
export function Section({
  id,
  title,
  command,
  children,
}: {
  id: string;
  title: string;
  command: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="mt-16 scroll-mt-16"
    >
      <Prompt command={command} />
      <h2 id={`${id}-heading`} className="sr-only">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export const linkClass =
  "text-accent underline underline-offset-4 hover:no-underline";
