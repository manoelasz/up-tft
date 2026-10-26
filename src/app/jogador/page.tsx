"use client";

import Link from "next/link";
import { PlayerSearch, profileHref, useRecentSearches } from "@/components/player";
import { PageHeader } from "@/components/ui";
import { findPlatform } from "@/lib/regions";

export default function PlayerSearchPage() {
  const recent = useRecentSearches();

  return (
    <>
      <PageHeader
        title="Buscar jogador"
        subtitle="Veja o elo, as últimas partidas e as comps que qualquer jogador mais usa."
        live={false}
      />
      <div className="max-w-2xl">
        <PlayerSearch autoFocus />
        <p className="mt-3 text-xs text-muted">
          Digite o Riot ID com a tag, como aparece no cliente: <span className="text-ink-2">Nome#TAG</span>.
        </p>

        {recent.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">Buscas recentes</h2>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <Link
                  key={`${r.platform}-${r.name}-${r.tag}`}
                  href={profileHref(r)}
                  className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-accent/40 hover:text-ink"
                >
                  {r.name}
                  <span className="text-muted">#{r.tag}</span>
                  <span className="ml-2 text-[10px] text-muted">{findPlatform(r.platform)?.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
