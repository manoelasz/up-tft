"use client";

import { CompCard } from "@/components/CompCard";
import { useMeta } from "@/components/useMeta";
import { Card, Notice, PageHeader, Skeleton, num } from "@/components/ui";

export default function Home() {
  const { data } = useMeta();
  const comps = data?.topComps ?? [];

  const subtitle = data
    ? `${data.league === "challenger" ? "Challenger" : data.league} · ${data.region} · ${data.patch} · ${num(data.matchesAnalyzed)} partidas analisadas`
    : "As comps mais fortes do momento, a partir de partidas ranqueadas de alto elo.";

  return (
    <>
      <PageHeader title="Top 3 comps do momento" subtitle={subtitle} />
      <Notice />

      {!data ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : comps.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-2">Ainda não há partidas suficientes para montar o ranking. Aguarde a próxima coleta.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {comps.map((c, i) => <CompCard key={c.id} comp={c} rank={i} />)}
        </div>
      )}
    </>
  );
}
