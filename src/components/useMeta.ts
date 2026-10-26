"use client";

import useSWR from "swr";
import type { MetaSnapshot } from "@/lib/types";

const POLL_MS = 60_000;

async function fetcher(url: string): Promise<MetaSnapshot> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Shared, polled snapshot; SWR dedupes so every component reads the same request. */
export function useMeta() {
  const { data, error, isValidating, mutate } = useSWR("/api/meta", fetcher, {
    refreshInterval: POLL_MS,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  return {
    data: data ?? null,
    error: error ? (error as Error).message : null,
    loading: isValidating,
    refresh: () => void mutate(),
  };
}
