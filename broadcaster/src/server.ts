import express, { Request, response, Response } from 'express';
import expressWs from 'express-ws';
import { Captain, KillboardEntry, LeaderboardEntry, TeamScoreboards } from './types';
import { Runner } from './runner';
import { Subscription } from 'rxjs/internal/Subscription';
import WebSocket from 'ws';
import { Database } from './database';
import { CaptainCollection } from './types/captain.collection';
import cors from 'cors';
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
}

class Server {
  config: Config;
  runner: Runner;
  database: Database;

  // Wheter or not to login and clear the board
  isFirstRun: boolean = true;

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
    this.app.use(cors());
    this.wss = expressWs(this.app);
    this.setupInitialValuesWsRoute();

    if (process.env.devMode) {
      this.database.createTableIfNotExists();
      this.newConfigRequest(
        {
          body: {
            startTime: '2021-01-01T20:00Z',
            playlistThisWeek: "BR Trio's",
            numberOfGames: 5,
            weekNumber: 11,
            refreshTimeSeconds: 120,
            captains: [],
            blacklistMatches: [],
          },
        } as any,
        { sendStatus: (x) => {} } as any
      );
    }

    this.app.get('*.*', express.static(__dirname + '/ui', { maxAge: '1y' }));

    // Configuration endpoint
    this.app.post('/config', this.newConfigRequest.bind(this));
    this.app.get('/captain', this.getAllCaptains.bind(this));
    this.app.post('/captain/register', this.registerCaptain.bind(this));

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

    if (this.isFirstRun) {
      this.runner = new Runner(this.config, process.env.user, process.env.pass);
      await this.runner.login();
      this.runner.generateDefaultUpdates();

      this.teamScoreboardSub = this.runner.teamScoreboardUpdates$.subscribe((s) => this.emitTeamScoreboardUpdate(s));
      this.killboardSub = this.runner.killboardUpdates$.subscribe((s) => this.emitKillboardUpdate(s));
      this.leaderboardSub = this.runner.leaderboardUpdates$.subscribe((s) => this.emitLeaderboardUpdate(s));

      this.isFirstRun = false;
    }

    await this.runner.runnerLoop();
    this.runnerInterval = setInterval(async () => await this.runner.runnerLoop(), 1 * 240000); // 4 minutes
  }

  private async registerCaptain(req: Request, res: Response) {
    console.log('New captain registration');
    if (!this.config) {
      console.log('No config found!');
      res.send(500);
      return;
    }

    let request: CaptainCollection = req.body;
    request.startTime = this.config.startTime.toISOString();
    // Check if body is correct\
    // Check if captain exists!
    try {
      await this.runner.checkCaptainExists(request.captainId);
    } catch (err) {
      res.status(400).send({ message: "Activision ID does not exist. Please sure format is '<id>#<6 digit number>'" });
      return;
    }
    try {
      await this.database.InsertNewRegisteredCaptain(request);
      res.status(200).send({ message: 'OK' });
    } catch (err) {
      let message = err;
      message = 'Invalid Activision ID, please try again';
      if (!!err.message) {
        message = 'Error submitting Captain. Please ask support.';
        console.error('Captain Registration Error: ', err.message);
        console.error(request);
      }
      res.status(400).send({ message, ex: err });
    }
  }

  private async getAllCaptains(req: Request, res: Response) {
    const allCaptains = await this.database.getRegisteredCaptains(this.config.startTime.toISOString());
    res.send(allCaptains);
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
      newConfig.weekNumber,
      newConfig.numberOfGames,
      newConfig.startTime,
      newConfig.blacklistMatches
    );

    this.emitConfigUpdate(this.config);
    this.startRunner();
    this.runner.setConfig(this.config);
    res.sendStatus(200);
  }
}
new Server(process.env.port);
