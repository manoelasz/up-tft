import { itemName, patchFromVersion, rarityToCost, traitName, unitName } from "./names";
import type { StaticData } from "./staticData";
import type { CompStat, CompTrait, CompUnit, FreqEntry, RiotMatch, RiotParticipant, RiotUnit, Tier, UnitStat } from "./types";

const TOP_N = 3;
// Ranked by win rate; a comp needs this many games so one lucky win can't top the list.
const MIN_GAMES = Number(process.env.MIN_COMP_GAMES ?? 5);

interface UnitInComp {
  count: number;
  rarity: number;
  starSum: number;
  items: Map<string, number>;
}

interface CompAcc {
  id: string;
  primaryTrait: string;
  carry: RiotUnit;
  games: number;
  placementSum: number;
  levelSum: number;
  top4: number;
  wins: number;
  units: Map<string, UnitInComp>;
  traits: Map<string, { count: number; unitSum: number; styleSum: number }>;
}

interface UnitAcc {
  rarity: number;
  games: number;
  placementSum: number;
  top4: number;
  items: Map<string, number>;
}

/** Resolves ids to display data, preferring CommunityDragon and falling back to the id itself. */
export function makeLookup(sd: StaticData | null) {
  return {
    unit(id: string, rarity: number) {
      const c = sd?.champions.get(id);
      return { name: c?.name ?? unitName(id), cost: c?.cost ?? rarityToCost(rarity), icon: c?.icon, range: c?.range ?? 1 };
    },
    trait(id: string) {
      const t = sd?.traits.get(id);
      return { name: t?.name ?? traitName(id), icon: t?.icon };
    },
    item(id: string) {
      const it = sd?.items.get(id);
      return { name: it?.name ?? itemName(id), icon: it?.icon };
    },
  };
}
export type Lookup = ReturnType<typeof makeLookup>;

function bump<K>(map: Map<K, number>, key: K, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function topItems(map: Map<string, number>, total: number, n: number, lookup: Lookup, minFreq = 0): FreqEntry[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({ id, freq: count / total, ...lookup.item(id) }))
    .filter((e) => e.freq >= minFreq);
}

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

/** A board's comp: its primary trait plus its carry. Same id across meta and player views. */
export function compIdentity(p: RiotParticipant): { id: string; trait: string; carry: RiotUnit } | null {
  const carry = carryUnit(p);
  if (!carry) return null;
  const trait = primaryTrait(p);
  return { id: `${trait}--${carry.character_id}`, trait, carry };
}

/** 12.5% is the 1-in-8 baseline win rate. */
function tierFor(winRate: number): Tier {
  if (winRate >= 0.25) return "S";
  if (winRate >= 0.18) return "A";
  if (winRate >= 0.125) return "B";
  return "C";
}

/** Keep only the newest patch, unless it is too thin to say anything yet. */
export function latestPatchMatches(matches: RiotMatch[], minMatches = 30): { patch: string; matches: RiotMatch[] } {
  if (matches.length === 0) return { patch: "—", matches };
  const newest = [...matches].sort((a, b) => b.info.game_datetime - a.info.game_datetime)[0];
  const set = newest.info.tft_set_number;
  const onSet = matches.filter((m) => m.info.tft_set_number === set);
  const patch = patchFromVersion(newest.info.game_version);
  // Some clients report "Version ?.?.?.?"; then the set is the finest grouping available.
  if (!patch) return { patch: `Set ${set}`, matches: onSet };
  const onPatch = onSet.filter((m) => patchFromVersion(m.info.game_version) === patch);
  return { patch, matches: onPatch.length >= minMatches ? onPatch : onSet };
}

function finishComp(c: CompAcc, boards: number, lookup: Lookup): CompStat {
  const winRate = c.wins / c.games;
  const carry = lookup.unit(c.carry.character_id, c.carry.rarity);

  const coreUnits: CompUnit[] = [...c.units.entries()]
    .map(([id, u]) => ({
      id,
      ...lookup.unit(id, u.rarity),
      freq: u.count / c.games,
      stars: Math.round(u.starSum / u.count),
      items: topItems(u.items, u.count, 3, lookup, 0.25),
    }))
    .filter((u) => u.freq >= 0.5)
    .sort((a, b) => b.freq - a.freq || a.cost - b.cost)
    .slice(0, 10)
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

  const traits: CompTrait[] = [...c.traits.entries()]
    .map(([id, t]) => ({
      id,
      ...lookup.trait(id),
      freq: t.count / c.games,
      units: Math.round(t.unitSum / t.count),
      style: Math.round(t.styleSum / t.count),
    }))
    .filter((t) => t.freq >= 0.5)
    .sort((a, b) => b.style - a.style || b.units - a.units)
    .slice(0, 8);

  return {
    id: c.id,
    name: `${carry.name} ${lookup.trait(c.primaryTrait).name}`,
    carry: { id: c.carry.character_id, name: carry.name, cost: carry.cost, icon: carry.icon },
    coreUnits,
    traits,
    games: c.games,
    playRate: c.games / boards,
    avgPlacement: c.placementSum / c.games,
    top4Rate: c.top4 / c.games,
    winRate,
    avgLevel: c.levelSum / c.games,
    tier: tierFor(winRate),
  };
}

export function aggregate(matches: RiotMatch[], sd: StaticData | null) {
  const lookup = makeLookup(sd);
  const comps = new Map<string, CompAcc>();
  const units = new Map<string, UnitAcc>();
  let boards = 0;

  for (const match of matches) {
    for (const p of match.info.participants) {
      boards += 1;
      const top4 = p.placement <= 4 ? 1 : 0;
      const identity = compIdentity(p);
      if (!identity) continue;
      const { id, trait, carry } = identity;
      let comp = comps.get(id);
      if (!comp) {
        comp = {
          id,
          primaryTrait: trait,
          carry,
          games: 0,
          placementSum: 0,
          levelSum: 0,
          top4: 0,
          wins: 0,
          units: new Map(),
          traits: new Map(),
        };
        comps.set(id, comp);
      }
      comp.games += 1;
      comp.placementSum += p.placement;
      comp.levelSum += p.level;
      comp.top4 += top4;
      comp.wins += p.placement === 1 ? 1 : 0;
      for (const tr of p.traits) {
        if (tr.style === 0) continue;
        const acc = comp.traits.get(tr.name) ?? { count: 0, unitSum: 0, styleSum: 0 };
        acc.count += 1;
        acc.unitSum += tr.num_units;
        acc.styleSum += tr.style;
        comp.traits.set(tr.name, acc);
      }

      const seen = new Set<string>();
      for (const u of p.units) {
        const items = fullItems(u);
        const cu = comp.units.get(u.character_id) ?? { count: 0, rarity: u.rarity, starSum: 0, items: new Map() };
        const ua = units.get(u.character_id) ?? { rarity: u.rarity, games: 0, placementSum: 0, top4: 0, items: new Map() };
        if (!seen.has(u.character_id)) {
          seen.add(u.character_id);
          cu.count += 1;
          cu.starSum += u.tier;
          ua.games += 1;
          ua.placementSum += p.placement;
          ua.top4 += top4;
        }
        for (const it of items) {
          bump(cu.items, it);
          bump(ua.items, it);
        }
        comp.units.set(u.character_id, cu);
        units.set(u.character_id, ua);
      }
    }
  }

  const ranked = [...comps.values()]
    .filter((c) => c.games >= MIN_GAMES)
    .map((c) => finishComp(c, boards, lookup))
    .sort((a, b) => b.winRate - a.winRate || b.top4Rate - a.top4Rate || a.avgPlacement - b.avgPlacement);

  const unitStats: UnitStat[] = [...units.entries()]
    .filter(([, u]) => u.games >= 5)
    .map(([id, u]) => {
      const { name, cost, icon } = lookup.unit(id, u.rarity);
      return {
        id,
        name,
        cost,
        icon,
        games: u.games,
        playRate: u.games / Math.max(1, boards),
        avgPlacement: u.placementSum / u.games,
        top4Rate: u.top4 / u.games,
        topItems: topItems(u.items, u.games, 3, lookup),
      };
    })
    .sort((a, b) => a.avgPlacement - b.avgPlacement);

  return {
    boards,
    topComps: ranked.slice(0, TOP_N),
    units: unitStats.slice(0, 60),
  };
}
