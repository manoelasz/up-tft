import "server-only";
import { config } from "../config";

// Low-level Riot API access: authentication, a client-side rate limiter that keeps us
// under the key's limits, and retries on 429.

const LIMITS = [
  { max: config.riot.ratePerSecond, windowMs: 1_000 },
  { max: config.riot.ratePer2Min, windowMs: 120_000 },
];
const LONGEST_WINDOW_MS = Math.max(...LIMITS.map((l) => l.windowMs));
const MAX_RETRIES = 3;

const sent: number[] = [];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Waits until one more request fits in every rate-limit window, then records it. */
async function acquire(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (sent.length && now - sent[0] > LONGEST_WINDOW_MS) sent.shift();
    const wait = Math.max(
      ...LIMITS.map(({ max, windowMs }) => {
        const inWindow = sent.filter((t) => now - t < windowMs);
        return inWindow.length < max ? 0 : windowMs - (now - inWindow[inWindow.length - max]) + 5;
      }),
    );
    if (wait === 0) {
      sent.push(now);
      return;
    }
    await sleep(wait);
  }
}

export class RiotError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function riotGet<T>(host: string, path: string, attempt = 0): Promise<T> {
  if (!config.riot.apiKey) throw new RiotError(401, "RIOT_API_KEY não configurada");
  await acquire();
  const res = await fetch(`https://${host}.api.riotgames.com${path}`, {
    headers: { "X-Riot-Token": config.riot.apiKey },
    cache: "no-store",
  });
  if (res.status === 429 && attempt < MAX_RETRIES) {
    await sleep(Number(res.headers.get("Retry-After") ?? 5) * 1000);
    return riotGet(host, path, attempt + 1);
  }
  if (!res.ok) throw new RiotError(res.status, `Riot API ${res.status} em ${path}`);
  return res.json() as Promise<T>;
}

/** Runs `fn` over `items` with at most `limit` in flight; failures are logged and dropped. */
export async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const item = items[next++];
      try {
        out.push(await fn(item));
      } catch (err) {
        console.warn("[riot]", (err as Error).message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
