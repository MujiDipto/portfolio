"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Audit } from "@/lib/audit";

/** The build-time audit, provided by the terminal (app/page.tsx runs it). */
export const AuditContext = createContext<Audit | null>(null);

export const scanMs = 900;
const barCells = 20;

/**
 * `npm audit`: a short scan animation over the site's real production
 * dependencies, then the real result. The bar is decoration; the result text
 * is in the page from the start, so screen readers get it at once. With
 * reduced motion, or when not animating, it shows the result straight away.
 */
export function AuditOutput({ animate }: { animate: boolean }) {
  const audit = useContext(AuditContext);
  // null shows the finished scan. A scan starts at zero, so the result never
  // flashes up before the animation begins.
  const [progress, setProgress] = useState<number | null>(
    animate && audit ? 0 : null,
  );

  useEffect(() => {
    if (!animate || !audit) return;
    let frame: number;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setProgress(null));
      return () => cancelAnimationFrame(frame);
    }
    let start: number | undefined;
    frame = requestAnimationFrame(function tick(now) {
      start ??= now;
      const p = Math.min(1, (now - start) / scanMs);
      setProgress(p < 1 ? p : null);
      if (p < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [animate, audit]);

  if (!audit) {
    return (
      <p className="text-muted">
        npm audit: the registry could not be reached when this site was built.
      </p>
    );
  }

  const done = progress === null;
  const scanned = done ? audit.packages : Math.floor(audit.packages * progress);
  const filled = done ? barCells : Math.floor(barCells * progress);
  const total = audit.found.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="leading-relaxed">
      <p>
        auditing <span className="text-number">{audit.packages}</span>{" "}
        production packages: next, react, react-dom and their dependencies
      </p>
      <p aria-hidden="true" className="whitespace-pre">
        <span className="text-prompt-user">{"█".repeat(filled)}</span>
        <span className="text-muted">{"░".repeat(barCells - filled)}</span>{" "}
        <span className="text-number">{scanned}</span>/{audit.packages}
      </p>
      <div className={done ? undefined : "opacity-0"}>
        <p className="text-fg-strong mt-1 font-semibold">
          found{" "}
          <span className={total ? "text-accent" : "text-prompt-user"}>
            {total}
          </span>{" "}
          {total === 1 ? "vulnerability" : "vulnerabilities"}
          {total > 0 &&
            ` (${audit.found.map((s) => `${s.count} ${s.severity}`).join(", ")})`}
        </p>
      </div>
    </div>
  );
}
