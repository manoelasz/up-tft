import { describe, expect, it } from "vitest";
import { itemName, patchFromVersion, rarityToCost, traitName, unitName } from "@/lib/server/names";

describe("fallback names from Riot ids", () => {
  it.each([
    ["DA_18_Varus", "Varus"],
    ["DA_KogMaw18_AD", "Kog Maw (AD)"],
    ["DA_18_RekSai", "Rek Sai"],
    ["TFT15_KaiSa", "Kai Sa"],
  ])("unit %s -> %s", (id, name) => expect(unitName(id)).toBe(name));

  it.each([
    ["DA_Riftbeast18", "Riftbeast"],
    ["DA_18_Elderwood", "Elderwood"],
    ["DA_AluneUniqueTrait18", "Alune"],
  ])("trait %s -> %s", (id, name) => expect(traitName(id)).toBe(name));

  it.each([
    ["DA_InfinityEdge", "Infinity Edge"],
    ["DA_Component_RecurveBow", "Recurve Bow"],
    ["DA_18_EmblemInvoker", "Invoker Emblem"],
    ["TFT_Item_GuinsoosRageblade", "Guinsoos Rageblade"],
  ])("item %s -> %s", (id, name) => expect(itemName(id)).toBe(name));

  it("maps rarity to cost", () => {
    expect([0, 1, 2, 4, 6].map(rarityToCost)).toEqual([1, 2, 3, 4, 5]);
  });

  it("reads the patch, or null when the client hides it", () => {
    expect(patchFromVersion("Version 16.21.100.1 <Releases/16.21>")).toBe("16.21");
    expect(patchFromVersion("TFT Unreal Version ?.?.?.?")).toBeNull();
  });
});
