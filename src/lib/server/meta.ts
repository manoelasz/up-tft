import "server-only";
import type { MetaSnapshot } from "../types";
import { aggregate, latestPatchMatches } from "./aggregate";
import { config, hasRiotKey } from "./config";
import { demoMatches } from "./demo";
import { getLeaguePuuids, getMatch, getMatchIds } from "./riot/api";
import { mapPool, RiotError } from "./riot/client";
import { RANKED_QUEUE, type RiotMatch } from "./riot/types";
import { getStaticData } from "./staticData";

// The /api/meta snapshot: collects high-elo ranked matches incrementally and re-ranks comps.
//
// Module-level cache: survives between requests on a long-running server.
// On serverless hosts swap this for a KV/DB plus a cron that calls refresh().

const MAX_STORED_MATCHES = 1500;
const DEMO_REFRESH_MS = 60_000;
const RETRY_MS = 60_000;

const { platform, cluster, league } = config.meta;

const store = new Map<string, RiotMatch>();
let snapshot: MetaSnapshot | null = null;
let inflight: Promise<MetaSnapshot> | null = null;

async function buildSnapshot(
  matches: RiotMatch[] | "demo",
  refreshMs: number,
  players: number,
  notice?: string,
): Promise<MetaSnapshot> {
  const sd = await getStaticData();
  const source = matches === "demo" ? "demo" : "riot";
  const { patch, matches: current } = latestPatchMatches(matches === "demo" ? demoMatches(sd) : matches);
  const agg = aggregate(current, sd);
  const now = Date.now();
  return {
    source,
    notice,
    region: platform.label,
    league,
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

/** Fetches only matches not seen before and keeps the newest MAX_STORED_MATCHES. */
async function collectNewMatches(): Promise<number> {
  const puuids = await getLeaguePuuids(platform.id, league, config.meta.players);
  const idLists = await mapPool(puuids, 5, (p) => getMatchIds(cluster, p, config.meta.matchesPerPlayer));
  const fresh = [...new Set(idLists.flat())].filter((id) => !store.has(id)).slice(0, config.meta.maxNewMatches);
  const matches = await mapPool(fresh, 5, (id) => getMatch(cluster, id));
  for (const m of matches) if (m.info.queue_id === RANKED_QUEUE) store.set(m.metadata.match_id, m);

  if (store.size > MAX_STORED_MATCHES) {
    const oldest = [...store.values()].sort((a, b) => a.info.game_datetime - b.info.game_datetime);
    for (const m of oldest.slice(0, store.size - MAX_STORED_MATCHES)) store.delete(m.metadata.match_id);
  }
  return puuids.length;
}

async function refresh(): Promise<MetaSnapshot> {
  if (!hasRiotKey()) {
    return buildSnapshot("demo", DEMO_REFRESH_MS, 0, "Modo demonstração: RIOT_API_KEY não configurada.");
  }
  try {
    const players = await collectNewMatches();
    return buildSnapshot([...store.values()], config.meta.refreshMs, players);
  } catch (err) {
    console.error("[meta] live refresh failed:", err);
    if (snapshot?.source === "riot") return { ...snapshot, nextUpdateAt: Date.now() + RETRY_MS };
    const reason =
      err instanceof RiotError && (err.status === 401 || err.status === 403)
        ? "A chave da Riot é inválida ou expirou (chaves de desenvolvimento duram 24h)"
        : `Falha ao consultar a Riot API (${(err as Error).message})`;
    return buildSnapshot("demo", RETRY_MS, 0, `${reason}. Exibindo dados de demonstração.`);
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
  return snapshot ?? inflight!;
}
