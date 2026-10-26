"use client";

import Image from "next/image";
import type { ItemRef, UnitRef } from "@/lib/types";
import { ItemRow } from "./ItemIcon";

export function Stars({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span
      className={`text-xs leading-none tracking-[-1px] ${count >= 3 ? "text-[#f5c542]" : "text-[#d5dbe3]"}`}
      aria-label={`${count} estrelas`}
    >
      {"★".repeat(count)}
    </span>
  );
}

/** Portrait image, or the champion's initials when there is no art. Fills its (relative) parent. */
export function ChampionArt({ unit, sizes }: { unit: UnitRef; sizes: string }) {
  if (unit.icon) return <Image src={unit.icon} alt={unit.name} fill sizes={sizes} className="object-cover" />;
  const initials = unit.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return <span className="flex h-full items-center justify-center text-sm font-semibold text-ink">{initials}</span>;
}

/** Square champion portrait with the in-game cost border, optional stars, items and name. */
export function ChampionIcon({
  unit,
  size = 48,
  showName = false,
  stars,
  items,
}: {
  unit: UnitRef;
  size?: number;
  showName?: boolean;
  stars?: number;
  items?: ItemRef[];
}) {
  const itemSize = Math.round(size * 0.36);
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: showName ? Math.max(size + 16, 72) : size + 4 }}>
      {stars !== undefined && (
        <div className="flex h-3.5 items-end">
          <Stars count={stars} />
        </div>
      )}
      <div
        className="relative overflow-hidden rounded-lg bg-surface-2"
        style={{ width: size, height: size, border: `2px solid var(--cost-${unit.cost})` }}
        title={`${unit.name} · custo ${unit.cost}`}
      >
        <ChampionArt unit={unit} sizes={`${size}px`} />
      </div>
      {/* Overlaps the portrait's bottom edge, above it in the stacking order. */}
      {items && <ItemRow items={items} size={itemSize} reserveSpace className="relative z-10 -mt-3" />}
      {showName && <span className="line-clamp-2 w-full text-center text-xs leading-tight text-ink-2">{unit.name}</span>}
    </div>
  );
}
