import { getMatches, getTeamboard } from './tracker';
import { Captain, LeaderboardEntry, Match, TeamScoreboard } from './types';
import { config } from './config';
import WebSocket from 'ws';

const wss = new WebSocket.Server({
  port: 8082,
});

wss.on('connection', (ws: WebSocket) => {
  ws.send(
    JSON.stringify({
      type: 'config',
      config,
    })
  );
  ws.send(
    JSON.stringify({
      type: 'leaderboard',
      leaderboard: leaderboardCache,
    })
  );
  ws.send(
    JSON.stringify({
      type: 'teamScoreboards',
      scoreboard: scoreboardsCache.sort((a, b) => a.captain.teamName.localeCompare(b.captain.teamName)),
    })
  );
});

let scoreboardsCache: TeamScoreboard[] = [];
let leaderboardCache: LeaderboardEntry[] = [];

const run = async () => {
  // Each team get matches
  console.log('Running fetcher at ', new Date().getTime());

  // Fetch and emit all team scoreboards. Once finished, generate leadboard based on new set
  let scoreboardPromises: Promise<TeamScoreboard>[] = [];
  config.captains.forEach((captain) => scoreboardPromises.push(getAllTeamScoreboards(captain)));
  const teamScoreboards = await Promise.all(scoreboardPromises);

  // Generate Leaderboard
  console.log('Generating leaderboard...');
  broadcastData(
    JSON.stringify({
      type: 'leaderboard',
      leaderboard: generateLeaderboard(teamScoreboards),
    })
  );
};

const getAllTeamScoreboards = async (captain: Captain): Promise<TeamScoreboard> => {
  return new Promise(async (done) => {
    let matches: Match[] = await getMatches(captain);
    console.log('Fetching data for Captain', captain.id);
    const teamscoreboard = await getTeamboard(captain, matches);
    addToScoreboardCache(teamscoreboard);
    // Broadcast update as soon as we get it
    broadcastData(
      JSON.stringify({
        type: 'teamScoreboardUpdate',
        teamscoreboard,
      })
    );
    done(teamscoreboard);
  });
};

const generateLeaderboard = (everyTeamScoreboard: TeamScoreboard[]) => {
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
  leaderboardCache = leaderboard;
  return leaderboard;
};

const broadcastData = (data: string) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

const addToScoreboardCache = (teamScoreboard: TeamScoreboard) => {
  const index = scoreboardsCache.indexOf(teamScoreboard);
  if (index !== -1) {
    scoreboardsCache[index] = teamScoreboard;
    return;
  }
  scoreboardsCache.push(teamScoreboard);
};
run();
const fetch = setInterval(run, config.refreshTimeSeconds * 1000);
