import type { Evaluation } from "./useStockfish";
import type { Dict } from "./i18n";

export type MoveClass = "best" | "good" | "inaccuracy" | "mistake" | "blunder";

const CAP = 1000;

function clampedWp(ev: Evaluation | null | undefined): number {
  if (!ev) return 0;
  if (ev.type === "mate") return ev.whitePerspective > 0 ? CAP : -CAP;
  return Math.max(-CAP, Math.min(CAP, ev.whitePerspective));
}

export function classifyPlayerMove(
  before: Evaluation | null | undefined,
  after: Evaluation | null | undefined,
  playerSide: "white" | "black"
): MoveClass {
  const b = clampedWp(before);
  const a = clampedWp(after);
  const lossWhite = b - a;
  const loss = playerSide === "white" ? lossWhite : -lossWhite;
  if (loss <= 15) return "best";
  if (loss <= 50) return "good";
  if (loss <= 120) return "inaccuracy";
  if (loss <= 280) return "mistake";
  return "blunder";
}

export function classLabel(d: Dict, c: MoveClass): string {
  switch (c) {
    case "best": return d.classBest;
    case "good": return d.classGood;
    case "inaccuracy": return d.classInaccuracy;
    case "mistake": return d.classMistake;
    case "blunder": return d.classBlunder;
  }
}

export const CLASS_TONE: Record<MoveClass, string> = {
  best: "bg-emerald-700 text-emerald-50",
  good: "bg-emerald-900/70 text-emerald-200",
  inaccuracy: "bg-amber-900/70 text-amber-200",
  mistake: "bg-orange-900/70 text-orange-200",
  blunder: "bg-rose-900/70 text-rose-200",
};

export const CLASS_TONE_INLINE: Record<MoveClass, string> = {
  best: "text-emerald-300",
  good: "text-emerald-400",
  inaccuracy: "text-amber-300",
  mistake: "text-orange-300",
  blunder: "text-rose-300",
};
