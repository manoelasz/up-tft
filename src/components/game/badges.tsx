import type { Tier } from "@/lib/types";

const TIER_STYLE: Record<Tier, string> = {
  S: "bg-[#9333ea] text-white",
  A: "bg-[#4f46e5] text-white",
  B: "bg-[#3b3452] text-ink",
  C: "bg-[#2a2540] text-ink-2",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-sm font-bold ${TIER_STYLE[tier]}`} title={`Tier ${tier}`}>
      {tier}
    </span>
  );
}

/** 1st gold, 2nd-4th purple (top 4), 5th-8th neutral; the number is always shown, not just the color. */
function placementClass(p: number) {
  if (p === 1) return "bg-[#f5c542] text-[#1a1405]";
  if (p <= 4) return "bg-accent-strong text-white";
  return "bg-surface-2 text-ink-2";
}

export function PlacementBadge({ placement, size = "md" }: { placement: number; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-8 w-8 text-sm" : "h-12 w-12 text-lg";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg font-bold tabular ${dims} ${placementClass(placement)}`}>
      {placement}º
    </span>
  );
}
