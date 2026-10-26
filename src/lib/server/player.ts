import "server-only";
import { accountCluster, type Platform } from "../regions";
import type { PlayerComp, PlayerMatch, PlayerProfile, PlayerRank } from "../types";
import { compIdentity, fullItems, makeLookup, type Lookup } from "./comps";
import { config } from "./config";
import { peekMetaSnapshot } from "./meta";
import { getAccountByRiotId, getLeagueEntries, getMatch, getMatchIds, getSummoner } from "./riot/api";
import { mapPool } from "./riot/client";
import type { RiotLeagueEntry, RiotMatch, RiotParticipant, RiotUnit } from "./riot/types";
import { getStaticData } from "./staticData";

// Builds the /api/player profile: account, rank, recent matches and the comps the player uses.

const CACHE_MS = 2 * 60_000;
const CACHE_MAX = 500;
const TOP_COMPS = 5;
const APEX_TIERS = ["MASTER", "GRANDMASTER", "CHALLENGER"]; // no divisions from Master up

const QUEUES: Record<number, string> = {
  1090: "Normal",
  1100: "Ranqueada",
  1130: "Hyper Roll",
  1160: "Double Up",
};

type Board = { match: RiotMatch; me: RiotParticipant };

const cache = new Map<string, { at: number; profile: PlayerProfile }>();

function profileIconUrl(id: number) {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${id}.jpg`;
}

function placementStats(places: number[]) {
  const n = Math.max(1, places.length);
  return {
    games: places.length,
    avgPlacement: places.reduce((s, x) => s + x, 0) / n,
    top4Rate: places.filter((x) => x <= 4).length / n,
    winRate: places.filter((x) => x === 1).length / n,
  };
}

function toRanks(entries: RiotLeagueEntry[]): PlayerRank[] {
  return entries
    .filter((e) => e.tier)
    .map((e) => ({
      queue: e.queueType,
      tier: e.tier!,
      division: APEX_TIERS.includes(e.tier!) ? "" : (e.rank ?? ""),
      lp: e.leaguePoints ?? 0,
      wins: e.wins,
      losses: e.losses,
    }))
    .sort((a, b) => (a.queue === "RANKED_TFT" ? -1 : b.queue === "RANKED_TFT" ? 1 : 0));
}

function toMatch({ match, me }: Board, lookup: Lookup): PlayerMatch {
  const identity = compIdentity(me);
  return {
    id: match.metadata.match_id,
    time: match.info.game_datetime,
    queue: QUEUES[match.info.queue_id] ?? "Outro modo",
    placement: me.placement,
    level: me.level,
    compName: identity ? lookup.compName(identity.trait, identity.carry) : "—",
    traits: me.traits
      .filter((t) => t.style > 0 && t.num_units > 0)
      .sort((a, b) => b.style - a.style || b.num_units - a.num_units)
      .map((t) => ({ id: t.name, ...lookup.trait(t.name), units: t.num_units, style: t.style })),
    units: [...me.units]
      .sort((a, b) => a.rarity - b.rarity)
      .map((u) => {
        const { name, cost, icon } = lookup.unit(u.character_id, u.rarity);
        return {
          id: u.character_id,
          name,
          cost,
          icon,
          stars: u.tier,
          items: fullItems(u).map((it) => ({ id: it, ...lookup.item(it) })),
        };
      }),
  };
}

function topComps(boards: Board[], lookup: Lookup): PlayerComp[] {
  const metaTop = new Set(peekMetaSnapshot()?.topComps.map((c) => c.id) ?? []);
  const groups = new Map<string, { trait: string; carry: RiotUnit; places: number[] }>();
  for (const { me } of boards) {
    const identity = compIdentity(me);
    if (!identity) continue;
    const group = groups.get(identity.id) ?? { trait: identity.trait, carry: identity.carry, places: [] };
    group.places.push(me.placement);
    groups.set(identity.id, group);
  }
  return [...groups.entries()]
    .map(([id, g]) => {
      const carry = lookup.unit(g.carry.character_id, g.carry.rarity);
      return {
        id,
        name: lookup.compName(g.trait, g.carry),
        carry: { id: g.carry.character_id, name: carry.name, cost: carry.cost, icon: carry.icon },
        ...placementStats(g.places),
        inMetaTop: metaTop.has(id),
      };
    })
    .sort((a, b) => b.games - a.games || a.avgPlacement - b.avgPlacement)
    .slice(0, TOP_COMPS);
}

export async function getPlayerProfile(platform: Platform, name: string, tag: string): Promise<PlayerProfile> {
  const key = `${platform.id}:${name.toLowerCase()}#${tag.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.profile;

  const account = await getAccountByRiotId(accountCluster(platform), name, tag);
  const [entries, summoner, ids, sd] = await Promise.all([
    getLeagueEntries(platform.id, account.puuid),
    getSummoner(platform.id, account.puuid),
    getMatchIds(platform.cluster, account.puuid, config.player.matches),
    getStaticData(),
  ]);
  const matches = await mapPool(ids, 5, (id) => getMatch(platform.cluster, id));

  const lookup = makeLookup(sd);
  const boards = matches
    .sort((a, b) => b.info.game_datetime - a.info.game_datetime)
    .map((match) => ({ match, me: match.info.participants.find((x) => x.puuid === account.puuid) }))
    .filter((b): b is Board => Boolean(b.me));
  const places = boards.map((b) => b.me.placement);

  const profile: PlayerProfile = {
    gameName: account.gameName,
    tagLine: account.tagLine,
    platform: platform.label,
    level: summoner.summonerLevel,
    iconUrl: profileIconUrl(summoner.profileIconId),
    ranks: toRanks(entries),
    summary: { ...placementStats(places), recent: places },
    comps: topComps(boards, lookup),
    matches: boards.map((b) => toMatch(b, lookup)),
    updatedAt: Date.now(),
  };

  cache.set(key, { at: Date.now(), profile });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return profile;
}
