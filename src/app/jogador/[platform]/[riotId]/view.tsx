"use client";

import Image from "next/image";
import { use, useEffect } from "react";
import useSWR from "swr";
import { MatchRow, PlacementBadge, PlayerCompRow, PlayerSearch, RankBlock, saveRecentSearch } from "@/components/player";
import { Card, Skeleton, pct, place } from "@/components/ui";
import { findPlatform, parseRiotIdSlug } from "@/lib/regions";
import type { PlayerProfile } from "@/lib/types";

async function fetchProfile(url: string): Promise<PlayerProfile> {
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted">{label}</div>
      <div className="tabular text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

export function PlayerProfileView({ params }: { params: Promise<{ platform: string; riotId: string }> }) {
  const { platform, riotId } = use(params);
  const id = parseRiotIdSlug(riotId);
  const valid = Boolean(id && findPlatform(platform));
  const url = valid
    ? `/api/player?platform=${platform}&name=${encodeURIComponent(id!.name)}&tag=${encodeURIComponent(id!.tag)}`
    : null;
  const { data, error, isLoading } = useSWR(url, fetchProfile, { revalidateOnFocus: false, shouldRetryOnError: false });

  useEffect(() => {
    if (data) saveRecentSearch({ platform, name: data.gameName, tag: data.tagLine });
  }, [data, platform]);

  const initial = id ? { platform, ...id } : undefined;

  return (
    <>
      <div className="mb-6 max-w-2xl">
        <PlayerSearch key={riotId + platform} initial={initial} />
      </div>

      {!valid ? (
        <Card><p className="text-sm text-ink-2">Endereço inválido. Busque usando o formato Nome#TAG.</p></Card>
      ) : error ? (
        <Card><p className="text-sm text-ink-2">{(error as Error).message}</p></Card>
      ) : isLoading || !data ? (
        <div className="grid gap-4">
          <Skeleton className="h-28" />
          <p className="text-center text-xs text-muted">Buscando as últimas partidas na Riot… pode levar alguns segundos.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <Profile data={data} />
      )}
    </>
  );
}

function Profile({ data }: { data: PlayerProfile }) {
  const s = data.summary;
  return (
    <div className="grid gap-4">
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Image src={data.iconUrl} alt="" width={72} height={72} className="rounded-2xl ring-2 ring-accent/50" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {data.gameName}
              <span className="text-muted">#{data.tagLine}</span>
            </h1>
            <p className="text-sm text-muted">Nível {data.level} · {data.platform}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          {data.ranks.length ? (
            data.ranks.map((r) => <RankBlock key={r.queue} rank={r} />)
          ) : (
            <span className="text-sm text-muted">Sem ranque nesta temporada</span>
          )}
        </div>
      </Card>

      {s.games === 0 ? (
        <Card><p className="text-sm text-ink-2">Nenhuma partida recente de TFT encontrada.</p></Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-ink">Últimas {s.games} partidas</h2>
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Pos. média" value={place(s.avgPlacement)} />
                <Stat label="Top 4" value={pct(s.top4Rate, 0)} />
                <Stat label="Vitória" value={pct(s.winRate, 0)} />
                <Stat label="1º lugares" value={String(s.recent.filter((p) => p === 1).length)} />
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Colocações, da mais recente para a mais antiga">
                {s.recent.map((p, i) => <PlacementBadge key={i} placement={p} size="sm" />)}
              </div>
            </Card>
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-ink">Comps que mais joga</h2>
              <div className="divide-y divide-line">
                {data.comps.map((c) => <PlayerCompRow key={c.id} comp={c} />)}
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-sm font-semibold text-ink">Histórico</h2>
            <div className="divide-y divide-line">
              {data.matches.map((m) => <MatchRow key={m.id} match={m} now={data.updatedAt} />)}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
