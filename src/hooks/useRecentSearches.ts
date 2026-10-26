"use client";

import { useSyncExternalStore } from "react";

// Recent player searches, kept per viewer in browser storage (a convenience, so losing it is fine).

export interface RecentSearch {
  platform: string;
  name: string;
  tag: string;
}

const KEY = "uptft:recent";
const CHANGE_EVENT = "uptft:recent";
const MAX = 6;

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function useRecentSearches(): RecentSearch[] {
  // The raw string is the snapshot so React can compare it cheaply between renders.
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  try {
    return JSON.parse(raw) as RecentSearch[];
  } catch {
    return [];
  }
}

export function saveRecentSearch(search: RecentSearch) {
  try {
    const same = (r: RecentSearch) =>
      r.platform === search.platform &&
      r.name.toLowerCase() === search.name.toLowerCase() &&
      r.tag.toLowerCase() === search.tag.toLowerCase();
    const list = (JSON.parse(readRaw()) as RecentSearch[]).filter((r) => !same(r));
    localStorage.setItem(KEY, JSON.stringify([search, ...list].slice(0, MAX)));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage unavailable (private mode, blocked): recent searches just don't persist.
  }
}
