"use client";

import { ChampionIcon } from "@/components/game/ChampionIcon";
import { ItemRow } from "@/components/game/ItemIcon";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { pct, place } from "@/lib/format";
import type { UnitStat } from "@/lib/types";

const COLUMNS: Column<UnitStat>[] = [
  {
    key: "name",
    label: "Campeão",
    sort: (u) => u.name,
    render: (u) => (
      <span className="flex items-center gap-3 font-medium">
        <ChampionIcon unit={u} size={36} />
        {u.name}
      </span>
    ),
  },
  { key: "cost", label: "Custo", align: "right", sort: (u) => u.cost, render: (u) => u.cost },
  { key: "avg", label: "Pos. média", align: "right", sort: (u) => u.avgPlacement, render: (u) => place(u.avgPlacement) },
  { key: "top4", label: "Top 4", align: "right", sort: (u) => -u.top4Rate, render: (u) => pct(u.top4Rate) },
  { key: "play", label: "Popularidade", align: "right", sort: (u) => -u.playRate, render: (u) => pct(u.playRate) },
  {
    key: "items",
    label: "Itens mais usados",
    render: (u) =>
      u.topItems.length ? <ItemRow items={u.topItems} size={26} className="justify-start gap-1" /> : <span className="text-muted">—</span>,
  },
];

export function ChampionsTable({ units }: { units: UnitStat[] }) {
  return (
    <DataTable
      rows={units}
      columns={COLUMNS}
      initialSort={{ key: "avg", dir: 1 }}
      searchText={(u) => u.name}
      searchPlaceholder="Buscar campeão…"
    />
  );
}
