"use client";

import { useState } from "react";
import { Board } from "@/components/game/Board";
import { ChampionIcon } from "@/components/game/ChampionIcon";
import { TierBadge } from "@/components/game/badges";
import { TraitChip } from "@/components/game/TraitChip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stat } from "@/components/ui/Stat";
import { decimal1, pct, place, plural } from "@/lib/format";
import type { CompStat } from "@/lib/types";

const VIEWS = [
  ["units", "Campeões"],
  ["board", "Tabuleiro"],
] as const;
type View = (typeof VIEWS)[number][0];

/** One ranked comp: headline stats, traits, and its units as a list or on the board. */
export function CompCard({ comp, rank }: { comp: CompStat; rank: number }) {
  const [view, setView] = useState<View>("units");

  return (
    <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="tabular text-4xl font-bold text-accent/70">{rank + 1}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="truncate text-xl font-semibold text-ink">{comp.name}</h2>
              <TierBadge tier={comp.tier} />
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {plural(comp.games, "partida")} · nível médio {decimal1(comp.avgLevel)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-x-6">
          <Stat label="Vitória" value={pct(comp.winRate, 0)} size="lg" highlight />
          <Stat label="Top 4" value={pct(comp.top4Rate, 0)} size="lg" />
          <Stat label="Pos. média" value={place(comp.avgPlacement)} size="lg" />
          <Stat label="Jogada em" value={pct(comp.playRate, 1)} size="lg" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {comp.traits.map((t) => (
          <TraitChip key={t.id} trait={t} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <SegmentedControl options={VIEWS} value={view} onChange={setView} />
        {view === "board" && <span className="text-xs text-muted">Posicionamento sugerido</span>}
      </div>

      <div className="mt-4">
        {view === "units" ? (
          <div className="flex flex-wrap gap-x-1 gap-y-3">
            {comp.coreUnits.map((u) => (
              <ChampionIcon key={u.id} unit={u} size={60} stars={u.stars} items={u.items} showName />
            ))}
          </div>
        ) : (
          <Board units={comp.coreUnits} carryId={comp.carry.id} />
        )}
      </div>
    </article>
  );
}
