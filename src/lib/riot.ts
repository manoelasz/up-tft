import type { RiotMatch } from "./types";

// Development keys allow 20 req/s and 100 req/2min; production keys raise both.
const LIMITS = [
  { max: Number(process.env.RIOT_RATE_PER_SEC ?? 20), windowMs: 1_000 },
  { max: Number(process.env.RIOT_RATE_PER_2MIN ?? 100), windowMs: 120_000 },
];

const sent: number[] = [];

async function acquire(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (sent.length && now - sent[0] > LIMITS[1].windowMs) sent.shift();
    const waits = LIMITS.map(({ max, windowMs }) => {
      const inWindow = sent.filter((t) => now - t < windowMs);
      return inWindow.length < max ? 0 : windowMs - (now - inWindow[inWindow.length - max]) + 5;
    });
    const wait = Math.max(...waits);
    if (wait === 0) {
      sent.push(now);
      return;
    }
    await new Promise((r) => setTimeout(r, wait));
  }
}

export class RiotError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function riotGet<T>(host: string, path: string, attempt = 0): Promise<T> {
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new RiotError(401, "RIOT_API_KEY não configurada");
  await acquire();
  const res = await fetch(`https://${host}.api.riotgames.com${path}`, {
    headers: { "X-Riot-Token": key },
    cache: "no-store",
  });
  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? 5);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return riotGet(host, path, attempt + 1);
  }
  if (!res.ok) throw new RiotError(res.status, `Riot API ${res.status} em ${path}`);
  return res.json() as Promise<T>;
}

export type LeagueTier = "challenger" | "grandmaster" | "master";

interface LeagueList {
  entries: { puuid: string; leaguePoints: number }[];
}

export async function getLeaguePuuids(platform: string, tier: LeagueTier, limit: number): Promise<string[]> {
  const list = await riotGet<LeagueList>(platform, `/tft/league/v1/${tier}?queue=RANKED_TFT`);
  return list.entries
    .filter((e) => e.puuid)
    .sort((a, b) => b.leaguePoints - a.leaguePoints)
    .slice(0, limit)
    .map((e) => e.puuid);
}

export function getMatchIds(region: string, puuid: string, count: number): Promise<string[]> {
  return riotGet<string[]>(region, `/tft/match/v1/matches/by-puuid/${puuid}/ids?start=0&count=${count}`);
}

// Matches never change once played, so the meta collector and player lookups share this cache.
const MATCH_CACHE_MAX = 3000;
const matchCache = new Map<string, RiotMatch>();

export async function getMatch(region: string, matchId: string): Promise<RiotMatch> {
  const hit = matchCache.get(matchId);
  if (hit) return hit;
  const match = await riotGet<RiotMatch>(region, `/tft/match/v1/matches/${matchId}`);
  matchCache.set(matchId, match);
  if (matchCache.size > MATCH_CACHE_MAX) matchCache.delete(matchCache.keys().next().value!);
  return match;
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export function getAccountByRiotId(cluster: string, name: string, tag: string): Promise<RiotAccount> {
  return riotGet<RiotAccount>(
    cluster,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
  );
}

export interface RiotLeagueEntry {
  queueType: string;
  tier?: string;
  rank?: string;
  leaguePoints?: number;
  wins: number;
  losses: number;
}

export function getLeagueEntries(platform: string, puuid: string): Promise<RiotLeagueEntry[]> {
  return riotGet<RiotLeagueEntry[]>(platform, `/tft/league/v1/by-puuid/${puuid}`);
}

export function getSummoner(platform: string, puuid: string): Promise<{ profileIconId: number; summonerLevel: number }> {
  return riotGet(platform, `/tft/summoner/v1/summoners/by-puuid/${puuid}`);
}

/** Runs `fn` over `items` with at most `limit` in flight; failures are dropped. */
export async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const item = items[next++];
      try {
        out.push(await fn(item));
      } catch (err) {
        console.warn("[riot]", (err as Error).message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
