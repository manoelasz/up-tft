// Riot routing: league/summoner calls go to the platform host (br1, euw1...),
// match calls to the regional cluster, account calls to americas/europe/asia.
export interface Platform {
  id: string;
  label: string;
  cluster: "americas" | "europe" | "asia" | "sea";
}

export const PLATFORMS: Platform[] = [
  { id: "br1", label: "BR", cluster: "americas" },
  { id: "na1", label: "NA", cluster: "americas" },
  { id: "la1", label: "LAN", cluster: "americas" },
  { id: "la2", label: "LAS", cluster: "americas" },
  { id: "euw1", label: "EUW", cluster: "europe" },
  { id: "eun1", label: "EUNE", cluster: "europe" },
  { id: "tr1", label: "TR", cluster: "europe" },
  { id: "ru", label: "RU", cluster: "europe" },
  { id: "me1", label: "ME", cluster: "europe" },
  { id: "kr", label: "KR", cluster: "asia" },
  { id: "jp1", label: "JP", cluster: "asia" },
  { id: "oc1", label: "OCE", cluster: "sea" },
  { id: "sg2", label: "SG", cluster: "sea" },
  { id: "tw2", label: "TW", cluster: "sea" },
  { id: "vn2", label: "VN", cluster: "sea" },
];

export function findPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id.toLowerCase());
}

/** Account-v1 has no "sea" cluster. */
export function accountCluster(p: Platform): string {
  return p.cluster === "sea" ? "asia" : p.cluster;
}

/** "Nome#TAG" -> parts; the tag never contains "#" so the last one splits. */
export function parseRiotId(input: string): { name: string; tag: string } | null {
  const i = input.lastIndexOf("#");
  if (i <= 0) return null;
  const name = input.slice(0, i).trim();
  const tag = input.slice(i + 1).trim();
  return name && tag ? { name, tag } : null;
}

/** URL slug "Nome-TAG"; tags are alphanumeric, so the last "-" splits. */
export function riotIdSlug(name: string, tag: string): string {
  return encodeURIComponent(`${name}-${tag}`);
}

export function parseRiotIdSlug(slug: string): { name: string; tag: string } | null {
  const s = decodeURIComponent(slug);
  const i = s.lastIndexOf("-");
  if (i <= 0 || i === s.length - 1) return null;
  return { name: s.slice(0, i), tag: s.slice(i + 1) };
}
