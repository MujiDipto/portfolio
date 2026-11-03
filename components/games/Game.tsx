"use client";

import dynamic from "next/dynamic";
import type { RunCommand } from "@/components/terminal/Outputs";
import type { Game as Name } from "@/lib/terminal";

// Each game loads only when someone plays it, so the first screen stays light.
const loading = () => <p className="text-muted">loading…</p>;
const Snake = dynamic(
  () => import("@/components/games/Snake").then((m) => m.Snake),
  { ssr: false, loading },
);
const Triage = dynamic(
  () => import("@/components/games/Triage").then((m) => m.Triage),
  { ssr: false, loading },
);

export function Game({
  name,
  live,
  onRun,
}: {
  name: Name;
  live: boolean;
  onRun?: RunCommand;
}) {
  return name === "snake" ? (
    <Snake live={live} onRun={onRun} />
  ) : (
    <Triage live={live} onRun={onRun} />
  );
}
