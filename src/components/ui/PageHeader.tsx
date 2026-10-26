"use client";

import { useEffect, useState } from "react";
import { useMeta } from "@/hooks/useMeta";
import { elapsed } from "@/lib/format";

/** "Atualizado há 12s" pill with a manual refresh button for the meta snapshot. */
function LiveStatus() {
  const { data, loading, refresh } = useMeta();
  // Ticks client-side only; null until the first tick so prerender stays deterministic.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const label = !data ? "Conectando…" : now === null ? "Atualizado agora" : `Atualizado há ${elapsed(now - data.updatedAt)}`;

  return (
    <div className="flex items-center gap-3 self-start rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink-2 sm:self-auto">
      <span className="live-dot" />
      <span className="tabular">{label}</span>
      <button
        onClick={refresh}
        disabled={loading}
        className="rounded-full px-1.5 text-muted transition-colors hover:text-ink disabled:opacity-50"
        aria-label="Atualizar agora"
      >
        {loading ? "…" : "↻"}
      </button>
    </div>
  );
}

export function PageHeader({ title, subtitle, live = true }: { title: string; subtitle: React.ReactNode; live?: boolean }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm text-ink-2">{subtitle}</p>
      </div>
      {live && <LiveStatus />}
    </header>
  );
}
