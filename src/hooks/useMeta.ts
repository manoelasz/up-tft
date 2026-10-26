"use client";

import useSWR from "swr";
import { fetchJson } from "@/lib/fetchJson";
import type { MetaSnapshot } from "@/lib/types";

const POLL_MS = 60_000;

/** Shared, polled meta snapshot; SWR dedupes so every component reads the same request. */
export function useMeta() {
  const { data, error, isValidating, mutate } = useSWR("/api/meta", fetchJson<MetaSnapshot>, {
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
