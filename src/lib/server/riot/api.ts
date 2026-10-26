import "server-only";
import { riotGet } from "./client";
import type { RiotAccount, RiotLeagueEntry, RiotMatch, RiotSummoner } from "./types";

// Typed Riot endpoints. League/summoner calls go to a platform host (br1...),
// match calls to a regional cluster (americas...), account calls to americas/europe/asia.

export function getLeaguePuuids(platform: string, tier: string, limit: number): Promise<string[]> {
  return riotGet<{ entries: { puuid: string; leaguePoints: number }[] }>(
    platform,
    `/tft/league/v1/${tier}?queue=RANKED_TFT`,
  ).then((list) =>
    list.entries
      .filter((e) => e.puuid)
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
      .slice(0, limit)
      .map((e) => e.puuid),
  );
}

export function getMatchIds(cluster: string, puuid: string, count: number): Promise<string[]> {
  return riotGet<string[]>(cluster, `/tft/match/v1/matches/by-puuid/${puuid}/ids?start=0&count=${count}`);
}

// Matches never change once played, so the meta collector and player lookups share this cache.
const MATCH_CACHE_MAX = 3000;
const matchCache = new Map<string, RiotMatch>();

export async function getMatch(cluster: string, matchId: string): Promise<RiotMatch> {
  const hit = matchCache.get(matchId);
  if (hit) return hit;
  const match = await riotGet<RiotMatch>(cluster, `/tft/match/v1/matches/${matchId}`);
  matchCache.set(matchId, match);
  if (matchCache.size > MATCH_CACHE_MAX) matchCache.delete(matchCache.keys().next().value!);
  return match;
}

export function getAccountByRiotId(cluster: string, name: string, tag: string): Promise<RiotAccount> {
  return riotGet<RiotAccount>(
    cluster,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
  );
}

export function getLeagueEntries(platform: string, puuid: string): Promise<RiotLeagueEntry[]> {
  return riotGet<RiotLeagueEntry[]>(platform, `/tft/league/v1/by-puuid/${puuid}`);
}

export function getSummoner(platform: string, puuid: string): Promise<RiotSummoner> {
  return riotGet<RiotSummoner>(platform, `/tft/summoner/v1/summoners/by-puuid/${puuid}`);
}
