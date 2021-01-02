import express, { Request, response, Response } from 'express';
import expressWs from 'express-ws';
import { Captain, KillboardEntry, LeaderboardEntry, TeamScoreboards } from './types';
import { Runner } from './runner';
import { Subscription } from 'rxjs/internal/Subscription';
import WebSocket from 'ws';
import { Database } from './database';
import { CaptainCollection } from './types/captain.collection';
import cors from 'cors';
import { Config } from './config';
import https from 'https';
import http from 'http';
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
  constructor(port: number) {
    let server: http.Server | https.Server;
    this.app = express();
    this.database = new Database();
    this.app.use(express.json());
    this.app.use(cors());

    if (process.env.ssl) {
      const greenlock = require('greenlock-express')
        .init({
          packageRoot: __dirname,
          maintainerEmail: 'mike.shiner00@gmail.com',
          configDir: './greenlock.d',
          cluster: false,
        })
        // Serves on 80 and 443
        // Get's SSL certificates magically!
        .ready((glx) => {
          var httpsServer = glx.httpsServer(this.app);

          httpsServer.listen(443, '0.0.0.0', function () {
            console.info('Listening on ', httpsServer.address());
          });

          // Note:
          // You must ALSO listen on port 80 for ACME HTTP-01 Challenges
          // (the ACME and http->https middleware are loaded by glx.httpServer)
          var httpServer = glx.httpServer(this.app);

          httpServer.listen(80, '0.0.0.0', function () {
            console.info('Listening on ', httpServer.address());
          });
          this.wss = expressWs(this.app, httpsServer);
        });
    } else {
      server = http.createServer(this.app);
      this.wss = expressWs(this.app, server);
      server.listen(port, () => {
        console.log('Tracker started on port ', port);
      });
    }

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
    this.app.get('/captains', this.getAllCaptains.bind(this));
    this.app.post('/captains/register', this.registerCaptain.bind(this));
    this.app.get('/awards', this.getPlayerAwards.bind(this));

    // Server angular
    this.app.use('/', function (req: Request, res: Response) {
      res.status(200).sendFile(`/`, { root: __dirname + '/ui' });
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
      res.status(400).send({ message: 'Activision ID does not exist. Please ensure format is correct.' });
      return;
    }
    try {
      await this.database.InsertNewRegisteredCaptain(request);
      this.config.addCaptain(request.captainId, request.teamName);
      this.refreshConfig();

      res.status(200).send({ message: 'OK' });
    } catch (err) {
      let message = err;
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

  private async getPlayerAwards(req: Request, res: Response) {
    res.send(this.runner.playerAwards);
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
    // this.config = new Config(
    //   newConfig.captains,
    //   newConfig.playlistThisWeek,
    //   newConfig.weekNumber,
    //   newConfig.numberOfGames,
    //   newConfig.startTime,
    //   newConfig.blacklistMatches
    // );
    this.refreshConfig();
    res.sendStatus(200);
  }

  private refreshConfig() {
    console.log('Refreshing Config', this.config);
    this.emitConfigUpdate(this.config);
    this.startRunner();
    this.runner.setConfig(this.config);
  }
}
new Server(+process.env.port);
