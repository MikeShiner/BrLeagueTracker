import https from 'https';
import http from 'http';
import ws from 'ws';
import { app } from './app';
import WebSocket from 'ws';
import { KillboardEntry, LeaderboardEntry, TeamScoreboards } from './types';

export class WebSocketService {
  wsServer: ws.Server;
  constructor(server: https.Server | http.Server) {
    this.wsServer = new ws.Server({ server });

    this.wsServer.on('connection', (socket) => {
      socket.send(
        JSON.stringify({
          type: 'config',
          config: app.config,
        })
      );
      socket.send(
        JSON.stringify({
          type: 'teamScoreboards',
          teamScoreboard: app.runner?.teamScoreboardUpdates$.value ?? [],
        })
      );
      socket.send(
        JSON.stringify({
          type: 'leaderboard',
          leaderboard: app.runner?.leaderboardUpdates$.value ?? [],
        })
      );
      socket.send(
        JSON.stringify({
          type: 'killboard',
          killboard: app.runner?.killboardUpdates$.value ?? [],
        })
      );
    });
  }

  emitConfigUpdate() {
    this.emitToAllClients(
      JSON.stringify({
        type: 'config',
        config: app.config,
      })
    );
  }

  emitTeamScoreboardUpdate(teamScoreboardUpdate: TeamScoreboards[]) {
    this.emitToAllClients(
      JSON.stringify({
        type: 'teamScoreboards',
        teamScoreboard: teamScoreboardUpdate,
      })
    );
  }

  emitLeaderboardUpdate(leaderboard: LeaderboardEntry[]) {
    this.emitToAllClients(
      JSON.stringify({
        type: 'leaderboard',
        leaderboard,
      })
    );
  }

  emitKillboardUpdate(killboard: KillboardEntry[]) {
    this.emitToAllClients(
      JSON.stringify({
        type: 'killboard',
        killboard,
      })
    );
  }

  private emitToAllClients(payload: string) {
    this.wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}
