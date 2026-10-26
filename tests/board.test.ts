import { describe, expect, it } from "vitest";
import { BOARD_COLS, BOARD_ROWS, suggestBoard } from "@/lib/board";
import type { CompUnit } from "@/lib/types";

const unit = (id: string, cost: number, range: number): CompUnit => ({
  id,
  name: id,
  cost,
  range,
  freq: 1,
  stars: 2,
  items: [],
});

const units = [
  unit("tank", 4, 1),
  unit("bruiser", 2, 1),
  unit("carry", 5, 4),
  unit("mage", 3, 4),
  unit("mid", 3, 2),
];

describe("suggested board", () => {
  const placed = suggestBoard(units, "carry");
  const at = (id: string) => placed.find((p) => p.unit.id === id)!;

  it("places every unit on its own hex inside the board", () => {
    expect(placed).toHaveLength(units.length);
    const hexes = new Set(placed.map((p) => `${p.row},${p.col}`));
    expect(hexes.size).toBe(units.length);
    for (const p of placed) {
      expect(p.row).toBeGreaterThanOrEqual(0);
      expect(p.row).toBeLessThan(BOARD_ROWS);
      expect(p.col).toBeGreaterThanOrEqual(0);
      expect(p.col).toBeLessThan(BOARD_COLS);
    }
  });

  it("tucks a ranged carry into a back corner", () => {
    expect(at("carry")).toMatchObject({ row: 3, col: 0 });
  });

  it("puts melee units in front and ranged units behind", () => {
    expect(at("tank").row).toBe(0);
    expect(at("bruiser").row).toBe(0);
    expect(at("mage").row).toBe(3);
    expect(at("mid").row).toBe(2);
  });
});
