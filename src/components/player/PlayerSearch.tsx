"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RecentSearch } from "@/hooks/useRecentSearches";
import { PLATFORMS, parseRiotId, riotIdSlug } from "@/lib/regions";

export function profileHref(s: RecentSearch) {
  return `/jogador/${s.platform}/${riotIdSlug(s.name, s.tag)}`;
}

/** Server picker + "Nome#TAG" input; navigates to the player's profile page. */
export function PlayerSearch({ initial, autoFocus = false }: { initial?: RecentSearch; autoFocus?: boolean }) {
  const router = useRouter();
  const [platform, setPlatform] = useState(initial?.platform ?? "br1");
  const [value, setValue] = useState(initial ? `${initial.name}#${initial.tag}` : "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const id = parseRiotId(value);
    if (!id) {
      setError("Use o formato Nome#TAG, por exemplo: Jogador#BR1");
      return;
    }
    setError(null);
    router.push(profileHref({ platform, ...id }));
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex gap-2 rounded-xl border border-line bg-surface p-1.5 focus-within:border-accent/50">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          aria-label="Servidor"
          className="rounded-lg bg-surface-2 px-2.5 text-sm font-medium text-ink focus:outline-none"
        >
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nome#TAG"
          aria-label="Riot ID"
          aria-invalid={Boolean(error)}
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent px-2 text-base text-ink placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent-strong px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          Buscar
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[#f49a9a]">{error}</p>}
    </form>
  );
}
