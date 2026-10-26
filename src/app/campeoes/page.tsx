"use client";

import Image from "next/image";
import { ItemIcon } from "@/components/game";
import { StatsTable, type Column } from "@/components/StatsTable";
import { Notice, PageHeader, Skeleton, pct, place } from "@/components/ui";
import { useMeta } from "@/components/useMeta";
import type { UnitStat } from "@/lib/types";

const columns: Column<UnitStat>[] = [
  {
    key: "name",
    label: "Campeão",
    sort: (u) => u.name,
    render: (u) => (
      <span className="flex items-center gap-3">
        <span
          className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-surface-2"
          style={{ border: `2px solid var(--cost-${u.cost})` }}
        >
          {u.icon && <Image src={u.icon} alt="" fill sizes="36px" className="object-cover" />}
        </span>
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
      u.topItems.length ? (
        <span className="flex gap-1">{u.topItems.map((it) => <ItemIcon key={it.id} item={it} size={24} />)}</span>
      ) : (
        <span className="text-muted">—</span>
      ),
  },
];

export default function ChampionsPage() {
  const { data } = useMeta();
  return (
    <>
      <PageHeader title="Campeões" subtitle="Desempenho de cada campeão nas partidas analisadas." />
      <Notice />
      {!data ? <Skeleton className="h-96" /> : <StatsTable rows={data.units} columns={columns} initialSort={{ key: "avg", dir: 1 }} />}
    </>
  );
}
