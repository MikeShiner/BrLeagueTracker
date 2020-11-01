import { ThrowStmt } from "@angular/compiler";
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import { ScoreboardComponent } from "../pages/scoreboard/scoreboard.component";
import { Config } from "./models/config";
import {
  KillboardEntry,
  LeaderboardEntry,
  TeamScoreboard,
} from "./models/server-models";

@Injectable({
  providedIn: "root",
})
export class TrackerService {
  private _leaderboard: LeaderboardEntry[] = [];
  leaderboard$: BehaviorSubject<LeaderboardEntry[]> = new BehaviorSubject([]);

  private _teamScoreboard: TeamScoreboard[];
  teamScoreboard$: BehaviorSubject<TeamScoreboard[]> = new BehaviorSubject([]);

  private _killboard: KillboardEntry[];
  killboard$: BehaviorSubject<KillboardEntry[]> = new BehaviorSubject([]);

  private _config: Config;
  get config() {
    return this._config;
  }

  private ws: WebSocket;
  constructor() {
    this.ws = new WebSocket(`ws://${environment.api}`);
    this.ws.onmessage = ({ data }) => {
      let msg = JSON.parse(data);
      console.log(msg);
      if (msg.type === "config") {
        this._config = msg.config;
      } else if (msg.type === "leaderboard") {
        console.log(msg);
        this._leaderboard = msg.leaderboard;
        this.leaderboard$.next(msg.leaderboard);
      } else if (msg.type === "teamScoreboards") {
        this._teamScoreboard = msg.teamScoreboard;
        this.teamScoreboard$.next(msg.teamScoreboard);
      } else if (msg.type === "killboard") {
        this._killboard = msg.killboard;
        this.killboard$.next(msg.killboard);
      }
    };
  }
}
