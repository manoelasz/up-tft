"use client";

import Link from "next/link";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { findPlatform } from "@/lib/regions";
import { profileHref } from "./PlayerSearch";

export function RecentSearchList() {
  const recent = useRecentSearches();
  if (recent.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-ink-2">Buscas recentes</h2>
      <div className="flex flex-wrap gap-2">
        {recent.map((r) => (
          <Link
            key={`${r.platform}-${r.name}-${r.tag}`}
            href={profileHref(r)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors hover:border-accent/40"
          >
            {r.name}
            <span className="text-muted">#{r.tag}</span>
            <span className="ml-2 text-xs text-muted">{findPlatform(r.platform)?.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
