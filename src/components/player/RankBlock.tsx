import Image from "next/image";
import { plural } from "@/lib/format";
import type { PlayerRank } from "@/lib/types";

const TIER_PT: Record<string, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-Mestre",
  CHALLENGER: "Desafiante",
};

const QUEUE_PT: Record<string, string> = {
  RANKED_TFT: "Ranqueada",
  RANKED_TFT_DOUBLE_UP: "Double Up",
  RANKED_TFT_TURBO: "Hyper Roll",
};

const crestUrl = (tier: string) =>
  `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.svg`;

export function RankBlock({ rank }: { rank: PlayerRank }) {
  return (
    <div className="flex items-center gap-3">
      <Image src={crestUrl(rank.tier)} alt="" width={48} height={48} unoptimized />
      <div>
        <div className="text-xs text-muted">{QUEUE_PT[rank.queue] ?? rank.queue}</div>
        <div className="text-base font-semibold text-ink">
          {TIER_PT[rank.tier] ?? rank.tier} {rank.division} <span className="text-accent">{rank.lp} PDL</span>
        </div>
        <div className="text-xs text-muted">{plural(rank.wins + rank.losses, "partida")} na temporada</div>
      </div>
    </div>
  );
}
