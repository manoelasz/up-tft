import "server-only";
import { config } from "./config";

// Static game data (localized names, icons, ranges, trait breakpoints) from CommunityDragon,
// which mirrors the live client files. The Riot match API only returns raw ids.

const CDRAGON = "https://raw.communitydragon.org/latest";
const TTL_MS = 12 * 3_600_000;
const RETRY_MS = 5 * 60_000;

export interface StaticChampion {
  id: string;
  name: string;
  cost: number;
  icon: string;
  range: number;
  traits: string[]; // trait ids
  set: number;
}

export interface StaticTrait {
  id: string;
  name: string;
  icon: string;
  breakpoints: { min: number; style: number }[]; // style in match-API terms (1 bronze .. 4 prismatic)
}

export interface StaticItem {
  id: string;
  name: string;
  icon: string;
  composition: string[]; // component item ids, empty for components and special items
}

export interface StaticData {
  latestSet: number;
  champions: Map<string, StaticChampion>;
  traits: Map<string, StaticTrait>;
  items: Map<string, StaticItem>;
}

interface RawChampion {
  apiName: string;
  name: string;
  cost: number;
  squareIcon?: string;
  tileIcon?: string;
  traits: string[];
  stats?: { range?: number };
}

interface RawTrait {
  apiName: string;
  name: string;
  icon: string;
  effects: { minUnits: number; style: number }[];
}

interface RawData {
  items: { apiName: string; name: string; icon: string; composition?: string[] | null }[];
  sets: Record<string, { champions: RawChampion[]; traits: RawTrait[] }>;
}

export function assetUrl(path: string | undefined): string {
  if (!path) return "";
  return `${CDRAGON}/game/${path.toLowerCase().replace(/\.(tex|dds)$/, ".png")}`;
}

// CommunityDragon trait styles: 1 bronze, 3 silver, 4 unique, 5 gold, 6 prismatic.
const STYLE_TO_MATCH: Record<number, number> = { 1: 1, 3: 2, 4: 3, 5: 3, 6: 4 };

function parse(raw: RawData): StaticData {
  const champions = new Map<string, StaticChampion>();
  const traits = new Map<string, StaticTrait>();
  const items = new Map<string, StaticItem>();
  let latestSet = 0;

  for (const [key, set] of Object.entries(raw.sets)) {
    const setNumber = Number(key);
    if (set.champions.length) latestSet = Math.max(latestSet, setNumber);
    const traitIdByName = new Map<string, string>();
    for (const t of set.traits) {
      traitIdByName.set(t.name, t.apiName);
      traits.set(t.apiName, {
        id: t.apiName,
        name: t.name,
        icon: assetUrl(t.icon),
        breakpoints: t.effects.map((e) => ({ min: e.minUnits, style: STYLE_TO_MATCH[e.style] ?? 1 })),
      });
    }
    for (const c of set.champions) {
      champions.set(c.apiName, {
        id: c.apiName,
        name: c.name,
        cost: c.cost,
        icon: assetUrl(c.squareIcon ?? c.tileIcon),
        range: c.stats?.range ?? 1,
        traits: c.traits.map((n) => traitIdByName.get(n)).filter((id): id is string => Boolean(id)),
        set: setNumber,
      });
    }
  }
  for (const it of raw.items) {
    items.set(it.apiName, { id: it.apiName, name: it.name, icon: assetUrl(it.icon), composition: it.composition ?? [] });
  }

  return { latestSet, champions, traits, items };
}

let cached: StaticData | null = null;
let expiresAt = 0;
let inflight: Promise<StaticData | null> | null = null;

async function load(): Promise<StaticData | null> {
  try {
    // ~25 MB: too big for the fetch cache, so it is parsed once and kept in memory.
    const res = await fetch(`${CDRAGON}/cdragon/tft/${config.staticData.locale}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`CommunityDragon HTTP ${res.status}`);
    cached = parse((await res.json()) as RawData);
    expiresAt = Date.now() + TTL_MS;
  } catch (err) {
    console.error("[static] load failed:", (err as Error).message);
    expiresAt = Date.now() + RETRY_MS;
  }
  return cached;
}

export async function getStaticData(): Promise<StaticData | null> {
  if (cached && Date.now() < expiresAt) return cached;
  if (!inflight) inflight = load().finally(() => (inflight = null));
  // Serve stale data while reloading; only the very first call waits.
  return cached ?? inflight;
}
