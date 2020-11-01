// import { config } from './legacy/config';
import express, { Request, Response } from 'express';
import expressWs from 'express-ws';
import { Captain, KillboardEntry, LeaderboardEntry, TeamScoreboards } from './types';
import { Runner } from './runner';
import { Subscription } from 'rxjs/internal/Subscription';
import WebSocket from 'ws';

export class Config {
  startTime: Date;
  playlistThisWeek: string = "BR Trio's";
  numberOfGames: number = 5;
  refreshTimeSeconds: number = 120;
  captains: Captain[] = [];
  blacklistMatches: string[];

  constructor(captains: Captain[], playlistThisWeek: string, startTime?: string, blacklistMatches?: string[]) {
    this.startTime = startTime ? new Date(startTime) : undefined;
    this.blacklistMatches = blacklistMatches;
    this.captains = captains;
    this.playlistThisWeek = playlistThisWeek;
  }
}

class Server {
  config: Config;
  runner: Runner;

  teamScoreboardSub: Subscription;
  leaderboardSub: Subscription;
  killboardSub: Subscription;

  private runnerInterval;
  app;
  wss;
  constructor(port: string) {
    this.config = new Config([{ platform: 'atvi', id: 'zackody', teamName: 'PBW' }], 'BR Trios');

    this.app = express();
    this.app.use(express.json());
    this.wss = expressWs(this.app);
    this.setupInitialValuesWsRoute();

    this.app.get('*.*', express.static(__dirname + '/ui', { maxAge: '1y' }));

    // Configuration endpoint
    this.app.post('/config', this.newConfigRequest.bind(this));

    // Server angular
    this.app.use('/', function (req: Request, res: Response) {
      res.status(200).sendFile(`/`, { root: __dirname + '/ui' });
    });

    this.app.listen(port, function () {
      console.log('BR Tracker started on port: ' + port);
    });
  }

  async startRunner() {
    // clean up
    if (this.runnerInterval) clearInterval(this.runnerInterval);
    if (this.teamScoreboardSub) this.teamScoreboardSub.unsubscribe();
    if (this.killboardSub) this.killboardSub.unsubscribe();
    if (this.leaderboardSub) this.leaderboardSub.unsubscribe();

    this.runner = new Runner(this.config, process.env.user, process.env.pass);
    this.teamScoreboardSub = this.runner.teamScoreboardUpdates$.subscribe((s) => this.emitTeamScoreboardUpdate(s));
    this.killboardSub = this.runner.killboardUpdates$.subscribe((s) => this.emitKillboardUpdate(s));
    this.leaderboardSub = this.runner.leaderboardUpdates$.subscribe((s) => this.emitLeaderboardUpdate(s));

    await this.runner.login();
    await this.runner.runnerLoop();
    this.runnerInterval = setInterval(async () => await this.runner.runnerLoop(), 1 * 60000); // 1 minutes
  }

  private setupInitialValuesWsRoute() {
    this.app.ws('/updates', (ws, req) => {
      ws.send(
        JSON.stringify({
          type: 'config',
          config: this.config,
        })
      );
      ws.send(
        JSON.stringify({
          type: 'teamScoreboards',
          teamScoreboard: this.runner.teamScoreboardUpdates$.value,
        })
      );
      ws.send(
        JSON.stringify({
          type: 'leaderboard',
          leaderboard: this.runner.leaderboardUpdates$.value,
        })
      );
      ws.send(
        JSON.stringify({
          type: 'killboard',
          killboard: this.runner.killboardUpdates$.value,
        })
      );
    });
  }

  private emitTeamScoreboardUpdate(teamScoreboardUpdate: TeamScoreboards[]) {
    this.wss.getWss().clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'teamScoreboards',
            teamScoreboard: this.runner.teamScoreboardUpdates$.value,
          })
        );
      }
    });
  }

  private emitConfigUpdate(config: Config) {
    this.wss.getWss().clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'config',
            config,
          })
        );
      }
    });
  }

  private emitLeaderboardUpdate(leaderboard: LeaderboardEntry[]) {
    this.wss.getWss().clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'leaderboard',
            leaderboard,
          })
        );
      }
    });
  }

  private emitKillboardUpdate(killboard: KillboardEntry[]) {
    this.wss.getWss().clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: 'killboard',
            killboard,
          })
        );
      }
    });
  }

  private newConfigRequest(req: Request, res: Response) {
    console.log('New config received..');
    let newConfig = req.body;
    this.config = new Config(
      newConfig.captains,
      newConfig.playlistThisWeek,
      newConfig.startTime,
      newConfig.blacklistMatches
    );

    this.emitConfigUpdate(this.config);

    // TODO: Push new config to clients
    this.startRunner();
    res.sendStatus(200);
  }
}
new Server(process.env.port);
