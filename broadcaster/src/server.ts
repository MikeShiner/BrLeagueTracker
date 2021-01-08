import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes';
import { Config } from './config';
import { Database } from './database';
import { Runner } from './runner';
import { WebSocketService } from './websocket.service';
import { Subscription } from 'rxjs';

export class Server {
  server: any;
  app: express.Application = express();
  config: Config = new Config();
  database = new Database();
  websocketService: WebSocketService;

  runner: Runner;
  runnerInterval: NodeJS.Timeout;
  // Whether or not to login and clear the board
  isFirstRun: boolean = true;

  teamScoreboardSub: Subscription;
  leaderboardSub: Subscription;
  killboardSub: Subscription;

  constructor(ssl: boolean) {
    this.app.use(express.json());
    this.app.use(cors());

    this.app.use('/', routes);
    this.app.get('*.*', express.static(__dirname + '/ui', { maxAge: '1y' }));
    // Server angular
    this.app.use('/', function (req: Request, res: Response) {
      res.status(200).sendFile(`/`, { root: __dirname + '/ui' });
    });

    if (ssl) {
      require('greenlock-express')
        .init({
          packageRoot: __dirname,
          configDir: './greenlock.d',

          maintainerEmail: 'jon@example.com',
          cluster: false,
        })
        .ready((glx) => {
          this.server = glx.httpsServer();
          this.websocketService = new WebSocketService(this.server);
          glx.serveApp(this.app);
        });
    } else {
      let port = process.env.port ?? 8080;
      this.server = this.app.listen(port, () => console.log('started server on port ' + port));
      this.websocketService = new WebSocketService(this.server);
    }
  }

  async startRunner() {
    if (this.runnerInterval) {
      clearInterval(this.runnerInterval);
      // Wait 4 minutes for previous loop to finish after clearing interval
      await new Promise((resolve) => setTimeout(resolve, 240000));
    }

    if (this.isFirstRun) {
      this.runner = new Runner(this.config, process.env.user, process.env.pass);
      await this.runner.login();
      this.runner.generateDefaultUpdates();

      this.teamScoreboardSub = this.runner.teamScoreboardUpdates$.subscribe((s) =>
        this.websocketService.emitTeamScoreboardUpdate(s)
      );
      this.killboardSub = this.runner.killboardUpdates$.subscribe((s) => this.websocketService.emitKillboardUpdate(s));
      this.leaderboardSub = this.runner.leaderboardUpdates$.subscribe((s) =>
        this.websocketService.emitLeaderboardUpdate(s)
      );

      this.isFirstRun = false;
    }

    await this.runner.runnerLoop();
    this.runnerInterval = setInterval(async () => await this.runner.runnerLoop(), 1 * 120000); // 2 minutes
  }

  loadNewConfig() {
    console.log('Refreshing Config', this.config);
    this.websocketService.emitConfigUpdate();
    this.startRunner();
    this.runner.setConfig(this.config);
  }

  loadDevModeDefaults() {
    this.database.createTableIfNotExists();
    this.config.updateConfig([], "BR Trio's", 11, 5, '2021-12-27T20:00Z', []);
    this.loadNewConfig();
  }
}

// export { config, runner, webSocketService };
