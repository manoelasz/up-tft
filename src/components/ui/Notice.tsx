"use client";

import { useMeta } from "@/hooks/useMeta";

/** Shown only when the browser can't reach our API; data-source issues go to the server log. */
export function Notice() {
  const { error } = useMeta();
  if (!error) return null;
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink-2">
      <span aria-hidden className="mt-0.5 text-accent">ⓘ</span>
      <span>Não foi possível atualizar ({error}). Tentando de novo em instantes.</span>
    </div>
  );
}
