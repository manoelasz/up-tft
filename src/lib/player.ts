import { compIdentity, fullItems, makeLookup, type Lookup } from "./aggregate";
import { peekMetaSnapshot } from "./meta";
import { accountCluster, type Platform } from "./regions";
import { getAccountByRiotId, getLeagueEntries, getMatch, getMatchIds, getSummoner, mapPool } from "./riot";
import { getStaticData } from "./staticData";
import type { PlayerComp, PlayerMatch, PlayerProfile, PlayerRank, RiotMatch, RiotParticipant } from "./types";

const MATCH_COUNT = Number(process.env.PLAYER_MATCHES ?? 15);
const CACHE_MS = 2 * 60_000;
const CACHE_MAX = 500;

const QUEUES: Record<number, string> = {
  1090: "Normal",
  1100: "Ranqueada",
  1130: "Hyper Roll",
  1160: "Double Up",
};

const cache = new Map<string, { at: number; profile: PlayerProfile }>();

function profileIcon(id: number) {
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${id}.jpg`;
}

function toMatch(m: RiotMatch, p: RiotParticipant, lookup: Lookup): PlayerMatch {
  const identity = compIdentity(p);
  return {
    id: m.metadata.match_id,
    time: m.info.game_datetime,
    queue: QUEUES[m.info.queue_id] ?? "Outro modo",
    placement: p.placement,
    level: p.level,
    compName: identity
      ? `${lookup.unit(identity.carry.character_id, identity.carry.rarity).name} ${lookup.trait(identity.trait).name}`
      : "—",
    traits: p.traits
      .filter((t) => t.style > 0 && t.num_units > 0)
      .sort((a, b) => b.style - a.style || b.num_units - a.num_units)
      .map((t) => ({ id: t.name, ...lookup.trait(t.name), units: t.num_units, style: t.style })),
    units: [...p.units]
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

function summarizeComps(boards: { m: RiotMatch; p: RiotParticipant }[], lookup: Lookup): PlayerComp[] {
  const metaTop = new Set(peekMetaSnapshot()?.topComps.map((c) => c.id) ?? []);
  const groups = new Map<string, { trait: string; carry: RiotParticipant["units"][number]; places: number[] }>();
  for (const { p } of boards) {
    const identity = compIdentity(p);
    if (!identity) continue;
    const g = groups.get(identity.id) ?? { trait: identity.trait, carry: identity.carry, places: [] };
    g.places.push(p.placement);
    groups.set(identity.id, g);
  }
  return [...groups.entries()]
    .map(([id, g]) => {
      const carry = lookup.unit(g.carry.character_id, g.carry.rarity);
      const n = g.places.length;
      return {
        id,
        name: `${carry.name} ${lookup.trait(g.trait).name}`,
        carry: { id: g.carry.character_id, name: carry.name, cost: carry.cost, icon: carry.icon },
        games: n,
        avgPlacement: g.places.reduce((s, x) => s + x, 0) / n,
        top4Rate: g.places.filter((x) => x <= 4).length / n,
        winRate: g.places.filter((x) => x === 1).length / n,
        inMetaTop: metaTop.has(id),
      };
    })
    .sort((a, b) => b.games - a.games || a.avgPlacement - b.avgPlacement)
    .slice(0, 5);
}

export async function getPlayerProfile(platform: Platform, name: string, tag: string): Promise<PlayerProfile> {
  const key = `${platform.id}:${name.toLowerCase()}#${tag.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.profile;

  const account = await getAccountByRiotId(accountCluster(platform), name, tag);
  const [entries, summoner, ids, sd] = await Promise.all([
    getLeagueEntries(platform.id, account.puuid),
    getSummoner(platform.id, account.puuid),
    getMatchIds(platform.cluster, account.puuid, MATCH_COUNT),
    getStaticData(),
  ]);
  const matches = (await mapPool(ids, 5, (id) => getMatch(platform.cluster, id))).sort(
    (a, b) => b.info.game_datetime - a.info.game_datetime,
  );

  const lookup = makeLookup(sd);
  const boards = matches
    .map((m) => ({ m, p: m.info.participants.find((x) => x.puuid === account.puuid) }))
    .filter((b): b is { m: RiotMatch; p: RiotParticipant } => Boolean(b.p));
  const places = boards.map((b) => b.p.placement);
  const n = Math.max(1, places.length);

  const ranks: PlayerRank[] = entries
    .filter((e) => e.tier)
    .map((e) => ({
      queue: e.queueType,
      tier: e.tier!,
      division: ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(e.tier!) ? "" : (e.rank ?? ""),
      lp: e.leaguePoints ?? 0,
      wins: e.wins,
      losses: e.losses,
    }))
    .sort((a, b) => (a.queue === "RANKED_TFT" ? -1 : b.queue === "RANKED_TFT" ? 1 : 0));

  const profile: PlayerProfile = {
    gameName: account.gameName,
    tagLine: account.tagLine,
    platform: platform.label,
    level: summoner.summonerLevel,
    iconUrl: profileIcon(summoner.profileIconId),
    ranks,
    summary: {
      games: places.length,
      avgPlacement: places.reduce((s, x) => s + x, 0) / n,
      top4Rate: places.filter((x) => x <= 4).length / n,
      winRate: places.filter((x) => x === 1).length / n,
      recent: places,
    },
    comps: summarizeComps(boards, lookup),
    matches: boards.map(({ m, p }) => toMatch(m, p, lookup)),
    updatedAt: Date.now(),
  };

  cache.set(key, { at: Date.now(), profile });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return profile;
}
