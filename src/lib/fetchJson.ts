import type { ApiError } from "./types";

/** SWR fetcher for our API routes: throws with the route's own error message on failure. */
export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json().catch(() => null)) as T | ApiError | null;
  if (!res.ok) {
    const message = body && typeof body === "object" && "error" in body ? body.error : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}
