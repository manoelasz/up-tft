// Subset of the Riot TFT payloads the server reads.

export interface RiotTrait {
  name: string;
  num_units: number;
  style: number; // 0 inactive, 1 bronze, 2 silver, 3 gold/unique, 4 prismatic
  tier_current: number;
  tier_total: number;
}

export interface RiotUnit {
  character_id: string;
  itemNames?: string[];
  rarity: number; // 0,1,2,4,6 -> cost 1,2,3,4,5
  tier: number; // star level
}

export interface RiotParticipant {
  puuid: string;
  placement: number;
  level: number;
  traits: RiotTrait[];
  units: RiotUnit[];
}

export interface RiotMatch {
  metadata: { match_id: string; participants: string[] };
  info: {
    game_datetime: number;
    game_version: string;
    queue_id: number;
    tft_set_number: number;
    participants: RiotParticipant[];
  };
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotLeagueEntry {
  queueType: string;
  tier?: string;
  rank?: string;
  leaguePoints?: number;
  wins: number;
  losses: number;
}

export interface RiotSummoner {
  profileIconId: number;
  summonerLevel: number;
}

export const RANKED_QUEUE = 1100;
