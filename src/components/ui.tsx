"use client";

import { useEffect, useState } from "react";
import type { Tier } from "@/lib/types";
import { useMeta } from "./useMeta";

export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits).replace(".", ",")}%`;
export const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v);
export const place = (v: number) => v.toFixed(2).replace(".", ",");

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.round(m / 60)} h`;
}

export function LiveStatus() {
  const { data, loading, refresh } = useMeta();
  // Ticks client-side only; null until the first tick so prerender stays deterministic.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-3 self-start rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-2 sm:self-auto">
      <span className="live-dot" />
      <span className="tabular">
        {!data ? "Conectando…" : now === null ? "Atualizado agora" : `Atualizado há ${ago(now - data.updatedAt)}`}
      </span>
      <button
        onClick={refresh}
        disabled={loading}
        className="rounded-full px-2 py-0.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
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
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      {live && <LiveStatus />}
    </header>
  );
}

export function Notice() {
  // Only client-side fetch failures are shown; data-source issues (demo mode, expired key) go to the server log.
  const { error } = useMeta();
  if (!error) return null;
  const text = `Não foi possível atualizar (${error}). Tentando de novo em instantes.`;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink-2">
      <span aria-hidden className="mt-0.5 text-accent">ⓘ</span>
      <span>{text}</span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

const TIER_STYLE: Record<Tier, string> = {
  S: "bg-[#a855f7] text-white",
  A: "bg-[#6366f1] text-white",
  B: "bg-[#3b3452] text-ink",
  C: "bg-[#2a2540] text-ink-2",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-sm font-bold ${TIER_STYLE[tier]}`} title={`Tier ${tier}`}>
      {tier}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface ${className}`} />;
}
