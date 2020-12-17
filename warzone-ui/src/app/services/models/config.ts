import { Captain } from "./server-models";

export interface Config {
  startTime?: Date;
  numberOfGames: number;
  weekNumber: number;
  gameNumber: number;
  refreshTimeSeconds: number;
  captains: Captain[];
}
