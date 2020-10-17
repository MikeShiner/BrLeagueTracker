export interface LeaderboardEntry {
  team: string;
  totalKills: number;
  points: number;
  gamesPlayed: number;
}
export interface TeamScoreboard {
  captain: Captain;
  scoreboards: GameScoreboard[];
}

export interface GameScoreboard {
  metadata: GameScoreboardMeta;
  players: PlayerScore[];
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

export interface GameScoreboardMeta {
  timestamp: Date;
  placement: number;
  duration: { value: number; displayValue: string };
  placementDisplay: string;
  totalKills: number;
  killPoints: number;
  placementPoints: number;
}

export interface Captain {
  platform: string;
  id: string;
  teamName: string;
}

export interface FullMatch {
  data: Match;
}
export interface ScoreboardMetadata {
  matches: Match[];
}

export interface Match {
  attributes: MatchAttributes;
  metadata: MatchMetadata;
  segments: Segment[];
}

export interface MatchAttributes {
  id: string;
  mapId: MapID;
  modeId: ModeID;
}

export interface MatchStats {
  attributes: MatchAttributes;
  metadata: MatchMetadata;
  segments: Segment[];
}

export enum MapID {
  MpDon3 = 'mp_don3',
}

export enum ModeID {
  BrBrquads = 'br_brquads',
  BrBrtrios = 'br_brtrios',
}

export interface MatchMetadata {
  duration: Duration;
  timestamp: Date;
  playerCount: number;
  teamCount: number;
  mapName: MapName;
  mapImageUrl: string;
  modeName: ModeName;
}

export interface Duration {
  value: number;
  displayValue: string;
  displayType: DisplayType;
}

export enum DisplayType {
  Number = 'Number',
  NumberOrdinal = 'NumberOrdinal',
  NumberPercentage = 'NumberPercentage',
  NumberPrecision2 = 'NumberPrecision2',
  TimeMilliseconds = 'TimeMilliseconds',
  TimeSeconds = 'TimeSeconds',
}

export enum MapName {
  Verdansk = 'Verdansk',
}

export enum ModeName {
  BRQuads = 'BR Quads',
  BRTrios = 'BR Trios',
}

export interface Segment {
  type: Type;
  attributes: SegmentAttributes;
  metadata: SegmentMetadata;
  expiryDate: Date;
  stats: { [key: string]: Stat };
}

export interface SegmentAttributes {
  platformUserIdentifier: string;
  platformSlug: null;
  team: string;
}

export interface SegmentMetadata {
  platformUserHandle: PlatformUserHandle;
  clanTag: ClanTag;
  placement: { value: number; displayValue: string };
}

export enum ClanTag {
  Vdfc = 'VDFC',
}

export enum PlatformUserHandle {
  Warscyther = 'Warscyther',
}

export interface Stat {
  rank: null;
  percentile: null;
  displayName: string;
  displayCategory: DisplayCategory | null;
  category: Category | null;
  metadata: StatMetadata;
  value: number;
  displayValue: string;
  displayType: DisplayType;
}

export enum Category {
  BattleRoyale = 'battleRoyale',
  General = 'general',
  Objective = 'objective',
  XP = 'xp',
}

export enum DisplayCategory {
  BattleRoyale = 'Battle Royale',
  General = 'General',
  Objective = 'Objective',
  XP = 'XP',
}

export interface StatMetadata {}

export enum Type {
  Overview = 'overview',
}
