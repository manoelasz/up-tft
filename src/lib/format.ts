// pt-BR number and time formatting shared by every page.

/** 0.623 -> "62,3%" */
export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits).replace(".", ",")}%`;

/** 1440 -> "1.440" */
export const num = (v: number) => new Intl.NumberFormat("pt-BR").format(v);

/** Average placement, 3.456 -> "3,46" */
export const place = (v: number) => v.toFixed(2).replace(".", ",");

/** 8.24 -> "8,2" */
export const decimal1 = (v: number) => v.toFixed(1).replace(".", ",");

/** Elapsed time, short: "12s", "5 min", "3 h". */
export function elapsed(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.round(m / 60)} h`;
}

/** "há 5 min", "há 3 h", "há 2 dias". */
export function timeAgo(t: number, now: number): string {
  const m = Math.max(1, Math.round((now - t) / 60_000));
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

/** Singular/plural: plural(1, "partida") -> "1 partida". */
export const plural = (n: number, word: string) => `${num(n)} ${word}${n === 1 ? "" : "s"}`;
