import { getMatches, getTeamboard } from './tracker';
import { Captain, LeaderboardEntry, Match, TeamScoreboard } from './types';
import { config } from './config';
import WebSocket from 'ws';
import expressWs from 'express-ws';

export class Runner {
  scoreboardsCache: TeamScoreboard[] = [];
  leaderboardCache: LeaderboardEntry[] = [];

  constructor(private wss: expressWs.Instance) {
    this.runFetcher.bind(this);
    this.startPolling();
  }

  private async startPolling() {
    setInterval(await this.runFetcher.bind(this), config.refreshTimeSeconds * 500);
  }

  private async runFetcher() {
    // Each team get matches
    console.log('Running fetcher at ', new Date().getTime());

    // Fetch and emit all team scoreboards. Once finished, generate leadboard based on new set
    let scoreboardPromises: Promise<TeamScoreboard>[] = [];
    config.captains.forEach((captain) => scoreboardPromises.push(this.getAllTeamScoreboards(captain)), this);
    const teamScoreboards = await Promise.all(scoreboardPromises);

    // Generate Leaderboard
    console.log('Generating leaderboard...');
    this.broadcastData(
      JSON.stringify({
        type: 'leaderboard',
        leaderboard: this.generateLeaderboard(teamScoreboards),
      })
    );
  }

  private generateLeaderboard(everyTeamScoreboard: TeamScoreboard[]) {
    let leaderboard: LeaderboardEntry[] = [];
    everyTeamScoreboard.forEach((teamScoreboard) => {
      let totalKillsAcrossAllGames = 0;
      let totalPointsAcrossAllGames = 0;
      teamScoreboard.scoreboards.forEach((game) => {
        totalKillsAcrossAllGames += game.metadata.totalKills;
        totalPointsAcrossAllGames += game.metadata.placementPoints + game.metadata.killPoints;
      });

      leaderboard.push({
        team: teamScoreboard.captain.teamName,
        totalKills: totalKillsAcrossAllGames,
        points: totalPointsAcrossAllGames,
        gamesPlayed: teamScoreboard.scoreboards.length,
      });
    });
    leaderboard = leaderboard.sort((a, b) => (a.points - b.points) * -1);
    this.leaderboardCache = leaderboard;
    console.log('done');
    return leaderboard;
  }

  private async getAllTeamScoreboards(captain: Captain): Promise<TeamScoreboard> {
    return new Promise(async (done) => {
      let matches: Match[] = await getMatches(captain);
      console.log('Fetching data for Captain', captain.id);
      const teamscoreboard = await getTeamboard(captain, matches);
      this.addToScoreboardCache(teamscoreboard);
      // Broadcast update as soon as we get it
      this.broadcastData(
        JSON.stringify({
          type: 'teamScoreboardUpdate',
          teamscoreboard,
        })
      );
      done(teamscoreboard);
    });
  }

  private broadcastData(data: string) {
    this.wss.getWss().clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  private addToScoreboardCache(teamScoreboard: TeamScoreboard) {
    if (this.scoreboardsCache.length > config.captains.length * config.numberOfGames) {
      this.scoreboardsCache = [];
    }
    const index: number = this.scoreboardsCache.findIndex((ts) => ts.captain.id === teamScoreboard.captain.id);
    if (index !== -1) {
      this.scoreboardsCache[index] = teamScoreboard;
      return;
    }
    this.scoreboardsCache.push(teamScoreboard);
  }
}
