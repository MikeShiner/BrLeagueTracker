'use strict';
import express from 'express';
import { Application } from 'express';
import expressWs from 'express-ws';
import compression from 'compression';
import { Runner } from './app';
// import WebSocket from 'ws';
import { config } from './config';
import ws from 'ws';

export class Server {
  private app: any;
  private runner: Runner;
  get expressApp() {
    return this.app;
  }
  private wss: any;

  constructor(port: number) {
    const _app_folder = __dirname + '/ui';
    this.app = express();
    this.wss = expressWs(this.app);

    this.runner = new Runner(this.wss);
    this.setupWebsocketRoutes();

    this.app.get('*.*', express.static(_app_folder, { maxAge: '1y' }));

    this.app.use('/', function (req, res) {
      res.status(200).sendFile(`/`, { root: _app_folder });
    });

    this.app.listen(port, function () {
      console.log('BR Tracker started on port: ' + port);
    });
  }

  run() {}

  setupWebsocketRoutes() {
    this.app.ws('/updates', (ws, req) => {
      ws.send(
        JSON.stringify({
          type: 'config',
          config,
        })
      );
      ws.send(
        JSON.stringify({
          type: 'leaderboard',
          leaderboard: this.runner.leaderboardCache,
        })
      );
      ws.send(
        JSON.stringify({
          type: 'teamScoreboards',
          scoreboard: this.runner.scoreboardsCache.sort((a, b) => a.captain.teamName.localeCompare(b.captain.teamName)),
        })
      );
    });
  }
}
const server = new Server(+process.env.port);
