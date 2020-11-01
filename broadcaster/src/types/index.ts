export interface KillboardEntry {
  name: string;
  kills: number;
  team: string;
}

export interface Captain {
  platform: string;
  id: string;
  teamName: string;
}

export interface LeaderboardEntry {
  team: string;
  totalKills: number;
  points: number;
  gamesPlayed: number;
}

export interface TeamScoreboards {
  captain: Captain;
  scoreboards: MatchScoreboard[];
}

export interface MatchScoreboard {
  matchMetadata: {
    matchId: string;
    timestamp: Date;
    placement: number;
    duration: { value: number; displayValue: string };
    placementDisplay: string;
    totalKills?: number;
    killPoints?: number;
    placementPoints: number;
    totalPoints?: number;
  };
  players?: PlayerScore[];
}

export interface PlayerScore {
  name: string;
  clanTag: string;
  kills: number;
  deaths: number;
  kd: number;
  damage: number;
  revives: number;
}

export interface Match {
  utcStartSeconds: number;
  utcEndSeconds: number;
  map: string;
  mode: string;
  matchID: string;
  duration: number;
  playlistName: null;
  version: number;
  gameType: string;
  playerCount: number;
  playerStats: { [key: string]: number };
  player: Player;
  teamCount: number;
  rankedTeams: null;
  draw: boolean;
  privateMatch: boolean;
}

export interface Player {
  team: string;
  rank: number;
  awards: Awards;
  username: string;
  uno: string;
  clantag: string;
  brMissionStats: BrMissionStats;
  loadout: Loadout[];
}

export interface Awards {}

export interface BrMissionStats {
  missionsComplete: number;
  totalMissionXpEarned: number;
  totalMissionWeaponXpEarned: number;
  missionStatsByType: Awards;
}

export interface Loadout {
  primaryWeapon: AryWeapon;
  secondaryWeapon: AryWeapon;
  perks: Perk[];
  extraPerks: Perk[];
  killstreaks: Killstreak[];
  tactical: Lethal;
  lethal: Lethal;
}

export interface Perk {
  name: ExtraPerkName;
  label: null;
  image: null;
  imageMainUi: null;
  imageProgression: null;
}

export enum ExtraPerkName {
  Null = 'null',
  SpecialtyNull = 'specialty_null',
}

export interface Killstreak {
  name: KillstreakName;
  label: null;
}

export enum KillstreakName {
  None = 'none',
  Reflex = 'reflex',
  Silencer = 'silencer',
}

export interface Lethal {
  name: string;
  label: null;
  image: null;
  imageLarge: null;
  progressionImage: null;
}

export interface AryWeapon {
  name: string;
  label: null;
  imageLoot: null;
  imageIcon: null;
  variant: string;
  attachments: Attachment[];
}

export interface Attachment {
  name: KillstreakName;
  label: null;
  image: null;
  category: null;
}
