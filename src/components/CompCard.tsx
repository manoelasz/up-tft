"use client";

import { useState } from "react";
import type { CompStat } from "@/lib/types";
import { Board, ChampionIcon, TraitChip } from "./game";
import { TierBadge, num, pct, place } from "./ui";

type View = "units" | "board";

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-16">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`tabular font-semibold ${highlight ? "text-xl text-accent" : "text-base text-ink"}`}>{value}</div>
    </div>
  );
}

export function CompCard({ comp, rank }: { comp: CompStat; rank: number }) {
  const [view, setView] = useState<View>("units");

  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="text-3xl font-bold text-accent/70 tabular">{rank + 1}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-ink">{comp.name}</h2>
              <TierBadge tier={comp.tier} />
            </div>
            <p className="text-xs text-muted">
              {num(comp.games)} partidas · nível médio {comp.avgLevel.toFixed(1).replace(".", ",")}
            </p>
          </div>
        </div>
        <div className="flex gap-5">
          <Stat label="Vitória" value={pct(comp.winRate, 0)} highlight />
          <Stat label="Top 4" value={pct(comp.top4Rate, 0)} />
          <Stat label="Pos. média" value={place(comp.avgPlacement)} />
          <Stat label="Jogada em" value={pct(comp.playRate, 1)} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {comp.traits.map((t) => <TraitChip key={t.id} trait={t} />)}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <div role="tablist" className="inline-flex rounded-lg border border-line bg-bg p-0.5 text-xs">
          {([["units", "Campeões"], ["board", "Tabuleiro"]] as const).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={view === key}
              onClick={() => setView(key)}
              className={`rounded-md px-3 py-1.5 transition-colors ${view === key ? "bg-accent-strong text-white" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "board" && <span className="text-[11px] text-muted">Posicionamento sugerido</span>}
      </div>

      <div className="mt-4">
        {view === "units" ? (
          <div className="flex flex-wrap gap-x-2 gap-y-3">
            {comp.coreUnits.map((u) => (
              <ChampionIcon key={u.id} unit={u} size={56} stars={u.stars} items={u.items} showName />
            ))}
          </div>
        ) : (
          <Board units={comp.coreUnits} carryId={comp.carry.id} />
        )}
      </div>
    </article>
  );
}
