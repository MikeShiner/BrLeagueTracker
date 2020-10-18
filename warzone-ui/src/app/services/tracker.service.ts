import { ThrowStmt } from "@angular/compiler";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import { Config } from "./models/config";
import { TeamScoreboard } from "./models/server-models";

@Injectable({
  providedIn: "root",
})
export class TrackerService {
  private _leaderboard: TeamScoreboard[] = [];
  private leaderboard$: BehaviorSubject<TeamScoreboard[]> = new BehaviorSubject(
    []
  );

  private _teamScoreboard: TeamScoreboard[];
  private teamScoreboard$: BehaviorSubject<
    TeamScoreboard[]
  > = new BehaviorSubject([]);

  private _config: Config;
  get config() {
    return this._config;
  }

  private ws: WebSocket;
  constructor() {
    this.ws = new WebSocket(`ws://${environment.api}`);
    this.ws.onmessage = ({ data }) => {
      let msg = JSON.parse(data);
      if (msg.type === "config") {
        this._config = msg.config;
      }
    };
  }
}
