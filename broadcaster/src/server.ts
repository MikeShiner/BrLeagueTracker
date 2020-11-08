import express, { Request, response, Response } from 'express';
import expressWs from 'express-ws';
import { Captain, KillboardEntry, LeaderboardEntry, TeamScoreboards } from './types';
import { Runner } from './runner';
import { Subscription } from 'rxjs/internal/Subscription';
import WebSocket from 'ws';
import { Database } from './database';
import { CaptainCollection } from './types/captain.collection';

export class Config {
  startTime: Date;
  playlistThisWeek: string = "BR Trio's";
  weekNumber: number;
  numberOfGames: number = 5;
  refreshTimeSeconds: number = 120;
  captains: Captain[] = [];
  blacklistMatches: string[];

  constructor(
    captains: Captain[],
    playlistThisWeek: string,
    weekNumber: number,
    startTime?: string,
    blacklistMatches?: string[]
  ) {
    this.startTime = startTime ? new Date(startTime) : undefined;
    this.weekNumber = weekNumber;
    this.blacklistMatches = blacklistMatches;
    this.captains = captains;
    this.playlistThisWeek = playlistThisWeek;
  }
}

class Server {
  config: Config;
  runner: Runner;
  database: Database;

  teamScoreboardSub: Subscription;
  leaderboardSub: Subscription;
  killboardSub: Subscription;

  private runnerInterval;
  app;
  wss;
  constructor(port: string) {
    this.app = express();
    this.database = new Database();
    this.app.use(express.json());
    this.wss = expressWs(this.app);
    this.setupInitialValuesWsRoute();

    this.app.get('*.*', express.static(__dirname + '/ui', { maxAge: '1y' }));

    // Configuration endpoint
    this.app.post('/config', this.newConfigRequest.bind(this));
    this.app.post('/captains/register', this.registerCaptain.bind(this));

    this.app.get('/historical/:week', async (req: Request, res: Response) => {
      let week = parseInt(req.params.week);
      if (isNaN(week)) res.send(400);
      res.send(await this.database.getHistoricTournament(week));
    });

    // Server angular
    this.app.use('/', function (req: Request, res: Response) {
      res.status(200).sendFile(`/`, { root: __dirname + '/ui' });
    });

    this.app.listen(port, function () {
      console.log('BR Tracker started on port: ' + port);
    });
  }

  async startRunner() {
    if (this.runnerInterval) {
      clearInterval(this.runnerInterval);
      // Wait 10 seconds for previous loop to finish after clearing interval
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    if (this.teamScoreboardSub) this.teamScoreboardSub.unsubscribe();
    if (this.killboardSub) this.killboardSub.unsubscribe();
    if (this.leaderboardSub) this.leaderboardSub.unsubscribe();

    this.runner = new Runner(this.config, process.env.user, process.env.pass);
    this.teamScoreboardSub = this.runner.teamScoreboardUpdates$.subscribe((s) => this.emitTeamScoreboardUpdate(s));
    this.killboardSub = this.runner.killboardUpdates$.subscribe((s) => this.emitKillboardUpdate(s));
    this.leaderboardSub = this.runner.leaderboardUpdates$.subscribe((s) => this.emitLeaderboardUpdate(s));

    await this.runner.login();
    await this.runner.runnerLoop();
    this.runnerInterval = setInterval(async () => await this.runner.runnerLoop(), 1 * 120000); // 2 minutes
  }

  private newConfigRequest(req: Request, res: Response) {
    console.log('New config received..');
    let newConfig = req.body;
    this.config = new Config(
      newConfig.captains,
      newConfig.playlistThisWeek,
      newConfig.weekNumber,
      newConfig.startTime,
      newConfig.blacklistMatches
    );

    this.emitConfigUpdate(this.config);

    this.startRunner();
    res.sendStatus(200);
  }

  private async registerCaptain(req: Request, res: Response) {
    console.log('New captain registration');
    let request: CaptainCollection = req.body;
    // Check if body is correct\
    // Check if captain exists!
    try {
      await this.runner.checkCaptainExists(request.captain.activisionId);
      await this.database.InsertNewNewRegisteredCaptain(request);
      res.sendStatus(200);
    } catch (err) {
      let message = err;
      if (!!err.message) {
        message = 'Invalid Activision ID, please try again';
        console.error('Captain Registration Error: ', err.message);
        console.error(request);
      }
      res.status(400).send({ message, ex: err });
    }
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
}
new Server(process.env.port);
