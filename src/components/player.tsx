"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { PLATFORMS, parseRiotId, riotIdSlug } from "@/lib/regions";
import type { PlayerComp, PlayerMatch, PlayerRank } from "@/lib/types";
import { ChampionIcon, TraitChip } from "./game";
import { pct, place } from "./ui";

// ---- Recent searches (per-viewer convenience, so browser storage is fine) ----

export interface RecentSearch {
  platform: string;
  name: string;
  tag: string;
}

const RECENT_KEY = "uptft:recent";
const RECENT_EVENT = "uptft:recent";

function readRecentRaw(): string {
  try {
    return localStorage.getItem(RECENT_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function useRecentSearches(): RecentSearch[] {
  const raw = useSyncExternalStore(
    (cb) => {
      window.addEventListener(RECENT_EVENT, cb);
      return () => window.removeEventListener(RECENT_EVENT, cb);
    },
    readRecentRaw,
    () => "[]",
  );
  try {
    return JSON.parse(raw) as RecentSearch[];
  } catch {
    return [];
  }
}

export function saveRecentSearch(s: RecentSearch) {
  try {
    const same = (r: RecentSearch) =>
      r.platform === s.platform && r.name.toLowerCase() === s.name.toLowerCase() && r.tag.toLowerCase() === s.tag.toLowerCase();
    const list = (JSON.parse(readRecentRaw()) as RecentSearch[]).filter((r) => !same(r));
    localStorage.setItem(RECENT_KEY, JSON.stringify([s, ...list].slice(0, 6)));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    // Storage unavailable (private mode, blocked): recent searches just don't persist.
  }
}

export function profileHref(s: RecentSearch) {
  return `/jogador/${s.platform}/${riotIdSlug(s.name, s.tag)}`;
}

// ---- Search box ----

export function PlayerSearch({ initial, autoFocus = false }: { initial?: RecentSearch; autoFocus?: boolean }) {
  const router = useRouter();
  const [platform, setPlatform] = useState(initial?.platform ?? "br1");
  const [value, setValue] = useState(initial ? `${initial.name}#${initial.tag}` : "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseRiotId(value);
    if (!id) {
      setError("Use o formato Nome#TAG, por exemplo: Jogador#BR1");
      return;
    }
    setError(null);
    router.push(profileHref({ platform, ...id }));
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-2 rounded-xl border border-line bg-surface p-1.5 focus-within:border-accent/50">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          aria-label="Servidor"
          className="rounded-lg bg-surface-2 px-2 text-sm text-ink focus:outline-none"
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nome#TAG"
          aria-label="Riot ID"
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-ink placeholder:text-muted focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-accent-strong px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent">
          Buscar
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-[#f08a8a]">{error}</p>}
    </form>
  );
}

// ---- Rank ----

const TIER_PT: Record<string, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-Mestre",
  CHALLENGER: "Desafiante",
};

const QUEUE_PT: Record<string, string> = {
  RANKED_TFT: "Ranqueada",
  RANKED_TFT_DOUBLE_UP: "Double Up",
  RANKED_TFT_TURBO: "Hyper Roll",
};

export function RankBlock({ rank }: { rank: PlayerRank }) {
  const games = rank.wins + rank.losses;
  return (
    <div className="flex items-center gap-3">
      <Image
        src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${rank.tier.toLowerCase()}.svg`}
        alt=""
        width={44}
        height={44}
        unoptimized
      />
      <div>
        <div className="text-[11px] text-muted">{QUEUE_PT[rank.queue] ?? rank.queue}</div>
        <div className="font-semibold text-ink">
          {TIER_PT[rank.tier] ?? rank.tier} {rank.division} <span className="text-accent">{rank.lp} PDL</span>
        </div>
        <div className="text-xs text-muted">{games} partidas na temporada</div>
      </div>
    </div>
  );
}

// ---- Placements ----

export function placementClass(p: number) {
  if (p === 1) return "bg-[#f5c542] text-[#1a1405]";
  if (p <= 4) return "bg-accent-strong text-white";
  return "bg-surface-2 text-ink-2";
}

export function PlacementBadge({ placement, size = "md" }: { placement: number; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-7 w-7 text-xs" : "h-12 w-12 text-lg";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg font-bold tabular ${dims} ${placementClass(placement)}`}>
      {placement}º
    </span>
  );
}

// ---- Comps and match history ----

export function PlayerCompRow({ comp }: { comp: PlayerComp }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <ChampionIcon unit={comp.carry} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{comp.name}</span>
          {comp.inMetaTop && (
            <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">Top 3 do meta</span>
          )}
        </div>
        <div className="text-xs text-muted">{comp.games} {comp.games === 1 ? "partida" : "partidas"}</div>
      </div>
      <div className="tabular grid grid-cols-3 gap-4 text-right text-xs">
        <div><div className="text-muted">Pos.</div><div className="font-semibold text-ink">{place(comp.avgPlacement)}</div></div>
        <div><div className="text-muted">Top 4</div><div className="font-semibold text-ink">{pct(comp.top4Rate, 0)}</div></div>
        <div><div className="text-muted">Vitória</div><div className="font-semibold text-ink">{pct(comp.winRate, 0)}</div></div>
      </div>
    </div>
  );
}

function timeAgo(t: number, now: number) {
  const m = Math.max(1, Math.round((now - t) / 60_000));
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

export function MatchRow({ match, now }: { match: PlayerMatch; now: number }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
        <PlacementBadge placement={match.placement} />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{match.compName}</div>
          <div className="text-xs text-muted">
            {match.queue} · {timeAgo(match.time, now)} · nv. {match.level}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {match.traits.slice(0, 6).map((t) => <TraitChip key={t.id} trait={t} compact />)}
        </div>
        <div className="flex flex-wrap gap-x-0.5 gap-y-1">
          {match.units.map((u, i) => (
            <ChampionIcon key={`${u.id}-${i}`} unit={u} size={40} stars={u.stars} items={u.items} />
          ))}
        </div>
      </div>
    </div>
  );
}
