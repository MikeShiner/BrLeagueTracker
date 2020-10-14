import { Captain } from './captain';
import { Match } from './scoreboard';

export interface TeamScoreboard {
  captain: Captain;
  data: Match[];
}
