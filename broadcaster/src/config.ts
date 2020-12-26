import { Captain } from './types';

export class Config {
  startTime: Date;
  playlistThisWeek: string = "BR Trio's";
  weekNumber: number;
  gameNumber: number;
  numberOfGames: number = 5;
  refreshTimeSeconds: number = 120;
  captains: Captain[] = [];
  blacklistMatches: string[];

  constructor(
    captains: Captain[],
    playlistThisWeek: string,
    weekNumber: number,
    numberOfGames: number,
    startTime?: string,
    blacklistMatches?: string[]
  ) {
    this.startTime = startTime ? new Date(startTime) : undefined;
    this.weekNumber = weekNumber;
    this.blacklistMatches = blacklistMatches;
    this.captains = captains;
    this.playlistThisWeek = playlistThisWeek;
    this.numberOfGames = numberOfGames;
  }

  addCaptain(captainId: string, teamName: string) {
    this.captains.push({ id: captainId, teamName });
  }
}
