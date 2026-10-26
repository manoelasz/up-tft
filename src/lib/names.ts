// Riot ids vary by set: "TFT15_KaiSa", "TFT_Item_InfinityEdge", and in set 18
// "DA_18_Varus", "DA_KogMaw18_AD", "DA_Riftbeast18", "DA_18_EmblemInvoker".
// Without a static-data lookup we derive readable names from the id itself.

function splitCamel(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strips set/namespace prefixes and the trailing set number; returns the bare name and any variant tag. */
function baseName(id: string): { name: string; variant?: string } {
  let s = id
    .replace(/^(TFT\d*|DA|Set\d+)_/i, "")
    .replace(/^Item_/i, "")
    .replace(/^\d+_/, "");
  const variant = s.match(/_(AD|AP)$/)?.[1];
  if (variant) s = s.slice(0, -variant.length - 1);
  s = s.replace(/\d+$/, "");
  return { name: s, variant };
}

export function unitName(id: string): string {
  const { name, variant } = baseName(id);
  return variant ? `${splitCamel(name)} (${variant})` : splitCamel(name);
}

export function traitName(id: string): string {
  return splitCamel(baseName(id).name.replace(/UniqueTrait$/, ""));
}

export function itemName(id: string): string {
  const name = baseName(id)
    .name.replace(/^(Component|Artifact|Radiant|Ornn)_/, "")
    .replace(/^Emblem(\w+)$/, "$1Emblem")
    .replace(/^(\w+)EmblemItem$/, "$1Emblem");
  return splitCamel(name);
}

const RARITY_TO_COST: Record<number, number> = { 0: 1, 1: 2, 2: 3, 4: 4, 6: 5 };

export function rarityToCost(rarity: number): number {
  return RARITY_TO_COST[rarity] ?? Math.min(5, rarity + 1);
}

/** "Version 15.20.712.1234 ... <Releases/15.20>" -> "15.20"; null when the client doesn't report one. */
export function patchFromVersion(gameVersion: string): string | null {
  const m = gameVersion.match(/<Releases\/(\d+\.\d+)>/) ?? gameVersion.match(/(\d+\.\d+)\.\d/);
  return m ? m[1] : null;
}
