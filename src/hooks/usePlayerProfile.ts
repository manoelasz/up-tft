"use client";

import useSWR from "swr";
import { fetchJson } from "@/lib/fetchJson";
import type { PlayerProfile } from "@/lib/types";

/** Loads a player profile once (no polling); pass null to skip. */
export function usePlayerProfile(query: { platform: string; name: string; tag: string } | null) {
  const url = query
    ? `/api/player?platform=${query.platform}&name=${encodeURIComponent(query.name)}&tag=${encodeURIComponent(query.tag)}`
    : null;
  return useSWR(url, fetchJson<PlayerProfile>, { revalidateOnFocus: false, shouldRetryOnError: false });
}
