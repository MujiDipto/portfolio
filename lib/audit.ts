// A real `npm audit` of the site's production dependencies, run once when the
// site is built (app/page.tsx), so `npm audit` in the terminal never shows a
// made-up result. Server only: it runs npm.
import { execFileSync } from "node:child_process";

export type Audit = {
  /** Production packages scanned, direct and transitive. */
  packages: number;
  /** Known vulnerabilities by severity; only severities with any. */
  found: { severity: string; count: number }[];
};

const severities = ["critical", "high", "moderate", "low", "info"];

/** Reads `npm audit --json` output; null if it is not an audit report. */
export function summarise(json: string): Audit | null {
  try {
    const { metadata } = JSON.parse(json);
    const packages = metadata?.dependencies?.prod;
    if (typeof packages !== "number") return null;
    const counts = metadata.vulnerabilities ?? {};
    return {
      packages,
      found: severities
        .map((severity) => ({ severity, count: Number(counts[severity] ?? 0) }))
        .filter((s) => s.count > 0),
    };
  } catch {
    return null;
  }
}

/** Runs the audit; null when npm or the registry cannot be reached. */
export function runAudit(): Audit | null {
  let json: string;
  try {
    json = execFileSync("npm", ["audit", "--omit=dev", "--json"], {
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (error) {
    // npm exits non-zero when it finds vulnerabilities; the report is still
    // on stdout.
    json = String((error as { stdout?: unknown }).stdout ?? "");
  }
  return summarise(json);
}
