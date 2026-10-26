"use client";

import { BOARD_COLS, BOARD_ROWS, suggestBoard } from "@/lib/board";
import type { CompUnit } from "@/lib/types";
import { ChampionArt, Stars } from "./ChampionIcon";
import { ItemRow } from "./ItemIcon";

// Pointy-top hexes: height = width * 2/√3; rows overlap by a quarter and odd rows shift half a hex.
const HEX_HEIGHT = "calc(var(--hex) * 1.1547)";
const ROW_OVERLAP = "calc(var(--hex) * -0.24)";
const ODD_ROW_SHIFT = "calc(var(--hex) / 2 + 2px)";

/** Hex board (front row on top) with the suggested positions for the comp's units. */
export function Board({ units, carryId }: { units: CompUnit[]; carryId: string }) {
  const placed = suggestBoard(units, carryId);
  const at = (row: number, col: number) => placed.find((p) => p.row === row && p.col === col)?.unit;

  return (
    <div className="flex justify-center overflow-x-auto py-2" style={{ ["--hex" as string]: "min(64px, calc((100vw - 104px) / 7.6))" }}>
      <div className="flex flex-col">
        {Array.from({ length: BOARD_ROWS }, (_, row) => (
          <div key={row} className="flex gap-1" style={{ marginLeft: row % 2 ? ODD_ROW_SHIFT : 0, marginTop: row ? ROW_OVERLAP : 0 }}>
            {Array.from({ length: BOARD_COLS }, (_, col) => {
              const unit = at(row, col);
              return (
                <div key={col} className="relative" style={{ width: "var(--hex)", height: HEX_HEIGHT }}>
                  <div className="hex absolute inset-0" style={{ background: unit ? `var(--cost-${unit.cost})` : "var(--surface-2)" }}>
                    {unit && (
                      <div className="hex absolute inset-[3px] overflow-hidden bg-surface" title={unit.name}>
                        <ChampionArt unit={unit} sizes="64px" />
                      </div>
                    )}
                  </div>
                  {unit && unit.stars >= 2 && (
                    <div className="absolute inset-x-0 top-[5%] flex justify-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                      <Stars count={unit.stars} />
                    </div>
                  )}
                  {unit && unit.items.length > 0 && <ItemRow items={unit.items} size={15} className="absolute inset-x-0 bottom-[8%] z-10" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
