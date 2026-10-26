import "server-only";
import type { ItemRef } from "../types";
import { itemName, rarityToCost, traitName, unitName } from "./names";
import type { RiotParticipant, RiotUnit } from "./riot/types";
import type { StaticData } from "./staticData";

// What a board "is": how comps are identified, and how raw ids become display data.
// Shared by the meta ranking and the player profile so both name comps the same way.

/** Completed items only: some sets also report loose components ("DA_Component_RecurveBow"). */
export function fullItems(u: RiotUnit): string[] {
  return (u.itemNames ?? []).filter((it) => !/Component_/i.test(it));
}

/** The trait with the most units (ignoring 1-unit uniques) defines the comp's identity. */
function primaryTrait(p: RiotParticipant): string {
  const active = p.traits.filter((t) => t.style > 0 && t.tier_total > 1);
  active.sort((a, b) => b.num_units - a.num_units || b.style - a.style);
  return active[0]?.name ?? "Flex";
}

/** The carry is the unit holding the most items; ties go to the pricier, higher-star unit. */
function carryUnit(p: RiotParticipant): RiotUnit | undefined {
  return [...p.units].sort(
    (a, b) => fullItems(b).length - fullItems(a).length || b.rarity - a.rarity || b.tier - a.tier,
  )[0];
}

/** A board's comp: its primary trait plus its carry. */
export function compIdentity(p: RiotParticipant): { id: string; trait: string; carry: RiotUnit } | null {
  const carry = carryUnit(p);
  if (!carry) return null;
  const trait = primaryTrait(p);
  return { id: `${trait}--${carry.character_id}`, trait, carry };
}

/** Resolves ids to display data, preferring CommunityDragon and falling back to the id itself. */
export function makeLookup(sd: StaticData | null) {
  const item = (id: string): Omit<ItemRef, "id"> => {
    const it = sd?.items.get(id);
    const components = it?.composition.map((cid) => ({ id: cid, ...item(cid), components: undefined }));
    return { name: it?.name ?? itemName(id), icon: it?.icon, components: components?.length ? components : undefined };
  };

  const unit = (id: string, rarity: number) => {
    const c = sd?.champions.get(id);
    return { name: c?.name ?? unitName(id), cost: c?.cost ?? rarityToCost(rarity), icon: c?.icon, range: c?.range ?? 1 };
  };

  const trait = (id: string) => {
    const t = sd?.traits.get(id);
    return { name: t?.name ?? traitName(id), icon: t?.icon };
  };

  /** Display name of a comp: "<carry> <trait>". */
  const compName = (traitId: string, carry: RiotUnit) =>
    `${unit(carry.character_id, carry.rarity).name} ${trait(traitId).name}`;

  return { unit, trait, item, compName };
}

export type Lookup = ReturnType<typeof makeLookup>;
