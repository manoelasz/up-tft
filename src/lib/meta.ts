import { aggregate, latestPatchMatches } from "./aggregate";
import { demoMatches } from "./demo";
import { getLeaguePuuids, getMatch, getMatchIds, mapPool, RiotError, type LeagueTier } from "./riot";
import { getStaticData } from "./staticData";
import type { MetaSnapshot, RiotMatch } from "./types";

const PLATFORM = process.env.RIOT_PLATFORM ?? "br1";
const REGION = process.env.RIOT_REGION ?? "americas";
const LEAGUE = (process.env.RIOT_LEAGUE ?? "challenger") as LeagueTier;
const PLAYERS = Number(process.env.RIOT_PLAYERS ?? 20);
const MATCHES_PER_PLAYER = Number(process.env.RIOT_MATCHES_PER_PLAYER ?? 5);
const MAX_NEW_MATCHES = Number(process.env.RIOT_MAX_NEW_MATCHES ?? 60);
const MAX_STORED_MATCHES = 1500;
const RANKED_QUEUE = 1100;

const LIVE_REFRESH_MS = Number(process.env.REFRESH_SECONDS ?? 300) * 1000;
const DEMO_REFRESH_MS = 60_000;

// Module-level cache: survives between requests on a long-running server.
// On serverless hosts swap this for a KV/DB plus a cron that calls refresh().
const store = new Map<string, RiotMatch>();
let snapshot: MetaSnapshot | null = null;
let inflight: Promise<MetaSnapshot> | null = null;

const hasKey = () => Boolean(process.env.RIOT_API_KEY);

async function buildSnapshot(
  matches: RiotMatch[] | "demo",
  source: MetaSnapshot["source"],
  refreshMs: number,
  players: number,
  notice?: string,
): Promise<MetaSnapshot> {
  const sd = await getStaticData();
  const { patch, matches: current } = latestPatchMatches(matches === "demo" ? demoMatches(sd) : matches);
  const agg = aggregate(current, sd);
  const now = Date.now();
  return {
    source,
    notice,
    region: PLATFORM.toUpperCase(),
    league: LEAGUE,
    patch,
    updatedAt: now,
    nextUpdateAt: now + refreshMs,
    matchesAnalyzed: current.length,
    boardsAnalyzed: agg.boards,
    playersTracked: players,
    topComps: agg.topComps,
    units: agg.units,
  };
}

async function refreshLive(): Promise<MetaSnapshot> {
  const puuids = await getLeaguePuuids(PLATFORM, LEAGUE, PLAYERS);
  const idLists = await mapPool(puuids, 5, (p) => getMatchIds(REGION, p, MATCHES_PER_PLAYER));
  const fresh = [...new Set(idLists.flat())].filter((id) => !store.has(id)).slice(0, MAX_NEW_MATCHES);
  const matches = await mapPool(fresh, 5, (id) => getMatch(REGION, id));
  for (const m of matches) if (m.info.queue_id === RANKED_QUEUE) store.set(m.metadata.match_id, m);

  if (store.size > MAX_STORED_MATCHES) {
    const oldest = [...store.values()].sort((a, b) => a.info.game_datetime - b.info.game_datetime);
    for (const m of oldest.slice(0, store.size - MAX_STORED_MATCHES)) store.delete(m.metadata.match_id);
  }
  return buildSnapshot([...store.values()], "riot", LIVE_REFRESH_MS, puuids.length);
}

async function refresh(): Promise<MetaSnapshot> {
  if (!hasKey()) {
    return buildSnapshot("demo", "demo", DEMO_REFRESH_MS, 0,
      "Modo demonstração: configure RIOT_API_KEY no .env.local para ver dados reais da Riot.");
  }
  try {
    return await refreshLive();
  } catch (err) {
    console.error("[meta] live refresh failed:", err);
    if (snapshot?.source === "riot") return { ...snapshot, nextUpdateAt: Date.now() + 60_000 };
    const reason =
      err instanceof RiotError && (err.status === 401 || err.status === 403)
        ? "A chave da Riot é inválida ou expirou (chaves de desenvolvimento duram 24h)"
        : `Falha ao consultar a Riot API (${(err as Error).message})`;
    return buildSnapshot("demo", "demo", 60_000, 0, `${reason}. Exibindo dados de demonstração.`);
  }
}

/** The last snapshot built, without triggering a refresh. */
export function peekMetaSnapshot(): MetaSnapshot | null {
  return snapshot;
}

/** Stale-while-revalidate: serve the cached snapshot and refresh it in the background once expired. */
export async function getMetaSnapshot(): Promise<MetaSnapshot> {
  const stale = !snapshot || Date.now() >= snapshot.nextUpdateAt;
  if (stale && !inflight) {
    inflight = refresh()
      .then((s) => (snapshot = s))
      .finally(() => (inflight = null));
  }
  if (snapshot) return snapshot;
  return inflight!;
}
