import type { StaticChampion, StaticData } from "./staticData";
import type { RiotMatch, RiotParticipant, RiotTrait, RiotUnit } from "./types";

// Synthetic matches in the Riot payload shape, built from the current set's real
// champions so demo mode shows real portraits and runs the same aggregation as
// live data. Each match is seeded by its time slot: history is stable, new slots
// roll in every few minutes and comp strength drifts over time.

const SLOT_MS = 4 * 60_000;
const WINDOW_SLOTS = 180; // ~12h of matches
const ARCHETYPES = 8;

const COST_TO_RARITY: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 4, 5: 6 };
const ITEM_POOLS = {
  ad: ["InfinityEdge", "GuinsoosRageblade", "LastWhisper", "GiantSlayer", "Deathblade", "KrakensFury", "RedBuff"],
  ap: ["JeweledGauntlet", "SpearOfShojin", "RabadonsDeathcap", "BlueBuff", "HextechGunblade", "Morellonomicon"],
  melee: ["Bloodthirster", "TitansResolve", "SteraksGage", "HandOfJustice", "EdgeOfNight", "InfinityEdge"],
  tank: ["WarmogsArmor", "GargoyleStoneplate", "DragonsClaw", "BrambleVest", "SunfireCape", "Crownguard"],
};

interface Archetype {
  carry: StaticChampion;
  tank: StaticChampion;
  units: StaticChampion[]; // carry and tank included
  carryItems: string[];
  tankItems: string[];
  strength: number;
  popularity: number;
  phase: number;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function buildArchetypes(sd: StaticData): Archetype[] {
  const champs = [...sd.champions.values()].filter((c) => c.set === sd.latestSet && c.cost >= 1 && c.cost <= 5 && c.traits.length);
  const itemId = (n: string) => [`DA_${n}`, `TFT_Item_${n}`].find((id) => sd.items.has(id)) ?? `TFT_Item_${n}`;

  const byTrait = new Map<string, StaticChampion[]>();
  for (const c of champs) for (const t of c.traits) byTrait.set(t, [...(byTrait.get(t) ?? []), c]);

  const traits = [...byTrait.entries()]
    .filter(([id, members]) => members.length >= 4 && (sd.traits.get(id)?.breakpoints[0]?.min ?? 1) >= 2)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, ARCHETYPES);

  return traits.map(([traitId, members], i) => {
    const sorted = [...members].sort((a, b) => b.cost - a.cost || a.id.localeCompare(b.id));
    const carry = sorted.find((c) => c.range >= 4) ?? sorted[0];
    const core = sorted.slice(0, 6);
    if (!core.includes(carry)) core[core.length - 1] = carry;
    // Fill to 8 with champions that share a trait with the core, pricier first.
    const coreTraits = new Set(core.flatMap((c) => c.traits));
    const fillers = champs
      .filter((c) => !core.includes(c) && c.traits.some((t) => t !== traitId && coreTraits.has(t)))
      .sort((a, b) => b.cost - a.cost || a.id.localeCompare(b.id));
    const units = [...core, ...fillers].slice(0, 8);
    const tank = units.filter((c) => c !== carry && c.range <= 1).sort((a, b) => b.cost - a.cost)[0] ?? units.find((c) => c !== carry)!;
    const pool = carry.range <= 1 ? ITEM_POOLS.melee : i % 2 ? ITEM_POOLS.ap : ITEM_POOLS.ad;
    return {
      carry,
      tank,
      units,
      carryItems: [0, 1, 2].map((k) => itemId(pool[(i + k * 2) % pool.length])),
      tankItems: [0, 1].map((k) => itemId(ITEM_POOLS.tank[(i + k * 3) % ITEM_POOLS.tank.length])),
      strength: 0.55 - i * 0.08,
      popularity: 1.3 - (i % 4) * 0.15,
      phase: i * 1.7,
    };
  });
}

function boardTraits(units: StaticChampion[], sd: StaticData): RiotTrait[] {
  const counts = new Map<string, number>();
  for (const u of units) for (const t of u.traits) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].map(([id, n]) => {
    const bps = sd.traits.get(id)?.breakpoints ?? [];
    const reached = bps.filter((b) => n >= b.min);
    return {
      name: id,
      num_units: n,
      style: reached.length ? reached[reached.length - 1].style : 0,
      tier_current: reached.length,
      tier_total: bps.length,
    };
  });
}

function buildBoard(a: Archetype, r: () => number, sd: StaticData, puuid: string): Omit<RiotParticipant, "placement"> {
  const level = r() < 0.55 ? 8 : r() < 0.7 ? 9 : 7;
  const kept = a.units.filter((c) => c === a.carry || c === a.tank || r() < 0.88).slice(0, level);
  const units: RiotUnit[] = kept.map((c) => {
    const items = c === a.carry ? a.carryItems.map((it) => (r() < 0.85 ? it : a.carryItems[0])) : c === a.tank ? a.tankItems.filter(() => r() < 0.8) : [];
    return {
      character_id: c.id,
      rarity: COST_TO_RARITY[c.cost] ?? 0,
      tier: c === a.carry && c.cost <= 3 && r() < 0.5 ? 3 : 2,
      itemNames: items,
    };
  });
  return { puuid, level, units, traits: boardTraits(kept, sd) };
}

function strengthAt(a: Archetype, t: number) {
  return a.strength + 0.35 * Math.sin(t / (5 * 3_600_000) + a.phase);
}

function pick(archetypes: Archetype[], r: () => number): Archetype {
  const total = archetypes.reduce((s, a) => s + a.popularity, 0);
  let x = r() * total;
  for (const a of archetypes) {
    x -= a.popularity;
    if (x <= 0) return a;
  }
  return archetypes[0];
}

function matchForSlot(slot: number, archetypes: Archetype[], sd: StaticData): RiotMatch {
  const r = rng(Math.imul(slot, 2654435761));
  const t = slot * SLOT_MS + Math.floor(r() * SLOT_MS);
  const lobby = Array.from({ length: 8 }, (_, i) => {
    const a = pick(archetypes, r);
    const power = strengthAt(a, t) + (r() + r() + r() - 1.5) * 0.9;
    return { board: buildBoard(a, r, sd, `demo-${slot}-${i}`), power };
  });
  lobby.sort((x, y) => y.power - x.power);
  const participants = lobby.map((p, i) => ({ ...p.board, placement: i + 1 }));
  return {
    metadata: { match_id: `DEMO_${slot}`, participants: participants.map((p) => p.puuid) },
    info: {
      game_datetime: t,
      game_version: "Demo Version ?.?.?.?",
      queue_id: 1100,
      tft_set_number: sd.latestSet,
      participants,
    },
  };
}

export function demoMatches(sd: StaticData | null, now = Date.now()): RiotMatch[] {
  if (!sd) return [];
  const archetypes = buildArchetypes(sd);
  if (!archetypes.length) return [];
  const last = Math.floor(now / SLOT_MS) - 1;
  return Array.from({ length: WINDOW_SLOTS }, (_, i) => matchForSlot(last - i, archetypes, sd));
}
