"use client";

import { ChampionsTable } from "@/components/champions/ChampionsTable";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMeta } from "@/hooks/useMeta";

export default function ChampionsPage() {
  const { data } = useMeta();
  return (
    <>
      <PageHeader title="Campeões" subtitle="Desempenho de cada campeão nas partidas analisadas." />
      <Notice />
      {data ? <ChampionsTable units={data.units} /> : <Skeleton className="h-96" />}
    </>
  );
}
