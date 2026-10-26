import type { CompUnit } from "./types";

// The Riot match API does not report hex positions, so boards are a suggested
// layout: melee units up front (pricier ones in the middle), ranged units in the
// back row with the carry tucked into a corner. Row 0 faces the enemy.

export const BOARD_ROWS = 4;
export const BOARD_COLS = 7;

type Hex = [row: number, col: number];

const FRONT: Hex[] = [[0, 3], [0, 2], [0, 4], [0, 1], [0, 5], [0, 0], [0, 6], [1, 3], [1, 2], [1, 4], [1, 1], [1, 5]];
const MID: Hex[] = [[2, 3], [2, 2], [2, 4], [1, 3], [1, 2], [1, 4]];
const BACK: Hex[] = [[3, 0], [3, 6], [3, 1], [3, 5], [3, 2], [3, 4], [3, 3], [2, 1], [2, 5], [2, 0], [2, 6]];

export interface PlacedUnit {
  unit: CompUnit;
  row: number;
  col: number;
}

export function suggestBoard(units: CompUnit[], carryId: string): PlacedUnit[] {
  const taken = new Set<string>();
  const placed: PlacedUnit[] = [];

  const place = (unit: CompUnit, ...prefs: Hex[][]) => {
    for (const [row, col] of prefs.flat()) {
      const key = `${row},${col}`;
      if (taken.has(key)) continue;
      taken.add(key);
      placed.push({ unit, row, col });
      return;
    }
  };

  const byCost = [...units].sort((a, b) => b.cost - a.cost || b.items.length - a.items.length);
  const carry = units.find((u) => u.id === carryId);
  if (carry && carry.range >= 2) place(carry, BACK);

  for (const u of byCost) {
    if (u === carry && carry.range >= 2) continue;
    if (u.range <= 1) place(u, FRONT, MID, BACK);
    else if (u.range <= 3) place(u, MID, BACK, FRONT);
    else place(u, BACK, MID, FRONT);
  }
  return placed;
}
