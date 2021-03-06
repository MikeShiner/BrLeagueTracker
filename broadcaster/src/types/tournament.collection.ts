import { KillboardEntry, LeaderboardEntry, TeamScoreboards } from '.';
import { Config } from '../config';

export interface TournamentCollection {
  week: number;
  game: number;
  config: Config;
  leaderboard: LeaderboardEntry[];
  killboard: KillboardEntry[];
  teamScoreboards: TeamScoreboards[];
}
