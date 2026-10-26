import Image from "next/image";
import type { MatchTrait } from "@/lib/types";

const STYLE_BG: Record<number, string> = {
  1: "var(--style-1)", // bronze
  2: "var(--style-2)", // silver
  3: "var(--style-3)", // gold
  4: "var(--style-4)", // prismatic
};

/** Trait badge: hex icon in its tier color, unit count and (unless compact) the name. */
export function TraitChip({ trait, compact = false }: { trait: MatchTrait; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 py-0.5 pl-0.5 text-[13px] text-ink-2 ${compact ? "pr-1.5" : "pr-2.5"}`}
      title={`${trait.units} ${trait.name}`}
    >
      <span className="hex flex h-6 w-[21px] items-center justify-center" style={{ background: STYLE_BG[trait.style] ?? "var(--surface-2)" }}>
        {trait.icon && <Image src={trait.icon} alt="" width={14} height={14} className="brightness-0" />}
      </span>
      <span className="font-semibold text-ink">{trait.units}</span>
      {!compact && trait.name}
    </span>
  );
}
