"use client";

import { CompCard } from "@/components/comps/CompCard";
import { Card } from "@/components/ui/Card";
import { Notice } from "@/components/ui/Notice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMeta } from "@/hooks/useMeta";
import { plural } from "@/lib/format";
import type { MetaSnapshot } from "@/lib/types";

const LEAGUE_PT: Record<string, string> = { challenger: "Desafiante", grandmaster: "Grão-Mestre", master: "Mestre" };

function describe(data: MetaSnapshot) {
  return `${LEAGUE_PT[data.league] ?? data.league} · ${data.region} · ${data.patch} · ${plural(data.matchesAnalyzed, "partida")} analisadas`;
}

export default function HomePage() {
  const { data } = useMeta();
  const comps = data?.topComps ?? [];

  return (
    <>
      <PageHeader
        title="Top 3 comps do momento"
        subtitle={data ? describe(data) : "As comps com maior taxa de vitória em partidas ranqueadas de alto elo."}
      />
      <Notice />

      {!data ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : comps.length === 0 ? (
        <Card>
          <p className="text-base text-ink-2">Ainda não há partidas suficientes para montar o ranking. Aguarde a próxima coleta.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {comps.map((c, i) => (
            <CompCard key={c.id} comp={c} rank={i} />
          ))}
        </div>
      )}
    </>
  );
}
