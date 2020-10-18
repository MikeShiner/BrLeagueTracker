import { Captain } from "./server-models";

export interface Config {
  startTime?: Date;
  numberOfGames: number;
  refreshTimeSeconds: number;
  captains: Captain[];
}
