import "server-only";
import { findPlatform } from "../regions";

// Every environment variable the server reads, with its default. See .env.example.

const env = process.env;
const number = (value: string | undefined, fallback: number) => (value ? Number(value) : fallback);

const platform = findPlatform(env.RIOT_PLATFORM ?? "br1") ?? findPlatform("br1")!;

export const config = {
  riot: {
    apiKey: env.RIOT_API_KEY ?? "",
    /** Development keys: 20 req/s and 100 req/2min. Raise both with a production key. */
    ratePerSecond: number(env.RIOT_RATE_PER_SEC, 20),
    ratePer2Min: number(env.RIOT_RATE_PER_2MIN, 100),
  },
  meta: {
    platform,
    cluster: env.RIOT_REGION ?? platform.cluster,
    league: (env.RIOT_LEAGUE ?? "challenger") as "challenger" | "grandmaster" | "master",
    players: number(env.RIOT_PLAYERS, 20),
    matchesPerPlayer: number(env.RIOT_MATCHES_PER_PLAYER, 5),
    maxNewMatches: number(env.RIOT_MAX_NEW_MATCHES, 60),
    refreshMs: number(env.REFRESH_SECONDS, 300) * 1000,
    /** A comp needs this many games to be ranked, so one lucky win can't top the list. */
    minCompGames: number(env.MIN_COMP_GAMES, 5),
  },
  player: {
    matches: number(env.PLAYER_MATCHES, 15),
  },
  staticData: {
    locale: env.CDRAGON_LOCALE ?? "pt_br",
  },
};

export const hasRiotKey = () => Boolean(config.riot.apiKey);
