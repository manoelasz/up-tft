import { describe, expect, it } from "vitest";
import { aggregate, latestPatchMatches } from "@/lib/server/aggregate";
import { compIdentity, fullItems } from "@/lib/server/comps";
import type { RiotMatch } from "@/lib/server/riot/types";
import fixture from "./fixtures/match-set18.json";

const match = fixture as RiotMatch;

// The same lobby five times, so every comp clears the minimum-games filter.
const matches: RiotMatch[] = Array.from({ length: 5 }, (_, i) => ({
  ...match,
  metadata: { ...match.metadata, match_id: `BR1_TEST_${i}` },
  info: { ...match.info, game_datetime: match.info.game_datetime + i * 60_000 },
}));

const winner = match.info.participants.find((p) => p.placement === 1)!;

describe("comp identity", () => {
  it("is the primary trait plus the carry", () => {
    const id = compIdentity(winner)!;
    expect(id.id).toBe(`${id.trait}--${id.carry.character_id}`);
    expect(fullItems(id.carry).length).toBeGreaterThan(0);
  });

  it("ignores loose components when counting items", () => {
    expect(fullItems({ character_id: "x", rarity: 0, tier: 1, itemNames: ["DA_Component_BFSword", "DA_InfinityEdge"] })).toEqual([
      "DA_InfinityEdge",
    ]);
  });
});

describe("latest patch", () => {
  it("falls back to the set when the version is hidden", () => {
    const { patch, matches: kept } = latestPatchMatches(matches);
    expect(patch).toBe(`Set ${match.info.tft_set_number}`);
    expect(kept).toHaveLength(5);
  });
});

describe("aggregate", () => {
  const result = aggregate(matches, null);

  it("counts every board", () => {
    expect(result.boards).toBe(40);
  });

  it("ranks by win rate, so the lobby winner's comp is first", () => {
    expect(result.topComps).toHaveLength(3);
    expect(result.topComps[0].id).toBe(compIdentity(winner)!.id);
    expect(result.topComps[0].winRate).toBe(1);
    expect(result.topComps[0].tier).toBe("S");
    const rates = result.topComps.map((c) => c.winRate);
    expect(rates).toEqual([...rates].sort((a, b) => b - a));
  });

  it("describes comps with core units and active traits", () => {
    const top = result.topComps[0];
    expect(top.games).toBe(5);
    expect(top.coreUnits.length).toBeGreaterThan(0);
    expect(top.coreUnits.every((u) => u.freq === 1)).toBe(true);
    expect(top.traits.every((t) => t.style >= 1)).toBe(true);
  });

  it("sorts unit stats by average placement", () => {
    const avgs = result.units.map((u) => u.avgPlacement);
    expect(avgs).toEqual([...avgs].sort((a, b) => a - b));
  });
});
