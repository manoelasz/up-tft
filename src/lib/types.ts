// Shapes served by the API routes and rendered by the UI.

export interface UnitRef {
  id: string;
  name: string;
  cost: number;
  icon?: string;
}

export interface ItemRef {
  id: string;
  name: string;
  icon?: string;
  components?: ItemRef[]; // recipe, when the item is built from components
}

export interface FreqEntry extends ItemRef {
  freq: number;
}

export interface MatchTrait extends ItemRef {
  units: number; // unit count (typical count for a comp)
  style: number; // 1 bronze, 2 silver, 3 gold, 4 prismatic
}

export type Tier = "S" | "A" | "B" | "C";

// ---- /api/meta ----

export interface CompUnit extends UnitRef {
  freq: number; // share of the comp's boards that include this unit
  range: number; // attack range in hexes, drives the suggested board position
  stars: number; // most common star level
  items: FreqEntry[]; // items this unit usually holds in this comp
}

export interface CompTrait extends MatchTrait {
  freq: number;
}

export interface CompStat {
  id: string;
  name: string;
  carry: UnitRef;
  coreUnits: CompUnit[];
  traits: CompTrait[];
  games: number;
  playRate: number;
  avgPlacement: number;
  top4Rate: number;
  winRate: number;
  avgLevel: number;
  tier: Tier;
}

export interface UnitStat extends UnitRef {
  games: number;
  playRate: number;
  avgPlacement: number;
  top4Rate: number;
  topItems: FreqEntry[];
}

export interface MetaSnapshot {
  source: "riot" | "demo";
  notice?: string;
  region: string;
  league: string;
  patch: string;
  updatedAt: number;
  nextUpdateAt: number;
  matchesAnalyzed: number;
  boardsAnalyzed: number;
  playersTracked: number;
  topComps: CompStat[];
  units: UnitStat[];
}

// ---- /api/player ----

export interface MatchUnit extends UnitRef {
  stars: number;
  items: ItemRef[];
}

export interface PlayerMatch {
  id: string;
  time: number;
  queue: string;
  placement: number;
  level: number;
  compName: string;
  traits: MatchTrait[];
  units: MatchUnit[];
}

export interface PlayerComp {
  id: string;
  name: string;
  carry: UnitRef;
  games: number;
  avgPlacement: number;
  top4Rate: number;
  winRate: number;
  inMetaTop: boolean; // currently one of the site's top 3
}

export interface PlayerRank {
  queue: string;
  tier: string; // CHALLENGER, DIAMOND...
  division: string; // I-IV, empty from Master up
  lp: number;
  wins: number;
  losses: number;
}

export interface PlayerProfile {
  gameName: string;
  tagLine: string;
  platform: string;
  level: number;
  iconUrl: string;
  ranks: PlayerRank[];
  summary: { games: number; avgPlacement: number; top4Rate: number; winRate: number; recent: number[] };
  comps: PlayerComp[];
  matches: PlayerMatch[];
  updatedAt: number;
}

/** Error body returned by the API routes. */
export interface ApiError {
  error: string;
}
