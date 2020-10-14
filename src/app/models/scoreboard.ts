export interface Match {
  matchMetadata: ScoreboardMetadata;
  players: Scoreboard[];
}

export interface Scoreboard {
  type: string;
  attributes: Attributes;
  metadata: ScoreboardMetadata;
  expiryDate: Date;
  stats: { [key: string]: Stat };
}

export interface ScoreboardMetadata {
  duration: Duration;
  timestamp: number;
  playerCount: number;
  teamCount: number;
  mapName: string;
  mapImageUrl: string;
  modeName: string;
  isIncomplete: boolean;
  totalKills?: number;
}

export interface Duration {
  value: number;
  displayValue: string;
  displayType: string;
}

export interface Attributes {
  platformUserIdentifier: string;
  team: string;
}

export interface ScoreboardMetadata {
  platformUserHandle: string;
  clanTag: string;
  placement: Placement;
}

export interface Placement {
  value: number;
  displayValue: string;
  displayType: string;
}

export interface Stat {
  rank: null;
  percentile: null;
  displayName: string;
  displayCategory: DisplayCategory;
  category: Category;
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

export enum DisplayType {
  Number = 'Number',
  NumberPercentage = 'NumberPercentage',
  NumberPrecision2 = 'NumberPrecision2',
  TimeMilliseconds = 'TimeMilliseconds',
  TimeSeconds = 'TimeSeconds',
}

export interface StatMetadata {}
