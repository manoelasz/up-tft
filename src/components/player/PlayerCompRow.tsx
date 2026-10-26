import { ChampionIcon } from "@/components/game/ChampionIcon";
import { Stat } from "@/components/ui/Stat";
import { pct, place, plural } from "@/lib/format";
import type { PlayerComp } from "@/lib/types";

export function PlayerCompRow({ comp }: { comp: PlayerComp }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <ChampionIcon unit={comp.carry} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-semibold text-ink">{comp.name}</span>
          {comp.inMetaTop && (
            <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">Top 3 do meta</span>
          )}
        </div>
        <div className="text-xs text-muted">{plural(comp.games, "partida")}</div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-right">
        <Stat label="Pos." value={place(comp.avgPlacement)} size="sm" />
        <Stat label="Top 4" value={pct(comp.top4Rate, 0)} size="sm" />
        <Stat label="Vitória" value={pct(comp.winRate, 0)} size="sm" />
      </div>
    </div>
  );
}
