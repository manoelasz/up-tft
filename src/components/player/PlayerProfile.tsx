"use client";

import Image from "next/image";
import { use, useEffect } from "react";
import { PlacementBadge } from "@/components/game/badges";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stat } from "@/components/ui/Stat";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { saveRecentSearch } from "@/hooks/useRecentSearches";
import { pct, place } from "@/lib/format";
import { findPlatform, parseRiotIdSlug } from "@/lib/regions";
import type { PlayerProfile as Profile } from "@/lib/types";
import { MatchRow } from "./MatchRow";
import { PlayerCompRow } from "./PlayerCompRow";
import { PlayerSearch } from "./PlayerSearch";
import { RankBlock } from "./RankBlock";

/** Profile page body: reads the route params, loads the profile and renders it. */
export function PlayerProfileView({ params }: { params: Promise<{ platform: string; riotId: string }> }) {
  const { platform, riotId } = use(params);
  const id = parseRiotIdSlug(riotId);
  const valid = Boolean(id && findPlatform(platform));
  const { data, error, isLoading } = usePlayerProfile(valid ? { platform, ...id! } : null);

  useEffect(() => {
    if (data) saveRecentSearch({ platform, name: data.gameName, tag: data.tagLine });
  }, [data, platform]);

  return (
    <>
      <div className="mb-6 max-w-2xl">
        <PlayerSearch key={platform + riotId} initial={id ? { platform, ...id } : undefined} />
      </div>
      {!valid ? (
        <Message>Endereço inválido. Busque usando o formato Nome#TAG.</Message>
      ) : error ? (
        <Message>{(error as Error).message}</Message>
      ) : isLoading || !data ? (
        <LoadingProfile />
      ) : (
        <ProfileBody profile={data} />
      )}
    </>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <p className="text-base text-ink-2">{children}</p>
    </Card>
  );
}

function LoadingProfile() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-28" />
      <p className="text-center text-sm text-muted">Buscando as últimas partidas na Riot… pode levar alguns segundos.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function ProfileBody({ profile }: { profile: Profile }) {
  const s = profile.summary;
  return (
    <div className="grid gap-4">
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Image src={profile.iconUrl} alt="" width={72} height={72} className="rounded-2xl ring-2 ring-accent/50" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {profile.gameName}
              <span className="font-semibold text-muted">#{profile.tagLine}</span>
            </h1>
            <p className="text-sm text-ink-2">
              Nível {profile.level} · {profile.platform}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          {profile.ranks.length ? (
            profile.ranks.map((r) => <RankBlock key={r.queue} rank={r} />)
          ) : (
            <span className="text-sm text-muted">Sem ranque nesta temporada</span>
          )}
        </div>
      </Card>

      {s.games === 0 ? (
        <Message>Nenhuma partida recente de TFT encontrada.</Message>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle className="mb-4">Últimas {s.games} partidas</SectionTitle>
              <div className="grid grid-cols-4 gap-3">
                <Stat label="Pos. média" value={place(s.avgPlacement)} size="lg" />
                <Stat label="Top 4" value={pct(s.top4Rate, 0)} size="lg" />
                <Stat label="Vitória" value={pct(s.winRate, 0)} size="lg" highlight />
                <Stat label="1º lugares" value={String(s.recent.filter((p) => p === 1).length)} size="lg" />
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Colocações, da mais recente para a mais antiga">
                {s.recent.map((p, i) => (
                  <PlacementBadge key={i} placement={p} size="sm" />
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle className="mb-1">Comps que mais joga</SectionTitle>
              <div className="divide-y divide-line">
                {profile.comps.map((c) => (
                  <PlayerCompRow key={c.id} comp={c} />
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <SectionTitle>Histórico</SectionTitle>
            <div className="divide-y divide-line">
              {profile.matches.map((m) => (
                <MatchRow key={m.id} match={m} now={profile.updatedAt} />
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
