import { PlacementBadge } from "@/components/game/badges";
import { ChampionIcon } from "@/components/game/ChampionIcon";
import { TraitChip } from "@/components/game/TraitChip";
import { timeAgo } from "@/lib/format";
import type { PlayerMatch } from "@/lib/types";

const MAX_TRAITS = 6;

/** One game in the history: placement, comp, traits and the final board's units. */
export function MatchRow({ match, now }: { match: PlayerMatch; now: number }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-64 sm:shrink-0">
        <PlacementBadge placement={match.placement} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{match.compName}</div>
          <div className="text-xs text-muted">
            {match.queue} · {timeAgo(match.time, now)} · nv. {match.level}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {match.traits.slice(0, MAX_TRAITS).map((t) => (
            <TraitChip key={t.id} trait={t} compact />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-0.5 gap-y-1">
          {match.units.map((u, i) => (
            <ChampionIcon key={`${u.id}-${i}`} unit={u} size={42} stars={u.stars} items={u.items} />
          ))}
        </div>
      </div>
    </div>
  );
}
