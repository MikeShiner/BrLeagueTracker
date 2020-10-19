'use strict';
import express from 'express';
import { Application } from 'express';
import expressWs from 'express-ws';
import compression from 'compression';

class Server {
  private app: Application;
  private wss: expressWs.Instance;

  constructor(private port: number) {
    const _app_folder = __dirname + '/ui';
    this.app = express();
    this.wss = expressWs(this.app);
    this.app.use(compression());

    this.app.get('*.*', express.static(_app_folder, { maxAge: '1y' }));

    this.app.all('*', function (req, res) {
      res.status(200).sendFile(`/`, { root: _app_folder });
    });

    this.app.listen(port, function () {
      console.log('BR Tracker started on port: ' + port);
    });
  }
}
const server = new Server(+process.env.port);
