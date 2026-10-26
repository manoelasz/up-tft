"use client";

import Image from "next/image";
import { BOARD_COLS, BOARD_ROWS, suggestBoard } from "@/lib/board";
import type { CompUnit, ItemRef, MatchTrait, UnitRef } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function ItemIcon({ item, size = 18 }: { item: ItemRef; size?: number }) {
  if (!item.icon) return null;
  return (
    <Image
      src={item.icon}
      alt={item.name}
      title={item.name}
      width={size}
      height={size}
      className="rounded-[3px] ring-1 ring-black/60"
    />
  );
}

function Stars({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span className={`text-[10px] leading-none tracking-[-1px] ${count >= 3 ? "text-[#f5c542]" : "text-[#c9d1d9]"}`} aria-label={`${count} estrelas`}>
      {"★".repeat(count)}
    </span>
  );
}

/** Square champion portrait with the in-game cost border. */
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
  return (
    <div className="flex flex-col items-center gap-1" style={{ width: showName ? Math.max(size + 12, 64) : size + 4 }}>
      <div className="h-3">{stars ? <Stars count={stars} /> : null}</div>
      <div
        className="relative overflow-hidden rounded-lg bg-surface-2"
        style={{ width: size, height: size, border: `2px solid var(--cost-${unit.cost})` }}
        title={`${unit.name} · custo ${unit.cost}`}
      >
        {unit.icon ? (
          <Image src={unit.icon} alt={unit.name} fill sizes={`${size}px`} className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-sm font-semibold text-ink">{initials(unit.name)}</span>
        )}
      </div>
      {items && (
        <div className="-mt-2.5 flex gap-px" style={{ minHeight: Math.round(size * 0.34) }}>
          {items.map((it, i) => <ItemIcon key={`${it.id}-${i}`} item={it} size={Math.round(size * 0.34)} />)}
        </div>
      )}
      {showName && <span className="w-full truncate text-center text-[11px] text-ink-2">{unit.name}</span>}
    </div>
  );
}

const STYLE_BG: Record<number, string> = { 1: "var(--style-1)", 2: "var(--style-2)", 3: "var(--style-3)", 4: "var(--style-4)" };

export function TraitChip({ trait, compact = false }: { trait: MatchTrait; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 py-0.5 pl-0.5 text-xs text-ink-2 ${compact ? "pr-1.5" : "pr-2"}`}
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

/** Hex board (front row on top) with the suggested positions for the comp's units. */
export function Board({ units, carryId }: { units: CompUnit[]; carryId: string }) {
  const placed = suggestBoard(units, carryId);
  const at = (row: number, col: number) => placed.find((p) => p.row === row && p.col === col);

  return (
    <div className="flex justify-center overflow-x-auto py-2" style={{ ["--hex" as string]: "min(64px, calc((100vw - 104px) / 7.6))" }}>
      <div className="flex flex-col">
        {Array.from({ length: BOARD_ROWS }, (_, row) => (
          <div
            key={row}
            className="flex gap-1"
            style={{
              marginLeft: row % 2 ? "calc(var(--hex) / 2 + 2px)" : 0,
              marginTop: row ? "calc(var(--hex) * -0.24)" : 0,
            }}
          >
            {Array.from({ length: BOARD_COLS }, (_, col) => {
              const p = at(row, col);
              return (
                <div key={col} className="relative" style={{ width: "var(--hex)", height: "calc(var(--hex) * 1.1547)" }}>
                  <div
                    className="hex absolute inset-0"
                    style={{ background: p ? `var(--cost-${p.unit.cost})` : "var(--surface-2)" }}
                  >
                    {p && (
                      <div className="hex absolute inset-[3px] overflow-hidden bg-surface" title={p.unit.name}>
                        {p.unit.icon ? (
                          <Image src={p.unit.icon} alt={p.unit.name} fill sizes="64px" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs font-semibold">{initials(p.unit.name)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {p && p.unit.stars >= 2 && (
                    <div className="absolute inset-x-0 top-[6%] flex justify-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                      <Stars count={p.unit.stars} />
                    </div>
                  )}
                  {p && p.unit.items.length > 0 && (
                    <div className="absolute inset-x-0 bottom-[8%] flex justify-center gap-px">
                      {p.unit.items.map((it, i) => <ItemIcon key={`${it.id}-${i}`} item={it} size={14} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
